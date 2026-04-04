const db = require('../../config/database');

async function listAnswers(userId) {
  const result = await db.query(
    `SELECT
       a.id,
       a.user_id,
       a.question_id,
       a.submitted_answer,
       a.is_correct,
       a.score,
       a.feedback,
       a.attempt_number,
       a.created_at,
       a.updated_at,
       q.topic,
       q.type,
       q.prompt
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    question_id: row.question_id,
    submitted_answer: row.submitted_answer,
    is_correct: row.is_correct,
    score: row.score,
    feedback: row.feedback,
    attempt_number: row.attempt_number,
    created_at: row.created_at,
    updated_at: row.updated_at,
    question: {
      id: row.question_id,
      topic: row.topic,
      type: row.type,
      prompt: row.prompt,
    },
  }));
}

async function countAttempts(userId, questionId) {
  const result = await db.query(
    'SELECT COUNT(*)::int AS attempt_count FROM answers WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );

  return result.rows[0]?.attempt_count || 0;
}

async function createAnswer(payload) {
  const result = await db.query(
    `INSERT INTO answers (
      user_id, question_id, submitted_answer, is_correct, score, feedback, attempt_number
    ) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
    RETURNING id, user_id, question_id, submitted_answer, is_correct, score, feedback, attempt_number, created_at, updated_at`,
    [
      payload.userId,
      payload.questionId,
      JSON.stringify(payload.submittedAnswer),
      payload.isCorrect,
      payload.score,
      payload.feedback,
      payload.attemptNumber,
    ]
  );

  return result.rows[0];
}

module.exports = {
  listAnswers,
  countAttempts,
  createAnswer,
};
