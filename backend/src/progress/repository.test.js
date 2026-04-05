jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  getProjectProgressAggregate,
  listTopicProgressAggregates,
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
});
