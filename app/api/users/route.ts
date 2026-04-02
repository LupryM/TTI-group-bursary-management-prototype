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
