const db = require('../../config/database');

async function listQuestions({ userId, outlineId, topic }) {
  const clauses = ['user_id = $1'];
  const params = [userId];

  if (outlineId) {
    params.push(outlineId);
    clauses.push(`outline_id = $${params.length}`);
  }

  if (topic) {
    params.push(topic);
    clauses.push(`topic = $${params.length}`);
  }

  const result = await db.query(
    `SELECT id, user_id, outline_id, topic, type, difficulty, prompt, options, correct_answer, explanation, source, tags, created_at, updated_at
     FROM questions
     WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC`,
    params
  );

  return result.rows;
}

async function createQuestion(payload) {
  const result = await db.query(
    `INSERT INTO questions (
      user_id, outline_id, topic, type, difficulty, prompt, options, correct_answer, explanation, source, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11::jsonb)
    RETURNING id, user_id, outline_id, topic, type, difficulty, prompt, options, correct_answer, explanation, source, tags, created_at, updated_at`,
    [
      payload.userId,
      payload.outlineId || null,
      payload.topic,
      payload.type,
      payload.difficulty || 'medium',
      payload.prompt,
      JSON.stringify(payload.options || []),
      JSON.stringify(payload.correctAnswer),
      payload.explanation || '',
      payload.source || 'manual',
      JSON.stringify(payload.tags || []),
    ]
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    `SELECT id, user_id, outline_id, topic, type, difficulty, prompt, options, correct_answer, explanation, source, tags, created_at, updated_at
     FROM questions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  listQuestions,
  createQuestion,
  findById,
};
