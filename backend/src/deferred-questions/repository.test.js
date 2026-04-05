jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  DEFERRED_QUESTION_COLUMNS,
  DEFERRED_QUESTION_SELECT,
  DEFERRED_QUESTION_SELECT_WITH_ALIAS,
  mapDeferredQuestionRow,
  listForProjectSessionAndUser,
  createForProjectSessionAndUser,
} = require('./repository');

describe('deferred questions repository scaffold', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test('lists deferred questions in stable reverse-created order and handles empty state cleanly', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'deferred-9',
            project_id: 'project-1',
            session_id: 'session-1',
            outline_item_id: 'item-9',
            question_text: 'Can we revisit integrals at the end?',
            defer_reason: 'parking_lot',
            status: 'deferred',
            brief_response: 'Yes, let us finish derivatives first.',
            created_at: '2026-04-05T08:05:00.000Z',
            updated_at: '2026-04-05T08:05:00.000Z',
            resolved_at: null,
          },
          {
            id: 'deferred-7',
            project_id: 'project-1',
            session_id: 'session-1',
            outline_item_id: 'item-4',
            question_text: 'Why is the derivative useful?',
            defer_reason: 'same_topic',
            status: 'deferred',
            brief_response: null,
            created_at: '2026-04-05T08:00:00.000Z',
            updated_at: '2026-04-05T08:00:00.000Z',
            resolved_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      listForProjectSessionAndUser({
        projectId: 'project-1',
        sessionId: 'session-1',
        userId: 'user-1',
      })
    ).resolves.toEqual([
      {
        id: 'deferred-9',
        project_id: 'project-1',
        session_id: 'session-1',
        outline_item_id: 'item-9',
        question_text: 'Can we revisit integrals at the end?',
        defer_reason: 'parking_lot',
        status: 'deferred',
        brief_response: 'Yes, let us finish derivatives first.',
        created_at: '2026-04-05T08:05:00.000Z',
        updated_at: '2026-04-05T08:05:00.000Z',
        resolved_at: null,
      },
      {
        id: 'deferred-7',
        project_id: 'project-1',
        session_id: 'session-1',
        outline_item_id: 'item-4',
        question_text: 'Why is the derivative useful?',
        defer_reason: 'same_topic',
        status: 'deferred',
        brief_response: null,
        created_at: '2026-04-05T08:00:00.000Z',
        updated_at: '2026-04-05T08:00:00.000Z',
        resolved_at: null,
      },
    ]);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('ORDER BY dq.created_at DESC, dq.id DESC'),
      ['project-1', 'user-1', 'session-1']
    );
    expect(db.query.mock.calls[0][0]).toContain('FROM deferred_questions dq');
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN learning_projects p ON p.id = dq.project_id');
    expect(db.query.mock.calls[0][0]).toContain('dq.session_id = $3');

    await expect(
      listForProjectSessionAndUser({
        projectId: 'project-1',
        sessionId: 'session-1',
        userId: 'user-1',
      })
    ).resolves.toEqual([]);
  });

  test('creates one deferred question for an owned project/session and maps the inserted row', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'deferred-2',
          project_id: 'project-1',
          session_id: 'session-1',
          outline_item_id: 'item-9',
          question_text: 'Can we come back to eigenvectors later?',
          defer_reason: 'off_topic',
          status: 'deferred',
          brief_response: 'Yes, after this section.',
          created_at: '2026-04-05T08:00:00.000Z',
          updated_at: '2026-04-05T08:00:00.000Z',
          resolved_at: null,
        },
      ],
    });

    const deferredQuestion = await createForProjectSessionAndUser({
      projectId: 'project-1',
      sessionId: 'session-1',
      userId: 'user-1',
      outlineItemId: 'item-9',
      questionText: 'Can we come back to eigenvectors later?',
      deferReason: 'off_topic',
      briefResponse: 'Yes, after this section.',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO deferred_questions'),
      [
        'project-1',
        'session-1',
        'user-1',
        'item-9',
        'Can we come back to eigenvectors later?',
        'off_topic',
        'deferred',
        'Yes, after this section.',
        null,
      ]
    );
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN learning_projects p ON p.id = s.project_id');
    expect(db.query.mock.calls[0][0]).toContain('WHERE s.id = $2 AND s.project_id = $1 AND p.user_id = $3');
    expect(db.query.mock.calls[0][0]).toContain('($2::uuid IS NULL OR os.id IS NOT NULL)');
    expect(deferredQuestion).toEqual({
      id: 'deferred-2',
      project_id: 'project-1',
      session_id: 'session-1',
      outline_item_id: 'item-9',
      question_text: 'Can we come back to eigenvectors later?',
      defer_reason: 'off_topic',
      status: 'deferred',
      brief_response: 'Yes, after this section.',
      created_at: '2026-04-05T08:00:00.000Z',
      updated_at: '2026-04-05T08:00:00.000Z',
      resolved_at: null,
    });
  });
});
