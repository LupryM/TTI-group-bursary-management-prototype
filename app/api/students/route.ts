import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const db = await getReadyDb()
  const { searchParams } = new URL(request.url)
  const funderId = searchParams.get("funderId")

  const rowsResult = funderId
    ? await db.execute({ sql: "SELECT * FROM funder_students WHERE funder_id = ?", args: [funderId] })
    : await db.execute("SELECT * FROM funder_students")

  const rows = rowsResult.rows as Record<string, unknown>[]

  const result = await Promise.all(
    rows.map(async (row) => {
      const modulesResult = await db.execute({
        sql: "SELECT name, complete FROM student_modules WHERE funder_student_id = ? ORDER BY id",
        args: [row.id as string],
      })
      const modules = modulesResult.rows as unknown as { name: string; complete: number }[]

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
  )

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const db = await getReadyDb()
  const body = await request.json()
  const { studentId, moduleName, complete } = body

  if (!studentId || !moduleName || typeof complete !== "boolean") {
    return NextResponse.json({ error: "studentId, moduleName, and complete (boolean) are required" }, { status: 400 })
  }

  const result = await db.execute({
    sql: "UPDATE student_modules SET complete = ? WHERE funder_student_id = ? AND name = ?",
    args: [complete ? 1 : 0, studentId, moduleName],
  })

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
