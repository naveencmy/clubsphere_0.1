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
- [ ] **2.1 Membership Subsystem & Renewal Reminder Engine (`backend/src/modules/memberships/`):**
  - Registration endpoint and profile intake with student ID validation
  - Dynamic HMAC-SHA256 QR token generator (`/memberships/me/pass`)
  - Dues payment integration via Stripe webhook (`checkout.session.completed`)
  - Multi-channel automated renewal reminder worker (T-30, T-7, T-1 days before expiration) with 1-click Stripe renewal links, grace period management (14 days), and dispatch audit logging in `membership_renewal_reminders`
- [ ] **2.2 Event Ticketing, Dual-Mode Scanner & Reconciliation (`backend/src/modules/ticketing/`):**
  - Ticket allocation and tier management (`member_price` vs `non_member_price`, capacity caps, waitlists)
  - Sub-200ms door scan endpoint: `POST /api/v1/events/:eventId/check-in` with atomic double-scan lock
  - Walk-Up Direct Member Verification endpoint: `POST /api/v1/memberships/verify-pass` for general club meetings and table booths (<120ms photo/tier badge lookup)
  - Per-Event Financial & Turnout Reconciliation endpoint: `GET /api/v1/events/:eventId/reconciliation` (backed by `view_event_financial_summary`) reporting capacity, tickets sold, actual turnout %, gross revenue, direct expenses, net profit, and 1-click executive PDF export
- [ ] **2.3 Merchandise & Inventory Engine (`backend/src/modules/commerce/`):**
  - SKU & variant catalog manager (Size S–XXL, colors, available vs reserved stock)
  - Membership-Aware Pricing Resolver: Automatic tier discount detection, dynamic storefront discount badges (`"Member Exclusive: $32 (Save $13)"`), and checkout cart upsell modal
  - Two-Phase Reservation endpoint: `POST /api/v1/commerce/reserve` using PostgreSQL `SELECT ... FOR UPDATE` row locks with 10-minute temporary cart hold backed by Redis TTL
- [ ] **2.4 Collaborative Tasks, Fundraiser Campaigns & Volunteer Shifts (`backend/src/modules/tasks/`):**
  - CRUD endpoints for tasks linked to events/fundraisers with column status (`BACKLOG` $\rightarrow$ `TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `DONE`)
  - Fundraiser Campaign Tracker (`fundraisers` table) displaying monetary target goal vs. raised to date with real-time visual progress bar
  - Volunteer Shift Scheduler (`volunteer_shifts` table) for bake sale coordination (Supplies Runner, Baking Leads, 2-hour Table Management shifts)
  - Automated "On-Track" Health Indicator (`HEALTHY` $\ge 90\%$ shifts filled, `AT_RISK` unassigned <48h, `CRITICAL` overdue prep tasks)
- [ ] **2.5 Centralized Broadcast Hub & Timestamped Archive (`backend/src/modules/broadcast/`):**
  - Multi-channel announcement dispatcher (Web Newsfeed + Transactional Email Mailing List + PWA Push Alerts)
  - Immutable historical announcement archive with publication timestamps (`published_at`), category filters, and cryptographic SHA-256 audit hashes
  - Delivery and read receipt tracking (`announcement_read_receipts`) to verify communication delivery
- [ ] **2.6 Automated Dual-Entry Ledger & Unified Treasurer Dashboard (`backend/src/modules/ledger/`):**
  - General Ledger chart of accounts viewer (`1010 Cash`, `2010 Payables`, `4010 Dues`, `4020 Tickets`, `4030 Merch`, `4040 Fundraisers`)
  - Mobile receipt upload endpoint with presigned S3/R2 storage and metadata tagging
  - Dual-signoff expense approval workflow (Treasurer verification $\rightarrow$ President sign-off for claims > $50)
  - Unified Treasurer Executive Dashboard API (backed by `view_treasurer_financial_summary`) displaying: Total Inflows ("What Came In"), Total Outflows ("What Went Out"), Available Operating Cash Balance ("How Much Is Left"), and 1-click University Student Activities compliance export
- [ ] **2.7 Background Cron Schedulers (`backend/src/cron/cron-jobs.js`):**
  - Daily 02:00 UTC cycle: Membership renewal status transitions (`RENEWAL_DUE`, `GRACE_PERIOD`, `EXPIRED`) and email reminder dispatches
  - 2-minute cycle: Release expired 10-minute cart inventory holds

---

## Phase 3: Frontend Client Implementation (React.js)
* **Objective:** Construct the responsive user interfaces, mobile PWA scanner, and executive dashboards matching DESIGN.md.

### Tasks:
- [ ] **3.1 Global State & Authentication Provider (`frontend/src/context/`):**
  - `AuthContext.jsx`: Session state, login, registration, and logout flows via Better Auth
  - `TenantContext.jsx`: Active club metadata, slug mapping, and role state
- [ ] **3.2 Dual-Mode Rapid Door Scanner PWA (`frontend/src/components/scanner/ScannerHUD.jsx`):**
  - Mode Switcher: **Mode A (Event Ticket Check-In)** vs. **Mode B (Walk-Up Direct Member Verification)**
  - Full-screen camera stream using HTML5 WebCodecs / BarcodeDetector (<15ms client verification)
  - Web Audio API chimes (523Hz C5 tone for valid pass, 180Hz warning buzzer for duplicate) and haptic pulse
  - Instant Member Identity Card: Green badge (`ACTIVE` with photo, name, tier, expiration), Amber badge (`GRACE_PERIOD`), Red badge (`EXPIRED`) with on-the-spot self-service signup trigger
- [ ] **3.3 Public Member Portal & Storefront:**
  - Self-service member registration and dynamic HMAC-SHA256 QR pass display
  - Multi-channel timestamped announcement feed with search and unread indicators
  - Event discovery, tiered ticket reservation, and checkout
  - Apparel merchandise storefront with live variant selector (Sizes S–XXL), member discount pricing badges, and non-member cart upsell prompt
- [ ] **3.4 Executive Club Dashboard & Treasurer Console:**
  - **Unified Treasurer Executive Dashboard:** Large monospaced KPI cards for Total Inflows, Total Outflows, and Net Operating Balance; 1-click university audit export (PDF/CSV)
  - **Per-Event Reconciliation Modal:** Turnout attendance % gauge, gross revenue by tier, direct event expenses, and net profit report
  - **Fundraiser & Volunteer Shift Board:** Visual monetary progress bar, 2-hour shift roster grid (baking, supplies, table duty), and "On-Track" health badge
  - **Collaborative Kanban Board:** Drag-and-drop task movement with automated overdue warnings
  - **Volunteer Expense Desk:** Receipt photo lightbox, OCR metadata inspector, and dual-signoff approval controls

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
