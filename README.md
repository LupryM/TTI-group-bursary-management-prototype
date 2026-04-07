# TTI Group Bursary Management Prototype

A full-stack web application for managing student bursary applications, tracking skills development, and managing funder relationships. Built with Next.js, TypeScript, and SQLite.

## Project Structure

```
app/
├── api/                          # Backend API routes
│   ├── applications/            # Bursary application endpoints
│   ├── documents/               # Document upload endpoints
│   ├── students/                # Student data endpoints
│   ├── workshops/               # Skills workshop endpoints
│   ├── funders/                 # Funder management endpoints
│   └── users/                   # User management endpoints
├── portal/
│   ├── student/                 # Student interface
│   │   ├── dashboard/           # View bursary status and workshops
│   │   ├── apply/               # Submit bursary application
│   │   └── profile/             # Student profile management
│   ├── admin/                   # Admin interface
│   │   ├── tracker/             # Skills progress tracking
│   │   ├── applications/        # Application management
│   │   ├── funders/             # Funder management
│   │   └── treasury/            # Financial overview
│   └── funder/                  # Funder interface
│       ├── overview/            # Funder dashboard
│       ├── students/            # View funded students
│       └── reports/             # Funding reports
components/                       # Reusable React components
lib/                              # Utility functions
public/                           # Static assets
```

## Features

### 1. Student Bursary Dashboard
**Location:** `/portal/student/dashboard`

Students can:
- View bursary status (Approved, Pending, Disbursed)
- See enrolled skills workshops with descriptions
- Track workshop progress and completion status
- Upload supporting documents (front-end validation only)
- View awarded bursary amounts

**Test the dashboard:**
1. Start the application
2. Navigate to `/portal/student/dashboard`
3. View mock bursary data (status, amounts, dates)
4. View enrolled workshops
5. Test document upload field (no backend storage)

### 2. Bursary Application Submission
**Location:** `/portal/student/apply`

Students submit applications with:
- Full name
- Student number
- University/Institution
- Financial need statement
- Contact information

**Features:**
- Form validation on client side
- Submits to `/api/applications` endpoint
- Stores submissions in SQLite database
- Returns unique application reference number
- Admin can approve/reject applications from admin panel

**Test the application form:**
1. Navigate to `/portal/student/apply`
2. Fill in all required fields
3. Submit the form
4. Verify success message with application reference number
5. Check admin panel at `/portal/admin/applications` to see submitted applications
6. Use admin panel to approve or reject applications

### 3. Skills Development Progress Tracker (Admin Panel)
**Location:** `/portal/admin/tracker`

Admin features:
- List of all students with awarded bursary amounts
- Track completed skills modules (CV Writing, Interview Prep, Excel Basics, etc.)
- Visual progress bar for each student (0-100%)
- Mark modules as complete/incomplete
- View overall program completion status

**Test the admin tracker:**
1. Navigate to `/portal/admin/tracker`
2. View list of students with progress bars
3. Click modules to mark as complete
4. Verify progress bar updates
5. Check that completion status persists

## Quick Start

The application is deployed and accessible at the live link above. No setup required to test the application.

For local development or code audit, follow the setup below.

## Local Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/LupryM/TTI-group-bursary-management-prototype.git
cd tti-group-bursary-management-prototype
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
npm start
```

## Testing Guide

### Manual Testing Scenarios

Test on the **live application** or locally by running `npm run dev`.

#### Test 1: Student Dashboard Flow
1. Go to `/portal/student/dashboard` (live: append to Vercel link above)
2. Verify bursary status displays correctly
3. Verify enrolled workshops appear in list
4. Test document upload field (should accept file selection)
5. Check responsiveness on mobile and desktop

#### Test 2: Application Submission
1. Go to `/portal/student/apply`
2. Leave fields empty and submit - should show validation errors
3. Fill all fields with valid data
4. Submit form
5. Confirm success message with reference number
6. Check admin panel to verify data was stored

#### Test 3: Admin Application Review
1. Go to `/portal/admin/applications`
2. Verify list shows submitted applications
3. Click approve on an application
4. Verify status updates to "Approved"
5. Click reject on another application
6. Verify status updates to "Rejected"

#### Test 4: Skills Progress Tracking
1. Go to `/portal/admin/tracker`
2. Verify all students display with progress bars
3. Click to mark a module complete
4. Verify progress bar increases
5. Mark multiple modules complete
6. Confirm progress bar reaches 100% when all modules done

#### Test 5: Responsive Design
1. Open `/portal/student/dashboard` in browser
2. Test on desktop (1920px width)
3. Test on tablet (768px width)
4. Test on mobile (375px width)
5. Verify all content is accessible and readable

#### Test 6: Form Validation
1. Go to `/portal/student/apply`
2. Test each field:
   - Name: Try empty, then valid name
   - Student Number: Try invalid format, then valid
   - University: Try empty, then valid entry
   - Statement: Try too short, then adequate text
3. Verify error messages appear and disappear

### API Testing

Use curl or Postman to test endpoints. Replace `BASE_URL` with either:
- Live: `https://placeholder-vercel-link.vercel.app`
- Local: `http://localhost:3000`

```bash
# Get all applications
curl BASE_URL/api/applications

# Create new application
curl -X POST BASE_URL/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "studentNumber": "12345678",
    "university": "University of South Africa",
    "statement": "Financial assistance needed for tuition..."
  }'

# Get all students
curl BASE_URL/api/students

# Get all workshops
curl BASE_URL/api/workshops
```

## Database

The application uses SQLite database with the following tables:
- `students` - Student records with bursary amounts
- `applications` - Bursary application submissions
- `workshops` - Available skills development workshops
- `enrollments` - Student workshop enrollments
- `documents` - Document metadata (front-end only)
- `funders` - Funder organization information

**Live Environment:** Database is hosted and accessible through the deployed application.

**Local Development:** Uses local `tti_bursary.db` file.

## Technology Stack

- **Frontend:** React 19, Next.js 16, TypeScript
- **UI Components:** Radix UI, Tailwind CSS
- **Forms:** React Hook Form, Zod validation
- **Database:** SQLite
- **Charts:** Recharts
- **Package Manager:** npm

## Security Notes

This is a prototype. For production use:

### Authentication
- Implement JWT or session-based authentication
- Add password hashing (bcrypt, argon2)
- Add role-based access control (RBAC)
- Validate user roles on protected routes

### Data Protection
- Encrypt sensitive data at rest (student numbers, financial info)
- Use HTTPS only in production
- Implement access logs for audit trails
- Add rate limiting on API endpoints

### Document Handling
- Store uploaded files in secure cloud storage (AWS S3, Azure Blob)
- Validate file types and sizes on backend
- Scan files for malware
- Encrypt files before storage

### Database
- Use prepared statements to prevent SQL injection
- Implement backup and recovery procedures
- Restrict direct database access
- Use connection pooling

## Development

### Linting
```bash
npm run lint
```

### Project Configuration
- TypeScript: `tsconfig.json`
- Next.js: `next.config.mjs`
- Tailwind: Built-in with Next.js
- ESLint: Configured in root directory

## Known Limitations

- Document uploads are front-end only (no actual storage)
- Authentication is not implemented (anyone can access any portal)
- Admin approval/rejection is a basic toggle (no workflow engine)
- Progress tracking uses mock data
- No email notifications implemented
- No user session management
