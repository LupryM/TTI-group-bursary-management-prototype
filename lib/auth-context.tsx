"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type Role = "student" | "funder" | "admin"

export interface MockUser {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  // student-specific
  studentNo?: string
  refNo?: string
  institution?: string
  programme?: string
  year?: string
  funderName?: string
  bursaryAmount?: number
  status?: "Approved" | "Pending" | "Under Review" | "Rejected"
  // funder-specific
  company?: string
  bbbeeLevel?: number
  totalBudget?: number
  // admin-specific
  department?: string
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "student-1",
    name: "Thandi Mokoena",
    email: "thandi@student.up.ac.za",
    role: "student",
    studentNo: "UP22/0045812",
    refNo: "TTI-2026-8472",
    institution: "University of Pretoria",
    programme: "BSc Computer Science",
    year: "3rd Year",
    funderName: "Anglo American plc",
    bursaryAmount: 48500,
    status: "Approved",
  },
  {
    id: "student-2",
    name: "Sipho Dlamini",
    email: "sipho@student.wits.ac.za",
    role: "student",
    studentNo: "WITS21/0033124",
    refNo: "TTI-2026-3301",
    institution: "University of the Witwatersrand",
    programme: "BCom Accounting",
    year: "2nd Year",
    funderName: "Sasol Bursaries",
    bursaryAmount: 42000,
    status: "Under Review",
  },
  {
    id: "funder-1",
    name: "Priya Naidoo",
    email: "priya@angloamerican.com",
    role: "funder",
    company: "Anglo American plc",
    bbbeeLevel: 1,
    totalBudget: 2500000,
  },
  {
    id: "funder-2",
    name: "Jacques Rossouw",
    email: "jacques@sasol.com",
    role: "funder",
    company: "Sasol Bursaries",
    bbbeeLevel: 1,
    totalBudget: 1800000,
  },
  {
    id: "admin-1",
    name: "Lerato Sithole",
    email: "lerato@ttibursaries.co.za",
    role: "admin",
    department: "Bursary Operations",
  },
]

interface AuthContextValue {
  user: MockUser | null
  login: (userId: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)

  const login = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId)
    if (found) setUser(found)
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
