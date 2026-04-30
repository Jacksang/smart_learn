# Smart Learn — AWS Serverless Deployment Plan

**Date:** 2026-04-30  
**Goal:** Deploy to AWS with minimum cost  
**Prepared by:** Eva2 AI Guardian

---

## 🏗️ Architecture Options

### Option A: Aurora Serverless v2 (Recommended ✅)
**Zero backend code changes** — PostgreSQL-compatible, serverless, pay-per-usage.

| Service | Purpose | Est. Monthly Cost (MVP) |
|---------|---------|------------------------|
| **S3 + CloudFront** | Frontend static hosting | ~$0.50 |
| **API Gateway HTTP** | REST API endpoint | ~$1.00/million req |
| **Lambda** (Node.js 22) | Backend compute | Free tier (1M req/mo) |
| **Aurora Serverless v2** | PostgreSQL DB | ~$45/mo (0.5 ACU min) |
| **Route 53** | Domain (eva9.ai) | ~$0.50/mo |
| **TOTAL** | | **~$47/mo** |

### Option B: DynamoDB (Your Request)
**Requires full data model rewrite** — NoSQL single-table design.

| Service | Purpose | Est. Monthly Cost (MVP) |
|---------|---------|------------------------|
| **S3 + CloudFront** | Frontend static hosting | ~$0.50 |
| **API Gateway HTTP** | REST API endpoint | ~$1.00/million req |
| **Lambda** (Node.js 22) | Backend compute | Free tier (1M req/mo) |
| **DynamoDB** (on-demand) | NoSQL database | ~$0.50/mo (light usage) |
| **Route 53** | Domain (eva9.ai) | ~$0.50/mo |
| **TOTAL** | | **~$2.50/mo** |

> **Honest assessment:** Option B saves ~$45/mo but requires rewriting all 5000+ lines of SQL queries to DynamoDB patterns. Option A is deployable this week with zero code changes.

---

## 📋 Recommended Path (Option A): Aurora Serverless

### Step 1: Prepare Frontend (30 min)
```bash
cd frontend
npm run build          # Creates dist/ with static files
aws s3 sync dist/ s3://smartlearn-frontend/ --delete
```
- Create S3 bucket with static website hosting
- Front CloudFront distribution with S3 origin
- Set error document to index.html (SPA routing)

### Step 2: Lambda Backend (1 hour)
Wrap existing Express app with `@vendia/serverless-express`:

```js
// backend/lambda.js (NEW)
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./config/server'); // Existing Express app

exports.handler = serverlessExpress({ app });
```

```yaml
# template.yaml (SAM/CloudFormation)
Resources:
  SmartLearnFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs22.x
      Handler: lambda.handler
      Timeout: 30
      Environment:
        Variables:
          DB_HOST: !Ref AuroraEndpoint
          DB_PASSWORD: !Ref DBPassword
          JWT_SECRET: !Ref JWTSecret
      Events:
        Api:
          Type: HttpApi
          Properties:
            Path: /api/{proxy+}
            Method: ANY
```

### Step 3: Aurora Serverless v2 (15 min)
```sql
-- Aurora is PostgreSQL-compatible, just point and migrate
-- Existing pg_dump works directly
pg_dump -h localhost -U smartlearn -d smartlearn > dump.sql
psql -h <aurora-endpoint> -U smartlearn -d smartlearn < dump.sql
```

### Step 4: Environment & Secrets
```bash
# AWS Parameter Store / Secrets Manager
aws ssm put-parameter --name /smartlearn/DB_PASSWORD --value "xxx" --type SecureString
aws ssm put-parameter --name /smartlearn/JWT_SECRET --value "xxx" --type SecureString
aws ssm put-parameter --name /smartlearn/SENDGRID_API_KEY --value "xxx" --type SecureString
```

### Step 5: CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: push
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd frontend && npm ci && npm run build
      - uses: aws-actions/configure-aws-credentials@v4
      - run: aws s3 sync frontend/dist/ s3://smartlearn-frontend/ --delete
      - run: aws cloudfront create-invalidation --distribution-id xxx --paths "/*"
  
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
      - run: cd backend && npm ci
      - run: |
          sam build
          sam deploy --no-confirm-changeset
```

---

## 💰 Option B: Full DynamoDB Path (If Budget is Critical)

### Data Model Redesign Required

**Current PostgreSQL (relational):**
```
users ──< learning_sessions ──< session_progress_snapshots
  │                                    │
  ├──< notification_preferences        ├──< session_summaries
  ├──< notifications                   └──< session_mode_history
  ├──< oauth_users
  └──< password_reset_tokens
```

**DynamoDB Single-Table Design:**
```
PK                    SK                      Attrs
─────────────────────────────────────────────────────
USER#123             PROFILE#123             {name, email, avatar...}
USER#123             PREFS#123               {emailEnabled, pushEnabled...}
USER#123             SESSION#uuid-1          {mode, status, progress...}
USER#123             SESSION#uuid-2          {...}
SESSION#uuid-1       SNAPSHOT#ts1            {progress, mood...}
SESSION#uuid-1       SUMMARY#1               {weakAreas, strengths...}
SESSION#uuid-1       MODE#ts1                {fromMode, toMode...}
USER#123             NOTIF#N1                {type, title, read...}
```

**Rewrite Required For:**
- Every repository function (40+ SQL → DynamoDB queries)
- All JOIN queries → multiple DynamoDB Gets
- Pagination → DynamoDB pagination tokens
- Transactions → DynamoDB TransactWriteItems
- Aggregations → Client-side or DynamoDB Streams + Lambda

### Step-by-Step for Option B
1. Design DynamoDB single-table schema (1 week)
2. Rewrite repository layer (2-3 weeks)
3. Migrate data from PostgreSQL → DynamoDB (1 week)
4. Test all 40 endpoints (1 week)
5. Deploy Lambda + API Gateway + DynamoDB (1 day)
6. **Total: 5-6 weeks development**

---

## 🎯 Recommendation

**Start with Option A (Aurora Serverless).** It's deployable this week with zero backend code changes. Aurora Serverless v2 scales to zero (0 ACU) during inactivity — true pay-per-usage. At 0.5 ACU minimum, you're paying ~$22/month minimum, which is reasonable for a production app.

**Migrate to DynamoDB later** only if:
- Aurora costs exceed budget
- You need global multi-region (DynamoDB Global Tables)
- Traffic patterns demand DynamoDB's predictable latency

---

## 📊 Quick Comparison

| Factor | Aurora Serverless | DynamoDB |
|--------|------------------|----------|
| Code changes | **0 lines** | ~5000+ lines |
| Time to deploy | **1 day** | 5-6 weeks |
| Monthly cost (MVP) | ~$47 | ~$3 |
| SQL queries work | ✅ Yes | ❌ Must rewrite |
| Joins | ✅ Native | ❌ Must denormalize |
| Transactions | ✅ ACID | ⚠️ Limited |
| Scale to zero | ✅ Yes (0 ACU) | ✅ Always on-demand |
| Dev effort | Deploy existing code | Full rewrite |

---

## 🚀 Immediate Next Step

Which path would you prefer?

1. **Option A**: Deploy this week with Aurora Serverless (~$47/mo, zero code changes)
2. **Option B**: Rewrite for DynamoDB (~$3/mo, 5-6 weeks of work)
3. **Hybrid**: Deploy A now for immediate launch, plan B migration for Q2
