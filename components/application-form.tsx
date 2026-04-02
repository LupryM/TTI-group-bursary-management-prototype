"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

const inputCls =
  "w-full border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-[#F5A623] transition-colors placeholder:text-[#9CA3AF] rounded-sm disabled:bg-[#F5F6F8] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-1.5"

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

type FormState = "idle" | "submitting" | "success"

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

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setCheck = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, consent: e.target.checked }))

  const wordCount = form.needStatement.trim().split(/\s+/).filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consent || formState === "submitting") return
    setFormState("submitting")
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setRefNumber(data.refNumber)
      setFormState("success")
    } catch {
      setFormState("idle")
    }
  }

  const resetForm = () => {
    setFormState("idle")
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
        <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden shadow-sm">
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
                className="px-6 py-2.5 text-sm font-semibold font-sans bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white rounded-sm transition-colors cursor-pointer"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        </div>
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
                <input id="app-firstName" className={inputCls} value={form.firstName} onChange={set("firstName")} placeholder="Given name" required disabled={isStudent && !!form.firstName} />
              </div>
              <div>
                <label htmlFor="app-lastName" className={labelCls}>Last Name</label>
                <input id="app-lastName" className={inputCls} value={form.lastName} onChange={set("lastName")} placeholder="Surname" required disabled={isStudent && !!form.lastName} />
              </div>
              <div>
                <label htmlFor="app-id" className={labelCls}>SA ID Number</label>
                <input id="app-id" className={inputCls} value={form.idNumber} onChange={set("idNumber")} placeholder="13-digit ID number" maxLength={13} required />
              </div>
              <div>
                <label htmlFor="app-sno" className={labelCls}>Student Number</label>
                <input id="app-sno" className={inputCls} value={form.studentNumber} onChange={set("studentNumber")} placeholder="If already registered" disabled={isStudent && !!form.studentNumber} />
              </div>
              <div>
                <label htmlFor="app-email" className={labelCls}>Email Address</label>
                <input id="app-email" type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="you@institution.ac.za" required disabled={isStudent && !!form.email} />
              </div>
              <div>
                <label htmlFor="app-phone" className={labelCls}>Mobile Number</label>
                <input id="app-phone" type="tel" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+27 8X XXX XXXX" required />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Academic Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label htmlFor="app-uni" className={labelCls}>Institution</label>
                <select id="app-uni" className={`${inputCls} appearance-none`} value={form.university} onChange={set("university")} required disabled={isStudent && !!form.university}>
                  <option value="">Select institution…</option>
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="app-prog" className={labelCls}>Programme / Qualification</label>
                <input id="app-prog" className={inputCls} value={form.programme} onChange={set("programme")} placeholder="e.g. BSc Computer Science" required disabled={isStudent && !!form.programme} />
              </div>
              <div>
                <label htmlFor="app-year" className={labelCls}>Year of Study</label>
                <select id="app-year" className={`${inputCls} appearance-none`} value={form.year} onChange={set("year")} required>
                  <option value="">Select year…</option>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Honours", "Masters"].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Financial Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="app-income" className={labelCls}>Combined Household Income (p.a.)</label>
                <input id="app-income" className={inputCls} value={form.annualIncome} onChange={set("annualIncome")} placeholder="R 0.00" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="app-need" className={labelCls}>
                  Financial Need Statement{" "}
                  <span className="text-[#9CA3AF] normal-case tracking-normal">(min. 100 words)</span>
                </label>
                <textarea
                  id="app-need"
                  className={`${inputCls} resize-none`}
                  rows={5}
                  value={form.needStatement}
                  onChange={set("needStatement")}
                  placeholder="Explain your financial circumstances and how a bursary would assist you…"
                  required
                />
                <p className={`text-[10px] mt-1 font-sans ${wordCount >= 100 ? "text-emerald-600" : "text-[#9CA3AF]"}`}>
                  {wordCount} / 100 words minimum
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Consent */}
          <div className="bg-white border border-[#E5E7EB] rounded-sm p-5 mb-6">
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
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#9CA3AF] font-sans">All fields are required unless marked optional.</p>
            <button
              type="submit"
              disabled={!form.consent || formState === "submitting"}
              className={[
                "flex items-center gap-2 px-8 py-3 text-sm font-semibold font-sans tracking-wide rounded-sm transition-colors",
                !form.consent || formState === "submitting"
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
            <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#1A2B4A]">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white font-sans">Supporting Documents</h3>
            </div>
            <ul className="divide-y divide-[#E5E7EB]">
              {[
                "South African ID (certified copy)",
                "Proof of registration or acceptance letter",
                "Full academic record with latest results",
                "Head and shoulders photograph",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="flex-shrink-0 mt-0.5 text-[#F5A623]" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                      <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4.5 8.5L7 11L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                  </span>
                  <span className="text-xs text-[#4B5563] font-sans leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#F5F6F8]">
              <p className="text-[10px] text-[#9CA3AF] leading-relaxed font-sans uppercase tracking-wide">
                Incomplete applications will not be considered.
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
