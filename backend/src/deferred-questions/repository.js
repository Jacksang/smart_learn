const DEFERRED_QUESTION_COLUMNS = [
  'id',
  'project_id',
  'session_id',
  'outline_item_id',
  'question_text',
  'defer_reason',
  'status',
  'brief_response',
  'created_at',
  'updated_at',
  'resolved_at',
];

const DEFERRED_QUESTION_SELECT = DEFERRED_QUESTION_COLUMNS.join(', ');
const DEFERRED_QUESTION_SELECT_WITH_ALIAS = (alias) =>
  DEFERRED_QUESTION_COLUMNS.map((column) => `${alias}.${column}`).join(', ');

function mapDeferredQuestionRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    session_id: row.session_id,
    outline_item_id: row.outline_item_id,
    question_text: row.question_text,
    defer_reason: row.defer_reason,
    status: row.status,
    brief_response: row.brief_response,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at,
  };
}

module.exports = {
  DEFERRED_QUESTION_COLUMNS,
  DEFERRED_QUESTION_SELECT,
  DEFERRED_QUESTION_SELECT_WITH_ALIAS,
  mapDeferredQuestionRow,
};
