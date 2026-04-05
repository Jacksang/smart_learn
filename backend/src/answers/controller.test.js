jest.mock('../questions/repository', () => ({
  findByIdForProjectAndUser: jest.fn(),
}));

jest.mock('./repository', () => ({
  listByQuestionForProjectAndUser: jest.fn(),
  listRecentByProjectForUser: jest.fn(),
  findNextAttemptNoByQuestionInProject: jest.fn(),
  createAnswerAttempt: jest.fn(),
  findAttemptWithQuestionContextForProjectAndUser: jest.fn(),
}));

jest.mock('./service', () => ({
  evaluateAnswerAttempt: jest.fn(),
}));

const { findByIdForProjectAndUser } = require('../questions/repository');
const {
  listByQuestionForProjectAndUser,
  listRecentByProjectForUser,
  findNextAttemptNoByQuestionInProject,
  createAnswerAttempt,
  findAttemptWithQuestionContextForProjectAndUser,
} = require('./repository');
const { evaluateAnswerAttempt } = require('./service');
const controller = require('./controller');
const router = require('./router');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('answers controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists question answers in project scope after ownership check', async () => {
    findByIdForProjectAndUser.mockResolvedValue({ id: 'question-1', project_id: 'project-1' });
    listByQuestionForProjectAndUser.mockResolvedValue([{ id: 'attempt-1', attempt_no: 1 }]);

    const req = {
      params: { projectId: ' project-1 ', questionId: ' question-1 ' },
      user: { id: 'user-1' },
      query: {},
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listQuestionAnswers(req, res, next);

    expect(findByIdForProjectAndUser).toHaveBeenCalledWith('question-1', 'project-1', 'user-1');
    expect(listByQuestionForProjectAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      questionId: 'question-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      questionId: 'question-1',
      answers: [{ id: 'attempt-1', attempt_no: 1 }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the scoped question is missing', async () => {
    findByIdForProjectAndUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1', questionId: 'missing-question' },
      user: { id: 'user-1' },
      query: {},
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listQuestionAnswers(req, res, next);

    expect(listByQuestionForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Question not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns an empty question answer history when the scoped question has no attempts yet', async () => {
    findByIdForProjectAndUser.mockResolvedValue({ id: 'question-1', project_id: 'project-1' });
    listByQuestionForProjectAndUser.mockResolvedValue([]);

    const req = {
      params: { projectId: 'project-1', questionId: 'question-1' },
      user: { id: 'user-1' },
      query: {},
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listQuestionAnswers(req, res, next);

    expect(findByIdForProjectAndUser).toHaveBeenCalledWith('question-1', 'project-1', 'user-1');
    expect(listByQuestionForProjectAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      questionId: 'question-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      questionId: 'question-1',
      answers: [],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('lists recent project answer history with normalized positive limit', async () => {
    listRecentByProjectForUser.mockResolvedValue([{ id: 'attempt-2' }]);

    const req = {
      params: { projectId: ' project-1 ' },
      query: { limit: '15' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjectAnswerHistory(req, res, next);

    expect(listRecentByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      limit: 15,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      count: 1,
      answers: [{ id: 'attempt-2' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns an empty project answer history payload when no attempts exist yet', async () => {
    listRecentByProjectForUser.mockResolvedValue([]);

    const req = {
      params: { projectId: 'project-1' },
      query: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjectAnswerHistory(req, res, next);

    expect(listRecentByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      limit: 20,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      count: 0,
      answers: [],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId before hitting the repository', async () => {
    const req = {
      params: { projectId: '   ' },
      query: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjectAnswerHistory(req, res, next);

    expect(listRecentByProjectForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects invalid history limits before hitting the repository', async () => {
    const req = {
      params: { projectId: 'project-1' },
      query: { limit: '0' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjectAnswerHistory(req, res, next);

    expect(listRecentByProjectForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'limit must be a positive integer' });
    expect(next).not.toHaveBeenCalled();
  });

  test('submits a project-scoped answer attempt after ownership check and evaluation', async () => {
    findByIdForProjectAndUser.mockResolvedValue({
      id: 'question-1',
      project_id: 'project-1',
      question_type: 'multiple_choice',
      correct_answer: { value: 'B' },
      explanation: 'Because B is correct.',
    });
    evaluateAnswerAttempt.mockReturnValue({
      isCorrect: true,
      score: 100,
      feedbackText: 'Correct',
      explanation: 'Because B is correct.',
    });
    findNextAttemptNoByQuestionInProject.mockResolvedValue(3);
    createAnswerAttempt.mockResolvedValue({
      id: 'attempt-3',
      question_id: 'question-1',
      project_id: 'project-1',
      session_id: 'session-1',
      user_answer: { selectedOption: 'B' },
      is_correct: true,
      score: 100,
      feedback_text: 'Correct',
      attempt_no: 3,
      answered_at: '2026-04-05T01:10:00Z',
    });

    const req = {
      params: { projectId: ' project-1 ', questionId: ' question-1 ' },
      body: {
        projectId: 'project-1',
        question_id: 'question-1',
        session_id: ' session-1 ',
        userAnswer: { selectedOption: 'B' },
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.submitProjectAnswer(req, res, next);

    expect(findByIdForProjectAndUser).toHaveBeenCalledWith('question-1', 'project-1', 'user-1');
    expect(evaluateAnswerAttempt).toHaveBeenCalledWith({
      question: expect.objectContaining({ id: 'question-1' }),
      userAnswer: { selectedOption: 'B' },
    });
    expect(findNextAttemptNoByQuestionInProject).toHaveBeenCalledWith({
      projectId: 'project-1',
      questionId: 'question-1',
    });
    expect(createAnswerAttempt).toHaveBeenCalledWith({
      questionId: 'question-1',
      projectId: 'project-1',
      sessionId: 'session-1',
      userAnswer: { selectedOption: 'B' },
      isCorrect: true,
      score: 100,
      feedbackText: 'Correct',
      attemptNo: 3,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        answerAttempt: {
          id: 'attempt-3',
          questionId: 'question-1',
          projectId: 'project-1',
          sessionId: 'session-1',
          userAnswer: { selectedOption: 'B' },
          isCorrect: true,
          score: 100,
          feedbackText: 'Correct',
          attemptNo: 3,
          answeredAt: '2026-04-05T01:10:00Z',
          explanation: 'Because B is correct.',
        },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects mismatched body identifiers before submission', async () => {
    const req = {
      params: { projectId: 'project-1', questionId: 'question-1' },
      body: {
        projectId: 'project-2',
        userAnswer: { value: 'A' },
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.submitProjectAnswer(req, res, next);

    expect(findByIdForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId in body must match route projectId' });
    expect(next).not.toHaveBeenCalled();
  });

  test('requires userAnswer for project-scoped submission', async () => {
    const req = {
      params: { projectId: 'project-1', questionId: 'question-1' },
      body: { sessionId: 'session-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.submitProjectAnswer(req, res, next);

    expect(findByIdForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'userAnswer is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('evaluates a stored project answer attempt with shared evaluation service', async () => {
    findAttemptWithQuestionContextForProjectAndUser.mockResolvedValue({
      id: 'attempt-7',
      project_id: 'project-1',
      user_answer: { selectedOption: 'B' },
      question_type: 'multiple_choice',
      correct_answer: { value: 'B' },
      explanation: 'Because B is correct.',
    });
    evaluateAnswerAttempt.mockReturnValue({
      isCorrect: true,
      score: 100,
      feedbackText: 'Correct',
      explanation: 'Because B is correct.',
    });

    const req = {
      params: { projectId: ' project-1 ' },
      body: { answer_attempt_id: ' attempt-7 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.evaluateProjectAnswers(req, res, next);

    expect(findAttemptWithQuestionContextForProjectAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      answerAttemptId: 'attempt-7',
      userId: 'user-1',
    });
    expect(evaluateAnswerAttempt).toHaveBeenCalledWith({
      question: {
        question_type: 'multiple_choice',
        correct_answer: { value: 'B' },
        explanation: 'Because B is correct.',
      },
      userAnswer: { selectedOption: 'B' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      answerAttemptId: 'attempt-7',
      evaluation: {
        isCorrect: true,
        score: 100,
        feedbackText: 'Correct',
        explanation: 'Because B is correct.',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing answerAttemptId for explicit evaluation', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.evaluateProjectAnswers(req, res, next);

    expect(findAttemptWithQuestionContextForProjectAndUser).not.toHaveBeenCalled();
    expect(evaluateAnswerAttempt).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'answerAttemptId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when explicit evaluation cannot load an owned answer attempt', async () => {
    findAttemptWithQuestionContextForProjectAndUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1' },
      body: { answerAttemptId: 'attempt-missing' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.evaluateProjectAnswers(req, res, next);

    expect(findAttemptWithQuestionContextForProjectAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      answerAttemptId: 'attempt-missing',
      userId: 'user-1',
    });
    expect(evaluateAnswerAttempt).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Answer attempt not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('wires project answer history and explicit evaluation routes on the answers router', () => {
    const routeSummaries = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).filter((method) => layer.route.methods[method]),
      }));

    expect(routeSummaries).toEqual(
      expect.arrayContaining([
        {
          path: '/projects/:projectId/answers/history',
          methods: ['get'],
        },
        {
          path: '/projects/:projectId/answers/evaluate',
          methods: ['post'],
        },
      ])
    );
  });
});
