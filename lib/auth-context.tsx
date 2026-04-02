"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

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

interface AuthContextValue {
  user: MockUser | null
  users: MockUser[]
  loading: boolean
  login: (userId: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  users: [],
  loading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [users, setUsers] = useState<MockUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: MockUser[]) => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const login = (userId: string) => {
    const found = users.find((u) => u.id === userId)
    if (found) setUser(found)
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, users, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
