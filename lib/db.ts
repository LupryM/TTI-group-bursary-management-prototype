import { createClient, type Client, type InArgs } from "@libsql/client"

let _client: Client | null = null
let _initPromise: Promise<void> | null = null

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return _client
}

export async function getReadyDb(): Promise<Client> {
  const client = getDb()
  if (!_initPromise) {
    _initPromise = initSchema(client).then(() => seedIfEmpty(client))
  }
  await _initPromise
  return client
}

async function initSchema(db: Client): Promise<void> {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'funder', 'admin')),
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
      id_number TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_no TEXT NOT NULL,
      institution TEXT NOT NULL,
      programme TEXT NOT NULL,
      year TEXT NOT NULL,
      funder TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      submitted_date TEXT NOT NULL,
      id_verified INTEGER NOT NULL DEFAULT 0,
      docs_complete INTEGER NOT NULL DEFAULT 0,
      academic_avg REAL NOT NULL DEFAULT 0,
      id_number TEXT,
      email TEXT,
      phone TEXT,
      annual_income TEXT,
      need_statement TEXT,
      ref_number TEXT,
      owner_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS funder_students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      student_no TEXT NOT NULL,
      institution TEXT NOT NULL,
      programme TEXT NOT NULL,
      year TEXT NOT NULL,
      amount REAL NOT NULL,
      disbursed REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Approved',
      academic_avg REAL NOT NULL DEFAULT 0,
      funder_id TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS student_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funder_student_id TEXT NOT NULL REFERENCES funder_students(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      complete INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Attended', 'Upcoming', 'Missed')),
      facilitator TEXT NOT NULL,
      duration TEXT NOT NULL,
      student_id TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS funders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT NOT NULL,
      budget REAL NOT NULL,
      students INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Active'
    )`,
    `CREATE TABLE IF NOT EXISTS application_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS student_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      UNIQUE(student_id, doc_type)
    )`,
  ], "write")

  // ── Migrations for databases created before this schema version ──────────────
  const migrations = [
    "ALTER TABLE users ADD COLUMN id_number TEXT",
  ]
  for (const sql of migrations) {
    try { await db.execute(sql) } catch { /* column already exists */ }
  }

  // ── Recreate applications table if it still has the old CHECK constraint ─────
  try {
    const result = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='applications'"
    )
    const appTable = result.rows[0] as Record<string, unknown> | undefined
    const appSql = appTable?.sql as string | undefined
    if (appSql?.includes("CHECK") && appSql.includes("'Pending'")) {
      await db.execute("PRAGMA foreign_keys = OFF")
      await db.batch([
        `CREATE TABLE applications_new (
          id TEXT PRIMARY KEY,
          student_name TEXT NOT NULL,
          student_no TEXT NOT NULL,
          institution TEXT NOT NULL,
          programme TEXT NOT NULL,
          year TEXT NOT NULL,
          funder TEXT NOT NULL,
          amount REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'Submitted',
          submitted_date TEXT NOT NULL,
          id_verified INTEGER NOT NULL DEFAULT 0,
          docs_complete INTEGER NOT NULL DEFAULT 0,
          academic_avg REAL NOT NULL DEFAULT 0,
          id_number TEXT,
          email TEXT,
          phone TEXT,
          annual_income TEXT,
          need_statement TEXT,
          ref_number TEXT,
          owner_id TEXT
        )`,
        "INSERT INTO applications_new SELECT * FROM applications",
        "DROP TABLE applications",
        "ALTER TABLE applications_new RENAME TO applications",
      ], "write")
      await db.execute("UPDATE applications SET status = 'Submitted' WHERE status = 'Pending'")
      await db.execute("PRAGMA foreign_keys = ON")
    }
  } catch { /* already migrated */ }

  // ── Same for funder_students ──────────────────────────────────────────────────
  try {
    const result = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='funder_students'"
    )
    const fsTable = result.rows[0] as Record<string, unknown> | undefined
    const fsSql = fsTable?.sql as string | undefined
    if (fsSql?.includes("CHECK") && fsSql.includes("'Pending'")) {
      await db.execute("PRAGMA foreign_keys = OFF")
      await db.batch([
        `CREATE TABLE funder_students_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          student_no TEXT NOT NULL,
          institution TEXT NOT NULL,
          programme TEXT NOT NULL,
          year TEXT NOT NULL,
          amount REAL NOT NULL,
          disbursed REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'Approved',
          academic_avg REAL NOT NULL DEFAULT 0,
          funder_id TEXT NOT NULL
        )`,
        "INSERT INTO funder_students_new SELECT * FROM funder_students",
        "DROP TABLE funder_students",
        "ALTER TABLE funder_students_new RENAME TO funder_students",
      ], "write")
      await db.execute("PRAGMA foreign_keys = ON")
    }
  } catch { /* already migrated */ }
}

async function seedIfEmpty(db: Client): Promise<void> {
  const result = await db.execute("SELECT COUNT(*) as c FROM users")
  const count = Number((result.rows[0] as Record<string, unknown>).c)
  if (count > 0) return

  // ── Users ──────────────────────────────────────────────────────────────────
  const userSql = `INSERT INTO users (id, name, email, role, student_no, ref_no, institution, programme, year, funder_name, bursary_amount, status, company, bbbee_level, total_budget, department) VALUES (@id, @name, @email, @role, @student_no, @ref_no, @institution, @programme, @year, @funder_name, @bursary_amount, @status, @company, @bbbee_level, @total_budget, @department)`

  const users = [
    { id: "student-1", name: "Thandi Mokoena", email: "thandi@student.up.ac.za", role: "student", student_no: "UP22/0045812", ref_no: "TTI-2026-8472", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", funder_name: "Anglo American plc", bursary_amount: 48500, status: "Approved", company: null, bbbee_level: null, total_budget: null, department: null },
    { id: "student-2", name: "Sipho Dlamini", email: "sipho@student.wits.ac.za", role: "student", student_no: "WITS21/0033124", ref_no: "TTI-2026-3301", institution: "University of the Witwatersrand", programme: "BCom Accounting", year: "2nd Year", funder_name: "Sasol Bursaries", bursary_amount: 42000, status: "Under Review", company: null, bbbee_level: null, total_budget: null, department: null },
    { id: "funder-0", name: "Michael Chen", email: "michael@shell.com", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Shell South Africa", bbbee_level: 1, total_budget: 4000000, department: null },
    { id: "funder-1", name: "Priya Naidoo", email: "priya@angloamerican.com", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Anglo American plc", bbbee_level: 1, total_budget: 2500000, department: null },
    { id: "funder-2", name: "Jacques Rossouw", email: "jacques@sasol.com", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Sasol Bursaries", bbbee_level: 1, total_budget: 1800000, department: null },
    { id: "funder-3", name: "Aisha Patel", email: "aisha@nedbank.co.za", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Nedbank Foundation", bbbee_level: 2, total_budget: 1200000, department: null },
    { id: "admin-1", name: "Lerato Sithole", email: "lerato@ttibursaries.co.za", role: "admin", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: null, bbbee_level: null, total_budget: null, department: "Bursary Operations" },
  ]

  await db.batch(
    users.map((u) => ({ sql: userSql, args: u as unknown as InArgs })),
    "write"
  )

  // ── Applications ───────────────────────────────────────────────────────────
  const appSql = `INSERT INTO applications (id, student_name, student_no, institution, programme, year, funder, amount, status, submitted_date, id_verified, docs_complete, academic_avg, owner_id, ref_number) VALUES (@id, @student_name, @student_no, @institution, @programme, @year, @funder, @amount, @status, @submitted_date, @id_verified, @docs_complete, @academic_avg, @owner_id, @ref_number)`

  const apps = [
    { id: "app-001", student_name: "Thandi Mokoena", student_no: "UP22/0045812", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", funder: "Anglo American plc", amount: 48500, status: "Approved", submitted_date: "12 Jan 2026", id_verified: 1, docs_complete: 0, academic_avg: 72, owner_id: "student-1", ref_number: "TTI-2026-847201" },
    { id: "app-002", student_name: "Sipho Dlamini", student_no: "WITS21/0033124", institution: "University of the Witwatersrand", programme: "BCom Accounting", year: "2nd Year", funder: "Sasol Bursaries", amount: 42000, status: "Under Review", submitted_date: "18 Jan 2026", id_verified: 1, docs_complete: 0, academic_avg: 65, owner_id: "student-2", ref_number: "TTI-2026-330112" },
    { id: "app-003", student_name: "Anele Khumalo", student_no: "UCT24/0071203", institution: "University of Cape Town", programme: "BEng Mechanical", year: "1st Year", funder: "Anglo American plc", amount: 55000, status: "Submitted", submitted_date: "21 Jan 2026", id_verified: 0, docs_complete: 0, academic_avg: 78, owner_id: null, ref_number: "TTI-2026-712034" },
    { id: "app-004", student_name: "Nomvula Zulu", student_no: "UKZN23/0019877", institution: "University of KwaZulu-Natal", programme: "BSocSci Psychology", year: "2nd Year", funder: "Sasol Bursaries", amount: 38000, status: "Approved", submitted_date: "3 Feb 2026", id_verified: 1, docs_complete: 1, academic_avg: 70, owner_id: null, ref_number: "TTI-2026-198774" },
    { id: "app-005", student_name: "Lwazi Motha", student_no: "SU22/0088341", institution: "Stellenbosch University", programme: "BEng Civil", year: "3rd Year", funder: "Anglo American plc", amount: 52000, status: "Rejected", submitted_date: "7 Feb 2026", id_verified: 1, docs_complete: 1, academic_avg: 48, owner_id: null, ref_number: "TTI-2026-883415" },
    { id: "app-006", student_name: "Karabo Sithole", student_no: "TUT23/0041200", institution: "Tshwane University of Technology", programme: "National Diploma IT", year: "1st Year", funder: "Sasol Bursaries", amount: 35000, status: "Submitted", submitted_date: "10 Feb 2026", id_verified: 0, docs_complete: 0, academic_avg: 61, owner_id: null, ref_number: "TTI-2026-412009" },
  ]

  await db.batch(
    apps.map((a) => ({ sql: appSql, args: a as unknown as InArgs })),
    "write"
  )

  // ── Student Documents (seeded for logged-in demo students) ────────────────
  const now = new Date().toISOString()
  const seededDocs: [string, string, string][] = [
    ["student-1", "sa_id", "ID_Thandi_Mokoena.pdf"],
    ["student-1", "registration", "UP_Registration_2026.pdf"],
    ["student-1", "academic_record", "Transcript_UP22.pdf"],
    ["student-2", "sa_id", "ID_Sipho_Dlamini.pdf"],
  ]
  await db.batch(
    seededDocs.map(([sid, key, name]) => ({
      sql: "INSERT INTO student_documents (student_id, doc_type, file_name, uploaded_at) VALUES (?, ?, ?, ?)",
      args: [sid, key, name, now],
    })),
    "write"
  )

  // ── Funder Students ────────────────────────────────────────────────────────
  const fsSql = `INSERT INTO funder_students (id, name, student_no, institution, programme, year, amount, disbursed, status, academic_avg, funder_id) VALUES (@id, @name, @student_no, @institution, @programme, @year, @amount, @disbursed, @status, @academic_avg, @funder_id)`
  const moduleSql = "INSERT INTO student_modules (funder_student_id, name, complete) VALUES (@funder_student_id, @name, @complete)"
  const MODULES = ["Orientation", "Financial Literacy", "CV Writing", "Workplace Readiness", "Entrepreneurship"]

  const funderStudents = [
    { id: "fs-001", name: "Thandi Mokoena", student_no: "UP22/0045812", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", amount: 48500, disbursed: 36375, status: "Approved", academic_avg: 72, funder_id: "funder-1", modules: [true, true, true, false, false] },
    { id: "fs-003", name: "Anele Khumalo", student_no: "UCT24/0071203", institution: "University of Cape Town", programme: "BEng Mechanical", year: "1st Year", amount: 55000, disbursed: 0, status: "Pending", academic_avg: 78, funder_id: "funder-1", modules: [false, false, false, false, false] },
    { id: "fs-005", name: "Lwazi Motha", student_no: "SU22/0088341", institution: "Stellenbosch University", programme: "BEng Civil", year: "3rd Year", amount: 52000, disbursed: 52000, status: "Rejected", academic_avg: 48, funder_id: "funder-1", modules: [true, true, false, false, false] },
  ]

  const fsStatements: { sql: string; args: InArgs }[] = []
  for (const fs of funderStudents) {
    const { modules, ...rest } = fs
    fsStatements.push({ sql: fsSql, args: rest as unknown as InArgs })
    modules.forEach((complete, i) => {
      fsStatements.push({
        sql: moduleSql,
        args: { funder_student_id: fs.id, name: MODULES[i], complete: complete ? 1 : 0 },
      })
    })
  }
  await db.batch(fsStatements, "write")

  // ── Workshops ──────────────────────────────────────────────────────────────
  const wsSql = "INSERT INTO workshops (title, date, status, facilitator, duration, student_id) VALUES (@title, @date, @status, @facilitator, @duration, @student_id)"

  const workshops = [
    { title: "Financial Literacy & Budgeting", date: "14 Mar 2026", status: "Attended", facilitator: "T. Nkosi", duration: "3 hrs", student_id: "student-1" },
    { title: "CV Writing & Professional Branding", date: "28 Mar 2026", status: "Attended", facilitator: "M. van Wyk", duration: "2 hrs", student_id: "student-1" },
    { title: "Workplace Readiness & Ethics", date: "11 Apr 2026", status: "Upcoming", facilitator: "S. Dlamini", duration: "4 hrs", student_id: "student-1" },
    { title: "Entrepreneurship & Business Planning", date: "25 Apr 2026", status: "Upcoming", facilitator: "R. Pillay", duration: "3 hrs", student_id: "student-1" },
    { title: "Orientation & Programme Overview", date: "7 Mar 2026", status: "Attended", facilitator: "T. Nkosi", duration: "2 hrs", student_id: "student-2" },
    { title: "Financial Literacy & Budgeting", date: "21 Mar 2026", status: "Missed", facilitator: "T. Nkosi", duration: "3 hrs", student_id: "student-2" },
    { title: "CV Writing & Professional Branding", date: "4 Apr 2026", status: "Upcoming", facilitator: "M. van Wyk", duration: "2 hrs", student_id: "student-2" },
    { title: "Workplace Readiness & Ethics", date: "18 Apr 2026", status: "Upcoming", facilitator: "S. Dlamini", duration: "4 hrs", student_id: "student-2" },
  ]

  await db.batch(
    workshops.map((w) => ({ sql: wsSql, args: w as unknown as InArgs })),
    "write"
  )

  // ── Funders ────────────────────────────────────────────────────────────────
  const funderSql = "INSERT INTO funders (id, name, contact, email, budget, students, level, status) VALUES (@id, @name, @contact, @email, @budget, @students, @level, @status)"

  const funders = [
    { id: "f1", name: "Shell South Africa", contact: "Michael Chen", email: "michael@shell.com", budget: 4000000, students: 5, level: 1, status: "Active" },
    { id: "f2", name: "Anglo American plc", contact: "Priya Naidoo", email: "priya@angloamerican.com", budget: 2500000, students: 3, level: 1, status: "Active" },
    { id: "f3", name: "Sasol Bursaries", contact: "Jacques Rossouw", email: "jacques@sasol.com", budget: 1800000, students: 2, level: 1, status: "Active" },
    { id: "f4", name: "Nedbank Foundation", contact: "Aisha Patel", email: "aisha@nedbank.co.za", budget: 1200000, students: 0, level: 2, status: "Pending Setup" },
  ]

  await db.batch(
    funders.map((f) => ({ sql: funderSql, args: f as unknown as InArgs })),
    "write"
  )
}
