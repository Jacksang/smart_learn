# Smart Learn PostgreSQL Setup

## Purpose
This document explains how to prepare a local PostgreSQL database for the Smart Learn backend using the committed baseline schema.

## Current D1.1 setup boundary
- Smart Learn is PostgreSQL-only now.
- MongoDB/Mongoose is no longer part of the runtime plan.
- Schema bootstrap is an explicit setup step; it is **not** run automatically on normal server startup.
- The schema currently boots in numbered order: `backend/db/schema/001_baseline.sql` first, then `backend/db/schema/002_outline_tables.sql`.

## 1. Create a PostgreSQL database
Example using `psql` as a local superuser:

```bash
createdb smartlearn
```

If you prefer explicit SQL:

```bash
psql -d postgres -c "CREATE DATABASE smartlearn;"
```

## 2. Configure environment variables
The backend reads discrete `DB_*` variables via `backend/config/postgres.js`.

Minimum variables:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartlearn
DB_USER=smartlearn
DB_PASSWORD=password
```

Optional tuning variables:

```bash
DB_SSL=false
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000
```

Notes:
- If these values are omitted, the local defaults in `backend/config/postgres.js` are used.
- `DB_SSL=true` enables `pg` SSL mode with `rejectUnauthorized: false`, which is acceptable for early non-production environments but should be tightened later for hardened deployments.

## 3. Create the database role if needed
If your local PostgreSQL instance does not already have the expected role:

```bash
psql -d postgres -c "CREATE USER smartlearn WITH PASSWORD 'password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE smartlearn TO smartlearn;"
```

You may substitute a different role/password pair as long as `DB_USER` and `DB_PASSWORD` match.

## 4. Apply the committed schema files
Run the committed SQL files in migration order with `psql`:

```bash
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f backend/db/schema/001_baseline.sql

PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f backend/db/schema/002_outline_tables.sql
```

What `001_baseline.sql` creates:
- `users`
- `learning_projects`
- `source_materials`
- `questions`
- `answer_attempts`
- `progress_snapshots`
- `deferred_questions`
- `learning_sessions`

What `002_outline_tables.sql` adds:
- `outlines`
- `outline_items`
- dependent foreign keys from baseline tables back to outline entities

It also installs:
- `pgcrypto` for UUID generation
- `set_updated_at()` trigger helper
- baseline foreign keys and recommended MVP indexes

## 5. Verify database connectivity
Quick connectivity check from the project root:

```bash
node -e "require('./backend/config/database').connect()"
```

Expected result:

```text
✅ PostgreSQL connected successfully
```

## 6. Start the backend
Normal backend startup:

```bash
npm run backend
```

Development mode:

```bash
npm run backend:dev
```

## Known D1.1 runtime notes
- The backend startup path now uses PostgreSQL only; it no longer depends on MongoDB/Mongoose.
- In this workspace, startup still fails if PostgreSQL is not running or not reachable (for example `ECONNREFUSED 127.0.0.1:5432`).
- During the remaining schema/runtime cutover window, endpoints that hit missing PostgreSQL tables/columns/foreign keys return `503 Service Unavailable` with an explicit MVP-readiness message instead of an opaque `500`.
- Apply `backend/db/schema/001_baseline.sql` and then `backend/db/schema/002_outline_tables.sql` before normal backend testing so the PostgreSQL-only runtime has the expected schema chain available.
