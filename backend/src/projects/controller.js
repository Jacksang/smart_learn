const {
  listByUser,
  createProject,
  findByIdForUser,
  updateProjectForUser,
} = require('./repository');

function normalizeProjectCreateBody(body = {}) {
  return {
    title: body.title,
    description: body.description,
    subject: body.subject,
    status: body.status,
    currentMode: body.currentMode ?? body.current_mode,
    currentOutlineId: body.currentOutlineId ?? body.current_outline_id,
  };
}

function normalizeProjectUpdateBody(body = {}) {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    updates.title = body.title;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    updates.description = body.description;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'subject')) {
    updates.subject = body.subject;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    updates.status = body.status;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'currentMode') || Object.prototype.hasOwnProperty.call(body, 'current_mode')) {
    updates.current_mode = body.currentMode ?? body.current_mode;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'currentOutlineId') || Object.prototype.hasOwnProperty.call(body, 'current_outline_id')) {
    updates.current_outline_id = body.currentOutlineId ?? body.current_outline_id;
  }

  return updates;
}

exports.listProjects = async (req, res, next) => {
  try {
    const projects = await listByUser(req.user.id);
    return res.status(200).json({ projects });
  } catch (error) {
    return next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const payload = normalizeProjectCreateBody(req.body);

    if (!payload.title || !String(payload.title).trim()) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    const project = await createProject({
      userId: req.user.id,
      ...payload,
      title: String(payload.title).trim(),
    });

    return res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    return next(error);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await findByIdForUser(req.params.projectId, req.user.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json({ project });
  } catch (error) {
    return next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const updates = normalizeProjectUpdateBody(req.body);

    if (Object.prototype.hasOwnProperty.call(updates, 'title') && !String(updates.title || '').trim()) {
      return res.status(400).json({ message: 'Project title cannot be empty' });
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
      updates.title = String(updates.title).trim();
    }

    const project = await updateProjectForUser(req.params.projectId, req.user.id, updates);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json({ message: 'Project updated', project });
  } catch (error) {
    return next(error);
  }
};
