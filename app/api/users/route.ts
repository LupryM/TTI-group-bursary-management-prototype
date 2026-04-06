import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const db = await getReadyDb()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    const result = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] })
    const user = result.rows[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(toUserJson(user as Record<string, unknown>))
  }

  const result = await db.execute("SELECT * FROM users")
  return NextResponse.json((result.rows as Record<string, unknown>[]).map(toUserJson))
}

// Student signup — creates a new student account. Funders/admins are
// provisioned internally and cannot self-register.
export async function POST(request: Request) {
  const db = await getReadyDb()
  const body = await request.json()

  const firstName = String(body.firstName || "").trim()
  const lastName = String(body.lastName || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const phone = String(body.phone || "").trim()
  const institution = String(body.institution || "").trim()
  const programme = String(body.programme || "").trim()
  const year = String(body.year || "").trim()
  const studentNo = String(body.studentNo || "").trim()
  const idNumber = String(body.idNumber || "").trim()

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
  const existingResult = await db.execute({ sql: "SELECT id FROM users WHERE LOWER(email) = ?", args: [email] })
  if (existingResult.rows.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
  }

  // Generate student id from the next available slot so ids stay stable even
  // if older accounts are removed.
  const maxRowResult = await db.execute(
    "SELECT COALESCE(MAX(CAST(SUBSTR(id, 9) AS INTEGER)), 0) as m FROM users WHERE id LIKE 'student-%'"
  )
  const maxRow = Number((maxRowResult.rows[0] as Record<string, unknown>).m)
  const id = `student-${maxRow + 1}`
  const refNo = `TTI-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`

  await db.execute({
    sql: `INSERT INTO users (id, name, email, role, student_no, ref_no, institution, programme, year, status, id_number)
          VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, 'Pending', ?)`,
    args: [id, `${firstName} ${lastName}`, email, studentNo || null, refNo, institution, programme, year, idNumber || null],
  })

  // Phone is not on users, but if we ever store it we'd do it here.
  void phone

  // Identity linkage: claim any guest application submitted with this SA ID
  // so the student's dashboard picks it up immediately after signup.
  if (idNumber) {
    await db.execute({
      sql: "UPDATE applications SET owner_id = ? WHERE id_number = ? AND (owner_id IS NULL OR owner_id = '')",
      args: [id, idNumber],
    })
  }

  const userResult = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] })
  return NextResponse.json(toUserJson(userResult.rows[0] as Record<string, unknown>), { status: 201 })
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
    idNumber: row.id_number ?? undefined,
    company: row.company ?? undefined,
    bbbeeLevel: row.bbbee_level ?? undefined,
    totalBudget: row.total_budget ?? undefined,
    department: row.department ?? undefined,
  }
}
