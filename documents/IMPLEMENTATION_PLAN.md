# ClubSphere: End-to-End Implementation Plan

**Target Platform:** ClubSphere (v0.1)  
**Tech Stack:** React.js, Node.js, Express.js, PostgreSQL (Complete JavaScript, ESM)  
**Repository:** [https://github.com/naveencmy/clubsphere_0.1.git](https://github.com/naveencmy/clubsphere_0.1.git)  
**Status:** Ready for Execution (Vertical Slices Architecture)  

---

## Executive Summary & Architectural Alignment

This implementation plan translates the product requirements from [PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md](PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md), architectural patterns from [TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md](TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md), and database schema from [schema.sql](schema.sql) into concrete, vertical feature slices.

### Architectural Corrections & Refinements Incorporated:
1. **Simplified Expense Verification (No Complex OCR):** Replaces error-prone OCR parsing with a structured user intake form (Merchant, Date, Category, Amount, Purpose) paired with mandatory receipt proof upload (`receipt_image_url TEXT NOT NULL`) and a high-resolution reviewer lightbox.
2. **Synchronized Budget Subsystem:** Fully aligns `budgets` table, budget envelope allocations, and `view_budget_variance` across PRD, Architecture, and Database schema.
3. **Closed Transaction Lifecycles:** Explicitly models end-to-end states for ticketing (`RESERVED` $\rightarrow$ `ISSUED` $\rightarrow$ `CHECKED_IN` / `EXPIRED_RELEASED`) and merchandise orders (`PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `FULFILLED` / `CANCELLED` / `REFUNDED`).
4. **Unified Grace-Period Eligibility:** Enforces that both event tickets and merchandise discounts honor members in `('ACTIVE', 'GRACE_PERIOD')` with grace-period renewal banners.
5. **Harmonized Kanban Workflow:** Standardizes statuses across UI, APIs, and DB to: `BACKLOG` $\rightarrow$ `TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `BLOCKED` $\rightarrow$ `DONE`.
6. **Robust Reimbursement Workflow:** Defines complete decision states (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `NEEDS_CORRECTION` / `REJECTED` $\rightarrow$ `TREASURER_APPROVED` $\rightarrow$ `PRESIDENT_APPROVED` $\rightarrow$ `DISBURSED`), with strict anti-self-approval database constraints (`chk_claimant_not_approver`).
7. **Single-Source Fundraiser Ledger Sync:** Links direct donations and bake-sale proceeds directly to `fundraiser_id` while posting dual-entry journal lines to Account `4040 Fundraisers` atomically.
8. **Vertical Slice Execution:** Features are built incrementally across both backend APIs and React frontend components per domain module rather than postponing UI to the very end.

```
+--------------------------------------------------------------------------------------------------------------------+
|                                      VERTICAL SLICE ROADMAP                                                        |
|                                                                                                                    |
|  [ Phase 0: Foundations ] ----> [ Phase 1: Auth & Multi-Tenant ] ----> [ Phase 2: Memberships & Renewals ]         |
|   • Workspace & DB Init          • Backend Better-Auth (ESM)            • Lifecycle & HMAC Passes                  |
|   • Shared Design Tokens         • Frontend Auth & Tenant Context       • T-30/7/1 Reminders & Portal              |
|                                                                                                                    |
|                                                     |                                                              |
|                                                     v                                                              |
|                                                                                                                    |
|  [ Phase 5: Tasks & Fundraisers ] <-- [ Phase 4: Commerce & Merch ] <-- [ Phase 3: Events & Ticketing Lifecycle ]  |
|   • Unified 5-State Kanban        • 10-Min Cart Reservations            • Reserve -> Pay -> Issue -> Check-In      |
|   • Fundraiser Shift Roster       • Order State Machine                 • Dual-Mode Scanner HUD PWA                |
|   • Real-Time Target vs Raised    • Unified Member Discount Badges      • Per-Event Financial Reconciliation       |
|                                                                                                                    |
|          |                                                                                                         |
|          v                                                                                                         |
|                                                                                                                    |
|  [ Phase 6: Budgets & Treasurer ] --> [ Phase 7: Verification & Tests ] --> [ Phase 8: Production Launch ]         |
|   • Envelope Variance Engine      • P95 < 150ms Door Check-In            • Nginx / Cloudflare Configuration         |
|   • Form Intake + Receipt Proof   • Concurrency Stock Lock Fuzzing       • Production DB Migrations                |
|   • Unified Executive Dashboard   • RLS Multi-Tenant Leakage Tests       • Git origin/main Synchronization          |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## Phase 0: Workspace Scaffolding & Database Foundations
* **Objective:** Establish the directory structure, dependencies, and environment configurations for both frontend and backend, and initialize the PostgreSQL schema.

### Tasks:
- [ ] **0.1 Backend Scaffolding (`backend/`):**
  - Initialize Node.js ESM project (`package.json` with `"type": "module"`).
  - Install runtime dependencies: `express`, `pg`, `better-auth`, `cors`, `dotenv`, `express-rate-limit`, `node-cron`, `zod`, `multer`.
  - Install dev dependencies: `supertest`, `vitest`, `k6`.
  - Create `.env.example` with `PORT`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `REDIS_URL`, `TICKET_SIGNING_SECRET`, `STORAGE_BUCKET_URL`.
- [ ] **0.2 Frontend Scaffolding (`frontend/`):**
  - Initialize React.js application using Vite (`npm create vite@latest frontend -- --template react`).
  - Install dependencies: `react`, `react-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/forms`, `clsx`, `canvas-confetti`.
  - Configure Tailwind design tokens matching [DESIGN.md](DESIGN.md) (Google Sans, Inter, JetBrains Mono; `#1A73E8` primary blue).
- [ ] **0.3 Database Initialization:**
  - Connect to local or cloud PostgreSQL instance.
  - Execute [`documents/schema.sql`](schema.sql) to provision all ENUM types, tables, constraints, analytical views, and RLS policies.
  - Verify initialization of tables: `clubs`, `users`, `club_memberships`, `membership_renewal_reminders`, `events`, `event_ticket_tiers`, `event_tickets`, `merch_products`, `merch_orders`, `tasks`, `fundraisers`, `volunteer_shifts`, `budgets`, `expense_reimbursements`, `ledger_accounts`, `journal_entries`.

---

## Phase 1: Authentication & Multi-Tenant Core (Vertical Slice)
* **Objective:** Establish isolated multi-tenant execution and user session management in pure JavaScript across API and UI.

### Tasks:
- [ ] **1.1 PostgreSQL Tenant Pool Wrapper (`backend/src/config/db.js`):**
  - Implement `pg.Pool` connection factory with connection leak detection and keep-alive.
  - Implement transaction helper `withTenantContext(clubId, callback)` executing `SET LOCAL app.current_club_id = $1` before query execution.
- [ ] **1.2 Better Auth Configuration (`backend/src/auth/auth.js`):**
  - Initialize Better Auth with PostgreSQL adapter.
  - Configure organizational roles: `president`, `treasurer`, `committee_lead`, `volunteer`, `member`.
  - Secure HttpOnly session cookie settings (`SameSite=Lax`, 7-day validity).
- [ ] **1.3 Multi-Tenant Middleware (`backend/src/middleware/tenant.js`):**
  - Resolve club slug from subdomain (`skyline.clubsphere.edu`) or request header `x-club-slug`.
  - Validate user session and organizational role within the active club.
  - Attach `req.user`, `req.club`, and `req.membership` to the request pipeline.
- [ ] **1.4 Frontend Auth & Tenant Context (`frontend/src/context/`):**
  - `AuthContext.jsx`: Handles login, logout, current user session, and permission checking.
  - `TenantContext.jsx`: Extracts tenant slug from URL, loads club branding, and attaches `x-club-slug` header to all API requests.

---

## Phase 2: Membership Subsystem & Automated Renewal Engine (Vertical Slice)
* **Objective:** Implement self-service membership intake, dynamic HMAC-SHA256 passes, and automated renewal reminder notifications.

### Tasks:
- [ ] **2.1 Backend Membership API (`backend/src/modules/memberships/`):**
  - `POST /api/v1/memberships/register`: Student registration with campus ID validation and dues collection.
  - `GET /api/v1/memberships/me/pass`: Dynamic HMAC-SHA256 time-rotating QR pass generation (60-second TTL).
  - Webhook listener `POST /api/v1/memberships/webhook`: Listens for Stripe checkout completion to activate membership.
- [ ] **2.2 Automated Renewal Reminder Worker (`backend/src/cron/renewalReminders.js`):**
  - Scheduled daily cron running at 02:00 UTC.
  - Query memberships expiring at T-30, T-7, and T-1 days.
  - Dispatch transactional renewal emails with 1-click renewal links.
  - Transition status to `GRACE_PERIOD` upon expiry date for 14 days; transition to `EXPIRED` at day 15.
  - Log audit dispatch events to `membership_renewal_reminders`.
- [ ] **2.3 Unified Grace-Period Eligibility Rule Enforcement:**
  - Ensure API middleware grants member-discount pricing for members with status in `('ACTIVE', 'GRACE_PERIOD')`.
  - Return `is_grace_period: true` flag in session to display frontend renewal warning banners.
- [ ] **2.4 Frontend Member Portal & Digital Wallet (`frontend/src/pages/portal/`):**
  - `DigitalMembershipCard.jsx`: Live rendering of rotating QR code pass, member tier badge, expiry countdown, and status pill.
  - Amber renewal banner for members in `GRACE_PERIOD` with instant "Renew Membership" CTA button.

---

## Phase 3: High-Concurrency Event Ticketing, Full Lifecycle & Door Scanner (Vertical Slice)
* **Objective:** Build the complete ticket lifecycle (selection, reservation, payment, issuance, check-in, reconciliation) and the rapid door scanner HUD PWA.

### Tasks:
- [ ] **3.1 Complete Ticket Purchase Lifecycle Backend (`backend/src/modules/ticketing/`):**
  - **Step 1 - Capacity Reservation:** `POST /api/v1/events/:eventId/reserve`
    - Atomically check `(sold_count + reserved_count) < capacity` and increment `reserved_count`.
    - Create `event_tickets` record with status `RESERVED` and 10-minute expiry timestamp.
    - Set Redis TTL key `ticket_lock:{ticket_id}` for 600 seconds.
  - **Step 2 - Payment Initiation:** `POST /api/v1/events/:eventId/checkout`
    - Generate Stripe Checkout session for reserved tickets with `client_reference_id = ticket_id`.
  - **Step 3 - Payment Confirmation & Issuance:** `POST /api/v1/ticketing/webhook`
    - Process `checkout.session.completed` idempotently.
    - Update `event_tickets` status from `RESERVED` $\rightarrow$ `ISSUED`.
    - Decrement `reserved_count` and increment `sold_count` in `event_ticket_tiers`.
    - Dual-entry ledger posting to Account `4020 Tickets` and `1010 Cash Clearing`.
  - **Step 4 - Capacity Release Worker:** `backend/src/cron/ticketExpiryWorker.js`
    - Runs every 60 seconds; selects `event_tickets` where `status = 'RESERVED'` and `reserved_until < NOW()`.
    - Marks tickets `CANCELLED`, decrements `reserved_count`, and triggers waitlist auto-promotion notification.
  - **Step 5 - Door Check-In API:** `POST /api/v1/events/:eventId/check-in`
    - Sub-200ms door scan endpoint verifying HMAC signature and atomic status update from `ISSUED` $\rightarrow$ `CHECKED_IN`.
  - **Step 6 - Walk-Up Member Verification API:** `POST /api/v1/memberships/verify-pass`
    - Rapid <120ms verification for general meetings and table booths without requiring tickets.
  - **Step 7 - Per-Event Reconciliation API:** `GET /api/v1/events/:eventId/reconciliation`
    - Queries `view_event_financial_summary` to return capacity, tickets sold, actual turnout %, gross revenue, direct expenses, and net profit.
- [ ] **3.2 Dual-Mode Rapid Door Scanner PWA (`frontend/src/components/scanner/`):**
  - `ScannerHUD.jsx`: Full-screen camera stream using WebCodecs / BarcodeDetector API (<15ms client decode).
  - Mode toggle: **Mode A (Event Ticket Check-In)** vs. **Mode B (General Member Verification)**.
  - Audio & Haptic Feedback: 523Hz C5 chime + short vibration for valid pass; 180Hz buzzer + double vibration for duplicate/expired pass.
  - Verification Modal: Instant student photo, name, membership status badge (`ACTIVE`, `GRACE_PERIOD`, `EXPIRED`).
- [ ] **3.3 Event Reconciliation Modal (`frontend/src/components/events/EventReconciliationModal.jsx`):**
  - Turnout percentage radial gauge, ticket tier revenue breakdown, direct expenses, net margin, and 1-click executive PDF export.

---

## Phase 4: Merchandise Storefront & End-to-End Order Lifecycle (Vertical Slice)
* **Objective:** Implement the apparel storefront, membership-aware tier discounts, 10-minute temporary inventory holds, and complete order fulfillment states.

### Tasks:
- [ ] **4.1 Complete Merchandise Order Lifecycle Backend (`backend/src/modules/commerce/`):**
  - **Step 1 - Stock Reservation:** `POST /api/v1/commerce/reserve`
    - Execute `SELECT stock_quantity, reserved_stock FROM merch_product_variants WHERE id = $1 FOR UPDATE`.
    - Atomically increment `reserved_stock` and store Redis cart hold key for 600 seconds.
    - Create order record in `merch_orders` with status `PENDING`.
  - **Step 2 - Payment Confirmation:** `POST /api/v1/commerce/webhook`
    - On Stripe checkout completion: transition order status `PENDING` $\rightarrow$ `PAID`.
    - Decrement `reserved_stock` and decrement `stock_quantity`.
    - Record dual-entry ledger transaction into Account `4030 Merchandise`.
  - **Step 3 - Expired Hold Release Worker:** `backend/src/cron/merchHoldWorker.js`
    - Runs every 2 minutes; releases uncompleted `PENDING` reservations and restores `reserved_stock`.
  - **Step 4 - Order Fulfillment API:** `POST /api/v1/commerce/orders/:orderId/fulfill`
    - Treasurer/Manager endpoint to transition order from `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `FULFILLED` with pickup location logging.
  - **Step 5 - Order Cancellation & Refund API:** `POST /api/v1/commerce/orders/:orderId/refund`
    - Handles customer cancellation or return: marks order `REFUNDED`, restores `stock_quantity`, and posts debit reversal to ledger.
- [ ] **4.2 Merchandise Storefront UI (`frontend/src/pages/store/`):**
  - `MerchCatalog.jsx`: Grid of club apparel (hoodies, t-shirts, caps) with live variant selector (Sizes S–XXL).
  - Dynamic Discount Badges: Displays member vs non-member pricing (`"Member Price: $32 (Save $13)"`) for `ACTIVE` and `GRACE_PERIOD` users.
  - Non-Member Upsell Modal: Prompts non-members at checkout with savings calculation if they join ClubSphere today.
  - 10-Minute Checkout Timer: Visible countdown clock indicating remaining reservation time before cart release.

---

## Phase 5: Collaborative Tasks & Fundraiser Volunteer Coordination (Vertical Slice)
* **Objective:** Deliver the 5-state Kanban board, volunteer shift coordination grid, and real-time fundraiser campaign tracking with financial reconciliation.

### Tasks:
- [ ] **5.1 Task Management & Harmonized Kanban API (`backend/src/modules/tasks/`):**
  - Unified status validation: Enforce status enum `['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']`.
  - Endpoints: `GET /api/v1/tasks`, `POST /api/v1/tasks`, `PATCH /api/v1/tasks/:taskId/status`, `DELETE /api/v1/tasks/:taskId`.
  - Filter tasks by `club_id`, `event_id`, and `fundraiser_id`.
- [ ] **5.2 Fundraiser Campaign & Volunteer Shift API (`backend/src/modules/fundraisers/`):**
  - Endpoints: `GET /api/v1/fundraisers`, `POST /api/v1/fundraisers`, `GET /api/v1/fundraisers/:id/shifts`.
  - Volunteer Shift Signup: `POST /api/v1/fundraisers/:id/shifts/:shiftId/claim` and `POST .../release`.
  - Health Indicator Engine: Calculates health status (`HEALTHY` $\ge 90\%$ shifts filled; `AT_RISK` unassigned shifts <48h; `CRITICAL` prep tasks blocked).
- [ ] **5.3 Fundraiser Revenue Ledger Connection:**
  - Ensure donations and bake sale sales specify `reference_type = 'FUNDRAISER'` and `reference_id = fundraiser_id`.
  - Atomically update `fundraisers.raised_amount_cents` upon transaction confirmation to prevent double-counting.
- [ ] **5.4 Kanban Board & Volunteer Shift Roster UI (`frontend/src/components/tasks/`):**
  - `KanbanBoard.jsx`: 5-column drag-and-drop board (`BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`) with priority badges and overdue flags.
  - `FundraiserShiftBoard.jsx`: Visual target progress bar ($ Target vs $ Raised), 2-hour shift roster grid (Baking Leads, Supplies Runner, Table Duty), and real-time "Claim Shift" buttons.

---

## Phase 6: Budget Allocation, Simplified Expense Intake & Unified Treasurer Dashboard (Vertical Slice)
* **Objective:** Implement category budget envelopes, a simplified receipt-upload expense intake workflow (no complex OCR), strict two-person approval gates, and the executive treasurer dashboard.

### Tasks:
- [ ] **6.1 Budget Envelopes & Variance Engine Backend (`backend/src/modules/budgets/`):**
  - Endpoints for semester budget allocation: `POST /api/v1/budgets`, `GET /api/v1/budgets/variance`.
  - Backed by `view_budget_variance`: computes Allocated ($), Actual Spent ($), Remaining Balance ($), and % Consumed.
  - Automatic Overrun Warning Flags: `NORMAL` (<80%), `WARNING` (80–99%, Amber), `EXCEEDED` ($\ge 100\%$, Red).
- [ ] **6.2 Simplified Expense Intake & Approval Workflow Backend (`backend/src/modules/expenses/`):**
  - **No Complex OCR:** Replaces OCR parser with structured form intake + mandatory receipt photo proof upload.
  - **Receipt Upload Handler:** `POST /api/v1/expenses/upload-receipt` using `multer` to securely store receipt image/PDF in storage bucket and return signed URL (`receipt_image_url TEXT NOT NULL`).
  - **Expense Submission API:** `POST /api/v1/expenses`:
    - Validates structured fields: `merchant_name`, `purchase_date`, `category`, `amount_cents`, `purpose`, `receipt_image_url`, optional `event_id`, `fundraiser_id`, `budget_id`.
    - Creates record with initial status `SUBMITTED`.
  - **Separation of Duties Validation:** Rejects any claim where `claimant_id == approver_id` (enforces SQL constraint `chk_claimant_not_approver`).
  - **Decision State Machine APIs:**
    - `POST /api/v1/expenses/:id/review`: Reviews claim (`UNDER_REVIEW`).
    - `POST /api/v1/expenses/:id/request-correction`: Flags claim as `NEEDS_CORRECTION` with feedback reason.
    - `POST /api/v1/expenses/:id/reject`: Rejects claim with `rejection_reason`.
    - `POST /api/v1/expenses/:id/approve-treasurer`: Treasurer review approval $\rightarrow$ `TREASURER_APPROVED`.
    - `POST /api/v1/expenses/:id/approve-president`: Second-level sign-off for claims $\ge \$50$ $\rightarrow$ `PRESIDENT_APPROVED`.
    - `POST /api/v1/expenses/:id/disburse`: Records payout transaction $\rightarrow$ `DISBURSED`, creating credit to `1010 Cash Clearing` and debit to `5010/5020 Expense Accounts`.
- [ ] **6.3 Unified Treasurer Executive Dashboard API (`backend/src/modules/treasurer/`):**
  - `GET /api/v1/treasurer/summary`: Backed by `view_treasurer_financial_summary`.
  - Delivers high-level KPIs: Total Inflows, Total Outflows, and Available Operating Cash Balance.
  - Generates 1-click university student affairs audit report (PDF / CSV).
- [ ] **6.4 Volunteer Expense Desk UI (`frontend/src/components/expenses/ExpenseDesk.jsx`):**
  - User Intake Form: Intuitive fields for Merchant, Purchase Date, Category, Amount, Description, and Event/Fundraiser association.
  - Mandatory File Dropzone: Drag-and-drop receipt image/PDF with instant client-side thumbnail preview.
  - Reviewer Lightbox: Pan/zoom inspection overlay for Treasurer and President to audit uploaded receipt alongside user-entered fields.
  - Action Controls: "Approve", "Request Correction", "Reject" modal with feedback notes.
- [ ] **6.5 Unified Treasurer Console UI (`frontend/src/pages/treasurer/TreasurerDashboard.jsx`):**
  - Large monospaced KPI stat cards for Total Inflows, Total Outflows, and Net Operating Balance.
  - Category Budget Progress Widget: Visual burn rate meters for each budget envelope with Amber/Red threshold badges.
  - One-click University Compliance Export button.

---

## Phase 7: Verification, Load Testing & Security Audits
* **Objective:** Rigorously validate sub-second door scanning, atomic inventory locking, multi-tenant RLS isolation, and financial ledger invariants.

### Tasks:
- [ ] **7.1 Latency Benchmark (k6 Load Test):**
  - Run benchmark against door scan endpoint: `POST /api/v1/events/:eventId/check-in`.
  - Target: P95 latency $< 150\text{ms}$, P99 latency $< 200\text{ms}$ under 50 concurrent door volunteers.
- [ ] **7.2 Stock Oversell Fuzz Test:**
  - Launch 100 concurrent checkout requests against 5 available hoodie variants.
  - Assert exactly 5 orders succeed with status `PAID` and 95 requests receive HTTP 409 Conflict.
- [ ] **7.3 Multi-Tenant Row-Level Security Isolation Audit:**
  - Query database with `SET LOCAL app.current_club_id = 'club_a'`.
  - Assert zero records from `club_b` are returned across `users`, `events`, `merch_orders`, `budgets`, and `journal_entries`.
- [ ] **7.4 Financial Ledger Invariant Audit:**
  - Attempt manual insert of unbalanced journal entry (Total Debits $\neq$ Total Credits).
  - Verify database trigger `trg_enforce_balanced_journal_entry` immediately aborts transaction.
- [ ] **7.5 Expense Anti-Fraud Gate Verification:**
  - Attempt approval of an expense reimbursement where `approver_id == claimant_id`.
  - Assert SQL constraint `chk_claimant_not_approver` aborts transaction with descriptive error.

---

## Phase 8: Production Deployment & GitHub Synchronization
* **Objective:** Deploy verified production bundle and synchronize all code with remote GitHub repository.

### Tasks:
- [ ] **8.1 Environment Configuration:** Provision production `.env` with secure keys and PostgreSQL connection strings.
- [ ] **8.2 Database Provisioning:** Run `psql -f documents/schema.sql` on production database instance.
- [ ] **8.3 Frontend Bundle Build:** Run `npm run build` in `frontend/` to generate production static assets.
- [ ] **8.4 Git Repository Synchronization:** Commit all artifacts, documentation, and source files, and push to `origin/main` on `https://github.com/naveencmy/clubsphere_0.1.git`.
