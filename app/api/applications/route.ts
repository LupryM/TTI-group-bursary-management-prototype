import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"
import { REQUIRED_DOC_COUNT } from "@/lib/documents"
import type { Client } from "@libsql/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const db = await getReadyDb()
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")

  const rowsResult = ownerId
    ? await db.execute({ sql: "SELECT * FROM applications WHERE owner_id = ? ORDER BY rowid", args: [ownerId] })
    : await db.execute("SELECT * FROM applications ORDER BY rowid")

  const rows = rowsResult.rows as Record<string, unknown>[]

  const results = await Promise.all(
    rows.map(async (row) => {
      const rowOwnerId = (row.owner_id as string | null) ?? ""
      let uploadedCount: number
      if (rowOwnerId) {
        const countResult = await db.execute({
          sql: "SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?",
          args: [rowOwnerId],
        })
        uploadedCount = Number((countResult.rows[0] as Record<string, unknown>).c)
      } else {
        uploadedCount = row.docs_complete === 1 ? REQUIRED_DOC_COUNT : 0
      }
      return toAppJson(row, uploadedCount)
    })
  )

  return NextResponse.json(results)
}

export async function POST(request: Request) {
  const db = await getReadyDb()
  const body = await request.json()

  const maxRowResult = await db.execute("SELECT COALESCE(MAX(rowid), 0) as m FROM applications")
  const maxRow = Number((maxRowResult.rows[0] as Record<string, unknown>).m)
  const appId = `app-${String(maxRow + 1).padStart(4, "0")}`

  let refNumber = ""
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `TTI-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`
    const existsResult = await db.execute({
      sql: "SELECT id FROM applications WHERE ref_number = ?",
      args: [candidate],
    })
    if (existsResult.rows.length === 0) { refNumber = candidate; break }
  }
  if (!refNumber) refNumber = `TTI-${new Date().getFullYear()}-${Date.now()}`
  const submittedDate = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })

  const ownerId: string | null = body.ownerId || null
  let docsComplete = 0
  if (ownerId) {
    const countResult = await db.execute({
      sql: "SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?",
      args: [ownerId],
    })
    const c = Number((countResult.rows[0] as Record<string, unknown>).c)
    docsComplete = c >= REQUIRED_DOC_COUNT ? 1 : 0
  }

  await db.execute({
    sql: `INSERT INTO applications (id, student_name, student_no, institution, programme, year, funder, amount, status, submitted_date, id_verified, docs_complete, academic_avg, id_number, email, phone, annual_income, need_statement, ref_number, owner_id)
          VALUES (@id, @student_name, @student_no, @institution, @programme, @year, @funder, @amount, @status, @submitted_date, @id_verified, @docs_complete, @academic_avg, @id_number, @email, @phone, @annual_income, @need_statement, @ref_number, @owner_id)`,
    args: {
      id: appId,
      student_name: `${body.firstName} ${body.lastName}`,
      student_no: body.studentNumber || "",
      institution: body.university,
      programme: body.programme,
      year: body.year,
      funder: "Unassigned",
      amount: 0,
      status: "Submitted",
      submitted_date: submittedDate,
      id_verified: 0,
      docs_complete: docsComplete,
      academic_avg: parseFloat(body.academicAvg) || 0,
      id_number: body.idNumber || null,
      email: body.email || null,
      phone: body.phone || null,
      annual_income: body.annualIncome || null,
      need_statement: body.needStatement || null,
      ref_number: refNumber,
      owner_id: ownerId,
    },
  })

  return NextResponse.json({ id: appId, refNumber, submittedDate }, { status: 201 })
}

export async function PATCH(request: Request) {
  const db = await getReadyDb()
  const body = await request.json()
  const { id, status } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  // status is only required for status-change requests, not funder/amount/verification updates
  if (!status && body.funder === undefined && body.amount === undefined && body.id_verified === undefined && body.docs_complete === undefined) {
    return NextResponse.json({ error: "Provide status, funder, amount, or verification fields" }, { status: 400 })
  }

  const changedAt = new Date().toISOString()
  const changedBy = body.changedBy || "admin"

  const currentResult = await db.execute({ sql: "SELECT * FROM applications WHERE id = ?", args: [id] })
  const current = currentResult.rows[0] as Record<string, unknown> | undefined
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const auditSql = "INSERT INTO application_audit (application_id, changed_at, changed_by, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)"

  // Handle verification field updates
  if (body.id_verified !== undefined || body.docs_complete !== undefined) {
    if (body.id_verified !== undefined) {
      const val = body.id_verified ? 1 : 0
      await db.execute({ sql: auditSql, args: [id, changedAt, changedBy, "id_verified", String(current.id_verified ?? 0), String(val)] })
      await db.execute({ sql: "UPDATE applications SET id_verified = ? WHERE id = ?", args: [val, id] })
    }
    if (body.docs_complete !== undefined) {
      const val = body.docs_complete ? 1 : 0
      await db.execute({ sql: auditSql, args: [id, changedAt, changedBy, "docs_complete", String(current.docs_complete ?? 0), String(val)] })
      await db.execute({ sql: "UPDATE applications SET docs_complete = ? WHERE id = ?", args: [val, id] })
    }
    const updatedResult = await db.execute({ sql: "SELECT * FROM applications WHERE id = ?", args: [id] })
    return NextResponse.json(toAppJson(updatedResult.rows[0] as Record<string, unknown>))
  }

  // Handle funder/amount assignment separately
  if (body.funder !== undefined || body.amount !== undefined) {
    if (body.funder !== undefined) {
      await db.execute({ sql: auditSql, args: [id, changedAt, changedBy, "funder", String(current.funder ?? ""), String(body.funder)] })
      await db.execute({ sql: "UPDATE applications SET funder = ? WHERE id = ?", args: [String(body.funder), id] })
    }
    if (body.amount !== undefined) {
      const amt = parseFloat(String(body.amount))
      if (isNaN(amt) || amt < 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      await db.execute({ sql: auditSql, args: [id, changedAt, changedBy, "amount", String(current.amount ?? 0), String(amt)] })
      await db.execute({ sql: "UPDATE applications SET amount = ? WHERE id = ?", args: [amt, id] })
    }
    const updatedResult = await db.execute({ sql: "SELECT * FROM applications WHERE id = ?", args: [id] })
    return NextResponse.json(toAppJson(updatedResult.rows[0] as Record<string, unknown>))
  }

  const valid = ["Approved", "Submitted", "Under Review", "Rejected"]
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  await db.execute({ sql: auditSql, args: [id, changedAt, changedBy, "status", String(current.status ?? ""), status] })
  await db.execute({ sql: "UPDATE applications SET status = ? WHERE id = ?", args: [status, id] })

  const updatedResult = await db.execute({ sql: "SELECT * FROM applications WHERE id = ?", args: [id] })
  const updated = updatedResult.rows[0] as Record<string, unknown> | undefined
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // ── Side-effects when transitioning TO Approved ───────────────────────────
  let provisioningError: string | undefined
  if (status === "Approved" && current.status !== "Approved") {
    try {
      await provisionApprovedStudent(db, current)
    } catch (err) {
      console.error("provisionApprovedStudent failed:", err)
      provisioningError = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json({ ...toAppJson(updated), provisioningError })
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

async function provisionApprovedStudent(db: Client, app: Record<string, unknown>) {
  const funderName = app.funder as string
  const funderResult = await db.execute({ sql: "SELECT id FROM funders WHERE name = ?", args: [funderName] })
  const funder = funderResult.rows[0] as unknown as { id: string } | undefined
  // Use the funder's id if found, otherwise null (funder not yet assigned or unrecognised)
  const funderId: string | null = funder?.id ?? null

  // Idempotent: skip if a funder_students record already exists
  // We check name and programme because student_no might be empty ("") during testing
  const existingResult = await db.execute({
    sql: "SELECT id FROM funder_students WHERE name = ? AND programme = ?",
    args: [app.student_name as string, app.programme as string],
  })
  if (existingResult.rows.length > 0) return

  const fsId = `fs-${Date.now()}`
  await db.execute({
    sql: `INSERT INTO funder_students (id, name, student_no, institution, programme, year, amount, disbursed, status, academic_avg, funder_id, owner_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Approved', ?, ?, ?)`,
    args: [
      fsId,
      app.student_name as string,
      app.student_no as string,
      app.institution as string,
      app.programme as string,
      app.year as string,
      (app.amount ?? 0) as number,
      (app.academic_avg ?? 0) as number,
      funderId,
      (app.owner_id as string | null) ?? null,
    ],
  })

  await db.batch(
    DEFAULT_MODULES.map((name) => ({
      sql: "INSERT INTO student_modules (funder_student_id, name, complete) VALUES (?, ?, 0)",
      args: [fsId, name],
    })),
    "write"
  )

  // Generate upcoming workshops if the student has none yet
  const ownerId = app.owner_id as string | null
  if (ownerId) {
    const wsCountResult = await db.execute({
      sql: "SELECT COUNT(*) as c FROM workshops WHERE student_id = ?",
      args: [ownerId],
    })
    const wsCount = Number((wsCountResult.rows[0] as Record<string, unknown>).c)
    if (wsCount === 0) {
      const defaultWorkshops = [
        { title: "Orientation & Programme Overview", days: 7, facilitator: "T. Nkosi", duration: "2 hrs" },
        { title: "Financial Literacy & Budgeting", days: 21, facilitator: "T. Nkosi", duration: "3 hrs" },
        { title: "CV Writing & Professional Branding", days: 35, facilitator: "M. van Wyk", duration: "2 hrs" },
        { title: "Workplace Readiness & Ethics", days: 49, facilitator: "S. Dlamini", duration: "4 hrs" },
      ]
      await db.batch(
        defaultWorkshops.map((ws) => ({
          sql: "INSERT INTO workshops (title, date, status, facilitator, duration, student_id) VALUES (?, ?, 'Upcoming', ?, ?, ?)",
          args: [ws.title, getUpcomingDate(ws.days), ws.facilitator, ws.duration, ownerId],
        })),
        "write"
      )
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
    annualIncome: (row.annual_income as string | null) ?? undefined,
    needStatement: (row.need_statement as string | null) ?? undefined,
    refNumber: row.ref_number ?? undefined,
    ownerId: row.owner_id ?? undefined,
  }
}
