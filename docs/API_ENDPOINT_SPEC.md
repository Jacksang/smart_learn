# Smart Learn API Endpoint Spec

## Status
Completed checkpoints in this document:
- Map endpoints from schema and product flow
- Define request/response shapes
- Define error handling conventions
- Define MVP vs later endpoints

Remaining checkpoints will extend this document with final delivery notes.

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

## Request and response shape conventions

### Common response envelope
Successful responses should use a predictable envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Notes:
- `data` holds the primary resource or action result.
- `meta` is optional and can include pagination, generation context, or summary fields.
- list endpoints should return arrays inside `data.items` when pagination metadata is needed.

### Common write-response pattern
Create/update action responses should prefer:

```json
{
  "success": true,
  "data": {
    "resource": {}
  },
  "meta": {
    "message": "Human-readable summary"
  }
}
```

### Common list-response pattern
```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

### Common action-response pattern
For generation/evaluation endpoints:

```json
{
  "success": true,
  "data": {
    "result": {}
  },
  "meta": {
    "message": "Action completed"
  }
}
```

---

## Representative request/response shapes by workflow

### Authentication

#### `POST /api/auth/register`
Request:
```json
{
  "email": "student@example.com",
  "password": "strong-password",
  "displayName": "Ava"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "displayName": "Ava",
      "role": "student",
      "status": "active"
    },
    "token": "jwt-or-session-token"
  }
}
```

#### `POST /api/auth/login`
Request:
```json
{
  "email": "student@example.com",
  "password": "strong-password"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "displayName": "Ava"
    },
    "token": "jwt-or-session-token"
  }
}
```

#### `GET /api/auth/me`
Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "displayName": "Ava",
      "role": "student",
      "status": "active"
    }
  }
}
```

### Learning projects

#### `POST /api/projects`
Request:
```json
{
  "title": "AWS Basics",
  "description": "Foundational cloud concepts",
  "subject": "Cloud Computing"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "title": "AWS Basics",
      "description": "Foundational cloud concepts",
      "subject": "Cloud Computing",
      "status": "active",
      "currentMode": null,
      "currentOutlineId": null,
      "createdAt": "2026-04-04T00:00:00Z",
      "updatedAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### `GET /api/projects`
Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "AWS Basics",
        "subject": "Cloud Computing",
        "status": "active",
        "currentMode": "learn",
        "updatedAt": "2026-04-04T00:00:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

#### `GET /api/projects/:projectId/overview`
Response:
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "title": "AWS Basics",
      "status": "active",
      "currentMode": "review"
    },
    "activeOutline": {
      "id": "uuid",
      "versionNo": 2,
      "status": "active"
    },
    "latestProgress": {
      "progressState": "improving",
      "completionPercent": 42.5,
      "masteryScore": 61.0
    },
    "activeSession": {
      "id": "uuid",
      "mode": "review",
      "status": "active"
    }
  }
}
```

### Source materials

#### `POST /api/projects/:projectId/materials`
Request:
```json
{
  "sourceKind": "pasted_text",
  "materialType": "text",
  "title": "Cloud notes",
  "rawText": "AWS offers compute, storage, and networking services.",
  "weight": 1.25
}
```

Response:
```json
{
  "success": true,
  "data": {
    "material": {
      "id": "uuid",
      "projectId": "uuid",
      "sourceKind": "pasted_text",
      "materialType": "text",
      "title": "Cloud notes",
      "weight": 1.25,
      "isActive": true,
      "createdAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### `POST /api/projects/:projectId/materials/upload`
Request shape:
- multipart form-data
- fields:
  - `file`
  - optional `title`
  - optional `weight`

Response:
```json
{
  "success": true,
  "data": {
    "material": {
      "id": "uuid",
      "projectId": "uuid",
      "sourceKind": "user_upload",
      "materialType": "pdf",
      "originalFileName": "aws-intro.pdf",
      "mimeType": "application/pdf",
      "storagePath": "/uploads/aws-intro.pdf",
      "isActive": true
    }
  }
}
```

#### `POST /api/projects/:projectId/materials/base-knowledge`
Request:
```json
{
  "title": "AWS Basics Base Knowledge",
  "subject": "Cloud Computing",
  "reason": "insufficient_user_material"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "material": {
      "id": "uuid",
      "sourceKind": "system_base_knowledge",
      "materialType": "base_knowledge",
      "title": "AWS Basics Base Knowledge",
      "weight": 0.75
    }
  },
  "meta": {
    "message": "Base knowledge material added"
  }
}
```

### Outlines and outline items

#### `POST /api/projects/:projectId/outlines`
Request:
```json
{
  "sourceMaterialIds": ["uuid-1", "uuid-2"],
  "generationSource": "mock_ai"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "outline": {
      "id": "uuid",
      "projectId": "uuid",
      "versionNo": 1,
      "status": "active",
      "summary": "An AWS foundations outline"
    },
    "items": [
      {
        "id": "uuid",
        "title": "Core AWS Services",
        "parentItemId": null,
        "sortOrder": 1,
        "depthLevel": 0
      }
    ]
  }
}
```

#### `POST /api/projects/:projectId/outlines/refresh`
Request:
```json
{
  "reason": "materials_changed"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "outline": {
      "id": "uuid",
      "versionNo": 2,
      "status": "active"
    },
    "supersededOutlineId": "uuid-old"
  },
  "meta": {
    "message": "Outline refreshed from active materials"
  }
}
```

#### `GET /api/projects/:projectId/outlines/:outlineId/items`
Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Core AWS Services",
        "summary": "Compute, storage, and networking basics",
        "parentItemId": null,
        "sortOrder": 1,
        "depthLevel": 0,
        "keyPoints": ["EC2", "S3", "VPC"]
      }
    ]
  }
}
```

### Questions and batches

#### `POST /api/projects/:projectId/questions/generate`
Request:
```json
{
  "outlineItemId": "uuid-topic",
  "batchSize": 5,
  "difficultyLevel": "medium",
  "questionTypes": ["multiple_choice", "short_answer"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "batchNo": 1,
        "positionInBatch": 1,
        "questionType": "multiple_choice",
        "difficultyLevel": "medium",
        "prompt": "Which AWS service provides object storage?",
        "options": ["EC2", "S3", "IAM", "Route 53"],
        "status": "active"
      }
    ]
  },
  "meta": {
    "batchSize": 5,
    "generatedCount": 5
  }
}
```

#### `POST /api/projects/:projectId/questions/generate-next-batch`
Request:
```json
{
  "outlineItemId": "uuid-topic",
  "batchSize": 5
}
```

Response:
```json
{
  "success": true,
  "data": {
    "questions": []
  },
  "meta": {
    "batchNo": 2,
    "generatedCount": 5
  }
}
```

#### `GET /api/projects/:projectId/questions`
Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "outlineItemId": "uuid-topic",
        "batchNo": 1,
        "positionInBatch": 1,
        "questionType": "multiple_choice",
        "difficultyLevel": "medium",
        "prompt": "Which AWS service provides object storage?",
        "status": "active"
      }
    ]
  }
}
```

### Answers and evaluation

#### `POST /api/projects/:projectId/questions/:questionId/answers`
Request:
```json
{
  "sessionId": "uuid-session",
  "userAnswer": {
    "selectedOption": "S3"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "answerAttempt": {
      "id": "uuid",
      "questionId": "uuid",
      "sessionId": "uuid-session",
      "userAnswer": {
        "selectedOption": "S3"
      },
      "isCorrect": true,
      "score": 1,
      "feedbackText": "Correct — S3 is AWS object storage.",
      "attemptNo": 1,
      "answeredAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### `POST /api/projects/:projectId/answers/evaluate`
Request:
```json
{
  "answerAttemptId": "uuid"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "answerAttemptId": "uuid",
      "isCorrect": true,
      "score": 1,
      "feedbackText": "Correct — S3 is AWS object storage.",
      "explanation": "S3 stores objects, while EC2 runs virtual machines."
    }
  }
}
```

### Progress tracking

#### `POST /api/projects/:projectId/progress/refresh`
Request:
```json
{
  "snapshotType": "project",
  "trigger": "answer_submitted"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "progressSnapshot": {
      "id": "uuid",
      "snapshotType": "project",
      "completionPercent": 42.5,
      "masteryScore": 61,
      "progressState": "improving",
      "weakAreas": ["VPC networking"],
      "strengthAreas": ["Storage basics"],
      "summaryText": "Strong progress on storage. Networking needs more review."
    }
  }
}
```

#### `GET /api/projects/:projectId/progress/weak-areas`
Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "outlineItemId": "uuid-topic",
        "title": "VPC networking",
        "progressState": "needs_reinforcement",
        "masteryScore": 35
      }
    ]
  }
}
```

### Sessions and deferred questions

#### `POST /api/projects/:projectId/sessions`
Request:
```json
{
  "mode": "learn",
  "currentOutlineItemId": "uuid-topic"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "projectId": "uuid",
      "mode": "learn",
      "status": "active",
      "currentOutlineItemId": "uuid-topic",
      "startedAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### `POST /api/projects/:projectId/deferred-questions`
Request:
```json
{
  "sessionId": "uuid-session",
  "outlineItemId": "uuid-topic",
  "questionText": "Why would I choose a private subnet here?",
  "deferReason": "needs_later_context"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "deferredQuestion": {
      "id": "uuid",
      "status": "deferred",
      "questionText": "Why would I choose a private subnet here?",
      "deferReason": "needs_later_context",
      "createdAt": "2026-04-04T00:00:00Z"
    }
  }
}
```

#### `POST /api/projects/:projectId/deferred-questions/:deferredQuestionId/revisit`
Request:
```json
{
  "sessionId": "uuid-session"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "deferredQuestion": {
      "id": "uuid",
      "status": "revisited"
    }
  },
  "meta": {
    "message": "Deferred question loaded back into the tutor flow"
  }
}
```

---

## Field naming guidance
- JSON requests/responses should use `camelCase`.
- Database tables/columns can remain `snake_case` internally.
- IDs should be exposed consistently as string UUIDs.
- Timestamps should be ISO 8601 UTC strings.
- Nullable fields should return `null` instead of being omitted when clarity matters to clients.

---

## Error handling conventions

### Standard error envelope
All non-2xx responses should use a predictable error body:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "meta": {
    "requestId": "optional-request-id"
  }
}
```

Notes:
- `code` should be stable and machine-readable.
- `message` should be concise and safe to show in client UI.
- `details` should include field-level issues or action context when helpful.
- `requestId` is optional but strongly recommended for tracing.

### Recommended HTTP status mapping
- `400 Bad Request` -> malformed JSON, invalid action payload, unsupported filter combinations
- `401 Unauthorized` -> missing/invalid auth credentials
- `403 Forbidden` -> authenticated but not allowed to access the resource
- `404 Not Found` -> project/material/question/session resource does not exist or is not visible to caller
- `409 Conflict` -> duplicate or state-conflict actions, such as activating an incompatible outline version
- `422 Unprocessable Entity` -> semantic validation failure, such as invalid enum value or impossible batch size
- `429 Too Many Requests` -> future rate limiting for generation-heavy endpoints
- `500 Internal Server Error` -> unexpected server failure
- `503 Service Unavailable` -> generation/extraction dependency temporarily unavailable

### Error code catalog

#### Authentication errors
- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `TOKEN_EXPIRED`
- `TOKEN_INVALID`

#### Validation and payload errors
- `VALIDATION_ERROR`
- `INVALID_ENUM_VALUE`
- `MISSING_REQUIRED_FIELD`
- `INVALID_FILE_TYPE`
- `INVALID_BATCH_SIZE`
- `UNSUPPORTED_OPERATION`

#### Resource and ownership errors
- `PROJECT_NOT_FOUND`
- `MATERIAL_NOT_FOUND`
- `OUTLINE_NOT_FOUND`
- `OUTLINE_ITEM_NOT_FOUND`
- `QUESTION_NOT_FOUND`
- `ANSWER_ATTEMPT_NOT_FOUND`
- `SESSION_NOT_FOUND`
- `DEFERRED_QUESTION_NOT_FOUND`
- `RESOURCE_ACCESS_DENIED`

#### Workflow/state errors
- `NO_ACTIVE_MATERIALS`
- `OUTLINE_GENERATION_FAILED`
- `OUTLINE_REFRESH_BLOCKED`
- `QUESTION_GENERATION_FAILED`
- `ANSWER_EVALUATION_FAILED`
- `PROGRESS_REFRESH_FAILED`
- `SESSION_ALREADY_COMPLETED`
- `SESSION_NOT_RESUMABLE`
- `DEFERRED_QUESTION_NOT_ACTIVE`

#### Infrastructure/dependency errors
- `FILE_UPLOAD_FAILED`
- `TEXT_EXTRACTION_FAILED`
- `OCR_UNAVAILABLE`
- `AI_PROVIDER_UNAVAILABLE`
- `DATABASE_ERROR`
- `INTERNAL_ERROR`

### Validation detail shape
When returning field-level issues, prefer:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "batchSize",
        "issue": "must be between 1 and 20"
      }
    ]
  }
}
```

### Representative error examples

#### Invalid login
Status: `401 Unauthorized`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

#### Missing project
Status: `404 Not Found`
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Learning project not found"
  }
}
```

#### Invalid question generation payload
Status: `422 Unprocessable Entity`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_BATCH_SIZE",
    "message": "Question batch size is invalid",
    "details": [
      {
        "field": "batchSize",
        "issue": "must be between 1 and 20"
      }
    ]
  }
}
```

#### Outline generation with no active materials
Status: `409 Conflict`
```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_MATERIALS",
    "message": "At least one active material is required before generating an outline"
  }
}
```

#### Dependency outage during extraction
Status: `503 Service Unavailable`
```json
{
  "success": false,
  "error": {
    "code": "TEXT_EXTRACTION_FAILED",
    "message": "Text extraction is temporarily unavailable"
  }
}
```

### Logging and security notes
- Never return stack traces, SQL fragments, tokens, or secrets in API responses.
- Server logs should retain the full internal exception and request context.
- Ownership checks should prefer `404` or generic `403` behavior consistently to avoid resource enumeration leaks.
- Generation and upload endpoints should log enough context to reproduce failures without leaking user content into client-facing error messages.

## MVP vs later endpoint split

### MVP endpoints
These should be implemented first because they cover the core loop: create project -> add material -> generate outline -> generate questions -> submit answers -> inspect progress.

#### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

#### Projects
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `GET /api/projects/:projectId/overview`

#### Materials
- `GET /api/projects/:projectId/materials`
- `POST /api/projects/:projectId/materials`
- `GET /api/projects/:projectId/materials/:materialId`
- `PATCH /api/projects/:projectId/materials/:materialId`
- `DELETE /api/projects/:projectId/materials/:materialId`
- `POST /api/projects/:projectId/materials/upload`
- `POST /api/projects/:projectId/materials/base-knowledge`
- `POST /api/projects/:projectId/materials/reweight`

#### Outlines
- `GET /api/projects/:projectId/outlines`
- `POST /api/projects/:projectId/outlines`
- `GET /api/projects/:projectId/outlines/:outlineId`
- `POST /api/projects/:projectId/outlines/refresh`
- `POST /api/projects/:projectId/outlines/:outlineId/activate`
- `GET /api/projects/:projectId/outlines/:outlineId/items`
- `GET /api/projects/:projectId/outlines/:outlineId/items/:itemId`

#### Questions and answers
- `GET /api/projects/:projectId/questions`
- `POST /api/projects/:projectId/questions/generate`
- `POST /api/projects/:projectId/questions/generate-next-batch`
- `GET /api/projects/:projectId/questions/:questionId`
- `POST /api/projects/:projectId/questions/:questionId/answers`
- `GET /api/projects/:projectId/questions/:questionId/answers`
- `POST /api/projects/:projectId/answers/evaluate`
- `GET /api/projects/:projectId/answers/history`

#### Progress
- `GET /api/projects/:projectId/progress`
- `POST /api/projects/:projectId/progress/refresh`
- `GET /api/projects/:projectId/progress/topics/:itemId`
- `GET /api/projects/:projectId/progress/weak-areas`

### Near-term post-MVP endpoints
These support the intended tutor experience, but the product can still function without them in the first shipped backend slice.

#### Sessions
- `GET /api/projects/:projectId/sessions`
- `POST /api/projects/:projectId/sessions`
- `GET /api/projects/:projectId/sessions/:sessionId`
- `PATCH /api/projects/:projectId/sessions/:sessionId`
- `POST /api/projects/:projectId/sessions/:sessionId/resume`
- `POST /api/projects/:projectId/sessions/:sessionId/end`

#### Deferred questions
- `GET /api/projects/:projectId/deferred-questions`
- `POST /api/projects/:projectId/deferred-questions`
- `GET /api/projects/:projectId/deferred-questions/:deferredQuestionId`
- `PATCH /api/projects/:projectId/deferred-questions/:deferredQuestionId`
- `POST /api/projects/:projectId/deferred-questions/:deferredQuestionId/revisit`

### Later/admin-oriented endpoints
These are useful, but not necessary for the first learning workflow release.
- `DELETE /api/projects/:projectId` if archival alone is enough in MVP
- `PATCH /api/projects/:projectId/outlines/:outlineId` for manual outline metadata management
- `PATCH /api/projects/:projectId/questions/:questionId` for manual correction or moderation flows
- richer export/reporting endpoints not yet listed in this spec
- parent/teacher/admin management endpoints not yet listed in this spec

### Why this split works
- The MVP list is enough to prove the product loop and validate the database design.
- Session and deferred-question endpoints depend on more nuanced state-machine behavior and can trail slightly behind.
- Manual moderation/admin endpoints are nice-to-have once the core learner path is stable.

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
