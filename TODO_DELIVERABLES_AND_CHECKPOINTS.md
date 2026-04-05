# Smart Learn Deliverables & Checkpoints

## Purpose
This file is the concrete execution checklist for long-running work on Smart Learn.

Rules for use:
- every meaningful work block should map to a deliverable in this file
- each deliverable should end with a concrete artifact (doc, code, test, commit, etc.)
- progress should be reported against checkpoints, not vague status
- if a checkpoint stalls, record the blocker explicitly

---

## Phase 0 — Planning Artifacts

### D0.1 PostgreSQL schema spec
- [x] Draft schema entities and relationships
- [x] Define table-by-table columns
- [x] Define enums/status fields
- [x] Define indexes and MVP scope notes
- [x] Save artifact: `docs/POSTGRESQL_SCHEMA_SPEC.md`
- [x] Commit and push

### D0.2 API endpoint spec
- [x] Map endpoints from schema and product flow
- [x] Define request/response shapes
- [x] Define error handling conventions
- [x] Define MVP vs later endpoints
- [x] Save artifact: `docs/API_ENDPOINT_SPEC.md`
- [x] Commit and push

### D0.3 Lesson state machine
- [x] Define Learn / Review / Quiz / Reinforce states
- [x] Define transitions and interruption handling
- [x] Define deferred-question behavior
- [x] Save artifact: `docs/LESSON_STATE_MACHINE.md`
- [x] Commit and push

### D0.4 File ingestion strategy
- [x] Define MVP support for text / PDF / DOCX / image OCR
- [x] Define extraction pipeline expectations
- [x] Define metadata storage rules
- [x] Save artifact: `docs/FILE_INGESTION_STRATEGY.md`
- [x] Commit and push

### D0.5 Feedback and motivation template catalog
- [x] Define encouraging feedback patterns
- [x] Define struggle recovery templates
- [x] Define progress language rules
- [x] Save artifact: `docs/FEEDBACK_TEMPLATE_CATALOG.md`
- [x] Commit and push

---

## Phase 1 — Backend MVP Foundation

### D1.1 PostgreSQL migration foundation
- [x] Remove/retire Mongo-oriented persistence path
- [x] Add PostgreSQL driver / ORM decision
- [x] Create schema bootstrap or migrations
- [x] Save artifact: migration files + setup doc
- [x] Commit and push
  - Closeout note (2026-04-04): D1.1.A-G are complete in `D1.1_POSTGRES_MIGRATION_SUBCHECKLIST.md`, including PostgreSQL-only runtime cutover, `docs/POSTGRES_MIGRATION_PLAN.md`, `backend/db/schema/001_baseline.sql`, `docs/POSTGRES_SETUP.md`, and the parent-checklist sync/closeout commits.

### D1.2 Project and material management
- [x] Implement `learning_projects`
- [x] Implement `source_materials`
- [x] Implement material weighting rules
- [x] Implement base knowledge fallback trigger
- [x] Save artifact: working routes + tests
- [x] Commit and push
  - Progress sync (2026-04-04): D1.2.A-F are complete in `D1.2_PROJECT_AND_MATERIAL_MANAGEMENT_SUBCHECKLIST.md`, including runtime/schema audit notes in `docs/D1.2_RUNTIME_SCHEMA_ALIGNMENT_AUDIT.md`, PostgreSQL-backed `backend/src/projects/*` and `backend/src/materials/*` repository/controller/router modules, material weighting and fallback service coverage, mounted `/api/projects` + `/api/materials` routes, and verified Jest/live PostgreSQL route-flow artifacts.
  - Parent checkpoint sync (2026-04-04): Marked the D1.2 implementation/artifact checkpoints complete in this parent file after confirming D1.2.A-G evidence exists; only the final D1.2 closeout commit/push remains open.
  - Closeout note (2026-04-04): Completed the parent D1.2 closeout commit/push after the sub-checklist had already been closed and pushed.

### D1.3 Outline generation flow
- [x] Implement outline creation endpoint
- [x] Implement outline refresh on material change
- [x] Implement `outlines` + `outline_items`
- [x] Save artifact: working routes + tests
- [x] Commit and push
  - Closeout note (2026-04-04): D1.3.A-F are complete in `D1.3_OUTLINE_GENERATION_FLOW_SUBCHECKLIST.md`, including schema split/migration verification, outline creation + refresh + retrieval endpoints, focused integration coverage in `backend/src/outline/flow.integration.test.js`, and `docs/OUTLINE_GENERATION_FLOW.md`. Related commits were pushed through `b14e8a7`.

### D1.4 Question generation flow
- [x] Implement question generation from outline
- [x] Default to 5-question batch size
- [x] Support additional batch generation
- [x] Save artifact: working routes + tests
- [ ] Commit and push
  - Closeout note (2026-04-05): D1.4.A-F are complete in `D1.4_QUESTION_GENERATION_FLOW_SUBCHECKLIST.md`, including project-scoped generation/listing routes, focused unit coverage, end-to-end flow verification in `backend/src/questions/flow.integration.test.js`, and `docs/QUESTION_GENERATION_FLOW.md`.

### D1.5 Answers and progress
- [ ] Implement answer submission
- [x] Implement answer evaluation
- [x] Implement progress snapshots / weak-area logic
- [ ] Save artifact: working routes + tests
- [ ] Commit and push
  - Planning note (2026-04-05): Detailed execution breakdown created in `D1.5_ANSWERS_AND_PROGRESS_SUBCHECKLIST.md`.
  - Progress sync (2026-04-05): D1.5.D is complete in `D1.5_ANSWERS_AND_PROGRESS_SUBCHECKLIST.md`, including project-scoped answer history endpoints, explicit answer evaluation by `answerAttemptId`, and controller/router test coverage proving both `GET /api/projects/:projectId/answers/history` and `POST /api/projects/:projectId/answers/evaluate` are implemented.
  - Progress sync (2026-04-05): D1.5.E is complete in `D1.5_ANSWERS_AND_PROGRESS_SUBCHECKLIST.md`, including the `backend/src/progress/` module, `POST /api/projects/:projectId/progress/refresh`, persisted project/topic `progress_snapshots`, and focused verification in `backend/src/progress/repository.test.js`, `backend/src/progress/service.test.js`, and `backend/src/progress/controller.test.js`.

---

## Phase 2 — Tutor Flow and Learning Experience

### D2.1 Learning sessions
- [ ] Implement learning session model
- [ ] Track current mode and current topic
- [ ] Save artifact: session model + routes/tests
- [ ] Commit and push

### D2.2 Deferred questions / parking lot
- [ ] Implement deferred question storage
- [ ] Link question to lesson step/topic
- [ ] Add revisit flow
- [ ] Save artifact: model + routes/tests
- [ ] Commit and push

### D2.3 Reinforce and recovery flow
- [ ] Implement confidence recovery triggers
- [ ] Add easier-question fallback path
- [ ] Add end-of-session summary structure
- [ ] Save artifact: service logic + tests
- [ ] Commit and push

---

## Phase 3 — File and Multimedia Support

### D3.1 PDF / DOCX / image support
- [ ] Implement file upload persistence
- [ ] Implement text extraction pipeline
- [ ] Implement OCR path for images
- [ ] Save artifact: ingestion services + tests
- [ ] Commit and push

### D3.2 Future ingestion formats
- [ ] Plan Excel/CSV ingestion
- [ ] Plan PPT/slides ingestion
- [ ] Plan transcript ingestion
- [ ] Save artifact: design doc updates
- [ ] Commit and push

---

## Phase 4 — Motivation and Retention Layer

### D4.1 Motivation engine basics
- [ ] Implement feedback template selection rules
- [ ] Implement constructive progress labels
- [ ] Implement effort/focus/resilience milestone logic
- [ ] Save artifact: service layer + docs/tests
- [ ] Commit and push

### D4.2 Adaptive encouragement
- [ ] Add struggle signal detection
- [ ] Add confidence-support messaging rules
- [ ] Add next-step recommendation logic
- [ ] Save artifact: service layer + docs/tests
- [ ] Commit and push

---

## Work Protocol for Long Tasks
- Before each work block, define the exact deliverable ID from this file.
- Do not report "almost done" unless a file, commit, or test artifact exists.
- If no artifact is produced within the intended work window, record the blocker.
- Prefer milestone completion over broad status updates.

## Current recommended next checkpoint
- [ ] Start D1.5.A via `D1.5_ANSWERS_AND_PROGRESS_SUBCHECKLIST.md`
