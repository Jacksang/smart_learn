jest.mock('../questions/repository', () => ({
  findByIdForProjectAndUser: jest.fn(),
}));

jest.mock('./repository', () => ({
  listByQuestionForProjectAndUser: jest.fn(),
  listRecentByProjectForUser: jest.fn(),
}));

const { findByIdForProjectAndUser } = require('../questions/repository');
const { listByQuestionForProjectAndUser, listRecentByProjectForUser } = require('./repository');
const controller = require('./controller');

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
      limit: 15,
      answers: [{ id: 'attempt-2' }],
    });
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

  test('keeps project-scoped submit scaffold explicit for D1.5.C', async () => {
    const req = { params: { projectId: 'project-1', questionId: 'question-1' }, body: {}, user: { id: 'user-1' } };
    const res = createRes();

    await controller.submitProjectAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Project-scoped answer submission scaffold is aligned to answer_attempts but not implemented yet.',
      detail: 'Complete D1.5.C to persist and evaluate answer attempts through this route.',
    });
  });
});
