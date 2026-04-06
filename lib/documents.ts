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
