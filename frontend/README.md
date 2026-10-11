# 🎨 ClubSphere Frontend SPA

> Modern React 19 Single Page Application & PWA powered by Vite 6, Tailwind CSS v4, Lucide icons, and Recharts. Connects directly to the Express + PostgreSQL Backend Gateway on `/api`.

---

## 🏗️ Architecture & Component Topology

The frontend is structured into modular feature domains with shared layout shells and UI tokens:

```
frontend/
├── Dockerfile                   # Multi-stage production build serving via Nginx Alpine
├── nginx.conf                   # Production Nginx reverse proxy, gzip & caching rules
├── .dockerignore                # Context optimization preventing leak of test traces
├── package.json                 # Scripts, dependencies & engine constraints
├── vite.config.js               # Rollup chunk splitting, proxy settings & test runners
└── src/
    ├── app/                     # Providers (AppProvider, AuthContext, ToastProvider)
    ├── components/
    │   ├── common/              # UI building blocks (Button, Card, Badge, Modal, Avatar, Notice, Table)
    │   ├── forms/               # Reusable FormEngine (RecordForm with Zod schema validation)
    │   └── layout/              # Navigation Header, Sidebar HUD, PageShells, Footer
    ├── features/                # Domain-driven feature workspaces
    │   ├── admin/               # Role management, member directories & audit logs
    │   ├── broadcast/           # Announcements, publication history modal & delivery reports
    │   ├── commerce/            # Merchandise drops, size/variant selection, cart & Razorpay checkout
    │   ├── events/              # Event schedules, ticket tiers, reservation & confirmation
    │   ├── expenses/            # Reimbursement claims, receipt upload & status tracking
    │   ├── finance/             # Ledger datagrid, double-entry verification & budget allocations
    │   ├── fundraisers/         # Crowdfunding campaigns, volunteer shifts & progress bars
    │   ├── memberships/         # Tier subscription plans (Standard/Premium) & digital pass
    │   ├── public/              # Hero landing page, feature highlights, event carousel & catalog preview
    │   ├── scanner/             # Rapid Door QR verification HUD with audio-visual feedback
    │   └── tasks/               # Kanban board with priority tags & assignee avatars
    ├── services/
    │   ├── apiBridge.js         # Central gateway synchronization with PostgreSQL backend
    │   ├── permissions.js       # Role hierarchy, capability matrix & guard checks
    │   ├── serviceFactory.js    # Service layer factory exposing domain managers
    │   └── store.js             # Central reactive state repository
    └── utils/                   # Currency formatters (INR paise), date helpers & crypto
```

---

## ⚡ Gateway API Bridge (`apiBridge.js`)

Unlike early prototypes, ClubSphere runs directly on live PostgreSQL data synchronized through `apiBridge.js`:
- **Real-time Member Synchronization**: Fetches `/api/clubs/slug/:slug/members` and maps all faculty advisors, coordinators, and student leads into reactive store records.
- **Cryptographic Audit Inspection**: Directly calls `/api/collaboration/announcements/:id/history` to verify SHA-256 tamper-evident revision records.
- **Razorpay Direct Orders**: Initiates Razorpay orders on `/api/payment/create-order` and validates cryptographic payment signatures on `/api/payment/verify-payment`.
- **Double-Entry Ticket Check-In**: Sends scan tokens to `/api/events/:id/check-in`, updating door entry timestamps and recording financial journal ledger credits.

---

## 🚀 Development & Build Workflow

### 1. Local Development
```bash
# Install dependencies
npm ci

# Start Vite dev server with proxy to backend on port 4000
npm run dev
# Running on http://localhost:5173
```

### 2. Production Compilation
```bash
npm run build
```
The optimized bundle is written to `dist/` with automated Rollup vendor chunking:
- `dist/assets/charts-*.js`: Recharts and D3 dependencies
- `dist/assets/forms-*.js`: React Hook Form and Zod resolvers
- `dist/assets/qr-*.js`: QRCode generator utilities
- `dist/assets/index-*.js`: Core React 19 runtime and application views

### 3. Local Production Preview
```bash
npm run preview
# Serves dist/ on http://localhost:4173 with proxy to backend
```

---

## 🧪 Testing & Verification

ClubSphere includes comprehensive unit, integration, and browser verification suites:

```bash
# Run unit tests (Vitest)
npm test

# Run authentication browser tests (Playwright)
npm run test:auth

# Check code formatting with Prettier
npm run format:check
```

---

## 🐳 Production Containerization (Nginx)

The frontend container uses a **multi-stage build**:
1. **Build Stage (`node:20-alpine`)**: Compiles JSX and Tailwind CSS into minified HTML, CSS, and JS chunks.
2. **Runtime Stage (`nginx:alpine`)**: Serves the `dist/` directory via high-performance Nginx with:
   - Gzip compression on all static assets (`gzip_comp_level 6`).
   - 1-year immutable cache headers on hashed bundles (`/assets/*`).
   - Reverse proxy for `/api/*` and `/images/*` targeting the `backend:4000` container.
   - SPA fallback (`try_files $uri $uri/ /index.html`).
   - Dedicated health check endpoint at `/healthz`.

To build and run the frontend container individually:
```bash
docker build -t clubsphere-frontend .
docker run -p 80:80 clubsphere-frontend
```
