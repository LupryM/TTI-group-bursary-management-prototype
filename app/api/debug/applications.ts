import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"

/**
 * DEBUG ENDPOINT ONLY - Do not use in production
 * Returns all applications with their owner details for troubleshooting
 */
export async function GET() {
  const db = await getReadyDb()

  try {
    const appsResult = await db.execute(`
      SELECT
        a.id,
        a.student_name,
        a.status,
        a.owner_id,
        a.ref_number,
        a.submitted_date,
        u.name as owner_name,
        u.email as owner_email
      FROM applications a
      LEFT JOIN users u ON a.owner_id = u.id
      ORDER BY a.rowid DESC
    `)

    const statsResult = await db.execute(`
      SELECT
        COUNT(*) as total_apps,
        COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as unlinked_apps,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted_apps,
        COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review_apps,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_apps
      FROM applications
    `)

    return NextResponse.json({
      applications: appsResult.rows,
      stats: statsResult.rows[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
