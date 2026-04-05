import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(toUserJson(user as Record<string, unknown>))
  }

  const users = db.prepare("SELECT * FROM users").all() as Record<string, unknown>[]
  return NextResponse.json(users.map(toUserJson))
}

// Student signup — creates a new student account. Funders/admins are
// provisioned internally and cannot self-register.
export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json()

  const firstName = String(body.firstName || "").trim()
  const lastName = String(body.lastName || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const phone = String(body.phone || "").trim()
  const institution = String(body.institution || "").trim()
  const programme = String(body.programme || "").trim()
  const year = String(body.year || "").trim()
  const studentNo = String(body.studentNo || "").trim()

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
  }
  if (!institution || !programme || !year) {
    return NextResponse.json({ error: "Institution, programme and year are required." }, { status: 400 })
  }

  // Email must be unique
  const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email)
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
  }

  // Generate student id from the next available slot so ids stay stable even
  // if older accounts are removed.
  const maxRow = db.prepare(
    "SELECT COALESCE(MAX(CAST(SUBSTR(id, 9) AS INTEGER)), 0) as m FROM users WHERE id LIKE 'student-%'"
  ).get() as { m: number }
  const id = `student-${maxRow.m + 1}`
  const refNo = `TTI-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`

  db.prepare(`
    INSERT INTO users (id, name, email, role, student_no, ref_no, institution, programme, year, status)
    VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, 'Pending')
  `).run(id, `${firstName} ${lastName}`, email, studentNo || null, refNo, institution, programme, year)

  // Phone is not on users, but if we ever store it we'd do it here. For now
  // the signup form captures it so the student can reuse it when applying.
  void phone

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown>
  return NextResponse.json(toUserJson(user), { status: 201 })
}

function toUserJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar ?? undefined,
    studentNo: row.student_no ?? undefined,
    refNo: row.ref_no ?? undefined,
    institution: row.institution ?? undefined,
    programme: row.programme ?? undefined,
    year: row.year ?? undefined,
    funderName: row.funder_name ?? undefined,
    bursaryAmount: row.bursary_amount ?? undefined,
    status: row.status ?? undefined,
    company: row.company ?? undefined,
    bbbeeLevel: row.bbbee_level ?? undefined,
    totalBudget: row.total_budget ?? undefined,
    department: row.department ?? undefined,
  }
}
