jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  createForProjectAndUser,
  findActiveByProjectForUser,
  findByIdForProjectAndUser,
  updateSessionState,
} = require('./repository');

describe('sessions repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates one learning session for an owned project with stable mapped fields', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'session-1',
          project_id: 'project-1',
          user_id: 'user-1',
          mode: 'learn',
          status: 'active',
          current_outline_item_id: 'item-1',
          started_at: '2026-04-05T06:00:00.000Z',
          ended_at: null,
          session_summary: null,
          motivation_state: { energy: 'high' },
          created_at: '2026-04-05T06:00:00.000Z',
          updated_at: '2026-04-05T06:00:00.000Z',
        },
      ],
    });

    const session = await createForProjectAndUser({
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'learn',
      currentOutlineItemId: 'item-1',
      motivationState: { energy: 'high' },
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO learning_sessions'),
      [
        'project-1',
        'user-1',
        'learn',
        'active',
        'item-1',
        null,
        null,
        JSON.stringify({ energy: 'high' }),
      ]
    );
    expect(db.query.mock.calls[0][0]).toContain('WHERE p.id = $1 AND p.user_id = $2');
    expect(db.query.mock.calls[0][0]).toContain('$8::jsonb');
    expect(session).toEqual({
      id: 'session-1',
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'learn',
      status: 'active',
      currentOutlineItemId: 'item-1',
      startedAt: '2026-04-05T06:00:00.000Z',
      endedAt: null,
      sessionSummary: null,
      motivationState: { energy: 'high' },
      createdAt: '2026-04-05T06:00:00.000Z',
      updatedAt: '2026-04-05T06:00:00.000Z',
    });
  });

  test('returns null when session creation is outside owned project scope', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const session = await createForProjectAndUser({
      projectId: 'project-404',
      userId: 'user-1',
      mode: 'learn',
    });

    expect(session).toBeNull();
  });

  test('loads the latest active session for an owned project only', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'session-active',
          project_id: 'project-1',
          user_id: 'user-1',
          mode: 'review',
          status: 'active',
          current_outline_item_id: 'item-7',
          started_at: '2026-04-05T06:15:00.000Z',
          ended_at: null,
          session_summary: 'Resume from topic 7.',
          motivation_state: { confidence: 'medium' },
          created_at: '2026-04-05T06:15:00.000Z',
          updated_at: '2026-04-05T06:20:00.000Z',
        },
      ],
    });

    const session = await findActiveByProjectForUser({
      projectId: 'project-1',
      userId: 'user-1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE s.user_id = $2 AND s.status = $3'),
      ['project-1', 'user-1', 'active']
    );
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN learning_sessions s ON s.project_id = op.id');
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY s.started_at DESC, s.created_at DESC, s.id DESC');
    expect(session).toEqual({
      id: 'session-active',
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'review',
      status: 'active',
      currentOutlineItemId: 'item-7',
      startedAt: '2026-04-05T06:15:00.000Z',
      endedAt: null,
      sessionSummary: 'Resume from topic 7.',
      motivationState: { confidence: 'medium' },
      createdAt: '2026-04-05T06:15:00.000Z',
      updatedAt: '2026-04-05T06:20:00.000Z',
    });
  });

  test('returns null when no active owned session exists', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const session = await findActiveByProjectForUser({
      projectId: 'project-1',
      userId: 'user-1',
    });

    expect(session).toBeNull();
  });

  test('finds one session by id within owned project scope', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'session-2',
          project_id: 'project-1',
          user_id: 'user-1',
          mode: 'quiz',
          status: 'paused',
          current_outline_item_id: 'item-3',
          started_at: '2026-04-05T05:00:00.000Z',
          ended_at: null,
          session_summary: null,
          motivation_state: null,
          created_at: '2026-04-05T05:00:00.000Z',
          updated_at: '2026-04-05T05:45:00.000Z',
        },
      ],
    });

    const session = await findByIdForProjectAndUser({
      sessionId: 'session-2',
      projectId: 'project-1',
      userId: 'user-1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE s.id = $1 AND s.user_id = $3'),
      ['session-2', 'project-1', 'user-1']
    );
    expect(session).toEqual({
      id: 'session-2',
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'quiz',
      status: 'paused',
      currentOutlineItemId: 'item-3',
      startedAt: '2026-04-05T05:00:00.000Z',
      endedAt: null,
      sessionSummary: null,
      motivationState: null,
      createdAt: '2026-04-05T05:00:00.000Z',
      updatedAt: '2026-04-05T05:45:00.000Z',
    });
  });

  test('blocks cross-project session lookup leakage', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const session = await findByIdForProjectAndUser({
      sessionId: 'session-2',
      projectId: 'project-999',
      userId: 'user-1',
    });

    expect(session).toBeNull();
  });

  test('updates owned session state and maps the updated row for controller use', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'session-3',
          project_id: 'project-1',
          user_id: 'user-1',
          mode: 'reinforce',
          status: 'completed',
          current_outline_item_id: 'item-9',
          started_at: '2026-04-05T04:00:00.000Z',
          ended_at: '2026-04-05T06:30:00.000Z',
          session_summary: 'Finished reinforcement cycle.',
          motivation_state: { focus: 'steady' },
          created_at: '2026-04-05T04:00:00.000Z',
          updated_at: '2026-04-05T06:30:00.000Z',
        },
      ],
    });

    const session = await updateSessionState({
      sessionId: 'session-3',
      projectId: 'project-1',
      userId: 'user-1',
      updates: {
        mode: 'reinforce',
        status: 'completed',
        current_outline_item_id: 'item-9',
        ended_at: '2026-04-05T06:30:00.000Z',
        session_summary: 'Finished reinforcement cycle.',
        motivation_state: { focus: 'steady' },
      },
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE learning_sessions s'),
      [
        'session-3',
        'project-1',
        'user-1',
        'reinforce',
        'completed',
        'item-9',
        '2026-04-05T06:30:00.000Z',
        'Finished reinforcement cycle.',
        JSON.stringify({ focus: 'steady' }),
      ]
    );
    expect(db.query.mock.calls[0][0]).toContain('s.project_id = op.id');
    expect(db.query.mock.calls[0][0]).toContain('motivation_state = $9::jsonb');
    expect(session).toEqual({
      id: 'session-3',
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'reinforce',
      status: 'completed',
      currentOutlineItemId: 'item-9',
      startedAt: '2026-04-05T04:00:00.000Z',
      endedAt: '2026-04-05T06:30:00.000Z',
      sessionSummary: 'Finished reinforcement cycle.',
      motivationState: { focus: 'steady' },
      createdAt: '2026-04-05T04:00:00.000Z',
      updatedAt: '2026-04-05T06:30:00.000Z',
    });
  });

  test('returns existing session state without updating when no mutable fields are provided', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'session-4',
          project_id: 'project-1',
          user_id: 'user-1',
          mode: 'learn',
          status: 'active',
          current_outline_item_id: null,
          started_at: '2026-04-05T06:00:00.000Z',
          ended_at: null,
          session_summary: null,
          motivation_state: null,
          created_at: '2026-04-05T06:00:00.000Z',
          updated_at: '2026-04-05T06:00:00.000Z',
        },
      ],
    });

    const session = await updateSessionState({
      sessionId: 'session-4',
      projectId: 'project-1',
      userId: 'user-1',
      updates: {},
    });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain('WHERE s.id = $1 AND s.user_id = $3');
    expect(session).toEqual({
      id: 'session-4',
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'learn',
      status: 'active',
      currentOutlineItemId: null,
      startedAt: '2026-04-05T06:00:00.000Z',
      endedAt: null,
      sessionSummary: null,
      motivationState: null,
      createdAt: '2026-04-05T06:00:00.000Z',
      updatedAt: '2026-04-05T06:00:00.000Z',
    });
  });

  test('returns null when owned scope blocks the session state update', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const session = await updateSessionState({
      sessionId: 'session-404',
      projectId: 'project-404',
      userId: 'user-1',
      updates: { status: 'completed' },
    });

    expect(session).toBeNull();
  });
});
