# ⚡ ClubSphere Backend API Gateway

> Production Express 5 & Node.js 20 (ESM) REST API Gateway with PostgreSQL 16 persistence, Better-Auth session management, dual-entry accounting triggers, and Razorpay payment integration.

---

## 🏗️ Layered Architecture & Directory Structure

The backend is built around a clean **Hexagonal / Layered Domain Architecture**:

```
backend/
├── Dockerfile                   # Multi-stage security-hardened Alpine container
├── .dockerignore                # Context optimization and secret leak prevention
├── nodemon.json                 # Development hot-reload configuration
├── package.json                 # Node.js ESM module manifest & scripts
├── public/                      # Static assets & media uploads (/images/*)
└── src/
    ├── app.js                   # Express application setup, security middleware & health probes
    ├── server.js                # HTTP server bootstrap, cron background workers & graceful shutdown
    ├── config/
    │   ├── db.js                # PostgreSQL connection pool, transaction helper & health checks
    │   ├── env.js               # Zod-validated environment schema & configuration
    │   ├── betterAuth.js        # Better Auth adapter initialization with PostgreSQL
    │   └── seedRealData.js      # Production database seeder script
    ├── controllers/             # HTTP request handling & status serialization
    │   ├── authController.js
    │   ├── clubController.js
    │   ├── collaborationController.js
    │   ├── eventController.js
    │   ├── ledgerController.js
    │   ├── merchandiseController.js
    │   └── paymentController.js
    ├── services/                # Business logic, state machines & domain rules
    │   ├── authService.js
    │   ├── clubService.js
    │   ├── collaborationService.js
    │   ├── eventService.js
    │   ├── ledgerService.js
    │   ├── merchandiseService.js
    │   └── paymentService.js
    ├── repositories/            # SQL query execution & transactional persistence
    │   ├── clubRepository.js
    │   ├── collaborationRepository.js
    │   ├── eventRepository.js
    │   ├── ledgerRepository.js
    │   ├── membershipRepository.js
    │   ├── merchandiseRepository.js
    │   └── userRepository.js
    ├── routes/                  # Express route definitions & Zod validation middleware
    ├── middleware/              # Auth guards, role checks, error handlers, observability
    └── utils/                   # Crypto helpers, response formatters, error classes
```

---

## 📡 REST API Reference

All routes are mounted under the `/api` prefix.

### 1. Health & Diagnostics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Lightweight container liveness probe | Public |
| `GET` | `/health/ready` | Deep database connectivity probe | Public |
| `GET` | `/api/health` | Gateway health mirror | Public |

### 2. Authentication & Sessions (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account with student ID | Public |
| `POST` | `/api/auth/login` | Email/password sign-in issuing JWT token | Public |
| `GET` | `/api/auth/workspace` | Get authenticated user profile & active club memberships | Session |
| `ALL` | `/api/auth/session/*` | Better-Auth handler for OAuth and sessions | Dynamic |

### 3. Clubs & Chapter Membership (`/api/clubs`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/clubs` | List all active collegiate clubs | Public |
| `GET` | `/api/clubs/slug/:slug` | Retrieve club profile by unique slug (`nec-cse`) | Public |
| `GET` | `/api/clubs/slug/:slug/members`| Retrieve club officers, faculty, and student members | Public |
| `GET` | `/api/clubs/:id/members` | Retrieve club members by UUID | Public |

### 4. Events, Tickets & Door Check-In (`/api/events`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/events` | List events with ticket tiers & allocations | Public |
| `POST` | `/api/events` | Create new event with pricing tiers | `COMMITTEE_LEAD`+ |
| `POST` | `/api/events/:id/tickets/reserve` | Reserve ticket with 10-minute hold lock | Authenticated |
| `POST` | `/api/events/tickets/:id/confirm` | Confirm ticket payment & post dual-entry ledger entry | Authenticated |
| `POST` | `/api/events/:id/check-in` | Sub-200ms door QR HMAC validation | `VOLUNTEER`+ |

### 5. Merchandise & Drops (`/api/store`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/store/catalog` | List active merchandise products & variants | Public |
| `POST` | `/api/store/orders` | Place merchandise drop order | Authenticated |
| `GET` | `/api/store/orders/my` | View personal order history | Authenticated |

### 6. Collaboration, Announcements & Tasks (`/api/collaboration`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/collaboration/announcements` | List published announcements with author metadata | Public |
| `POST` | `/api/collaboration/announcements` | Publish announcement & calculate audit SHA-256 | `OFFICER`+ |
| `GET` | `/api/collaboration/announcements/:id/history` | Retrieve full cryptographic revision audit log | Public |
| `GET` | `/api/collaboration/tasks` | Get club Kanban tasks | Authenticated |
| `POST` | `/api/collaboration/tasks` | Create new Kanban task | Authenticated |
| `PATCH`| `/api/collaboration/tasks/:id/status` | Update task workflow status (`TODO` $\rightarrow$ `DONE`) | Authenticated |

### 7. Dual-Entry Ledger & Financials (`/api/ledger`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/ledger/budgets` | Retrieve departmental budget allocations | `TREASURER`+ |
| `GET` | `/api/ledger/expenses` | List reimbursement expense claims | `TREASURER`+ |
| `POST` | `/api/ledger/expenses` | Submit expense claim with receipt URL | Authenticated |
| `GET` | `/api/ledger/journal` | Retrieve double-entry general ledger entries | `TREASURER`+ |

### 8. Payment Gateway Integration (`/api/payment`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/payment/create-order` | Create Razorpay checkout order | Public |
| `POST` | `/api/payment/verify-payment` | Verify HMAC SHA-256 signature from Razorpay | Public |
| `POST` | `/api/payment/record-manual` | Record offline cash voucher / NEFT bank transfer | `TREASURER`+ |
| `GET` | `/api/payment/config` | Get active public payment gateway key | Public |

---

## ⚙️ Environment Variables

Configure environment variables in `.env` (or via Docker Compose):

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `string` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `number` | `4000` | Port for Express HTTP listener |
| `DATABASE_URL` | `string` | Required | PostgreSQL connection string with credentials |
| `JWT_SECRET` | `string` | Required in prod | Symmetric secret for signing session JWT tokens |
| `JWT_EXPIRES_IN`| `string` | `7d` | Token expiration lifespan |
| `QR_SIGNING_SECRET`| `string` | Required in prod | HMAC secret key used for signing & validating event ticket QRs |
| `CORS_ORIGIN` | `string` | `http://localhost:5173` | Allowed origin header for CORS requests |
| `RAZORPAY_KEY_ID` | `string` | Test key | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | `string` | Test secret | Razorpay confidential API secret |

---

## 🕒 Background Cron Workers

The backend manages autonomous background routines (`node-cron`):

1. **Daily Midnight Expiration Worker (`0 2 * * *`)**:
   - Scans `club_memberships` for expired memberships and grace periods.
   - Transitions memberships past grace periods to `EXPIRED`.
2. **Every 1 Minute Ticket Hold Cleaner (`* * * * *`)**:
   - Finds tickets in `RESERVED` state where `reserved_until < NOW()`.
   - Releases the hold, cancels the ticket, and increments available tier capacity atomically.

---

## 🛡️ Graceful Shutdown

On receiving `SIGTERM` or `SIGINT`:
1. Express stops accepting new incoming connections.
2. In-flight requests are permitted to complete.
3. The PostgreSQL `pg.Pool` connection pool is cleanly drained.
4. Process terminates with exit code `0`.
