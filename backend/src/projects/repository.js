const db = require('../../config/database');

const PROJECT_COLUMNS = [
  'id',
  'user_id',
  'title',
  'description',
  'subject',
  'status',
  'current_mode',
  'current_outline_id',
  'created_at',
  'updated_at',
];

const PROJECT_SELECT = PROJECT_COLUMNS.join(', ');
const PROJECT_MUTABLE_FIELDS = ['title', 'description', 'subject', 'status', 'current_mode', 'current_outline_id'];

function mapProjectRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    status: row.status,
    current_mode: row.current_mode,
    current_outline_id: row.current_outline_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function queryProjects(text, params = []) {
  const result = await db.query(text, params);
  return result.rows.map(mapProjectRow);
}

async function listByUser(userId) {
  return queryProjects(
    `SELECT ${PROJECT_SELECT}
     FROM learning_projects
     WHERE user_id = $1
     ORDER BY updated_at DESC, created_at DESC`,
    [userId]
  );
}

async function createProject(payload) {
  const result = await db.query(
    `INSERT INTO learning_projects (
      user_id,
      title,
      description,
      subject,
      status,
      current_mode,
      current_outline_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ${PROJECT_SELECT}`,
    [
      payload.userId,
      payload.title,
      payload.description || null,
      payload.subject || null,
      payload.status || 'active',
      payload.currentMode || null,
      payload.currentOutlineId || null,
    ]
  );

  return mapProjectRow(result.rows[0]);
}

async function findByIdForUser(projectId, userId) {
  const result = await db.query(
    `SELECT ${PROJECT_SELECT}
     FROM learning_projects
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [projectId, userId]
  );

  return mapProjectRow(result.rows[0]);
}

async function updateProjectForUser(projectId, userId, updates) {
  const assignments = [];
  const params = [projectId, userId];

  PROJECT_MUTABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      params.push(updates[field]);
      assignments.push(`${field} = $${params.length}`);
    }
  });

  if (assignments.length === 0) {
    return findByIdForUser(projectId, userId);
  }

  const result = await db.query(
    `UPDATE learning_projects
     SET ${assignments.join(', ')}
     WHERE id = $1 AND user_id = $2
     RETURNING ${PROJECT_SELECT}`,
    params
  );

  return mapProjectRow(result.rows[0]);
}

module.exports = {
  PROJECT_COLUMNS,
  PROJECT_SELECT,
  PROJECT_MUTABLE_FIELDS,
  mapProjectRow,
  queryProjects,
  listByUser,
  createProject,
  findByIdForUser,
  updateProjectForUser,
};
