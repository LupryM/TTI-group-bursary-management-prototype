"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { formatZAR, progressPct, FunderStudent } from "@/lib/mock-data"
import type { FunderView } from "@/components/nav-bar"

// Map funder names to logo files
const SPONSOR_LOGOS: Record<string, string> = {
  "Shell South Africa": "/Shell-Logo.png",
  "Anglo American plc": "/Anglo_American_plc-Logo.wine.png",
  "Sasol Bursaries": "/Sasol-Logo.wine.png",
  "Nedbank Foundation": "/nedbank-logo-png-transparent.png",
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] tracking-widest uppercase text-[#6B7280] font-sans font-semibold mb-3 flex items-center gap-2">
      <span className="w-3 h-px bg-[#F5A623]" aria-hidden="true" />
      {children}
    </h2>
  )
}

function StatCard({ label, value, sub, gold }: { label: string; value: string; sub?: string; gold?: boolean }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-sm px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans mb-1">{label}</p>
      <p className={`text-xl font-semibold font-serif ${gold ? "text-[#F5A623]" : "text-[#1A2B4A]"}`}>{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">{sub}</p>}
    </div>
  )
}

const statusBadge = (s: string) => {
  const base = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold tracking-wide font-sans rounded-sm"
  if (s === "Approved") return `${base} bg-emerald-100 text-emerald-700`
  if (s === "Under Review") return `${base} bg-amber-100 text-amber-700`
  if (s === "Pending") return `${base} bg-[#F5F6F8] text-[#6B7280]`
  if (s === "Rejected") return `${base} bg-red-100 text-red-600`
  return `${base} bg-[#F5F6F8] text-[#6B7280]`
}

// ── Overview ─────────────────────────────────────────────────────────────────

function FunderOverview() {
  const { user } = useAuth()
  const [students, setStudents] = useState<FunderStudent[]>([])

  useEffect(() => {
    if (!user) return
    fetch(`/api/students?funderId=${user.id}`)
      .then((r) => r.json())
      .then(setStudents)
  }, [user])

  if (!user) return null

  const totalDisbursed = students.reduce((a, s) => a + s.disbursed, 0)
  const totalCommitted = students.reduce((a, s) => a + s.amount, 0)
  const approved = students.filter((s) => s.status === "Approved").length
  const avgProgress = students.length
    ? Math.round(students.reduce((a, s) => a + progressPct(s.modules), 0) / students.length)
    : 0

  const disbursementPct = user.totalBudget
    ? Math.round((totalDisbursed / user.totalBudget) * 100)
    : 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Banner */}
      <section className="bg-[#1A2B4A] text-white mb-8 rounded-sm overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1.5 bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
          <div className="px-6 sm:px-8 py-6 flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-white/50 mb-1">Funder Portal — 2026 Academic Year</p>
            <div className="flex items-center gap-3 mb-3">
              {user.company && SPONSOR_LOGOS[user.company] && (
                <Image
                  src={SPONSOR_LOGOS[user.company]}
                  alt={user.company}
                  width={60}
                  height={40}
                  className="object-contain h-10 w-auto"
                />
              )}
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-white">
                Welcome, {user.name.split(" ")[0]}
              </h1>
            </div>
            <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xl">
              Manage your bursary fund for <span className="text-[#F5A623] font-medium">{user.company}</span>. Monitor student progress, disbursements, and B-BBEE compliance in one place.
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:flex flex-col items-end justify-center pr-8 gap-3">
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">B-BBEE Level</p>
              <p className="text-[#F5A623] font-bold font-mono text-xl">{user.bbbeeLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Total Budget</p>
              <p className="text-white font-semibold font-mono text-sm">{formatZAR(user.totalBudget ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Students" value={String(approved)} sub={`of ${students.length} total`} />
        <StatCard label="Total Committed" value={formatZAR(totalCommitted)} gold />
        <StatCard label="Disbursed to Date" value={formatZAR(totalDisbursed)} sub={`${disbursementPct}% of budget`} />
        <StatCard label="Avg. Module Progress" value={`${avgProgress}%`} />
      </div>

      {/* Budget utilisation */}
      <section className="mb-8">
        <SectionHeader>Budget Utilisation</SectionHeader>
        <div className="bg-white border border-[#E5E7EB] rounded-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#6B7280] font-sans">Disbursed</span>
            <span className="text-xs font-semibold text-[#1A1A2E] font-sans">{disbursementPct}% of {formatZAR(user.totalBudget ?? 0)}</span>
          </div>
          <div className="h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F5A623] rounded-full transition-all"
              style={{ width: `${disbursementPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-[#9CA3AF] font-sans">{formatZAR(totalDisbursed)} disbursed</span>
            <span className="text-[10px] text-[#9CA3AF] font-sans">{formatZAR((user.totalBudget ?? 0) - totalDisbursed)} remaining</span>
          </div>
        </div>
      </section>

      {/* Student snapshot */}
      <section>
        <SectionHeader>Student Snapshot</SectionHeader>
        <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans min-w-[600px]" role="table">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F5F6F8]">
                {["Student", "Institution", "Amount", "Progress", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-[#9CA3AF]">No students found.</td></tr>
              ) : students.map((s, idx) => {
                const pct = progressPct(s.modules)
                return (
                  <tr key={s.id} className={`border-b border-[#E5E7EB] last:border-0 ${idx % 2 === 1 ? "bg-[#F5F6F8]" : "bg-white"}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1A2E]">{s.name}</p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{s.studentNo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[#1A1A2E]">{s.institution}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{s.programme}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#F5A623] font-mono">{formatZAR(s.amount)}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{formatZAR(s.disbursed)} disbursed</p>
                    </td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full bg-[#F5A623] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#6B7280] font-sans w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(s.status)}>{s.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </main>
  )
}

// ── Students detail ───────────────────────────────────────────────────────────

function FunderStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState<FunderStudent[]>([])
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetch(`/api/students?funderId=${user.id}`)
      .then((r) => r.json())
      .then(setStudents)
  }, [user])

  if (!user) return null

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.institution.toLowerCase().includes(search.toLowerCase()) ||
      s.programme.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Funder Portal</p>
          <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">My Students</h1>
          <p className="text-sm text-[#6B7280] mt-1">Funded cohort for {user.company} — 2026 academic year.</p>
        </div>
        <div className="relative w-full sm:w-64">
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
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((s) => {
          const pct = progressPct(s.modules)
          const isOpen = expanded === s.id
          return (
            <div key={s.id} className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#F5F6F8] transition-colors"
                onClick={() => setExpanded(isOpen ? null : s.id)}
                aria-expanded={isOpen}
              >
                <div className="w-10 h-10 rounded-full bg-[#1A2B4A] text-white flex items-center justify-center text-sm font-bold font-sans flex-shrink-0">
                  {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A1A2E] font-sans">{s.name}</p>
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{s.institution} — {s.programme}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#F5A623] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-[#6B7280] font-sans w-8">{pct}%</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <p className="text-sm font-semibold text-[#F5A623] font-mono hidden sm:block">{formatZAR(s.amount)}</p>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`text-[#9CA3AF] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[#E5E7EB] px-5 py-5 bg-[#F5F6F8]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: "Bursary Amount", value: formatZAR(s.amount) },
                      { label: "Disbursed", value: formatZAR(s.disbursed) },
                      { label: "Academic Avg.", value: `${s.academicAvg}%` },
                      { label: "Year", value: s.year },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white border border-[#E5E7EB] rounded-sm px-4 py-3">
                        <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-1">{stat.label}</p>
                        <p className="text-sm font-semibold text-[#1A2B4A] font-sans">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-2 font-sans">Module Completion</p>
                  <div className="flex flex-wrap gap-2">
                    {s.modules.map((m) => (
                      <span
                        key={m.name}
                        className={`text-xs px-2.5 py-1 rounded-sm font-sans ${m.complete ? "bg-[#F5A623]/15 text-[#A06B00]" : "bg-[#F5F6F8] text-[#9CA3AF] border border-[#E5E7EB]"}`}
                      >
                        {m.complete ? "✓ " : ""}{m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-[#9CA3AF] font-sans">No students match your search.</div>
        )}
      </div>
    </main>
  )
}

// ── Reports ───────────────────────────────────────────────────────────────────

function FunderReports() {
  const { user } = useAuth()
  const [downloaded, setDownloaded] = useState<string | null>(null)
  if (!user) return null

  const reports = [
    { id: "r1", title: "B-BBEE Skills Development Certificate", period: "2026 Annual", type: "Certificate", size: "245 KB" },
    { id: "r2", title: "Student Progress Report — Q1 2026", period: "Jan–Mar 2026", type: "Progress", size: "1.2 MB" },
    { id: "r3", title: "Disbursement Summary Statement", period: "2026 YTD", type: "Financial", size: "89 KB" },
    { id: "r4", title: "Compliance Scorecard Breakdown", period: "2026 Full Year", type: "Compliance", size: "330 KB" },
  ]

  const handleDownload = (id: string) => {
    setDownloaded(id)
    setTimeout(() => setDownloaded(null), 2000)
  }

  const typeColor: Record<string, string> = {
    Certificate: "bg-emerald-100 text-emerald-700",
    Progress: "bg-[#1A2B4A]/8 text-[#1A2B4A]",
    Financial: "bg-[#F5A623]/15 text-[#A06B00]",
    Compliance: "bg-amber-100 text-amber-700",
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Funder Portal</p>
        <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A]">Compliance Reports</h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-xl">
          Download B-BBEE documentation, student progress reports, and financial statements for <span className="font-medium text-[#1A1A2E]">{user.company}</span>.
        </p>
      </div>

      {/* Compliance badge */}
      <div className="bg-[#1A2B4A] text-white rounded-sm p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Current B-BBEE Status</p>
          <p className="text-3xl font-bold font-serif text-[#F5A623]">Level {user.bbbeeLevel}</p>
          <p className="text-xs text-white/60 mt-1">Skills Development Contributor — Verified 15 Jan 2026</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5.5" stroke="#4ADE80" strokeWidth="1.2" />
              <path d="M3.5 6.5L5 8L8.5 4" stroke="#4ADE80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs text-emerald-300 font-sans font-semibold">Compliant</span>
          </div>
          <p className="text-[10px] text-white/40 font-sans">Next audit: Jan 2027</p>
        </div>
      </div>

      <SectionHeader>Available Reports</SectionHeader>
      <div className="flex flex-col gap-3">
        {reports.map((r) => (
          <div key={r.id} className="bg-white border border-[#E5E7EB] rounded-sm flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 bg-[#F5F6F8] border border-[#E5E7EB] rounded-sm flex items-center justify-center flex-shrink-0 text-[#F5A623]">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M11 2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-5-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M11 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#1A1A2E] font-sans text-sm">{r.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${typeColor[r.type]}`}>{r.type}</span>
                <span className="text-[10px] text-[#9CA3AF] font-sans">{r.period}</span>
                <span className="text-[10px] text-[#9CA3AF] font-sans">{r.size}</span>
              </div>
            </div>
            <button
              onClick={() => handleDownload(r.id)}
              className={[
                "flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold font-sans px-4 py-2 rounded-sm transition-all",
                downloaded === r.id
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white cursor-pointer",
              ].join(" ")}
            >
              {downloaded === r.id ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6.5L5 9.5L10 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Downloaded
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 2v6M3 6l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

interface FunderPortalProps {
  view: FunderView
}

export function FunderPortal({ view }: FunderPortalProps) {
  if (view === "overview") return <FunderOverview />
  if (view === "students") return <FunderStudents />
  return <FunderReports />
}
