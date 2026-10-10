# Product Requirement Document (PRD) & Technical Specification
# ClubSphere: The Enterprise Digital Operating System for Campus Organizations

**Document Version:** 2.0.0-PROD  
**Target Platform:** ClubSphere Multi-Tenant Campus Core  
**Tech Stack:** React.js, Node.js, Express.js, PostgreSQL (Complete JavaScript)  
**Status:** Approved for Engineering Implementation  
**Classification:** Production Engineering Blueprint & Product Specification  
**Reference Archetype:** Skyline Student Association Case Study  
**Authors:** Elite Technical Product Management & Principal Systems Architecture Group  

---

## Table of Contents
1. [Executive Summary & Problem Resolution Matrix](#1-executive-summary--problem-resolution-matrix)
2. [Stakeholder Persona Matrix & Core Value Propositions](#2-stakeholder-persona-matrix--core-value-propositions)
3. [Detailed Functional Requirements & System Logic](#3-detailed-functional-requirements--system-logic)
4. [System Architecture & High-Level Design (HLD)](#4-system-architecture--high-level-design-hld)
5. [Comprehensive Database Design (PostgreSQL Schema)](#5-comprehensive-database-design-postgresql-schema)
6. [Security Architecture & Threat Modeling](#6-security-architecture--threat-modeling)
7. [Software Design Specification (SDS) & Auth Integration Plan](#7-software-design-specification-sds--auth-integration-plan)
8. [Frontend UI/UX Design System Specification](#8-frontend-uiux-design-system-specification)
9. [Success Metrics & Performance KPIs](#9-success-metrics--performance-kpis)

---

## 1. Executive Summary & Problem Resolution Matrix

### 1.1 Context & Strategic Imperative
Collegiate student associations operate under an acute operational paradox: they execute commercial-grade workloads—handling tens of thousands of dollars in cash dues, organizing high-occupancy galas, distributing multi-variant branded merchandise, coordinating volunteer staff, and balancing compliance audits—while being staffed entirely by full-time students. With student officers cycling out annually, institutional memory vanishes, leaving clubs reliant on ad-hoc spreadsheets, paper notebooks, and disjointed messaging apps.

As demonstrated by the **Skyline Student Association** reference study, this manual fragmentation creates systemic failure modes:
* Members lose track of events and lose access to entitled discounts.
* Cash collected at event doors goes missing or is stolen, resulting in unverified entry.
* Financial records kept in notebooks fail university audits, endangering club charter status.
* Mass communications sent manually across fragmented WhatsApp chats generate information fatigue and missed deadlines.
* Out-of-pocket volunteer expenses go unreimbursed or duplicate-claimed due to lost paper receipts.

**ClubSphere** is designed from first principles as an industrial-grade, multi-tenant digital operating system that unifies membership life cycles, event ticketing, merchandise e-commerce, task dispatch, announcements, and double-entry financial accounting into a single, cohesive, zero-trust cloud platform built on **React.js, Node.js, Express.js, PostgreSQL**, and **pure JavaScript**.

```
+----------------------------------------------------------------------------------------------------+
|                                            CLUBSPHERE                                              |
|                                                                                                    |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+    |
|  |    Membership      |  |     Ticketing      |  |    Merchandise     |  |    Centralized     |    |
|  |     Lifecycle      |  |   & Rapid Scan     |  |     & Inventory    |  |     Broadcast      |    |
|  |  [Self-Service QR] |  |   [Sub-200ms PWA]  |  |  [Atomic Drop Lock]|  |  [Multi-Channel]   |    |
|  +---------+----------+  +---------+----------+  +---------+----------+  +---------+----------+    |
|            |                       |                       |                       |               |
|            +-----------------------+-----------------------+-----------------------+               |
|                                    |                                                               |
|                                    v                                                               |
|                  +-----------------------------------+                                             |
|                  | Automated Double-Entry Financial  |                                             |
|                  |              Ledger               |                                             |
|                  |  [Real-Time Inflow/Outflow Audit] |                                             |
|                  +-----------------------------------+                                             |
|                                    |                                                               |
|                                    v                                                               |
|                  +-----------------------------------+                                             |
|                  | Secure Multi-Tenant Architecture  |                                             |
|                  | [Express.js + Node.js + PG RLS]   |                                             |
|                  +-----------------------------------+                                             |
+----------------------------------------------------------------------------------------------------+
```

---

### 1.2 Problem Resolution Matrix
The matrix below cross-examines every manual failure mode documented in the Skyline Student Association case study against the architectural countermeasure implemented by ClubSphere.

| # | Current Operational Failure (Skyline Case Study) | Root Cause Analysis | ClubSphere Module | Architectural & System Solution | Automated Failsafe / Safeguard |
|---|---|---|---|---|---|
| **1** | **Spreadsheet Member Tracking**<br>• Physical sign-up clipboard<br>• Outdated Google Sheets<br>• Unverified payment status | Lack of centralized identity authority and disconnected payment gateways. Manual data entry delays lead to stale records. | **Membership Lifecycle Engine** (`src/modules/memberships`) | Self-service React.js registration portal linked directly to payment gateway. Automatic provisioning of dynamic cryptographically signed digital QR member passes. | **Automated Expiry Engine:** Node.js cron worker checks expiration status daily. State changes cascade automatically (`ACTIVE` → `GRACE` → `EXPIRED`). Tier discount rights are revoked immediately upon expiry. |
| **2** | **Cash Sales at Event Doors**<br>• Paper door lists<br>• Physical cash collection<br>• Fraudulent buddy check-ins<br>• Long queue delays | Absence of digital ticketing infrastructure and offline-capable door verification systems. | **Event Ticketing & Rapid Check-In** (`src/modules/ticketing`) | Online seat tier reservation with instant digital ticket issuance (HMAC-SHA256 signed QR tokens). Dedicated low-latency React PWA Scanner with local validation and sub-200ms camera feedback. | **Double-Scan Lock:** Optimistic local cache verification backed by transactional Express/PostgreSQL lock (`UPDATE tickets SET status = 'CHECKED_IN' WHERE id = $1 AND status = 'VALID'`). Prevents screenshot reuse. |
| **3** | **Club Budget in Notebooks**<br>• Hand-written ledgers<br>• Missing transaction IDs<br>• End-of-semester reconciliation paralysis | Accounting is uncoupled from transactional events (ticket purchases, merch sales, dues). | **Automated Financial Ledger** (`src/modules/ledger`) | Real-time dual-entry accounting engine. Every revenue-generating event (stripe charge, dues, merch order) automatically writes debit/credit journal entries to immutable ledger accounts. | **Immutable Audit Trail:** Append-only transaction log with SHA-256 state hashing and tamper-evident event records. University export-ready in GAAP compliant format. |
| **4** | **Fragmented WhatsApp Announcements**<br>• Copy-pasted messages across groups<br>• Important updates buried in chatter<br>• Ghost members missing alerts | Broadcast channels lack message auditability, role-based targeting, and central archiving. | **Centralized Broadcast Hub** (`src/modules/broadcast`) | Canonical announcement publishing hub with multi-channel fanout (In-App Notification Feed + Transactional Email + Web Push). Permanent chronological web archive with audit logs. | **Immutable Publish Log:** Published announcements cannot be silently deleted or altered without an audit trail. Deliverability tracking verifies which members received and opened messages. |
| **5** | **Lost Volunteer Receipts**<br>• Chasing paper receipts<br>• Delayed reimbursements<br>• Out-of-pocket volunteer friction<br>• Embezzlement risk | Absence of structured expense filing workflows, mobile image ingestion, and dual-signoff controls. | **Expense Reimbursement Workflow** (`src/modules/expenses`) | Mobile self-service expense claim portal. Volunteers photograph receipts at point-of-sale, upload metadata, and tag associated projects/fundraisers. | **Dual-Signoff Gate:** Two-person approval threshold (Treasurer verification + President sign-off) required for all disbursements exceeding $50. Full receipt image archived in S3 with secure signed URLs. |
| **6** | **Merchandise Paper Orders**<br>• Sizing collected via chats<br>• Manual stock tracking<br>• Chasing payments after ordering<br>• Overselling popular sizes | E-commerce is decoupled from inventory databases and payment settlement. | **Merchandise & Inventory Engine** (`src/modules/commerce`) | SKU and variant matrix engine (Sizes S–XXL, Colors, Fits). Real-time inventory decrementation with atomic DB transactions and 10-minute cart reservation locks. Upfront digital checkout. | **Atomic Inventory Decrement:** Uses PostgreSQL pessimistic row-level locking (`SELECT ... FOR UPDATE`) to guarantee zero overselling during flash drop peaks. Unpaid reserved carts release back to stock after 10 minutes. |
| **7** | **Bake Sale / Fundraiser Chaos**<br>• Tasks tracked in personal heads<br>• Unclear volunteer ownership<br>• Missing supplies on event day | Lack of lightweight, event-linked project management tooling suited for student volunteers. | **Collaborative Task & Pipeline Board** (`src/modules/tasks`) | Real-time Kanban pipeline board linked directly to events and fundraisers. Granular task assignments, dependency markers, automated deadline ping alerts, and volunteer checklist tracking. | **Orphan Task Detector:** Tasks unassigned within 48 hours of an event trigger automated alerts to the Event Lead and Club President dashboard. |

---

## 2. Stakeholder Persona Matrix & Core Value Propositions

### 2.1 Persona 1: Club Organizers & Event Leads
* **Archetype:** Sarah Chen, President & Lead Organizer, Skyline Student Association.
* **Profile:** 3rd-year student. Oversees 14 committee heads, 450 members, and 12 events per academic year.
* **Operational Workflows:**
  1. Authoring and scheduling official club announcements across the student body.
  2. Launching annual events (e.g., Annual Spring Gala, Tech Talks, Hackathons) with custom ticket pricing tiers and capacity ceilings.
  3. Monitoring real-time volunteer task assignments for fundraisers (e.g., Bake Sale prep, booth equipment logistics).
  4. Reviewing and providing secondary sign-off on expense reimbursement claims submitted by committee leads.
* **Pain Points & Friction:**
  * Wastes 6–8 hours weekly cross-posting notices to WhatsApp groups and answering the same logistical questions repeatedly.
  * Constant anxiety during major events regarding whether door volunteers are accurately checking memberships or letting friends in for free.
  * Inability to determine whether event setups are on schedule without individual text check-ins.
* **Jobs-To-Be-Done (JTBD):**
  > *"When I announce a major event, I want to publish it once, restrict pricing tiers by membership status, track volunteer readiness in real time, and verify door attendance with zero administrative friction, so that our events run professionally without consuming my study time."*
* **Access Control & RBAC Privileges:**
  * Role: `CLUB_PRESIDENT` / `EVENT_LEAD`
  * Permissions: `events:create`, `events:edit`, `tickets:manage`, `announcements:publish`, `tasks:assign`, `reimbursements:approve_secondary`, `analytics:view`.
* **Value Vector:**
  * Recovers ~7.5 hours per week of administrative overhead.
  * Guarantees 100% verified event attendance with instant executive analytics post-event.

---

### 2.2 Persona 2: Treasurers & University Finance/Compliance Officers
* **Archetype:** Marcus Vance (Club Treasurer) & Dr. Aris Thorne (University Director of Student Activities & Audit).
* **Profile:** Marcus is an accounting student managing a $35,000 annual club operating budget; Dr. Thorne audits 85 registered student clubs for university policy compliance.
* **Operational Workflows:**
  1. Reconciling ticket revenue, merchandise pre-orders, and membership dues against actual bank deposits.
  2. Reviewing uploaded itemized receipts from volunteers, validating tax/tip policies, and approving disbursements.
  3. Generating end-of-semester financial balance sheets, profit-and-loss statements, and audit ledgers for the University Board.
* **Pain Points & Friction:**
  * Marcus spends finals week deciphering faded physical receipts, messy Excel formulas, and unlabelled peer-to-peer mobile payments.
  * Dr. Thorne frequently flags clubs for "unaccounted cash flows" resulting in frozen university funding accounts.
* **Jobs-To-Be-Done (JTBD):**
  > *"When our club collects money or incurs expenses, I want every dollar automatically recorded in a double-entry ledger with itemized receipts attached, so that at semester's end I can export a bulletproof, audit-ready financial statement with a single click."*
* **Access Control & RBAC Privileges:**
  * Role: `CLUB_TREASURER` / `COMPLIANCE_AUDITOR`
  * Permissions: `ledger:view`, `ledger:post_manual_adjustment`, `reimbursements:approve_primary`, `reimbursements:payout`, `reports:export_financials`, `pricing:audit`.
* **Value Vector:**
  * Reduces end-of-semester reconciliation from 35 hours to under 15 minutes.
  * Eliminates cash shrinkage to 0.00% by forcing all transactions through audited payment gateways or monitored petty-cash receipts.

---

### 2.3 Persona 3: General Students & Active Members
* **Archetype:** Maya Lin (Active Member) & Liam Patel (Prospective Non-Member Student).
* **Profile:** Maya is an active sophomore who paid annual club dues for perks; Liam is a freshman attending his first event.
* **Operational Workflows:**
  1. Discovering upcoming events, purchasing tickets, and storing QR passes.
  2. Presenting digital member QR codes at club booths or gala doors for instantaneous check-in and discount validation.
  3. Ordering customized club hoodies/t-shirts online with verified sizing and instant card checkout.
  4. Receiving and reading clean, organized club notices without chat noise.
* **Pain Points & Friction:**
  * Maya lost her member discount because door volunteers couldn't find her name in a 500-row spreadsheet.
  * Liam stood in a 40-minute line in the rain at the Spring Gala because volunteers were manually writing receipt numbers.
* **Jobs-To-Be-Done (JTBD):**
  > *"When I sign up for a club and pay my dues, I want a persistent digital pass on my phone that automatically grants me ticket discounts, lets me breeze through event doors in under 5 seconds, and delivers verified club news without spam."*
* **Access Control & RBAC Privileges:**
  * Role: `CLUB_MEMBER` / `STUDENT_GUEST`
  * Permissions: `profile:edit`, `membership:renew`, `tickets:purchase`, `tickets:view_own`, `orders:create`, `announcements:read`.
* **Value Vector:**
  * Frictionless mobile experience: < 60 seconds from sign-up to digital pass issuance; door check-in scan in < 2 seconds.

---

## 3. Detailed Functional Requirements & System Logic

### 3.1 Membership Lifecycle Management
#### 3.1.1 Self-Service Onboarding & Digital Pass Issuance
1. **Self-Service Portal:** Students sign in using institutional OAuth2 or email magic links via Better Auth. The onboarding flow collects: Legal Name, Student ID (validated against institutional regex), Major, Expected Graduation Year, and Emergency Contact.
2. **Payment Processing:** If club membership requires annual dues, the system initiates a Stripe Checkout session. Webhook confirmation (`checkout.session.completed`) atomically transitions membership status from `PENDING_PAYMENT` to `ACTIVE`.
3. **Digital Pass Engine:** Upon activation, the system provisions a unique, non-guessable `qr_secret_token` and an offline-verifiable HMAC-SHA256 signature containing:
   $$\text{Signature} = \text{HMAC-SHA256}_{K_{\text{club}}}(\text{user\_id} \parallel \text{club\_id} \parallel \text{tier} \parallel \text{valid\_until})$$
4. **Pass Storage:** Students can display their dynamic QR code on the responsive React web app, save it as a PWA, or install standard digital passes.

#### 3.1.2 Tiered Access Rules & Entitlements
* **Tier Definitions:**
  * `GUEST_NON_MEMBER`: Public event access at standard pricing; no merchandise member discounts; read-only access to public announcements.
  * `STANDARD_MEMBER`: Guaranteed access to member ticket pricing (minimum 20% discount); exclusive early access window (48 hours) to limited gala tickets; merchandise discounts; voting rights in annual elections.
  * `VIP_ALUMNI`: Lifetime access, special recognition badge, invitation to alumni networking sessions.
  * `COMMITTEE_VOLUNTEER`: Access to internal task pipelines, scanner authorization for assigned events, expense submission rights.
  * `EXECUTIVE_OFFICER`: Full administrative read/write access according to assigned role (`PRESIDENT`, `TREASURER`, `VP_OPERATIONS`).

#### 3.1.3 Automated Expiration & Cron-Job State Engine
Membership cycles run on an academic year basis (expiring annually on August 31 or custom date configured by the club). The state machine is governed by an automated daily Node.js cron worker:

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: Student Initiates Registration
    PENDING_PAYMENT --> ACTIVE: Dues Paid via Stripe / Waived
    PENDING_PAYMENT --> VOID: Cart Abandoned (24h)
    
    ACTIVE --> RENEWAL_DUE: T-30 Days to Expiration
    RENEWAL_DUE --> GRACE_PERIOD: Expiration Date Reached (T-0)
    GRACE_PERIOD --> EXPIRED: T+14 Days Past Expiration
    
    RENEWAL_DUE --> ACTIVE: Renewal Dues Paid
    GRACE_PERIOD --> ACTIVE: Late Renewal Dues Paid
    EXPIRED --> ACTIVE: Re-registration Completed
```

* **Notification Schedule:**
  * **T-30 Days:** Trigger email & in-app reminder: "Your Skyline Student Association membership expires in 30 days. Click here to renew."
  * **T-7 Days:** High-priority reminder emphasizing loss of upcoming event discounts.
  * **T-1 Day:** Urgent final warning.
  * **T-0 Days:** Transition to `GRACE_PERIOD` (member privileges maintained for 14 calendar days, but banner warnings shown).
  * **T+14 Days:** Transition to `EXPIRED`. Automatic revocation of member ticket tier rights and cancellation of digital pass signature validity.

---

### 3.2 Merchandise & E-Commerce Subsystem
#### 3.2.1 SKU & Multi-Variant Catalog Management
1. **Catalog Hierarchy:** Parent Product (e.g., "Skyline 2026 Embroidered Hoodie") → Variant Entity (`SKU`: `SKY-HD26-BLK-M`, attributes: `{ "size": "M", "color": "Jet Black", "fit": "Unisex" }`).
2. **Pricing Engine:** Every variant inherits or overrides dual pricing:
   * `non_member_price_cents` (e.g., $45.00)
   * `member_price_cents` (e.g., $32.00)
   The checkout session inspects the active session's membership status. If `ACTIVE`, the lower tier price is applied automatically with no coupon codes required.

#### 3.2.2 Atomic Inventory Decrementation & Cart Locks
To eliminate overselling during high-demand apparel drops, the system employs database-level atomic locking with a temporary reservation window:
1. **Cart Hold Phase:** When a student enters checkout, the system attempts to allocate inventory:
   ```sql
   -- Atomic stock check & reservation query in PostgreSQL
   UPDATE product_variants
   SET reserved_stock = reserved_stock + 1
   WHERE id = $1 
     AND (available_stock - reserved_stock) >= 1
   RETURNING id, available_stock, reserved_stock;
   ```
2. **Hold Expiration:** A Redis key `cart:reservation:{session_id}:{variant_id}` is set with a TTL of 600 seconds (10 minutes).
3. **Checkout Finalization:** Upon successful Stripe charge:
   ```sql
   UPDATE product_variants
   SET available_stock = available_stock - 1,
       reserved_stock = reserved_stock - 1
   WHERE id = $1;
   ```
4. **Abandonment Release:** If the TTL expires without payment, a scheduled Express/Node.js worker rolls back `reserved_stock = reserved_stock - 1`.

---

### 3.3 Event Ticketing & Rapid Door Check-In
#### 3.3.1 Tiered Ticketing Engine & Seat Allocations
* Events support multiple simultaneous ticket types (e.g., "Gala Early Bird Member", "Gala Regular Member", "Guest / Plus One", "VIP Alumni Table").
* Hard capacity caps enforce safety fire codes. When `tickets_issued >= capacity_limit`, the checkout endpoint responds with `HTTP 409 Conflict` and initiates an opt-in waitlist queue.
* Waitlist promotion: If an issued ticket is refunded or revoked, the top user on the waitlist is granted an exclusive 4-hour reservation window to purchase.

#### 3.3.2 Sub-200ms Door Check-In Workflow
The door check-in workflow is engineered for poor campus Wi-Fi connectivity and high ingress throughput (300+ students arriving in a 20-minute window).

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    actor DoorVolunteer as Door Volunteer (React PWA Scanner)
    participant EdgePWA as Scanner PWA Cache
    participant Server as Express.js API
    participant DB as PostgreSQL DB
    
    Attendee->>DoorVolunteer: Presents Dynamic QR Pass
    DoorVolunteer->>EdgePWA: Camera Scans QR Payload
    Note over EdgePWA: Offline Signature Check<br/>HMAC-SHA256 valid?<br/>Timestamp < 60s old?
    EdgePWA->>Server: POST /api/v1/events/{id}/check-in<br/>Payload: { ticket_code, client_ts, nonce }
    
    alt Device Online (Normal Flow)
        Server->>DB: Atomic Update with Status Check
        Note over DB: UPDATE tickets<br/>SET status = 'CHECKED_IN',<br/>    checked_in_at = NOW()<br/>WHERE ticket_code = $1<br/>  AND status = 'ISSUED'<br/>RETURNING user_name, tier;
        DB-->>Server: Row Updated (Success)
        Server-->>EdgePWA: HTTP 200 OK { valid: true, name: "Maya Lin", tier: "MEMBER" }
        EdgePWA-->>DoorVolunteer: Audio Chime + Green Screen (< 160ms)
    else Duplicate Scan Attempt (Fraud/Screenshot)
        Server->>DB: Query fails WHERE status = 'ISSUED'
        DB-->>Server: 0 Rows Updated
        Server-->>EdgePWA: HTTP 409 Conflict { error: "ALREADY_CHECKED_IN", time: "19:04:12" }
        EdgePWA-->>DoorVolunteer: Haptic Buzz + Red Screen ("Already Scanned!")
    else Network Dropout (Degraded Mode)
        EdgePWA->>EdgePWA: Check Local SQLite/IndexedDB Manifest
        EdgePWA-->>DoorVolunteer: Yellow Warning ("Validated Offline - Queued")
        EdgePWA->>Server: Background Sync when Connection Restores
    end
```

---

### 3.4 Centralized Broadcast & Archival System
* **Unified Composer:** Club executives author announcements with Markdown formatting, file attachments, and audience targeting flags (`ALL_MEMBERS`, `COMMITTEE_LEADS`, `GENERAL_PUBLIC`).
* **Multi-Channel Dispatch Orchestration:**
  1. **Canonical Web Entry:** Creates a permanent, immutable record in the club's public/member newsfeed.
  2. **Transactional Email:** Dispatches asynchronously via queue to verified student emails.
  3. **Web Push / Mobile Alert:** Dispatches instantaneous push notifications to PWA installs.
* **Audit & Accountability:** Every broadcast creates an immutable audit snapshot. Edits create timestamped revision logs; deletion is soft-delete with mandatory executive rationale. Members cannot claim "they were never notified."

---

### 3.5 Collaborative Task & Fundraiser Pipeline (Kanban)
* **Kanban Workflow Columns:** `BACKLOG` → `READY_TO_DO` → `IN_PROGRESS` → `BLOCKED` → `COMPLETED`.
* **Fundraiser Linkage:** Tasks can be grouped under operational parent milestones (e.g., "Fall Charity Bake Sale", "Spring Career Fair").
* **Field Schema:** Title, Detailed Markdown Checklist, Assigned Volunteer(s), Target Due Date, Resource Requirements.
* **Automated Escalation:** If a task in `IN_PROGRESS` has an approaching due date (< 24 hours) without updates, the system sends an automatic notification to the assignee and committee head.

---

### 3.6 Automated Dual-Entry Financial Ledger
To replace handwritten notebooks, ClubSphere enforces true **dual-entry bookkeeping**. Every financial operation generates balanced debit and credit entries across standardized General Ledger accounts.

#### 3.6.1 Standard Chart of Accounts
* `1010 - Cash & Bank Clearing` (Asset)
* `1020 - Stripe Merchant Account` (Asset)
* `1030 - Undeposited Cash / Petty Cash` (Asset)
* `2010 - Accounts Payable (Volunteer Reimbursements)` (Liability)
* `3010 - Club General Operating Fund` (Equity)
* `4010 - Membership Dues Revenue` (Revenue)
* `4020 - Event Ticket Sales Revenue` (Revenue)
* `4030 - Merchandise Sales Revenue` (Revenue)
* `4040 - Fundraiser Donations & Bake Sale Proceeds` (Revenue)
* `5010 - Event Production Expenses` (Expense)
* `5020 - Merchandise Cost of Goods Sold (COGS)` (Expense)
* `5030 - Food & Catering Expenses` (Expense)
* `5040 - Operating & Administrative Supplies` (Expense)

#### 3.6.2 Automated Transaction Mapping
* **Scenario A: Member pays $25 dues online via Stripe:**
  * Debit: `1020 - Stripe Merchant Account` ($25.00)
  * Credit: `4010 - Membership Dues Revenue` ($25.00)
* **Scenario B: Volunteer buys $45 baking supplies for Fundraiser:**
  * Volunteer submits receipt photo via mobile app.
  * Status: `SUBMITTED` → Treasurer verifies → President approves.
  * System records:
    * Debit: `5040 - Operating & Administrative Supplies` ($45.00)
    * Credit: `2010 - Accounts Payable` ($45.00)
  * Upon disbursement confirmation (Direct transfer / University check):
    * Debit: `2010 - Accounts Payable` ($45.00)
    * Credit: `1010 - Cash & Bank Clearing` ($45.00)

---

## 4. System Architecture & High-Level Design (HLD)

### 4.1 End-to-End Component Architecture

```mermaid
graph TD
    subgraph ClientLayer ["1. Client Application Layer (React.js SPA)"]
        ReactApp["React 18/19 SPA<br/>(Vite, TailwindCSS / CSS Tokens, Router)"]
        Scanner["Rapid Door Scanner PWA<br/>(Camera WebCodecs API)"]
    end

    subgraph EdgeRouting ["2. Ingress & Edge Proxy Layer"]
        Nginx["Nginx Reverse Proxy / Cloudflare<br/>(SSL Termination, Gzip, Rate Limiting)"]
    end

    subgraph BackendCompute ["3. Application Layer (Node.js & Express.js)"]
        ExpressApp["Express.js Server Application"]
        AuthMiddleware["Better Auth Express Middleware"]
        TenantMiddleware["Multi-Tenant Isolation Middleware"]
        
        subgraph ExpressRouters ["Modular Express Routers"]
            AuthRouter["/api/v1/auth"]
            MemberRouter["/api/v1/memberships"]
            TicketRouter["/api/v1/events & /scanner"]
            CommerceRouter["/api/v1/commerce"]
            LedgerRouter["/api/v1/ledger"]
            TaskRouter["/api/v1/tasks"]
        end
    end

    subgraph AsyncWorkers ["4. Background Workers & Cron Jobs (Node.js)"]
        NodeCron["node-cron Scheduler<br/>(Membership Expiry & Cart Lock Cleanup)"]
        EmailWorker["Nodemailer / Resend Worker"]
    end

    subgraph PersistenceLayer ["5. Persistence & Storage Layer"]
        Postgres[(PostgreSQL 16 Cluster<br/>Multi-Tenant RLS Partitioned)]
        S3Storage[(S3 / Cloudflare R2<br/>Encrypted Receipts & Assets)]
        RedisCache[(Redis Cache & Rate Limiting)]
    end

    ReactApp --> Nginx
    Scanner --> Nginx
    Nginx --> ExpressApp

    ExpressApp --> AuthMiddleware
    AuthMiddleware --> TenantMiddleware
    TenantMiddleware --> ExpressRouters

    ExpressRouters --> Postgres
    ExpressRouters --> RedisCache
    ExpressRouters --> S3Storage

    NodeCron --> Postgres
    NodeCron --> EmailWorker
```

---

### 4.2 Multi-Tenant Data Isolation Strategy
Campus organizations require strict data privacy. ClubSphere employs a **Shared Process / Shared Database with Tenant-Keyed Row-Level Security (RLS)** architecture:
1. Every business table contains an indexed, immutable `club_id UUID REFERENCES clubs(id)` column.
2. The active tenant context is injected at the database connection layer via PostgreSQL runtime configuration inside Express.js middleware:
   ```javascript
   await dbClient.query("SET LOCAL app.current_club_id = $1;", [req.clubId]);
   ```
3. PostgreSQL RLS policies enforce isolation unconditionally at the database kernel level:
   ```sql
   CREATE POLICY club_tenant_isolation_policy ON events
       FOR ALL
       TO authenticated_role
       USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid);
   ```

---

## 5. Comprehensive Database Design (PostgreSQL Schema)

The DDL below represents the complete, fully normalized, production-grade schema for ClubSphere.

```sql
-- ============================================================================
-- CLUBSPHERE: PRODUCTION DATABASE SCHEMA DDL
-- Platform: PostgreSQL 15+
-- Extensions: uuid-ossp, pgcrypto, citext
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- 1. ENUMS AND DOMAINS
-- ============================================================================

CREATE TYPE user_system_role AS ENUM (
    'SUPER_ADMIN',
    'CAMPUS_AUDITOR',
    'STUDENT_USER'
);

CREATE TYPE club_role AS ENUM (
    'PRESIDENT',
    'VICE_PRESIDENT',
    'TREASURER',
    'SECRETARY',
    'COMMITTEE_LEAD',
    'VOLUNTEER',
    'MEMBER'
);

CREATE TYPE membership_status AS ENUM (
    'PENDING_PAYMENT',
    'ACTIVE',
    'RENEWAL_DUE',
    'GRACE_PERIOD',
    'EXPIRED',
    'REVOKED'
);

CREATE TYPE membership_tier AS ENUM (
    'STANDARD',
    'PREMIUM',
    'HONORARY',
    'ALUMNI'
);

CREATE TYPE order_status AS ENUM (
    'PENDING',
    'PAID',
    'PROCESSING',
    'FULFILLED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE ticket_status AS ENUM (
    'ISSUED',
    'CHECKED_IN',
    'TRANSFERRED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE task_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);

CREATE TYPE task_status AS ENUM (
    'BACKLOG',
    'TODO',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE'
);

CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

CREATE TYPE reimbursement_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'TREASURER_APPROVED',
    'PRESIDENT_APPROVED',
    'REJECTED',
    'DISBURSED'
);

-- ============================================================================
-- 2. AUTHENTICATION & CORE USER TABLES (Better Auth Compatible)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    system_role user_system_role NOT NULL DEFAULT 'STUDENT_USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_id_number VARCHAR(64) UNIQUE,
    phone_number VARCHAR(32),
    academic_major VARCHAR(128),
    graduation_year INT CHECK (graduation_year >= 2020 AND graduation_year <= 2040),
    dietary_preferences TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    active_club_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope TEXT,
    id_token TEXT,
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_accounts_provider_account UNIQUE (provider_id, account_id)
);

CREATE TABLE verifications (
    id VARCHAR(255) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CLUBS & MULTI-TENANT MEMBERSHIP TABLES
-- ============================================================================

CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1A73E8',
    stripe_account_id VARCHAR(128),
    annual_dues_cents INT NOT NULL DEFAULT 0 CHECK (annual_dues_cents >= 0),
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE club_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role club_role NOT NULL DEFAULT 'MEMBER',
    tier membership_tier NOT NULL DEFAULT 'STANDARD',
    status membership_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    qr_secret_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    dues_paid_cents INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_user_membership UNIQUE (club_id, user_id)
);

-- ============================================================================
-- 4. MERCHANDISE & E-COMMERCE SUBSYSTEM
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    description TEXT,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_product_slug UNIQUE (club_id, slug)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(128) NOT NULL,
    attributes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    available_stock INT NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    non_member_price_cents INT NOT NULL CHECK (non_member_price_cents >= 0),
    member_price_cents INT NOT NULL CHECK (member_price_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_member_price_leq_nonmember CHECK (member_price_cents <= non_member_price_cents)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING',
    subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
    discount_cents INT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    total_cents INT NOT NULL CHECK (total_cents >= 0),
    stripe_payment_intent_id VARCHAR(128),
    shipping_details_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INT NOT NULL CHECK (total_price_cents >= 0)
);

-- ============================================================================
-- 5. EVENT TICKETING & RAPID CHECK-IN ENGINE
-- ============================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    description TEXT,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    capacity_limit INT NOT NULL CHECK (capacity_limit > 0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_event_slug UNIQUE (club_id, slug),
    CONSTRAINT chk_event_dates CHECK (ends_at > starts_at)
);

CREATE TABLE event_ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    allocation_limit INT NOT NULL CHECK (allocation_limit > 0),
    issued_count INT NOT NULL DEFAULT 0 CHECK (issued_count >= 0),
    member_price_cents INT NOT NULL CHECK (member_price_cents >= 0),
    non_member_price_cents INT NOT NULL CHECK (non_member_price_cents >= 0),
    sales_open_at TIMESTAMPTZ NOT NULL,
    sales_close_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_issued_leq_allocation CHECK (issued_count <= allocation_limit)
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    tier_id UUID NOT NULL REFERENCES event_ticket_tiers(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ticket_code VARCHAR(32) UNIQUE NOT NULL,
    qr_signature TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'ISSUED',
    price_paid_cents INT NOT NULL CHECK (price_paid_cents >= 0),
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    scanned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_device_metadata JSONB DEFAULT '{}'::jsonb,
    verification_hash TEXT NOT NULL
);

-- ============================================================================
-- 6. CENTRALIZED BROADCAST SYSTEM
-- ============================================================================

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    target_audience VARCHAR(64) NOT NULL DEFAULT 'ALL_MEMBERS',
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    audit_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcement_read_receipts (
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, user_id)
);

-- ============================================================================
-- 7. COLLABORATIVE TASK & FUNDRAISER BOARD
-- ============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description_markdown TEXT,
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    status task_status NOT NULL DEFAULT 'TODO',
    due_date TIMESTAMPTZ,
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. AUTOMATED FINANCIAL LEDGER & EXPENSE REIMBURSEMENTS
-- ============================================================================

CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    account_code VARCHAR(16) NOT NULL,
    account_name VARCHAR(128) NOT NULL,
    type account_type NOT NULL,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_account_code UNIQUE (club_id, account_code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    entry_number VARCHAR(32) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(64) NOT NULL,
    reference_id UUID,
    posted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_cents INT NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
    credit_cents INT NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_cents > 0 AND credit_cents = 0) OR
        (credit_cents > 0 AND debit_cents = 0)
    )
);

CREATE TABLE expense_reimbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    claimant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    receipt_image_url TEXT NOT NULL,
    receipt_ocr_metadata JSONB DEFAULT '{}'::jsonb,
    status reimbursement_status NOT NULL DEFAULT 'SUBMITTED',
    treasurer_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    treasurer_approved_at TIMESTAMPTZ,
    president_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    president_approved_at TIMESTAMPTZ,
    disbursement_method VARCHAR(64),
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. AUDIT LOGGING ENGINE
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id UUID,
    payload_before JSONB,
    payload_after JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. PRODUCTION INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_club_memberships_lookup ON club_memberships(club_id, user_id, status);
CREATE INDEX idx_club_memberships_qr ON club_memberships(qr_secret_token);
CREATE INDEX idx_product_variants_lookup ON product_variants(product_id, sku);
CREATE INDEX idx_tickets_verification ON tickets(ticket_code, status);
CREATE INDEX idx_tickets_event_user ON tickets(event_id, user_id);
CREATE INDEX idx_check_ins_ticket ON check_ins(ticket_id);
CREATE INDEX idx_announcements_club ON announcements(club_id, published_at DESC);
CREATE INDEX idx_tasks_club_status ON tasks(club_id, status, due_date);
CREATE INDEX idx_journal_entries_club ON journal_entries(club_id, posted_at DESC);
CREATE INDEX idx_ledger_lines_account ON ledger_lines(account_id);
CREATE INDEX idx_reimbursements_club_status ON expense_reimbursements(club_id, status);
CREATE INDEX idx_audit_logs_club_created ON audit_logs(club_id, created_at DESC);

-- ============================================================================
-- 11. AUDIT & UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_set_timestamp_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();', tbl, tbl);
    END LOOP;
END;
$$;
```

---

## 6. Security Architecture & Threat Modeling

### 6.1 STRIDE Threat Analysis & Mitigations

```
+----------------------------------------------------------------------------------------------------+
|                                    STRIDE THREAT MITIGATION                                        |
+--------------------------+-------------------------------------------------------------------------+
| S - Spoofing             | Better Auth Argon2id, HTTP-only SameSite cookies, HMAC QR signatures    |
+--------------------------+-------------------------------------------------------------------------+
| T - Tampering            | Dual-entry balance check triggers, HMAC QR verification, RLS isolation  |
+--------------------------+-------------------------------------------------------------------------+
| R - Repudiation          | Append-only audit_logs table capturing actor ID, IP, diffs, & timestamp |
+--------------------------+-------------------------------------------------------------------------+
| I - Information Leak     | PostgreSQL Row-Level Security (RLS) partition by club_id, strict CORS   |
+--------------------------+-------------------------------------------------------------------------+
| D - Denial of Service    | Redis express-rate-limit token bucket (10 req/s on rapid scanner)       |
+--------------------------+-------------------------------------------------------------------------+
| E - Elevation of Priv    | Two-Person Rule on financial payouts > $50, granular RBAC gatekeeper    |
+--------------------------+-------------------------------------------------------------------------+
```

| Threat Vector (STRIDE) | Attack Surface | Vulnerability Scenario | Production Security Countermeasure |
|---|---|---|---|
| **Spoofing** | Door Scanner API | Malicious user crafts a fraudulent QR code or impersonates an executive scanning tickets. | All dynamic ticket QR codes include a signed HMAC-SHA256 payload with a 60-second rotating timestamp window. Scanner devices authenticate with short-lived executive JWTs verified against active session status. |
| **Tampering** | Financial Ledger & Expense Claims | A dishonest treasurer alters database ledger balances or photoshops a receipt amount before approval. | Database enforces dual-entry constraints: total debits must equal total credits in every journal entry (`SUM(debit_cents) = SUM(credit_cents)`). Receipts stored immutably in S3/R2; image hashes (SHA-256) recorded at upload time. |
| **Repudiation** | Administrative Actions & Overrides | An officer deletes an event or clears inventory, then denies taking the action. | Comprehensive `audit_logs` table records every mutation. Captures actor UUID, client IP address, User-Agent, before/after JSON diffs, and timestamp in an append-only store with revoked `DELETE` and `UPDATE` permissions. |
| **Information Disclosure** | Multi-Tenant Data Leakage | A club officer manipulates the URL (e.g. `club_id` parameter tampering) to view competitor club members. | PostgreSQL Row-Level Security (RLS) is enabled on all tenant tables. Every query executes within a database session populated with `SET LOCAL app.current_club_id`. Cross-tenant queries return zero records at the database engine level. |
| **Denial of Service** | Ticket Drop Endpoints | Scripted bots flood the checkout endpoint to hoard limited gala tickets or crash the scanner. | Redis Token Bucket rate limiting: max 10 requests/minute on checkout; max 300 scans/minute on check-in. CAPTCHA enabled on public reservation forms. |
| **Elevation of Privilege** | Expense Reimbursement Disbursement | A rogue committee lead approves their own $500 expense payout. | Separation of Duties: Database constraints prevent claimant from acting as approver (`claimant_user_id != treasurer_approver_id AND claimant_user_id != president_approver_id`). Payouts > $50 mandate dual approval (Treasurer + President). |

---

### 6.2 Role-Based Access Control (RBAC) Matrix

| Resource / Action | Public / Guest | Member | Volunteer | Committee Lead | Treasurer | President | Campus Auditor | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Public Announcements (Read)** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Member Announcements (Read)** | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Announcements (Publish)** | No | No | No | Yes | Yes | Yes | No | Yes |
| **Standard Ticket Purchase** | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes |
| **Member Tier Ticket Discount** | No | Yes | Yes | Yes | Yes | Yes | No | Yes |
| **Door Scanner Validation** | No | No | Yes (assigned) | Yes | Yes | Yes | No | Yes |
| **Task Board (View/Update Own)**| No | No | Yes | Yes | Yes | Yes | Yes | Yes |
| **Task Board (Create/Assign)** | No | No | No | Yes | Yes | Yes | No | Yes |
| **Submit Expense Claim** | No | No | Yes | Yes | Yes | Yes | No | Yes |
| **Approve Expense (Treasurer)** | No | No | No | No | Yes | No | No | Yes |
| **Approve Expense (President)** | No | No | No | No | No | Yes | No | Yes |
| **Disburse Reimbursement** | No | No | No | No | Yes | No | No | Yes |
| **View Financial Reports** | No | No | No | No | Yes | Yes | Yes (read-only) | Yes |
| **Post Manual Ledger Adjust** | No | No | No | No | Yes | No | No | Yes |

---

## 7. Software Design Specification (SDS) & Auth Integration Plan

### 7.1 Better Auth Integration in Express.js & Node.js (Complete JavaScript)
ClubSphere integrates **Better Auth** with the native PostgreSQL pool adapter (`pg`) in pure JavaScript (ESModules). Better Auth handles session management, password hashing (Argon2id), and organization plugin bindings.

#### 7.1.1 Better Auth Server Core (`src/auth/auth.js`)
```javascript
// src/auth/auth.js
import { betterAuth } from "better-auth";
import { organization, admin } from "better-auth/plugins";
import { pool } from "../config/db.js";

export const auth = betterAuth({
  database: pool,
  appName: "ClubSphere",
  baseURL: process.env.APP_URL || "https://clubsphere.edu",
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session duration
    updateAge: 60 * 60 * 24, // Refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes memory cache
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false, // Regulated club creation
      membershipLimit: 10000,
      roles: {
        president: ["admin", "read", "write", "billing", "scanner"],
        treasurer: ["billing", "read", "write", "scanner"],
        committee_lead: ["write", "read", "scanner"],
        volunteer: ["read", "scanner"],
        member: ["read"],
      },
    }),
    admin({
      defaultRole: "user",
      adminRole: "super_admin",
    }),
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
});
```

#### 7.1.2 Express.js Authentication & Multi-Tenant Middleware (`src/middleware/tenant.js`)
```javascript
// src/middleware/tenant.js
import { auth } from "../auth/auth.js";
import { pool } from "../config/db.js";

export async function tenantAuthMiddleware(req, res, next) {
  try {
    // 1. Validate session via Better Auth
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
    }

    req.user = session.user;

    // 2. Resolve tenant (club) from subdomain or header
    const host = req.headers.host || "";
    const subdomain = host.split(".")[0];
    const clubSlug = req.headers["x-club-slug"] || subdomain;

    if (!clubSlug || clubSlug === "clubsphere") {
      return next(); // Global route
    }

    // 3. Resolve club_id from PostgreSQL
    const clubResult = await pool.query(
      "SELECT id, slug, is_active FROM clubs WHERE slug = $1 LIMIT 1;",
      [clubSlug]
    );

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "CLUB_NOT_FOUND" });
    }

    const club = clubResult.rows[0];
    req.club = club;
    req.clubId = club.id;

    // 4. Verify user membership in club
    const memberResult = await pool.query(
      `SELECT role, tier, status FROM club_memberships 
       WHERE club_id = $1 AND user_id = $2 LIMIT 1;`,
      [club.id, req.user.id]
    );

    req.membership = memberResult.rows[0] || null;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
```

---

### 7.2 Component-Level Module Directory Layout (Node.js + Express.js + React.js)
```
ClubSphere_0.1/
├── backend/                             # Node.js & Express.js REST API Core (Pure JS)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                    # pg Pool Connection with RLS Local Variables
│   │   │   ├── redis.js                 # Redis Client
│   │   │   └── s3.js                    # S3 / R2 Client
│   │   ├── auth/
│   │   │   └── auth.js                  # Better Auth Configuration & Plugins
│   │   ├── middleware/
│   │   │   ├── tenant.js                # Tenant Isolation & Session Extraction
│   │   │   ├── rbac.js                  # Role-Based Route Guard Middleware
│   │   │   └── rate-limiter.js          # Token-Bucket Rate Limiter
│   │   ├── modules/
│   │   │   ├── memberships/             # Membership Controller, Service, & Repo
│   │   │   ├── ticketing/               # Door Scanner, Ticket Generation, QR Cryptography
│   │   │   ├── commerce/                # Atomic Cart Lock, SKU Variant Manager, Checkout
│   │   │   ├── ledger/                  # Double-Entry Accounts & Expense Payouts
│   │   │   ├── broadcast/               # Announcements & Email Queue Dispatch
│   │   │   └── tasks/                   # Collaborative Kanban Board
│   │   ├── cron/
│   │   │   └── membership-expiry.js     # Scheduled Node-Cron Tasks
│   │   ├── app.js                       # Express Application Setup & Route Mounting
│   │   └── server.js                    # HTTP Server Entry Point
│   └── package.json
├── frontend/                            # React.js SPA (Vite + TailwindCSS / Design Tokens)
│   ├── src/
│   │   ├── assets/                      # Icons, Static Brand Assets
│   │   ├── components/
│   │   │   ├── common/                  # Buttons, Modals, Forms, Alerts
│   │   │   ├── scanner/                 # Rapid Scanner HUD (Camera Viewfinder, Audio Chime)
│   │   │   ├── ledger/                  # High-Density Dual-Entry Datagrid
│   │   │   └── kanban/                  # Task Board Drag-and-Drop Columns
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Better Auth React Provider
│   │   │   └── TenantContext.jsx        # Active Club Tenant State
│   │   ├── hooks/                       # Custom React Hooks (useScanner, useInventory)
│   │   ├── pages/                       # Dashboard, Events, Merch, Ledger Pages
│   │   ├── services/                    # Axios/Fetch API Clients
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── documents/                           # Comprehensive Specifications & Blueprints
```

---

## 8. Frontend UI/UX Design System Specification

ClubSphere enforces a unified visual language compliant with the **DESIGN.md** format specification:

```yaml
---
design_system:
  name: "ClubSphere Design System"
  version: "1.0.0"
  philosophy: "Clean, authoritative, and dynamic utility. Optimized for high-speed campus interactions, zero-latency scanning, and executive clarity."
  
  tokens:
    colors:
      brand:
        primary: "#1A73E8"        # Google Blue - Primary Action
        primary_hover: "#1557B0"
        primary_active: "#0D47A1"
        surface: "#FFFFFF"
        background: "#F8F9FA"      # Clean Off-White
      neutral:
        slate_50: "#F8FAFC"
        slate_100: "#F1F5F9"
        slate_200: "#E2E8F0"
        slate_300: "#CBD5E1"
        slate_500: "#64748B"
        slate_700: "#334155"
        slate_900: "#0F172A"       # Primary Headings
      status:
        success: "#1E8E3E"        # Green - Check-in Valid
        success_light: "#E6F4EA"
        warning: "#F9AB00"        # Amber - Expiring / Hold
        warning_light: "#FEF7E0"
        danger: "#D93025"         # Red - Duplicate / Error
        danger_light: "#FCE8E6"
        info: "#1A73E8"
        info_light: "#E8F0FE"

    typography:
      font_family:
        sans: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        mono: "'JetBrains Mono', 'Roboto Mono', monospace"
      scales:
        display_1: { size: "2.25rem", line_height: "2.75rem", weight: "700" } # 36px
        heading_1: { size: "1.75rem", line_height: "2.25rem", weight: "600" } # 28px
        heading_2: { size: "1.375rem", line_height: "1.75rem", weight: "600" } # 22px
        body_large: { size: "1rem", line_height: "1.5rem", weight: "400" }     # 16px
        body_medium: { size: "0.875rem", line_height: "1.25rem", weight: "400" }# 14px
        caption: { size: "0.75rem", line_height: "1rem", weight: "500" }       # 12px

    elevation:
      card: "0 1px 3px 0 rgba(60,64,67,0.15), 0 4px 8px 3px rgba(60,64,67,0.08)"
      modal: "0 8px 24px -4px rgba(15,23,42,0.15), 0 20px 48px -8px rgba(15,23,42,0.2)"
      scanner_hud: "0 20px 40px rgba(0,0,0,0.5)"

    radii:
      small: "6px"
      default: "8px"
      large: "16px"
      full: "9999px"

    spacing:
      base: "4px"
      grid: ["4px", "8px", "12px", "16px", "24px", "32px", "48px", "64px"]
---
```

---

## 9. Success Metrics & Performance KPIs

```
+----------------------------------------------------------------------------------------------------+
|                                      KEY PERFORMANCE INDICATORS                                    |
+------------------------------------+---------------------------------------------------------------+
| Check-In Verification Latency      | P95 < 150ms | P99 < 200ms                                     |
+------------------------------------+---------------------------------------------------------------+
| Financial Reconciliation Error     | Exactly 0.00% Discrepancy (Automated Dual-Entry Balance)       |
+------------------------------------+---------------------------------------------------------------+
| Inventory Oversell Incidents       | 0 Over-orders (Guaranteed via PostgreSQL Row-Level Locks)     |
+------------------------------------+---------------------------------------------------------------+
| Weekly Admin Hours Saved           | > 10 Hours Saved per Executive Committee                      |
+------------------------------------+---------------------------------------------------------------+
| Membership Renewal Rate            | > 85% Retention via Automated Cron Reminders                  |
+------------------------------------+---------------------------------------------------------------+
```

### 9.1 Quantitative Technical Performance Indicators (SLIs & SLAs)
1. **Door Scanner Verification Latency:** P95 latency < 150ms; P99 latency < 200ms from QR camera capture to chime on standard campus networks.
2. **Platform Availability & Uptime:** 99.95% system uptime during operational hours; 0 unscheduled downtime during event windows.
3. **Database Concurrency & Drop Resistance:** System handles 500 concurrent checkout sessions per second during limited apparel drops without race conditions.
4. **Tenant Isolation Guarantee:** 0 tenant leakage events across automated security fuzzing suites (100% test pass on RLS policy verification).

### 9.2 Business & Operational Impact Metrics
1. **Event Ingress Throughput:** Replaces the 42-second manual clipboard flow with a 2.8-second scan-and-go experience (15x throughput gain).
2. **Financial Reconciliation Efficiency:** Reduces end-of-semester reconciliation from 35 hours to under 15 minutes.
3. **Volunteer Reimbursement Cycle:** Reduced from 3–6 weeks to under 48 hours via mobile receipt photo ingestion and dual approvals.
4. **Membership Revenue Retention:** > 85% annual renewal rate achieved through automated T-30/T-7 cron reminder sequence.

---

## 10. Conclusion & Architectural Readiness
This Product Requirement Document and Technical Specification serves as the binding, production-ready contract for engineering implementation. By unifying membership identity, event ticketing, e-commerce drops, broadcast feeds, task allocation, and double-entry accounting under a zero-trust multi-tenant PostgreSQL RLS architecture powered by **Node.js, Express.js, React.js**, and **JavaScript**, **ClubSphere** resolves every operational failure documented in the Skyline Student Association case study and sets the enterprise benchmark for student club administration worldwide.
