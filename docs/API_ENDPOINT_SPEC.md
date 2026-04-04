# Smart Learn API Endpoint Spec

## Status
Completed checkpoints in this document:
- Map endpoints from schema and product flow

Remaining checkpoints will extend this document with request/response shapes, error handling conventions, MVP/later splits, and final delivery notes.

---

## Purpose
This document maps backend API endpoints from the PostgreSQL schema and the intended Smart Learn product flow.

Primary flow covered:
1. authenticate user
2. create a learning project
3. attach source materials or trigger base knowledge fallback
4. generate or refresh an outline
5. generate question batches
6. submit answers and update progress
7. support tutor-flow session state and deferred questions

---

## Design principles for endpoint mapping
- Resource names should follow the core PostgreSQL entities where practical.
- Project-centric nested routes should be preferred for the main learning workflow.
- Endpoints should reflect MVP-first delivery, with room for tutor-flow expansion.
- Outline and question generation are domain actions, so action-style subroutes are acceptable.
- The API should support both direct CRUD operations and guided workflow actions.

---

## Resource inventory mapped from schema

### Core schema-backed resources
- `users`
- `learning_projects`
- `source_materials`
- `outlines`
- `outline_items`
- `questions`
- `answer_attempts`
- `progress_snapshots`
- `learning_sessions`
- `deferred_questions`

### Product-flow action areas
- authentication
- outline generation/refresh
- question batch generation
- answer evaluation
- progress summary refresh
- base knowledge fallback
- deferred-question revisit
- session resume/end

---

## Endpoint map by workflow

### 1. Authentication and identity

#### `POST /api/auth/register`
Purpose:
- create a user account
- initialize the student identity used by learning projects

Schema mapping:
- `users`

#### `POST /api/auth/login`
Purpose:
- authenticate an existing user
- return session/token credentials for later requests

Schema mapping:
- `users`

#### `GET /api/auth/me`
Purpose:
- fetch the currently authenticated user profile
- support app boot and session restore

Schema mapping:
- `users`

---

### 2. Learning project management

#### `GET /api/projects`
Purpose:
- list the current user's learning projects
- support dashboard and recent activity views

Schema mapping:
- `learning_projects`

#### `POST /api/projects`
Purpose:
- create a new learning project
- establish the root study container

Schema mapping:
- `learning_projects`

#### `GET /api/projects/:projectId`
Purpose:
- fetch one project and its current high-level state
- support project landing page and resume flow

Schema mapping:
- `learning_projects`

#### `PATCH /api/projects/:projectId`
Purpose:
- update project metadata like title, description, subject, or status

Schema mapping:
- `learning_projects`

#### `DELETE /api/projects/:projectId`
Purpose:
- remove or archive a project, depending on implementation choice

Schema mapping:
- `learning_projects`

#### `GET /api/projects/:projectId/overview`
Purpose:
- fetch a project-focused summary with active outline, latest progress, and next action hints

Schema mapping:
- `learning_projects`
- `outlines`
- `progress_snapshots`
- `learning_sessions`

---

### 3. Source material management

#### `GET /api/projects/:projectId/materials`
Purpose:
- list materials attached to a project
- show weight, origin, and active/inactive state

Schema mapping:
- `source_materials`

#### `POST /api/projects/:projectId/materials`
Purpose:
- add pasted text, uploaded file metadata, or base knowledge material to a project

Schema mapping:
- `source_materials`

#### `GET /api/projects/:projectId/materials/:materialId`
Purpose:
- fetch one source material record and extracted content metadata

Schema mapping:
- `source_materials`

#### `PATCH /api/projects/:projectId/materials/:materialId`
Purpose:
- update material title, weight, active state, or other editable metadata

Schema mapping:
- `source_materials`

#### `DELETE /api/projects/:projectId/materials/:materialId`
Purpose:
- retire or remove a material from active use

Schema mapping:
- `source_materials`

#### `POST /api/projects/:projectId/materials/upload`
Purpose:
- accept a file upload and create a `source_materials` record tied to stored file metadata

Schema mapping:
- `source_materials`

#### `POST /api/projects/:projectId/materials/base-knowledge`
Purpose:
- create a system-generated base knowledge material when user-provided content is missing or thin

Schema mapping:
- `source_materials`

#### `POST /api/projects/:projectId/materials/reweight`
Purpose:
- apply material weighting rules across the project's active materials

Schema mapping:
- `source_materials`

---

### 4. Outline generation and browsing

#### `GET /api/projects/:projectId/outlines`
Purpose:
- list outline versions for a project

Schema mapping:
- `outlines`

#### `POST /api/projects/:projectId/outlines`
Purpose:
- generate a new outline from current active materials

Schema mapping:
- `outlines`
- `outline_items`
- `source_materials`

#### `GET /api/projects/:projectId/outlines/:outlineId`
Purpose:
- fetch one outline and its metadata

Schema mapping:
- `outlines`

#### `PATCH /api/projects/:projectId/outlines/:outlineId`
Purpose:
- update outline status or summary metadata

Schema mapping:
- `outlines`

#### `POST /api/projects/:projectId/outlines/refresh`
Purpose:
- regenerate the active outline after source materials change

Schema mapping:
- `outlines`
- `outline_items`
- `source_materials`

#### `POST /api/projects/:projectId/outlines/:outlineId/activate`
Purpose:
- set one outline version as the active outline for the project

Schema mapping:
- `outlines`
- `learning_projects`

#### `GET /api/projects/:projectId/outlines/:outlineId/items`
Purpose:
- fetch the full topic tree for an outline

Schema mapping:
- `outline_items`

#### `GET /api/projects/:projectId/outlines/:outlineId/items/:itemId`
Purpose:
- fetch one outline item/topic with summary and hierarchy context

Schema mapping:
- `outline_items`

---

### 5. Question generation and retrieval

#### `GET /api/projects/:projectId/questions`
Purpose:
- list questions for a project, optionally filtered by outline item, batch, or status

Schema mapping:
- `questions`

#### `POST /api/projects/:projectId/questions/generate`
Purpose:
- generate a new question batch for a project or selected outline item

Schema mapping:
- `questions`
- `outline_items`
- `outlines`

#### `POST /api/projects/:projectId/questions/generate-next-batch`
Purpose:
- generate an additional batch after the default question set is exhausted

Schema mapping:
- `questions`

#### `GET /api/projects/:projectId/questions/:questionId`
Purpose:
- fetch one question and its associated metadata

Schema mapping:
- `questions`

#### `PATCH /api/projects/:projectId/questions/:questionId`
Purpose:
- update question status or manually adjust metadata in admin/dev flows

Schema mapping:
- `questions`

#### `GET /api/projects/:projectId/outline-items/:itemId/questions`
Purpose:
- fetch questions scoped to one topic node

Schema mapping:
- `questions`
- `outline_items`

---

### 6. Answer submission and evaluation

#### `POST /api/projects/:projectId/questions/:questionId/answers`
Purpose:
- submit a learner answer attempt for a question

Schema mapping:
- `answer_attempts`
- `questions`

#### `GET /api/projects/:projectId/questions/:questionId/answers`
Purpose:
- fetch answer history for one question

Schema mapping:
- `answer_attempts`

#### `POST /api/projects/:projectId/answers/evaluate`
Purpose:
- evaluate one answer submission or a set of submissions and generate feedback

Schema mapping:
- `answer_attempts`
- `questions`

#### `GET /api/projects/:projectId/answers/history`
Purpose:
- fetch recent answer attempts across the project

Schema mapping:
- `answer_attempts`

---

### 7. Progress and weak-area tracking

#### `GET /api/projects/:projectId/progress`
Purpose:
- fetch latest progress summary for the project

Schema mapping:
- `progress_snapshots`

#### `POST /api/projects/:projectId/progress/refresh`
Purpose:
- compute and store a fresh progress snapshot after answer activity or major project changes

Schema mapping:
- `progress_snapshots`
- `answer_attempts`
- `questions`
- `outline_items`

#### `GET /api/projects/:projectId/progress/topics/:itemId`
Purpose:
- fetch topic-level progress for one outline item

Schema mapping:
- `progress_snapshots`
- `outline_items`

#### `GET /api/projects/:projectId/progress/weak-areas`
Purpose:
- fetch identified weak topics or skills needing reinforcement

Schema mapping:
- `progress_snapshots`
- `outline_items`
- `answer_attempts`

---

### 8. Learning session tutor-flow support

#### `GET /api/projects/:projectId/sessions`
Purpose:
- list sessions for the project

Schema mapping:
- `learning_sessions`

#### `POST /api/projects/:projectId/sessions`
Purpose:
- start a new learning session in Learn, Review, Quiz, or Reinforce mode

Schema mapping:
- `learning_sessions`

#### `GET /api/projects/:projectId/sessions/:sessionId`
Purpose:
- fetch a session and its current topic/mode state

Schema mapping:
- `learning_sessions`

#### `PATCH /api/projects/:projectId/sessions/:sessionId`
Purpose:
- update session state, current outline item, or status

Schema mapping:
- `learning_sessions`

#### `POST /api/projects/:projectId/sessions/:sessionId/resume`
Purpose:
- resume a paused or active session

Schema mapping:
- `learning_sessions`

#### `POST /api/projects/:projectId/sessions/:sessionId/end`
Purpose:
- end a session and store its summary

Schema mapping:
- `learning_sessions`

---

### 9. Deferred-question parking lot

#### `GET /api/projects/:projectId/deferred-questions`
Purpose:
- list deferred questions for a project

Schema mapping:
- `deferred_questions`

#### `POST /api/projects/:projectId/deferred-questions`
Purpose:
- store a parked question raised during teaching

Schema mapping:
- `deferred_questions`

#### `GET /api/projects/:projectId/deferred-questions/:deferredQuestionId`
Purpose:
- fetch one deferred question with its context

Schema mapping:
- `deferred_questions`

#### `PATCH /api/projects/:projectId/deferred-questions/:deferredQuestionId`
Purpose:
- update status, brief response, or resolution metadata

Schema mapping:
- `deferred_questions`

#### `POST /api/projects/:projectId/deferred-questions/:deferredQuestionId/revisit`
Purpose:
- re-open a parked question in the tutor flow

Schema mapping:
- `deferred_questions`
- `learning_sessions`
- `outline_items`

---

## Endpoint map by schema entity

### `users`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### `learning_projects`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `GET /api/projects/:projectId/overview`

### `source_materials`
- `GET /api/projects/:projectId/materials`
- `POST /api/projects/:projectId/materials`
- `GET /api/projects/:projectId/materials/:materialId`
- `PATCH /api/projects/:projectId/materials/:materialId`
- `DELETE /api/projects/:projectId/materials/:materialId`
- `POST /api/projects/:projectId/materials/upload`
- `POST /api/projects/:projectId/materials/base-knowledge`
- `POST /api/projects/:projectId/materials/reweight`

### `outlines`
- `GET /api/projects/:projectId/outlines`
- `POST /api/projects/:projectId/outlines`
- `GET /api/projects/:projectId/outlines/:outlineId`
- `PATCH /api/projects/:projectId/outlines/:outlineId`
- `POST /api/projects/:projectId/outlines/refresh`
- `POST /api/projects/:projectId/outlines/:outlineId/activate`

### `outline_items`
- `GET /api/projects/:projectId/outlines/:outlineId/items`
- `GET /api/projects/:projectId/outlines/:outlineId/items/:itemId`
- `GET /api/projects/:projectId/outline-items/:itemId/questions`
- `GET /api/projects/:projectId/progress/topics/:itemId`

### `questions`
- `GET /api/projects/:projectId/questions`
- `POST /api/projects/:projectId/questions/generate`
- `POST /api/projects/:projectId/questions/generate-next-batch`
- `GET /api/projects/:projectId/questions/:questionId`
- `PATCH /api/projects/:projectId/questions/:questionId`

### `answer_attempts`
- `POST /api/projects/:projectId/questions/:questionId/answers`
- `GET /api/projects/:projectId/questions/:questionId/answers`
- `POST /api/projects/:projectId/answers/evaluate`
- `GET /api/projects/:projectId/answers/history`

### `progress_snapshots`
- `GET /api/projects/:projectId/progress`
- `POST /api/projects/:projectId/progress/refresh`
- `GET /api/projects/:projectId/progress/weak-areas`
- `GET /api/projects/:projectId/progress/topics/:itemId`

### `learning_sessions`
- `GET /api/projects/:projectId/sessions`
- `POST /api/projects/:projectId/sessions`
- `GET /api/projects/:projectId/sessions/:sessionId`
- `PATCH /api/projects/:projectId/sessions/:sessionId`
- `POST /api/projects/:projectId/sessions/:sessionId/resume`
- `POST /api/projects/:projectId/sessions/:sessionId/end`

### `deferred_questions`
- `GET /api/projects/:projectId/deferred-questions`
- `POST /api/projects/:projectId/deferred-questions`
- `GET /api/projects/:projectId/deferred-questions/:deferredQuestionId`
- `PATCH /api/projects/:projectId/deferred-questions/:deferredQuestionId`
- `POST /api/projects/:projectId/deferred-questions/:deferredQuestionId/revisit`

---

## Recommended implementation order from this map
1. auth endpoints
2. project endpoints
3. materials endpoints
4. outline generation + outline item retrieval
5. question generation + retrieval
6. answer submission + evaluation
7. progress endpoints
8. session endpoints
9. deferred-question endpoints

Reason:
- this matches the MVP value chain from setup through learning loop, while leaving tutor-flow additions for slightly later.
