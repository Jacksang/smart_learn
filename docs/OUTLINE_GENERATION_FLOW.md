# Outline Generation Flow

## Purpose
This document explains the current Smart Learn outline generation flow implemented for D1.3.

It covers:
- the PostgreSQL schema used for outlines
- how outline creation works
- how outline refresh is triggered when source materials change
- the API endpoints currently exposed by the backend
- example requests and responses

This document describes the current implementation in `backend/src/outline` and the material-triggered refresh path in `backend/src/materials/controller.js`.

---

## 1. Data model and schema

Outline data is stored in two normalized tables:
- `outlines`
- `outline_items`

The schema is defined in:
- `backend/db/schema/002_outline_tables.sql`

### `outlines`

`outlines` stores the metadata for one outline record attached to a learning project.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `UUID` | Primary key for the outline |
| `project_id` | `UUID` | Owning learning project |
| `title` | `VARCHAR(255)` | Human-readable outline title |
| `status` | `VARCHAR(50)` | Current outline state, currently `draft` or `published` |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Last update timestamp |

Key constraints and behavior:
- `project_id` references `learning_projects(id)` with `ON DELETE CASCADE`
- `status` is constrained to `draft` or `published`
- `updated_at` is maintained by the `outlines_set_updated_at` trigger
- `learning_projects.current_outline_id` can point at the active/current outline

### `outline_items`

`outline_items` stores the topic tree for an outline as normalized rows.

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `UUID` | Primary key for the item |
| `outline_id` | `UUID` | Parent outline |
| `parent_item_id` | `UUID` | Parent outline item for nested hierarchy; `NULL` for root items |
| `level` | `INTEGER` | Logical level supplied for the item |
| `title` | `VARCHAR(255)` | Item title |
| `content` | `TEXT` | Optional summary/content for the item |
| `order_index` | `INTEGER` | Global ordering used for stable retrieval |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |

Key constraints and behavior:
- `outline_id` references `outlines(id)` with `ON DELETE CASCADE`
- `parent_item_id` self-references `outline_items(id)` with `ON DELETE CASCADE`
- `level > 0`
- `order_index >= 0`
- index `idx_outline_items_outline_id_order_index` supports ordered retrieval

### Why two tables are used

The implementation stores one outline header row and many outline item rows instead of one JSON blob.

That gives the backend:
- project-scoped ownership through `outlines.project_id`
- normalized hierarchy with parent-child relationships
- stable ordering through `order_index`
- simpler joins from future question/progress/session tables to individual outline items

---

## 2. Runtime shape used by the service layer

### Create payload shape

`POST /api/outline` accepts a nested item tree, then the service flattens it before insert.

Input shape:

```json
{
  "projectId": "project-uuid",
  "title": "Biology outline",
  "status": "draft",
  "items": [
    {
      "title": "Unit 1",
      "level": 1,
      "content": null,
      "children": [
        {
          "title": "Cells",
          "level": 2,
          "content": "Basic structure"
        }
      ]
    }
  ]
}
```

Validation rules implemented in `backend/src/outline/service.js`:
- `projectId` is required and must be a non-empty string
- `title` is required and must be a non-empty string
- `status` must be `draft` or `published` if provided
- `items` must be an array if provided
- every item must have a non-empty `title`
- `level` must be one of `1, 2, 3, 4, 5` if provided
- `orderIndex` must be a non-negative integer if provided
- `content` must be a string or `null` if provided
- `children` must be an array if provided

### Flattened persistence shape

Before insert, nested items are transformed into flat rows with temporary client-side linkage keys:

```json
[
  {
    "clientKey": "item-1",
    "parentClientKey": null,
    "level": 1,
    "title": "Unit 1",
    "content": null,
    "orderIndex": 0
  },
  {
    "clientKey": "item-2",
    "parentClientKey": "item-1",
    "level": 2,
    "title": "Cells",
    "content": "Basic structure",
    "orderIndex": 1
  }
]
```

The repository then replaces those temporary keys with generated UUIDs and inserts `outline_items` rows with resolved `parent_item_id` values.

### Retrieval shape

When an outline is fetched, the service reconstructs the nested tree from flat `outline_items` rows and returns this shape:

```json
{
  "id": "outline-uuid",
  "project_id": "project-uuid",
  "title": "Biology outline",
  "status": "draft",
  "created_at": "2026-04-04T00:00:00.000Z",
  "updated_at": "2026-04-04T00:00:00.000Z",
  "outline_items": [
    {
      "id": "item-1",
      "outline_id": "outline-uuid",
      "parent_item_id": null,
      "level": 1,
      "title": "Unit 1",
      "content": null,
      "order_index": 0,
      "children": [
        {
          "id": "item-2",
          "outline_id": "outline-uuid",
          "parent_item_id": "item-1",
          "level": 2,
          "title": "Cells",
          "content": "Basic structure",
          "order_index": 1,
          "children": []
        }
      ]
    }
  ]
}
```

---

## 3. Outline creation flow

Current creation flow:

1. Client sends `POST /api/outline`
2. `backend/src/outline/controller.js` normalizes `projectId` / `project_id`
3. `prepareOutlineCreateInput()` validates the payload
4. `createOutline()` trims fields and flattens nested items
5. `backend/src/outline/repository.js#createOutlineForUser()`
   - verifies the project belongs to the authenticated user
   - inserts one row into `outlines`
   - inserts zero or more rows into `outline_items`
   - wraps both operations in a transaction
6. API returns the created outline metadata

### Creation flow summary

```text
Client
  -> POST /api/outline
Controller
  -> normalize request fields
Service
  -> validate + flatten nested items
Repository
  -> verify project ownership
  -> INSERT outline
  -> INSERT outline_items
Response
  -> created outline metadata
```

---

## 4. Refresh trigger flow on material change

There is no standalone refresh route in the current router.

Instead, outline refresh is triggered automatically by material writes in `backend/src/materials/controller.js`.

### Current refresh triggers

Refresh is attempted after:
- `createProjectMaterial()`
- `createBaseKnowledgeMaterial()`
- `updateMaterial()`

Each of those controllers calls:

```js
await refreshOutline({
  projectId: material.project_id,
  userId: req.user.id,
  trigger: 'material_created' | 'material_updated',
  materialId: material.id,
});
```

### Current refresh behavior

`refreshOutline()` in `backend/src/outline/service.js` does the following:

1. verifies the project exists for the current user
2. loads the current outline for that project
3. loads the project's materials
4. builds a new top-level outline item list from active materials
5. replaces existing `outline_items` for the current outline
6. updates the outline status back to `draft`
7. updates the outline `updated_at` timestamp

### How material rows become outline rows

The current MVP logic uses one top-level outline item per active material.

For each active material:
- title is chosen from the first non-empty value among:
  - `title`
  - `original_file_name`
  - `originalFileName`
  - `material_type`
  - `materialType`
  - `source_kind`
  - `sourceKind`
  - fallback `Material N`
- content is chosen from the first non-empty value among:
  - `extracted_text`
  - `extractedText`
  - `raw_text`
  - `rawText`
- content is trimmed to 500 characters
- generated items are stored at `level: 1`

### Refresh trigger diagram

```text
POST/PATCH materials endpoint
  -> material row created or updated
  -> materials controller calls refreshOutline()
    -> verify project ownership
    -> load current outline
    -> load current project materials
    -> derive top-level outline items from active materials
    -> delete existing outline_items for the outline
    -> insert regenerated outline_items
    -> update outline status = draft
  -> materials response returns to caller
```

### Important current limitation

Refresh only runs if the project already has a current/latest outline.
If no outline exists yet, `refreshOutline()` returns `null` and does not create one.

That means the current flow is:
- create outline first
- later material changes refresh the existing outline

---

## 5. API endpoints involved in the flow

The current outline router is defined in `backend/src/outline/router.js`.

### `GET /api/outline`
List outlines visible to the authenticated user.

Optional query:
- `projectId` or `project_id`

Response:

```json
{
  "outlines": [
    {
      "id": "outline-1",
      "project_id": "project-1",
      "title": "Biology outline",
      "status": "draft",
      "created_at": "2026-04-04T00:00:00.000Z",
      "updated_at": "2026-04-04T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/outline/project/:projectId`
Fetch the current project outline, including nested `outline_items`.

Response:

```json
{
  "outline": {
    "id": "outline-1",
    "project_id": "project-1",
    "title": "Biology outline",
    "status": "draft",
    "outline_items": []
  }
}
```

### `GET /api/outline/:id`
Fetch one outline by outline ID, including nested `outline_items`.

### `POST /api/outline`
Create a new outline for a project.

Request body:

```json
{
  "projectId": "project-1",
  "title": "Biology outline",
  "status": "draft",
  "items": [
    {
      "title": "Unit 1",
      "children": [
        {
          "title": "Cells",
          "content": "Basic structure"
        }
      ]
    }
  ]
}
```

Success response:

```json
{
  "message": "Outline created",
  "outline": {
    "id": "outline-1",
    "project_id": "project-1",
    "title": "Biology outline",
    "status": "draft",
    "created_at": "2026-04-04T00:00:00.000Z",
    "updated_at": "2026-04-04T00:00:00.000Z"
  }
}
```

Validation error response:

```json
{
  "message": "Invalid request payload",
  "errors": [
    "projectId is required and must be a non-empty string"
  ]
}
```

### `POST /api/outline/upload`
Upload a file, parse it, and create an outline.

Notes:
- accepts multipart form-data with file field `outline`
- parser output is mapped into the same outline creation service
- resulting create flow is the same as `POST /api/outline`

### Material endpoints that trigger refresh

Defined outside the outline router but part of the outline flow:
- `POST /api/projects/:projectId/materials`
- `POST /api/projects/:projectId/materials/base-knowledge`
- `PATCH /api/projects/:projectId/materials/:materialId`

These endpoints do not return the refreshed outline directly. They return the material response after the refresh attempt has completed.

---

## 6. Usage examples

### Example A: Create an outline directly

```bash
curl -X POST http://127.0.0.1:3001/api/outline \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-1",
    "title": "Biology outline",
    "status": "draft",
    "items": [
      {
        "title": "Unit 1",
        "level": 1,
        "children": [
          {
            "title": "Cells",
            "level": 2,
            "content": "Basic structure"
          }
        ]
      }
    ]
  }'
```

### Example B: Fetch the current outline for a project

```bash
curl http://127.0.0.1:3001/api/outline/project/project-1 \
  -H "Authorization: Bearer <token>"
```

### Example C: Create material and let refresh run automatically

```bash
curl -X POST http://127.0.0.1:3001/api/projects/project-1/materials \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceKind": "upload",
    "materialType": "pdf",
    "title": "Chapter 1 notes",
    "rawText": "Cells are the basic structural and functional unit of life."
  }'
```

What happens next:
- the material record is created
- `refreshOutline()` runs automatically
- the current outline's items are regenerated from active materials
- the outline remains the same outline record, but its `outline_items` are replaced
- the outline status is set to `draft`

### Example D: Update material and trigger another refresh

```bash
curl -X PATCH http://127.0.0.1:3001/api/projects/project-1/materials/material-1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated notes",
    "extractedText": "Fresh summary"
  }'
```

Expected outcome:
- material is updated
- current project outline is refreshed
- top-level outline items reflect the latest active material set

---

## 7. Verification sources for this document

This document is based on the current implementation and tests in:
- `backend/db/schema/001_baseline.sql`
- `backend/db/schema/002_outline_tables.sql`
- `backend/src/outline/router.js`
- `backend/src/outline/controller.js`
- `backend/src/outline/service.js`
- `backend/src/outline/repository.js`
- `backend/src/materials/controller.js`
- `backend/src/outline/flow.integration.test.js`
- `backend/src/outline/controller.test.js`
- `backend/src/materials/controller.test.js`

---

## 8. Current implementation summary

Today, the outline flow supports:
- project-scoped outline creation
- normalized storage in `outlines` and `outline_items`
- retrieval of nested outline trees
- automatic outline refresh when materials are created or updated

Current MVP constraints:
- refresh modifies the current outline instead of creating a new version
- refresh generates one top-level item per active material
- there is no standalone refresh endpoint in the current router
- refresh requires an existing outline to already be present
