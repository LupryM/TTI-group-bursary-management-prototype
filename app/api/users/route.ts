import { NextResponse } from "next/server"
import { MOCK_USERS, MOCK_APPLICATIONS } from "@/lib/mock-data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    const user = MOCK_USERS.find(u => u.id === id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(user)
  }

  return NextResponse.json(MOCK_USERS)
}

export async function POST(request: Request) {
  const body = await request.json()

  const firstName = String(body.firstName || "").trim()
  const lastName = String(body.lastName || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const institution = String(body.institution || "").trim()
  const programme = String(body.programme || "").trim()
  const year = String(body.year || "").trim()
  const studentNo = String(body.studentNo || "").trim()
  const idNumber = String(body.idNumber || "").trim()

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "First name, last name and email are required." }, { status: 400 })
  }

  // Email must be unique
  if (MOCK_USERS.some(u => u.email.toLowerCase() === email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
  }

  const id = `student-${MOCK_USERS.length + 1}`
  const refNo = `TTI-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`

  const newUser: any = {
    id,
    name: `${firstName} ${lastName}`,
    email,
    role: "student",
    studentNo: studentNo || undefined,
    refNo,
    institution: institution || undefined,
    programme: programme || undefined,
    year: year || undefined,
    status: "Approved",
    idNumber: idNumber || undefined
  }

  MOCK_USERS.push(newUser)

  // Identity linkage: claim any guest application submitted with this SA ID
  if (idNumber) {
    MOCK_APPLICATIONS.forEach(app => {
      if (app.studentNo === idNumber && (!app.ownerId || app.ownerId === "")) {
        app.ownerId = id
      }
    })
  }

  return NextResponse.json(newUser, { status: 201 })
}

