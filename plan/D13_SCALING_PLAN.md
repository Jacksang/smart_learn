# Smart Learn — Scaling Path & Cost Projection (5 → 500+ Students)

**Date:** 2026-04-30 | **Prepared by:** Eva2 AI Guardian

---

## 📊 Load Estimation Per Student

| Activity | Per Student/Day | DB Queries |
|----------|----------------|-----------|
| Sessions (create, pause, resume, end) | 2-3 sessions | ~20 queries |
| Questions answered | 20-40 | ~100 queries |
| Progress snapshots | 5-10 | ~15 writes |
| Material uploads | 0.2 (every 5 days) | ~10 queries |
| Analytics/weak areas | 1-2 page loads | ~10 queries |
| Notifications | 2-3 | ~5 queries |
| **Total** | | **~160 queries/day/student** |

### Peak Concurrency (worst case: 80% of students active simultaneously)

| Students | Peak Concurrent | Queries/sec | DB Connections | Data/month |
|----------|----------------|-------------|---------------|------------|
| 5 | 4 | 0.01 | 4-8 | ~4 MB |
| 50 | 40 | 0.1 | 20-40 | ~80 MB |
| 200 | 160 | 0.5 | 80-160 | ~400 MB |
| 500 | 400 | 1.5 | 200-400 | ~1 GB |
| 1,000 | 800 | 3 | 400-800 | ~2 GB |

> **Key insight:** Even at 500 students, we're talking about 1.5 queries/second. A single PostgreSQL instance handles 1,000+ queries/second. The real bottleneck is **RAM for concurrent connections**, not CPU.

---

## 🔄 Phase 1: Single VM (1-50 Students) → $5/mo

```
┌──────────────────────────────────────────┐
│       Lightsail $5/mo (1GB RAM)          │
│                                           │
│   docker compose up -d                    │
│   ├── Nginx (frontend)                    │
│   ├── Node.js (backend, pool: 10)         │
│   └── PostgreSQL (max_conn: 30)           │
└──────────────────────────────────────────┘
```

| Component | Cost |
|-----------|------|
| Lightsail 1GB VM | $5/mo |
| Static IP | Free |
| Backup snapshots | $1/mo |
| **TOTAL** | **$6/mo** |

**Why $5 is enough for 3-50 students:** At 50 concurrent students, PostgreSQL needs ~30 connections (30 × 5MB = 150MB RAM). Node.js uses ~200MB. Total ~500MB. 1GB is comfortable with 500MB headroom.

---

## 📈 Phase 2: Split Database (50-200 Students) → $25/mo

**Trigger:** When `max_connections` hits 80% or RAM usage exceeds 70%.

```
┌───────────────────┐     ┌────────────────────────────┐
│ Lightsail $10/mo  │     │ Lightsail Managed DB $15/mo │
│ (2GB, app server) │────→│ (1GB RAM PostgreSQL)        │
│                    │     │                             │
│ ├── Nginx          │     │ Automated backups           │
│ └── Node.js        │     │ Point-in-time recovery      │
│     pool: 30       │     │ Managed upgrades            │
└───────────────────┘     └────────────────────────────┘
```

| Component | Cost |
|-----------|------|
| App VM (2GB) | $10/mo |
| Managed DB (1GB) | $15/mo |
| **TOTAL** | **$25/mo** |

**Why split:** Moving DB to managed service gives you automated backups, point-in-time recovery, and separates compute from storage. App VM can reboot without affecting database.

---

## 🔀 Phase 3: Horizontal Scale (200-500 Students) → $55/mo

**Trigger:** DB connections approach 150+ or single app server CPU > 60%.

```
                    ┌────────────────┐
                    │  CloudFront CDN │  (free tier: 1TB/mo)
                    │  (frontend)     │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │ Lightsail LB   │  $18/mo
                    │ (load balancer)│
                    └───┬────────┬───┘
                        │        │
            ┌───────────┘        └───────────┐
            │                                 │
┌───────────┴──────────┐      ┌─────────────┴────────┐
│ Lightsail $10/mo     │      │ Lightsail $10/mo      │
│ App Server 1          │      │ App Server 2          │
│ ├── Nginx (optional)  │      │ └── Node.js            │
│ └── Node.js           │      │     pool: 20           │
│     pool: 20          │      └───────────────────────┘
└──────────────────────┘
            │
┌───────────┴──────────┐
│ Managed DB $30/mo    │
│ (2GB RAM PostgreSQL) │
└──────────────────────┘
```

| Component | Cost |
|-----------|------|
| CloudFront CDN | Free (1TB) |
| Load Balancer | $18/mo |
| 2 × App VM (2GB) | $20/mo |
| Managed DB (2GB) | $30/mo |
| **TOTAL** | **$68/mo** |

---

## 🏗️ Phase 4: AWS Proper (500-1,000+ Students) → $200-400/mo

**Trigger:** Outgrowing Lightsail limits or need auto-scaling.

```
CloudFront ($5) → ALB ($22) → ECS Fargate (2 tasks, $40) → Aurora Serverless v2 ($90)
                                    ↑ Spot instances cut cost 40-70%
```

| Component | Cost |
|-----------|------|
| CloudFront (500GB) | $5 |
| ALB | $22 |
| ECS Fargate (2× 0.5 vCPU) | $40 |
| Aurora Serverless v2 (1 ACU) | $90 |
| Data transfer | $20 |
| **TOTAL** | **~$180/mo** |

> **At this point, you'd have real revenue.** $180/month is trivial compared to 500+ paying students.

---

## 📊 Cost Progression Chart

```
$400 ┤
     │
$300 ┤
     │
$200 ┤                                    ████ Phase 4
     │                                    ████ (AWS proper)
$100 ┤                                    ████
     │                        ████
 $70 ┤                        ████ Phase 3
     │            ████        ████ (2 VMs + LB)
 $30 ┤            ████        ████
     │  ████      ████        ████
  $6 ┤  ██        ████        ████
     │  ██        ████        ████
  $0 └──██────────████────────████────────████──
       Phase 1   Phase 2     Phase 3    Phase 4
       5-50      50-200      200-500    500-1000+
```

---

## 🎯 Cost Per Student at Each Phase

| Phase | Students | Monthly Cost | **Cost/Student** |
|-------|----------|-------------|-----------------|
| 1 | 10 | $6 | **$0.60** |
| 1 | 50 | $6 | **$0.12** |
| 2 | 100 | $25 | **$0.25** |
| 2 | 200 | $25 | **$0.13** |
| 3 | 300 | $68 | **$0.23** |
| 3 | 500 | $68 | **$0.14** |
| 4 | 1,000 | $180 | **$0.18** |

> **The cost per student stays remarkably flat** — between $0.13 and $0.25/student/month across all phases. The architecture naturally amortizes.

---

## 🔧 Architectural Principles That Keep Costs Optimal

### 1. Docker Everywhere = Zero Lock-in
```yaml
# Same docker-compose.yml works on:
# - Lightsail ($5), Hetzner ($4), DigitalOcean ($6)
# - Your own server ($0)
# - Any cloud VM
```
No vendor lock-in. Move anywhere anytime.

### 2. Connection Pooling from Day 1
```yaml
# Add to docker-compose.yml
  pgbouncer:
    image: edoburu/pgbouncer
    environment:
      DB_HOST: db
      MAX_CLIENT_CONN: 100
      DEFAULT_POOL_SIZE: 20
```
Reduces PostgreSQL memory by 60% under load.

### 3. Gradual Splitting (not Big Bang)
| Phase | What changes | Downtime |
|-------|-------------|----------|
| 1→2 | Point backend to new DB host | 30 seconds |
| 2→3 | Add VM, point LB | Zero (blue-green) |
| 3→4 | Docker → ECS, DB → Aurora | Planned 1 hour |

### 4. Frontend Never Touches Backend
Nginx serves Vue build — no server-side rendering. CDN caches it globally forever with a cache-busting hash on each deploy.

### 5. Database is the Only State
Everything else is stateless Docker containers. Replace any VM without losing data.

---

## 🚀 Recommended Starting Point

```bash
# Phase 1: Lightsail $5/mo, deploy this week
aws lightsail create-instances \
  --instance-name smartlearn \
  --availability-zone ap-southeast-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id small_1_0    # 1GB RAM, $5/mo

# Same docker-compose.yml scales from Phase 1 through Phase 3
# with zero changes. Only environment variables change.
```

**Phase 1 at $5/mo gives you headroom to ~50 students.** That's probably 6-12 months of runway before needing Phase 2.

Want me to create all the Docker files and deployment scripts now?