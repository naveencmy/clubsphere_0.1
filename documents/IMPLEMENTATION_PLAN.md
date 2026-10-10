# ClubSphere: End-to-End Implementation Plan

**Target Platform:** ClubSphere (v0.1)  
**Tech Stack:** React.js, Node.js, Express.js, PostgreSQL (Complete JavaScript)  
**Repository:** [https://github.com/naveencmy/clubsphere_0.1.git](https://github.com/naveencmy/clubsphere_0.1.git)  
**Status:** Ready for Execution  

---

## Overview

This implementation plan translates the product requirements from [PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md](PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md) and architectural patterns from [TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md](TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md) into concrete, sequential engineering phases.

```
+----------------------------------------------------------------------------------------------------+
|                                    IMPLEMENTATION ROADMAP                                          |
|                                                                                                    |
|  [ Phase 0: Scaffolding ]  -->  [ Phase 1: DB & Auth ]  -->  [ Phase 2: Express APIs ]             |
|   • backend/ & frontend/         • PostgreSQL schema.sql      • 6 Core Domain Modules              |
|   • package.json setups          • Better Auth in JS          • Sub-200ms Scanner Controller       |
|   • Environment configs          • Tenant RLS Middleware      • Atomic Inventory Locks             |
|                                                                                                    |
|                                            |                                                       |
|                                            v                                                       |
|                                                                                                    |
|  [ Phase 5: Production Launch ] <-- [ Phase 4: Verification ] <-- [ Phase 3: React.js UI ]         |
|   • Nginx / Cloudflare config        • Latency benchmark (<150ms)  • Scanner HUD PWA Viewfinder    |
|   • CI/CD pipeline                   • Drop concurrency load test  • Kanban Board & Storefront     |
|   • GitHub origin/main push          • RLS security fuzzing        • Dual-Entry Ledger Datagrid    |
+----------------------------------------------------------------------------------------------------+
```

---

## Phase 0: Workspace Scaffolding & Setup
* **Objective:** Establish the directory structure, dependencies, and environment configurations for both frontend and backend.

### Tasks:
- [ ] **0.1 Backend Scaffolding:**
  - Create directory: `backend/`
  - Initialize Node.js ESM `package.json` (`"type": "module"`)
  - Install dependencies: `express`, `pg`, `better-auth`, `cors`, `dotenv`, `express-rate-limit`, `node-cron`, `zod`
  - Create `.env.example` with `PORT`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `REDIS_URL`, `TICKET_SIGNING_SECRET`
- [ ] **0.2 Frontend Scaffolding:**
  - Create directory: `frontend/`
  - Initialize React.js application using Vite (`npm create vite@latest frontend -- --template react`)
  - Install dependencies: `react`, `react-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/forms`
  - Configure Tailwind / CSS tokens matching [DESIGN.md](DESIGN.md) (Google Sans, Inter, JetBrains Mono, primary blue `#1A73E8`)
- [ ] **0.3 Database Initialization:**
  - Connect to target PostgreSQL instance
  - Execute [`documents/schema.sql`](schema.sql) to provision all tables, ENUMs, triggers, and RLS policies

---

## Phase 1: Database Connection & Authentication Core
* **Objective:** Establish pooled PostgreSQL connectivity with tenant RLS isolation and Better Auth session wiring in pure JavaScript.

### Tasks:
- [ ] **1.1 PostgreSQL Pool Wrapper (`backend/src/config/db.js`):**
  - Configure `pg.Pool` with connection pooling, keep-alive, and error logging
  - Create helper `withTenantContext(clubId, callback)` to execute queries under `SET LOCAL app.current_club_id = $1`
- [ ] **1.2 Better Auth Configuration (`backend/src/auth/auth.js`):**
  - Initialize Better Auth with PostgreSQL pool adapter
  - Configure `organization` plugin with roles: `president`, `treasurer`, `committee_lead`, `volunteer`, `member`
  - Configure secure HttpOnly cookie settings (`SameSite=Lax`, 7-day session validity)
- [ ] **1.3 Multi-Tenant Middleware (`backend/src/middleware/tenant.js`):**
  - Extract tenant slug from subdomain (`skyline.clubsphere.edu`) or header (`x-club-slug`)
  - Verify user session and organizational role
  - Attach `req.user`, `req.club`, and `req.membership` to the request object

---

## Phase 2: Core Domain Backend Modules (Express.js)
* **Objective:** Implement modular routers, controllers, and services for the 6 core business subsystems in pure JavaScript.

### Tasks:
- [ ] **2.1 Membership Subsystem (`backend/src/modules/memberships/`):**
  - Registration endpoint and profile intake
  - Dynamic HMAC-SHA256 QR token generator (`/memberships/me/pass`)
  - Dues payment integration via Stripe webhook
- [ ] **2.2 Event Ticketing & Rapid Scanner (`backend/src/modules/ticketing/`):**
  - Ticket allocation and tier management (`member_price` vs `non_member_price`)
  - Sub-200ms door scan endpoint: `POST /api/v1/events/:eventId/check-in`
  - Atomic conditional update with double-scan prevention (`WHERE status = 'ISSUED'`)
- [ ] **2.3 Merchandise & Inventory Engine (`backend/src/modules/commerce/`):**
  - SKU & variant catalog manager (Size S–XXL, colors)
  - Two-Phase Reservation endpoint: `POST /api/v1/commerce/reserve` using `SELECT ... FOR UPDATE` row locks
  - 10-minute temporary cart hold with Redis TTL
- [ ] **2.4 Collaborative Task & Kanban Subsystem (`backend/src/modules/tasks/`):**
  - CRUD endpoints for tasks linked to events/fundraisers
  - Column status updater (`TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `DONE`)
  - Volunteer assignment and checklist item tracking
- [ ] **2.5 Automated Dual-Entry Ledger & Expenses (`backend/src/modules/ledger/`):**
  - General Ledger chart of accounts viewer (`1010 Cash`, `2010 Payables`, `4010 Dues`, etc.)
  - Mobile receipt upload endpoint with presigned S3/R2 storage
  - Dual-signoff expense approval workflow (Treasurer review $\rightarrow$ President sign-off)
- [ ] **2.6 Background Cron Schedulers (`backend/src/cron/cron-jobs.js`):**
  - Daily 02:00 UTC cycle: Membership status transitions (`RENEWAL_DUE`, `GRACE_PERIOD`, `EXPIRED`)
  - 2-minute cycle: Release expired 10-minute cart inventory holds

---

## Phase 3: Frontend Client Implementation (React.js)
* **Objective:** Construct the responsive user interfaces, mobile PWA scanner, and executive dashboards matching DESIGN.md.

### Tasks:
- [ ] **3.1 Global State & Authentication Provider (`frontend/src/context/`):**
  - `AuthContext.jsx`: Session state, login, registration, and logout flows
  - `TenantContext.jsx`: Active club metadata and role state
- [ ] **3.2 Rapid Door Scanner PWA Viewfinder (`frontend/src/components/scanner/ScannerHUD.jsx`):**
  - Full-screen camera stream using HTML5 WebCodecs / BarcodeDetector
  - Sub-15ms local sanity checks (timestamp freshness, nonce deduplication)
  - Web Audio API chimes (523Hz C5 tone for valid pass, 180Hz warning buzzer for duplicate)
  - Haptic vibration feedback (`navigator.vibrate`)
- [ ] **3.3 Public Member Portal & Storefront:**
  - Self-service member registration and dynamic QR pass display
  - Event discovery, tiered ticket reservation, and checkout
  - Apparel merchandise catalog with live variant selector (Sizes S–XXL) and inventory counter
- [ ] **3.4 Executive Club Dashboard:**
  - Real-time KPI summary (active members, ticket revenue, balance sheet)
  - Collaborative Kanban Board with drag-and-drop task movement
  - Dual-Entry Financial Ledger Datagrid with monospaced numbers and PDF/CSV export
  - Volunteer Expense Desk with receipt zoom modal and dual approval buttons

---

## Phase 4: Testing, Benchmarking & Security Fuzzing
* **Objective:** Validate performance budgets and zero-trust security controls.

### Tasks:
- [ ] **4.1 Latency Benchmark:**
  - Execute load test on `POST /api/v1/events/:id/check-in` using k6 (Target: P95 $< 150\text{ms}$, P99 $< 200\text{ms}$)
- [ ] **4.2 Stock Oversell Fuzz Test:**
  - Simulate 100 concurrent checkout threads against 5 available hoodie variants
  - Assert exactly 5 orders succeed and 95 receive HTTP 409 Conflict
- [ ] **4.3 Row-Level Security Isolation Audit:**
  - Verify that queries executed with `app.current_club_id = club_a` return zero records from `club_b`
- [ ] **4.4 Ledger Invariant Audit:**
  - Assert database trigger rejects any journal entry where total debits $\neq$ total credits

---

## Phase 5: Production Deployment & GitHub Sync
* **Objective:** Deploy to production and sync all code to remote repository.

### Tasks:
- [ ] Configure environment variables on production host
- [ ] Run database migrations (`psql -f documents/schema.sql`)
- [ ] Build React frontend bundle (`npm run build`)
- [ ] Commit all code and push to GitHub `main` branch
