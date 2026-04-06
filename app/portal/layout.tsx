"use client"

import { useEffect, type ReactNode } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavBar } from "@/components/nav-bar"

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <p className="text-sm text-[#9CA3AF] font-sans">Loading…</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      <NavBar />

      <div className="flex-1">
        {children}
      </div>

      {/* Sponsors */}
      <div className="border-t border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-center text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-8">
            Our Sponsors
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { src: "/Shell-Logo.png", alt: "Shell" },
              { src: "/Anglo_American_plc-Logo.wine.png", alt: "Anglo American" },
              { src: "/Sasol-Logo.wine.png", alt: "Sasol" },
              { src: "/nedbank-logo-png-transparent.png", alt: "Nedbank" },
            ].map(({ src, alt }) => (
              <Image
                key={alt}
                src={src}
                alt={alt}
                width={120}
                height={60}
                className="object-contain h-12 w-auto"
                style={{ height: "48px" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
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
