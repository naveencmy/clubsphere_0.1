# 🚀 ClubSphere Quickstart Guide (Run on Any Machine)

Welcome to **ClubSphere**! This guide gets ClubSphere running on your machine (**Windows**, **macOS**, or **Linux**) in simple, repeatable steps.

---

## ⚡ Option 1: One-Click Docker Setup (Recommended)
> Works on any OS without configuring Node.js or local PostgreSQL.

### Prerequisites:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Compose installed and running.

### 2 Simple Steps:

1. **Clone & enter repository:**
   ```bash
   git clone https://github.com/naveencmy/ClubSphere_0.1.git
   cd ClubSphere_0.1
   ```

2. **Start all services:**
   ```bash
   docker compose up --build -d
   ```

That's it! 
- 🌐 **Web Client:** Open [http://localhost](http://localhost) (or [http://localhost:80](http://localhost:80))
- ⚡ **Backend API Health:** [http://localhost:4000/health](http://localhost:4000/health)
- 🗄️ **Database:** PostgreSQL 16 Alpine pre-seeded with schemas and demo data.

To stop the containers:
```bash
docker compose down
```

---

## 💻 Option 2: Bare-Metal Local Development Setup

### Prerequisites:
- **Node.js 20 LTS** or higher (`node -v`)
- **PostgreSQL 16** running locally, OR start just the database container:
  ```bash
  docker compose up db -d
  ```

### 3 Simple Steps:

1. **Install dependencies:**
   ```bash
   # From the repository root:
   npm run setup
   ```
   *(This automatically creates `backend/.env` from `.env.example` and installs all dependencies)*

2. **Initialize Database & Seed Data:**
   ```bash
   # If running PostgreSQL locally, apply the schema:
   psql -U postgres -d clubsphere -f documents/schema.sql

   # Seed realistic collegiate demo data:
   cd backend && npm run seed
   ```

3. **Start the servers:**
   - **Terminal 1 (Backend API on port 5000):**
     ```bash
     cd backend
     npm run dev
     ```
   - **Terminal 2 (Frontend Client on port 5173):**
     ```bash
     cd frontend
     npm run dev
     ```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🧪 CI/CD & Verification Commands

All quality gates are automated in GitHub Actions and can be run locally:

| Command | Action |
| :--- | :--- |
| `npm run lint` | Runs Prettier format verification (100% clean) |
| `npm run format` | Auto-formats frontend & backend files |
| `npm run build` | Compiles production-optimized frontend bundle with Vite |
| `npm run test` | Runs the 42-test backend integration suite (`node --test`) |
| `docker compose config` | Validates compose network & service topology |

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin / President** | `president@campus.edu` | `Admin123!` |
| **Treasurer** | `treasurer@campus.edu` | `Treasurer123!` |
| **Lead Organizer** | `organizer@campus.edu` | `Organizer123!` |
| **Member** | `member1@campus.edu` | `Member123!` |
