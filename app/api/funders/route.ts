import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const db = await getReadyDb()
  const result = await db.execute("SELECT * FROM funders ORDER BY rowid")
  return NextResponse.json(result.rows)
}
