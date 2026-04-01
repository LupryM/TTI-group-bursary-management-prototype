export type ApplicationStatus = "Approved" | "Pending" | "Under Review" | "Rejected"

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
  academicAvg: number
}

export interface Workshop {
  id: number
  title: string
  date: string
  status: "Attended" | "Upcoming" | "Missed"
  facilitator: string
  duration: string
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
}

// Applications queue for admin
export const ALL_APPLICATIONS: Application[] = [
  {
    id: "app-001",
    studentName: "Thandi Mokoena",
    studentNo: "UP22/0045812",
    institution: "University of Pretoria",
    programme: "BSc Computer Science",
    year: "3rd Year",
    funder: "Anglo American plc",
    amount: 48500,
    status: "Approved",
    submittedDate: "12 Jan 2026",
    idVerified: true,
    docsComplete: true,
    academicAvg: 72,
  },
  {
    id: "app-002",
    studentName: "Sipho Dlamini",
    studentNo: "WITS21/0033124",
    institution: "University of the Witwatersrand",
    programme: "BCom Accounting",
    year: "2nd Year",
    funder: "Sasol Bursaries",
    amount: 42000,
    status: "Under Review",
    submittedDate: "18 Jan 2026",
    idVerified: true,
    docsComplete: false,
    academicAvg: 65,
  },
  {
    id: "app-003",
    studentName: "Anele Khumalo",
    studentNo: "UCT24/0071203",
    institution: "University of Cape Town",
    programme: "BEng Mechanical",
    year: "1st Year",
    funder: "Anglo American plc",
    amount: 55000,
    status: "Pending",
    submittedDate: "21 Jan 2026",
    idVerified: false,
    docsComplete: false,
    academicAvg: 78,
  },
  {
    id: "app-004",
    studentName: "Nomvula Zulu",
    studentNo: "UKZN23/0019877",
    institution: "University of KwaZulu-Natal",
    programme: "BSocSci Psychology",
    year: "2nd Year",
    funder: "Sasol Bursaries",
    amount: 38000,
    status: "Approved",
    submittedDate: "3 Feb 2026",
    idVerified: true,
    docsComplete: true,
    academicAvg: 70,
  },
  {
    id: "app-005",
    studentName: "Lwazi Motha",
    studentNo: "SU22/0088341",
    institution: "Stellenbosch University",
    programme: "BEng Civil",
    year: "3rd Year",
    funder: "Anglo American plc",
    amount: 52000,
    status: "Rejected",
    submittedDate: "7 Feb 2026",
    idVerified: true,
    docsComplete: true,
    academicAvg: 48,
  },
  {
    id: "app-006",
    studentName: "Karabo Sithole",
    studentNo: "TUT23/0041200",
    institution: "Tshwane University of Technology",
    programme: "National Diploma IT",
    year: "1st Year",
    funder: "Sasol Bursaries",
    amount: 35000,
    status: "Pending",
    submittedDate: "10 Feb 2026",
    idVerified: false,
    docsComplete: false,
    academicAvg: 61,
  },
]

// Students visible to Anglo American funder
export const ANGLO_STUDENTS: FunderStudent[] = [
  {
    id: "fs-001",
    name: "Thandi Mokoena",
    studentNo: "UP22/0045812",
    institution: "University of Pretoria",
    programme: "BSc Computer Science",
    year: "3rd Year",
    amount: 48500,
    disbursed: 36375,
    status: "Approved",
    academicAvg: 72,
    modules: [
      { name: "Orientation", complete: true },
      { name: "Financial Literacy", complete: true },
      { name: "CV Writing", complete: true },
      { name: "Workplace Readiness", complete: false },
      { name: "Entrepreneurship", complete: false },
    ],
  },
  {
    id: "fs-003",
    name: "Anele Khumalo",
    studentNo: "UCT24/0071203",
    institution: "University of Cape Town",
    programme: "BEng Mechanical",
    year: "1st Year",
    amount: 55000,
    disbursed: 0,
    status: "Pending",
    academicAvg: 78,
    modules: [
      { name: "Orientation", complete: false },
      { name: "Financial Literacy", complete: false },
      { name: "CV Writing", complete: false },
      { name: "Workplace Readiness", complete: false },
      { name: "Entrepreneurship", complete: false },
    ],
  },
  {
    id: "fs-005",
    name: "Lwazi Motha",
    studentNo: "SU22/0088341",
    institution: "Stellenbosch University",
    programme: "BEng Civil",
    year: "3rd Year",
    amount: 52000,
    disbursed: 52000,
    status: "Rejected",
    academicAvg: 48,
    modules: [
      { name: "Orientation", complete: true },
      { name: "Financial Literacy", complete: true },
      { name: "CV Writing", complete: false },
      { name: "Workplace Readiness", complete: false },
      { name: "Entrepreneurship", complete: false },
    ],
  },
]

// Workshops for student-1 (Thandi)
export const THANDI_WORKSHOPS: Workshop[] = [
  {
    id: 1,
    title: "Financial Literacy & Budgeting",
    date: "14 Mar 2026",
    status: "Attended",
    facilitator: "T. Nkosi",
    duration: "3 hrs",
  },
  {
    id: 2,
    title: "CV Writing & Professional Branding",
    date: "28 Mar 2026",
    status: "Attended",
    facilitator: "M. van Wyk",
    duration: "2 hrs",
  },
  {
    id: 3,
    title: "Workplace Readiness & Ethics",
    date: "11 Apr 2026",
    status: "Upcoming",
    facilitator: "S. Dlamini",
    duration: "4 hrs",
  },
  {
    id: 4,
    title: "Entrepreneurship & Business Planning",
    date: "25 Apr 2026",
    status: "Upcoming",
    facilitator: "R. Pillay",
    duration: "3 hrs",
  },
]

export function formatZAR(n: number) {
  return "R\u00A0" + n.toLocaleString("en-ZA")
}

export function progressPct(modules: { complete: boolean }[]) {
  if (!modules.length) return 0
  return Math.round((modules.filter((m) => m.complete).length / modules.length) * 100)
}
