# PostgreSQL Migration Plan

## Status
- Created: 2026-04-04
- Checkpoint covered: D1.1.A — persistence strategy decision
- Scope here: record the PostgreSQL access decision, rationale, current-state findings, and D1.1 migration boundary

## Decision
Smart Learn MVP will standardize on **PostgreSQL via direct `pg` access** with **thin per-domain repository modules**.

## Why this approach
1. `backend/config/database.js` already exposes a PostgreSQL `Pool` using `pg`.
2. Direct SQL keeps the migration surface smaller while Mongo/Mongoose runtime paths are still being retired.
3. Repository modules provide a clean seam for replacing active Mongoose-backed controllers incrementally.
4. Introducing an ORM or query builder now would add a second migration variable before the runtime path is stabilized.

## Explicit non-decision
For D1.1, the project will **not** add an ORM or SQL query builder.

Deferred until after the migration foundation is stable:
- ORM adoption review
- query-builder adoption review
- larger persistence abstractions beyond thin repositories

## Current-state findings

### Active server/database path
- Runtime entrypoint: `backend/server.js`
- Server boot path: `backend/config/server.js`
- Database module: `backend/config/database.js`

### PostgreSQL already present in runtime shape
`backend/config/database.js` is already PostgreSQL-oriented:
- imports `Pool` from `pg`
- reads DB connection settings from environment variables
- runs a `SELECT 1` connectivity probe during `db.connect()`

### Dependency mismatch still present
Root `package.json` still declares:
- `mongoose`

But it does **not** yet declare:
- `pg`

This means the runtime intent and dependency manifest are currently out of sync.

### Active Mongo/Mongoose runtime usage still present
Controllers and middleware still depend on Mongoose model files:
- `backend/src/users/controller.js`
- `backend/src/users/middleware.js`
- `backend/src/outline/controller.js`
- `backend/src/questions/controller.js`
- `backend/src/answers/controller.js`

Mongo-only model layer still present under:
- `backend/models/User.js`
- `backend/models/Outline.js`
- `backend/models/Question.js`
- `backend/models/Answer.js`

## D1.1 migration scope
D1.1 covers:
- documenting the migration plan
- inventorying Mongo/Mongoose imports and active runtime paths
- defining the runtime retirement plan for Mongo-backed code
- declaring PostgreSQL dependencies and connection/config structure
- adding an initial PostgreSQL schema/bootstrap path aligned to `docs/POSTGRESQL_SCHEMA_SPEC.md`
- removing Mongo from the active server startup/runtime path when safe for MVP

D1.1 does **not** cover:
- complete D1.2+ feature rewrites
- full product behavior parity across all endpoints
- real LLM integration
- advanced persistence abstractions beyond the MVP repository pattern

## MVP implementation boundary
The migration should prefer:
- one repository module per backend domain area
- raw SQL through the shared PostgreSQL pool
- incremental replacement of active Mongoose reads/writes
- MVP-safe fallbacks where endpoint behavior is still placeholder-oriented

The migration should avoid in D1.1:
- broad architecture rewrites unrelated to persistence migration
- introducing multiple new data-access layers at once
- schema complexity beyond what is needed for MVP foundation work

## Planned follow-on work in this document
Later D1.1 checkpoints should extend this file with:
- Mongo/Mongoose import inventory and retirement map
- exact runtime path changes required to remove Mongo from the active path
- environment variable and connection config design
- schema/bootstrap file layout and migration approach
- dependency/config update notes
- setup/bootstrap instructions references

## Reference documents
- `D1.1_POSTGRES_MIGRATION_SUBCHECKLIST.md`
- `docs/POSTGRESQL_SCHEMA_SPEC.md`
- `backend/config/database.js`
- `package.json`
