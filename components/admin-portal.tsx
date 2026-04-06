"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { formatZAR, progressPct, Application, FunderStudent } from "@/lib/mock-data"
import type { AdminView } from "@/components/nav-bar"

// Map funder names to logo files
const SPONSOR_LOGOS: Record<string, string> = {
  "Shell South Africa": "/Shell-Logo.png",
  "Anglo American plc": "/Anglo_American_plc-Logo.wine.png",
  "Sasol Bursaries": "/Sasol-Logo.wine.png",
  "Nedbank Foundation": "/nedbank-logo-png-transparent.png",
}

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
  const [apps, setApps] = useState<Application[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<AppStatus | "All">("All")
  const [selected, setSelected] = useState<Application | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [assignFunder, setAssignFunder] = useState("")
  const [assignAmount, setAssignAmount] = useState("")

  const FUNDERS = ["Anglo American plc", "Sasol Bursaries", "Shell South Africa", "Nedbank Foundation"]

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data: Application[]) => {
        setApps(data)
        setLoadingData(false)
      })
  }, [])

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateStatus = (id: string, status: AppStatus) => {
    setActionLoading(true)
    fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
      .then((r) => r.json())
      .then((updated: Application) => {
        setApps((prev) => prev.map((a) => (a.id === id ? updated : a)))
        setSelected((prev) => (prev?.id === id ? updated : prev))
        // Reset filter to All so the updated application stays visible
        setFilterStatus("All")
        setActionLoading(false)
        showToast(`Application ${status.toLowerCase()} successfully.`)
      })
      .catch(() => {
        setActionLoading(false)
        showToast("Failed to update status.", "error")
      })
  }

  const saveAssignment = () => {
    if (!selected) return
    if (!assignFunder && !assignAmount) return
    setActionLoading(true)
    const body: Record<string, unknown> = { id: selected.id }
    if (assignFunder) body.funder = assignFunder
    if (assignAmount) body.amount = parseFloat(assignAmount.replace(/[^0-9.]/g, ""))
    fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((updated: Application) => {
        setApps((prev) => prev.map((a) => (a.id === selected.id ? updated : a)))
        setSelected(updated)
        setAssignFunder("")
        setAssignAmount("")
        setActionLoading(false)
        showToast("Assignment saved.")
      })
      .catch(() => {
        setActionLoading(false)
        showToast("Failed to save assignment.", "error")
      })
  }

  const filtered = apps.filter((a) => {
    const matchSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.institution.toLowerCase().includes(search.toLowerCase()) ||
      a.funder.toLowerCase().includes(search.toLowerCase()) ||
      (a.refNumber ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "All" || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    All: apps.length,
    Submitted: apps.filter((a) => a.status === "Submitted").length,
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
            "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-2 px-4 py-3 rounded-sm shadow-lg text-sm font-sans font-semibold border",
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
        {(["All", "Submitted", "Under Review", "Approved", "Rejected"] as const).map((s) => (
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
          placeholder="Search by name, reference, institution, funder…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search applications"
        />
      </div>

      {loadingData ? (
        <div className="py-12 text-center text-sm text-[#9CA3AF] font-sans">Loading applications…</div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-sm overflow-x-auto">
          <table className="w-full text-sm font-sans min-w-[750px]" role="table">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F5F6F8]">
                {["Ref / Student", "Institution / Funder", "Amount", "Docs", "Status", "Action"].map((h) => (
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
                    {app.refNumber && (
                      <p className="text-[10px] text-[#F5A623] font-mono mt-0.5 font-semibold">{app.refNumber}</p>
                    )}
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
                    <span className="text-xs text-[#F5A623] font-sans hover:underline">
                      {app.status === "Approved" || app.status === "Rejected" ? "View" : "Review"}
                    </span>
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
              {/* Name + ref at top */}
              <div>
                <p className="text-base font-semibold text-[#1A1A2E] font-sans">{selected.studentName}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{selected.studentNo}</p>
                {selected.refNumber && (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-sm px-2.5 py-1">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="1" y="1" width="10" height="10" rx="1" stroke="#F5A623" strokeWidth="1.25" />
                      <path d="M3.5 6h5M3.5 4h5M3.5 8h3" stroke="#F5A623" strokeWidth="1.25" strokeLinecap="round" />
                    </svg>
                    <span className="text-[10px] font-mono font-semibold text-[#A06B00]">{selected.refNumber}</span>
                  </div>
                )}
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

              <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-sm p-3 flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.idVerified ? "bg-emerald-400" : "bg-[#D1D5DB]"}`} />
                  <span className="text-xs text-[#6B7280] font-sans">ID Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.docsComplete ? "bg-emerald-400" : "bg-[#D1D5DB]"}`} />
                  <span className="text-xs text-[#6B7280] font-sans">
                    Docs {selected.docsUploadedCount ?? 0}/{selected.docsRequiredCount ?? 4}
                  </span>
                </div>
              </div>

              {/* Funder / amount assignment — only if not finally decided */}
              {selected.status !== "Approved" && selected.status !== "Rejected" && (
                <div className="border border-[#E5E7EB] bg-[#F5F6F8] rounded-sm p-3 flex flex-col gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">Assign Funder &amp; Amount</p>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-1 font-sans">Funder</label>
                    <select
                      value={assignFunder}
                      onChange={(e) => setAssignFunder(e.target.value)}
                      className="w-full border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs font-sans outline-none focus:border-[#F5A623] rounded-sm appearance-none"
                    >
                      <option value="">{selected.funder && selected.funder !== "Unassigned" ? selected.funder : "Select funder…"}</option>
                      {FUNDERS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-1 font-sans">Bursary Amount (ZAR)</label>
                    <input
                      type="text"
                      value={assignAmount}
                      onChange={(e) => setAssignAmount(e.target.value)}
                      placeholder={selected.amount ? String(selected.amount) : "e.g. 45000"}
                      className="w-full border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs font-sans font-mono outline-none focus:border-[#F5A623] rounded-sm"
                    />
                  </div>
                  <button
                    onClick={saveAssignment}
                    disabled={actionLoading || (!assignFunder && !assignAmount)}
                    className="w-full py-1.5 text-xs font-semibold font-sans bg-[#1A2B4A] text-white hover:bg-[#1A2B4A]/80 rounded-sm transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {actionLoading ? "Saving…" : "Save Assignment"}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Status:</span>
                <span className={statusBadge(selected.status)}>{selected.status}</span>
              </div>

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
            </div>
          </div>
        )}
      </div>
      )}
    </main>
  )
}

// ── Skills tracker ────────────────────────────────────────────────────────────

function AdminSkillsTracker() {
  const [students, setStudents] = useState<FunderStudent[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [filterInstitution, setFilterInstitution] = useState("")
  const [filterCompletion, setFilterCompletion] = useState("")

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data: FunderStudent[]) => {
        setStudents(data)
        setLoadingData(false)
      })
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const toggleModule = async (studentId: string, moduleName: string, currentComplete: boolean) => {
    const key = `${studentId}:${moduleName}`
    setTogglingKey(key)
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, moduleName, complete: !currentComplete }),
      })
      if (!res.ok) throw new Error()
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, modules: s.modules.map((m) => m.name === moduleName ? { ...m, complete: !currentComplete } : m) }
            : s
        )
      )
      showToast(`${moduleName} marked as ${!currentComplete ? "complete" : "incomplete"}.`)
    } catch {
      showToast("Failed to update module. Please try again.")
    } finally {
      setTogglingKey(null)
    }
  }

  const avgProgress = students.length
    ? Math.round(students.reduce((a, s) => a + progressPct(s.modules), 0) / students.length)
    : 0
  const totalActive = students.filter((s) => s.status === "Approved" || s.status === "Disbursed").length

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.institution.toLowerCase().includes(search.toLowerCase())
    const matchInstitution = !filterInstitution || s.institution === filterInstitution
    const pct = progressPct(s.modules)
    const matchCompletion =
      !filterCompletion ||
      (filterCompletion === "0" && pct === 0) ||
      (filterCompletion === "incomplete" && pct > 0 && pct < 100) ||
      (filterCompletion === "100" && pct === 100)
    
    return matchSearch && matchInstitution && matchCompletion
  })

  const institutions = Array.from(new Set(students.map((s) => s.institution))).sort()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-2 px-4 py-3 bg-white border border-emerald-300 text-emerald-700 rounded-sm shadow-lg text-sm font-semibold font-sans">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Admin Portal</p>
        <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">Skills Development Tracker</h1>
        <p className="text-sm text-[#6B7280] mt-1">Monitor module completion and manage financial disbursements for all funded students.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-8 border border-[#E5E7EB] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB] rounded-sm overflow-hidden">
        {[
          { label: "Total Students", value: String(students.length) },
          { label: "Active Bursaries", value: String(totalActive) },
          { label: "Avg. Completion", value: `${avgProgress}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1">{kpi.label}</p>
            <p className="text-xl font-semibold font-serif text-[#F5A623]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3 flex-wrap items-end">
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
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
        <div>
          <label htmlFor="filter-institution" className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans mb-1 block">Institution</label>
          <select
            id="filter-institution"
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-sans outline-none focus:border-[#F5A623] transition-colors rounded-sm appearance-none"
          >
            <option value="">All institutions</option>
            {institutions.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-completion" className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans mb-1 block">Completion</label>
          <select
            id="filter-completion"
            value={filterCompletion}
            onChange={(e) => setFilterCompletion(e.target.value)}
            className="border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-sans outline-none focus:border-[#F5A623] transition-colors rounded-sm appearance-none"
          >
            <option value="">All students</option>
            <option value="0">Not started</option>
            <option value="incomplete">In progress</option>
            <option value="100">All complete</option>
          </select>
        </div>
      </div>

      {loadingData ? (
        <div className="py-12 text-center text-sm text-[#9CA3AF] font-sans">Loading students…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#9CA3AF] font-sans">No students found.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((s) => {
            const pct = progressPct(s.modules)
            const completedCount = s.modules.filter((m) => m.complete).length
            return (
              <div key={s.id} className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
                {/* Student header */}
                <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F5F6F8] flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-[#1A1A2E] text-sm font-sans">{s.name}</p>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">{s.studentNo}</span>
                      
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#1A2B4A]/5 border border-[#1A2B4A]/10 text-xs font-mono font-semibold text-[#1A2B4A]">
                        Award: {formatZAR(s.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{s.institution} &mdash; {s.programme}</p>
                  </div>
                  <div className="flex-shrink-0 sm:text-right">
                    <div className="flex sm:justify-end items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-[#1A1A2E] font-sans">{pct}%</span>
                      <span className="text-xs text-[#9CA3AF]">({completedCount}/{s.modules.length} modules)</span>
                      {pct === 100 && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm">All Complete</span>
                      )}
                    </div>
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden w-full sm:w-40">
                      <div
                        className="h-full bg-[#F5A623] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                </div>

                {/* Module rows */}
                <div className="divide-y divide-[#E5E7EB]">
                  {s.modules.map((m) => {
                    const key = `${s.id}:${m.name}`
                    const isToggling = togglingKey === key
                    return (
                      <div key={m.name} className="px-5 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        {/* Status dot */}
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${m.complete ? "bg-emerald-400" : "bg-[#D1D5DB]"}`}
                          aria-hidden="true"
                        />
                        {/* Module name */}
                        <span className="flex-1 text-sm text-[#1A1A2E] font-sans min-w-0">{m.name}</span>
                        {/* Status dropdown */}
                        <select
                          value={m.complete ? "complete" : "incomplete"}
                          onChange={(e) => {
                            const newComplete = e.target.value === "complete"
                            if (newComplete !== m.complete) {
                              toggleModule(s.id, m.name, m.complete)
                            }
                          }}
                          disabled={isToggling}
                          className="flex-shrink-0 px-2.5 py-1.5 text-xs font-semibold font-sans rounded-sm border transition-colors appearance-none cursor-pointer disabled:opacity-50 bg-white"
                          style={{
                            borderColor: m.complete ? "#86efac" : "#fed7aa",
                            backgroundColor: m.complete ? "#f0fdf4" : "#fffbeb",
                            color: m.complete ? "#166534" : "#b45309",
                          }}
                          aria-label={`Mark ${m.name} as`}
                        >
                          <option value="incomplete">Incomplete</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF] font-sans">Showing {filtered.length} of {students.length} enrolled students — 2026 cohort</p>
        <p className="text-xs text-[#9CA3AF] font-sans">Last synced: {new Date().toLocaleDateString("en-ZA")}</p>
      </div>
    </main>
  )
}

// ── Funders management ────────────────────────────────────────────────────────

interface FunderRow {
  id: string
  name: string
  contact: string
  email: string
  budget: number
  students: number
  level: number
  status: string
}

function AdminFunders() {
  const [funders, setFunders] = useState<FunderRow[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetch("/api/funders")
      .then((r) => r.json())
      .then((data: FunderRow[]) => {
        setFunders(data)
        setLoadingData(false)
      })
  }, [])

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      {loadingData ? (
        <div className="py-12 text-center text-sm text-[#9CA3AF] font-sans">Loading funders…</div>
      ) : (
      <div className="flex flex-col gap-4">
        {funders.map((f) => (
          <div key={f.id} className="bg-white border border-[#E5E7EB] rounded-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 bg-white flex-shrink-0">
              <Image
                src={SPONSOR_LOGOS[f.name] || "/placeholder-logo.svg"}
                alt={f.name}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[#1A1A2E] font-sans">{f.name}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm font-sans ${statusColor[f.status] ?? "bg-[#F5F6F8] text-[#9CA3AF]"}`}>{f.status}</span>
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
      )}
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
