<div align="center">

# 🌐 ClubSphere (v1.0.0 Production)
### The Enterprise Digital Operating System for Collegiate Student Organizations

[![Docker](https://img.shields.io/badge/Docker-29.8+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Alpine-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19_SPA-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-PostgreSQL_Adapter-FF4F00?style=for-the-badge)](https://better-auth.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Direct_Gateway-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

<p align="center">
  <strong>Unifying memberships, sub-200ms rapid door QR ticketing verification, merchandise e-commerce drops, volunteer task pipelines, cryptographic broadcasts, and automated double-entry financial accounting.</strong>
</p>

[Architecture Blueprint](documents/TECHNICAL_ARCHITECTURE_DATABASE_SECURITY_BLUEPRINT.md) •
[PRD & Specifications](documents/PRD_TECHNICAL_SPECIFICATION_CLUBSPHERE.md) •
[Design System (DESIGN.md)](documents/DESIGN.md) •
[Database DDL](documents/schema.sql) •
[Backend API](backend/README.md) •
[Frontend Guide](frontend/README.md)

</div>

---

## 📑 Table of Contents
1. [System Architecture & Topology](#-system-architecture--topology)
2. [Core Functional Engines](#-core-functional-engines)
3. [Technology Stack](#-technology-stack)
4. [Quickstart (Docker Containerization)](#-quickstart-docker-containerization)
5. [Local Bare-Metal Development](#-local-bare-metal-development)
6. [Production Deployment Procedures (Runbook)](#-production-deployment-procedures-runbook)
7. [Zero-Downtime Upgrades & Rollback Procedures](#-zero-downtime-upgrades--rollback-procedures)
8. [Database Schema, Migrations & Backup](#-database-schema-migrations--backup)
9. [Observability & Health Probes](#-observability--health-probes)
10. [Security & STRIDE Threat Mitigation](#-security--stride-threat-mitigation)
11. [License](#-license)

---

## 🏛️ System Architecture & Topology

ClubSphere is architected around a **layered Hexagonal / Domain-Driven Design (DDD)** gateway bridging high-concurrency client interfaces with strict ACID transactional guarantees in PostgreSQL.

```mermaid
flowchart TB
    subgraph Public Internet
        Client["Browser / Mobile Client\n(React 19 SPA + PWA)"]
    end

    subgraph DMZ / Ingress Tier
        Nginx["Nginx Reverse Proxy\n(Gzip, SPA Fallback, Security Headers)"]
    end

    subgraph Application Tier
        API["Express 5 API Gateway\n(Node.js 20 LTS ESM)"]
        Auth["Better-Auth Engine\n(PostgreSQL Sessions & OAuth)"]
        Cron["Background Workers\n(Ticket Hold Pruning & Membership Audits)"]
    end

    subgraph Data Tier (Isolated Network)
        PG[("PostgreSQL 16 Database\n- Row-Level Security (RLS)\n- Double-Entry Trigger Verification\n- Cryptographic Audit Log")]
        Media[("Named Volume\n- Image Assets & Badges")]
    end

    Client -->|HTTP/2 HTTPS :80/:443| Nginx
    Nginx -->|Static Assets| Client
    Nginx -->|/api/* Reverse Proxy| API
    Nginx -->|/images/* Proxy| Media
    API --> Auth
    API --> Cron
    API -->|pg Pool & Queries| PG
    Auth -->|User & Session Records| PG
```

---

## ⚡ Core Functional Engines

### 1. Sub-200ms Rapid Door QR Scanner HUD
- **Real-time Door Verification**: Event security scanners validate tickets with high-speed HMAC SHA-256 tokens.
- **Double-Entry Ticket Posting**: Verified tickets automatically generate dual-entry ledger journal transactions confirming revenue allocations without manual accounting intervention.
- **Anti-Replay Protections**: Immediate timestamp locking prevents duplicate scanning across multiple gate stations.

### 2. Dual-Entry Ledger & Financial Bookkeeping
- **Strict Mathematical Invariants**: PostgreSQL database trigger `verify_journal_entry_balance` asserts $\sum \text{Debit} = \sum \text{Credit}$ on every transaction batch with zero rounding deviation.
- **Budgetary Tracking & Expense Claims**: Multi-category allocations (Event Operations, Tech Infrastructure, Workshops) tied directly to claimant reimbursements and receipts.

### 3. Merchandising Catalog & E-Commerce Drops
- **SKU & Variant Inventory Isolation**: Real-time inventory tracking for symposium kits, hoodies, and badges with automatic stock decrements.
- **Integrated Payments**: Direct Razorpay webhook & client-side checkout modal support with manual cash voucher overrides for university finance offices.

### 4. Broadcasts with Cryptographic SHA-256 Audit Trails
- **Tamper-Evident Publication Records**: Every published announcement calculates a SHA-256 digest over its markdown payload and author metadata stored in `announcement_revisions`.
- **Verified Revision History**: Instant modal inspection of the chronological audit trail for campus auditors and committee members.

### 5. Multi-Tenant Role-Based Access Control (RBAC)
- **Role Hierarchy**: Strict permission gates from `VISITOR`, `STUDENT_USER`, `MEMBER`, `VOLUNTEER`, `COMMITTEE_LEAD`, `TREASURER`, `ASSOCIATION_COORDINATOR`, `ASSOCIATION_INCHARGE`, to `SUPER_ADMIN`.
- **Row-Level Security (RLS)**: PostgreSQL tenant policies isolate club data across student chapters (`nec-cse`, etc.).

---

## 🚀 Technology Stack

| Layer | Technologies | Key Highlights |
|---|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, Lucide React, Recharts | Fast SPA with code-splitting, custom token system (`DESIGN.md`), lazy-loaded media. |
| **Reverse Proxy** | Nginx Alpine | Gzip compression, immutable asset caching, SPA fallback, security headers. |
| **Backend Gateway** | Express 5, Node.js 20 LTS (ESM) | Hexagonal architecture, Zod payload validation, graceful shutdown (`SIGTERM`/`SIGINT`). |
| **Authentication** | Better Auth | Native PostgreSQL adapter, multi-tenant session verification, secure cookies. |
| **Database** | PostgreSQL 16 Alpine | RLS multi-tenancy, check constraints, double-entry triggers, ACID transactions. |
| **Payments** | Razorpay SDK & Gateway Bridge | Automated signature verification, order generation, manual offline recording. |
| **Orchestration** | Docker & Docker Compose v2 | Multi-stage lean builds, non-root users, isolated networks, automated healthchecks. |

---

## 🐳 Quickstart (Docker Containerization)

Deploy the entire production stack in under 60 seconds with Docker Compose:

### 1. Clone & Configure Environment
```bash
git clone https://github.com/naveencmy/ClubSphere_0.1.git
cd ClubSphere_0.1

# Generate production environment variables
cp .env.example .env
```

### 2. Launch Stack
```bash
docker compose up -d --build
```

### 3. Verify Health & Running Containers
```bash
docker compose ps
```
The services will initialize in dependency order:
1. `clubsphere-postgres`: Boots PostgreSQL 16 and mounts `documents/schema.sql`.
2. `clubsphere-backend`: Waits for PostgreSQL `service_healthy`, runs migrations, and exposes port `4000`.
3. `clubsphere-frontend`: Waits for backend `service_healthy`, compiles static assets into Nginx, and exposes port `80`.

Open your browser at **`http://localhost`** to access ClubSphere.

---

## 💻 Local Bare-Metal Development

If you prefer developing outside containers:

### Prerequisites
- Node.js `20.x` LTS or later
- PostgreSQL `16.x` running on `localhost:5432` with a database named `clubsphere`

### 1. Database Initialization
```bash
# Apply production schema
psql -h localhost -U postgres -d clubsphere -f documents/schema.sql

# Seed baseline college data (events, merchandise, faculty officers, announcements)
cd backend
npm install
npm run seed
```

### 2. Start Backend Gateway
```bash
cd backend
npm run dev
# Running on http://localhost:4000
```

### 3. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 📋 Production Deployment Procedures (Runbook)

Following the **5-Phase Deployment Protocol**, every production release follows strict preparation, backup, execution, verification, and confirmation steps.

```
1. PREPARE ────► 2. BACKUP ────► 3. DEPLOY ────► 4. VERIFY ────► 5. CONFIRM / ROLLBACK
```

### Phase 1: PREPARE (Pre-Deployment Gates)
Before releasing code to production:
- [ ] Run full test suites:
  ```bash
  cd frontend && npm test
  cd ../backend && npm test
  ```
- [ ] Verify production frontend build compiles cleanly:
  ```bash
  cd frontend && npm run build
  ```
- [ ] Validate Docker Compose configuration:
  ```bash
  docker compose config
  ```
- [ ] Verify all required production secrets in `.env`:
  `DATABASE_URL`, `JWT_SECRET`, `QR_SIGNING_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

### Phase 2: BACKUP (State Snapshot)
Never execute a deployment without an immutable backup of the database:
```bash
# Dump active PostgreSQL database state
docker exec -t clubsphere-postgres pg_dump -U postgres clubsphere > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Verify dump file size is non-zero
ls -lh backup_*.sql
```

### Phase 3: DEPLOY (Execution)
Deploy containers with zero downtime:
```bash
# Pull/build new images without dropping running services
docker compose build --pull

# Rolling recreation of updated services
docker compose up -d --no-deps backend
docker compose up -d --no-deps frontend
```

### Phase 4: VERIFY (Post-Deployment Health Checks)
Execute automated probes immediately following rollout:
```bash
# 1. API Liveness Probe
curl -f http://localhost:4000/health || exit 1

# 2. Database Connectivity & Readiness Probe
curl -f http://localhost:4000/health/ready || exit 1

# 3. Nginx Web Server Liveness Probe
curl -f http://localhost/healthz || exit 1

# 4. Inspect container error logs
docker compose logs --tail=50 backend
```

### Phase 5: CONFIRM or ROLLBACK
- **Confirm**: If all 4 verification probes return HTTP 200 within 5 minutes, mark the deployment complete.
- **Rollback**: If error rates spike $> 1\%$ or health checks fail, immediately invoke the rollback plan below.

---

## 🔄 Zero-Downtime Upgrades & Rollback Procedures

### Instant Container Rollback
If a newly deployed image exhibits critical bugs:

```bash
# 1. Revert to previous image tag or Git commit
git checkout HEAD~1

# 2. Rebuild and restart services immediately
docker compose up -d --build

# 3. If database schema was corrupted, restore from backup:
docker exec -i clubsphere-postgres psql -U postgres -d clubsphere < backup_YYYYMMDD_HHMMSS.sql
```

### Zero-Downtime Blue-Green Strategy
For high-traffic deployments (e.g. during live symposium ticket drops):
1. Launch secondary container pool (`backend-green`).
2. Run automated integration test suite against `backend-green:4002`.
3. Switch Nginx upstream directive from `blue` to `green`.
4. Gracefully terminate `blue` instances after existing connections complete.

---

## 🗄️ Database Schema, Migrations & Backup

The schema is defined in [`documents/schema.sql`](documents/schema.sql) and enforces strict relational integrity:

- **Row-Level Security (RLS)**: Enforced via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on tenant-scoped tables.
- **Automated Audit Logging**: Triggers log state transitions and timestamp modifications.
- **Double-Entry Balance Verification**:
  ```sql
  CREATE OR REPLACE FUNCTION verify_journal_entry_balance()
  RETURNS TRIGGER AS $$
  DECLARE
      v_debit_sum BIGINT;
      v_credit_sum BIGINT;
  BEGIN
      SELECT COALESCE(SUM(debit_amount_cents), 0), COALESCE(SUM(credit_amount_cents), 0)
      INTO v_debit_sum, v_credit_sum
      FROM journal_entry_lines WHERE journal_entry_id = NEW.journal_entry_id;
      
      IF v_debit_sum <> v_credit_sum THEN
          RAISE EXCEPTION 'Double-entry transaction out of balance: Debits (%) != Credits (%)', v_debit_sum, v_credit_sum;
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

### Automated Backup Schedule
Add the following cron job to your production host to maintain automated daily backups:
```bash
0 3 * * * docker exec clubsphere-postgres pg_dump -U postgres clubsphere | gzip > /var/backups/clubsphere/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 🩺 Observability & Health Probes

ClubSphere exposes standardized health and readiness endpoints for Docker, Kubernetes, or load balancer monitors:

| Endpoint | Method | Expected Output | Purpose |
|---|---|---|---|
| `/health` | `GET` | `{"status":"UP","service":"ClubSphere API Gateway"}` | Process liveness probe |
| `/health/ready` | `GET` | `{"status":"READY","database":{"connected":true}}` | Deep database connectivity check |
| `/healthz` | `GET` | `healthy` | Nginx static server health check |
| `/api/clubs/slug/:slug` | `GET` | `{"success":true,"data":{...}}` | Tenant availability probe |

---

## 🔒 Security & STRIDE Threat Mitigation

ClubSphere incorporates defense-in-depth security principles:

1. **Non-Root Containers**: Backend and frontend containers run under non-privileged users (`nodejs:nodejs` UID 1001).
2. **Network Isolation**: The PostgreSQL database resides on an internal Docker bridge network (`backend_internal`) with `internal: true`, rendering it inaccessible from public ingress.
3. **Cryptographic Signatures**: Ticket QR strings are signed via HMAC SHA-256 (`QR_SIGNING_SECRET`).
4. **Header Hardening**: `helmet` enforces secure HTTP response headers, while Nginx adds `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN`.
5. **No Secrets in Images**: `.dockerignore` filters out `.env` files, preventing confidential keys from baking into Docker image layers.

---

## 📄 License

This software is released under the **MIT License**. See [LICENSE](LICENSE) for details.
