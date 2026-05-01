# Smart Learn AI

An AI-powered learning companion for students — personalized teaching, progress tracking, and adaptive learning.

---

## Quick Start (Local Development)

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node --version` |
| PostgreSQL | 14+ | `psql --version` |
| npm | 9+ | `npm --version` |

### 1. Database Setup

```bash
# Create the database
sudo -u postgres psql -c "CREATE USER smartlearn WITH PASSWORD 'password' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE smartlearn OWNER smartlearn;"

# Set the password
echo "DB_PASSWORD=password" > .env
```

### 2. Install & Start Backend (port 3000)

```bash
cd backend
npm install
npm run backend:dev
# → 🚀 Smart Learn API server running on port 3000
# → ✅ PostgreSQL connected successfully
```

Verify: `curl http://localhost:3000/api/health`

### 3. Install & Start Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
# → VITE v5.x  ready in 554 ms
# → ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

### 4. Or Start Both Together

```bash
# From project root
npm install        # install root deps (concurrently, nodemon)
cd frontend && npm install && cd ..   # install frontend deps

npm run dev        # starts backend:3000 + frontend:5173
```

### 5. Run Database Migrations

```bash
cd backend
PGPASSWORD=password psql -h localhost -U smartlearn -d smartlearn -f migrations/20260409_complete_profile_setup.sql
PGPASSWORD=password psql -h localhost -U smartlearn -d smartlearn -f migrations/20260415_add_auth_tables.sql
PGPASSWORD=password psql -h localhost -U smartlearn -d smartlearn -f migrations/20260430_add_session_management.sql
PGPASSWORD=password psql -h localhost -U smartlearn -d smartlearn -f migrations/20260430_add_notification_tables.sql
```

---

## Docker Deployment (Production)

```bash
# One command from project root
cp .env.example .env
nano .env           # set DB_PASSWORD + JWT_SECRET
make deploy         # or: docker compose up -d --build
```

| URL | Service |
|-----|---------|
| http://localhost | Frontend |
| http://localhost/api/health | Backend health |

### Useful Docker Commands

```bash
make logs          # view all logs
make status        # check running services
make restart       # restart everything
make down          # stop all
make clean         # full reset (removes DB volume!)
```

---

## Supported File Formats

| Category | Formats |
|----------|---------|
| Text | TXT, CSV |
| Documents | PDF, DOCX |
| Spreadsheets | Excel (.xlsx, .xls), CSV |
| Presentations | PowerPoint (.pptx) |
| Subtitles | SRT, VTT |
| Audio | MP3, WAV, M4A, FLAC, OGG |
| Video | MP4, AVI, MOV, MKV |

---

## Project Structure

```
smart_learn/
├── backend/
│   ├── config/          — Server, database config
│   ├── src/
│   │   ├── auth/        — Authentication (password reset, OAuth, sessions)
│   │   ├── users/       — Users + Profile APIs
│   │   ├── sessions/    — Learning session management
│   │   ├── notifications/ — Notification system
│   │   ├── ingestion/   — File upload & extraction
│   │   ├── storage/     — Cloud-agnostic file storage
│   │   └── ...          — Outline, questions, answers, progress, etc.
│   ├── migrations/      — PostgreSQL migration files
│   └── scripts/         — Utility scripts
├── frontend/
│   └── src/
│       ├── components/  — 13 reusable Vue components
│       ├── pages/       — 6 page components
│       ├── stores/      — 5 Pinia stores
│       ├── services/    — 6 API service modules
│       ├── router/      — Vue Router + auth guard
│       └── layouts/     — AppLayout (sidebar + header)
├── plan/                — Implementation plans & breakdowns
├── req/                 — Requirement documents
├── uidesign/            — UI design specifications
├── docker-compose.yml   — Docker deployment
├── Makefile             — Convenience commands
└── .github/workflows/   — CI/CD pipeline
```

---

## Documentation

| Folder | Contains |
|--------|----------|
| [`req/`](./req/) | API & feature requirements |
| [`plan/`](./plan/) | Implementation plans, scaling, deployment guides |
| [`uidesign/`](./uidesign/) | UI specs, page designs, workflows |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 (Composition API), Pinia, Vite, Tailwind CSS |
| Backend | Node.js, Express, PostgreSQL |
| Storage | Cloud-agnostic (local / S3 / Azure / Aliyun) |
| Deployment | Docker Compose, Lightsail, GitHub Actions CI/CD |
| Auth | JWT (RS256), bcrypt, refresh tokens |

---

**Last Updated**: 2026-05-01  
**Status**: Backend + Frontend complete, ready for AWS deployment
