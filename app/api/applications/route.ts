import { NextResponse } from "next/server"
import { MOCK_APPLICATIONS, MOCK_FUNDER_STUDENTS, MOCK_WORKSHOPS, MOCK_FUNDERS, getUpcomingDate } from "@/lib/mock-data"
import { REQUIRED_DOC_COUNT } from "@/lib/documents"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")

  const apps = ownerId 
    ? MOCK_APPLICATIONS.filter(a => a.ownerId === ownerId)
    : MOCK_APPLICATIONS

  return NextResponse.json(apps)
}

export async function POST(request: Request) {
  const body = await request.json()
  
  const appId = `app-${String(MOCK_APPLICATIONS.length + 1).padStart(4, "0")}`
  const refNumber = `TTI-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`
  const submittedDate = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })

  const newApp: any = {
    id: appId,
    studentName: `${body.firstName} ${body.lastName}`,
    studentNo: body.studentNumber || body.idNumber || "",
    institution: body.university,
    programme: body.programme,
    year: body.year,
    funder: "Unassigned",
    amount: 0,
    status: "Submitted",
    submittedDate,
    idVerified: false,
    docsComplete: false,
    academicAvg: 0,
    refNumber,
    ownerId: body.ownerId || undefined
  }

  MOCK_APPLICATIONS.push(newApp)
  return NextResponse.json({ id: appId, refNumber, submittedDate }, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, status } = body

  const app = MOCK_APPLICATIONS.find(a => a.id === id)
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Handle funder/amount assignment
  if (body.funder !== undefined) app.funder = String(body.funder)
  if (body.amount !== undefined) app.amount = parseFloat(String(body.amount))

  if (status && status !== app.status) {
    const oldStatus = app.status
    app.status = status

    if (status === "Approved" && oldStatus !== "Approved") {
      provisionApprovedStudent(app)
    }
  }

  return NextResponse.json(app)
}

function provisionApprovedStudent(app: any) {
  const funder = MOCK_FUNDERS.find(f => f.name === app.funder)
  if (!funder) return

  // Idempotent
  if (MOCK_FUNDER_STUDENTS.some(fs => fs.studentNo === app.studentNo && fs.funderId === funder.id)) return

  const fsId = `fs-${Date.now()}`
  MOCK_FUNDER_STUDENTS.push({
    id: fsId,
    name: app.studentName,
    studentNo: app.studentNo,
    institution: app.institution,
    programme: app.programme,
    year: app.year,
    amount: app.amount || 0,
    disbursed: 0,
    status: "Approved",
    academicAvg: app.academicAvg || 0,
    funderId: funder.id,
    modules: [
      { name: "Orientation", complete: false },
      { name: "Financial Literacy", complete: false },
      { name: "CV Writing", complete: false },
      { name: "Workplace Readiness", complete: false },
      { name: "Entrepreneurship", complete: false },
    ]
  })

  // Add default workshops if none exist
  if (app.ownerId && !MOCK_WORKSHOPS.some(w => w.studentId === app.ownerId)) {
    const defaults = [
      { title: "Orientation & Programme Overview", days: 7, facilitator: "T. Nkosi", duration: "2 hrs" },
      { title: "Financial Literacy & Budgeting", days: 21, facilitator: "T. Nkosi", duration: "3 hrs" },
      { title: "CV Writing & Professional Branding", days: 35, facilitator: "M. van Wyk", duration: "2 hrs" },
      { title: "Workplace Readiness & Ethics", days: 49, facilitator: "S. Dlamini", duration: "4 hrs" },
    ]
    defaults.forEach(d => {
      MOCK_WORKSHOPS.push({
        id: MOCK_WORKSHOPS.length + 1,
        title: d.title,
        date: getUpcomingDate(d.days),
        status: "Upcoming",
        facilitator: d.facilitator,
        duration: d.duration,
        studentId: app.ownerId
      })
    })
  }
}

