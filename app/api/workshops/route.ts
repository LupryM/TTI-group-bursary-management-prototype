import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")

  let rows: Record<string, unknown>[]
  if (studentId) {
    rows = db.prepare("SELECT * FROM workshops WHERE student_id = ? ORDER BY id").all(studentId) as Record<string, unknown>[]
  } else {
    rows = db.prepare("SELECT * FROM workshops ORDER BY id").all() as Record<string, unknown>[]
  }

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
