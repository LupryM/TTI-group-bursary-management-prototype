import { createClient } from "@libsql/client"

const client = createClient({
  url: "file:tti_bursary.db",
})

export async function getReadyDb() {
  // Initialize schema if not exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      role TEXT,
      student_no TEXT,
      ref_no TEXT,
      institution TEXT,
      programme TEXT,
      year TEXT,
      status TEXT,
      id_number TEXT,
      avatar TEXT,
      funder_name TEXT,
      bursary_amount REAL,
      company TEXT,
      bbbee_level TEXT,
      total_budget REAL,
      department TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_name TEXT,
      student_no TEXT,
      institution TEXT,
      programme TEXT,
      year TEXT,
      funder TEXT,
      amount REAL,
      status TEXT,
      submitted_date TEXT,
      id_verified INTEGER DEFAULT 0,
      docs_complete INTEGER DEFAULT 0,
      academic_avg REAL,
      id_number TEXT,
      email TEXT,
      phone TEXT,
      annual_income REAL,
      need_statement TEXT,
      ref_number TEXT,
      owner_id TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS application_audit (
      application_id TEXT,
      changed_at TEXT,
      changed_by TEXT,
      field TEXT,
      old_value TEXT,
      new_value TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS funders (
      id TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      bbbee_level TEXT,
      total_budget REAL
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS funder_students (
      id TEXT PRIMARY KEY,
      name TEXT,
      student_no TEXT,
      institution TEXT,
      programme TEXT,
      year TEXT,
      amount REAL,
      disbursed REAL DEFAULT 0,
      status TEXT,
      academic_avg REAL,
      funder_id TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS student_modules (
      funder_student_id TEXT,
      name TEXT,
      complete INTEGER DEFAULT 0
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      date TEXT,
      status TEXT,
      facilitator TEXT,
      duration TEXT,
      student_id TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS student_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT,
      doc_key TEXT,
      file_name TEXT,
      uploaded_at TEXT
    )
  `)

  return client
}
