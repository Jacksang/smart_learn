const db = require('../../config/database');

const QUESTION_COLUMNS = [
  'id',
  'project_id',
  'outline_item_id',
  'batch_no',
  'position_in_batch',
  'question_type',
  'difficulty_level',
  'prompt',
  'options',
  'correct_answer',
  'explanation',
  'generation_source',
  'status',
  'created_at',
  'updated_at',
];

const QUESTION_SELECT = QUESTION_COLUMNS.join(', ');

function mapQuestionRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    outline_item_id: row.outline_item_id,
    batch_no: row.batch_no,
    position_in_batch: row.position_in_batch,
    question_type: row.question_type,
    difficulty_level: row.difficulty_level,
    prompt: row.prompt,
    options: row.options,
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    generation_source: row.generation_source,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listByProjectForUser({ projectId, userId, outlineItemId, batchNo, status }) {
  const clauses = ['q.project_id = $1', 'p.user_id = $2'];
  const params = [projectId, userId];

  if (outlineItemId) {
    params.push(outlineItemId);
    clauses.push(`q.outline_item_id = $${params.length}`);
  }

  if (batchNo) {
    params.push(batchNo);
    clauses.push(`q.batch_no = $${params.length}`);
  }

  if (status) {
    params.push(status);
    clauses.push(`q.status = $${params.length}`);
  }

  const result = await db.query(
    `SELECT ${QUESTION_COLUMNS.map((column) => `q.${column}`).join(', ')}
     FROM questions q
     INNER JOIN learning_projects p ON p.id = q.project_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY q.batch_no ASC, q.position_in_batch ASC, q.created_at ASC`,
    params
  );

  return result.rows.map(mapQuestionRow);
}

async function findByIdForProjectAndUser(questionId, projectId, userId) {
  const result = await db.query(
    `SELECT ${QUESTION_COLUMNS.map((column) => `q.${column}`).join(', ')}
     FROM questions q
     INNER JOIN learning_projects p ON p.id = q.project_id
     WHERE q.id = $1 AND q.project_id = $2 AND p.user_id = $3
     LIMIT 1`,
    [questionId, projectId, userId]
  );

  return mapQuestionRow(result.rows[0]);
}

module.exports = {
  QUESTION_COLUMNS,
  QUESTION_SELECT,
  mapQuestionRow,
  listByProjectForUser,
  findByIdForProjectAndUser,
};
