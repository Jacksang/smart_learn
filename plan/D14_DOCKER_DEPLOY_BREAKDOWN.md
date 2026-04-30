# D14: Docker Compose Deployment — Function-Level Breakdown

**Date:** 2026-04-30  
**Goal:** One-command deploy to any VM (Lightsail, EC2, Hetzner, DigitalOcean)  
**Architecture:** Nginx (frontend) + Node.js (backend) + PostgreSQL (database)

---

## Task Slices (all independent — parallelize!)

- [ ] **A1** — `docker-compose.yml` — 3 services (db, backend, frontend), volumes, networks, healthchecks
- [ ] **A2** — `backend/Dockerfile` — Node 22 Alpine, npm ci --production, copy source, CMD server.js
- [ ] **A3** — `frontend/Dockerfile` — Multi-stage: Node build (npm ci + vite build) → Nginx Alpine serving dist/
- [ ] **A4** — `frontend/nginx.conf` — SPA fallback (try_files $uri /index.html), /api proxy to backend:3000
- [ ] **B1** — `.env.example` — Template with all variables (DB_PASSWORD, JWT_SECRET, STORAGE_PROVIDER, S3_*, etc.)
- [ ] **B2** — `scripts/deploy.sh` — Clone repo, set env, docker compose up -d, verify health
- [ ] **B3** — `Makefile` — Convenience: make dev, make build, make deploy, make logs, make down

## Parallel Execution
```
Wave 1: A1+A2+A3+A4 (all Docker/Nginx files) — 1 sub-agent (tightly coupled)
Wave 2: B1+B2+B3 (env template + deploy script + Makefile) — 1 sub-agent (independent)
```

## Verification
```
docker compose config  # validate yaml
docker compose up -d   # start all 3 services
curl http://localhost/api/health  # backend health
curl http://localhost/            # frontend serves index.html
```
