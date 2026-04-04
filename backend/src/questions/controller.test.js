jest.mock('./repository', () => ({
  listByProjectForUser: jest.fn(),
  findByIdForProjectAndUser: jest.fn(),
}));

const { listByProjectForUser, findByIdForProjectAndUser } = require('./repository');
const controller = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('questions controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists project questions with PostgreSQL-aligned filters', async () => {
    const questions = [{ id: 'question-1', batch_no: 2, position_in_batch: 1 }];
    listByProjectForUser.mockResolvedValue(questions);

    const req = {
      params: { projectId: 'project-1' },
      query: { outlineItemId: 'item-1', batchNo: '2', status: 'active' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjectQuestions(req, res, next);

    expect(listByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      outlineItemId: 'item-1',
      batchNo: '2',
      status: 'active',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ questions });
    expect(next).not.toHaveBeenCalled();
  });

  test('gets one project question in project/user scope', async () => {
    const question = { id: 'question-1', project_id: 'project-1' };
    findByIdForProjectAndUser.mockResolvedValue(question);

    const req = {
      params: { projectId: 'project-1', questionId: 'question-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectQuestion(req, res, next);

    expect(findByIdForProjectAndUser).toHaveBeenCalledWith('question-1', 'project-1', 'user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ question });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the project question is not found', async () => {
    findByIdForProjectAndUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1', questionId: 'missing-question' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectQuestion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Question not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
