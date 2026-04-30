# Smart Learn — Ultra-Low-Cost Deployment Options

**Date:** 2026-04-30 | **Goal:** Sub-$10/month for 3-5 users  
**Prepared by:** Eva2 AI Guardian

---

## 🏆 Top Picks at a Glance

| Option | Monthly Cost | DB Included | Setup Effort | Code Changes |
|--------|-------------|-------------|--------------|--------------|
| **Lightsail + Docker** | **$5/mo** | PostgreSQL (container) | 2 hours | Zero |
| **Vercel + Supabase** | **$0/mo** | PostgreSQL (managed) | 3 hours | Moderate |
| **Hetzner VPS + Docker** | **$4/mo** | PostgreSQL (container) | 2 hours | Zero |
| **fly.io** | **$0/mo** | SQLite (attached vol) | 4 hours | ~100 lines |

---

## 📦 Option 1: AWS Lightsail + Docker — $5/mo 🏆 RECOMMENDED

**Single VM runs everything.** No per-service billing, no cold starts, full control. All inside Docker.

```
┌─────────────────────────────────────────────┐
│        Lightsail $5/mo (1GB RAM, 40GB SSD)  │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Nginx   │  │  Node.js │  │ PostgreSQL │ │
│  │ frontend │→│ backend  │→│   (local)  │ │
│  │ :80      │  │ :3000    │  │ :5432      │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                              │
│  docker-compose up -d  ← one command        │
└─────────────────────────────────────────────┘
```

### docker-compose.yml (all 3 services in one file)

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: smartlearn
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: smartlearn
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_USER: smartlearn
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: smartlearn
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    depends_on: [db]
    restart: unless-stopped

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.nginx
    ports:
      - "80:80"
    depends_on: [backend]
    restart: unless-stopped

volumes:
  pgdata:
```

### Backend Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Frontend Dockerfile (multi-stage: build → Nginx)
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### nginx.conf (SPA fallback + API proxy)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

### Deploy in 3 Commands
```bash
# 1. Create Lightsail instance ($5/mo, 1GB RAM)
aws lightsail create-instances --instance-name smartlearn \
  --availability-zone ap-southeast-1a --blueprint-id ubuntu_22_04 \
  --bundle-id small_1_0

# 2. SSH in, install Docker, clone and run
ssh ubuntu@<IP>
curl -fsSL https://get.docker.com | sh
git clone https://github.com/Jacksang/smart_learn.git
cd smart_learn
echo "DB_PASSWORD=xxx" > .env
echo "JWT_SECRET=xxx" >> .env
docker compose up -d

# 3. Point domain
# Static IP → Route 53 A record → done
```

### Cost: $5.50/mo total
| Item | Cost |
|------|------|
| Lightsail (1GB RAM, 40GB SSD, 2TB transfer) | $5.00 |
| Static IP | Free |
| DNS (Route 53) | $0.50 |
| **TOTAL** | **$5.50/mo** |

---

## 📦 Option 2: Vercel + Supabase — $0/mo 🆓

**Truly free for 3-5 users.** Managed, no server to touch.

```
┌────────────┐     ┌──────────────┐
│   Vercel   │────→│  Supabase    │
│  frontend  │     │  PostgreSQL  │
│   $0/mo    │     │   $0/mo      │
└────────────┘     └──────────────┘
```

### Free Tier Adequacy
| Resource | Free Limit | Our Usage (5 users) | Status |
|----------|-----------|---------------------|--------|
| Database storage | 500 MB | ~4 MB | ✅ 124x headroom |
| Auth users | 50,000 MAU | 5 | ✅ |
| API requests | 2M/month | ~10,000 | ✅ 200x headroom |
| Storage | 1 GB | ~100 MB | ✅ |
| Vercel bandwidth | 100 GB | ~2 GB | ✅ |

### The Catch
- Backend can't run Express on Vercel free tier → need to refactor to serverless functions
- Supabase pauses after 1 week idle → simple cron pings solve this

---

## 📦 Option 3: Hetzner VPS + Docker — $4/mo 🇪🇺

Same docker-compose setup as Option 1. Just different host.

| Spec | Price |
|------|-------|
| 2 GB RAM, 20 GB SSD, 20 TB traffic | **~$4/mo** |
| 4 GB RAM, 40 GB SSD, 20 TB traffic | ~$6/mo |

More RAM than Lightsail, less managed. EU data centers.

---

## 📊 Master Comparison

| Factor | Lightsail Docker | Vercel+Supabase | Hetzner | fly.io |
|--------|-----------------|-----------------|---------|--------|
| **Monthly cost** | **$5** | **$0** | **$4** | **$0** |
| **DB** | PostgreSQL | PostgreSQL | PostgreSQL | SQLite |
| **Code changes** | **None** | Moderate | **None** | ~100 lines |
| **Setup** | 2 hours | 3-4 hours | 2 hours | 3-4 hours |
| **Cold starts** | Never | Sometimes | Never | Sometimes |
| **Scale ceiling** | ~100 users | ~500 users | ~500 users | ~20 users |
| **SSL** | Manual (certbot) | Automatic | Manual | Automatic |
| **Backups** | Snapshots ($2) | Automatic | rsync | Volumes |
| **Vendor lock-in** | None (Docker) | Moderate | None (Docker) | Moderate |

---

## 🎯 Recommendation

**Go with Option 1: Lightsail $5/mo.**

Why:
- PostgreSQL without any code changes
- Docker makes it portable — move to any VPS later
- $5/month is less than one lunch
- Full control over your server
- Same stack as dev (Node + Postgres + Nginx)

Later, if you outgrow it, `docker compose` files work identically on:
- AWS EC2
- Hetzner
- DigitalOcean
- Your own server
- Any Linux box

**Want me to create all the Docker and deployment files now?**