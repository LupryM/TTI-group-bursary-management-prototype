import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const funderId = searchParams.get("funderId")

  let rows: Record<string, unknown>[]
  if (funderId) {
    rows = db.prepare("SELECT * FROM funder_students WHERE funder_id = ?").all(funderId) as Record<string, unknown>[]
  } else {
    rows = db.prepare("SELECT * FROM funder_students").all() as Record<string, unknown>[]
  }

  const result = rows.map((row) => {
    const modules = db
      .prepare("SELECT name, complete FROM student_modules WHERE funder_student_id = ? ORDER BY id")
      .all(row.id as string) as { name: string; complete: number }[]

    return {
      id: row.id,
      name: row.name,
      studentNo: row.student_no,
      institution: row.institution,
      programme: row.programme,
      year: row.year,
      amount: row.amount,
      disbursed: row.disbursed,
      status: row.status,
      academicAvg: row.academic_avg,
      modules: modules.map((m) => ({ name: m.name, complete: m.complete === 1 })),
    }
  })

  return NextResponse.json(result)
}
