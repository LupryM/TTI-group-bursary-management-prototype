"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { REQUIRED_DOCS, getOrCreateGuestOwnerId, clearGuestOwnerId } from "@/lib/documents"

const inputCls =
  "w-full border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-[#F5A623] transition-colors placeholder:text-[#9CA3AF] rounded-sm disabled:bg-[#F5F6F8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
const inputErrCls =
  "w-full border border-red-400 bg-red-50/30 px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-red-500 transition-colors placeholder:text-[#9CA3AF] rounded-sm disabled:bg-[#F5F6F8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-1.5"

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[10px] text-red-500 font-sans mt-1">{msg}</p>
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] mb-6 rounded-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8] flex items-center gap-3">
        <span className="w-1 h-4 bg-[#F5A623] flex-shrink-0 rounded-full" aria-hidden="true" />
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B4A] font-sans">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

type FormState = "idle" | "submitting" | "success" | "error"

interface FormData {
  firstName: string
  lastName: string
  idNumber: string
  studentNumber: string
  email: string
  phone: string
  university: string
  programme: string
  year: string
  annualIncome: string
  needStatement: string
  consent: boolean
}

const UNIVERSITIES = [
  "University of Pretoria",
  "University of the Witwatersrand",
  "University of Cape Town",
  "Stellenbosch University",
  "University of KwaZulu-Natal",
  "University of Johannesburg",
  "Rhodes University",
  "Tshwane University of Technology",
  "Cape Peninsula University of Technology",
  "Durban University of Technology",
  "Nelson Mandela University",
  "University of Limpopo",
  "Walter Sisulu University",
]

export function ApplicationForm() {
  const { user } = useAuth()
  const isStudent = user?.role === "student"

  const [form, setForm] = useState<FormData>({
    firstName: isStudent ? (user?.name.split(" ")[0] ?? "") : "",
    lastName: isStudent ? (user?.name.split(" ").slice(1).join(" ") ?? "") : "",
    idNumber: "",
    studentNumber: isStudent ? (user?.studentNo ?? "") : "",
    email: isStudent ? (user?.email ?? "") : "",
    phone: "",
    university: isStudent ? (user?.institution ?? "") : "",
    programme: isStudent ? (user?.programme ?? "") : "",
    year: isStudent ? (user?.year ?? "") : "",
    annualIncome: "",
    needStatement: "",
    consent: false,
  })

  const [formState, setFormState] = useState<FormState>("idle")
  const [refNumber, setRefNumber] = useState("")
  const [ownerId, setOwnerId] = useState<string>("")
  const [docUploads, setDocUploads] = useState<Record<string, string | null>>(
    Object.fromEntries(REQUIRED_DOCS.map((d) => [d.key, null]))
  )
  const [docError, setDocError] = useState<string | null>(null)

  // Resolve ownerId: logged-in students reuse their user id so their existing
  // uploads flow through; guests get a stable session id.
  useEffect(() => {
    const id = isStudent && user?.id ? user.id : getOrCreateGuestOwnerId()
    setOwnerId(id)
  }, [isStudent, user?.id])

  // Preload existing documents for this owner so the form resumes where the
  // applicant left off (whether refreshing the page or re-opening as a logged
  // in student who already uploaded via their dashboard).
  useEffect(() => {
    if (!ownerId) return
    let cancelled = false
    fetch(`/api/documents?ownerId=${encodeURIComponent(ownerId)}`)
      .then((r) => r.json())
      .then((data: { docs: Record<string, { fileName: string } | null> }) => {
        if (cancelled) return
        const next: Record<string, string | null> = {}
        for (const d of REQUIRED_DOCS) next[d.key] = data.docs?.[d.key]?.fileName ?? null
        setDocUploads(next)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [ownerId])

  const handleDocUpload = (docKey: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowed.includes(file.type)) {
      setDocError("Only PDF, JPG, and PNG files are accepted.")
      e.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocError("File size must be 10 MB or less.")
      e.target.value = ""
      return
    }
    if (!ownerId) return
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, docType: docKey, fileName: file.name }),
      })
      if (!res.ok) throw new Error("Upload failed")
      setDocUploads((prev) => ({ ...prev, [docKey]: file.name }))
    } catch {
      setDocError("Could not save upload. Please try again.")
    }
    e.target.value = ""
  }

  const removeDoc = async (docKey: string) => {
    if (!ownerId) return
    try {
      await fetch(
        `/api/documents?ownerId=${encodeURIComponent(ownerId)}&docType=${encodeURIComponent(docKey)}`,
        { method: "DELETE" }
      )
      setDocUploads((prev) => ({ ...prev, [docKey]: null }))
    } catch {
      setDocError("Could not remove document. Please try again.")
    }
  }

  const uploadedCount = Object.values(docUploads).filter(Boolean).length
  const allDocsUploaded = uploadedCount === REQUIRED_DOCS.length

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setCheck = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, consent: e.target.checked }))

  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "_form" | "_docs", string>>>({})

  const wordCount = form.needStatement.trim().split(/\s+/).filter(Boolean).length

  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof FormData | "_form" | "_docs", string>> = {}
    if (!form.firstName.trim()) errs.firstName = "First name is required."
    if (!form.lastName.trim()) errs.lastName = "Last name is required."
    if (!form.idNumber.trim()) errs.idNumber = "SA ID number is required."
    else if (!/^\d{13}$/.test(form.idNumber.trim())) errs.idNumber = "SA ID must be exactly 13 digits."
    if (!form.email.trim()) errs.email = "Email address is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address."
    if (!form.phone.trim()) errs.phone = "Mobile number is required."
    if (!form.university) errs.university = "Please select an institution."
    if (!form.programme.trim()) errs.programme = "Programme is required."
    if (!form.year) errs.year = "Please select year of study."
    if (!form.annualIncome.trim()) errs.annualIncome = "Household income is required."
    else if (!/^\d[\d\s.,]*$/.test(form.annualIncome.trim().replace(/^R\s?/, "")))
      errs.annualIncome = "Enter a numeric value (e.g. 120000 or R 120,000)."
    if (wordCount < 100) errs.needStatement = `Minimum 100 words required (currently ${wordCount}).`
    if (!allDocsUploaded) {
      const missing = REQUIRED_DOCS.filter((d) => !docUploads[d.key]).map((d) => d.label)
      errs._docs = `Please upload: ${missing.join(", ")}.`
    }
    if (!form.consent) errs._form = "You must accept the consent declaration."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formState === "submitting") return
    if (!validateForm()) return
    setFormState("submitting")
    setErrors({})
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ownerId }),
      })
      if (!res.ok) throw new Error("Submission failed")
      const data = await res.json()
      setRefNumber(data.refNumber)
      setFormState("success")
      // Guest ids are single-use: clear so a subsequent application starts
      // fresh rather than inheriting the previous applicant's uploads.
      if (!isStudent) clearGuestOwnerId()
    } catch {
      setFormState("error")
    }
  }

  const resetForm = () => {
    setFormState("idle")
    setErrors({})
    setDocUploads(Object.fromEntries(REQUIRED_DOCS.map((d) => [d.key, null])))
    // Issue a new ownerId for the next application (students keep their id)
    if (!isStudent) setOwnerId(getOrCreateGuestOwnerId())
    setForm({
      firstName: isStudent ? (user?.name.split(" ")[0] ?? "") : "",
      lastName: isStudent ? (user?.name.split(" ").slice(1).join(" ") ?? "") : "",
      idNumber: "",
      studentNumber: isStudent ? (user?.studentNo ?? "") : "",
      email: isStudent ? (user?.email ?? "") : "",
      phone: "",
      university: isStudent ? (user?.institution ?? "") : "",
      programme: isStudent ? (user?.programme ?? "") : "",
      year: isStudent ? (user?.year ?? "") : "",
      annualIncome: "",
      needStatement: "",
      consent: false,
    })
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (formState === "success") {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 font-sans">
        {/* Confirmation card */}
        <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden shadow-sm mb-6">
          <div className="flex items-stretch">
            <div className="w-1.5 bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
            <div className="p-8">
              <div className="w-12 h-12 border-2 border-[#F5A623] flex items-center justify-center mb-5 rounded-sm">
                <svg viewBox="0 0 20 20" fill="none" width="22" height="22" aria-hidden="true">
                  <path d="M4 10.5L8 14.5L16 6" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </div>
              <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mb-1">Application Received</p>
              <h2 className="text-2xl font-serif font-semibold text-[#1A2B4A] mb-3">
                Thank you, {form.firstName}
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-6 max-w-lg">
                Your bursary application has been successfully submitted. Our team will review your application and contact you within{" "}
                <span className="font-medium text-[#1A1A2E]">5–7 business days</span>. Please quote your reference number in all future correspondence.
              </p>
              <div className="bg-[#F5F6F8] border border-[#E5E7EB] px-5 py-4 flex items-center justify-between mb-6 rounded-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-0.5">Reference Number</p>
                  <p className="text-xl font-mono font-bold text-[#F5A623]">{refNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] mb-0.5">Submitted</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">
                    {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-xs font-semibold font-sans text-[#6B7280] hover:text-[#1A2B4A] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Submit another application
              </button>
            </div>
          </div>
        </div>

        {/* Guest CTA — only shown to non-logged-in applicants */}
        {!isStudent && (
          <div className="bg-[#1A2B4A] rounded-sm overflow-hidden">
            <div className="flex items-stretch">
              <div className="w-1.5 bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
              <div className="px-8 py-7 flex-1">
                <p className="text-[10px] tracking-widest uppercase text-white/50 font-sans mb-1">Next Step</p>
                <h3 className="text-lg font-serif font-semibold text-white mb-2">
                  Create an account to track your application
                </h3>
                <p className="text-sm text-white/70 leading-relaxed mb-1">
                  Sign up using your <span className="text-[#F5A623] font-semibold">SA ID number ({form.idNumber})</span> and we will automatically link this application to your new account. You will be able to monitor your status, upload additional documents, and receive real-time updates.
                </p>
                <p className="text-xs text-white/50 font-sans mb-5">
                  Use the same ID number you entered in this form — that is how we connect your application to your account.
                </p>
                <a
                  href="/login"
                  className="inline-block px-6 py-2.5 text-sm font-semibold font-sans bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white rounded-sm transition-colors"
                >
                  Create account &amp; track status →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Logged-in student — link to dashboard */}
        {isStudent && (
          <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-sm px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-[#6B7280] font-sans">Track your application status in your student portal.</p>
            <a
              href="/portal/student/dashboard"
              className="text-sm font-semibold font-sans text-[#F5A623] hover:underline whitespace-nowrap ml-4"
            >
              Go to dashboard →
            </a>
          </div>
        )}
      </main>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-[10px] tracking-widest uppercase text-[#9CA3AF] font-sans mb-1">Bursary Application</p>
        <h1 className="text-2xl font-serif font-semibold text-[#1A2B4A] leading-tight">
          Apply for a TTI-Administered Bursary
        </h1>
        <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed max-w-2xl">
          Complete all sections below. Supporting documents must be attached before your application can be reviewed. Incomplete applications will not be considered.
        </p>
        {isStudent && (
          <div className="mt-3 inline-flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/25 text-[#A06B00] text-xs font-sans px-3 py-1.5 rounded-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Some fields have been pre-filled from your profile.
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0" noValidate aria-label="Bursary application form">
          <SectionCard title="Personal Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-firstName" className={labelCls}>First Name</label>
                <input id="app-firstName" className={errors.firstName ? inputErrCls : inputCls} value={form.firstName} onChange={set("firstName")} placeholder="Given name" disabled={isStudent && !!form.firstName} />
                <FieldError msg={errors.firstName} />
              </div>
              <div>
                <label htmlFor="app-lastName" className={labelCls}>Last Name</label>
                <input id="app-lastName" className={errors.lastName ? inputErrCls : inputCls} value={form.lastName} onChange={set("lastName")} placeholder="Surname" disabled={isStudent && !!form.lastName} />
                <FieldError msg={errors.lastName} />
              </div>
              <div>
                <label htmlFor="app-id" className={labelCls}>SA ID Number</label>
                <input id="app-id" className={errors.idNumber ? inputErrCls : inputCls} value={form.idNumber} onChange={set("idNumber")} placeholder="13-digit ID number" maxLength={13} />
                <FieldError msg={errors.idNumber} />
              </div>
              <div>
                <label htmlFor="app-sno" className={labelCls}>Student Number</label>
                <input id="app-sno" className={inputCls} value={form.studentNumber} onChange={set("studentNumber")} placeholder="If already registered" disabled={isStudent && !!form.studentNumber} />
              </div>
              <div>
                <label htmlFor="app-email" className={labelCls}>Email Address</label>
                <input id="app-email" type="email" className={errors.email ? inputErrCls : inputCls} value={form.email} onChange={set("email")} placeholder="you@institution.ac.za" disabled={isStudent && !!form.email} />
                <FieldError msg={errors.email} />
              </div>
              <div>
                <label htmlFor="app-phone" className={labelCls}>Mobile Number</label>
                <input id="app-phone" type="tel" className={errors.phone ? inputErrCls : inputCls} value={form.phone} onChange={set("phone")} placeholder="+27 8X XXX XXXX" />
                <FieldError msg={errors.phone} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Academic Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="app-uni" className={labelCls}>Institution</label>
                <select id="app-uni" className={`${errors.university ? inputErrCls : inputCls} appearance-none`} value={form.university} onChange={set("university")} disabled={isStudent && !!form.university}>
                  <option value="">Select institution…</option>
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <FieldError msg={errors.university} />
              </div>
              <div>
                <label htmlFor="app-prog" className={labelCls}>Programme / Qualification</label>
                <input id="app-prog" className={errors.programme ? inputErrCls : inputCls} value={form.programme} onChange={set("programme")} placeholder="e.g. BSc Computer Science" disabled={isStudent && !!form.programme} />
                <FieldError msg={errors.programme} />
              </div>
              <div>
                <label htmlFor="app-year" className={labelCls}>Year of Study</label>
                <select id="app-year" className={`${errors.year ? inputErrCls : inputCls} appearance-none`} value={form.year} onChange={set("year")}>
                  <option value="">Select year…</option>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Honours", "Masters"].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <FieldError msg={errors.year} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Financial Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-income" className={labelCls}>Combined Household Income (p.a.)</label>
                <input id="app-income" className={errors.annualIncome ? inputErrCls : inputCls} value={form.annualIncome} onChange={set("annualIncome")} placeholder="e.g. R 120 000" />
                <FieldError msg={errors.annualIncome} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="app-need" className={labelCls}>
                  Financial Need Statement{" "}
                  <span className="text-[#9CA3AF] normal-case tracking-normal">(min. 100 words)</span>
                </label>
                <textarea
                  id="app-need"
                  className={`${errors.needStatement ? inputErrCls : inputCls} resize-none`}
                  rows={5}
                  value={form.needStatement}
                  onChange={set("needStatement")}
                  placeholder="Explain your financial circumstances and how a bursary would assist you…"
                />
                <p className={`text-[10px] mt-1 font-sans ${wordCount >= 100 ? "text-emerald-600" : errors.needStatement ? "text-red-500" : "text-[#9CA3AF]"}`}>
                  {wordCount} / 100 words minimum
                </p>
                <FieldError msg={errors.needStatement} />
              </div>
            </div>
          </SectionCard>

          {/* Document Uploads */}
          <SectionCard title="Supporting Documents">
            <p className="text-xs text-[#6B7280] font-sans mb-4 leading-relaxed">
              Upload all required documents below. Accepted formats: PDF, JPG, PNG (max 10 MB each).
            </p>
            <div className="flex flex-col gap-3">
              {REQUIRED_DOCS.map((doc) => {
                const fileName = docUploads[doc.key]
                return (
                  <div key={doc.key} className={`flex items-center gap-3 border rounded-sm px-4 py-3 transition-colors ${fileName ? "border-emerald-200 bg-emerald-50/30" : "border-[#E5E7EB] bg-white"}`}>
                    <span className={`flex-shrink-0 w-4 h-4 ${fileName ? "text-emerald-500" : "text-[#D1D5DB]"}`} aria-hidden="true">
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
                      <p className="text-xs font-semibold text-[#1A1A2E] font-sans">{doc.label}</p>
                      {fileName && (
                        <p className="text-[10px] text-emerald-600 font-mono truncate mt-0.5">{fileName}</p>
                      )}
                    </div>
                    {fileName ? (
                      <button
                        type="button"
                        onClick={() => removeDoc(doc.key)}
                        className="text-[10px] font-semibold text-red-500 hover:text-red-700 font-sans transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <label className="flex-shrink-0 cursor-pointer">
                        <span className="text-[10px] font-semibold text-[#F5A623] hover:text-[#D4891A] font-sans transition-colors underline underline-offset-2">
                          Upload
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={handleDocUpload(doc.key)}
                          aria-label={`Upload ${doc.label}`}
                        />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F5A623] rounded-full transition-all"
                  style={{ width: `${(uploadedCount / REQUIRED_DOCS.length) * 100}%` }}
                />
              </div>
              <span className={`text-[10px] font-sans whitespace-nowrap ${allDocsUploaded ? "text-emerald-600 font-semibold" : "text-[#9CA3AF]"}`}>
                {uploadedCount} of {REQUIRED_DOCS.length} uploaded
              </span>
            </div>
            {docError && <p className="text-[10px] text-red-500 font-sans mt-1">{docError}</p>}
            <FieldError msg={errors._docs} />
          </SectionCard>

          {/* Consent */}
          <div className={`bg-white border rounded-sm p-5 mb-6 ${errors._form ? "border-red-300 bg-red-50/20" : "border-[#E5E7EB]"}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={setCheck}
                className="mt-0.5 flex-shrink-0 w-4 h-4 border border-[#E5E7EB] accent-[#F5A623] cursor-pointer"
                aria-required="true"
              />
              <span className="text-xs text-[#6B7280] font-sans leading-relaxed">
                I confirm that the information provided is accurate and complete. I consent to TTI processing my personal information in accordance with POPIA for the purposes of bursary management. I understand that incomplete or inaccurate applications will be disqualified.
              </span>
            </label>
            <FieldError msg={errors._form} />
          </div>

          {/* Submission error banner */}
          {formState === "error" && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-300 text-red-700 text-sm font-sans px-4 py-3 rounded-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>Submission failed. Please check your connection and try again. If the problem persists, contact <strong>students@ttibursaries.co.za</strong>.</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9CA3AF] font-sans">All fields are required unless marked optional.</p>
            <button
              type="submit"
              disabled={formState === "submitting"}
              className={[
                "flex items-center gap-2 px-8 py-3 text-sm font-semibold font-sans tracking-wide rounded-sm transition-colors",
                formState === "submitting"
                  ? "bg-[#F5A623]/40 text-[#1A2B4A]/50 cursor-not-allowed"
                  : "bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white cursor-pointer",
              ].join(" ")}
            >
              {formState === "submitting" && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
              {formState === "submitting" ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#1A2B4A] flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white font-sans">Document Status</h3>
              <span className="text-[10px] font-mono text-white/60">{uploadedCount}/{REQUIRED_DOCS.length}</span>
            </div>
            <ul className="divide-y divide-[#E5E7EB]">
              {REQUIRED_DOCS.map((doc) => {
                const uploaded = !!docUploads[doc.key]
                return (
                  <li key={doc.key} className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`flex-shrink-0 mt-0.5 ${uploaded ? "text-emerald-500" : "text-[#D1D5DB]"}`} aria-hidden="true">
                      {uploaded ? (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M4.5 8.5L7 11L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-xs font-sans leading-relaxed ${uploaded ? "text-[#1A1A2E]" : "text-[#9CA3AF]"}`}>{doc.label}</span>
                  </li>
                )
              })}
            </ul>
            <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F5F6F8]">
              <p className={`text-[10px] leading-relaxed font-sans uppercase tracking-wide ${allDocsUploaded ? "text-emerald-600" : "text-[#9CA3AF]"}`}>
                {allDocsUploaded ? "All documents uploaded." : "Incomplete applications will not be considered."}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#F5A623]/40 rounded-sm p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#F5A623] font-semibold font-sans mb-1">Application Closes</p>
            <p className="text-lg font-serif font-semibold text-[#1A2B4A]">30 April 2026</p>
            <p className="text-xs text-[#9CA3AF] font-sans mt-1">Late applications will not be accepted under any circumstances.</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-sm px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-sans font-semibold mb-2">Need Help?</p>
            <p className="text-sm font-medium text-[#1A1A2E] font-sans">Student Support</p>
            <a href="mailto:students@ttibursaries.co.za" className="text-xs text-[#F5A623] mt-1 font-sans font-medium block hover:underline">
              students@ttibursaries.co.za
            </a>
            <p className="text-xs text-[#6B7280] mt-0.5 font-sans">+27 (0) 10 746 4366</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
