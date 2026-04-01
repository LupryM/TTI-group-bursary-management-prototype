"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { THANDI_WORKSHOPS, formatZAR } from "@/lib/mock-data"

const THANDI_DOCS = [
  { label: "South African ID (certified)", uploaded: true },
  { label: "Proof of Registration / Acceptance Letter", uploaded: true },
  { label: "Full Academic Record", uploaded: true },
  { label: "Head & Shoulders Photograph", uploaded: false },
]

const SIPHO_DOCS = [
  { label: "South African ID (certified)", uploaded: true },
  { label: "Proof of Registration / Acceptance Letter", uploaded: false },
  { label: "Full Academic Record", uploaded: false },
  { label: "Head & Shoulders Photograph", uploaded: false },
]

const statusBadge = (variant: string) => {
  const base = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold tracking-wide font-sans rounded-sm"
  if (variant === "Approved") return `${base} bg-emerald-100 text-emerald-700`
  if (variant === "Under Review") return `${base} bg-amber-100 text-amber-700`
  if (variant === "Pending") return `${base} bg-[#F5F6F8] text-[#6B7280]`
  if (variant === "Rejected") return `${base} bg-red-100 text-red-600`
  if (variant === "gold") return `${base} bg-[#F5A623]/15 text-[#A06B00] font-mono`
  if (variant === "upcoming") return `${base} bg-[#1A2B4A]/8 text-[#1A2B4A]`
  return `${base} bg-[#F5F6F8] text-[#6B7280]`
}

export function StudentDashboard() {
  const { user } = useAuth()
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

  if (!user || user.role !== "student") return null

  const isThandi = user.id === "student-1"
  const docs = isThandi ? THANDI_DOCS : SIPHO_DOCS
  const workshops = isThandi
    ? THANDI_WORKSHOPS
    : THANDI_WORKSHOPS.map((w) => ({ ...w, status: "Upcoming" as const }))

  const completedDocs = docs.filter((d) => d.uploaded).length
  const totalDocs = docs.length

  const bursaryDetails = [
    { label: "Application Status", value: user.status ?? "Pending", isBadge: true },
    { label: "Academic Year", value: "2026", isBadge: false },
    { label: "Funder", value: user.funderName ?? "—", isBadge: false },
    { label: "Institution", value: user.institution ?? "—", isBadge: false },
    { label: "Programme", value: user.programme ?? "—", isBadge: false },
    { label: "Bursary Amount", value: formatZAR(user.bursaryAmount ?? 0), isBadge: true, variant: "gold" },
  ]

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setUploadedFile(file.name)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadedFile(file.name)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Welcome Banner */}
      <section className="bg-[#1A2B4A] text-white mb-8 rounded-sm overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1.5 bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
          <div className="px-6 sm:px-8 py-6 flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-white/50 font-sans mb-1">
              Student Portal &mdash; 2026 Academic Year
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-white leading-tight">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xl font-sans">
              {user.status === "Approved"
                ? <>Your bursary is active and your account is in good standing. Ensure all outstanding documents are submitted before <span className="text-[#F5A623] font-medium">30 April 2026</span>.</>
                : <>Your application is currently <span className="text-[#F5A623] font-medium">{user.status}</span>. Our team will contact you within 5–7 business days.</>
              }
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:flex flex-col items-end justify-center pr-8 gap-3">
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Student No.</p>
              <p className="text-white font-semibold font-mono text-sm">{user.studentNo}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Ref</p>
              <p className="text-[#F5A623] font-semibold font-mono text-sm">{user.refNo}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Progress strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Status", value: user.status ?? "Pending" },
          { label: "Year", value: user.year ?? "—" },
          { label: "Documents", value: `${completedDocs} / ${totalDocs}` },
          { label: "Workshops", value: `${workshops.filter(w => w.status === "Attended").length} / ${workshops.length}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E5E7EB] rounded-sm px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans mb-1">{stat.label}</p>
            <p className="text-base font-semibold text-[#F5A623] font-sans">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left col */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Bursary Status Grid */}
          <section>
            <SectionHeader>Bursary Details</SectionHeader>
            <div className="bg-white border border-[#E5E7EB] rounded-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-[#E5E7EB]">
                {bursaryDetails.map((item) => (
                  <div key={item.label} className="p-4">
                    <p className="text-[10px] font-sans uppercase tracking-widest text-[#9CA3AF] mb-1.5">
                      {item.label}
                    </p>
                    {item.isBadge ? (
                      <span className={statusBadge(item.variant ?? item.value)}>{item.value}</span>
                    ) : (
                      <p className="text-sm font-medium text-[#1A1A2E] font-sans">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Skills Workshops */}
          <section>
            <SectionHeader>Skills Workshops</SectionHeader>
            <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
              <table className="w-full text-sm font-sans" role="table">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F5F6F8]">
                    {["Workshop", "Date", "Facilitator", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workshops.map((ws, idx) => (
                    <tr key={ws.id} className={`border-b border-[#E5E7EB] last:border-0 ${idx % 2 === 1 ? "bg-[#F5F6F8]" : "bg-white"}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A1A2E]">{ws.title}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{ws.duration}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B7280]">{ws.date}</td>
                      <td className="px-4 py-3 text-xs text-[#6B7280] hidden sm:table-cell">{ws.facilitator}</td>
                      <td className="px-4 py-3">
                        <span className={statusBadge(ws.status === "Attended" ? "Approved" : "upcoming")}>
                          {ws.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-8">
          {/* Document Checklist */}
          <section>
            <SectionHeader>Document Checklist</SectionHeader>
            <div className="bg-white border border-[#E5E7EB] rounded-sm">
              {docs.map((doc, idx) => (
                <div
                  key={doc.label}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-sans ${idx !== docs.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}
                >
                  <span
                    className={`flex-shrink-0 w-4 h-4 ${doc.uploaded ? "text-[#F5A623]" : "text-[#D1D5DB]"}`}
                    aria-hidden="true"
                  >
                    {doc.uploaded ? (
                      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                        <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4.5 8.5L7 11L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                        <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </span>
                  <span className={doc.uploaded ? "text-[#1A1A2E] text-sm" : "text-[#9CA3AF] text-sm"}>
                    {doc.label}
                  </span>
                  {!doc.uploaded && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[#F5A623] bg-[#F5A623]/10 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* doc progress */}
            <div className="mt-2 bg-white border border-[#E5E7EB] rounded-sm px-4 py-2 flex items-center justify-between gap-3">
              <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F5A623] rounded-full transition-all"
                  style={{ width: `${(completedDocs / totalDocs) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-sans whitespace-nowrap">
                {completedDocs} of {totalDocs} uploaded
              </span>
            </div>
          </section>

          {/* Upload Zone */}
          <section>
            <SectionHeader>Upload Document</SectionHeader>
            <label
              htmlFor="doc-upload"
              className={[
                "block bg-white border cursor-pointer transition-colors rounded-sm",
                dragOver
                  ? "border-[#F5A623] bg-[#F5A623]/5"
                  : "border-dashed border-[#D1D5DB] hover:border-[#F5A623]/60",
              ].join(" ")}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center py-7 px-4 text-center">
                <svg width="30" height="30" viewBox="0 0 32 32" fill="none" className="text-[#F5A623]/60 mb-3" aria-hidden="true">
                  <path d="M10.667 21.333C7.721 21.333 5.333 18.946 5.333 16c0-2.588 1.806-4.754 4.22-5.24A6.667 6.667 0 0 1 22.667 12h.666a5.334 5.334 0 0 1 0 10.667H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M16 20v-8m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {uploadedFile ? (
                  <>
                    <p className="text-sm font-medium text-emerald-700 font-sans">{uploadedFile}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">File ready for submission</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[#1A1A2E] font-sans">
                      Drop file or{" "}
                      <span className="text-[#F5A623] underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">PDF, JPG, PNG — max 10 MB</p>
                  </>
                )}
              </div>
              <input id="doc-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFileChange} aria-label="Upload supporting document" />
            </label>
            {uploadedFile && (
              <button
                onClick={() => setUploadedFile(null)}
                className="mt-2 w-full py-2 text-xs text-[#6B7280] font-sans border border-[#E5E7EB] bg-white hover:bg-[#F5F6F8] transition-colors rounded-sm"
              >
                Clear selection
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] tracking-widest uppercase text-[#6B7280] font-sans font-semibold mb-3 flex items-center gap-2">
      <span className="w-3 h-px bg-[#F5A623]" aria-hidden="true" />
      {children}
    </h2>
  )
}
