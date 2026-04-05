const db = require('../../config/database');

function mapProjectProgressAggregateRow(row) {
  if (!row) {
    return null;
  }

  return {
    project_id: row.project_id,
    total_question_count: row.total_question_count,
    answered_question_count: row.answered_question_count,
    total_attempt_count: row.total_attempt_count,
    correct_attempt_count: row.correct_attempt_count,
    average_score: row.average_score === null ? null : Number(row.average_score),
    recent_attempt_count: row.recent_attempt_count,
    recent_correct_attempt_count: row.recent_correct_attempt_count,
  };
}

function mapTopicProgressAggregateRow(row) {
  if (!row) {
    return null;
  }

  return {
    project_id: row.project_id,
    outline_item_id: row.outline_item_id,
    outline_item_title: row.outline_item_title,
    outline_item_level: row.outline_item_level,
    parent_item_id: row.parent_item_id,
    order_index: row.order_index,
    total_question_count: row.total_question_count,
    answered_question_count: row.answered_question_count,
    total_attempt_count: row.total_attempt_count,
    correct_attempt_count: row.correct_attempt_count,
    average_score: row.average_score === null ? null : Number(row.average_score),
    recent_attempt_count: row.recent_attempt_count,
    recent_correct_attempt_count: row.recent_correct_attempt_count,
  };
}

async function getProjectProgressAggregate({ projectId, userId, recentAttemptWindow = 5 }) {
  const normalizedRecentAttemptWindow = Number.isInteger(recentAttemptWindow) && recentAttemptWindow > 0
    ? recentAttemptWindow
    : 5;

  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     ),
     recent_attempts AS (
       SELECT attempt.is_correct
       FROM (
         SELECT aa.is_correct,
                ROW_NUMBER() OVER (
                  ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.id DESC
                ) AS recent_rank
         FROM answer_attempts aa
         INNER JOIN owned_project op ON op.id = aa.project_id
       ) attempt
       WHERE attempt.recent_rank <= $3
     )
     SELECT
       op.id AS project_id,
       COUNT(DISTINCT q.id)::int AS total_question_count,
       COUNT(DISTINCT aa.question_id)::int AS answered_question_count,
       COUNT(aa.id)::int AS total_attempt_count,
       COUNT(*) FILTER (WHERE aa.is_correct IS TRUE)::int AS correct_attempt_count,
       ROUND(AVG(aa.score)::numeric, 2) AS average_score,
       COALESCE((SELECT COUNT(*)::int FROM recent_attempts), 0) AS recent_attempt_count,
       COALESCE((SELECT COUNT(*)::int FROM recent_attempts WHERE is_correct IS TRUE), 0) AS recent_correct_attempt_count
     FROM owned_project op
     LEFT JOIN questions q ON q.project_id = op.id
     LEFT JOIN answer_attempts aa ON aa.project_id = op.id AND aa.question_id = q.id
     GROUP BY op.id`,
    [projectId, userId, normalizedRecentAttemptWindow]
  );

  return mapProjectProgressAggregateRow(result.rows[0]);
}

async function listTopicProgressAggregates({ projectId, userId, recentAttemptWindow = 5 }) {
  const normalizedRecentAttemptWindow = Number.isInteger(recentAttemptWindow) && recentAttemptWindow > 0
    ? recentAttemptWindow
    : 5;

  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     ),
     outline_item_scope AS (
       SELECT DISTINCT
         op.id AS project_id,
         q.outline_item_id,
         oi.title AS outline_item_title,
         oi.level AS outline_item_level,
         oi.parent_item_id,
         oi.order_index
       FROM owned_project op
       INNER JOIN questions q ON q.project_id = op.id
       LEFT JOIN outlines o ON o.project_id = op.id
       LEFT JOIN outline_items oi ON oi.id = q.outline_item_id AND oi.outline_id = o.id
       WHERE q.outline_item_id IS NOT NULL
     ),
     topic_recent_attempts AS (
       SELECT
         aa.question_id,
         q.outline_item_id,
         aa.is_correct,
         ROW_NUMBER() OVER (
           PARTITION BY q.outline_item_id
           ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.id DESC
         ) AS recent_rank
       FROM answer_attempts aa
       INNER JOIN questions q ON q.id = aa.question_id AND q.project_id = aa.project_id
       INNER JOIN owned_project op ON op.id = aa.project_id
       WHERE q.outline_item_id IS NOT NULL
     )
     SELECT
       scope.project_id,
       scope.outline_item_id,
       scope.outline_item_title,
       scope.outline_item_level,
       scope.parent_item_id,
       scope.order_index,
       COUNT(DISTINCT q.id)::int AS total_question_count,
       COUNT(DISTINCT aa.question_id)::int AS answered_question_count,
       COUNT(aa.id)::int AS total_attempt_count,
       COUNT(*) FILTER (WHERE aa.is_correct IS TRUE)::int AS correct_attempt_count,
       ROUND(AVG(aa.score)::numeric, 2) AS average_score,
       COUNT(*) FILTER (WHERE tra.recent_rank <= $3)::int AS recent_attempt_count,
       COUNT(*) FILTER (WHERE tra.recent_rank <= $3 AND tra.is_correct IS TRUE)::int AS recent_correct_attempt_count
     FROM outline_item_scope scope
     INNER JOIN questions q
       ON q.project_id = scope.project_id
      AND q.outline_item_id = scope.outline_item_id
     LEFT JOIN answer_attempts aa
       ON aa.project_id = q.project_id
      AND aa.question_id = q.id
     LEFT JOIN topic_recent_attempts tra
       ON tra.outline_item_id = scope.outline_item_id
      AND tra.question_id = q.id
      AND tra.recent_rank <= $3
     GROUP BY
       scope.project_id,
       scope.outline_item_id,
       scope.outline_item_title,
       scope.outline_item_level,
       scope.parent_item_id,
       scope.order_index
     ORDER BY scope.order_index ASC, scope.outline_item_id ASC`,
    [projectId, userId, normalizedRecentAttemptWindow]
  );

  return result.rows.map(mapTopicProgressAggregateRow);
}

function mapProgressSnapshotRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    outline_item_id: row.outline_item_id,
    snapshot_type: row.snapshot_type,
    completion_percent: row.completion_percent === null ? null : Number(row.completion_percent),
    mastery_score: row.mastery_score === null ? null : Number(row.mastery_score),
    progress_state: row.progress_state,
    weak_areas: row.weak_areas,
    strength_areas: row.strength_areas,
    summary_text: row.summary_text,
    created_at: row.created_at,
  };
}

async function findLatestProjectSnapshotForUser({ projectId, userId }) {
  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     )
     SELECT
       ps.id,
       ps.project_id,
       ps.outline_item_id,
       ps.snapshot_type,
       ps.completion_percent,
       ps.mastery_score,
       ps.progress_state,
       ps.weak_areas,
       ps.strength_areas,
       ps.summary_text,
       ps.created_at
     FROM owned_project op
     INNER JOIN progress_snapshots ps ON ps.project_id = op.id
     WHERE ps.outline_item_id IS NULL
     ORDER BY ps.created_at DESC, ps.id DESC
     LIMIT 1`,
    [projectId, userId]
  );

  return mapProgressSnapshotRow(result.rows[0]);
}

async function createProjectSnapshot({ projectId, userId, snapshot }) {
  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     )
     INSERT INTO progress_snapshots (
       project_id,
       outline_item_id,
       snapshot_type,
       completion_percent,
       mastery_score,
       progress_state,
       weak_areas,
       strength_areas,
       summary_text
     )
     SELECT
       op.id,
       NULL,
       $3,
       $4,
       $5,
       $6,
       $7::jsonb,
       $8::jsonb,
       $9
     FROM owned_project op
     RETURNING
       id,
       project_id,
       outline_item_id,
       snapshot_type,
       completion_percent,
       mastery_score,
       progress_state,
       weak_areas,
       strength_areas,
       summary_text,
       created_at`,
    [
      projectId,
      userId,
      snapshot.snapshot_type,
      snapshot.completion_percent,
      snapshot.mastery_score,
      snapshot.progress_state,
      JSON.stringify(snapshot.weak_areas ?? []),
      JSON.stringify(snapshot.strength_areas ?? []),
      snapshot.summary_text ?? null,
    ]
  );

  return mapProgressSnapshotRow(result.rows[0]);
}

async function createTopicSnapshots({ projectId, userId, topicSnapshots }) {
  if (!Array.isArray(topicSnapshots) || topicSnapshots.length === 0) {
    return [];
  }

  const normalizedTopicSnapshots = topicSnapshots.map((snapshot) => ({
    outline_item_id: snapshot.outline_item_id,
    snapshot_type: snapshot.snapshot_type,
    completion_percent: snapshot.completion_percent,
    mastery_score: snapshot.mastery_score,
    progress_state: snapshot.progress_state,
    weak_areas: snapshot.weak_areas ?? [],
    strength_areas: snapshot.strength_areas ?? [],
    summary_text: snapshot.summary_text ?? null,
  }));

  const result = await db.query(
    `WITH owned_project AS (
       SELECT p.id
       FROM learning_projects p
       WHERE p.id = $1 AND p.user_id = $2
       LIMIT 1
     ),
     snapshot_rows AS (
       SELECT *
       FROM jsonb_to_recordset($3::jsonb) AS rows(
         outline_item_id uuid,
         snapshot_type text,
         completion_percent numeric,
         mastery_score numeric,
         progress_state text,
         weak_areas jsonb,
         strength_areas jsonb,
         summary_text text
       )
     )
     INSERT INTO progress_snapshots (
       project_id,
       outline_item_id,
       snapshot_type,
       completion_percent,
       mastery_score,
       progress_state,
       weak_areas,
       strength_areas,
       summary_text
     )
     SELECT
       op.id,
       sr.outline_item_id,
       sr.snapshot_type,
       sr.completion_percent,
       sr.mastery_score,
       sr.progress_state,
       sr.weak_areas,
       sr.strength_areas,
       sr.summary_text
     FROM owned_project op
     INNER JOIN snapshot_rows sr ON sr.outline_item_id IS NOT NULL
     ORDER BY sr.outline_item_id ASC
     RETURNING
       id,
       project_id,
       outline_item_id,
       snapshot_type,
       completion_percent,
       mastery_score,
       progress_state,
       weak_areas,
       strength_areas,
       summary_text,
       created_at`,
    [projectId, userId, JSON.stringify(normalizedTopicSnapshots)]
  );

  return result.rows.map(mapProgressSnapshotRow);
}

module.exports = {
  mapProjectProgressAggregateRow,
  mapTopicProgressAggregateRow,
  mapProgressSnapshotRow,
  getProjectProgressAggregate,
  listTopicProgressAggregates,
  findLatestProjectSnapshotForUser,
  createProjectSnapshot,
  createTopicSnapshots,
};
