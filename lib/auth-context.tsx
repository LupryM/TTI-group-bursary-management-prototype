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
  status?: "Approved" | "Submitted" | "Under Review" | "Rejected"
  idNumber?: string   // SA ID used to claim a guest application on signup
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
  registerAndLogin: (newUser: MockUser) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  users: [],
  loading: true,
  login: () => {},
  logout: () => {},
  registerAndLogin: () => {},
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
        // Restore session from localStorage
        const savedId = localStorage.getItem("tti_user_id")
        if (savedId) {
          const found = data.find((u) => u.id === savedId)
          if (found) setUser(found)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const login = (userId: string) => {
    const found = users.find((u) => u.id === userId)
    if (found) {
      setUser(found)
      localStorage.setItem("tti_user_id", userId)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("tti_user_id")
  }

  // Called after a successful signup: adds the freshly created user to the
  // in-memory directory and signs them in immediately.
  const registerAndLogin = (newUser: MockUser) => {
    setUsers((prev) => [...prev, newUser])
    setUser(newUser)
    localStorage.setItem("tti_user_id", newUser.id)
  }

  return (
    <AuthContext.Provider value={{ user, users, loading, login, logout, registerAndLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
