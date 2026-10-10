# ClubSphere: End-to-End Implementation Plan

**Target Platform:** ClubSphere (v0.1)  
**Tech Stack:** React.js, Node.js, Express.js, PostgreSQL (Complete JavaScript, ESM)  
**Repository:** [https://github.com/naveencmy/clubsphere_0.1.git](https://github.com/naveencmy/clubsphere_0.1.git)  
**Status:** Ready for Execution (Standardized Vertical Slices Architecture)  

---

## Executive Summary & Architectural Alignment

This implementation plan translates the product requirements from [PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md](PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md), architectural patterns from [TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md](TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md), and database schema from [schema.sql](schema.sql) into concrete, vertical feature slices.

### Architectural Corrections & Refinements Incorporated:
1. **Dedicated Centralized Broadcast Slice (Skyline Requirement #5):** Restores the announcement/broadcast subsystem as a dedicated vertical slice covering announcement creation, audience targeting (`ALL_MEMBERS`, `COMMITTEE_ONLY`, `PUBLIC`), website newsfeed publication, transactional email dispatches, and immutable timestamped audit archives with SHA-256 verification hashes.
2. **Unified Database Entity Naming:** Standardizes all entity names and column references across all documents to match [schema.sql](schema.sql) precisely:
   - Ticketing: Table `tickets` (with `tier_id` referencing `event_ticket_tiers`, `event_id` referencing `events`).
   - Commerce: Tables `products`, `product_variants`, `orders`, and `order_items`.
   - Inventory: Columns `available_stock` and `reserved_stock` (in `product_variants`).
   - Tasks & Fundraisers: Tables `tasks`, `fundraisers`, and `volunteer_shifts`.
   - Broadcast: Tables `announcements` and `announcement_read_receipts`.
   - Finance & Budgeting: Tables `budgets`, `expense_reimbursements`, `ledger_accounts`, `journal_entries`, and `ledger_lines`.
3. **Two-Stage Accrual Expense Accounting (Zero Double-Counting):** Establishes an unambiguous separation between liability recognition and cash settlement:
   - **Stage 1 (Upon Approval):** Debit Expense (`5010/5020`), Credit Accounts Payable (`2010`).
   - **Stage 2 (Upon Disbursement):** Debit Accounts Payable (`2010`), Credit Cash Clearing (`1010`).
4. **Uniform Budget Warning Thresholds:** Standardizes budget envelope status indicators across all SQL views, backend logic, and frontend UI widgets:
   - **NORMAL (Green):** $< 80\%$ consumed.
   - **WARNING (Amber):** $80\%$ to $99.99\%$ consumed (advisory notification sent to Treasurer).
   - **EXCEEDED (Red):** $\ge 100\%$ consumed (envelope exhausted; requires executive override).
5. **Simplified Expense Verification (No Complex OCR):** Replaces error-prone OCR parsing with structured form intake (Merchant, Date, Category, Amount, Purpose) paired with mandatory uploaded receipt proof (`receipt_image_url TEXT NOT NULL`), officer visual zoom lightbox, and SQL anti-self-approval constraint `chk_claimant_not_approver`.
6. **Six Official Skyline Scenario Acceptance Tests:** Replaces pure latency/fuzz testing with exhaustive end-to-end acceptance tests validating all 6 core Skyline Student Association challenges plus failure and negative edge cases.
7. **Vertical Slice Execution:** Features are built incrementally across both backend APIs and React frontend components per domain module rather than postponing UI to the very end.

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
|  [ Phase 5: Tasks & Shifts ] <--- [ Phase 4: Commerce & Merch ] <----- [ Phase 3: Events & Ticketing Lifecycle ]  |
|   • Unified 5-State Kanban        • 10-Min Cart Reservations            • Reserve -> Pay -> Issue -> Check-In      |
|   • Fundraiser Shift Roster       • Order State Machine                 • Dual-Mode Scanner HUD PWA                |
|   • Target vs Raised Ledger Sync  • products & product_variants         • Per-Event Financial Reconciliation       |
|                                                                                                                    |
|          |                                                                                                         |
|          v                                                                                                         |
|                                                                                                                    |
|  [ Phase 6: Broadcast Hub ] ----> [ Phase 7: Budgets & Expenses ] ---> [ Phase 8: Skyline Acceptance Tests ]       |
|   • Multi-Channel Newsfeed       • Envelope Variance Engine (80/100%)   • 6 Official Scenario Acceptance Tests     |
|   • Email Delivery Worker        • Structured Form + Receipt Upload     • P95 < 150ms Door Check-In Benchmark      |
|   • Timestamped Audit Archive    • 2-Stage Accrual Ledger Accounting    • Stock Oversell & RLS Leakage Fuzzing     |
|                                                                                                                    |
|                                                     |                                                              |
|                                                     v                                                              |
|                                                                                                                    |
|                                      [ Phase 9: Production Launch ]                                                |
|                                       • Nginx / Cloudflare Configuration                                           |
|                                       • Production PostgreSQL Migrations                                           |
|                                       • GitHub origin/main Synchronization                                         |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## Phase 0: Workspace Scaffolding & Database Foundations
* **Objective:** Establish the directory structure, dependencies, and environment configurations for both frontend and backend, and initialize the PostgreSQL schema.

### Tasks:
- [ ] **0.1 Backend Scaffolding (`backend/`):**
  - Initialize Node.js ESM project (`package.json` with `"type": "module"`).
  - Install runtime dependencies: `express`, `pg`, `better-auth`, `cors`, `dotenv`, `express-rate-limit`, `node-cron`, `zod`, `multer`, `nodemailer`.
  - Install dev dependencies: `supertest`, `vitest`, `k6`.
  - Create `.env.example` with `PORT`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `REDIS_URL`, `TICKET_SIGNING_SECRET`, `STORAGE_BUCKET_URL`, `SMTP_HOST`.
- [ ] **0.2 Frontend Scaffolding (`frontend/`):**
  - Initialize React.js application using Vite (`npm create vite@latest frontend -- --template react`).
  - Install dependencies: `react`, `react-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/forms`, `clsx`, `canvas-confetti`.
  - Configure Tailwind design tokens matching [DESIGN.md](DESIGN.md) (Google Sans, Inter, JetBrains Mono; `#1A73E8` primary blue).
- [ ] **0.3 Database Initialization:**
  - Connect to target PostgreSQL instance.
  - Execute [`documents/schema.sql`](schema.sql) to provision all ENUM types, tables, constraints, analytical views, and RLS policies.
  - Verify initialization of tables using standardized entity names: `clubs`, `users`, `sessions`, `accounts`, `club_memberships`, `membership_renewal_reminders`, `products`, `product_variants`, `orders`, `order_items`, `events`, `event_ticket_tiers`, `tickets`, `check_ins`, `announcements`, `announcement_read_receipts`, `tasks`, `fundraisers`, `volunteer_shifts`, `budgets`, `expense_reimbursements`, `ledger_accounts`, `journal_entries`, `ledger_lines`.

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
  - Return `is_grace_period: true` flag in session to display frontend renewal warning banners across ticketing and merchandise.
- [ ] **2.4 Frontend Member Portal & Digital Wallet (`frontend/src/pages/portal/`):**
  - `DigitalMembershipCard.jsx`: Live rendering of rotating QR code pass, member tier badge, expiry countdown, and status pill.
  - Amber renewal banner for members in `GRACE_PERIOD` with instant "Renew Membership" CTA button.

---

## Phase 3: High-Concurrency Event Ticketing, Full Lifecycle & Door Scanner (Vertical Slice)
* **Objective:** Build the complete ticket purchase lifecycle (selection, reservation, payment, issuance, check-in, reconciliation) and the rapid door scanner HUD PWA.

### Tasks:
- [ ] **3.1 Complete Ticket Purchase Lifecycle Backend (`backend/src/modules/ticketing/`):**
  - **Step 1 - Capacity Reservation:** `POST /api/v1/events/:eventId/reserve`
    - Atomically check `(issued_count + reserved_count) < allocation_limit` in `event_ticket_tiers` and increment `reserved_count`.
    - Create record in `tickets` table with status `RESERVED` and 10-minute expiry timestamp.
    - Set Redis TTL key `ticket_lock:{ticket_id}` for 600 seconds.
  - **Step 2 - Payment Initiation:** `POST /api/v1/events/:eventId/checkout`
    - Generate Stripe Checkout session for reserved tickets with `client_reference_id = ticket_id`.
  - **Step 3 - Payment Confirmation & Issuance:** `POST /api/v1/ticketing/webhook`
    - Process `checkout.session.completed` idempotently.
    - Update `tickets` status from `RESERVED` $\rightarrow$ `ISSUED`.
    - Decrement `reserved_count` and increment `issued_count` in `event_ticket_tiers`.
    - Dual-entry ledger posting: Debit Account `1010 Cash Clearing`, Credit Account `4020 Tickets`.
  - **Step 4 - Capacity Release Worker:** `backend/src/cron/ticketExpiryWorker.js`
    - Runs every 60 seconds; selects `tickets` where `status = 'RESERVED'` and `created_at < NOW() - INTERVAL '10 minutes'`.
    - Marks tickets `CANCELLED`, decrements `reserved_count`, and triggers waitlist auto-promotion notification.
  - **Step 5 - Door Check-In API:** `POST /api/v1/events/:eventId/check-in`
    - Sub-200ms door scan endpoint verifying HMAC signature and atomic status update in `tickets` from `ISSUED` $\rightarrow$ `CHECKED_IN`. Inserts audit row into `check_ins`.
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
    - Execute `SELECT available_stock, reserved_stock FROM product_variants WHERE id = $1 FOR UPDATE`.
    - Atomically increment `reserved_stock` and store Redis cart hold key for 600 seconds.
    - Create order record in `orders` table with status `PENDING` and items in `order_items`.
  - **Step 2 - Payment Confirmation:** `POST /api/v1/commerce/webhook`
    - On Stripe checkout completion: transition order status in `orders` from `PENDING` $\rightarrow$ `PAID`.
    - Decrement `reserved_stock` and decrement `available_stock` in `product_variants`.
    - Record dual-entry ledger transaction: Debit Account `1010 Cash Clearing`, Credit Account `4030 Merchandise`.
  - **Step 3 - Expired Hold Release Worker:** `backend/src/cron/merchHoldWorker.js`
    - Runs every 2 minutes; releases uncompleted `PENDING` reservations and restores `reserved_stock` in `product_variants`.
  - **Step 4 - Order Fulfillment API:** `POST /api/v1/commerce/orders/:orderId/fulfill`
    - Officer endpoint to transition order from `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `FULFILLED` with pickup location logging.
  - **Step 5 - Order Cancellation & Refund API:** `POST /api/v1/commerce/orders/:orderId/refund`
    - Handles customer cancellation or return: marks order `REFUNDED` in `orders`, restores `available_stock = available_stock + quantity` in `product_variants`, and posts debit reversal to ledger.
- [ ] **4.2 Merchandise Storefront UI (`frontend/src/pages/store/`):**
  - `MerchCatalog.jsx`: Grid of club apparel (hoodies, t-shirts, caps) using `products` and `product_variants` with live variant selector (Sizes S–XXL).
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
  - Endpoints using `fundraisers` and `volunteer_shifts`: `GET /api/v1/fundraisers`, `POST /api/v1/fundraisers`, `GET /api/v1/fundraisers/:id/shifts`.
  - Volunteer Shift Signup: `POST /api/v1/fundraisers/:id/shifts/:shiftId/claim` and `POST .../release`.
  - Health Indicator Engine: Calculates health status (`HEALTHY` $\ge 90\%$ shifts filled; `AT_RISK` unassigned shifts <48h; `CRITICAL` prep tasks blocked).
- [ ] **5.3 Fundraiser Revenue Ledger Connection:**
  - Ensure donations and bake sale sales specify `reference_type = 'FUNDRAISER'` and `reference_id = fundraiser_id`.
  - Atomically update `fundraisers.raised_amount_cents` and post journal entry (Debit `1010 Cash Clearing`, Credit `4040 Fundraisers`) in the exact same transaction.
- [ ] **5.4 Kanban Board & Volunteer Shift Roster UI (`frontend/src/components/tasks/`):**
  - `KanbanBoard.jsx`: 5-column drag-and-drop board (`BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`) with priority badges and overdue flags.
  - `FundraiserShiftBoard.jsx`: Visual target progress bar ($ Target vs $ Raised), 2-hour shift roster grid (Baking Leads, Supplies Runner, Table Duty), and real-time "Claim Shift" buttons.

---

## Phase 6: Centralized Broadcast Hub & Timestamped Archive (Vertical Slice)
* **Objective:** Implement the multi-channel broadcast system (Skyline Requirement #5), ensuring timestamped announcement publication, audience-targeted delivery, and audit verification.

### Tasks:
- [ ] **6.1 Broadcast Backend API & Multi-Channel Dispatcher (`backend/src/modules/broadcast/`):**
  - `POST /api/v1/announcements`: Create and publish an announcement with:
    - Target audience: `ALL_MEMBERS`, `COMMITTEE_ONLY`, or `PUBLIC`.
    - Markdown content, title, and pinned flag (`is_pinned`).
    - Cryptographic SHA-256 `audit_hash` generated over `(club_id + title + content + published_at)` to guarantee non-repudiation.
  - `GET /api/v1/announcements`: Website newsfeed endpoint supporting pagination, pinning priority, audience filtering, and full-text search.
  - `POST /api/v1/announcements/:id/read`: Records member read receipt in `announcement_read_receipts` for delivery tracking.
  - `GET /api/v1/announcements/archive`: Timestamped historical archive view allowing students and campus administration to verify what was announced and when.
- [ ] **6.2 Email Notification Delivery Worker (`backend/src/workers/broadcastWorker.js`):**
  - Asynchronously dispatches transactional email alerts to target audience recipients when an announcement is published.
  - Logs delivery status and retry attempts; supports dev mock SMTP transport.
- [ ] **6.3 Broadcast Hub Frontend UI (`frontend/src/components/broadcast/`):**
  - `AnnouncementComposer.jsx`: Rich markdown editor with audience selector (`ALL_MEMBERS`, `COMMITTEE_ONLY`, `PUBLIC`), pinned toggle, and live email blast preview.
  - `NewsfeedWidget.jsx`: Student public and member portal newsfeed with unread badges, pinned cards, and read receipt triggers.
  - `BroadcastAuditArchive.jsx`: Searchable administrative archive table with publication timestamps (`published_at`), author names, audience scope, and SHA-256 verification badges.

---

## Phase 7: Budget Allocation, Simplified Expense Intake & Unified Treasurer Dashboard (Vertical Slice)
* **Objective:** Implement category budget envelopes, a simplified receipt-upload expense intake workflow (no complex OCR), two-stage accrual accounting, uniform 80%/100% warning thresholds, and the executive treasurer dashboard.

### Tasks:
- [ ] **7.1 Budget Envelopes & Variance Engine Backend (`backend/src/modules/budgets/`):**
  - Endpoints for semester budget allocation: `POST /api/v1/budgets`, `GET /api/v1/budgets/variance`.
  - Backed by `view_budget_variance`: computes Allocated ($), Actual Committed/Spent ($), Remaining Balance ($), % Consumed, and `alert_status`.
  - **Uniform Warning Threshold Policy:**
    - `NORMAL`: $< 80\%$ consumed (Green indicator).
    - `WARNING`: $80\%$ to $99.99\%$ consumed (Amber alert; warning notification to Treasurer).
    - `EXCEEDED`: $\ge 100\%$ consumed (Red limit; blocks new automatic expense approvals).
- [ ] **7.2 Simplified Expense Intake & Two-Stage Accrual Workflow (`backend/src/modules/expenses/`):**
  - **No Complex OCR:** Replaces OCR parser with structured form intake + mandatory receipt photo proof upload.
  - **Receipt Upload Handler:** `POST /api/v1/expenses/upload-receipt` using `multer` to securely store receipt image/PDF in storage bucket and return URL (`receipt_image_url TEXT NOT NULL`).
  - **Expense Submission API:** `POST /api/v1/expenses`:
    - Validates structured fields: `merchant_name`, `purchase_date`, `category`, `amount_cents`, `purpose`, `receipt_image_url`, optional `event_id`, `fundraiser_id`, `budget_id`.
    - Creates record in `expense_reimbursements` with initial status `SUBMITTED`.
  - **Separation of Duties Validation:** Rejects any claim where `claimant_user_id == approver_id` (enforces SQL constraint `chk_claimant_not_approver`).
  - **Decision State Machine APIs:**
    - `POST /api/v1/expenses/:id/review`: Reviews claim (`UNDER_REVIEW`).
    - `POST /api/v1/expenses/:id/request-correction`: Flags claim as `NEEDS_CORRECTION` with feedback reason.
    - `POST /api/v1/expenses/:id/reject`: Rejects claim with recorded `rejection_reason`.
    - `POST /api/v1/expenses/:id/approve-treasurer`: Treasurer review approval $\rightarrow$ `TREASURER_APPROVED`.
    - `POST /api/v1/expenses/:id/approve-president`: Second-level sign-off for claims $\ge \$50$ $\rightarrow$ `PRESIDENT_APPROVED`.
  - **Two-Stage Accrual Accounting Engine:**
    - **Stage 1 (Upon Final Approval):** Posts journal entry:
      - **Debit:** Account `5010 Event Expenses` or `5020 Supplies` ($amount).
      - **Credit:** Account `2010 Accounts Payable` ($amount, liability recognized).
      - Tag: `reference_type = 'EXPENSE_ACCRUAL'`, `reference_id = expense_reimbursements.id`.
    - **Stage 2 (Upon Disbursement):** `POST /api/v1/expenses/:id/disburse` transitions status to `DISBURSED` and posts journal entry:
      - **Debit:** Account `2010 Accounts Payable` ($amount, liability cleared).
      - **Credit:** Account `1010 Cash Clearing` ($amount, operating cash reduced).
      - Tag: `reference_type = 'EXPENSE_PAYOUT'`, `reference_id = expense_reimbursements.id`.
- [ ] **7.3 Unified Treasurer Executive Dashboard API (`backend/src/modules/treasurer/`):**
  - `GET /api/v1/treasurer/summary`: Backed by `view_treasurer_financial_summary`.
  - Delivers high-level KPIs: Total Inflows ("What Came In"), Total Outflows ("What Went Out"), and Available Operating Cash Balance ("How Much Is Left").
  - Generates 1-click university student affairs audit report (PDF / CSV).
- [ ] **7.4 Volunteer Expense Desk UI (`frontend/src/components/expenses/ExpenseDesk.jsx`):**
  - User Intake Form: Intuitive fields for Merchant, Purchase Date, Category, Amount, Description, and Event/Fundraiser association.
  - Mandatory File Dropzone: Drag-and-drop receipt image/PDF with instant client-side thumbnail preview.
  - Reviewer Lightbox: Pan/zoom inspection overlay for Treasurer and President to audit uploaded receipt alongside user-entered fields.
  - Action Controls: "Approve", "Request Correction", "Reject" modal with feedback notes.
- [ ] **7.5 Unified Treasurer Console UI (`frontend/src/pages/treasurer/TreasurerDashboard.jsx`):**
  - Large monospaced KPI stat cards for Total Inflows, Total Outflows, and Net Operating Balance.
  - Category Budget Progress Widget: Visual burn rate meters for each budget envelope with Green, Amber, and Red threshold badges.
  - One-click University Compliance Export button.

---

## Phase 8: Verification Suite & Official Skyline Scenario Acceptance Tests
* **Objective:** Validate real-world business flows across all 6 Skyline Student Association challenge scenarios, failure recovery states, and performance/security benchmarks.

### Tasks:
- [ ] **8.1 End-to-End Functional Acceptance Tests for the 6 Official Skyline Scenarios (`backend/test/scenarios/`):**
  - **Scenario 1 Acceptance: Membership Intake, Rotating Pass & Renewal Grace Period:**
    - Verify registration collects dues and generates HMAC-SHA256 rotating QR pass.
    - Simulate expiration date arrival; verify worker transitions status to `GRACE_PERIOD` and dispatches T-30, T-7, T-1 email reminders.
    - Verify grace-period members retain discount pricing on both tickets and merchandise while displaying an amber renewal banner.
    - Verify transition to `EXPIRED` at Day 15 revokes discounts and marks passes invalid.
  - **Scenario 2 Acceptance: Concurrency Event Ticketing, Door Scanning & Reconciliation:**
    - Verify 100 concurrent ticket requests against a 50-ticket tier results in exactly 50 reserved tickets and 50 rejections.
    - Verify payment confirmation updates status to `ISSUED` and creates journal entry in Account `4020`.
    - Verify check-in endpoint validates QR pass and updates status to `CHECKED_IN` in $< 150\text{ms}$.
    - Verify duplicate check-in scan attempt is immediately rejected with HTTP 409 Conflict.
    - Verify `GET /api/v1/events/:id/reconciliation` returns exact tickets sold, actual turnout %, gross revenue, direct expenses, and net profit.
  - **Scenario 3 Acceptance: Merchandise Drop, Cart Hold Expiry & Order Lifecycle:**
    - Verify variant inventory pessimistic row lock (`SELECT ... FOR UPDATE`) prevents overselling.
    - Verify uncompleted checkout hold expires after 10 minutes and automatically restores `reserved_stock`.
    - Verify paid order progresses through `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `FULFILLED`.
    - Verify customer refund marks order `REFUNDED`, restores `available_stock = available_stock + quantity`, and posts reversing ledger entry.
  - **Scenario 4 Acceptance: Bake Sale Fundraiser, Volunteer Shifts & Dual Financial Sync:**
    - Verify fundraiser creation with $500 target and volunteer shifts (Baking Lead, Supplies Runner, Table Duty).
    - Verify volunteers can claim and release 2-hour shifts; verify health indicator calculates `HEALTHY` when $\ge 90\%$ shifts filled.
    - Verify bake sale sales and donations atomically credit Account `4040 Fundraisers` and update `fundraisers.raised_amount_cents` with zero double-counting.
  - **Scenario 5 Acceptance: Centralized Multi-Channel Broadcast & Immutable Timestamped Archive:**
    - Verify announcement publication with `target_audience = 'ALL_MEMBERS'` generates SHA-256 audit hash and dispatches email alerts.
    - Verify announcement displays on website newsfeed with pinning priority.
    - Verify member read receipt is logged in `announcement_read_receipts`.
    - Verify historical archive query retrieves exact publication timestamp, author, and verification hash.
  - **Scenario 6 Acceptance: Two-Level Expense Reimbursement, Anti-Fraud & Two-Stage Accrual:**
    - Verify volunteer submits structured expense ($75.00) with mandatory receipt upload.
    - Verify Treasurer cannot approve their own claim (`chk_claimant_not_approver` SQL rejection).
    - Verify independent Treasurer approval on $\ge \$50$ claim triggers Stage 1 Accrual (Debit `5020 Supplies` $75, Credit `2010 Accounts Payable` $75).
    - Verify President secondary approval permits disbursement.
    - Verify disbursement triggers Stage 2 Payout (Debit `2010 Accounts Payable` $75, Credit `1010 Cash Clearing` $75) and clears liability to zero.
    - Verify budget variance view updates remaining balance and reflects `WARNING` if $\ge 80\%$ or `EXCEEDED` if $\ge 100\%$.
- [ ] **8.2 Negative & Failure Mode Automated Tests:**
  - Test payment gateway failure / checkout abandonment releases reserved capacity and inventory holds.
  - Test reimbursement rejection records reason and sends notification to claimant.
  - Test reimbursement correction request allows claimant to edit and resubmit claim without creating duplicate entries.
- [ ] **8.3 Scanner Latency Benchmark (k6 Load Test):**
  - Run benchmark against door scan endpoint: `POST /api/v1/events/:eventId/check-in`.
  - Target: P95 latency $< 150\text{ms}$, P99 latency $< 200\text{ms}$ under 50 concurrent door scanner volunteers.
- [ ] **8.4 Stock Oversell Fuzz Test:**
  - Launch 100 concurrent checkout requests against 5 available hoodie variants in `product_variants`.
  - Assert exactly 5 orders succeed with status `PAID` and 95 requests receive HTTP 409 Conflict.
- [ ] **8.5 Multi-Tenant Row-Level Security Isolation Audit:**
  - Query database with `SET LOCAL app.current_club_id = 'club_a'`.
  - Assert zero records from `club_b` are returned across `users`, `events`, `orders`, `budgets`, and `journal_entries`.
- [ ] **8.6 Financial Ledger Invariant Audit:**
  - Attempt manual insert of unbalanced journal entry (Total Debits $\neq$ Total Credits).
  - Verify database trigger `trg_enforce_balanced_journal_entry` immediately aborts transaction.

---

## Phase 9: Production Deployment & GitHub Synchronization
* **Objective:** Deploy verified production bundle and synchronize all code with remote GitHub repository.

### Tasks:
- [ ] **9.1 Environment Configuration:** Provision production `.env` with secure keys and PostgreSQL connection strings.
- [ ] **9.2 Database Provisioning:** Run `psql -f documents/schema.sql` on production database instance.
- [ ] **9.3 Frontend Bundle Build:** Run `npm run build` in `frontend/` to generate production static assets.
- [ ] **9.4 Git Repository Synchronization:** Commit all artifacts, documentation, and source files, and push to `origin/main` on `https://github.com/naveencmy/clubsphere_0.1.git`.
