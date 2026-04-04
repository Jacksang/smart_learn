jest.mock('./service', () => ({
  prepareOutlineCreateInput: jest.fn(),
  createOutline: jest.fn(),
}));

jest.mock('./repository', () => ({
  listByUser: jest.fn(),
}));

const service = require('./service');
const repository = require('./repository');
const controller = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('outline controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates an outline with normalized request fields', async () => {
    const createdOutline = { id: 'outline-1', project_id: 'project-1', title: 'Biology' };
    service.prepareOutlineCreateInput.mockReturnValue({ isValid: true, errors: [] });
    service.createOutline.mockResolvedValue(createdOutline);

    const req = {
      user: { id: 'user-1' },
      body: {
        project_id: 'project-1',
        title: 'Biology',
        status: 'draft',
        items: [{ title: 'Chapter 1' }],
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createOutline(req, res, next);

    expect(service.prepareOutlineCreateInput).toHaveBeenCalledWith({
      projectId: 'project-1',
      title: 'Biology',
      status: 'draft',
      items: [{ title: 'Chapter 1' }],
    });
    expect(service.createOutline).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'project-1',
      title: 'Biology',
      status: 'draft',
      items: [{ title: 'Chapter 1' }],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Outline created',
      outline: createdOutline,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects invalid outline creation payloads', async () => {
    service.prepareOutlineCreateInput.mockReturnValue({
      isValid: false,
      errors: ['projectId is required and must be a non-empty string'],
    });

    const req = {
      user: { id: 'user-1' },
      body: { title: 'Missing project' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createOutline(req, res, next);

    expect(service.createOutline).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid request payload',
      errors: ['projectId is required and must be a non-empty string'],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the target project is not found for the user', async () => {
    service.prepareOutlineCreateInput.mockReturnValue({ isValid: true, errors: [] });
    service.createOutline.mockResolvedValue(null);

    const req = {
      user: { id: 'user-1' },
      body: { projectId: 'missing-project', title: 'Outline' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createOutline(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('lists outlines for the authenticated user and optional project filter', async () => {
    const outlines = [{ id: 'outline-1' }];
    repository.listByUser.mockResolvedValue(outlines);

    const req = {
      user: { id: 'user-1' },
      query: { project_id: 'project-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listOutlines(req, res, next);

    expect(repository.listByUser).toHaveBeenCalledWith('user-1', 'project-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ outlines });
    expect(next).not.toHaveBeenCalled();
  });
});
