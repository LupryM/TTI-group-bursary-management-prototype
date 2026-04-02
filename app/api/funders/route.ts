import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export function GET() {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM funders ORDER BY rowid").all() as Record<string, unknown>[]
  return NextResponse.json(rows)
}
