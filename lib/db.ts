import { createClient } from "@libsql/client"

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:tti_bursary.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export async function getReadyDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      avatar TEXT,
      student_no TEXT,
      ref_no TEXT,
      institution TEXT,
      programme TEXT,
      year TEXT,
      funder_name TEXT,
      bursary_amount REAL,
      status TEXT,
      company TEXT,
      bbbee_level INTEGER,
      total_budget REAL,
      department TEXT,
      id_number TEXT,
      CONSTRAINT users_check_1 CHECK(role IN ('student', 'funder', 'admin'))
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_no TEXT NOT NULL,
      institution TEXT NOT NULL,
      programme TEXT NOT NULL,
      year TEXT NOT NULL,
      funder TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'Submitted' NOT NULL,
      submitted_date TEXT NOT NULL,
      id_verified INTEGER DEFAULT 0 NOT NULL,
      docs_complete INTEGER DEFAULT 0 NOT NULL,
      academic_avg REAL DEFAULT 0 NOT NULL,
      id_number TEXT,
      email TEXT,
      phone TEXT,
      annual_income TEXT,
      need_statement TEXT,
      ref_number TEXT,
      owner_id TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS funder_students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      student_no TEXT NOT NULL,
      institution TEXT NOT NULL,
      programme TEXT NOT NULL,
      year TEXT NOT NULL,
      amount REAL NOT NULL,
      disbursed REAL DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'Approved' NOT NULL,
      academic_avg REAL DEFAULT 0 NOT NULL,
      funder_id TEXT,
      owner_id TEXT
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS student_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funder_student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      complete INTEGER DEFAULT 0 NOT NULL,
      CONSTRAINT fk_student_modules FOREIGN KEY (funder_student_id) REFERENCES funder_students(id) ON DELETE CASCADE
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      facilitator TEXT NOT NULL,
      duration TEXT NOT NULL,
      student_id TEXT,
      CONSTRAINT workshops_check_2 CHECK(status IN ('Attended', 'Upcoming', 'Missed'))
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS funders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT NOT NULL,
      budget REAL NOT NULL,
      students INTEGER DEFAULT 0 NOT NULL,
      level INTEGER DEFAULT 1 NOT NULL,
      status TEXT DEFAULT 'Active' NOT NULL
    )
  `)

  return client
}
