import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { REQUIRED_DOC_KEYS } from "@/lib/documents"

export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")

  if (!ownerId) {
    return NextResponse.json({ error: "ownerId is required" }, { status: 400 })
  }

  const rows = db
    .prepare("SELECT doc_type, file_name, uploaded_at FROM student_documents WHERE student_id = ?")
    .all(ownerId) as { doc_type: string; file_name: string; uploaded_at: string }[]

  const docs: Record<string, { fileName: string; uploadedAt: string } | null> = {}
  for (const key of REQUIRED_DOC_KEYS) docs[key] = null
  for (const r of rows) {
    docs[r.doc_type] = { fileName: r.file_name, uploadedAt: r.uploaded_at }
  }

  return NextResponse.json({ ownerId, docs })
}

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json()
  const { ownerId, docType, fileName } = body

  if (!ownerId || !docType || !fileName) {
    return NextResponse.json({ error: "ownerId, docType and fileName are required" }, { status: 400 })
  }
  if (!REQUIRED_DOC_KEYS.includes(docType)) {
    return NextResponse.json({ error: "Invalid docType" }, { status: 400 })
  }

  const uploadedAt = new Date().toISOString()
  // Upsert: same student + docType replaces the previous upload
  db.prepare(
    `INSERT INTO student_documents (student_id, doc_type, file_name, uploaded_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(student_id, doc_type) DO UPDATE SET file_name = excluded.file_name, uploaded_at = excluded.uploaded_at`
  ).run(ownerId, docType, fileName, uploadedAt)

  // Cascade: if this owner has submitted applications, refresh their
  // docs_complete flag so the admin view stays accurate.
  const count = (
    db.prepare("SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?").get(ownerId) as { c: number }
  ).c
  const complete = count >= REQUIRED_DOC_KEYS.length ? 1 : 0
  db.prepare("UPDATE applications SET docs_complete = ? WHERE owner_id = ?").run(complete, ownerId)

  return NextResponse.json({ ok: true, docType, fileName, uploadedAt })
}

export async function DELETE(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")
  const docType = searchParams.get("docType")

  if (!ownerId || !docType) {
    return NextResponse.json({ error: "ownerId and docType are required" }, { status: 400 })
  }

  db.prepare("DELETE FROM student_documents WHERE student_id = ? AND doc_type = ?").run(ownerId, docType)

  const count = (
    db.prepare("SELECT COUNT(*) as c FROM student_documents WHERE student_id = ?").get(ownerId) as { c: number }
  ).c
  const complete = count >= REQUIRED_DOC_KEYS.length ? 1 : 0
  db.prepare("UPDATE applications SET docs_complete = ? WHERE owner_id = ?").run(complete, ownerId)

  return NextResponse.json({ ok: true })
}
