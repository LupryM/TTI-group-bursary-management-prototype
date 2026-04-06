export const REQUIRED_DOCS = [
  { key: "id", label: "SA ID Document" },
  { key: "registration", label: "Proof of Registration" },
  { key: "academic", label: "Latest Academic Record" },
  { key: "financial", label: "Financial Need Statement" },
]

export const OPTIONAL_DOCS = [
  { key: "other", label: "Other / Supporting Document" },
]

export const REQUIRED_DOC_COUNT = REQUIRED_DOCS.length
export const REQUIRED_DOC_KEYS = REQUIRED_DOCS.map(d => d.key)

/**
 * Handle persistent IDs for guest applicants (not logged in).
 * This allows them to resume their document upload session.
 */
export function getOrCreateGuestOwnerId(): string {
  if (typeof window === "undefined") return "server-side"
  let id = sessionStorage.getItem("tti_guest_owner_id")
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("tti_guest_owner_id", id)
  }
  return id
}

export function clearGuestId() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("tti_guest_owner_id")
  }
}
