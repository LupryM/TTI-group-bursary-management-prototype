"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ALL_APPLICATIONS, ANGLO_STUDENTS, formatZAR, progressPct, Application } from "@/lib/mock-data"
import type { AdminView } from "@/components/nav-bar"

// ── Shared ────────────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] tracking-widest uppercase text-[#6B7280] font-sans font-semibold mb-3 flex items-center gap-2">
      <span className="w-3 h-px bg-[#F5A623]" aria-hidden="true" />
      {children}
    </h2>
  )
}

type AppStatus = Application["status"]

const statusBadge = (s: string) => {
  const base = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold tracking-wide font-sans rounded-sm whitespace-nowrap"
  if (s === "Approved") return `${base} bg-emerald-100 text-emerald-700`
  if (s === "Under Review") return `${base} bg-amber-100 text-amber-700`
  if (s === "Pending") return `${base} bg-[#F5F6F8] text-[#6B7280] border border-[#E5E7EB]`
  if (s === "Rejected") return `${base} bg-red-100 text-red-600`
  return `${base} bg-[#F5F6F8] text-[#6B7280]`
}

// ── Applications queue ────────────────────────────────────────────────────────

function AdminApplications() {
  const [apps, setApps] = useState<Application[]>(ALL_APPLICATIONS)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<AppStatus | "All">("All")
  const [selected, setSelected] = useState<Application | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateStatus = (id: string, status: AppStatus) => {
    setActionLoading(true)
    setTimeout(() => {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
      setActionLoading(false)
      showToast(`Application ${status.toLowerCase()} successfully.`)
    }, 800)
  }

  const filtered = apps.filter((a) => {
    const matchSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.institution.toLowerCase().includes(search.toLowerCase()) ||
      a.funder.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "All" || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    All: apps.length,
    Pending: apps.filter((a) => a.status === "Pending").length,
    "Under Review": apps.filter((a) => a.status === "Under Review").length,
    Approved: apps.filter((a) => a.status === "Approved").length,
    Rejected: apps.filter((a) => a.status === "Rejected").length,
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-sm shadow-lg text-sm font-sans font-semibold border",
            toast.type === "success"
              ? "bg-white border-emerald-300 text-emerald-700"
              : "bg-white border-red-300 text-red-600",
          ].join(" ")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            {toast.type === "success"
              ? <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            }
          </svg>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Admin Portal</p>
        <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">Applications Queue</h1>
        <p className="text-sm text-[#6B7280] mt-1">Review, approve, and manage incoming bursary applications.</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["All", "Pending", "Under Review", "Approved", "Rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-sans rounded-sm border transition-colors",
              filterStatus === s
                ? "bg-[#1A2B4A] text-white border-[#1A2B4A]"
                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F5F6F8]",
            ].join(" ")}
          >
            {s}
            <span className={[
              "text-[10px] px-1.5 py-0.5 rounded-sm font-mono",
              filterStatus === s ? "bg-white/20 text-white" : "bg-[#F5F6F8] text-[#9CA3AF]",
            ].join(" ")}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] bg-white font-sans text-[#1A1A2E] outline-none focus:border-[#F5A623] transition-colors rounded-sm placeholder:text-[#9CA3AF]"
          placeholder="Search by name, institution, funder…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search applications"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-sm overflow-x-auto">
          <table className="w-full text-sm font-sans min-w-[700px]" role="table">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F5F6F8]">
                {["Student", "Institution / Funder", "Amount", "Docs", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, idx) => (
                <tr
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={[
                    "border-b border-[#E5E7EB] last:border-0 cursor-pointer transition-colors",
                    selected?.id === app.id ? "bg-[#F5A623]/6" : idx % 2 === 1 ? "bg-[#F5F6F8] hover:bg-[#F5A623]/4" : "bg-white hover:bg-[#F5A623]/4",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1A1A2E]">{app.studentName}</p>
                    <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{app.studentNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-[#1A1A2E]">{app.institution}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{app.funder}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#F5A623] font-mono">{formatZAR(app.amount)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span title="ID Verified" className={`w-2 h-2 rounded-full mt-0.5 ${app.idVerified ? "bg-emerald-400" : "bg-[#E5E7EB]"}`} aria-hidden="true" />
                      <span title="Docs Complete" className={`w-2 h-2 rounded-full mt-0.5 ${app.docsComplete ? "bg-emerald-400" : "bg-[#E5E7EB]"}`} aria-hidden="true" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(app.status)}>{app.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#F5A623] font-sans hover:underline">Review</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#9CA3AF] font-sans">No applications match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-80 flex-shrink-0 bg-white border border-[#E5E7EB] rounded-sm overflow-hidden self-start lg:sticky lg:top-24">
            <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#1A2B4A] flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white font-sans">Application Detail</span>
              <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white transition-colors" aria-label="Close detail panel">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Student info */}
              <div>
                <p className="text-base font-semibold text-[#1A1A2E] font-sans">{selected.studentName}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{selected.studentNo}</p>
              </div>
              {[
                { label: "Institution", value: selected.institution },
                { label: "Programme", value: selected.programme },
                { label: "Year", value: selected.year },
                { label: "Funder", value: selected.funder },
                { label: "Amount", value: formatZAR(selected.amount) },
                { label: "Academic Avg.", value: `${selected.academicAvg}%` },
                { label: "Submitted", value: selected.submittedDate },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-start gap-2 border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
                  <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans flex-shrink-0">{row.label}</span>
                  <span className="text-xs font-medium text-[#1A1A2E] font-sans text-right">{row.value}</span>
                </div>
              ))}

              {/* Document status */}
              <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-sm p-3 flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.idVerified ? "bg-emerald-400" : "bg-[#D1D5DB]"}`} />
                  <span className="text-xs text-[#6B7280] font-sans">ID Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.docsComplete ? "bg-emerald-400" : "bg-[#D1D5DB]"}`} />
                  <span className="text-xs text-[#6B7280] font-sans">Docs Complete</span>
                </div>
              </div>

              {/* Current status */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Status:</span>
                <span className={statusBadge(selected.status)}>{selected.status}</span>
              </div>

              {/* Action buttons */}
              {selected.status !== "Approved" && selected.status !== "Rejected" && (
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus(selected.id, "Approved")}
                    className="flex-1 py-2.5 text-xs font-semibold font-sans bg-emerald-600 text-white hover:bg-emerald-700 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saving…" : "Approve"}
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus(selected.id, "Under Review")}
                    className="flex-1 py-2.5 text-xs font-semibold font-sans bg-amber-500 text-white hover:bg-amber-600 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Review
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus(selected.id, "Rejected")}
                    className="flex-1 py-2.5 text-xs font-semibold font-sans bg-red-500 text-white hover:bg-red-600 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
              {(selected.status === "Approved" || selected.status === "Rejected") && (
                <button
                  onClick={() => updateStatus(selected.id, "Under Review")}
                  className="w-full py-2.5 text-xs font-semibold font-sans border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F5F6F8] rounded-sm transition-colors cursor-pointer"
                >
                  Revert to Under Review
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Skills tracker ────────────────────────────────────────────────────────────

function AdminSkillsTracker() {
  const students = ANGLO_STUDENTS
  const [search, setSearch] = useState("")
  const [confirmRow, setConfirmRow] = useState<string | null>(null)
  const [completedRows, setCompletedRows] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const markComplete = (id: string, name: string) => {
    setCompletedRows((prev) => new Set([...prev, id]))
    setConfirmRow(null)
    showToast(`${name} marked as programme complete.`)
  }

  const avgProgress = Math.round(students.reduce((a, s) => a + progressPct(s.modules), 0) / students.length)
  const totalAmount = students.reduce((a, s) => a + s.amount, 0)
  const totalActive = students.filter((s) => s.status === "Approved").length

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.institution.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-white border border-emerald-300 text-emerald-700 rounded-sm shadow-lg text-sm font-semibold font-sans">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Admin Portal</p>
        <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">Skills Development Tracker</h1>
        <p className="text-sm text-[#6B7280] mt-1">Monitor module completion and programme progress across all active bursary students.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mb-8 border border-[#E5E7EB] bg-white divide-x divide-[#E5E7EB] rounded-sm overflow-hidden">
        {[
          { label: "Total Students", value: String(students.length) },
          { label: "Active Bursaries", value: String(totalActive) },
          { label: "Total Disbursement", value: formatZAR(totalAmount) },
          { label: "Avg. Completion", value: `${avgProgress}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1">{kpi.label}</p>
            <p className="text-xl font-semibold font-serif text-[#F5A623]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] bg-white font-sans text-[#1A1A2E] outline-none focus:border-[#F5A623] transition-colors rounded-sm placeholder:text-[#9CA3AF]"
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search students"
        />
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-x-auto">
        <table className="w-full text-sm font-sans min-w-[900px]" role="table">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F5F6F8]">
              {["Student", "Institution / Funder", "Bursary Amount", "Modules Completed", "Progress", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => {
              const pct = progressPct(s.modules)
              const done = completedRows.has(s.id)
              return (
                <tr key={s.id} className={`border-b border-[#E5E7EB] last:border-0 align-top ${idx % 2 === 1 ? "bg-[#F5F6F8]" : "bg-white"}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1A1A2E]">{s.name}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">{s.studentNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[#1A1A2E] text-xs leading-snug">{s.institution}</p>
                    <p className="text-[#6B7280] text-xs mt-0.5">{s.programme}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#F5A623] font-mono text-sm">{formatZAR(s.amount)}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">per annum</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.modules.map((m) => (
                        <span
                          key={m.name}
                          className={`text-[10px] px-2 py-0.5 rounded-sm font-sans ${m.complete ? "bg-[#F5A623]/15 text-[#A06B00]" : "bg-[#F5F6F8] text-[#9CA3AF] border border-[#E5E7EB]"}`}
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#1A1A2E]">{pct}%</span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        ({s.modules.filter((m) => m.complete).length}/{s.modules.length})
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden w-full">
                      <div className="h-full bg-[#F5A623] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {done ? (
                      <span className="text-xs font-semibold text-emerald-600 font-sans">Complete</span>
                    ) : confirmRow === s.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => markComplete(s.id, s.name)} className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 rounded-sm transition-colors cursor-pointer">
                          Confirm
                        </button>
                        <button onClick={() => setConfirmRow(null)} className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F5F6F8] rounded-sm transition-colors cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRow(s.id)}
                        className="text-xs font-semibold text-[#F5A623] hover:text-[#D4891A] underline underline-offset-2 transition-colors font-sans"
                      >
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF] font-sans">Showing {filtered.length} of {students.length} enrolled students — 2026 cohort</p>
        <p className="text-xs text-[#9CA3AF] font-sans">Last synced: {new Date().toLocaleDateString("en-ZA")}</p>
      </div>
    </main>
  )
}

// ── Funders management ────────────────────────────────────────────────────────

function AdminFunders() {
  const funders = [
    { id: "f1", name: "Shell South Africa", contact: "Michael Chen", email: "michael@shell.com", budget: 4000000, students: 5, level: 1, status: "Active" },
    { id: "f2", name: "Anglo American plc", contact: "Priya Naidoo", email: "priya@angloamerican.com", budget: 2500000, students: 3, level: 1, status: "Active" },
    { id: "f3", name: "Sasol Bursaries", contact: "Jacques Rossouw", email: "jacques@sasol.com", budget: 1800000, students: 2, level: 1, status: "Active" },
    { id: "f4", name: "Nedbank Foundation", contact: "Aisha Patel", email: "aisha@nedbank.co.za", budget: 1200000, students: 0, level: 2, status: "Pending Setup" },
  ]

  const statusColor: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    "Pending Setup": "bg-amber-100 text-amber-700",
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Admin Portal</p>
          <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">Funder Management</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage corporate funders and their bursary allocations.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold font-sans bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white rounded-sm transition-colors cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Funder
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Funders", value: String(funders.length) },
          { label: "Total Budget Managed", value: formatZAR(funders.reduce((a, f) => a + f.budget, 0)) },
          { label: "Total Students Funded", value: String(funders.reduce((a, f) => a + f.students, 0)) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E5E7EB] rounded-sm px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans mb-1">{stat.label}</p>
            <p className="text-xl font-semibold text-[#F5A623] font-serif">{stat.value}</p>
          </div>
        ))}
      </div>

      <SectionHeader>Registered Funders</SectionHeader>
      <div className="flex flex-col gap-4">
        {funders.map((f) => (
          <div key={f.id} className="bg-white border border-[#E5E7EB] rounded-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 bg-[#1A2B4A] text-white rounded-sm flex items-center justify-center text-xs font-bold font-sans flex-shrink-0">
              {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[#1A1A2E] font-sans">{f.name}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm font-sans ${statusColor[f.status]}`}>{f.status}</span>
                <span className="text-[10px] font-semibold bg-[#F5A623]/15 text-[#A06B00] px-2 py-0.5 rounded-sm font-sans">Level {f.level}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{f.contact} &mdash; <a href={`mailto:${f.email}`} className="text-[#F5A623] hover:underline">{f.email}</a></p>
            </div>
            <div className="flex gap-6 flex-shrink-0 sm:text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans">Budget</p>
                <p className="text-sm font-semibold text-[#F5A623] font-mono">{formatZAR(f.budget)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans">Students</p>
                <p className="text-sm font-semibold text-[#1A2B4A] font-sans">{f.students}</p>
              </div>
            </div>
            <button className="flex-shrink-0 px-3 py-2 text-xs font-semibold font-sans border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F5F6F8] rounded-sm transition-colors cursor-pointer">
              Manage
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

interface AdminPortalProps {
  view: AdminView
}

export function AdminPortal({ view }: AdminPortalProps) {
  if (view === "applications") return <AdminApplications />
  if (view === "tracker") return <AdminSkillsTracker />
  return <AdminFunders />
}
