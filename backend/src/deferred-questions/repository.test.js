const {
  DEFERRED_QUESTION_COLUMNS,
  DEFERRED_QUESTION_SELECT,
  DEFERRED_QUESTION_SELECT_WITH_ALIAS,
  mapDeferredQuestionRow,
} = require('./repository');

describe('deferred questions repository scaffold', () => {
  test('maps a deferred question row to the repository shape', () => {
    const row = {
      id: 'deferred-1',
      project_id: 'project-1',
      session_id: 'session-1',
      outline_item_id: 'item-1',
      question_text: 'What does this theorem mean?',
      defer_reason: 'come back later',
      status: 'deferred',
      brief_response: null,
      created_at: '2026-04-05T00:00:00Z',
      updated_at: '2026-04-05T00:00:00Z',
      resolved_at: null,
    };

    expect(mapDeferredQuestionRow(row)).toEqual(row);
  });

  test('returns null when mapping an empty row', () => {
    expect(mapDeferredQuestionRow(null)).toBeNull();
  });

  test('exports stable column and select helpers for future queries', () => {
    expect(DEFERRED_QUESTION_COLUMNS).toEqual([
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
    ]);
    expect(DEFERRED_QUESTION_SELECT).toBe(DEFERRED_QUESTION_COLUMNS.join(', '));
    expect(DEFERRED_QUESTION_SELECT_WITH_ALIAS('dq')).toBe(
      'dq.id, dq.project_id, dq.session_id, dq.outline_item_id, dq.question_text, dq.defer_reason, dq.status, dq.brief_response, dq.created_at, dq.updated_at, dq.resolved_at'
    );
  });
});
