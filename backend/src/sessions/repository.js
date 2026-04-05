const db = require('../../config/database');

const SESSION_COLUMNS = [
  's.id',
  's.project_id',
  's.user_id',
  's.mode',
  's.status',
  's.current_outline_item_id',
  's.started_at',
  's.ended_at',
  's.session_summary',
  's.motivation_state',
  's.created_at',
  's.updated_at',
];

const SESSION_SELECT = SESSION_COLUMNS.join(', ');
const SESSION_MUTABLE_FIELDS = ['mode', 'status', 'current_outline_item_id', 'ended_at', 'session_summary', 'motivation_state'];

function mapSessionRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    mode: row.mode,
    status: row.status,
    currentOutlineItemId: row.current_outline_item_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    sessionSummary: row.session_summary,
    motivationState: row.motivation_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createForProjectAndUser({ projectId, userId, mode, status = 'active', currentOutlineItemId = null, endedAt = null, sessionSummary = null, motivationState = null }) {
  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     )
     INSERT INTO learning_sessions (
       project_id,
       user_id,
       mode,
       status,
       current_outline_item_id,
       ended_at,
       session_summary,
       motivation_state
     )
     SELECT
       op.id,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8::jsonb
     FROM owned_project op
     RETURNING ${SESSION_SELECT}`,
    [
      projectId,
      userId,
      mode,
      status,
      currentOutlineItemId,
      endedAt,
      sessionSummary,
      motivationState === null ? null : JSON.stringify(motivationState),
    ]
  );

  return mapSessionRow(result.rows[0]);
}

async function findActiveByProjectForUser({ projectId, userId, status = 'active' }) {
  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     )
     SELECT ${SESSION_SELECT}
     FROM owned_project op
     INNER JOIN learning_sessions s ON s.project_id = op.id
     WHERE s.user_id = $2 AND s.status = $3
     ORDER BY s.started_at DESC, s.created_at DESC, s.id DESC
     LIMIT 1`,
    [projectId, userId, status]
  );

  return mapSessionRow(result.rows[0]);
}

async function findByIdForProjectAndUser({ sessionId, projectId, userId }) {
  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $2 AND p.user_id = $3
       LIMIT 1
     )
     SELECT ${SESSION_SELECT}
     FROM owned_project op
     INNER JOIN learning_sessions s ON s.project_id = op.id
     WHERE s.id = $1 AND s.user_id = $3
     LIMIT 1`,
    [sessionId, projectId, userId]
  );

  return mapSessionRow(result.rows[0]);
}

async function updateSessionState({ sessionId, projectId, userId, updates = {} }) {
  const assignments = [];
  const params = [sessionId, projectId, userId];

  SESSION_MUTABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      params.push(field === 'motivation_state' && updates[field] !== null
        ? JSON.stringify(updates[field])
        : updates[field]);
      const castSuffix = field === 'motivation_state' ? '::jsonb' : '';
      assignments.push(`${field} = $${params.length}${castSuffix}`);
    }
  });

  if (assignments.length === 0) {
    return findByIdForProjectAndUser({ sessionId, projectId, userId });
  }

  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $2 AND p.user_id = $3
       LIMIT 1
     )
     UPDATE learning_sessions s
     SET ${assignments.join(', ')}
     FROM owned_project op
     WHERE s.id = $1
       AND s.project_id = op.id
       AND s.user_id = $3
     RETURNING ${SESSION_SELECT}`,
    params
  );

  return mapSessionRow(result.rows[0]);
}

module.exports = {
  SESSION_COLUMNS,
  SESSION_SELECT,
  SESSION_MUTABLE_FIELDS,
  mapSessionRow,
  createForProjectAndUser,
  findActiveByProjectForUser,
  findByIdForProjectAndUser,
  updateSessionState,
};
