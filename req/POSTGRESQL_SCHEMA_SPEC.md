# Smart Learn PostgreSQL Schema Spec

## Status
Completed checkpoints in this document:
- Draft schema entities and relationships
- Define table-by-table columns

Remaining checkpoints will extend this document with enums, indexes, and MVP/later scope notes.

---

## Core design principles
- PostgreSQL is the primary persistence layer for MVP.
- Schema should support both uploaded materials and AI-generated base knowledge.
- User-provided materials should be weighted higher by default than system-generated material.
- Outline data is derived from active source materials and should be refreshable.
- Quiz generation should support 5-question default batches and additional batch generation.
- Teaching should support deferred questions without derailing the current lesson.
- Progress should capture both performance and learning continuity.

---

## Draft schema entities

### 1. users
Represents student accounts and authentication ownership.

Purpose:
- account identity
- authentication linkage
- user-level preferences later

### 2. learning_projects
Represents one study container, such as "AWS Basics" or "Biology Chapter 3".

Purpose:
- root object for all learning work
- groups materials, outlines, quizzes, sessions, and progress

### 3. source_materials
Represents learning material attached to a project.

Purpose:
- store uploaded, pasted, or system-generated knowledge sources
- support weighting and source prioritization
- support later file ingestion expansion

Expected source variants:
- user upload
- pasted text
- system base knowledge

### 4. outlines
Represents a generated outline version for a learning project.

Purpose:
- capture refreshable structure derived from current active materials
- allow regeneration/versioning when materials change

### 5. outline_items
Represents individual nodes inside an outline.

Purpose:
- store topic hierarchy
- support topic-by-topic teaching, review, and progress tracking

### 6. questions
Represents generated questions associated with a project and optionally an outline item.

Purpose:
- store quiz items
- support batch generation
- support later difficulty and explanation logic

### 7. answer_attempts
Represents a student answer attempt for a question.

Purpose:
- store quiz history
- track correctness, retries, and response patterns
- support weak-area detection and progress summaries

### 8. progress_snapshots
Represents periodic or event-driven summaries of learning progress.

Purpose:
- store project/topic-level progress state
- support dashboards, encouragement summaries, and weak-area views

### 9. deferred_questions
Represents student questions asked during teaching that are deferred for later review.

Purpose:
- preserve curiosity without derailing the current lesson
- link student side-questions back to project/topic/session context

### 10. learning_sessions
Represents a guided interaction period in Learn / Review / Quiz / Reinforce mode.

Purpose:
- track current learning mode and active thread
- support interruption handling and resumption
- support end-of-session summaries later

---

## High-level relationships

### User ownership
- one `users` record -> many `learning_projects`

### Project scope
- one `learning_projects` record -> many `source_materials`
- one `learning_projects` record -> many `outlines`
- one `learning_projects` record -> many `questions`
- one `learning_projects` record -> many `progress_snapshots`
- one `learning_projects` record -> many `deferred_questions`
- one `learning_projects` record -> many `learning_sessions`

### Outline structure
- one `outlines` record -> many `outline_items`
- one `outline_items` record -> many child `outline_items` (self-referential hierarchy)
- one `outline_items` record -> many `questions`

### Quiz flow
- one `questions` record -> many `answer_attempts`
- one `learning_sessions` record -> many `answer_attempts`

### Tutor-flow links
- one `learning_sessions` record -> many `deferred_questions`
- one `outline_items` record -> many `deferred_questions`

---

## MVP vs near-term support

### MVP entities
- users
- learning_projects
- source_materials
- outlines
- outline_items
- questions
- answer_attempts
- progress_snapshots

### Near-term tutor-flow entities
- deferred_questions
- learning_sessions

These two are valuable enough that they may still be included in the initial schema if implementation effort stays reasonable.

---

## Table-by-table draft columns

### 1. users
Suggested columns:
- `id` UUID primary key
- `email` varchar unique not null
- `password_hash` varchar not null
- `display_name` varchar not null
- `role` varchar default `student`
- `status` varchar default `active`
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- MVP can stay simple with one student role
- role/support fields keep room for parent/teacher later

### 2. learning_projects
Suggested columns:
- `id` UUID primary key
- `user_id` UUID not null references `users(id)`
- `title` varchar not null
- `description` text null
- `subject` varchar null
- `status` varchar default `active`
- `current_mode` varchar null
- `current_outline_id` UUID null references `outlines(id)`
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- one project is one study container
- `current_mode` supports quick project resume later

### 3. source_materials
Suggested columns:
- `id` UUID primary key
- `project_id` UUID not null references `learning_projects(id)`
- `source_kind` varchar not null
- `material_type` varchar not null
- `title` varchar null
- `original_file_name` varchar null
- `mime_type` varchar null
- `storage_path` text null
- `raw_text` text null
- `extracted_text` text null
- `weight` numeric(5,2) not null default 1.00
- `is_active` boolean not null default true
- `source_version` integer not null default 1
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- supports pasted text, upload, and system-generated base knowledge
- user-uploaded material can default to higher weight than system material

### 4. outlines
Suggested columns:
- `id` UUID primary key
- `project_id` UUID not null references `learning_projects(id)`
- `version_no` integer not null
- `generation_source` varchar not null default `mock_ai`
- `status` varchar default `active`
- `summary` text null
- `created_from_material_version` integer null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- multiple versions allow outline regeneration when materials change
- only one outline version is active at a time in MVP

### 5. outline_items
Suggested columns:
- `id` UUID primary key
- `outline_id` UUID not null references `outlines(id)`
- `parent_item_id` UUID null references `outline_items(id)`
- `title` varchar not null
- `summary` text null
- `key_points` jsonb null
- `sort_order` integer not null
- `depth_level` integer not null default 0
- `mastery_state` varchar null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- supports hierarchical topic trees
- `mastery_state` can later reflect topic-level progress labels

### 6. questions
Suggested columns:
- `id` UUID primary key
- `project_id` UUID not null references `learning_projects(id)`
- `outline_item_id` UUID null references `outline_items(id)`
- `batch_no` integer not null default 1
- `position_in_batch` integer not null default 1
- `question_type` varchar not null
- `difficulty_level` varchar not null default `medium`
- `prompt` text not null
- `options` jsonb null
- `correct_answer` jsonb null
- `explanation` text null
- `generation_source` varchar not null default `mock_ai`
- `status` varchar default `active`
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- batch tracking supports the 5-question default flow
- jsonb fields allow multiple-choice and short-answer flexibility

### 7. answer_attempts
Suggested columns:
- `id` UUID primary key
- `question_id` UUID not null references `questions(id)`
- `project_id` UUID not null references `learning_projects(id)`
- `session_id` UUID null references `learning_sessions(id)`
- `user_answer` jsonb not null
- `is_correct` boolean null
- `score` numeric(5,2) null
- `feedback_text` text null
- `attempt_no` integer not null default 1
- `answered_at` timestamptz not null default now()
- `created_at` timestamptz not null default now()

Notes:
- allows retries and answer history
- score can support partial credit later

### 8. progress_snapshots
Suggested columns:
- `id` UUID primary key
- `project_id` UUID not null references `learning_projects(id)`
- `outline_item_id` UUID null references `outline_items(id)`
- `snapshot_type` varchar not null
- `completion_percent` numeric(5,2) null
- `mastery_score` numeric(5,2) null
- `progress_state` varchar null
- `weak_areas` jsonb null
- `strength_areas` jsonb null
- `summary_text` text null
- `created_at` timestamptz not null default now()

Notes:
- stores project-level or topic-level progress summaries
- supports hopeful progress language and encouragement summaries

### 9. deferred_questions
Suggested columns:
- `id` UUID primary key
- `project_id` UUID not null references `learning_projects(id)`
- `session_id` UUID null references `learning_sessions(id)`
- `outline_item_id` UUID null references `outline_items(id)`
- `question_text` text not null
- `defer_reason` varchar not null
- `status` varchar not null default `deferred`
- `brief_response` text null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()
- `resolved_at` timestamptz null

Notes:
- supports parking-lot behavior for off-track or too-deep questions

### 10. learning_sessions
Suggested columns:
- `id` UUID primary key
- `project_id` UUID not null references `learning_projects(id)`
- `user_id` UUID not null references `users(id)`
- `mode` varchar not null
- `status` varchar not null default `active`
- `current_outline_item_id` UUID null references `outline_items(id)`
- `started_at` timestamptz not null default now()
- `ended_at` timestamptz null
- `session_summary` text null
- `motivation_state` jsonb null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

Notes:
- supports Learn / Review / Quiz / Reinforce tracking
- `motivation_state` can support later adaptive encouragement logic

## Suggested enums / controlled value sets

### users.role
- `student`
- `parent` (later)
- `teacher` (later)
- `admin` (later)

### users.status
- `active`
- `paused`
- `disabled`

### learning_projects.status
- `active`
- `archived`
- `completed`
- `paused`

### learning_projects.current_mode
- `learn`
- `review`
- `quiz`
- `reinforce`

### source_materials.source_kind
- `user_upload`
- `pasted_text`
- `system_base_knowledge`

### source_materials.material_type
- `text`
- `pdf`
- `docx`
- `image`
- `base_knowledge`
- `csv` (later)
- `excel` (later)
- `ppt` (later)
- `url` (later)
- `transcript` (later)

### outlines.generation_source
- `mock_ai`
- `manual`
- `llm` (later)

### outlines.status
- `draft`
- `active`
- `superseded`
- `archived`

### outline_items.mastery_state
- `strong`
- `improving`
- `building`
- `needs_reinforcement`
- `ready_for_review`

### questions.question_type
- `multiple_choice`
- `short_answer`
- `concept_recall`
- `true_false` (later)

### questions.difficulty_level
- `easy`
- `medium`
- `hard`

### questions.generation_source
- `mock_ai`
- `llm` (later)
- `manual` (later)

### questions.status
- `active`
- `retired`
- `draft`

### progress_snapshots.snapshot_type
- `project`
- `topic`
- `session`

### progress_snapshots.progress_state
- `strong`
- `improving`
- `building`
- `needs_reinforcement`
- `ready_for_review`

### deferred_questions.defer_reason
- `too_deep`
- `off_track`
- `needs_later_context`
- `student_requested_later`

### deferred_questions.status
- `deferred`
- `revisited`
- `resolved`
- `abandoned`
- `answered_now`

### learning_sessions.mode
- `learn`
- `review`
- `quiz`
- `reinforce`

### learning_sessions.status
- `active`
- `paused`
- `completed`
- `abandoned`

## Enum design notes
- MVP can implement these as PostgreSQL enums or constrained varchar/text columns.
- For faster iteration, constrained text/varchar with application validation may be simpler initially.
- Values such as `strong`, `improving`, `building`, and `needs_reinforcement` intentionally support non-shaming progress language.
- `source_kind` and `material_type` should remain separate because one tells where content came from and the other tells what format it is.

## Key business-rule mapping
- Base knowledge fallback -> `source_materials`
- Material weighting -> `source_materials`
- Outline refresh on material change -> `outlines` + `outline_items`
- 5-question batch generation -> `questions`
- Deferred/off-track question handling -> `deferred_questions`
- Learn/Review/Quiz/Reinforce flow tracking -> `learning_sessions`
- Progress and encouragement summaries -> `progress_snapshots`

## Recommended indexes

The goal for MVP indexing is to optimize common read paths first: project dashboards, active outline lookup, question batch retrieval, answer history, and progress summaries.

### users
- unique index on `email`

Reason:
- login and account lookup by email should be fast and globally unique

### learning_projects
- index on `(user_id, status, updated_at desc)`
- optional index on `(user_id, created_at desc)`

Reason:
- primary project list screens will usually fetch active or recent projects per user

### source_materials
- index on `(project_id, is_active, created_at desc)`
- index on `(project_id, source_kind)`

Reason:
- outline generation and refresh flows need fast access to active materials for a project
- weighting/fallback logic may filter by material origin

### outlines
- unique index on `(project_id, version_no)`
- index on `(project_id, status, created_at desc)`

Reason:
- project-level outline version history should be unique and easy to fetch
- active outline lookup must be cheap

### outline_items
- index on `(outline_id, parent_item_id, sort_order)`
- index on `(outline_id, depth_level, sort_order)`

Reason:
- topic tree rendering depends on hierarchical fetches ordered by parent and position
- topic-level traversal and filtered views may use depth

### questions
- index on `(project_id, status, created_at desc)`
- index on `(project_id, outline_item_id, batch_no, position_in_batch)`
- index on `(project_id, batch_no)`

Reason:
- common reads include current project questions, topic-specific batches, and follow-up batch generation

### answer_attempts
- index on `(question_id, answered_at desc)`
- index on `(project_id, session_id, answered_at desc)`
- unique index on `(question_id, attempt_no)`

Reason:
- evaluation history and session playback should be efficient
- retry order should be stable per question

Note:
- if answer attempts may later be multi-user across shared projects, change this unique index to include `project_id` or `user_id`

### progress_snapshots
- index on `(project_id, created_at desc)`
- index on `(project_id, outline_item_id, created_at desc)`
- index on `(project_id, snapshot_type, created_at desc)`

Reason:
- project summaries, topic progress views, and latest dashboard snapshots are all recent-first reads

### deferred_questions
- index on `(project_id, status, created_at desc)`
- index on `(session_id, status, created_at desc)`
- index on `(outline_item_id, status, created_at desc)`

Reason:
- parked-question revisit flows usually filter unresolved items by project, session, or topic

### learning_sessions
- index on `(project_id, status, started_at desc)`
- index on `(user_id, status, started_at desc)`
- index on `(project_id, current_outline_item_id)`

Reason:
- resuming the active session and locating the current topic thread should be cheap

## MVP scope notes

### In scope for MVP schema and implementation
- `users` with basic email/password authentication
- `learning_projects` as the root study container
- `source_materials` for pasted text, uploads, and system base knowledge placeholders
- `outlines` and `outline_items` for generated learning structure
- `questions` with default 5-question batch tracking
- `answer_attempts` for submission history and correctness tracking
- `progress_snapshots` for lightweight project/topic progress summaries

### Allowed in schema now, but implementation can be deferred slightly
- `learning_sessions`
- `deferred_questions`

Reason:
- both support the intended tutor flow and are worth reserving in the schema early
- implementation can trail the core ingestion -> outline -> quiz -> answer loop if time is tight

### Explicitly out of MVP implementation
- parent/teacher/admin role workflows
- advanced file ingestion beyond text-first behavior
- production OCR and rich document extraction pipelines
- real LLM generation pipeline beyond mock AI
- fine-grained motivation engine logic
- collaborative or multi-student shared projects
- analytics-heavy reporting and material-version diffing

### Pragmatic implementation guidance
- prefer normal btree indexes first; only add GIN indexes when jsonb querying becomes real, not hypothetical
- keep constraints simple enough to ship migrations quickly
- use nullable columns for near-term features instead of over-normalizing prematurely
- reserve room for later tutor-flow features without letting them block the core MVP loop
