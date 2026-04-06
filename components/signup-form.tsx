"use client"

import { useState } from "react"
import { useAuth, MockUser } from "@/lib/auth-context"

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

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Honours", "Masters"]

const inputCls =
  "w-full border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-[#F5A623] transition-colors placeholder:text-[#9CA3AF] rounded-sm"
const errCls =
  "w-full border border-red-400 bg-red-50/30 px-3 py-2.5 text-sm text-[#1A1A2E] font-sans outline-none focus:border-red-500 transition-colors placeholder:text-[#9CA3AF] rounded-sm"
const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] font-sans mb-1.5"

interface SignupFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  institution: string
  programme: string
  year: string
  studentNo: string
  idNumber: string
  consent: boolean
}

const EMPTY: SignupFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  institution: "",
  programme: "",
  year: "",
  studentNo: "",
  idNumber: "",
  consent: false,
}

export function SignupForm({ onCancel }: { onCancel: () => void }) {
  const { registerAndLogin } = useAuth()
  const [form, setForm] = useState<SignupFormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormState | "_form" | "idNumber", string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof SignupFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === "consent" ? (e.target as HTMLInputElement).checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value } as SignupFormState))
  }

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.firstName.trim()) errs.firstName = "Required"
    if (!form.lastName.trim()) errs.lastName = "Required"
    if (!form.email.trim()) errs.email = "Required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email."
    if (!form.phone.trim()) errs.phone = "Required"
    if (!form.institution) errs.institution = "Select an institution"
    if (!form.programme.trim()) errs.programme = "Required"
    if (!form.year) errs.year = "Select year"
    if (form.idNumber && !/^\d{13}$/.test(form.idNumber.replace(/\s/g, "")))
      errs.idNumber = "SA ID must be exactly 13 digits."
    if (!form.consent) errs._form = "You must accept the terms to create an account."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ _form: data.error ?? "Could not create your account." })
        setSubmitting(false)
        return
      }
      // Auto sign-in the newly created student.
      registerAndLogin(data as MockUser)
    } catch {
      setErrors({ _form: "Network error. Please try again." })
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4" noValidate aria-label="Create student account">
      <p className="text-xs text-[#6B7280] font-sans leading-relaxed">
        Create a student account to submit your bursary application, upload supporting documents and track your status.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-first" className={labelCls}>First Name</label>
          <input id="su-first" className={errors.firstName ? errCls : inputCls} value={form.firstName} onChange={set("firstName")} placeholder="Given name" />
          {errors.firstName && <p className="text-[10px] text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="su-last" className={labelCls}>Last Name</label>
          <input id="su-last" className={errors.lastName ? errCls : inputCls} value={form.lastName} onChange={set("lastName")} placeholder="Surname" />
          {errors.lastName && <p className="text-[10px] text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="su-email" className={labelCls}>Email Address</label>
        <input id="su-email" type="email" className={errors.email ? errCls : inputCls} value={form.email} onChange={set("email")} placeholder="you@institution.ac.za" autoComplete="email" />
        {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="su-phone" className={labelCls}>Mobile Number</label>
        <input id="su-phone" type="tel" className={errors.phone ? errCls : inputCls} value={form.phone} onChange={set("phone")} placeholder="+27 8X XXX XXXX" autoComplete="tel" />
        {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="su-inst" className={labelCls}>Institution</label>
        <select id="su-inst" className={`${errors.institution ? errCls : inputCls} appearance-none`} value={form.institution} onChange={set("institution")}>
          <option value="">Select institution…</option>
          {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        {errors.institution && <p className="text-[10px] text-red-500 mt-1">{errors.institution}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-prog" className={labelCls}>Programme</label>
          <input id="su-prog" className={errors.programme ? errCls : inputCls} value={form.programme} onChange={set("programme")} placeholder="e.g. BSc Computer Science" />
          {errors.programme && <p className="text-[10px] text-red-500 mt-1">{errors.programme}</p>}
        </div>
        <div>
          <label htmlFor="su-year" className={labelCls}>Year of Study</label>
          <select id="su-year" className={`${errors.year ? errCls : inputCls} appearance-none`} value={form.year} onChange={set("year")}>
            <option value="">Select year…</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.year && <p className="text-[10px] text-red-500 mt-1">{errors.year}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="su-sno" className={labelCls}>Student Number <span className="text-[#9CA3AF] normal-case tracking-normal">(optional)</span></label>
        <input id="su-sno" className={inputCls} value={form.studentNo} onChange={set("studentNo")} placeholder="If already registered" />
      </div>

      <div>
        <label htmlFor="su-idno" className={labelCls}>
          SA ID Number <span className="text-[#9CA3AF] normal-case tracking-normal">(optional — links an existing application)</span>
        </label>
        <input
          id="su-idno"
          className={errors.idNumber ? errCls : inputCls}
          value={form.idNumber}
          onChange={set("idNumber")}
          placeholder="13-digit South African ID number"
          maxLength={13}
          inputMode="numeric"
        />
        {errors.idNumber && <p className="text-[10px] text-red-500 mt-1">{errors.idNumber}</p>}
      </div>

      <label className="flex items-start gap-2 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={set("consent")}
          className="mt-0.5 flex-shrink-0 w-4 h-4 border border-[#E5E7EB] accent-[#F5A623] cursor-pointer"
        />
        <span className="text-xs text-[#6B7280] font-sans leading-relaxed">
          I consent to TTI processing my personal information in accordance with POPIA for the purposes of bursary management.
        </span>
      </label>

      {errors._form && (
        <p className="text-xs text-red-600 font-sans" role="alert">{errors._form}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold font-sans text-[#6B7280] hover:text-[#1A2B4A] transition-colors underline underline-offset-2"
        >
          Back to sign in
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={[
            "ml-auto px-6 py-2.5 text-sm font-semibold font-sans tracking-wide rounded-sm transition-colors",
            submitting
              ? "bg-[#F5A623]/50 text-[#1A2B4A]/50 cursor-not-allowed"
              : "bg-[#F5A623] text-[#1A2B4A] hover:bg-[#D4891A] hover:text-white cursor-pointer",
          ].join(" ")}
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </div>
    </form>
  )
}
