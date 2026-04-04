# Smart Learn PostgreSQL Schema Spec

## Status
This document starts with the completion of the first schema checkpoint:
- Draft schema entities and relationships

Further checkpoints will extend this document with full columns, enums, indexes, and MVP/later scope notes.

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

## Key business-rule mapping
- Base knowledge fallback -> `source_materials`
- Material weighting -> `source_materials`
- Outline refresh on material change -> `outlines` + `outline_items`
- 5-question batch generation -> `questions`
- Deferred/off-track question handling -> `deferred_questions`
- Learn/Review/Quiz/Reinforce flow tracking -> `learning_sessions`
- Progress and encouragement summaries -> `progress_snapshots`
