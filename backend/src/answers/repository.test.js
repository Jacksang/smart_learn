jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  listByQuestionForProjectAndUser,
  listRecentByProjectForUser,
  findAttemptWithQuestionContextForProjectAndUser,
  countAttemptsByQuestionInProject,
  findNextAttemptNoByQuestionInProject,
  createAnswerAttempt,
} = require('./repository');

describe('answers repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists question answer attempts in project/user scope newest first', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'attempt-2',
          question_id: 'question-1',
          project_id: 'project-1',
          session_id: null,
          user_answer: { value: 'A' },
          is_correct: true,
          score: 100,
          feedback_text: 'Correct',
          attempt_no: 2,
          answered_at: '2026-04-05T01:00:00Z',
          created_at: '2026-04-05T01:00:00Z',
          question_prompt: 'Pick A',
          question_type: 'multiple_choice',
          outline_item_id: 'item-1',
        },
      ],
    });

    const answers = await listByQuestionForProjectAndUser({
      projectId: 'project-1',
      questionId: 'question-1',
      userId: 'user-1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM answer_attempts aa'),
      ['project-1', 'question-1', 'user-1']
    );
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.attempt_no DESC');
    expect(answers).toEqual([
      expect.objectContaining({
        id: 'attempt-2',
        attempt_no: 2,
        question: expect.objectContaining({ prompt: 'Pick A' }),
      }),
    ]);
  });

  test('returns an empty list when no question answer attempts match the project/user scope', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const answers = await listByQuestionForProjectAndUser({
      projectId: 'project-1',
      questionId: 'question-1',
      userId: 'user-1',
    });

    expect(answers).toEqual([]);
  });

  test('lists recent project answer attempts in ownership-safe newest-first order with explicit limit', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'attempt-9',
          question_id: 'question-2',
          project_id: 'project-1',
          session_id: null,
          user_answer: { value: 'B' },
          is_correct: false,
          score: 20,
          feedback_text: 'Try again',
          attempt_no: 3,
          answered_at: '2026-04-05T02:00:00Z',
          created_at: '2026-04-05T02:00:01Z',
          question_prompt: 'Pick B',
          question_type: 'multiple_choice',
          outline_item_id: 'item-2',
        },
      ],
    });

    const answers = await listRecentByProjectForUser({
      projectId: 'project-1',
      userId: 'user-1',
      limit: 15,
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT $3'), ['project-1', 'user-1', 15]);
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN learning_projects p ON p.id = aa.project_id AND p.user_id = $2');
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.id DESC');
    expect(answers).toEqual([
      expect.objectContaining({
        id: 'attempt-9',
        question_id: 'question-2',
        feedback_text: 'Try again',
        question: expect.objectContaining({
          id: 'question-2',
          prompt: 'Pick B',
        }),
      }),
    ]);
  });

  test('falls back to sane MVP default limit for invalid project answer history limits', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await listRecentByProjectForUser({
      projectId: 'project-1',
      userId: 'user-1',
      limit: 0,
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT $3'), ['project-1', 'user-1', 20]);
  });

  test('finds one answer attempt with question and project context for explicit evaluation', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'attempt-7',
          question_id: 'question-3',
          project_id: 'project-1',
          session_id: 'session-1',
          user_answer: { value: 'S3' },
          is_correct: true,
          score: 1,
          feedback_text: 'Correct — S3 is AWS object storage.',
          attempt_no: 2,
          answered_at: '2026-04-05T03:00:00Z',
          created_at: '2026-04-05T03:00:01Z',
          question_prompt: 'Which AWS service stores objects?',
          question_type: 'short_answer',
          correct_answer: { value: 'S3' },
          explanation: 'S3 stores objects, while EC2 runs virtual machines.',
          outline_item_id: 'item-3',
          project_owner_user_id: 'user-1',
        },
      ],
    });

    const answerAttempt = await findAttemptWithQuestionContextForProjectAndUser({
      projectId: 'project-1',
      answerAttemptId: 'attempt-7',
      userId: 'user-1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE aa.project_id = $1'),
      ['project-1', 'attempt-7', 'user-1']
    );
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN questions q ON q.id = aa.question_id AND q.project_id = aa.project_id');
    expect(db.query.mock.calls[0][0]).toContain('INNER JOIN learning_projects p ON p.id = aa.project_id AND p.user_id = $3');
    expect(answerAttempt).toEqual(
      expect.objectContaining({
        id: 'attempt-7',
        project: {
          id: 'project-1',
          user_id: 'user-1',
        },
        question: expect.objectContaining({
          id: 'question-3',
          question_type: 'short_answer',
          correct_answer: { value: 'S3' },
          explanation: 'S3 stores objects, while EC2 runs virtual machines.',
        }),
      })
    );
  });

  test('returns null when explicit evaluation lookup finds no owned attempt', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const answerAttempt = await findAttemptWithQuestionContextForProjectAndUser({
      projectId: 'project-1',
      answerAttemptId: 'attempt-404',
      userId: 'user-1',
    });

    expect(answerAttempt).toBeNull();
  });

  test('explicit evaluation lookup keeps project/user ownership enforcement in the query', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await findAttemptWithQuestionContextForProjectAndUser({
      projectId: 'project-1',
      answerAttemptId: 'attempt-8',
      userId: 'user-2',
    });

    expect(db.query.mock.calls[0][0]).toContain('AND p.user_id = $3');
    expect(db.query.mock.calls[0][0]).toContain('AND aa.id = $2');
    expect(db.query.mock.calls[0][0]).toContain('AND q.project_id = $1');
  });

  test('counts attempts within project/question scope', async () => {
    db.query.mockResolvedValue({ rows: [{ attempt_count: 3 }] });

    const count = await countAttemptsByQuestionInProject({
      projectId: 'project-1',
      questionId: 'question-1',
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM answer_attempts'), ['project-1', 'question-1']);
    expect(count).toBe(3);
  });

  test('computes next attempt number from max attempt_no without reusing numbers', async () => {
    db.query.mockResolvedValue({ rows: [{ next_attempt_no: 4 }] });

    const nextAttemptNo = await findNextAttemptNoByQuestionInProject({
      projectId: 'project-1',
      questionId: 'question-1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('MAX(attempt_no)'),
      ['project-1', 'question-1']
    );
    expect(nextAttemptNo).toBe(4);
  });

  test('creates an answer_attempts row with PostgreSQL MVP fields', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'attempt-1',
          question_id: 'question-1',
          project_id: 'project-1',
          session_id: null,
          user_answer: { value: 'A' },
          is_correct: true,
          score: 100,
          feedback_text: 'Correct',
          attempt_no: 1,
          answered_at: '2026-04-05T01:00:00Z',
          created_at: '2026-04-05T01:00:00Z',
        },
      ],
    });

    const answer = await createAnswerAttempt({
      questionId: 'question-1',
      projectId: 'project-1',
      userAnswer: { value: 'A' },
      isCorrect: true,
      score: 100,
      feedbackText: 'Correct',
      attemptNo: 1,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO answer_attempts'),
      ['question-1', 'project-1', null, JSON.stringify({ value: 'A' }), true, 100, 'Correct', 1, null]
    );
    expect(answer).toEqual(expect.objectContaining({ id: 'attempt-1', attempt_no: 1 }));
  });
});
