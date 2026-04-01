"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { formatZAR } from "@/lib/mock-data"

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] tracking-widest uppercase text-[#6B7280] font-sans font-semibold mb-3 flex items-center gap-2">
      <span className="w-3 h-px bg-[#F5A623]" aria-hidden="true" />
      {children}
    </h2>
  )
}

const inputCls =
  "w-full border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-[#F5A623] transition-colors placeholder:text-[#9CA3AF] rounded-sm disabled:bg-[#F5F6F8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"

const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-1.5"

export function StudentProfile() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [phone, setPhone] = useState("+27 82 555 0123")
  const [altEmail, setAltEmail] = useState("")
  const [address, setAddress] = useState("12 Jacaranda Street, Pretoria, 0083")

  if (!user || user.role !== "student") return null

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Page heading */}
      <div className="mb-8">
        <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] font-sans mb-1">Account</p>
        <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">My Profile</h1>
        <p className="text-sm text-[#6B7280] mt-1">Review your personal and bursary details. Contact TTI to change locked fields.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — avatar & quick stats */}
        <div className="flex flex-col gap-6">
          {/* Avatar card */}
          <div className="bg-white border border-[#E5E7EB] rounded-sm p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#1A2B4A] flex items-center justify-center text-white text-2xl font-bold font-sans mb-4">
              {initials}
            </div>
            <p className="text-base font-semibold text-[#1A1A2E] font-sans">{user.name}</p>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">{user.email}</p>
            <div className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-widest rounded-sm font-sans">
              Student
            </div>
          </div>

          {/* Bursary quick stats */}
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-2">
              <span className="w-1 h-4 bg-[#F5A623] rounded-full flex-shrink-0" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B4A] font-sans">Bursary Summary</p>
            </div>
            {[
              { label: "Reference", value: user.refNo ?? "—", mono: true },
              { label: "Student No.", value: user.studentNo ?? "—", mono: true },
              { label: "Amount", value: formatZAR(user.bursaryAmount ?? 0), gold: true },
              { label: "Funder", value: user.funderName ?? "—" },
              { label: "Year", value: user.year ?? "—" },
            ].map((row, idx, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-3 text-sm ${idx !== arr.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans">{row.label}</span>
                <span className={[
                  "font-sans text-sm",
                  row.mono ? "font-mono text-[#1A1A2E]" : "",
                  row.gold ? "text-[#F5A623] font-semibold font-mono" : "text-[#1A1A2E] font-medium",
                ].join(" ")}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Notification preferences */}
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-2">
              <span className="w-1 h-4 bg-[#F5A623] rounded-full flex-shrink-0" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B4A] font-sans">Notifications</p>
            </div>
            {[
              { label: "Email reminders", description: "Workshop and deadline alerts" },
              { label: "SMS alerts", description: "Disbursement notifications" },
              { label: "Document requests", description: "When TTI requests documents" },
            ].map((pref, idx) => (
              <NotificationToggle key={pref.label} label={pref.label} description={pref.description} defaultOn={idx === 0} />
            ))}
          </div>
        </div>

        {/* Right — editable form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Personal details */}
          <section className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-3">
              <span className="w-1 h-4 bg-[#F5A623] rounded-full flex-shrink-0" aria-hidden="true" />
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B4A] font-sans">Personal Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>First Name</label>
                <input className={inputCls} value={user.name.split(" ")[0]} disabled aria-label="First name" />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input className={inputCls} value={user.name.split(" ").slice(1).join(" ")} disabled aria-label="Last name" />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input className={inputCls} value={user.email} disabled aria-label="Email address" />
              </div>
              <div>
                <label className={labelCls}>Alternate Email</label>
                <input
                  className={inputCls}
                  value={altEmail}
                  onChange={(e) => setAltEmail(e.target.value)}
                  placeholder="personal@email.com"
                  aria-label="Alternate email"
                />
              </div>
              <div>
                <label className={labelCls}>Mobile Number</label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-label="Mobile number"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Residential Address</label>
                <input
                  className={inputCls}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  aria-label="Residential address"
                />
              </div>
            </div>
          </section>

          {/* Academic details (locked) */}
          <section className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-1 h-4 bg-[#F5A623] rounded-full flex-shrink-0" aria-hidden="true" />
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B4A] font-sans">Academic Details</h2>
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-sans flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="1.5" y="5" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Locked — contact TTI to update
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Institution</label>
                <input className={inputCls} value={user.institution ?? ""} disabled aria-label="Institution" />
              </div>
              <div>
                <label className={labelCls}>Programme</label>
                <input className={inputCls} value={user.programme ?? ""} disabled aria-label="Programme" />
              </div>
              <div>
                <label className={labelCls}>Year of Study</label>
                <input className={inputCls} value={user.year ?? ""} disabled aria-label="Year of study" />
              </div>
              <div>
                <label className={labelCls}>Student Number</label>
                <input className={inputCls} value={user.studentNo ?? ""} disabled aria-label="Student number" />
              </div>
            </div>
          </section>

          {/* Save button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9CA3AF] font-sans">
              Last updated: 15 March 2026
            </p>
            <button
              onClick={handleSave}
              className={[
                "px-6 py-2.5 text-sm font-semibold font-sans rounded-sm transition-all",
                saved
                  ? "bg-emerald-100 text-emerald-700 cursor-default"
                  : "bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white cursor-pointer",
              ].join(" ")}
            >
              {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

function NotificationToggle({
  label,
  description,
  defaultOn,
}: {
  label: string
  description: string
  defaultOn: boolean
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#1A1A2E] font-sans">{label}</p>
        <p className="text-xs text-[#9CA3AF] font-sans">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={[
          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
          on ? "bg-[#F5A623]" : "bg-[#E5E7EB]",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
            on ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  )
}
