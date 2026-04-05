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
const QUESTION_SELECT_WITH_ALIAS = (alias) => QUESTION_COLUMNS.map((column) => `${alias}.${column}`).join(', ');

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

  if (outlineItemId !== undefined) {
    params.push(outlineItemId);
    clauses.push(`q.outline_item_id = $${params.length}`);
  }

  if (batchNo !== undefined) {
    params.push(batchNo);
    clauses.push(`q.batch_no = $${params.length}`);
  }

  if (status !== undefined) {
    params.push(status);
    clauses.push(`q.status = $${params.length}`);
  }

  const result = await db.query(
    `SELECT ${QUESTION_SELECT_WITH_ALIAS('q')}
     FROM questions q
     INNER JOIN learning_projects p ON p.id = q.project_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY q.batch_no ASC, q.position_in_batch ASC, q.created_at ASC, q.id ASC`,
    params
  );

  return result.rows.map(mapQuestionRow);
}

async function findByIdForProjectAndUser(questionId, projectId, userId) {
  const result = await db.query(
    `SELECT ${QUESTION_SELECT_WITH_ALIAS('q')}
     FROM questions q
     INNER JOIN learning_projects p ON p.id = q.project_id
     WHERE q.id = $1 AND q.project_id = $2 AND p.user_id = $3
     LIMIT 1`,
    [questionId, projectId, userId]
  );

  return mapQuestionRow(result.rows[0]);
}

async function findMaxBatchNoForProjectOutlineItem(projectId, outlineItemId) {
  const result = await db.query(
    `SELECT COALESCE(MAX(batch_no), 0) AS max_batch_no
     FROM questions
     WHERE project_id = $1 AND outline_item_id = $2`,
    [projectId, outlineItemId]
  );

  return Number(result.rows[0]?.max_batch_no || 0);
}

async function insertQuestionBatch(questions = []) {
  if (questions.length === 0) {
    return [];
  }

  const values = [];
  const params = [];

  questions.forEach((question) => {
    params.push(
      question.project_id,
      question.outline_item_id || null,
      question.batch_no,
      question.position_in_batch,
      question.question_type,
      question.difficulty_level,
      question.prompt,
      question.options === undefined ? null : JSON.stringify(question.options),
      question.correct_answer === undefined ? null : JSON.stringify(question.correct_answer),
      question.explanation || null,
      question.generation_source,
      question.status || 'active'
    );

    const base = params.length - 11;
    values.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::jsonb, $${base + 8}::jsonb, $${base + 9}, $${base + 10}, $${base + 11})`);
  });

  const result = await db.query(
    `INSERT INTO questions (
      project_id,
      outline_item_id,
      batch_no,
      position_in_batch,
      question_type,
      difficulty_level,
      prompt,
      options,
      correct_answer,
      explanation,
      generation_source,
      status
    ) VALUES ${values.join(', ')}
    RETURNING ${QUESTION_SELECT}`,
    params
  );

  return result.rows.map(mapQuestionRow);
}

module.exports = {
  QUESTION_COLUMNS,
  QUESTION_SELECT,
  mapQuestionRow,
  listByProjectForUser,
  findByIdForProjectAndUser,
  findMaxBatchNoForProjectOutlineItem,
  insertQuestionBatch,
};
