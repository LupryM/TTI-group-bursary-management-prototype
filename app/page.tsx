"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const ROLE_HOME: Record<string, string> = {
  student: "/portal/student/dashboard",
  funder: "/portal/funder/overview",
  admin: "/portal/admin/applications",
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
    } else {
      router.replace(ROLE_HOME[user.role] ?? "/login")
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
      <p className="text-sm text-[#9CA3AF] font-sans">Loading…</p>
    </div>
  )
}
