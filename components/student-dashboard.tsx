"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { formatZAR, Workshop, Application } from "@/lib/mock-data"
import { REQUIRED_DOCS as REQUIRED_DOC_DEFS } from "@/lib/documents"

// Map funder names to logo files
const SPONSOR_LOGOS: Record<string, string> = {
  "Shell South Africa": "/Shell-Logo.png",
  "Anglo American plc": "/Anglo_American_plc-Logo.wine.png",
  "Sasol Bursaries": "/Sasol-Logo.wine.png",
  "Nedbank Foundation": "/nedbank-logo-png-transparent.png",
}

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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] tracking-widest uppercase text-[#6B7280] font-sans font-semibold mb-3 flex items-center gap-2">
      <span className="w-3 h-px bg-[#F5A623]" aria-hidden="true" />
      {children}
    </h2>
  )
}

// ─── Shared document state helpers ───────────────────────────────────────────

interface DocState {
  uploads: Record<string, string | null>
  selectedDocType: string
  setSelectedDocType: (v: string) => void
  dragOver: boolean
  setDragOver: (v: boolean) => void
  uploadError: string | null
  uploadSuccess: string | null
  handleFileUpload: (file: File) => Promise<void>
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function useDocState(userId: string): DocState {
  const [uploads, setUploads] = useState<Record<string, string | null>>({})
  const [selectedDocType, setSelectedDocType] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/documents?ownerId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data: { docs: Record<string, { fileName: string } | null> }) => {
        const next: Record<string, string | null> = {}
        for (const d of REQUIRED_DOC_DEFS) next[d.key] = data.docs?.[d.key]?.fileName ?? null
        setUploads(next)
      })
      .catch(() => {})
  }, [userId])

  const docLabel = (key: string) => REQUIRED_DOC_DEFS.find((d) => d.key === key)?.label ?? key

  const handleFileUpload = async (file: File) => {
    setUploadError(null)
    if (!selectedDocType) {
      setUploadError("Please select which document you are uploading before choosing a file.")
      return
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowed.includes(file.type)) {
      setUploadError("Only PDF, JPG, and PNG files are accepted.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be 10 MB or less.")
      return
    }
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: userId, docType: selectedDocType, fileName: file.name }),
      })
      if (!res.ok) throw new Error("Upload failed")
      setUploads((prev) => ({ ...prev, [selectedDocType]: file.name }))
      setUploadSuccess(`"${docLabel(selectedDocType)}" uploaded successfully.`)
      setSelectedDocType("")
      setTimeout(() => setUploadSuccess(null), 3000)
    } catch {
      setUploadError("Could not save upload. Please try again.")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ""
  }

  return {
    uploads, selectedDocType, setSelectedDocType, dragOver, setDragOver,
    uploadError, uploadSuccess, handleFileUpload, handleDrop, handleFileChange,
  }
}

// ─── Document checklist + upload panel (shared between both views) ────────────

function DocumentPanel({ docState }: { docState: DocState }) {
  const {
    uploads, selectedDocType, setSelectedDocType, dragOver, setDragOver,
    uploadError, uploadSuccess, handleDrop, handleFileChange,
  } = docState
  const completedDocs = Object.values(uploads).filter(Boolean).length
  const totalDocs = REQUIRED_DOC_DEFS.length
  const docLabel = (key: string) => REQUIRED_DOC_DEFS.find((d) => d.key === key)?.label ?? key

  return (
    <>
      <section>
        <SectionHeader>Document Checklist</SectionHeader>
        <div className="bg-white border border-[#E5E7EB] rounded-sm">
          {REQUIRED_DOC_DEFS.map(({ key, label }, idx) => {
            const fileName = uploads[key]
            return (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-sans ${idx !== REQUIRED_DOC_DEFS.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}
              >
                <span className={`flex-shrink-0 w-4 h-4 ${fileName ? "text-[#F5A623]" : "text-[#D1D5DB]"}`} aria-hidden="true">
                  {fileName ? (
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
                <div className="flex-1 min-w-0">
                  <span className={fileName ? "text-[#1A1A2E] text-sm" : "text-[#9CA3AF] text-sm"}>{label}</span>
                  {fileName && (
                    <p className="text-[10px] text-[#9CA3AF] font-mono truncate mt-0.5">{fileName}</p>
                  )}
                </div>
                {!fileName && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[#F5A623] bg-[#F5A623]/10 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                    Pending
                  </span>
                )}
              </div>
            )
          })}
        </div>
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

      <section>
        <SectionHeader>Upload Document</SectionHeader>
        <div className="mb-3">
          <label htmlFor="doc-type-select" className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-1.5">
            1. Select document type
          </label>
          <select
            id="doc-type-select"
            value={selectedDocType}
            onChange={(e) => { setSelectedDocType(e.target.value) }}
            className="w-full border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-[#F5A623] transition-colors rounded-sm appearance-none"
          >
            <option value="">Choose document…</option>
            {REQUIRED_DOC_DEFS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}{uploads[d.key] ? " ✓ (replace)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-1.5">2. Upload file</p>
          <label
            htmlFor="doc-upload"
            className={[
              "block bg-white border cursor-pointer transition-colors rounded-sm",
              !selectedDocType ? "opacity-50 cursor-not-allowed" : "",
              dragOver ? "border-[#F5A623] bg-[#F5A623]/5" : "border-dashed border-[#D1D5DB] hover:border-[#F5A623]/60",
            ].join(" ")}
            onDragOver={(e) => { if (!selectedDocType) return; e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-[#F5A623]/60 mb-2" aria-hidden="true">
                <path d="M10.667 21.333C7.721 21.333 5.333 18.946 5.333 16c0-2.588 1.806-4.754 4.22-5.24A6.667 6.667 0 0 1 22.667 12h.666a5.334 5.334 0 0 1 0 10.667H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 20v-8m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {selectedDocType ? (
                <p className="text-sm font-medium text-[#1A1A2E] font-sans">
                  Drop <span className="text-[#F5A623]">{docLabel(selectedDocType)}</span> or{" "}
                  <span className="text-[#F5A623] underline underline-offset-2">browse</span>
                </p>
              ) : (
                <p className="text-sm font-medium text-[#9CA3AF] font-sans">Select document type first</p>
              )}
              <p className="text-xs text-[#9CA3AF] mt-1">PDF, JPG, PNG — max 10 MB</p>
            </div>
            <input id="doc-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFileChange} disabled={!selectedDocType} aria-label="Upload supporting document" />
          </label>
        </div>

        {uploadError && (
          <p className="text-[10px] text-red-500 font-sans mt-1.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {uploadError}
          </p>
        )}
        {uploadSuccess && (
          <p className="text-[10px] text-emerald-600 font-sans mt-1.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 6.5L5.5 8.5L8.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            {uploadSuccess}
          </p>
        )}
      </section>
    </>
  )
}

// ─── No Application View (new student, hasn't applied yet) ───────────────────

function NoApplicationView({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Welcome banner */}
      <section className="bg-[#1A2B4A] text-white mb-8 rounded-sm overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1.5 bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
          <div className="px-6 sm:px-8 py-6 flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-white/50 font-sans mb-1">
              Student Portal &mdash; 2026 Academic Year
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-white leading-tight">
              Welcome, {user.name.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xl font-sans">
              Your account is set up. The next step is to submit your bursary application.
            </p>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-3">
            <span className="w-1 h-4 bg-[#F5A623] flex-shrink-0 rounded-full" aria-hidden="true" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B4A] font-sans">
              No Application Found
            </h2>
          </div>
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="#F5A623" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#1A2B4A] mb-2">
              Ready to apply for a bursary?
            </h3>
            <p className="text-sm text-[#6B7280] font-sans leading-relaxed mb-6 max-w-sm mx-auto">
              Complete your bursary application to get started. You will need your SA ID number, proof of registration, academic record, and a financial need statement.
            </p>
            <Link
              href="/apply"
              className="inline-block px-8 py-3 bg-[#F5A623] text-[#1A2B4A] text-sm font-semibold font-sans rounded-sm hover:bg-[#D4891A] hover:text-white transition-colors"
            >
              Start Application
            </Link>
          </div>
        </div>

        {/* What to expect */}
        <div className="mt-6 bg-white border border-[#E5E7EB] rounded-sm p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] font-sans mb-4">What happens next</p>
          <ol className="space-y-3">
            {[
              "Submit your application with all required documents",
              "TTI reviews your application (5–7 business days)",
              "If approved, a funder and bursary amount are assigned",
              "Your student portal unlocks with full bursary details",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#4B5563] font-sans">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F5A623]/15 text-[#A06B00] text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  )
}

// ─── Applicant View (Pending / Under Review) ──────────────────────────────────

const STEPS = [
  { label: "Application Submitted", key: "submitted" },
  { label: "Under Review", key: "review" },
  { label: "Documents Verified", key: "docs" },
  { label: "Decision Made", key: "decision" },
]

function stepIndex(app: Application): number {
  if (app.status === "Approved" || app.status === "Rejected") return 3
  if (app.idVerified && app.docsComplete) return 2
  if (app.status === "Under Review") return 1
  return 0
}

function ApplicantView({ app, docState }: { app: Application; docState: DocState }) {
  const activeStep = stepIndex(app)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* Banner */}
      <section className="bg-[#1A2B4A] text-white mb-8 rounded-sm overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1.5 bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
          <div className="px-6 sm:px-8 py-6 flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-white/50 font-sans mb-1">
              Applicant Portal &mdash; 2026 Academic Year
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-white leading-tight">
              Application in Progress
            </h1>
            <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xl font-sans">
              Your application is currently <span className="text-[#F5A623] font-medium">{app.status}</span>. Our team will contact you within 5–7 business days.
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:flex flex-col items-end justify-center pr-8 gap-3">
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Reference</p>
              <p className="text-[#F5A623] font-semibold font-mono text-sm">{app.refNumber ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Submitted</p>
              <p className="text-white font-semibold font-mono text-sm">{app.submittedDate}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Status Stepper */}
          <section>
            <SectionHeader>Application Status</SectionHeader>
            <div className="bg-white border border-[#E5E7EB] rounded-sm p-6">
              <ol className="relative">
                {STEPS.map((step, i) => {
                  const done = i < activeStep
                  const active = i === activeStep
                  const last = i === STEPS.length - 1
                  return (
                    <li key={step.key} className={`flex gap-4 ${last ? "" : "pb-6"}`}>
                      {/* spine */}
                      <div className="flex flex-col items-center">
                        <div className={[
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-sans",
                          done ? "bg-[#F5A623] text-white" : active ? "bg-[#1A2B4A] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]",
                        ].join(" ")}>
                          {done ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path d="M2 6.5L4.5 9L10 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          ) : i + 1}
                        </div>
                        {!last && <div className={`w-px flex-1 mt-1 ${done ? "bg-[#F5A623]" : "bg-[#E5E7EB]"}`} />}
                      </div>
                      {/* label */}
                      <div className="pt-1 pb-1">
                        <p className={`text-sm font-semibold font-sans ${active ? "text-[#1A2B4A]" : done ? "text-[#F5A623]" : "text-[#9CA3AF]"}`}>
                          {step.label}
                        </p>
                        {active && (
                          <p className="text-xs text-[#6B7280] font-sans mt-0.5">Currently at this stage</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>

          {/* Application summary */}
          <section>
              <SectionHeader>Application Summary</SectionHeader>
              <div className="bg-white border border-[#E5E7EB] rounded-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-[#E5E7EB]">
                  {[
                    { label: "Status", value: app.status, badge: true },
                    { label: "Institution", value: app.institution },
                    { label: "Programme", value: app.programme },
                    { label: "Year", value: app.year },
                    { label: "Submitted", value: app.submittedDate },
                    { label: "ID Verified", value: app.idVerified ? "Yes" : "Pending" },
                  ].map((item) => (
                    <div key={item.label} className="p-4">
                      <p className="text-[10px] font-sans uppercase tracking-widest text-[#9CA3AF] mb-1.5">{item.label}</p>
                      {item.badge
                        ? <span className={statusBadge(item.value)}>{item.value}</span>
                        : <p className="text-sm font-medium text-[#1A1A2E] font-sans">{item.value}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>
            </section>
        </div>

        {/* Right column — document panel */}
        <div className="flex flex-col gap-8">
          <DocumentPanel docState={docState} />
        </div>
      </div>
    </main>
  )
}

// ─── Bursary Holder View (Approved) ──────────────────────────────────────────

interface BursaryHolderViewProps {
  app: Application
  docState: DocState
  workshops: Workshop[]
  workshopsLoading: boolean
}

function BursaryHolderView({ app, docState, workshops, workshopsLoading }: BursaryHolderViewProps) {
  const { user } = useAuth()
  const { uploads } = docState
  const completedDocs = Object.values(uploads).filter(Boolean).length
  const totalDocs = REQUIRED_DOC_DEFS.length

  const bursaryDetails = [
    { label: "Application Status", value: app.status, isBadge: true },
    { label: "Academic Year", value: "2026", isBadge: false },
    { label: "Funder", value: app.funder, isBadge: false },
    { label: "Institution", value: app.institution, isBadge: false },
    { label: "Programme", value: app.programme, isBadge: false },
    { label: "Bursary Amount", value: formatZAR(app.amount), isBadge: true, variant: "gold" },
  ]

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
              Welcome back, {user?.name.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xl font-sans">
              Your bursary is active and your account is in good standing. Ensure all outstanding documents are submitted before{" "}
              <span className="text-[#F5A623] font-medium">30 April 2026</span>.
            </p>
          </div>
          <div className="flex-shrink-0 hidden sm:flex flex-col items-end justify-center pr-8 gap-3">
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Student No.</p>
              <p className="text-white font-semibold font-mono text-sm">{app.studentNo || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Ref</p>
              <p className="text-[#F5A623] font-semibold font-mono text-sm">{app.refNumber ?? "—"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Progress strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Status", value: app.status },
          { label: "Year", value: app.year },
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
          {/* Bursary Details Grid */}
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
                    ) : item.label === "Funder" ? (
                      <div className="flex items-center gap-2">
                        {SPONSOR_LOGOS[item.value] && (
                          <Image
                            src={SPONSOR_LOGOS[item.value]}
                            alt={item.value}
                            width={32}
                            height={24}
                            className="object-contain h-6 w-auto"
                          />
                        )}
                        <p className="text-sm font-medium text-[#1A1A2E] font-sans">{item.value}</p>
                      </div>
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
                  {workshopsLoading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-sm text-[#9CA3AF]">Loading workshops…</td></tr>
                  ) : workshops.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-sm text-[#9CA3AF]">No workshops scheduled yet.</td></tr>
                  ) : workshops.map((ws, idx) => (
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

        {/* Right col — document panel */}
        <div className="flex flex-col gap-8">
          <DocumentPanel docState={docState} />
        </div>
      </div>
    </main>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function StudentDashboard() {
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [appLoading, setAppLoading] = useState(true)
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [workshopsLoading, setWorkshopsLoading] = useState(true)

  const docState = useDocState(user?.id ?? "")

  useEffect(() => {
    if (!user) return
    // Fetch the live application record linked to this user
    fetch(`/api/applications?ownerId=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((apps: Application[]) => {
        setApplication(apps[0] ?? null)
        setAppLoading(false)
      })
      .catch(() => setAppLoading(false))

    fetch(`/api/workshops?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data: Workshop[]) => { setWorkshops(data); setWorkshopsLoading(false) })
      .catch(() => setWorkshopsLoading(false))
  }, [user])

  if (!user || user.role !== "student") return null

  if (appLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-[#9CA3AF] font-sans">Loading your dashboard…</p>
      </div>
    )
  }

  // 1. No application at all → prompt them to apply
  if (!application) {
    return <NoApplicationView user={user} />
  }

  // 2. Approved → full bursary holder portal
  if (application.status === "Approved") {
    return (
      <BursaryHolderView
        app={application}
        docState={docState}
        workshops={workshops}
        workshopsLoading={workshopsLoading}
      />
    )
  }

  // 3. Pending / Under Review / Rejected → applicant status tracker
  return <ApplicantView app={application} docState={docState} />
}
