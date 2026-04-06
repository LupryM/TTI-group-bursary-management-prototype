import { NextResponse } from "next/server"
import { MOCK_FUNDER_STUDENTS } from "@/lib/mock-data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const funderId = searchParams.get("funderId")
  const studentNo = searchParams.get("studentNo")

  let students = MOCK_FUNDER_STUDENTS

  if (funderId) {
    students = students.filter(s => s.funderId === funderId)
  }

  if (studentNo) {
    const student = students.find(s => s.studentNo === studentNo)
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
    return NextResponse.json(student)
  }

  return NextResponse.json(students)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { studentId } = body

  const student = MOCK_FUNDER_STUDENTS.find(s => s.id === studentId)
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  if (body.disbursed !== undefined) {
    const disbursed = parseFloat(String(body.disbursed))
    student.disbursed = disbursed
    student.status = disbursed > 0 ? "Disbursed" : "Approved"
    return NextResponse.json(student)
  }

  if (body.moduleName !== undefined) {
    const mod = student.modules.find(m => m.name === body.moduleName)
    if (mod) mod.complete = !!body.complete
    return NextResponse.json(student)
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
}


