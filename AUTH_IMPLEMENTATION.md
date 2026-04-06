# Authentication & Role-Based Access Control (RBAC) Implementation Strategy

Although authentication is mocked for the purposes of this functional prototype, a production-ready system requires a secure, battle-tested standard for handling Login Roles across different portals (Admin, Funder, and Student).

## Recommended Authentication Stack

If implementing this within the current architecture (Next.js Application), the recommended stack is **NextAuth.js (Auth.js)** paired with **JSON Web Tokens (JWT)** and a modern credential provider or SSO integration.

### Core Architecture

1.  **Role Verification at Login:**
    *   Upon login (via email/password or OAuth), the authentication handler intercepts the provider response.
    *   A lookup is performed in the Turso `users` table to retrieve the authenticated user's `role` (e.g., `"admin"`, `"funder"`, `"student"`).
2.  **JWT Enrichment:**
    *   The `role` and the `user ID` (and potentially a `studentNo` if applicable) are securely injected into the JWT payload during the `jwt()` callback.
    *   The session is generated holding these minimal, encrypted claims.
3.  **Middleware Gateway Routing:**
    *   We utilize Next.js Middleware (`middleware.ts`) to actively intercept incoming requests before the page executes.
    *   The middleware extracts the token. If an unauthorized role attempts to access a protected route (e.g., a `student` trying to navigate to `/portal/admin/*`), the middleware issues an immediate HTTP 302 Redirect to `/login` or an `Unauthorized` page.
    *   This ensures route protection at the edge, rather than relying solely on client-side React rendering logic.

### Database Schema for Auth Support
To support this properly, the minimal `users` schema would be:

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'funder', 'student', 'finance')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Expanding Roles (Example Setup)

To support the separation of concerns (combating "feature creep"):

*   `admin_admissions`: Allowed to review intake documents, verify IDs, and transition Applicants to Bursary Holders.
*   `admin_academic`: Restricted strictly to the **Skills Development Progress Tracker** to approve modules and monitor progress. No access to financial data endpoints.
*   `admin_finance`: Access restricted to a Treasury/Payouts dashboard for authorizing ZAR disbursements based on academic milestones.
*   `student`: Can only make `GET` requests to their personal dashboard fetching their specific `studentNo`.
*   `funder`: Can access aggregated reports and cohort visualizations but cannot modify status.

### Summary
By implementing **Auth.js** backed by an encrypted **JWT strategy** and strict **Next.js Middleware edge-routing**, the Bursary System will provide air-tight compartmentalization of duties, ensuring that academic trackers and financial ledgers are protected by true systemic gatekeeping.
