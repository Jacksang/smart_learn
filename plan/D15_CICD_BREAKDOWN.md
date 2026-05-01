# D15: CI/CD Pipeline + AWS Secrets Setup — Function-Level Breakdown

**Date:** 2026-04-30  
**Goal:** Auto-deploy on push to main + secure credential management

---

## Architecture

```
GitHub Push → Actions Runner
                ├── Build frontend (Vite)
                ├── Build backend Docker image
                ├── Push images to ECR (or skip, build on VM)
                ├── SSH into Lightsail
                ├── git pull + docker compose up -d --build
                └── Health check → ✅/❌
```

---

## Task Slices

- [ ] **A1** — `.github/workflows/deploy.yml` — CI/CD workflow
- [ ] **A2** — `plan/D15_AWS_SETUP_GUIDE.md` — Step-by-step for user

---

## A1: GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Lightsail

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to Lightsail via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ubuntu
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          script: |
            cd smart_learn
            git pull origin main
            echo "DB_PASSWORD=${{ secrets.DB_PASSWORD }}" > .env
            echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
            echo "STORAGE_PROVIDER=${{ secrets.STORAGE_PROVIDER:-local }}" >> .env
            docker compose up -d --build
            docker compose ps

      - name: Health Check
        run: |
          sleep 10
          curl -f http://${{ secrets.LIGHTSAIL_HOST }}/api/health
          echo "✅ Deployment successful"
```

## A2: AWS Setup Guide

Create `plan/D15_AWS_SETUP_GUIDE.md` with:

### Section 1: What You Need to Create in AWS
- Lightsail instance (ap-southeast-1a, Ubuntu 22.04, $5/mo small)
- Static IP attached
- S3 bucket (smartlearn-materials-{accountId}, ap-southeast-1, block public access)
- IAM user for GitHub Actions with policy:
  - Not needed for this simple setup (just SSH key + Lightsail)

### Section 2: GitHub Secrets to Set
| Secret | Value | Where to get it |
|--------|-------|----------------|
| LIGHTSAIL_HOST | `1.2.3.4` | Lightsail static IP |
| LIGHTSAIL_SSH_KEY | `-----BEGIN RSA...` | Your private SSH key |
| DB_PASSWORD | strong-password | You choose |
| JWT_SECRET | random-32-char-string | `openssl rand -hex 32` |
| STORAGE_PROVIDER | `local` or `s3` | You decide |

### Section 3: Where Backend Credentials Live
- DB_PASSWORD + JWT_SECRET: Set on VM via `.env` (deployed by GitHub Actions), OR
- AWS Secrets Manager (for production)
  - `aws secretsmanager create-secret --name smartlearn/db-password --secret-string "xxx"`
  - `aws secretsmanager create-secret --name smartlearn/jwt-secret --secret-string "xxx"`
  - Backend reads from Secrets Manager on startup (future enhancement)

### Section 4: Lightsail Setup Commands
```bash
# Create instance
aws lightsail create-instances \
  --instance-name smartlearn \
  --availability-zone ap-southeast-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id small_1_0

# Create static IP and attach
aws lightsail allocate-static-ip --static-ip-name smartlearn-ip
aws lightsail attach-static-ip \
  --static-ip-name smartlearn-ip \
  --instance-name smartlearn

# Open ports
aws lightsail open-instance-public-ports \
  --instance-name smartlearn \
  --port-info fromPort=80,toPort=80,protocol=TCP
aws lightsail open-instance-public-ports \
  --instance-name smartlearn \
  --port-info fromPort=443,toPort=443,protocol=TCP

# Get SSH key for GitHub
# Lightsail console → Account → SSH keys → Download default key
# Or generate your own: ssh-keygen -t rsa -b 4096 -f smartlearn-key
# Upload public key to Lightsail
```

### Section 5: S3 Bucket Setup (if using S3 storage)
```bash
BUCKET="smartlearn-materials-$(aws sts get-caller-identity --query Account --output text)"
aws s3 mb s3://$BUCKET --region ap-southeast-1
aws s3api put-bucket-encryption --bucket $BUCKET \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create IAM user for S3 access from Lightsail
aws iam create-user --user-name smartlearn-s3
aws iam create-access-key --user-name smartlearn-s3
aws iam put-user-policy --user-name smartlearn-s3 --policy-name s3-access \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:PutObject","s3:GetObject","s3:DeleteObject"],"Resource":"arn:aws:s3:::'$BUCKET'/*"}]}'
```

### Section 6: Verification Checklist
- [ ] Lightsail VM running, static IP attached
- [ ] SSH into VM works: `ssh ubuntu@<IP> -i your-key.pem`
- [ ] Docker installed on VM: `docker --version`
- [ ] git repo cloned: `ls ~/smart_learn`
- [ ] GitHub Secrets set: LIGHTSAIL_HOST, LIGHTSAIL_SSH_KEY, DB_PASSWORD, JWT_SECRET
- [ ] Push to main → Actions tab shows green ✅
- [ ] `http://<IP>/api/health` returns 200
- [ ] Frontend loads at `http://<IP>/`

---

## Secrets Summary

| Location | What | How |
|----------|------|-----|
| **GitHub Secrets** | LIGHTSAIL_HOST, SSH_KEY, DB_PASSWORD, JWT_SECRET | Settings → Secrets → Actions |
| **Lightsail VM** | DB_PASSWORD, JWT_SECRET (in .env) | Deployed by GitHub Actions |
| **AWS Secrets Manager** | (optional future upgrade) | Backend reads on startup |
| **S3 credentials** | If using S3: set on VM env vars | .env or instance role |
