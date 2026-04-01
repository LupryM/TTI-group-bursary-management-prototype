"use client"

import { useState } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { NavBar } from "@/components/nav-bar"
import type { StudentView, FunderView, AdminView, AnyView } from "@/components/nav-bar"
import { StudentDashboard } from "@/components/student-dashboard"
import { ApplicationForm } from "@/components/application-form"
import { StudentProfile } from "@/components/student-profile"
import { FunderPortal } from "@/components/funder-portal"
import { AdminPortal } from "@/components/admin-portal"

// Default views per role
const DEFAULT_VIEW: Record<string, AnyView> = {
  student: "dashboard",
  funder: "overview",
  admin: "applications",
}

export default function HomePage() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<AnyView>("dashboard")

  // Reset view when user changes (login/logout handled by context)
  const handleViewChange = (view: AnyView) => setActiveView(view)

  // Not logged in — show login screen
  if (!user) {
    return <LoginScreen />
  }

  // After login, ensure we're on a valid view for this role
  const defaultForRole = DEFAULT_VIEW[user.role]
  const roleViews: Record<string, AnyView[]> = {
    student: ["dashboard", "apply", "profile"],
    funder: ["overview", "students", "reports"],
    admin: ["applications", "tracker", "funders"],
  }
  const validView = roleViews[user.role].includes(activeView) ? activeView : defaultForRole

  const renderPortal = () => {
    if (user.role === "student") {
      if (validView === "apply") return <ApplicationForm />
      if (validView === "profile") return <StudentProfile />
      return <StudentDashboard />
    }
    if (user.role === "funder") {
      return <FunderPortal view={validView as FunderView} />
    }
    if (user.role === "admin") {
      return <AdminPortal view={validView as AdminView} />
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      <NavBar activeView={validView} onViewChange={handleViewChange} />

      <div className="flex-1">
        {renderPortal()}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <Image
              src="/tti-bursary-management-logo.png"
              alt="TTI Bursary Management"
              width={100}
              height={36}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>
          {/* Legal */}
          <p className="text-[10px] text-gray-300 font-sans">
            &copy; {new Date().getFullYear()} TTI Group. All rights reserved.&nbsp;&nbsp;&bull;&nbsp;&nbsp;
            Privacy Policy&nbsp;&nbsp;&bull;&nbsp;&nbsp;POPIA Compliant
          </p>
          {/* Contact */}
          <div className="text-right">
            <p className="text-[10px] text-gray-300 font-sans">info@ttibursaries.co.za</p>
            <p className="text-[10px] text-gray-300 font-sans">+27 (0) 10 746 4366</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
