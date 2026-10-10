# ClubSphere (v0.1)

## Frontend development

The React frontend is in [`frontend/`](frontend/). It uses persistent mock services for the documented ClubSphere workflows.

```bash
cd frontend
npm ci
npm run dev
```

See the [frontend README](frontend/README.md) for build and test commands, demo accounts, and implementation audits. Production backend integration is separate from this frontend prototype.

> **The digital operating system for collegiate student organizations** — unifying memberships, event ticketing with sub-200ms rapid door verification, merchandise e-commerce drops, volunteer task pipelines, announcements, and automated double-entry financial accounting in one secure platform.

Inspired by the real-world operational challenges in collegiate clubs (modeled on the **Skyline Student Association** reference study).

---

## 🚀 Technology Stack

* **Frontend:** React.js (SPA & PWA with Vite)
* **Backend:** Node.js & Express.js (REST API Core)
* **Database:** PostgreSQL 16+ (Multi-Tenant Row-Level Security)
* **Language:** Complete Modern JavaScript (ES2024 / Node.js ESM)
* **Authentication:** [Better Auth](https://dash.better-auth.com/onboarding) with PostgreSQL adapter & Express middleware
* **Cache & Locks:** Redis (Distributed cart hold locks & token-bucket rate limiting)

---

## 📚 Documentation & Specifications Suite

All production-grade specifications, architecture blueprints, database DDLs, and design systems are located in the [`documents/`](documents/) directory:

1. 📘 **[Technical Architecture, Database & Security Blueprint](documents/TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md)**  
   * End-to-end component topology bridging React.js, Express.js, and PostgreSQL.
   * High-concurrency door check-in flow with sub-200ms latency budget.
   * Atomic two-phase inventory reservation engine preventing stock overselling (`SELECT ... FOR UPDATE`).
   * Row-Level Security (RLS) multi-tenant isolation and STRIDE threat modeling.

2. 📋 **[Product Requirement Document (PRD) & Tech Spec](documents/PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md)**  
   * Executive summary & problem resolution matrix resolving Skyline case study pain points.
   * Granular persona matrix & Jobs-to-be-Done (JTBD) for Club Organizers, Treasurers, Auditors, and Members.
   * Functional state engines for memberships, merchandise, ticketing, broadcasts, Kanban tasks, and dual-entry ledgers.
   * RICE feature prioritization and delivery roadmap.

3. 🗄️ **[Production Database Schema (schema.sql)](documents/schema.sql)**  
   * Fully normalized PostgreSQL 15+ DDL script with ENUMs, foreign keys, check constraints, audit triggers, and RLS policies.
   * Automated double-entry balance verification trigger (`verify_journal_entry_balance`).

4. 🎨 **[Design System Specification (DESIGN.md)](documents/DESIGN.md)**  
   * Machine-readable [getdesign.md](https://getdesign.md/) format (YAML frontmatter + Markdown prose) for AI coding agents and frontend engineers.
   * Design tokens (colors, typography, elevation, spacing) and UX states for the Rapid Scanner HUD, Ledger Datagrid, and Kanban Board.

5. 📑 **[Documentation Index (README.md)](documents/README.md)**  
   * Navigation guide and quick reference for the documentation directory.

---

## 🛠️ Getting Started (Database Setup)

To deploy the database schema to your local or cloud PostgreSQL instance:

```bash
psql -h <host> -U <user> -d <database> -f documents/schema.sql
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
