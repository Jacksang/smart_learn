jest.mock('./repository', () => ({
  createForProjectAndUser: jest.fn(),
  findActiveByProjectForUser: jest.fn(),
  updateSessionState: jest.fn(),
}));

const {
  createForProjectAndUser,
  findActiveByProjectForUser,
  updateSessionState,
} = require('./repository');
const controller = require('./controller');
const router = require('./router');

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

  test('registers the protected project-scoped create session route', () => {
    const createSessionLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === '/projects/:projectId/sessions'
    );

    expect(createSessionLayer).toBeDefined();
    expect(createSessionLayer.route.methods.post).toBe(true);
    expect(createSessionLayer.route.stack).toHaveLength(2);
    expect(createSessionLayer.route.stack[1].handle).toBe(controller.createProjectSession);
  });

  test('registers the protected current project session retrieval route', () => {
    const currentSessionLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === '/projects/:projectId/sessions/current'
    );

    expect(currentSessionLayer).toBeDefined();
    expect(currentSessionLayer.route.methods.get).toBe(true);
    expect(currentSessionLayer.route.stack).toHaveLength(2);
    expect(currentSessionLayer.route.stack[1].handle).toBe(controller.getCurrentProjectSession);
  });

  test('registers the protected project-scoped update session route', () => {
    const updateSessionLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === '/projects/:projectId/sessions/:sessionId'
    );

    expect(updateSessionLayer).toBeDefined();
    expect(updateSessionLayer.route.methods.patch).toBe(true);
    expect(updateSessionLayer.route.stack).toHaveLength(2);
    expect(updateSessionLayer.route.stack[1].handle).toBe(controller.updateProjectSessionState);
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

  test('returns the current active project session state', async () => {
    findActiveByProjectForUser.mockResolvedValue({
      id: 'session-active',
      projectId: 'project-1',
      userId: 'user-1',
      mode: ' QUIZ ',
      status: 'active',
      currentOutlineItemId: ' topic-quiz-1 ',
      startedAt: '2026-04-05T05:55:00.000Z',
      endedAt: null,
      createdAt: '2026-04-05T05:55:00.000Z',
      updatedAt: '2026-04-05T05:58:00.000Z',
    });

    const req = {
      params: { projectId: ' project-1 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getCurrentProjectSession(req, res, next);

    expect(findActiveByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
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

  test('returns a clean no-session state for a project with no active session', async () => {
    findActiveByProjectForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getCurrentProjectSession(req, res, next);

    expect(findActiveByProjectForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        session: null,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId when retrieving current session state', async () => {
    const req = {
      params: { projectId: '   ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getCurrentProjectSession(req, res, next);

    expect(findActiveByProjectForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('updates session mode and topic and returns API-facing payload', async () => {
    updateSessionState.mockResolvedValue({
      id: 'session-1',
      projectId: 'project-1',
      userId: 'user-1',
      mode: ' REVIEW ',
      status: 'active',
      currentOutlineItemId: ' topic-2 ',
      startedAt: '2026-04-05T06:00:00.000Z',
      endedAt: null,
      createdAt: '2026-04-05T06:00:00.000Z',
      updatedAt: '2026-04-05T06:15:00.000Z',
    });

    const req = {
      params: { projectId: ' project-1 ', sessionId: ' session-1 ' },
      body: {
        projectId: 'project-1',
        sessionId: 'session-1',
        currentMode: ' REVIEW ',
        currentTopicId: ' topic-2 ',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProjectSessionState(req, res, next);

    expect(updateSessionState).toHaveBeenCalledWith({
      sessionId: 'session-1',
      projectId: 'project-1',
      userId: 'user-1',
      updates: {
        mode: 'review',
        current_outline_item_id: 'topic-2',
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        session: {
          id: 'session-1',
          projectId: 'project-1',
          mode: 'review',
          status: 'active',
          currentOutlineItemId: 'topic-2',
          startedAt: '2026-04-05T06:00:00.000Z',
          endedAt: null,
          createdAt: '2026-04-05T06:00:00.000Z',
          updatedAt: '2026-04-05T06:15:00.000Z',
        },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing sessionId before repository access', async () => {
    const req = {
      params: { projectId: 'project-1', sessionId: '   ' },
      body: { mode: 'quiz' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProjectSessionState(req, res, next);

    expect(updateSessionState).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'sessionId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects mismatched sessionId in body before repository access', async () => {
    const req = {
      params: { projectId: 'project-1', sessionId: 'session-1' },
      body: { sessionId: 'session-2', mode: 'quiz' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProjectSessionState(req, res, next);

    expect(updateSessionState).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'sessionId in body must match route sessionId' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects unsupported mode when updating session state', async () => {
    const req = {
      params: { projectId: 'project-1', sessionId: 'session-1' },
      body: { current_mode: 'guided' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProjectSessionState(req, res, next);

    expect(updateSessionState).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unsupported session mode: guided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects empty update payload when neither mode nor topic is provided', async () => {
    const req = {
      params: { projectId: 'project-1', sessionId: 'session-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProjectSessionState(req, res, next);

    expect(updateSessionState).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'At least one of mode or currentOutlineItemId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when updating a session outside the owned project scope', async () => {
    updateSessionState.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1', sessionId: 'session-missing' },
      body: { currentOutlineItemId: 'topic-9' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProjectSessionState(req, res, next);

    expect(updateSessionState).toHaveBeenCalledWith({
      sessionId: 'session-missing',
      projectId: 'project-1',
      userId: 'user-1',
      updates: {
        current_outline_item_id: 'topic-9',
      },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Session not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
