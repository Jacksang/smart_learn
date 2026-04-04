# Smart Learn PostgreSQL Setup

## Purpose
This document explains how to prepare a local PostgreSQL database for the Smart Learn backend using the committed baseline schema.

## Current D1.1 setup boundary
- Smart Learn is PostgreSQL-only now.
- MongoDB/Mongoose is no longer part of the runtime plan.
- Schema bootstrap is an explicit setup step; it is **not** run automatically on normal server startup.
- The canonical baseline schema lives at `backend/db/schema/001_baseline.sql`.

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

## 4. Apply the baseline schema
Run the committed SQL file directly with `psql`:

```bash
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f backend/db/schema/001_baseline.sql
```

What this creates:
- `users`
- `learning_projects`
- `source_materials`
- `outlines`
- `outline_items`
- `questions`
- `answer_attempts`
- `progress_snapshots`
- `deferred_questions`
- `learning_sessions`

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

## Known D1.1 caveat
As of the current D1.1 state, `backend/config/server.js` still calls `connectDB()` like a function even though `backend/config/database.js` exports an object with a `.connect()` method. That startup-path fix belongs to a later D1.1 runtime task; use the connectivity check above to validate PostgreSQL setup in the meantime.
