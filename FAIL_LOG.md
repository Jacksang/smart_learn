# Smart Learn Fail Log

## 2026-04-04

### Event
A one-shot worker run returned corrupted/unreadable output while attempting to continue the next unfinished checkpoint after `D0.2` and the first part of `D0.3`.

### Observed symptom
- Result text was garbled and not reliable enough to treat as a meaningful project outcome.
- No concrete artifact or commit was reported from that failed run.

### Immediate handling taken
- Treated as a failed worker run rather than a valid project blocker.
- Started a fresh worker from current repo state.

### Corrective protocol now adopted
- Failed worker runs must be reported or logged.
- If the same task fails twice, stop and analyze before retrying.
- If task scope is too large, break it into a sub-checkpoint file and recurse.

### Event
A later worker run timed out after D0.5 had started.

### Observed symptom
- The worker did not report a completed checkpoint.
- Its partial note indicates it drifted into a larger D1.1 code-refactor idea (retiring Mongo runtime paths) instead of staying narrowly on the next first unfinished checkpoint in the current list.

### Impact
- No valid completion for the current checkpoint can be accepted from that run.
- This may indicate task-drift or prompt-following weakness in long recursive runs.

### Next handling
- Treat this as the first failure for the current step.
- If the same step fails again, stop and analyze whether the requirement needs clearer scoping or whether a sub-checkpoint breakdown is required.

### Event
`D1.3.A` migration verification hit a local PostgreSQL access blocker.

### Observed symptom
- `pg_isready` shows PostgreSQL is accepting connections on `localhost:5432`.
- Non-interactive verification attempts could not authenticate with the available local credentials.
- Creating a disposable verification database and replaying `001_baseline.sql` + `002_outline_tables.sql` was therefore not possible in this worker environment.

### Impact
- The schema file for `D1.3.A` was created and baseline migration dependencies were refactored accordingly.
- Full runtime confirmation of the migration chain remains pending until valid database credentials or a disposable local Postgres instance are available.

### Next handling
- Re-run the verification step once working PostgreSQL credentials are provided for this repo environment, or once a disposable local cluster can be launched without privilege prompts.

### Retry detail
- Follow-up verification retry confirmed the same blocker more precisely.
- `pg_isready -h 127.0.0.1 -p 5432` still reports the server is accepting connections.
- The repo’s plausible local verification targets are:
  - documented defaults from `backend/config/postgres.js` / `docs/POSTGRES_SETUP.md`: `smartlearn@127.0.0.1:5432/smartlearn`
  - the live DB path recorded in D1.2: `openclaw_user@127.0.0.1:5432/openclaw_db`
- Both `psql` attempts require password auth immediately.
- No project `.env`, no exported `DB_*` variables, and no `~/.pgpass` entry are available in this worker session.
- The documented fallback password (`password`) fails for both candidate roles, so the worker cannot authenticate non-interactively to apply `001_baseline.sql` and `002_outline_tables.sql`.

### Updated root cause
- The blocker was not PostgreSQL reachability; it was missing valid local credentials for the actual database roles used by this environment.
- That blocker is now resolved for this repo session because a local gitignored `.env` exists and provides a working `DB_PASSWORD`.
- Important environment note: the password does **not** match the repo default `smartlearn` role from `backend/config/postgres.js`; it matches the already-used local role/database `openclaw_user@127.0.0.1:5432/openclaw_db`.

### Resolution
- Re-ran verification by sourcing the repo-local `.env`, confirming authenticated access to `openclaw_db` as `openclaw_user`, and replaying `backend/db/schema/001_baseline.sql` plus `backend/db/schema/002_outline_tables.sql` into a disposable schema using `SET search_path TO <temp_schema>, public;`.
- The migration chain completed successfully and the disposable schema contained the expected `outlines` / `outline_items` tables, dependent foreign keys, index, and `outlines_set_updated_at` trigger.
- D1.3.A is no longer blocked on database access.
