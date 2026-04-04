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
- [ ] Define metadata storage rules
- [ ] Save artifact: `docs/FILE_INGESTION_STRATEGY.md`
- [ ] Commit and push

### D0.5 Feedback and motivation template catalog
- [ ] Define encouraging feedback patterns
- [ ] Define struggle recovery templates
- [ ] Define progress language rules
- [ ] Save artifact: `docs/FEEDBACK_TEMPLATE_CATALOG.md`
- [ ] Commit and push

---

## Phase 1 — Backend MVP Foundation

### D1.1 PostgreSQL migration foundation
- [ ] Remove/retire Mongo-oriented persistence path
- [ ] Add PostgreSQL driver / ORM decision
- [ ] Create schema bootstrap or migrations
- [ ] Save artifact: migration files + setup doc
- [ ] Commit and push

### D1.2 Project and material management
- [ ] Implement `learning_projects`
- [ ] Implement `source_materials`
- [ ] Implement material weighting rules
- [ ] Implement base knowledge fallback trigger
- [ ] Save artifact: working routes + tests
- [ ] Commit and push

### D1.3 Outline generation flow
- [ ] Implement outline creation endpoint
- [ ] Implement outline refresh on material change
- [ ] Implement `outlines` + `outline_items`
- [ ] Save artifact: working routes + tests
- [ ] Commit and push

### D1.4 Question generation flow
- [ ] Implement question generation from outline
- [ ] Default to 5-question batch size
- [ ] Support additional batch generation
- [ ] Save artifact: working routes + tests
- [ ] Commit and push

### D1.5 Answers and progress
- [ ] Implement answer submission
- [ ] Implement answer evaluation
- [ ] Implement progress snapshots / weak-area logic
- [ ] Save artifact: working routes + tests
- [ ] Commit and push

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
- [x] Complete D0.1 and push `docs/POSTGRESQL_SCHEMA_SPEC.md`
