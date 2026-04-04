jest.mock('./repository', () => ({
  listByProjectForUser: jest.fn(),
  findByIdForProjectAndUser: jest.fn(),
  insertQuestionBatch: jest.fn(),
}));

jest.mock('./service', () => ({
  DEFAULT_BATCH_SIZE: 5,
  generateQuestionBatch: jest.fn(),
}));

const {
  listByProjectForUser,
  findByIdForProjectAndUser,
  insertQuestionBatch,
} = require('./repository');
const { generateQuestionBatch } = require('./service');
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

  test('generates and persists a default 5-question batch for a project outline item', async () => {
    generateQuestionBatch.mockResolvedValue({
      outlineItem: { id: 'item-1' },
      questions: Array.from({ length: 5 }, (_, index) => ({
        project_id: 'project-1',
        outline_item_id: 'item-1',
        batch_no: 1,
        position_in_batch: index + 1,
      })),
    });
    const insertedQuestions = Array.from({ length: 5 }, (_, index) => ({
      id: `question-${index + 1}`,
      project_id: 'project-1',
      outline_item_id: 'item-1',
      batch_no: 1,
      position_in_batch: index + 1,
    }));
    insertQuestionBatch.mockResolvedValue(insertedQuestions);

    const req = {
      params: { projectId: 'project-1' },
      body: { outlineItemId: 'item-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.generateProjectQuestions(req, res, next);

    expect(generateQuestionBatch).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      outlineItemId: 'item-1',
      batchSize: 5,
      difficultyLevel: undefined,
      questionTypes: undefined,
      batchNo: 1,
    });
    expect(insertQuestionBatch).toHaveBeenCalledWith(expect.any(Array));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Question batch generated',
      projectId: 'project-1',
      outlineItemId: 'item-1',
      batchNo: 1,
      batchSize: 5,
      questions: insertedQuestions,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects question generation requests without outlineItemId', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.generateProjectQuestions(req, res, next);

    expect(generateQuestionBatch).not.toHaveBeenCalled();
    expect(insertQuestionBatch).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'outlineItemId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns validation errors from the generation service', async () => {
    const error = new Error('Question types are invalid');
    error.code = 'INVALID_QUESTION_TYPES';
    error.status = 422;
    error.details = [{ field: 'questionTypes', issue: 'unsupported type: essay' }];
    generateQuestionBatch.mockRejectedValue(error);

    const req = {
      params: { projectId: 'project-1' },
      body: { outlineItemId: 'item-1', questionTypes: ['essay'] },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.generateProjectQuestions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Question types are invalid',
      errors: [{ field: 'questionTypes', issue: 'unsupported type: essay' }],
    });
    expect(next).not.toHaveBeenCalled();
  });
});
