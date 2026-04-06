// Shared document definitions used by the application form, student dashboard
// and admin portal. Keep this list as the single source of truth so the three
// surfaces never drift out of sync.

export interface RequiredDoc {
  key: string
  label: string
}

export const REQUIRED_DOCS: RequiredDoc[] = [
  { key: "sa_id", label: "South African ID (certified copy)" },
  { key: "registration", label: "Proof of registration or acceptance letter" },
  { key: "academic_record", label: "Full academic record with latest results" },
  { key: "photograph", label: "Head and shoulders photograph" },
  { key: "other", label: "Other" },
]

export const REQUIRED_DOC_KEYS = REQUIRED_DOCS.map((d) => d.key)
export const REQUIRED_DOC_COUNT = REQUIRED_DOCS.length

// Guest applicants (not logged in) still need a stable owner id so uploads
// made during an application can be tied to the submitted record. We store a
// generated id in sessionStorage for the duration of the form session.
export function getOrCreateGuestOwnerId(): string {
  if (typeof window === "undefined") return ""
  const KEY = "tti_guest_owner_id"
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(KEY, id)
  }
  return id
}

export function clearGuestOwnerId() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem("tti_guest_owner_id")
}
