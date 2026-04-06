import { NextResponse } from "next/server"
import { getReadyDb } from "@/lib/db"
import { REQUIRED_DOC_KEYS } from "@/lib/documents"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const db = await getReadyDb()
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")

  if (!ownerId) {
    return NextResponse.json({ error: "ownerId is required" }, { status: 400 })
  }

  const result = await db.execute({
    sql: "SELECT doc_type, file_name, uploaded_at, comment FROM student_documents WHERE student_id = ?",
    args: [ownerId],
  })
  const rows = result.rows as unknown as { doc_type: string; file_name: string; uploaded_at: string; comment: string }[]

  const docs: Record<string, { fileName: string; uploadedAt: string; comment: string } | null> = {}
  for (const key of REQUIRED_DOC_KEYS) docs[key] = null
  for (const r of rows) {
    docs[r.doc_type] = { fileName: r.file_name, uploadedAt: r.uploaded_at, comment: r.comment }
  }

  return NextResponse.json({ ownerId, docs })
}

export async function POST(request: Request) {
  const db = await getReadyDb()
  const body = await request.json()
  const { ownerId, docType, fileName, comment } = body

  if (!ownerId || !docType || !fileName) {
    return NextResponse.json({ error: "ownerId, docType and fileName are required" }, { status: 400 })
  }
  if (!REQUIRED_DOC_KEYS.includes(docType)) {
    return NextResponse.json({ error: "Invalid docType" }, { status: 400 })
  }

  const uploadedAt = new Date().toISOString()
  // Upsert: same student + docType replaces the previous upload
  await db.execute({
    sql: `INSERT INTO student_documents (student_id, doc_type, file_name, uploaded_at, comment)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(student_id, doc_type) DO UPDATE SET file_name = excluded.file_name, uploaded_at = excluded.uploaded_at, comment = excluded.comment`,
    args: [ownerId, docType, fileName, uploadedAt, comment || null],
  })

  // Cascade: if this owner has submitted applications, refresh their
  // docs_complete flag so the admin view stays accurate.
  const countResult = await db.execute({
    sql: "SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?",
    args: [ownerId],
  })
  const count = Number((countResult.rows[0] as Record<string, unknown>).c)
  const complete = count >= REQUIRED_DOC_KEYS.length ? 1 : 0
  await db.execute({
    sql: "UPDATE applications SET docs_complete = ? WHERE owner_id = ?",
    args: [complete, ownerId],
  })

  return NextResponse.json({ ok: true, docType, fileName, uploadedAt })
}

export async function DELETE(request: Request) {
  const db = await getReadyDb()
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")
  const docType = searchParams.get("docType")

  if (!ownerId || !docType) {
    return NextResponse.json({ error: "ownerId and docType are required" }, { status: 400 })
  }

  await db.execute({
    sql: "DELETE FROM student_documents WHERE student_id = ? AND doc_type = ?",
    args: [ownerId, docType],
  })

  const countResult = await db.execute({
    sql: "SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?",
    args: [ownerId],
  })
  const count = Number((countResult.rows[0] as Record<string, unknown>).c)
  const complete = count >= REQUIRED_DOC_KEYS.length ? 1 : 0
  await db.execute({
    sql: "UPDATE applications SET docs_complete = ? WHERE owner_id = ?",
    args: [complete, ownerId],
  })

  return NextResponse.json({ ok: true })
}
