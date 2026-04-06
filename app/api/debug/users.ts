import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

/**
 * DEBUG ENDPOINT ONLY - Do not use in production
 * Returns all users and recent student signups
 */
export function GET() {
  const db = getDb()

  try {
    const allUsers = db.prepare(`
      SELECT id, name, email, role, status
      FROM users
      ORDER BY role, id DESC
    `).all() as unknown[]

    const students = db.prepare(`
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
    `).all() as unknown[]

    return NextResponse.json({ all_users: allUsers, students, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
