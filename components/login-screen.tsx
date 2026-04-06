"use client"

import { useState } from "react"
import Image from "next/image"
import { MockUser, useAuth } from "@/lib/auth-context"
import { SignupForm } from "@/components/signup-form"

type RoleTab = "student" | "funder" | "admin"
type Mode = "signin" | "signup"

const roleConfig: Record<RoleTab, { label: string; description: string; icon: React.ReactNode }> = {
  student: {
    label: "Student",
    description: "Access your bursary status, workshops, and documents.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 2L2 6.5l8 4.5 8-4.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4 8.5V14c0 1.657 2.686 3 6 3s6-1.343 6-3V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 6.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  funder: {
    label: "Funder",
    description: "Monitor your funded cohort, disbursements and B-BBEE compliance.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M6 3l4-1 4 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  admin: {
    label: "Administrator",
    description: "Manage applications, students, funders and compliance reporting.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

export function LoginScreen() {
  const { login, users, loading: usersLoading } = useAuth()
  const [mode, setMode] = useState<Mode>("signin")
  const [activeRole, setActiveRole] = useState<RoleTab>("student")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const usersForRole = users.filter((u) => u.role === activeRole)

  const handleRoleChange = (role: RoleTab) => {
    setActiveRole(role)
    setSelectedUserId("")
    setError("")
  }

  const handleLogin = () => {
    if (!selectedUserId) {
      setError("Please select an account to continue.")
      return
    }
    setError("")
    setLoading(true)
    setTimeout(() => {
      login(selectedUserId)
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1A2B4A] border-b border-[#1A2B4A]/20">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between">
          <span className="text-[10px] text-white/50 tracking-widest uppercase font-sans">
            B-BBEE Level 1 Contributor
          </span>
          <span className="text-[10px] text-white/50 font-sans">
            +27 (0) 10 746 4366 &nbsp;|&nbsp; info@ttibursaries.co.za
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/tti-bursary-management-logo.png"
              alt="TTI Bursary Management"
              width={200}
              height={72}
              priority
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          {/* Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden shadow-sm">
            {/* Mode switcher */}
            <div className="flex border-b border-[#E5E7EB]">
              <button
                onClick={() => setMode("signin")}
                className={[
                  "flex-1 py-3 text-xs font-semibold uppercase tracking-widest font-sans transition-colors",
                  mode === "signin"
                    ? "bg-white text-[#1A2B4A] border-b-2 border-[#F5A623]"
                    : "bg-[#F5F6F8] text-[#9CA3AF] hover:text-[#6B7280]",
                ].join(" ")}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={[
                  "flex-1 py-3 text-xs font-semibold uppercase tracking-widest font-sans transition-colors",
                  mode === "signup"
                    ? "bg-white text-[#1A2B4A] border-b-2 border-[#F5A623]"
                    : "bg-[#F5F6F8] text-[#9CA3AF] hover:text-[#6B7280]",
                ].join(" ")}
              >
                Create Account
              </button>
            </div>

            {mode === "signup" ? (
              <>
                <div className="px-6 py-5 border-b border-[#E5E7EB]">
                  <h1 className="text-lg font-serif font-semibold text-[#1A2B4A]">Register as a student</h1>
                  <p className="text-xs text-[#9CA3AF] mt-1 font-sans">
                    Funders and administrators are provisioned by TTI.
                  </p>
                </div>
                <SignupForm onCancel={() => setMode("signin")} />
              </>
            ) : (
              <>
            {/* Card header */}
            <div className="px-6 py-5 border-b border-[#E5E7EB]">
              <h1 className="text-lg font-serif font-semibold text-[#1A2B4A]">Sign in to your portal</h1>
              <p className="text-xs text-[#9CA3AF] mt-1 font-sans">
                This is a demonstration environment. Select a role and account below.
              </p>
            </div>

            <div className="p-6">
              {/* Role tabs */}
              <div className="flex border border-[#E5E7EB] rounded-sm overflow-hidden mb-5">
                {(["student", "funder", "admin"] as RoleTab[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={[
                      "flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest font-sans transition-colors",
                      activeRole === role
                        ? "bg-[#1A2B4A] text-white"
                        : "bg-white text-[#6B7280] hover:bg-[#F5F6F8]",
                    ].join(" ")}
                  >
                    {roleConfig[role].label}
                  </button>
                ))}
              </div>

              {/* Role description */}
              <div className="flex items-start gap-3 bg-[#F5A623]/8 border border-[#F5A623]/25 rounded-sm px-4 py-3 mb-5">
                <span className="text-[#F5A623] flex-shrink-0 mt-0.5">
                  {roleConfig[activeRole].icon}
                </span>
                <p className="text-xs text-[#4B5563] font-sans leading-relaxed">
                  {roleConfig[activeRole].description}
                </p>
              </div>

              {/* Account selector */}
              <div className="mb-5">
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-2">
                  Select account
                </label>
                <div className="flex flex-col gap-2">
                  {usersLoading ? (
                    <div className="py-6 text-center text-xs text-[#9CA3AF] font-sans">Loading accounts…</div>
                  ) : usersForRole.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#9CA3AF] font-sans">No accounts found for this role.</div>
                  ) : usersForRole.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      selected={selectedUserId === u.id}
                      onSelect={() => { setSelectedUserId(u.id); setError("") }}
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 font-sans mb-4" role="alert">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className={[
                  "w-full py-3 text-sm font-semibold font-sans tracking-wide transition-colors rounded-sm",
                  loading
                    ? "bg-[#F5A623]/50 text-[#1A2B4A]/50 cursor-not-allowed"
                    : "bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white cursor-pointer",
                ].join(" ")}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>
              </>
            )}
          </div>

          {/* Footer note + Apply link */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-[10px] text-[#9CA3AF] font-sans">
              &copy; {new Date().getFullYear()} TTI Group &mdash; POPIA Compliant &middot; B-BBEE Level 1
            </p>
            <p className="text-xs font-sans">
              <span className="text-[#9CA3AF]">Not ready to sign in? </span>
              <a href="/apply" className="text-[#F5A623] font-semibold hover:underline">
                Submit an application
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserCard({ user, selected, onSelect }: { user: MockUser; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={[
        "w-full flex items-center gap-3 px-4 py-3 border rounded-sm text-left transition-all",
        selected
          ? "border-[#F5A623] bg-[#F5A623]/6 shadow-sm"
          : "border-[#E5E7EB] bg-white hover:border-[#1A2B4A]/30",
      ].join(" ")}
      aria-pressed={selected}
    >
      {/* Avatar */}
      <div
        className={[
          "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold font-sans",
          selected ? "bg-[#1A2B4A] text-white" : "bg-[#F5F6F8] text-[#1A2B4A]",
        ].join(" ")}
        aria-hidden="true"
      >
        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1A2E] font-sans leading-tight truncate">{user.name}</p>
        <p className="text-xs text-[#9CA3AF] font-sans truncate">{user.email}</p>
        {user.company && (
          <p className="text-[10px] text-[#F5A623] font-sans font-medium mt-0.5">{user.company}</p>
        )}
        {user.institution && (
          <p className="text-[10px] text-[#6B7280] font-sans mt-0.5">{user.institution}</p>
        )}
        {user.department && (
          <p className="text-[10px] text-[#6B7280] font-sans mt-0.5">{user.department}</p>
        )}
      </div>
      {/* Radio dot */}
      <div
        className={[
          "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
          selected ? "border-[#F5A623]" : "border-[#D1D5DB]",
        ].join(" ")}
        aria-hidden="true"
      >
        {selected && <div className="w-2 h-2 rounded-full bg-[#F5A623]" />}
      </div>
    </button>
  )
}
