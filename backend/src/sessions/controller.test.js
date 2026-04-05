jest.mock('./repository', () => ({
  createForProjectAndUser: jest.fn(),
  findActiveByProjectForUser: jest.fn(),
}));

const {
  createForProjectAndUser,
  findActiveByProjectForUser,
} = require('./repository');
const controller = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('sessions controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a new project-scoped learning session and returns API-facing payload', async () => {
    findActiveByProjectForUser.mockResolvedValue(null);
    createForProjectAndUser.mockResolvedValue({
      id: 'session-1',
      projectId: 'project-1',
      userId: 'user-1',
      mode: ' LEARN ',
      status: 'active',
      currentOutlineItemId: ' topic-1 ',
      startedAt: '2026-04-05T06:00:00.000Z',
      endedAt: null,
      createdAt: '2026-04-05T06:00:00.000Z',
      updatedAt: '2026-04-05T06:00:00.000Z',
    });

    const req = {
      params: { projectId: ' project-1 ' },
      body: {
        projectId: 'project-1',
        mode: ' LEARN ',
        currentOutlineItemId: ' topic-1 ',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(findActiveByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(createForProjectAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'learn',
      status: 'active',
      currentOutlineItemId: 'topic-1',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        session: {
          id: 'session-1',
          projectId: 'project-1',
          mode: 'learn',
          status: 'active',
          currentOutlineItemId: 'topic-1',
          startedAt: '2026-04-05T06:00:00.000Z',
          endedAt: null,
          createdAt: '2026-04-05T06:00:00.000Z',
          updatedAt: '2026-04-05T06:00:00.000Z',
        },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns the current active project session instead of creating a duplicate', async () => {
    findActiveByProjectForUser.mockResolvedValue({
      id: 'session-active',
      projectId: 'project-1',
      userId: 'user-1',
      mode: 'quiz',
      status: 'active',
      currentOutlineItemId: 'topic-quiz-1',
      startedAt: '2026-04-05T05:55:00.000Z',
      endedAt: null,
      createdAt: '2026-04-05T05:55:00.000Z',
      updatedAt: '2026-04-05T05:58:00.000Z',
    });

    const req = {
      params: { projectId: 'project-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(createForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        session: {
          id: 'session-active',
          projectId: 'project-1',
          mode: 'quiz',
          status: 'active',
          currentOutlineItemId: 'topic-quiz-1',
          startedAt: '2026-04-05T05:55:00.000Z',
          endedAt: null,
          createdAt: '2026-04-05T05:55:00.000Z',
          updatedAt: '2026-04-05T05:58:00.000Z',
        },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId before repository access', async () => {
    const req = {
      params: { projectId: '   ' },
      body: { mode: 'learn' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(findActiveByProjectForUser).not.toHaveBeenCalled();
    expect(createForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects mismatched body projectId before repository access', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: { projectId: 'project-2', mode: 'learn' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(findActiveByProjectForUser).not.toHaveBeenCalled();
    expect(createForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId in body must match route projectId' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects unsupported session mode before repository access', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: { mode: 'guided' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(findActiveByProjectForUser).not.toHaveBeenCalled();
    expect(createForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unsupported session mode: guided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('requires mode when no active project session exists yet', async () => {
    findActiveByProjectForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(findActiveByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(createForProjectAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'mode is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the project is not owned or does not exist', async () => {
    findActiveByProjectForUser.mockResolvedValue(null);
    createForProjectAndUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-missing' },
      body: { mode: 'review', current_topic_id: '  ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectSession(req, res, next);

    expect(createForProjectAndUser).toHaveBeenCalledWith({
      projectId: 'project-missing',
      userId: 'user-1',
      mode: 'review',
      status: 'active',
      currentOutlineItemId: null,
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
