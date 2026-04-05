import Database from "better-sqlite3"
import path from "path"

// Vercel's filesystem is read-only except for /tmp
const DB_PATH = process.env.VERCEL
  ? "/tmp/bursary.db"
  : path.join(process.cwd(), "data", "bursary.db")

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    // Ensure the data directory exists
    const fs = require("fs")
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    _db = new Database(DB_PATH)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")
    initSchema(_db)
    seedIfEmpty(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
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
      department TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_no TEXT NOT NULL,
      institution TEXT NOT NULL,
      programme TEXT NOT NULL,
      year TEXT NOT NULL,
      funder TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Pending', 'Under Review', 'Rejected')),
      submitted_date TEXT NOT NULL,
      id_verified INTEGER NOT NULL DEFAULT 0,
      docs_complete INTEGER NOT NULL DEFAULT 0,
      academic_avg REAL NOT NULL DEFAULT 0,
      -- Extra fields from the application form
      id_number TEXT,
      email TEXT,
      phone TEXT,
      annual_income TEXT,
      need_statement TEXT,
      ref_number TEXT,
      owner_id TEXT
    );

    CREATE TABLE IF NOT EXISTS funder_students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      student_no TEXT NOT NULL,
      institution TEXT NOT NULL,
      programme TEXT NOT NULL,
      year TEXT NOT NULL,
      amount REAL NOT NULL,
      disbursed REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Pending', 'Under Review', 'Rejected')),
      academic_avg REAL NOT NULL DEFAULT 0,
      funder_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funder_student_id TEXT NOT NULL REFERENCES funder_students(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      complete INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Attended', 'Upcoming', 'Missed')),
      facilitator TEXT NOT NULL,
      duration TEXT NOT NULL,
      student_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT NOT NULL,
      budget REAL NOT NULL,
      students INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS application_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT
    );

    CREATE TABLE IF NOT EXISTS student_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      UNIQUE(student_id, doc_type)
    );
  `)
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }
  if (count.c > 0) return

  // ── Users ──────────────────────────────────────────────────────────────────
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, student_no, ref_no, institution, programme, year, funder_name, bursary_amount, status, company, bbbee_level, total_budget, department)
    VALUES (@id, @name, @email, @role, @student_no, @ref_no, @institution, @programme, @year, @funder_name, @bursary_amount, @status, @company, @bbbee_level, @total_budget, @department)
  `)

  const users = [
    { id: "student-1", name: "Thandi Mokoena", email: "thandi@student.up.ac.za", role: "student", student_no: "UP22/0045812", ref_no: "TTI-2026-8472", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", funder_name: "Anglo American plc", bursary_amount: 48500, status: "Approved", company: null, bbbee_level: null, total_budget: null, department: null },
    { id: "student-2", name: "Sipho Dlamini", email: "sipho@student.wits.ac.za", role: "student", student_no: "WITS21/0033124", ref_no: "TTI-2026-3301", institution: "University of the Witwatersrand", programme: "BCom Accounting", year: "2nd Year", funder_name: "Sasol Bursaries", bursary_amount: 42000, status: "Under Review", company: null, bbbee_level: null, total_budget: null, department: null },
    { id: "funder-0", name: "Michael Chen", email: "michael@shell.com", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Shell South Africa", bbbee_level: 1, total_budget: 4000000, department: null },
    { id: "funder-1", name: "Priya Naidoo", email: "priya@angloamerican.com", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Anglo American plc", bbbee_level: 1, total_budget: 2500000, department: null },
    { id: "funder-2", name: "Jacques Rossouw", email: "jacques@sasol.com", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Sasol Bursaries", bbbee_level: 1, total_budget: 1800000, department: null },
    { id: "funder-3", name: "Aisha Patel", email: "aisha@nedbank.co.za", role: "funder", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: "Nedbank Foundation", bbbee_level: 2, total_budget: 1200000, department: null },
    { id: "admin-1", name: "Lerato Sithole", email: "lerato@ttibursaries.co.za", role: "admin", student_no: null, ref_no: null, institution: null, programme: null, year: null, funder_name: null, bursary_amount: null, status: null, company: null, bbbee_level: null, total_budget: null, department: "Bursary Operations" },
  ]

  const seedUsers = db.transaction(() => {
    for (const u of users) insertUser.run(u)
  })
  seedUsers()

  // ── Applications ───────────────────────────────────────────────────────────
  const insertApp = db.prepare(`
    INSERT INTO applications (id, student_name, student_no, institution, programme, year, funder, amount, status, submitted_date, id_verified, docs_complete, academic_avg, owner_id)
    VALUES (@id, @student_name, @student_no, @institution, @programme, @year, @funder, @amount, @status, @submitted_date, @id_verified, @docs_complete, @academic_avg, @owner_id)
  `)

  const apps = [
    { id: "app-001", student_name: "Thandi Mokoena", student_no: "UP22/0045812", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", funder: "Anglo American plc", amount: 48500, status: "Approved", submitted_date: "12 Jan 2026", id_verified: 1, docs_complete: 0, academic_avg: 72, owner_id: "student-1" },
    { id: "app-002", student_name: "Sipho Dlamini", student_no: "WITS21/0033124", institution: "University of the Witwatersrand", programme: "BCom Accounting", year: "2nd Year", funder: "Sasol Bursaries", amount: 42000, status: "Under Review", submitted_date: "18 Jan 2026", id_verified: 1, docs_complete: 0, academic_avg: 65, owner_id: "student-2" },
    { id: "app-003", student_name: "Anele Khumalo", student_no: "UCT24/0071203", institution: "University of Cape Town", programme: "BEng Mechanical", year: "1st Year", funder: "Anglo American plc", amount: 55000, status: "Pending", submitted_date: "21 Jan 2026", id_verified: 0, docs_complete: 0, academic_avg: 78, owner_id: null },
    { id: "app-004", student_name: "Nomvula Zulu", student_no: "UKZN23/0019877", institution: "University of KwaZulu-Natal", programme: "BSocSci Psychology", year: "2nd Year", funder: "Sasol Bursaries", amount: 38000, status: "Approved", submitted_date: "3 Feb 2026", id_verified: 1, docs_complete: 1, academic_avg: 70, owner_id: null },
    { id: "app-005", student_name: "Lwazi Motha", student_no: "SU22/0088341", institution: "Stellenbosch University", programme: "BEng Civil", year: "3rd Year", funder: "Anglo American plc", amount: 52000, status: "Rejected", submitted_date: "7 Feb 2026", id_verified: 1, docs_complete: 1, academic_avg: 48, owner_id: null },
    { id: "app-006", student_name: "Karabo Sithole", student_no: "TUT23/0041200", institution: "Tshwane University of Technology", programme: "National Diploma IT", year: "1st Year", funder: "Sasol Bursaries", amount: 35000, status: "Pending", submitted_date: "10 Feb 2026", id_verified: 0, docs_complete: 0, academic_avg: 61, owner_id: null },
  ]

  const seedApps = db.transaction(() => {
    for (const a of apps) insertApp.run(a)
  })
  seedApps()

  // ── Student Documents (seeded for logged-in demo students) ────────────────
  const insertDoc = db.prepare(`
    INSERT INTO student_documents (student_id, doc_type, file_name, uploaded_at)
    VALUES (?, ?, ?, ?)
  `)
  const seededDocs: [string, string, string][] = [
    // Thandi has 3 of 4 uploaded (missing photograph)
    ["student-1", "sa_id", "ID_Thandi_Mokoena.pdf"],
    ["student-1", "registration", "UP_Registration_2026.pdf"],
    ["student-1", "academic_record", "Transcript_UP22.pdf"],
    // Sipho has 1 of 4 uploaded
    ["student-2", "sa_id", "ID_Sipho_Dlamini.pdf"],
  ]
  const seedDocs = db.transaction(() => {
    const now = new Date().toISOString()
    for (const [sid, key, name] of seededDocs) insertDoc.run(sid, key, name, now)
  })
  seedDocs()

  // ── Funder Students ────────────────────────────────────────────────────────
  const insertFS = db.prepare(`
    INSERT INTO funder_students (id, name, student_no, institution, programme, year, amount, disbursed, status, academic_avg, funder_id)
    VALUES (@id, @name, @student_no, @institution, @programme, @year, @amount, @disbursed, @status, @academic_avg, @funder_id)
  `)
  const insertModule = db.prepare(`
    INSERT INTO student_modules (funder_student_id, name, complete)
    VALUES (@funder_student_id, @name, @complete)
  `)

  const MODULES = ["Orientation", "Financial Literacy", "CV Writing", "Workplace Readiness", "Entrepreneurship"]

  const funderStudents = [
    { id: "fs-001", name: "Thandi Mokoena", student_no: "UP22/0045812", institution: "University of Pretoria", programme: "BSc Computer Science", year: "3rd Year", amount: 48500, disbursed: 36375, status: "Approved", academic_avg: 72, funder_id: "funder-1", modules: [true, true, true, false, false] },
    { id: "fs-003", name: "Anele Khumalo", student_no: "UCT24/0071203", institution: "University of Cape Town", programme: "BEng Mechanical", year: "1st Year", amount: 55000, disbursed: 0, status: "Pending", academic_avg: 78, funder_id: "funder-1", modules: [false, false, false, false, false] },
    { id: "fs-005", name: "Lwazi Motha", student_no: "SU22/0088341", institution: "Stellenbosch University", programme: "BEng Civil", year: "3rd Year", amount: 52000, disbursed: 52000, status: "Rejected", academic_avg: 48, funder_id: "funder-1", modules: [true, true, false, false, false] },
  ]

  const seedFS = db.transaction(() => {
    for (const fs of funderStudents) {
      const { modules, ...rest } = fs
      insertFS.run(rest)
      modules.forEach((complete, i) => {
        insertModule.run({ funder_student_id: fs.id, name: MODULES[i], complete: complete ? 1 : 0 })
      })
    }
  })
  seedFS()

  // ── Workshops ──────────────────────────────────────────────────────────────
  const insertWS = db.prepare(`
    INSERT INTO workshops (title, date, status, facilitator, duration, student_id)
    VALUES (@title, @date, @status, @facilitator, @duration, @student_id)
  `)

  const workshops = [
    // Thandi (student-1)
    { title: "Financial Literacy & Budgeting", date: "14 Mar 2026", status: "Attended", facilitator: "T. Nkosi", duration: "3 hrs", student_id: "student-1" },
    { title: "CV Writing & Professional Branding", date: "28 Mar 2026", status: "Attended", facilitator: "M. van Wyk", duration: "2 hrs", student_id: "student-1" },
    { title: "Workplace Readiness & Ethics", date: "11 Apr 2026", status: "Upcoming", facilitator: "S. Dlamini", duration: "4 hrs", student_id: "student-1" },
    { title: "Entrepreneurship & Business Planning", date: "25 Apr 2026", status: "Upcoming", facilitator: "R. Pillay", duration: "3 hrs", student_id: "student-1" },
    // Sipho (student-2)
    { title: "Orientation & Programme Overview", date: "7 Mar 2026", status: "Attended", facilitator: "T. Nkosi", duration: "2 hrs", student_id: "student-2" },
    { title: "Financial Literacy & Budgeting", date: "21 Mar 2026", status: "Missed", facilitator: "T. Nkosi", duration: "3 hrs", student_id: "student-2" },
    { title: "CV Writing & Professional Branding", date: "4 Apr 2026", status: "Upcoming", facilitator: "M. van Wyk", duration: "2 hrs", student_id: "student-2" },
    { title: "Workplace Readiness & Ethics", date: "18 Apr 2026", status: "Upcoming", facilitator: "S. Dlamini", duration: "4 hrs", student_id: "student-2" },
  ]

  const seedWS = db.transaction(() => {
    for (const w of workshops) insertWS.run(w)
  })
  seedWS()

  // ── Funders ────────────────────────────────────────────────────────────────
  const insertFunder = db.prepare(`
    INSERT INTO funders (id, name, contact, email, budget, students, level, status)
    VALUES (@id, @name, @contact, @email, @budget, @students, @level, @status)
  `)

  const funders = [
    { id: "f1", name: "Shell South Africa", contact: "Michael Chen", email: "michael@shell.com", budget: 4000000, students: 5, level: 1, status: "Active" },
    { id: "f2", name: "Anglo American plc", contact: "Priya Naidoo", email: "priya@angloamerican.com", budget: 2500000, students: 3, level: 1, status: "Active" },
    { id: "f3", name: "Sasol Bursaries", contact: "Jacques Rossouw", email: "jacques@sasol.com", budget: 1800000, students: 2, level: 1, status: "Active" },
    { id: "f4", name: "Nedbank Foundation", contact: "Aisha Patel", email: "aisha@nedbank.co.za", budget: 1200000, students: 0, level: 2, status: "Pending Setup" },
  ]

  const seedFunders = db.transaction(() => {
    for (const f of funders) insertFunder.run(f)
  })
  seedFunders()
}
