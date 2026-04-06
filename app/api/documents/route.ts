import { NextResponse } from "next/server"
import { MOCK_DOCUMENTS, MOCK_APPLICATIONS } from "@/lib/mock-data"
import { REQUIRED_DOC_KEYS } from "@/lib/documents"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")

  if (!ownerId) {
    return NextResponse.json({ error: "ownerId is required" }, { status: 400 })
  }

  const rows = MOCK_DOCUMENTS[ownerId] || []
  const docs: Record<string, { fileName: string; uploadedAt: string } | null> = {}
  for (const key of REQUIRED_DOC_KEYS) docs[key] = null
  for (const r of rows) {
    docs[r.docType] = { fileName: r.fileName, uploadedAt: r.uploadedAt }
  }

  return NextResponse.json({ ownerId, docs })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { ownerId, docType, fileName } = body

  if (!ownerId || !docType || !fileName) {
    return NextResponse.json({ error: "ownerId, docType and fileName are required" }, { status: 400 })
  }

  const uploadedAt = new Date().toISOString()
  if (!MOCK_DOCUMENTS[ownerId]) MOCK_DOCUMENTS[ownerId] = []
  
  const existingIndex = MOCK_DOCUMENTS[ownerId].findIndex(d => d.docType === docType)
  if (existingIndex > -1) {
    MOCK_DOCUMENTS[ownerId][existingIndex] = { docType, fileName, uploadedAt }
  } else {
    MOCK_DOCUMENTS[ownerId].push({ docType, fileName, uploadedAt })
  }

  // Update applications docsComplete status
  const count = MOCK_DOCUMENTS[ownerId].length
  const complete = count >= REQUIRED_DOC_KEYS.length
  MOCK_APPLICATIONS.filter(a => a.ownerId === ownerId).forEach(a => a.docsComplete = complete)

  return NextResponse.json({ ok: true, docType, fileName, uploadedAt })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")
  const docType = searchParams.get("docType")

  if (!ownerId || !docType) {
    return NextResponse.json({ error: "ownerId and docType are required" }, { status: 400 })
  }

  if (MOCK_DOCUMENTS[ownerId]) {
    MOCK_DOCUMENTS[ownerId] = MOCK_DOCUMENTS[ownerId].filter(d => d.docType !== docType)
    
    // Update applications docsComplete status
    const count = MOCK_DOCUMENTS[ownerId].length
    const complete = count >= REQUIRED_DOC_KEYS.length
    MOCK_APPLICATIONS.filter(a => a.ownerId === ownerId).forEach(a => a.docsComplete = complete)
  }

  return NextResponse.json({ ok: true })
}

