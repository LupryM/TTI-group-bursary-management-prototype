import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { REQUIRED_DOC_COUNT } from "@/lib/documents"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")

  // When ownerId is provided, return only that student's application(s).
  const rows = ownerId
    ? (db.prepare("SELECT * FROM applications WHERE owner_id = ? ORDER BY rowid").all(ownerId) as Record<string, unknown>[])
    : (db.prepare("SELECT * FROM applications ORDER BY rowid").all() as Record<string, unknown>[])

  // Compute docsComplete dynamically from student_documents joined by owner_id,
  // so admin always sees real upload state rather than a stale boolean.
  const countStmt = db.prepare(
    "SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?"
  )
  return NextResponse.json(
    rows.map((row) => {
      const rowOwnerId = (row.owner_id as string | null) ?? ""
      const uploadedCount = rowOwnerId
        ? (countStmt.get(rowOwnerId) as { c: number }).c
        : (row.docs_complete === 1 ? REQUIRED_DOC_COUNT : 0)
      return toAppJson(row, uploadedCount)
    })
  )
}

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json()

  // Use max rowid so deletions don't cause ID reuse
  const maxRow = db.prepare("SELECT COALESCE(MAX(rowid), 0) as m FROM applications").get() as { m: number }
  const appId = `app-${String(maxRow.m + 1).padStart(4, "0")}`

  // Generate a unique 6-digit ref number, retry until no collision
  let refNumber = ""
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `TTI-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`
    const exists = db.prepare("SELECT id FROM applications WHERE ref_number = ?").get(candidate)
    if (!exists) { refNumber = candidate; break }
  }
  if (!refNumber) refNumber = `TTI-${new Date().getFullYear()}-${Date.now()}`
  const submittedDate = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })

  const ownerId: string | null = body.ownerId || null
  // Count docs already uploaded under this ownerId (via the documents API
  // during form completion) so docs_complete reflects reality on submission.
  let docsComplete = 0
  if (ownerId) {
    const c = (
      db.prepare("SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?").get(ownerId) as { c: number }
    ).c
    docsComplete = c >= REQUIRED_DOC_COUNT ? 1 : 0
  }

  const stmt = db.prepare(`
    INSERT INTO applications (id, student_name, student_no, institution, programme, year, funder, amount, status, submitted_date, id_verified, docs_complete, academic_avg, id_number, email, phone, annual_income, need_statement, ref_number, owner_id)
    VALUES (@id, @student_name, @student_no, @institution, @programme, @year, @funder, @amount, @status, @submitted_date, @id_verified, @docs_complete, @academic_avg, @id_number, @email, @phone, @annual_income, @need_statement, @ref_number, @owner_id)
  `)

  stmt.run({
    id: appId,
    student_name: `${body.firstName} ${body.lastName}`,
    student_no: body.studentNumber || "",
    institution: body.university,
    programme: body.programme,
    year: body.year,
    funder: "Unassigned",
    amount: 0,
    status: "Pending",
    submitted_date: submittedDate,
    id_verified: 0,
    docs_complete: docsComplete,
    academic_avg: 0,
    id_number: body.idNumber || null,
    email: body.email || null,
    phone: body.phone || null,
    annual_income: body.annualIncome || null,
    need_statement: body.needStatement || null,
    ref_number: refNumber,
    owner_id: ownerId,
  })

  return NextResponse.json({ id: appId, refNumber, submittedDate }, { status: 201 })
}

export async function PATCH(request: Request) {
  const db = getDb()
  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 })
  }

  const changedAt = new Date().toISOString()
  const changedBy = body.changedBy || "admin"
  const auditLog = db.prepare(
    "INSERT INTO application_audit (application_id, changed_at, changed_by, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)"
  )

  const current = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown>
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Handle funder/amount assignment separately
  if (body.funder !== undefined || body.amount !== undefined) {
    if (body.funder !== undefined) {
      auditLog.run(id, changedAt, changedBy, "funder", String(current.funder ?? ""), String(body.funder))
      db.prepare("UPDATE applications SET funder = ? WHERE id = ?").run(String(body.funder), id)
    }
    if (body.amount !== undefined) {
      const amt = parseFloat(String(body.amount))
      if (isNaN(amt) || amt < 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      auditLog.run(id, changedAt, changedBy, "amount", String(current.amount ?? 0), String(amt))
      db.prepare("UPDATE applications SET amount = ? WHERE id = ?").run(amt, id)
    }
    const updated = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown>
    return NextResponse.json(toAppJson(updated))
  }

  const valid = ["Approved", "Pending", "Under Review", "Rejected"]
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  auditLog.run(id, changedAt, changedBy, "status", String(current.status ?? ""), status)
  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, id)
  const updated = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown>
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // ── Side-effects when transitioning TO Approved ───────────────────────────
  if (status === "Approved" && current.status !== "Approved") {
    provisionApprovedStudent(db, current)
  }

  return NextResponse.json(toAppJson(updated))
}

const DEFAULT_MODULES = [
  "Orientation",
  "Financial Literacy",
  "CV Writing",
  "Workplace Readiness",
  "Entrepreneurship",
]

function getUpcomingDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
}

function provisionApprovedStudent(db: ReturnType<typeof getDb>, app: Record<string, unknown>) {
  const funderName = app.funder as string
  const funder = db.prepare("SELECT id FROM funders WHERE name = ?").get(funderName) as { id: string } | undefined
  if (!funder) return

  // Idempotent: skip if a funder_students record already exists for this student + funder
  const existing = db
    .prepare("SELECT id FROM funder_students WHERE student_no = ? AND funder_id = ?")
    .get(app.student_no, funder.id)
  if (existing) return

  const fsId = `fs-${Date.now()}`
  db.prepare(`
    INSERT INTO funder_students (id, name, student_no, institution, programme, year, amount, disbursed, status, academic_avg, funder_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Approved', ?, ?)
  `).run(
    fsId,
    app.student_name,
    app.student_no,
    app.institution,
    app.programme,
    app.year,
    app.amount ?? 0,
    app.academic_avg ?? 0,
    funder.id,
  )

  const insertModule = db.prepare(
    "INSERT INTO student_modules (funder_student_id, name, complete) VALUES (?, ?, 0)"
  )
  for (const name of DEFAULT_MODULES) {
    insertModule.run(fsId, name)
  }

  // Generate upcoming workshops if the student has none yet
  const ownerId = app.owner_id as string | null
  if (ownerId) {
    const wsCount = (
      db.prepare("SELECT COUNT(*) as c FROM workshops WHERE student_id = ?").get(ownerId) as { c: number }
    ).c
    if (wsCount === 0) {
      const defaultWorkshops = [
        { title: "Orientation & Programme Overview", days: 7, facilitator: "T. Nkosi", duration: "2 hrs" },
        { title: "Financial Literacy & Budgeting", days: 21, facilitator: "T. Nkosi", duration: "3 hrs" },
        { title: "CV Writing & Professional Branding", days: 35, facilitator: "M. van Wyk", duration: "2 hrs" },
        { title: "Workplace Readiness & Ethics", days: 49, facilitator: "S. Dlamini", duration: "4 hrs" },
      ]
      const insertWS = db.prepare(
        "INSERT INTO workshops (title, date, status, facilitator, duration, student_id) VALUES (?, ?, 'Upcoming', ?, ?, ?)"
      )
      for (const ws of defaultWorkshops) {
        insertWS.run(ws.title, getUpcomingDate(ws.days), ws.facilitator, ws.duration, ownerId)
      }
    }
  }
}

function toAppJson(row: Record<string, unknown>, uploadedCount?: number) {
  const uploaded = uploadedCount ?? (row.docs_complete === 1 ? REQUIRED_DOC_COUNT : 0)
  return {
    id: row.id,
    studentName: row.student_name,
    studentNo: row.student_no,
    institution: row.institution,
    programme: row.programme,
    year: row.year,
    funder: row.funder,
    amount: row.amount,
    status: row.status,
    submittedDate: row.submitted_date,
    idVerified: row.id_verified === 1,
    docsComplete: uploaded >= REQUIRED_DOC_COUNT,
    docsUploadedCount: uploaded,
    docsRequiredCount: REQUIRED_DOC_COUNT,
    academicAvg: row.academic_avg,
    refNumber: row.ref_number ?? undefined,
    ownerId: row.owner_id ?? undefined,
  }
}
