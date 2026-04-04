# PostgreSQL Migration Plan

## Status
- Created: 2026-04-04
- Updated: 2026-04-04
- Checkpoints covered:
  - D1.1.A — persistence strategy decision
  - D1.1.B — runtime retirement plan for Mongo path
- Scope here: record the PostgreSQL access decision, rationale, current-state findings, Mongo runtime retirement inventory/map, and D1.1 migration boundary

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

## Mongo runtime inventory and retirement map

### Inventory: direct Mongoose model definitions
- `backend/models/User.js`
- `backend/models/Outline.js`
- `backend/models/Question.js`
- `backend/models/Answer.js`

### Inventory: active runtime imports that still use Mongo-style models
- `backend/src/users/controller.js`
- `backend/src/users/middleware.js`
- `backend/src/outline/controller.js`
- `backend/src/questions/controller.js`
- `backend/src/answers/controller.js`

### Inventory: dependency/package references still mentioning Mongo
- `package.json` → declares `mongoose`
- `package-lock.json` → lockfile entries for `mongoose`
- `docs/POSTGRES_MIGRATION_PLAN.md` → historical migration notes referencing Mongo/Mongoose

### Retirement / replacement decisions
- Retire `backend/models/{User,Outline,Question,Answer}.js` once no active runtime path imports them.
- Replace active controller/middleware imports directly with PostgreSQL repository helpers already present under:
  - `backend/src/users/repository.js`
  - `backend/src/outline/repository.js`
  - `backend/src/questions/repository.js`
  - `backend/src/answers/repository.js`
- Do **not** add a temporary compatibility shim in D1.1. The cutover should be controller-to-repository directly.
- Keep `mongoose` declared only until the runtime import cutover and dependency cleanup checkpoint are complete.

### Replacement map by active file
- `backend/src/users/controller.js` → replace `../../models/User` with `./repository` helpers for auth/profile flows
- `backend/src/users/middleware.js` → replace `../../models/User` with `./repository.findById`
- `backend/src/outline/controller.js` → replace `../../models/Outline` with `./repository` list/create helpers
- `backend/src/questions/controller.js` → replace `../../models/Question` with `./repository` list/create/find helpers
- `backend/src/answers/controller.js` → replace `../../models/{Answer,Question}` with `../answers/repository` and `../questions/repository` helpers

### Expected post-cutover state
- `backend/server.js` startup path should not require `backend/models/*`
- Mongo model files may remain briefly as dead code, but only until safe deletion/dependency cleanup
- After cutover, `mongoose` can be removed from active runtime dependencies in a later D1.1 checkpoint

## Exact runtime path changes required to remove Mongo from the active path

### 1. Auth controller cutover
File: `backend/src/users/controller.js`
- Replace `const User = require('../../models/User');`
- Import `backend/src/users/repository.js` helpers instead:
  - `findByEmail`
  - `findById`
  - `createUser`
  - `comparePassword`
  - `touchLastActive`
  - `toPublicProfile`
- Rewrite runtime calls as follows:
  - `User.findOne({ email: ... })` → `findByEmail(email)`
  - `User.create(...)` → `createUser(...)`
  - `user.comparePassword(password)` → `comparePassword(password, user.password_hash)`
  - `user.lastActive = new Date(); await user.save();` → `await touchLastActive(user.id)`
  - `User.findById(req.user.id)` → `findById(req.user.id)`
  - `user.getPublicProfile()` → `toPublicProfile(user)`
- Token subject should use PostgreSQL row ids consistently (`user.id`), not Mongoose `_id`.

### 2. Auth middleware cutover
File: `backend/src/users/middleware.js`
- Replace `const User = require('../../models/User');`
- Import `findById` from `backend/src/users/repository.js`
- Rewrite runtime calls as follows:
  - `User.findById(decoded.id)` → `findById(decoded.id)`
  - `req.user = { id: user._id.toString() };` → `req.user = { id: user.id };`
- Result: JWT auth no longer depends on any Mongoose model instance shape.

### 3. Outline controller cutover
File: `backend/src/outline/controller.js`
- Replace `const Outline = require('../../models/Outline');`
- Import `listByUser` and `createOutline` from `backend/src/outline/repository.js`
- Rewrite runtime calls as follows:
  - `Outline.find({ user: req.user.id }).sort({ createdAt: -1 })` → `listByUser(req.user.id)`
  - both `Outline.create(...)` call sites → `createOutline(...)` with payload keys aligned to repository shape:
    - `user` → `userId`
    - `courseTitle`, `subject`, `sourceType`, `sourcePath`, `topics`, `aiSummary`, `status` unchanged except for camelCase-to-repository mapping where required
- Result: outline list/create/upload flows run entirely through PostgreSQL.

### 4. Question controller cutover
File: `backend/src/questions/controller.js`
- Replace `const Question = require('../../models/Question');`
- Import `listQuestions`, `createQuestion`, and `findById` (if needed later) from `backend/src/questions/repository.js`
- Rewrite runtime calls as follows:
  - `Question.find(filter).sort({ createdAt: -1 })` → `listQuestions({ userId: req.user.id, outlineId: req.query.outlineId, topic: req.query.topic })`
  - `Question.create(...)` → `createQuestion(...)` with repository payload keys:
    - `user` → `userId`
    - `outline` → `outlineId`
    - remaining business fields passed through
- Result: question read/write path no longer requires the Mongo model layer.

### 5. Answer controller cutover
File: `backend/src/answers/controller.js`
- Replace `const Answer = require('../../models/Answer');`
- Replace `const Question = require('../../models/Question');`
- Import from repositories instead:
  - `listAnswers`, `countAttempts`, `createAnswer` from `backend/src/answers/repository.js`
  - `findById` from `backend/src/questions/repository.js`
- Rewrite runtime calls as follows:
  - `Answer.find({ user: req.user.id }).populate(...).sort(...)` → `listAnswers(req.user.id)`
  - `Question.findById(req.body.questionId)` → `findById(req.body.questionId)`
  - `Answer.countDocuments({ user: req.user.id, question: question._id })` → `countAttempts(req.user.id, question.id)`
  - `Answer.create(...)` → `createAnswer(...)` with repository payload keys:
    - `user` → `userId`
    - `question` → `questionId`
    - `submittedAnswer`, `isCorrect`, `score`, `feedback`, `attemptNumber` retained
  - response payloads should return PostgreSQL row fields (`question.id`, `question.correct_answer`, `question.explanation`) rather than Mongoose document fields.
- Result: answer submission/listing becomes PostgreSQL-backed and no longer depends on populate/countDocuments behavior.

### 6. Startup-path outcome expected after controller cutover
Once the five files above are rewired:
- Active request handling should no longer import anything from `backend/models/*`
- `backend/server.js` → `backend/config/server.js` → route/controller stack should execute without requiring Mongoose at runtime
- The Mongo model files may remain temporarily in-tree, but only as dead code pending later D1.1 cleanup
- After this cutover, dependency cleanup can safely remove `mongoose` from the active runtime manifest in a later checkpoint

## PostgreSQL environment variables and connection config structure

### Environment variable contract for D1.1
The PostgreSQL bootstrap/config path should standardize on these environment variables:

Required for non-local environments:
- `DB_HOST` — PostgreSQL host name
- `DB_PORT` — PostgreSQL port, default `5432`
- `DB_NAME` — database name
- `DB_USER` — database user
- `DB_PASSWORD` — database password

Optional variables for safer runtime defaults and future-proofing:
- `NODE_ENV` — selects dev/test/production behavior already used elsewhere in the app ecosystem
- `DB_SSL` — boolean-like flag (`true`/`false`) to enable SSL when deploying outside local development
- `DB_POOL_MAX` — maximum PostgreSQL pool size if/when pool tuning is exposed
- `DB_IDLE_TIMEOUT_MS` — idle timeout for pooled connections if/when pool tuning is exposed
- `DB_CONNECTION_TIMEOUT_MS` — connect timeout if/when pool tuning is exposed

### Environment variable policy
- Local development may keep fallback defaults in code temporarily during D1.1, but deployed environments should provide explicit `DB_*` values.
- `DB_PASSWORD` must never be committed; it belongs only in local `.env` files or deployment secret stores.
- If `DB_SSL=true`, the config module should enable PostgreSQL SSL mode in a deployment-safe way and keep local development defaulted to non-SSL unless explicitly requested.
- The project should continue using discrete `DB_*` variables for MVP rather than switching to a combined `DATABASE_URL`, because the current runtime already reads discrete keys and the migration scope is to stabilize—not redesign—the config surface.

### Connection config structure
The shared PostgreSQL config module should keep one exported pool/client entrypoint and one narrow config builder path:

1. Load environment variables through `dotenv` in backend startup/config code.
2. Normalize config into a single object with this shape:
   - `user`
   - `host`
   - `database`
   - `password`
   - `port`
   - optional `ssl`
   - optional pool tuning fields (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`)
3. Create exactly one shared `pg` `Pool` from that normalized object.
4. Export thin helpers around the pool:
   - `query(text, params)`
   - `pool`
   - `connect()` or equivalent health-check/bootstrap probe

### Mapping to current code
Current file: `backend/config/database.js`

Current environment mapping already present:
- `process.env.DB_USER` -> `user`
- `process.env.DB_HOST` -> `host`
- `process.env.DB_NAME` -> `database`
- `process.env.DB_PASSWORD` -> `password`
- `process.env.DB_PORT` -> `port`

D1.1 config follow-up should keep this mapping stable while tightening structure around:
- explicit numeric parsing for `DB_PORT`
- optional SSL/pool settings
- clearer separation between config normalization and connectivity probing

### Recommended defaults for MVP
For local-only MVP development, the existing defaults remain acceptable as temporary bootstrap values:
- host: `localhost`
- port: `5432`
- database/user: `smartlearn`

However, the long-term default policy should be:
- avoid production fallbacks for credentials
- prefer failing fast when required non-local variables are missing
- keep only developer-friendly local defaults where they reduce setup friction without hiding deployment misconfiguration

## Planned follow-on work in this document
Later D1.1 checkpoints should extend this file with:
- schema/bootstrap file layout and migration approach
- dependency/config update notes
- setup/bootstrap instructions references

## Reference documents
- `D1.1_POSTGRES_MIGRATION_SUBCHECKLIST.md`
- `docs/POSTGRESQL_SCHEMA_SPEC.md`
- `backend/config/database.js`
- `package.json`
