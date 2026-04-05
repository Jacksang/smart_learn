jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  getProjectProgressAggregate,
  listTopicProgressAggregates,
  findLatestProjectSnapshotForUser,
  createProjectSnapshot,
  createTopicSnapshots,
} = require('./repository');

describe('progress repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('gets one project-level aggregate in ownership-safe scope', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          project_id: 'project-1',
          total_question_count: 8,
          answered_question_count: 5,
          total_attempt_count: 9,
          correct_attempt_count: 6,
          average_score: '72.5',
          recent_attempt_count: 5,
          recent_correct_attempt_count: 3,
        },
      ],
    });

    const aggregate = await getProjectProgressAggregate({
      projectId: 'project-1',
      userId: 'user-1',
      recentAttemptWindow: 5,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.id = $1 AND p.user_id = $2'),
      ['project-1', 'user-1', 5]
    );
    expect(db.query.mock.calls[0][0]).toContain('LEFT JOIN questions q ON q.project_id = op.id');
    expect(db.query.mock.calls[0][0]).toContain('LEFT JOIN answer_attempts aa ON aa.project_id = op.id AND aa.question_id = q.id');
    expect(db.query.mock.calls[0][0]).toContain('ROW_NUMBER() OVER');
    expect(aggregate).toEqual({
      project_id: 'project-1',
      total_question_count: 8,
      answered_question_count: 5,
      total_attempt_count: 9,
      correct_attempt_count: 6,
      average_score: 72.5,
      recent_attempt_count: 5,
      recent_correct_attempt_count: 3,
    });
  });

  test('returns null project aggregate when the project is not owned by the user', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const aggregate = await getProjectProgressAggregate({
      projectId: 'project-404',
      userId: 'user-2',
    });

    expect(aggregate).toBeNull();
  });

  test('returns a usable zero-state project aggregate when an owned project has no attempts', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          project_id: 'project-1',
          total_question_count: 4,
          answered_question_count: 0,
          total_attempt_count: 0,
          correct_attempt_count: 0,
          average_score: null,
          recent_attempt_count: 0,
          recent_correct_attempt_count: 0,
        },
      ],
    });

    const aggregate = await getProjectProgressAggregate({
      projectId: 'project-1',
      userId: 'user-1',
    });

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['project-1', 'user-1', 5]);
    expect(aggregate).toEqual({
      project_id: 'project-1',
      total_question_count: 4,
      answered_question_count: 0,
      total_attempt_count: 0,
      correct_attempt_count: 0,
      average_score: null,
      recent_attempt_count: 0,
      recent_correct_attempt_count: 0,
    });
  });

  test('lists topic aggregates grouped by outline_item_id with outline metadata', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          project_id: 'project-1',
          outline_item_id: 'item-1',
          outline_item_title: 'Algebra Basics',
          outline_item_level: 2,
          parent_item_id: 'chapter-1',
          order_index: 10,
          total_question_count: 3,
          answered_question_count: 2,
          total_attempt_count: 4,
          correct_attempt_count: 3,
          average_score: '81.25',
          recent_attempt_count: 3,
          recent_correct_attempt_count: 2,
        },
      ],
    });

    const aggregates = await listTopicProgressAggregates({
      projectId: 'project-1',
      userId: 'user-1',
      recentAttemptWindow: 3,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.id = $1 AND p.user_id = $2'),
      ['project-1', 'user-1', 3]
    );
    expect(db.query.mock.calls[0][0]).toContain('PARTITION BY q.outline_item_id');
    expect(db.query.mock.calls[0][0]).toContain('WHERE q.outline_item_id IS NOT NULL');
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY scope.order_index ASC, scope.outline_item_id ASC');
    expect(aggregates).toEqual([
      {
        project_id: 'project-1',
        outline_item_id: 'item-1',
        outline_item_title: 'Algebra Basics',
        outline_item_level: 2,
        parent_item_id: 'chapter-1',
        order_index: 10,
        total_question_count: 3,
        answered_question_count: 2,
        total_attempt_count: 4,
        correct_attempt_count: 3,
        average_score: 81.25,
        recent_attempt_count: 3,
        recent_correct_attempt_count: 2,
      },
    ]);
  });

  test('returns an empty topic aggregate list when the project is outside user ownership scope', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const aggregates = await listTopicProgressAggregates({
      projectId: 'project-2',
      userId: 'user-9',
    });

    expect(aggregates).toEqual([]);
  });

  test('falls back to sane default recent window for invalid aggregate input', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await listTopicProgressAggregates({
      projectId: 'project-1',
      userId: 'user-1',
      recentAttemptWindow: 0,
    });

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['project-1', 'user-1', 5]);
  });

  test('returns the latest owned project-level snapshot for the user', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'snapshot-project-latest',
          project_id: 'project-1',
          outline_item_id: null,
          snapshot_type: 'project_refresh',
          completion_percent: '87.5',
          mastery_score: '91.25',
          progress_state: 'strong',
          weak_areas: [{ outline_item_id: 'item-3', title: 'Word Problems' }],
          strength_areas: [{ outline_item_id: 'item-1', title: 'Addition' }],
          summary_text: 'Latest snapshot summary.',
          created_at: '2026-04-05T05:00:00.000Z',
        },
      ],
    });

    const snapshot = await findLatestProjectSnapshotForUser({
      projectId: 'project-1',
      userId: 'user-1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.id = $1 AND p.user_id = $2'),
      ['project-1', 'user-1']
    );
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN progress_snapshots ps ON ps.project_id = op.id');
    expect(db.query.mock.calls[0][0]).toContain('WHERE ps.outline_item_id IS NULL');
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY ps.created_at DESC, ps.id DESC');
    expect(snapshot).toEqual({
      id: 'snapshot-project-latest',
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project_refresh',
      completion_percent: 87.5,
      mastery_score: 91.25,
      progress_state: 'strong',
      weak_areas: [{ outline_item_id: 'item-3', title: 'Word Problems' }],
      strength_areas: [{ outline_item_id: 'item-1', title: 'Addition' }],
      summary_text: 'Latest snapshot summary.',
      created_at: '2026-04-05T05:00:00.000Z',
    });
  });

  test('returns null when no owned project-level snapshot exists yet', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const snapshot = await findLatestProjectSnapshotForUser({
      projectId: 'project-1',
      userId: 'user-1',
    });

    expect(snapshot).toBeNull();
  });

  test('blocks latest project snapshot lookup outside user ownership scope', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const snapshot = await findLatestProjectSnapshotForUser({
      projectId: 'project-404',
      userId: 'user-9',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE p.id = $1 AND p.user_id = $2'),
      ['project-404', 'user-9']
    );
    expect(snapshot).toBeNull();
  });

  test('creates one owned project-level progress snapshot row', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'snapshot-project-1',
          project_id: 'project-1',
          outline_item_id: null,
          snapshot_type: 'project_refresh',
          completion_percent: '62.5',
          mastery_score: '71.5',
          progress_state: 'in_progress',
          weak_areas: [{ outline_item_id: 'item-2', title: 'Fractions' }],
          strength_areas: [{ outline_item_id: 'item-1', title: 'Addition' }],
          summary_text: 'Making steady progress overall.',
          created_at: '2026-04-05T03:00:00.000Z',
        },
      ],
    });

    const snapshot = await createProjectSnapshot({
      projectId: 'project-1',
      userId: 'user-1',
      snapshot: {
        snapshot_type: 'project_refresh',
        completion_percent: 62.5,
        mastery_score: 71.5,
        progress_state: 'in_progress',
        weak_areas: [{ outline_item_id: 'item-2', title: 'Fractions' }],
        strength_areas: [{ outline_item_id: 'item-1', title: 'Addition' }],
        summary_text: 'Making steady progress overall.',
      },
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO progress_snapshots'),
      [
        'project-1',
        'user-1',
        'project_refresh',
        62.5,
        71.5,
        'in_progress',
        JSON.stringify([{ outline_item_id: 'item-2', title: 'Fractions' }]),
        JSON.stringify([{ outline_item_id: 'item-1', title: 'Addition' }]),
        'Making steady progress overall.',
      ]
    );
    expect(db.query.mock.calls[0][0]).toContain('WHERE p.id = $1 AND p.user_id = $2');
    expect(db.query.mock.calls[0][0]).toContain('NULL,');
    expect(db.query.mock.calls[0][0]).toContain('$7::jsonb');
    expect(snapshot).toEqual({
      id: 'snapshot-project-1',
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project_refresh',
      completion_percent: 62.5,
      mastery_score: 71.5,
      progress_state: 'in_progress',
      weak_areas: [{ outline_item_id: 'item-2', title: 'Fractions' }],
      strength_areas: [{ outline_item_id: 'item-1', title: 'Addition' }],
      summary_text: 'Making steady progress overall.',
      created_at: '2026-04-05T03:00:00.000Z',
    });
  });

  test('returns null when project snapshot write is outside owned project scope', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const snapshot = await createProjectSnapshot({
      projectId: 'project-404',
      userId: 'user-1',
      snapshot: {
        snapshot_type: 'project_refresh',
        completion_percent: 0,
        mastery_score: 0,
        progress_state: 'not_started',
        weak_areas: [],
        strength_areas: [],
        summary_text: 'No progress yet.',
      },
    });

    expect(snapshot).toBeNull();
  });

  test('creates topic-level snapshots in one owned batch insert with stable row mapping', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'snapshot-topic-1',
          project_id: 'project-1',
          outline_item_id: 'item-1',
          snapshot_type: 'topic_refresh',
          completion_percent: '100',
          mastery_score: '88.5',
          progress_state: 'strong',
          weak_areas: [],
          strength_areas: [{ title: 'Addition' }],
          summary_text: 'Strong on Addition.',
          created_at: '2026-04-05T03:00:00.000Z',
        },
        {
          id: 'snapshot-topic-2',
          project_id: 'project-1',
          outline_item_id: 'item-2',
          snapshot_type: 'topic_refresh',
          completion_percent: '50',
          mastery_score: '42',
          progress_state: 'struggling',
          weak_areas: [{ title: 'Fractions' }],
          strength_areas: [],
          summary_text: 'Needs more work on Fractions.',
          created_at: '2026-04-05T03:00:01.000Z',
        },
      ],
    });

    const topicSnapshots = [
      {
        outline_item_id: 'item-2',
        snapshot_type: 'topic_refresh',
        completion_percent: 50,
        mastery_score: 42,
        progress_state: 'struggling',
        weak_areas: [{ title: 'Fractions' }],
        strength_areas: [],
        summary_text: 'Needs more work on Fractions.',
      },
      {
        outline_item_id: 'item-1',
        snapshot_type: 'topic_refresh',
        completion_percent: 100,
        mastery_score: 88.5,
        progress_state: 'strong',
        weak_areas: [],
        strength_areas: [{ title: 'Addition' }],
        summary_text: 'Strong on Addition.',
      },
    ];

    const persistedSnapshots = await createTopicSnapshots({
      projectId: 'project-1',
      userId: 'user-1',
      topicSnapshots,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('jsonb_to_recordset($3::jsonb)'),
      ['project-1', 'user-1', JSON.stringify(topicSnapshots)]
    );
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN snapshot_rows sr ON sr.outline_item_id IS NOT NULL');
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY sr.outline_item_id ASC');
    expect(persistedSnapshots).toEqual([
      {
        id: 'snapshot-topic-1',
        project_id: 'project-1',
        outline_item_id: 'item-1',
        snapshot_type: 'topic_refresh',
        completion_percent: 100,
        mastery_score: 88.5,
        progress_state: 'strong',
        weak_areas: [],
        strength_areas: [{ title: 'Addition' }],
        summary_text: 'Strong on Addition.',
        created_at: '2026-04-05T03:00:00.000Z',
      },
      {
        id: 'snapshot-topic-2',
        project_id: 'project-1',
        outline_item_id: 'item-2',
        snapshot_type: 'topic_refresh',
        completion_percent: 50,
        mastery_score: 42,
        progress_state: 'struggling',
        weak_areas: [{ title: 'Fractions' }],
        strength_areas: [],
        summary_text: 'Needs more work on Fractions.',
        created_at: '2026-04-05T03:00:01.000Z',
      },
    ]);
  });

  test('returns empty list without querying when no topic snapshots are provided', async () => {
    const persistedSnapshots = await createTopicSnapshots({
      projectId: 'project-1',
      userId: 'user-1',
      topicSnapshots: [],
    });

    expect(db.query).not.toHaveBeenCalled();
    expect(persistedSnapshots).toEqual([]);
  });

  test('returns empty list when owned scope check prevents topic snapshot writes', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const persistedSnapshots = await createTopicSnapshots({
      projectId: 'project-404',
      userId: 'user-1',
      topicSnapshots: [
        {
          outline_item_id: 'item-1',
          snapshot_type: 'topic_refresh',
          completion_percent: 0,
          mastery_score: 0,
          progress_state: 'not_started',
          weak_areas: [],
          strength_areas: [],
          summary_text: null,
        },
      ],
    });

    expect(persistedSnapshots).toEqual([]);
  });
});
