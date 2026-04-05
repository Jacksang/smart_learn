jest.mock('./repository', () => ({
  createForProjectSessionAndUser: jest.fn(),
  listForProjectSessionAndUser: jest.fn(),
}));

const { createForProjectSessionAndUser, listForProjectSessionAndUser } = require('./repository');
const controller = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('deferred questions controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists deferred questions for a project/session and returns API-facing payload', async () => {
    listForProjectSessionAndUser.mockResolvedValue([
      {
        id: 'dq-2',
        project_id: 'project-1',
        session_id: 'session-1',
        outline_item_id: 'topic-2',
        question_text: ' Could we compare this with the previous chapter? ',
        defer_reason: ' Finish the current lesson first ',
        status: 'deferred',
        brief_response: null,
        created_at: '2026-04-05T08:10:00.000Z',
        updated_at: '2026-04-05T08:10:00.000Z',
        resolved_at: null,
      },
      {
        id: 'dq-1',
        project_id: 'project-1',
        session_id: null,
        outline_item_id: null,
        question_text: ' Why does this formula work? ',
        defer_reason: ' Too deep for the current lesson ',
        status: 'revisited',
        brief_response: ' We will cover the intuition in the recap block. ',
        created_at: '2026-04-05T08:00:00.000Z',
        updated_at: '2026-04-05T08:20:00.000Z',
        resolved_at: null,
      },
    ]);

    const req = {
      params: { projectId: ' project-1 ' },
      query: { sessionId: ' session-1 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listDeferredQuestions(req, res, next);

    expect(listForProjectSessionAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      sessionId: 'session-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        deferredQuestions: [
          {
            id: 'dq-2',
            projectId: 'project-1',
            sessionId: 'session-1',
            outlineItemId: 'topic-2',
            questionText: 'Could we compare this with the previous chapter?',
            deferReason: 'Finish the current lesson first',
            status: 'deferred',
            briefResponse: null,
            createdAt: '2026-04-05T08:10:00.000Z',
            updatedAt: '2026-04-05T08:10:00.000Z',
            resolvedAt: null,
          },
          {
            id: 'dq-1',
            projectId: 'project-1',
            sessionId: null,
            outlineItemId: null,
            questionText: 'Why does this formula work?',
            deferReason: 'Too deep for the current lesson',
            status: 'revisited',
            briefResponse: 'We will cover the intuition in the recap block.',
            createdAt: '2026-04-05T08:00:00.000Z',
            updatedAt: '2026-04-05T08:20:00.000Z',
            resolvedAt: null,
          },
        ],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns an empty deferred-question list when the owned scope has no parked questions', async () => {
    listForProjectSessionAndUser.mockResolvedValue([]);

    const req = {
      params: { projectId: 'project-1' },
      query: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listDeferredQuestions(req, res, next);

    expect(listForProjectSessionAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      sessionId: undefined,
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        deferredQuestions: [],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('passes the authenticated user scope when listing so unauthorized access is blocked upstream', async () => {
    listForProjectSessionAndUser.mockResolvedValue([]);

    const req = {
      params: { projectId: 'project-locked' },
      query: { session_id: 'session-1' },
      user: { id: 'user-42' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listDeferredQuestions(req, res, next);

    expect(listForProjectSessionAndUser).toHaveBeenCalledWith({
      projectId: 'project-locked',
      sessionId: 'session-1',
      userId: 'user-42',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects empty optional sessionId when provided for list requests', async () => {
    const req = {
      params: { projectId: 'project-1' },
      query: { sessionId: '   ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listDeferredQuestions(req, res, next);

    expect(listForProjectSessionAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'sessionId must be a non-empty string when provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('creates a project/session-scoped deferred question and returns API-facing payload', async () => {
    createForProjectSessionAndUser.mockResolvedValue({
      id: 'dq-1',
      project_id: 'project-1',
      session_id: 'session-1',
      outline_item_id: 'topic-1',
      question_text: ' Why does this formula work? ',
      defer_reason: ' Too deep for the current lesson ',
      status: 'deferred',
      brief_response: null,
      created_at: '2026-04-05T08:00:00.000Z',
      updated_at: '2026-04-05T08:00:00.000Z',
      resolved_at: null,
    });

    const req = {
      params: { projectId: ' project-1 ' },
      body: {
        projectId: 'project-1',
        sessionId: ' session-1 ',
        outlineItemId: ' topic-1 ',
        questionText: ' Why does this formula work? ',
        deferReason: ' Too deep for the current lesson ',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createDeferredQuestion(req, res, next);

    expect(createForProjectSessionAndUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      sessionId: 'session-1',
      userId: 'user-1',
      outlineItemId: 'topic-1',
      questionText: 'Why does this formula work?',
      deferReason: 'Too deep for the current lesson',
      status: 'deferred',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        deferredQuestion: {
          id: 'dq-1',
          projectId: 'project-1',
          sessionId: 'session-1',
          outlineItemId: 'topic-1',
          questionText: 'Why does this formula work?',
          deferReason: 'Too deep for the current lesson',
          status: 'deferred',
          briefResponse: null,
          createdAt: '2026-04-05T08:00:00.000Z',
          updatedAt: '2026-04-05T08:00:00.000Z',
          resolvedAt: null,
        },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing questionText before repository access', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {
        deferReason: 'Off topic for now',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createDeferredQuestion(req, res, next);

    expect(createForProjectSessionAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'questionText is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing deferReason before repository access', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {
        question_text: 'Can we also cover eigenvalues?',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createDeferredQuestion(req, res, next);

    expect(createForProjectSessionAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'deferReason is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects mismatched body projectId before repository access', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {
        projectId: 'project-2',
        questionText: 'Question',
        deferReason: 'Reason',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createDeferredQuestion(req, res, next);

    expect(createForProjectSessionAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId in body must match route projectId' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects empty optional sessionId when provided', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {
        sessionId: '   ',
        questionText: 'Question',
        deferReason: 'Reason',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createDeferredQuestion(req, res, next);

    expect(createForProjectSessionAndUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'sessionId must be a non-empty string when provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the owned project or session scope is not found', async () => {
    createForProjectSessionAndUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-missing' },
      body: {
        session_id: 'session-missing',
        outline_item_id: 'topic-9',
        question_text: 'Can we come back to this?',
        defer_reason: 'Need to finish the current path first',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createDeferredQuestion(req, res, next);

    expect(createForProjectSessionAndUser).toHaveBeenCalledWith({
      projectId: 'project-missing',
      sessionId: 'session-missing',
      userId: 'user-1',
      outlineItemId: 'topic-9',
      questionText: 'Can we come back to this?',
      deferReason: 'Need to finish the current path first',
      status: 'deferred',
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project or session not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
