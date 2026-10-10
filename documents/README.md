# ClubSphere: Documentation Suite

Welcome to the engineering and product specifications for **ClubSphere**, the digital operating system for collegiate student organizations, modeled on the **Skyline Student Association** reference study.

## Technology Stack
* **Frontend:** React.js (SPA with Vite / PWA capabilities)
* **Backend:** Node.js & Express.js (RESTful API Core)
* **Database:** PostgreSQL 16+ (Multi-Tenant Row-Level Security)
* **Language:** Complete Modern JavaScript (ES2024 / Node.js ESM)
* **Authentication:** Better Auth with PostgreSQL adapter & Express middleware

---

## Document Directory

| Document | Format | Description |
|---|---|---|
| **[Implementation Plan](file:///e:/Projects/Active/ClubSphere_0.1/documents/IMPLEMENTATION_PLAN.md)** | Markdown | Step-by-step phased execution plan (Phases 0 through 5) covering scaffolding, APIs, UI, and testing. |
| **[Technical Architecture & Security Blueprint](file:///e:/Projects/Active/ClubSphere_0.1/documents/TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md)** | Markdown | Enterprise end-to-end technical blueprint bridging React.js, Express.js, PostgreSQL RLS, and Better Auth. |
| **[PRD & Technical Specification](file:///e:/Projects/Active/ClubSphere_0.1/documents/PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md)** | Markdown | Master 9-section enterprise Product Requirement Document and Software Architecture Specification for ClubSphere. |
| **[Production Database Schema (DDL)](file:///e:/Projects/Active/ClubSphere_0.1/documents/schema.sql)** | SQL | Complete, normalized PostgreSQL 15+ DDL script with RLS policies, indexes, ENUM types, and audit triggers. |
| **[DESIGN.md Specification](file:///e:/Projects/Active/ClubSphere_0.1/documents/DESIGN.md)** | YAML + Markdown | Formal design system specification following the `getdesign.md` standard for AI coding agents and frontend engineers. |

---

## Quick Navigation

### 1. Product & Architecture Blueprint
* **Executive Summary & Problem Resolution Matrix:** Cross-examines all 7 failure points from the Skyline Student Association case study.
* **Stakeholder Persona Matrix:** Deep dive into Club Organizers, Treasurers, Compliance Auditors, and Students.
* **Functional Logic:** Membership state engines, atomic inventory reservation locks (`SELECT ... FOR UPDATE`), rapid door scanning (< 200ms), and dual-entry financial accounting.
* **Architecture (HLD & SDS):** React.js frontend, Express.js backend routers, Better Auth with PostgreSQL adapter, node-cron schedulers, and S3/R2 storage.
* **Security & Threat Model:** STRIDE analysis, Row-Level Security (RLS) isolation, two-person financial controls, and cryptographic QR verification.

### 2. Database Deployment
To provision the database on a fresh PostgreSQL instance:
```bash
psql -h <host> -U <user> -d <database> -f documents/schema.sql
```

### 3. Frontend & Agent Development
AI coding agents and frontend developers should consult [DESIGN.md](file:///e:/Projects/Active/ClubSphere_0.1/documents/DESIGN.md) for color tokens, typography scales, HUD scanner states, and accessibility rules.
