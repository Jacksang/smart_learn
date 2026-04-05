const db = require('../../config/database');

const DEFERRED_QUESTION_COLUMNS = [
  'id',
  'project_id',
  'session_id',
  'outline_item_id',
  'question_text',
  'defer_reason',
  'status',
  'brief_response',
  'created_at',
  'updated_at',
  'resolved_at',
];

const DEFERRED_QUESTION_SELECT = DEFERRED_QUESTION_COLUMNS.join(', ');
const DEFERRED_QUESTION_SELECT_WITH_ALIAS = (alias) =>
  DEFERRED_QUESTION_COLUMNS.map((column) => `${alias}.${column}`).join(', ');

function mapDeferredQuestionRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    session_id: row.session_id,
    outline_item_id: row.outline_item_id,
    question_text: row.question_text,
    defer_reason: row.defer_reason,
    status: row.status,
    brief_response: row.brief_response,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at,
  };
}

async function listForProjectSessionAndUser({ projectId, sessionId, userId, status }) {
  const clauses = ['dq.project_id = $1', 'p.user_id = $2'];
  const params = [projectId, userId];

  if (sessionId !== undefined) {
    params.push(sessionId);

    if (sessionId === null) {
      clauses.push('dq.session_id IS NULL');
    } else {
      clauses.push(`dq.session_id = $${params.length}`);
    }
  }

  if (status !== undefined) {
    params.push(status);
    clauses.push(`dq.status = $${params.length}`);
  }

  const result = await db.query(
    `SELECT ${DEFERRED_QUESTION_SELECT_WITH_ALIAS('dq')}
     FROM deferred_questions dq
     INNER JOIN learning_projects p ON p.id = dq.project_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY dq.created_at DESC, dq.id DESC`,
    params
  );

  return result.rows.map(mapDeferredQuestionRow);
}

async function createForProjectSessionAndUser({
  projectId,
  sessionId = null,
  userId,
  outlineItemId = null,
  questionText,
  deferReason,
  status = 'deferred',
  briefResponse = null,
  resolvedAt = null,
}) {
  const result = await db.query(
    `WITH owned_session AS (
       SELECT s.id, s.project_id
       FROM learning_sessions s
       INNER JOIN learning_projects p ON p.id = s.project_id
       WHERE s.id = $2 AND s.project_id = $1 AND p.user_id = $3
       LIMIT 1
     )
     INSERT INTO deferred_questions (
       project_id,
       session_id,
       outline_item_id,
       question_text,
       defer_reason,
       status,
       brief_response,
       resolved_at
     )
     SELECT
       $1,
       CASE WHEN $2::uuid IS NULL THEN NULL ELSE os.id END,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9
     FROM (SELECT 1) seed
     LEFT JOIN owned_session os ON TRUE
     WHERE EXISTS (
       SELECT 1
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $3
     )
       AND ($2::uuid IS NULL OR os.id IS NOT NULL)
     RETURNING ${DEFERRED_QUESTION_SELECT}`,
    [
      projectId,
      sessionId,
      userId,
      outlineItemId,
      questionText,
      deferReason,
      status,
      briefResponse,
      resolvedAt,
    ]
  );

  return mapDeferredQuestionRow(result.rows[0]);
}

async function updateStatusForProjectAndUser({
  deferredQuestionId,
  projectId,
  userId,
  status,
  briefResponse,
  resolvedAt,
}) {
  const result = await db.query(
    `UPDATE deferred_questions AS dq
     SET status = $4,
         brief_response = $5,
         resolved_at = $6
     FROM learning_projects AS p
     WHERE dq.id = $1
       AND dq.project_id = $2
       AND p.id = dq.project_id
       AND p.user_id = $3
     RETURNING ${DEFERRED_QUESTION_SELECT_WITH_ALIAS('dq')}`,
    [deferredQuestionId, projectId, userId, status, briefResponse ?? null, resolvedAt ?? null]
  );

  return mapDeferredQuestionRow(result.rows[0]);
}

module.exports = {
  DEFERRED_QUESTION_COLUMNS,
  DEFERRED_QUESTION_SELECT,
  DEFERRED_QUESTION_SELECT_WITH_ALIAS,
  mapDeferredQuestionRow,
  listForProjectSessionAndUser,
  createForProjectSessionAndUser,
  updateStatusForProjectAndUser,
};
