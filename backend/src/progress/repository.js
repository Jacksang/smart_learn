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

module.exports = {
  mapProjectProgressAggregateRow,
  mapTopicProgressAggregateRow,
  getProjectProgressAggregate,
  listTopicProgressAggregates,
};
