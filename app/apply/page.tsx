"use client"

import Image from "next/image"
import Link from "next/link"
import { ApplicationForm } from "@/components/application-form"

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="bg-[#1A2B4A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-8">
            <span className="text-[10px] text-white/50 tracking-widest uppercase font-sans">
              B-BBEE Level 1 &mdash; Skills Development &amp; Bursary Management
            </span>
            <span className="text-[10px] text-white/50 font-sans hidden sm:block">
              +27 (0) 10 746 4366&nbsp;&nbsp;|&nbsp;&nbsp;info@ttibursaries.co.za
            </span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="TTI Bursary Management home">
            <Image
              src="/tti-bursary-management-logo.png"
              alt="TTI Bursary Management"
              width={150}
              height={54}
              priority
              className="object-contain"
              style={{ height: "auto" }}
            />
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold font-sans text-[#6B7280] hover:text-[#1A2B4A] border border-[#E5E7EB] px-3 py-2 rounded-sm hover:bg-[#F5F6F8] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <ApplicationForm />
      </div>

      <footer className="border-t border-[#E5E7EB] bg-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Image
            src="/tti-bursary-management-logo.png"
            alt="TTI Bursary Management"
            width={100}
            height={36}
            className="object-contain"
            style={{ height: "auto" }}
          />
          <p className="text-[10px] text-gray-300 font-sans">
            &copy; {new Date().getFullYear()} TTI Group. All rights reserved.&nbsp;&nbsp;&bull;&nbsp;&nbsp;
            Privacy Policy&nbsp;&nbsp;&bull;&nbsp;&nbsp;POPIA Compliant
          </p>
          <div className="text-right">
            <p className="text-[10px] text-gray-300 font-sans">info@ttibursaries.co.za</p>
            <p className="text-[10px] text-gray-300 font-sans">+27 (0) 10 746 4366</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
