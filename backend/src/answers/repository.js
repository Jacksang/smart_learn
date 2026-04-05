const db = require('../../config/database');

const ANSWER_ATTEMPT_COLUMNS = [
  'id',
  'question_id',
  'project_id',
  'session_id',
  'user_answer',
  'is_correct',
  'score',
  'feedback_text',
  'attempt_no',
  'answered_at',
  'created_at',
];

const ANSWER_ATTEMPT_SELECT_WITH_ALIAS = (alias) =>
  ANSWER_ATTEMPT_COLUMNS.map((column) => `${alias}.${column}`).join(', ');

function mapAnswerAttemptRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    question_id: row.question_id,
    project_id: row.project_id,
    session_id: row.session_id,
    user_answer: row.user_answer,
    is_correct: row.is_correct,
    score: row.score,
    feedback_text: row.feedback_text,
    attempt_no: row.attempt_no,
    answered_at: row.answered_at,
    created_at: row.created_at,
    question: row.question_prompt
      ? {
          id: row.question_id,
          prompt: row.question_prompt,
          question_type: row.question_type,
          outline_item_id: row.outline_item_id,
        }
      : undefined,
  };
}

async function listByQuestionForProjectAndUser({ projectId, questionId, userId }) {
  const result = await db.query(
    `SELECT
       ${ANSWER_ATTEMPT_SELECT_WITH_ALIAS('aa')},
       q.prompt AS question_prompt,
       q.question_type,
       q.outline_item_id
     FROM answer_attempts aa
     INNER JOIN questions q ON q.id = aa.question_id AND q.project_id = aa.project_id
     INNER JOIN learning_projects p ON p.id = aa.project_id
     WHERE aa.project_id = $1
       AND aa.question_id = $2
       AND p.user_id = $3
     ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.attempt_no DESC`,
    [projectId, questionId, userId]
  );

  return result.rows.map(mapAnswerAttemptRow);
}

async function listRecentByProjectForUser({ projectId, userId, limit = 20 }) {
  const result = await db.query(
    `SELECT
       ${ANSWER_ATTEMPT_SELECT_WITH_ALIAS('aa')},
       q.prompt AS question_prompt,
       q.question_type,
       q.outline_item_id
     FROM answer_attempts aa
     INNER JOIN questions q ON q.id = aa.question_id AND q.project_id = aa.project_id
     INNER JOIN learning_projects p ON p.id = aa.project_id
     WHERE aa.project_id = $1
       AND p.user_id = $2
     ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.attempt_no DESC
     LIMIT $3`,
    [projectId, userId, limit]
  );

  return result.rows.map(mapAnswerAttemptRow);
}

async function countAttemptsByQuestionInProject({ projectId, questionId }) {
  const result = await db.query(
    `SELECT COUNT(*)::int AS attempt_count
     FROM answer_attempts
     WHERE project_id = $1 AND question_id = $2`,
    [projectId, questionId]
  );

  return result.rows[0]?.attempt_count || 0;
}

async function createAnswerAttempt(payload) {
  const result = await db.query(
    `INSERT INTO answer_attempts (
      question_id,
      project_id,
      session_id,
      user_answer,
      is_correct,
      score,
      feedback_text,
      attempt_no,
      answered_at
    ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, COALESCE($9, NOW()))
    RETURNING ${ANSWER_ATTEMPT_COLUMNS.join(', ')}`,
    [
      payload.questionId,
      payload.projectId,
      payload.sessionId || null,
      JSON.stringify(payload.userAnswer),
      payload.isCorrect ?? null,
      payload.score ?? null,
      payload.feedbackText ?? null,
      payload.attemptNo,
      payload.answeredAt || null,
    ]
  );

  return mapAnswerAttemptRow(result.rows[0]);
}

module.exports = {
  ANSWER_ATTEMPT_COLUMNS,
  mapAnswerAttemptRow,
  listByQuestionForProjectAndUser,
  listRecentByProjectForUser,
  countAttemptsByQuestionInProject,
  createAnswerAttempt,
};
