const db = require('../../config/database');

async function listByUser(userId) {
  const result = await db.query(
    `SELECT id, user_id, course_title, subject, source_type, source_path, topics, ai_summary, status, created_at, updated_at
     FROM outlines
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function createOutline(payload) {
  const result = await db.query(
    `INSERT INTO outlines (
      user_id, course_title, subject, source_type, source_path, topics, ai_summary, status
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
    RETURNING id, user_id, course_title, subject, source_type, source_path, topics, ai_summary, status, created_at, updated_at`,
    [
      payload.userId,
      payload.courseTitle,
      payload.subject,
      payload.sourceType || 'manual',
      payload.sourcePath || null,
      JSON.stringify(payload.topics || []),
      payload.aiSummary || '',
      payload.status || 'draft',
    ]
  );
  return result.rows[0];
}

module.exports = {
  listByUser,
  createOutline,
};
