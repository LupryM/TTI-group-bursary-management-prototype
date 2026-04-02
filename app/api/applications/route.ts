import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export function GET() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM applications ORDER BY rowid").all() as Record<string, unknown>[]
  return NextResponse.json(rows.map(toAppJson))
}

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json()

  const appId = `app-${String((db.prepare("SELECT COUNT(*) as c FROM applications").get() as { c: number }).c + 1).padStart(3, "0")}`
  const refNumber = `TTI-2026-${Math.floor(1000 + Math.random() * 9000)}`
  const submittedDate = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })

  const stmt = db.prepare(`
    INSERT INTO applications (id, student_name, student_no, institution, programme, year, funder, amount, status, submitted_date, id_verified, docs_complete, academic_avg, id_number, email, phone, annual_income, need_statement, ref_number)
    VALUES (@id, @student_name, @student_no, @institution, @programme, @year, @funder, @amount, @status, @submitted_date, @id_verified, @docs_complete, @academic_avg, @id_number, @email, @phone, @annual_income, @need_statement, @ref_number)
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
    docs_complete: 0,
    academic_avg: 0,
    id_number: body.idNumber || null,
    email: body.email || null,
    phone: body.phone || null,
    annual_income: body.annualIncome || null,
    need_statement: body.needStatement || null,
    ref_number: refNumber,
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

  const valid = ["Approved", "Pending", "Under Review", "Rejected"]
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, id)
  const updated = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown>
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(toAppJson(updated))
}

function toAppJson(row: Record<string, unknown>) {
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
    docsComplete: row.docs_complete === 1,
    academicAvg: row.academic_avg,
    refNumber: row.ref_number ?? undefined,
  }
}
