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

function mapSessionRowExtended(row) {
  if (!row) {
    return null;
  }

  return {
    ...mapSessionRow(row),
    currentQuestionId: row.current_question_id,
    progress: row.progress,
    pausedAt: row.paused_at,
    currentMode: row.current_mode,
    pauseReason: row.pause_reason,
    sessionDuration: row.session_duration,
    lastProgressUpdate: row.last_progress_update,
    metadata: row.metadata,
  };
}

async function createProgressSnapshot(sessionId, data) {
  const result = await db.query(
    `INSERT INTO session_progress_snapshots (
       session_id, progress, current_outline_item_id, current_question_id,
       questions_answered, correct_answers, time_spent, mood, notes, data
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
     RETURNING *`,
    [
      sessionId,
      data.progress,
      data.currentOutlineItemId ?? null,
      data.currentQuestionId ?? null,
      data.questionsAnswered ?? null,
      data.correctAnswers ?? null,
      data.timeSpent ?? null,
      data.mood ?? null,
      data.notes ?? null,
      data.data ? JSON.stringify(data.data) : null,
    ]
  );

  return result.rows[0] || null;
}

async function getProgressSnapshots(sessionId, limit = 20) {
  const result = await db.query(
    `SELECT *
     FROM session_progress_snapshots
     WHERE session_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [sessionId, limit]
  );

  return result.rows;
}

async function upsertSessionSummary(sessionId, summaryData) {
  const result = await db.query(
    `INSERT INTO session_summaries (
       session_id, title, summary, insights, weak_areas, strengths,
       next_recommendations, mastery_change, time_spent, questions_attempted,
       questions_correct, accuracy, created
     )
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, true)
     ON CONFLICT (session_id)
     DO UPDATE SET
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       insights = EXCLUDED.insights,
       weak_areas = EXCLUDED.weak_areas,
       strengths = EXCLUDED.strengths,
       next_recommendations = EXCLUDED.next_recommendations,
       mastery_change = EXCLUDED.mastery_change,
       time_spent = EXCLUDED.time_spent,
       questions_attempted = EXCLUDED.questions_attempted,
       questions_correct = EXCLUDED.questions_correct,
       accuracy = EXCLUDED.accuracy,
       created = true
     RETURNING *`,
    [
      sessionId,
      summaryData.title ?? null,
      summaryData.summary ?? null,
      summaryData.insights ? JSON.stringify(summaryData.insights) : null,
      summaryData.weakAreas ? JSON.stringify(summaryData.weakAreas) : null,
      summaryData.strengths ? JSON.stringify(summaryData.strengths) : null,
      summaryData.nextRecommendations ? JSON.stringify(summaryData.nextRecommendations) : null,
      summaryData.masteryChange ?? null,
      summaryData.timeSpent ?? null,
      summaryData.questionsAttempted ?? null,
      summaryData.questionsCorrect ?? null,
      summaryData.accuracy ?? null,
    ]
  );

  return result.rows[0] || null;
}

async function getSessionSummary(sessionId) {
  const result = await db.query(
    `SELECT *
     FROM session_summaries
     WHERE session_id = $1`,
    [sessionId]
  );

  return result.rows[0] || null;
}

async function recordModeSwitch(sessionId, fromMode, toMode, reason) {
  const result = await db.query(
    `INSERT INTO session_mode_history (session_id, from_mode, to_mode, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [sessionId, fromMode, toMode, reason ?? null]
  );

  return result.rows[0] || null;
}

async function getModeHistory(sessionId) {
  const result = await db.query(
    `SELECT *
     FROM session_mode_history
     WHERE session_id = $1
     ORDER BY timestamp DESC`,
    [sessionId]
  );

  return result.rows;
}

async function pauseSession(sessionId, reason = null) {
  const result = await db.query(
    `UPDATE learning_sessions
     SET status = 'paused', paused_at = NOW(), pause_reason = $2
     WHERE id = $1
     RETURNING *`,
    [sessionId, reason]
  );

  return mapSessionRow(result.rows[0]);
}

async function resumeSession(sessionId) {
  const result = await db.query(
    `UPDATE learning_sessions
     SET status = 'active', paused_at = NULL
     WHERE id = $1 AND status = 'paused'
     RETURNING *`,
    [sessionId]
  );

  return mapSessionRow(result.rows[0]);
}

async function updateSessionProgress(sessionId, data) {
  const assignments = [];
  const params = [sessionId];

  if (data.progress !== undefined && data.progress !== null) {
    params.push(data.progress);
    assignments.push(`progress = $${params.length}`);
  }
  if (data.currentQuestionId !== undefined) {
    params.push(data.currentQuestionId);
    assignments.push(`current_question_id = $${params.length}`);
  }
  if (data.currentOutlineItemId !== undefined) {
    params.push(data.currentOutlineItemId);
    assignments.push(`current_outline_item_id = $${params.length}`);
  }
  if (data.sessionDuration !== undefined && data.sessionDuration !== null) {
    params.push(data.sessionDuration);
    assignments.push(`session_duration = $${params.length}`);
  }
  if (data.currentMode !== undefined) {
    params.push(data.currentMode);
    assignments.push(`current_mode = $${params.length}`);
  }
  if (data.metadata !== undefined) {
    params.push(data.metadata !== null ? JSON.stringify(data.metadata) : null);
    assignments.push(`metadata = $${params.length}::jsonb`);
  }

  if (assignments.length === 0) {
    return null;
  }

  assignments.push('last_progress_update = NOW()');

  const result = await db.query(
    `UPDATE learning_sessions
     SET ${assignments.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  return mapSessionRow(result.rows[0]);
}

async function endSession(sessionId, duration) {
  const result = await db.query(
    `UPDATE learning_sessions
     SET status = 'completed', ended_at = NOW(), session_duration = $2
     WHERE id = $1
     RETURNING *`,
    [sessionId, duration]
  );

  return mapSessionRow(result.rows[0]);
}

async function switchSessionMode(sessionId, newMode) {
  const result = await db.query(
    `UPDATE learning_sessions
     SET mode = $2, current_mode = $2
     WHERE id = $1
     RETURNING *`,
    [sessionId, newMode]
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
  mapSessionRowExtended,
  createForProjectAndUser,
  findActiveByProjectForUser,
  findByIdForProjectAndUser,
  updateSessionState,
  createProgressSnapshot,
  getProgressSnapshots,
  upsertSessionSummary,
  getSessionSummary,
  recordModeSwitch,
  getModeHistory,
  pauseSession,
  resumeSession,
  updateSessionProgress,
  endSession,
  switchSessionMode,
};
