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

export function formatZAR(n: number) {
  return "R\u00A0" + n.toLocaleString("en-ZA")
}

export function progressPct(modules: { complete: boolean }[]) {
  if (!modules.length) return 0
  return Math.round((modules.filter((m) => m.complete).length / modules.length) * 100)
}
