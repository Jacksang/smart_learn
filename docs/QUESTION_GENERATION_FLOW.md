# Question Generation Flow

## Purpose
This document explains the current Smart Learn question-generation flow implemented for D1.4.

It covers:
- the PostgreSQL question schema used by the runtime
- how the first question batch is generated from an outline item
- how the default batch size of 5 works
- how additional batches are generated
- how project-scoped question listing and filtering work
- the API endpoints currently exposed by the backend

This document describes the implementation in `backend/src/questions` and the project router wiring in `backend/src/projects/router.js`.

---

## 1. Data model and runtime shape

Generated questions are stored in the `questions` table defined in:
- `backend/db/schema/001_baseline.sql`

### `questions`

The current D1.4 runtime uses these fields:

| Column | Meaning |
| --- | --- |
| `id` | Question UUID |
| `project_id` | Owning learning project |
| `outline_item_id` | Source outline item used for generation |
| `batch_no` | Batch number within the `(project_id, outline_item_id)` scope |
| `position_in_batch` | Stable per-batch order starting at 1 |
| `question_type` | `multiple_choice`, `short_answer`, or `true_false` |
| `difficulty_level` | `easy`, `medium`, or `hard` |
| `prompt` | Generated learner-facing prompt |
| `options` | JSON options for choice-based questions |
| `correct_answer` | JSON answer payload |
| `explanation` | Generated rationale |
| `generation_source` | Current MVP source marker, `mock_outline_mvp` |
| `status` | Current question status, typically `active` |
| `created_at`, `updated_at` | Timestamps |

### Runtime response shape

Generated and listed questions are returned in the repository-mapped PostgreSQL shape:

```json
{
  "id": "question-1",
  "project_id": "project-1",
  "outline_item_id": "item-1",
  "batch_no": 1,
  "position_in_batch": 1,
  "question_type": "multiple_choice",
  "difficulty_level": "medium",
  "prompt": "Question 1: Which concept best matches Unit 1 > Cells?",
  "options": ["Cells", "Biology", "Biology outline", "Background concept"],
  "correct_answer": { "value": "Cells" },
  "explanation": "Cells is the best match based on: ...",
  "generation_source": "mock_outline_mvp",
  "status": "active",
  "created_at": "2026-04-05T00:00:00.000Z",
  "updated_at": "2026-04-05T00:00:00.000Z"
}
```

---

## 2. First-batch generation flow

The initial generation entrypoint is:
- `POST /api/projects/:projectId/questions/generate`

### Request rules

The controller accepts either camelCase or snake_case inputs:
- `outlineItemId` or `outline_item_id`
- `batchSize` or `batch_size`
- `difficultyLevel` or `difficulty_level`
- `questionTypes` or `question_types`

Required field:
- `outlineItemId`

Defaulting behavior:
- if `batchSize` is omitted, it defaults to `5`
- the first generation route always uses `batchNo = 1`
- if `difficultyLevel` is omitted, the service defaults to `medium`
- if `questionTypes` is omitted, the service defaults to `["multiple_choice"]`

### Controller-to-service flow

Current first-batch flow:

```text
Client
  -> POST /api/projects/:projectId/questions/generate
Questions controller
  -> normalize request fields
  -> validate outlineItemId
  -> default batchSize to 5 when omitted
  -> set batchNo = 1
Questions service
  -> load project in user scope
  -> load current outline for project
  -> load outline_items for the current outline
  -> resolve the requested outline item
  -> derive outline path context
  -> generate deterministic mock question payloads
Questions repository
  -> bulk INSERT generated questions into PostgreSQL
Response
  -> return generated question batch metadata + persisted rows
```

### Context loading rules

`generateQuestionBatch()` depends on the current project state:
1. load the project for the authenticated user
2. load the current outline for that project
3. load all `outline_items` for the outline
4. resolve the requested `outlineItemId`
5. compute the item's outline path by walking parent links

If any required resource is missing, the current implementation returns:
- `404 Learning project not found`
- `404 Current outline not found for project`
- `404 Outline item not found in current outline`

### Current MVP generation behavior

Generation is deterministic and mock-based.

That means:
- no external model call is made
- prompts are derived from the outline path
- explanations are derived from outline item content/title
- multiple question types are supported, but the defaults are intentionally simple for MVP verification

---

## 3. Default 5-question batch behavior

The default batch size constant lives in:
- `backend/src/questions/service.js`

```js
const DEFAULT_BATCH_SIZE = 5;
```

The controller applies this when the request omits `batchSize`.

Implications:
- first-batch generation creates 5 persisted questions by default
- next-batch generation also creates 5 persisted questions by default
- `position_in_batch` is assigned sequentially from `1` to `5`

If `batchSize` is provided, it must be a positive integer.
Otherwise the controller returns:

```json
{
  "message": "batchSize must be a positive integer"
}
```

---

## 4. Next-batch generation flow

The additional batch entrypoint is:
- `POST /api/projects/:projectId/questions/generate-next-batch`

This route reuses the same request normalization and validation as the first-batch route.
The only behavioral difference is how `batchNo` is resolved.

### Next-batch numbering

Before generation, the controller queries the repository for:
- the current max `batch_no` within the `(project_id, outline_item_id)` scope

Then it sets:
- `next batchNo = current max + 1`

Examples:
- no existing questions for that outline item -> next batch is `1`
- existing batches `1` and `2` -> next batch is `3`

### Flow summary

```text
Client
  -> POST /api/projects/:projectId/questions/generate-next-batch
Questions controller
  -> normalize + validate request
  -> default batchSize to 5 when omitted
Questions repository
  -> SELECT MAX(batch_no) for project + outline item
Questions service
  -> reuse the same deterministic generation logic
Questions repository
  -> INSERT next batch with incremented batch_no
Response
  -> return persisted rows for the new batch
```

---

## 5. Project-scoped question listing and filters

Listing entrypoint:
- `GET /api/projects/:projectId/questions`

Supported filters:
- `outlineItemId` or `outline_item_id`
- `batchNo` or `batch_no`
- `status`

### Validation behavior

The controller rejects:
- empty `outlineItemId`
- non-positive or non-integer `batchNo`
- empty `status`

### Ordering behavior

Question listing is stable and deterministic:

```text
ORDER BY batch_no ASC, position_in_batch ASC, created_at ASC, id ASC
```

This ensures:
- earlier batches appear first
- questions are ordered in their generated batch sequence
- ties are stable if timestamps collide

### Single-question retrieval

For API parity, the router also exposes:
- `GET /api/projects/:projectId/questions/:questionId`

That route resolves one question within the authenticated user's project scope.

---

## 6. API endpoints in the D1.4 flow

Mounted via `backend/src/projects/router.js`:

### `POST /api/projects/:projectId/questions/generate`
Generate the first batch for an outline item.

Example request:

```json
{
  "outlineItemId": "item-1"
}
```

Example response:

```json
{
  "message": "Question batch generated",
  "projectId": "project-1",
  "outlineItemId": "item-1",
  "batchNo": 1,
  "batchSize": 5,
  "questions": []
}
```

### `POST /api/projects/:projectId/questions/generate-next-batch`
Generate another batch for the same outline item scope.

Example request:

```json
{
  "outlineItemId": "item-1"
}
```

Example response:

```json
{
  "message": "Question batch generated",
  "projectId": "project-1",
  "outlineItemId": "item-1",
  "batchNo": 2,
  "batchSize": 5,
  "questions": []
}
```

### `GET /api/projects/:projectId/questions`
List questions in project scope, optionally filtered.

Example query:

```text
/api/projects/project-1/questions?outline_item_id=item-1&batch_no=1&status=active
```

Example response:

```json
{
  "questions": []
}
```

### `GET /api/projects/:projectId/questions/:questionId`
Fetch one generated question in project scope.

---

## 7. Verification sources for this document

This document is based on the current implementation and tests in:
- `backend/src/questions/controller.js`
- `backend/src/questions/service.js`
- `backend/src/questions/repository.js`
- `backend/src/questions/controller.test.js`
- `backend/src/questions/repository.test.js`
- `backend/src/questions/service.test.js`
- `backend/src/questions/flow.integration.test.js`
- `backend/src/projects/router.js`
- `docs/API_ENDPOINT_SPEC.md`

---

## 8. Current implementation summary

Today, the question flow supports:
- project-scoped first-batch generation from a selected outline item
- default 5-question generation when batch size is omitted
- additional batch generation with incrementing `batch_no`
- filtered project question listing with stable ordering
- deterministic MVP mock questions derived from the current outline context

Current MVP constraints:
- generation is mock-based, not model-backed
- first-batch generation always starts at `batch_no = 1`
- question ownership is enforced through project ownership
- question generation depends on an existing current outline and a valid outline item
