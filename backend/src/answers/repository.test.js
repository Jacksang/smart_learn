jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  listByQuestionForProjectAndUser,
  listRecentByProjectForUser,
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

  test('lists recent project answer attempts with explicit limit', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await listRecentByProjectForUser({
      projectId: 'project-1',
      userId: 'user-1',
      limit: 15,
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT $3'), ['project-1', 'user-1', 15]);
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
