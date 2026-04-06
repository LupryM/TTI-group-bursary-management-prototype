"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginScreen } from "@/components/login-screen"

const ROLE_HOME: Record<string, string> = {
  student: "/portal/student/dashboard",
  funder: "/portal/funder/overview",
  admin: "/portal/admin/applications",
}

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect already-authenticated users to their portal
  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_HOME[user.role] ?? "/portal/student/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <p className="text-sm text-[#9CA3AF] font-sans">Loading…</p>
      </div>
    )
  }

  if (user) return null

  return <LoginScreen />
}
