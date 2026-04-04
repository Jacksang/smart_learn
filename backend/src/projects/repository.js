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

module.exports = {
  PROJECT_COLUMNS,
  PROJECT_SELECT,
  mapProjectRow,
  queryProjects,
};
