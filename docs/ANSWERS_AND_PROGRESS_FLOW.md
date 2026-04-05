# Smart Learn Answers and Progress Flow

## Purpose
This document captures the verified D1.5 MVP lifecycle for answer submission, answer history, explicit re-evaluation, progress refresh, and weak-area retrieval.

It is intended to match the implemented API behavior in `backend/src/answers/*` and `backend/src/progress/*`, plus the D1.5 integration evidence added in:
- `backend/src/answers/flow.integration.test.js`
- `backend/src/progress/flow.integration.test.js`

## Verified D1.5 lifecycle

### 1. Submit an answer attempt
Endpoint:
- `POST /api/projects/:projectId/questions/:questionId/answers`

What happens:
- The route is project-scoped and protected.
- The controller validates `projectId` and `questionId` from the route.
- Optional body `projectId` / `questionId` must match the route values if provided.
- `userAnswer` is required.
- `sessionId` is optional for MVP and may be `null`.
- The question must belong to the target project and current user.
- The answer is evaluated immediately with deterministic MVP logic from `backend/src/answers/service.js`.
- A new row is inserted into `answer_attempts` with:
  - `question_id`
  - `project_id`
  - `session_id`
  - `user_answer`
  - `is_correct`
  - `score`
  - `feedback_text`
  - `attempt_no`
  - `answered_at`

Response shape:
- `201` with `data.answerAttempt`
- API response fields are camelCase, even though persistence stays snake_case internally.

### 2. Read persisted answer history
Endpoints:
- `GET /api/projects/:projectId/questions/:questionId/answers`
- `GET /api/projects/:projectId/answers/history`

What happens:
- Both routes read previously stored rows from `answer_attempts`.
- Question-level history is scoped to one `(projectId, questionId)` pair.
- Project-level history returns recent attempts across the whole project.
- History rows include linked question metadata needed by clients:
  - `question.prompt`
  - `question.question_type`
  - `question.outline_item_id`
- Ordering is newest-first.

Persisted source of truth:
- `answer_attempts`

### 3. Re-evaluate a stored attempt
Endpoint:
- `POST /api/projects/:projectId/answers/evaluate`

Request contract:
- Body must include `answerAttemptId` (or `answer_attempt_id`).

What happens:
- The controller loads the stored attempt and its joined question context through `findAttemptWithQuestionContextForProjectAndUser()`.
- Re-evaluation uses persisted data, not client resubmission:
  - stored `answer_attempts.user_answer`
  - joined `questions.question_type`
  - joined `questions.correct_answer`
  - joined `questions.explanation`
- The shared deterministic evaluator is reused, so explicit evaluation stays aligned with submission-time scoring.

Persisted source of truth:
- `answer_attempts` for the learner response
- `questions` for evaluation context

Important MVP behavior:
- This endpoint recomputes the evaluation response for a stored attempt.
- It does not create a new `answer_attempts` row.

### 4. Refresh project and topic progress snapshots
Endpoint:
- `POST /api/projects/:projectId/progress/refresh`

What happens:
- The route is project-scoped and protected.
- The controller loads owned aggregate data derived from existing answers and questions.
- `backend/src/progress/repository.js` builds aggregates from:
  - `answer_attempts`
  - `questions`
  - `outline_items` context via question-to-outline mapping
- `backend/src/progress/service.js` converts those aggregates into:
  - one project snapshot
  - zero or more topic snapshots keyed by `outline_item_id`
- The controller persists those computed snapshots into `progress_snapshots` by appending new rows.

Persisted source of truth after refresh:
- `progress_snapshots`

Persisted snapshot coverage:
- Project snapshot rows use `outline_item_id = NULL`
- Topic snapshot rows use `outline_item_id = <topic id>`
- Stored fields include:
  - `snapshot_type`
  - `completion_percent`
  - `mastery_score`
  - `progress_state`
  - `weak_areas`
  - `strength_areas`
  - `summary_text`

### 5. Read persisted progress surfaces
Endpoints:
- `GET /api/projects/:projectId/progress`
- `GET /api/projects/:projectId/progress/topics/:itemId`
- `GET /api/projects/:projectId/progress/weak-areas`

What happens:
- These routes read the latest persisted snapshot data instead of recalculating progress inline.
- `GET /progress` returns the latest project-level snapshot.
- `GET /progress/topics/:itemId` returns the latest topic snapshot for that outline item.
- `GET /progress/weak-areas` returns `weakAreas` and `summaryText` from the latest project-level snapshot.

Persisted source of truth:
- `progress_snapshots`

## End-to-end endpoint sequence
The verified D1.5 sequence is:

1. `POST /api/projects/:projectId/questions/:questionId/answers`
2. `GET /api/projects/:projectId/questions/:questionId/answers`
3. `GET /api/projects/:projectId/answers/history`
4. `POST /api/projects/:projectId/answers/evaluate`
5. `POST /api/projects/:projectId/progress/refresh`
6. `GET /api/projects/:projectId/progress`
7. `GET /api/projects/:projectId/progress/topics/:itemId`
8. `GET /api/projects/:projectId/progress/weak-areas`

## Data lifecycle summary

### `answer_attempts`
`answer_attempts` is the persisted source for learner response activity.

It is used to:
- store every submitted answer attempt
- provide question-level answer history
- provide project-level recent answer history
- provide stored answer content for explicit re-evaluation
- drive progress aggregate calculations during refresh

### `progress_snapshots`
`progress_snapshots` is the persisted source for progress retrieval surfaces.

It is used to:
- store the latest computed project summary snapshots over time
- store per-topic progress snapshots keyed by `outline_item_id`
- back the project progress endpoint
- back the topic progress endpoint
- back weak-area retrieval through the latest project snapshot

## MVP limitations and current heuristics

### Deterministic answer scoring only
For MVP, scoring is intentionally simple and deterministic:
- `multiple_choice`: normalized text equality
- `true_false`: normalized boolean equality
- `short_answer`: normalized text equality plus optional aliases from `correct_answer.aliases`

Current scoring behavior:
- correct = `100`
- incorrect = `0`
- feedback is simple text (`Correct` or `Incorrect. Expected: ...`)

This means D1.5 does not yet support:
- partial credit
- semantic grading
- LLM-based freeform evaluation
- rubric-based scoring

### Heuristic weak-area classification
Weak/strength classification is also MVP-only and deterministic:
- `mastery_score` is derived from average score plus recent correctness trend
- `progress_state` is threshold-based (`not_started`, `struggling`, `in_progress`, `strong`, `mastered`)
- weak areas come from topic snapshots with `mastery_score < 60`
- strength areas come from topic snapshots with `mastery_score >= 80`

This means D1.5 does not yet support:
- adaptive mastery models
- spaced repetition scheduling
- confidence-aware scoring
- richer tutoring recommendations beyond snapshot summaries

### Refresh-first progress model
Progress retrieval endpoints currently read persisted snapshots only.

Implication:
- new answer activity does not automatically appear in progress retrieval until `POST /api/projects/:projectId/progress/refresh` runs again

This is intentional for MVP because it keeps retrieval deterministic and makes the persisted snapshot boundary explicit.

## Alignment notes
This doc is aligned to the current implementation, not an aspirational future contract.

In particular:
- explicit evaluation currently works by `answerAttemptId`
- explicit evaluation reuses stored answer/question context and does not create new attempts
- weak-area retrieval reads the latest persisted project snapshot
- topic progress depends on questions being mapped to `outline_item_id`
- progress snapshot writes are append-only in the current repository implementation
