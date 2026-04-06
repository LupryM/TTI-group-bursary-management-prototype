import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const db = await getReadyDb()
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")

  const result = studentId
    ? await db.execute({ sql: "SELECT * FROM workshops WHERE student_id = ? ORDER BY id", args: [studentId] })
    : await db.execute("SELECT * FROM workshops ORDER BY id")

  const rows = result.rows as Record<string, unknown>[]

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      status: row.status,
      facilitator: row.facilitator,
      duration: row.duration,
    }))
  )
}
