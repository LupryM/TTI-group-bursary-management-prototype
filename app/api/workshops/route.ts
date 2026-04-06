import { NextResponse } from "next/server"
import { MOCK_WORKSHOPS } from "@/lib/mock-data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")

  const workshops = studentId
    ? MOCK_WORKSHOPS.filter(w => w.studentId === studentId)
    : MOCK_WORKSHOPS

  return NextResponse.json(workshops)
}

