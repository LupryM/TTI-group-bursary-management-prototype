export type ApplicationStatus = "Approved" | "Submitted" | "Under Review" | "Rejected" | "Disbursed"

export interface Application {
  id: string
  studentName: string
  studentNo: string
  institution: string
  programme: string
  year: string
  funder: string
  amount: number
  status: ApplicationStatus
  submittedDate: string
  idVerified: boolean
  docsComplete: boolean
  docsUploadedCount?: number
  docsRequiredCount?: number
  academicAvg: number
  refNumber?: string
  ownerId?: string
}

export interface Workshop {
  id: number
  title: string
  date: string
  status: "Attended" | "Upcoming" | "Missed"
  facilitator: string
  duration: string
  studentId: string
}

export interface FunderStudent {
  id: string
  name: string
  studentNo: string
  institution: string
  programme: string
  year: string
  amount: number
  disbursed: number
  status: ApplicationStatus
  academicAvg: number
  modules: { name: string; complete: boolean }[]
  funderId: string
}

export interface Funder {
  id: string
  name: string
  contact: string
  email: string
  budget: number
  students: number
  level: number
  status: string
}

// ── Shared Helpers ───────────────────────────────────────────────────────────

export function formatZAR(n: number) {
  return "R\u00A0" + n.toLocaleString("en-ZA")
}

export function progressPct(modules: { complete: boolean }[]) {
  if (!modules.length) return 0
  return Math.round((modules.filter((m) => m.complete).length / modules.length) * 100)
}

export function getUpcomingDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
}

// ── In-Memory Data (The Source of Truth) ──────────────────────────────────────

export const MOCK_USERS = [
  { id: "student-1", name: "Thandi Mokoena", email: "thandi@student.up.ac.za", role: "student", studentNo: "UP22/0045812", refNo: "TTI-2026-8472", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", funderName: "Anglo American plc", bursaryAmount: 48500, status: "Approved" },
  { id: "student-2", name: "Sipho Dlamini", email: "sipho@student.wits.ac.za", role: "student", studentNo: "WITS21/0033124", refNo: "TTI-2026-3301", institution: "University of the Witwatersrand", programme: "BCom Accounting", year: "2nd Year", funderName: "Sasol Bursaries", bursaryAmount: 42000, status: "Under Review" },
  { id: "funder-0", name: "Michael Chen", email: "michael@shell.com", role: "funder", company: "Shell South Africa", bbbeeLevel: 1, totalBudget: 4000000 },
  { id: "funder-1", name: "Priya Naidoo", email: "priya@angloamerican.com", role: "funder", company: "Anglo American plc", bbbeeLevel: 1, totalBudget: 2500000 },
  { id: "funder-2", name: "Jacques Rossouw", email: "jacques@sasol.com", role: "funder", company: "Sasol Bursaries", bbbeeLevel: 1, totalBudget: 1800000 },
  { id: "funder-3", name: "Aisha Patel", email: "aisha@nedbank.co.za", role: "funder", company: "Nedbank Foundation", bbbeeLevel: 2, totalBudget: 1200000 },
  { id: "admin-1", name: "Lerato Sithole", email: "lerato@ttibursaries.co.za", role: "admin", department: "Bursary Operations" },
]

export const MOCK_APPLICATIONS: Application[] = [
  { id: "app-001", studentName: "Thandi Mokoena", studentNo: "UP22/0045812", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", funder: "Anglo American plc", amount: 48500, status: "Approved", submittedDate: "12 Jan 2026", idVerified: true, docsComplete: false, academicAvg: 72, ownerId: "student-1", refNumber: "TTI-2026-847201" },
  { id: "app-002", studentName: "Sipho Dlamini", studentNo: "WITS21/0033124", institution: "University of the Witwatersrand", programme: "BCom Accounting", year: "2nd Year", funder: "Sasol Bursaries", amount: 42000, status: "Under Review", submittedDate: "18 Jan 2026", idVerified: true, docsComplete: false, academicAvg: 65, ownerId: "student-2", refNumber: "TTI-2026-330112" },
  { id: "app-003", studentName: "Anele Khumalo", studentNo: "UCT24/0071203", institution: "University of Cape Town", programme: "BEng Mechanical", year: "1st Year", funder: "Anglo American plc", amount: 55000, status: "Submitted", submittedDate: "21 Jan 2026", idVerified: false, docsComplete: false, academicAvg: 78, refNumber: "TTI-2026-712034" },
  { id: "app-004", studentName: "Nomvula Zulu", studentNo: "UKZN23/0019877", institution: "University of KwaZulu-Natal", programme: "BSocSci Psychology", year: "2nd Year", funder: "Sasol Bursaries", amount: 38000, status: "Approved", submittedDate: "3 Feb 2026", idVerified: true, docsComplete: true, academicAvg: 70, refNumber: "TTI-2026-198774" },
  { id: "app-005", studentName: "Lwazi Motha", studentNo: "SU22/0088341", institution: "Stellenbosch University", programme: "BEng Civil", year: "3rd Year", funder: "Anglo American plc", amount: 52000, status: "Rejected", submittedDate: "7 Feb 2026", idVerified: true, docsComplete: true, academicAvg: 48, refNumber: "TTI-2026-883415" },
  { id: "app-006", studentName: "Karabo Sithole", studentNo: "TUT23/0041200", institution: "Tshwane University of Technology", programme: "National Diploma IT", year: "1st Year", funder: "Sasol Bursaries", amount: 35000, status: "Submitted", submittedDate: "10 Feb 2026", idVerified: false, docsComplete: false, academicAvg: 61, refNumber: "TTI-2026-412009" },
]

export const MOCK_FUNDER_STUDENTS: FunderStudent[] = [
  { id: "fs-001", name: "Thandi Mokoena", studentNo: "UP22/0045812", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", amount: 48500, disbursed: 36375, status: "Approved", academicAvg: 72, funderId: "funder-1", modules: [
    { name: "Orientation", complete: true },
    { name: "Financial Literacy", complete: true },
    { name: "CV Writing", complete: true },
    { name: "Workplace Readiness", complete: false },
    { name: "Entrepreneurship", complete: false },
  ]},
  { id: "fs-003", name: "Anele Khumalo", studentNo: "UCT24/0071203", institution: "University of Cape Town", programme: "BEng Mechanical", year: "1st Year", amount: 55000, disbursed: 0, status: "Approved", academicAvg: 78, funderId: "funder-1", modules: [
    { name: "Orientation", complete: false },
    { name: "Financial Literacy", complete: false },
    { name: "CV Writing", complete: false },
    { name: "Workplace Readiness", complete: false },
    { name: "Entrepreneurship", complete: false },
  ]},
]

export const MOCK_WORKSHOPS: Workshop[] = [
  { id: 1, title: "Financial Literacy & Budgeting", date: "14 Mar 2026", status: "Attended", facilitator: "T. Nkosi", duration: "3 hrs", studentId: "student-1" },
  { id: 2, title: "CV Writing & Professional Branding", date: "28 Mar 2026", status: "Attended", facilitator: "M. van Wyk", duration: "2 hrs", studentId: "student-1" },
  { id: 3, title: "Workplace Readiness & Ethics", date: "11 Apr 2026", status: "Upcoming", facilitator: "S. Dlamini", duration: "4 hrs", studentId: "student-1" },
  { id: 4, title: "Orientation & Programme Overview", date: "7 Mar 2026", status: "Attended", facilitator: "T. Nkosi", duration: "2 hrs", studentId: "student-2" },
]

export const MOCK_FUNDERS: Funder[] = [
  { id: "f1", name: "Shell South Africa", contact: "Michael Chen", email: "michael@shell.com", budget: 4000000, students: 5, level: 1, status: "Active" },
  { id: "f2", name: "Anglo American plc", contact: "Priya Naidoo", email: "priya@angloamerican.com", budget: 2500000, students: 3, level: 1, status: "Active" },
  { id: "f3", name: "Sasol Bursaries", contact: "Jacques Rossouw", email: "jacques@sasol.com", budget: 1800000, students: 2, level: 1, status: "Active" },
  { id: "f4", name: "Nedbank Foundation", contact: "Aisha Patel", email: "aisha@nedbank.co.za", budget: 1200000, students: 0, level: 2, status: "Pending Setup" },
]

export const MOCK_DOCUMENTS: Record<string, { docType: string; fileName: string; uploadedAt: string }[]> = {
  "student-1": [
    { docType: "sa_id", fileName: "ID_Thandi_Mokoena.pdf", uploadedAt: new Date().toISOString() },
    { docType: "registration", fileName: "UP_Registration_2026.pdf", uploadedAt: new Date().toISOString() },
    { docType: "academic_record", fileName: "Transcript_UP22.pdf", uploadedAt: new Date().toISOString() },
  ],
  "student-2": [
    { docType: "sa_id", fileName: "ID_Sipho_Dlamini.pdf", uploadedAt: new Date().toISOString() },
  ],
}
