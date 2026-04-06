"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, Role } from "@/lib/auth-context"

// ─── View type exports (consumed by AdminPortal and FunderPortal) ─────────────

export type StudentView = "dashboard" | "apply" | "profile"
export type FunderView = "overview" | "students" | "reports"
export type AdminView = "applications" | "tracker" | "funders"

export type AnyView = StudentView | FunderView | AdminView

// ─── Per-role nav definitions ─────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  sublabel: string
}

const STUDENT_NAV: NavItem[] = [
  { label: "My Bursary", href: "/portal/student/dashboard", sublabel: "Dashboard" },
  { label: "Apply", href: "/apply", sublabel: "New Application" },
  { label: "Profile", href: "/portal/student/profile", sublabel: "Account" },
]

const FUNDER_NAV: NavItem[] = [
  { label: "Overview", href: "/portal/funder/overview", sublabel: "Summary" },
  { label: "My Students", href: "/portal/funder/students", sublabel: "Cohort" },
  { label: "Reports", href: "/portal/funder/reports", sublabel: "Compliance" },
]

const ADMIN_NAV: NavItem[] = [
  { label: "Applications", href: "/portal/admin/applications", sublabel: "Approvals Queue" },
  { label: "Skills Tracker", href: "/portal/admin/tracker", sublabel: "Progress" },
  { label: "Funders", href: "/portal/admin/funders", sublabel: "Manage" },
]

function navForRole(role: Role): NavItem[] {
  if (role === "student") return STUDENT_NAV
  if (role === "funder") return FUNDER_NAV
  return ADMIN_NAV
}

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  funder: "Funder",
  admin: "Administrator",
}

const ROLE_COLORS: Record<Role, string> = {
  student: "bg-emerald-100 text-emerald-700",
  funder: "bg-[#F5A623]/15 text-[#A06B00]",
  admin: "bg-[#1A2B4A]/10 text-[#1A2B4A]",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavBar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const navItems = navForRole(user.role)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      {/* Utility bar */}
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

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo — links to first nav item for this role */}
          <Link
            href={navItems[0].href}
            className="flex-shrink-0 flex items-center"
            aria-label="TTI Bursary Management home"
          >
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

          {/* Nav links — desktop */}
          <nav
            className="hidden md:flex items-stretch h-16"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative flex flex-col items-center justify-center px-5 h-full font-sans text-sm transition-colors",
                    isActive
                      ? "text-[#F5A623]"
                      : "text-[#4B5563] hover:text-[#1A2B4A]",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                  <span className="text-[10px] tracking-widest uppercase text-[#9CA3AF] mt-0.5">
                    {item.sublabel}
                  </span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F5A623]"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right — user info + logout */}
          <div className="flex items-center gap-3">
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2.5 border border-[#E5E7EB] rounded-sm px-3 py-1.5 bg-[#F5F6F8]">
              <div
                className="w-6 h-6 rounded-full bg-[#1A2B4A] text-white flex items-center justify-center text-[10px] font-bold font-sans flex-shrink-0"
                aria-hidden="true"
              >
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold text-[#1A1A2E] font-sans">{user.name.split(" ")[0]}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wide px-1 py-px rounded-sm mt-0.5 w-fit font-sans ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1A2B4A] font-sans transition-colors border border-[#E5E7EB] px-3 py-2 rounded-sm hover:bg-[#F5F6F8]"
              aria-label="Sign out"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-8 h-8 border border-[#E5E7EB] rounded-sm bg-white"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="md:hidden border-t border-[#E5E7EB] bg-white"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* User identity — only visible on xs where the pill is hidden */}
          <div className="sm:hidden flex items-center gap-3 px-6 py-3 border-b border-[#E5E7EB] bg-[#F5F6F8]">
            <div
              className="w-7 h-7 rounded-full bg-[#1A2B4A] text-white flex items-center justify-center text-[10px] font-bold font-sans flex-shrink-0"
              aria-hidden="true"
            >
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-[#1A1A2E] font-sans">{user.name}</span>
              <span className={`text-[9px] font-semibold uppercase tracking-wide px-1 py-px rounded-sm mt-0.5 w-fit font-sans ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={[
                  "w-full flex items-center gap-3 px-6 py-3.5 text-sm font-sans border-b border-[#E5E7EB] last:border-0 transition-colors",
                  isActive
                    ? "bg-[#F5A623]/6 text-[#F5A623] font-semibold"
                    : "text-[#4B5563] hover:bg-[#F5F6F8]",
                ].join(" ")}
              >
                {isActive && (
                  <span className="w-1 h-4 bg-[#F5A623] rounded-full flex-shrink-0" aria-hidden="true" />
                )}
                <span>{item.label}</span>
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] ml-auto">{item.sublabel}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
