jest.mock('./repository', () => ({
  listByUser: jest.fn(),
  createProject: jest.fn(),
  findByIdForUser: jest.fn(),
  updateProjectForUser: jest.fn(),
}));

const {
  listByUser,
  createProject,
  findByIdForUser,
  updateProjectForUser,
} = require('./repository');
const controller = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('projects controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists projects for the authenticated user', async () => {
    const projects = [{ id: 'project-1', title: 'Biology' }];
    listByUser.mockResolvedValue(projects);

    const req = { user: { id: 'user-1' } };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjects(req, res, next);

    expect(listByUser).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ projects });
    expect(next).not.toHaveBeenCalled();
  });

  test('creates a project with camelCase fields normalized for the repository', async () => {
    const createdProject = {
      id: 'project-1',
      title: 'Physics',
      current_mode: 'guided',
      current_outline_id: 'outline-1',
    };
    createProject.mockResolvedValue(createdProject);

    const req = {
      user: { id: 'user-1' },
      body: {
        title: '  Physics  ',
        description: 'Mechanics',
        subject: 'Science',
        status: 'active',
        currentMode: 'guided',
        currentOutlineId: 'outline-1',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProject(req, res, next);

    expect(createProject).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Physics',
      description: 'Mechanics',
      subject: 'Science',
      status: 'active',
      currentMode: 'guided',
      currentOutlineId: 'outline-1',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Project created',
      project: createdProject,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects project creation when title is missing', async () => {
    const req = {
      user: { id: 'user-1' },
      body: { description: 'No title here' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProject(req, res, next);

    expect(createProject).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project title is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns a single project for the authenticated user', async () => {
    const project = { id: 'project-1', title: 'Chemistry' };
    findByIdForUser.mockResolvedValue(project);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProject(req, res, next);

    expect(findByIdForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ project });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the requested project is not found', async () => {
    findByIdForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'missing-project' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProject(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('updates a project with snake_case normalization and trimmed title', async () => {
    const updatedProject = {
      id: 'project-1',
      title: 'Updated title',
      current_mode: 'review',
      current_outline_id: 'outline-2',
    };
    updateProjectForUser.mockResolvedValue(updatedProject);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
      body: {
        title: '  Updated title  ',
        currentMode: 'review',
        currentOutlineId: 'outline-2',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProject(req, res, next);

    expect(updateProjectForUser).toHaveBeenCalledWith('project-1', 'user-1', {
      title: 'Updated title',
      current_mode: 'review',
      current_outline_id: 'outline-2',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Project updated',
      project: updatedProject,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects empty project titles during update', async () => {
    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
      body: { title: '   ' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProject(req, res, next);

    expect(updateProjectForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project title cannot be empty' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when updating a project outside the user scope', async () => {
    updateProjectForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'missing-project' },
      user: { id: 'user-1' },
      body: { subject: 'Mathematics' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateProject(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
