import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"

/**
 * DEBUG ENDPOINT ONLY - Do not use in production
 * Returns all users and recent student signups
 */
export async function GET() {
  const db = await getReadyDb()

  try {
    const allUsersResult = await db.execute(`
      SELECT id, name, email, role, status
      FROM users
      ORDER BY role, id DESC
    `)

    const studentsResult = await db.execute(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.status,
        COUNT(a.id) as app_count,
        (SELECT GROUP_CONCAT(ref_number) FROM applications WHERE owner_id = u.id) as app_refs
      FROM users u
      LEFT JOIN applications a ON u.id = a.owner_id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.id DESC
    `)

    return NextResponse.json({
      all_users: allUsersResult.rows,
      students: studentsResult.rows,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
