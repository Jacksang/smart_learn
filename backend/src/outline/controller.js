const outlineService = require('./service');
const repository = require('./repository');

function normalizeOutlineCreateBody(body = {}) {
  return {
    projectId: body.projectId ?? body.project_id,
    title: body.title,
    status: body.status,
    items: body.items,
  };
}

exports.createOutline = async (req, res, next) => {
  try {
    const input = normalizeOutlineCreateBody(req.body);
    const validation = outlineService.prepareOutlineCreateInput(input);

    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Invalid request payload',
        errors: validation.errors,
      });
    }

    const outline = await outlineService.createOutline({
      userId: req.user.id,
      ...input,
    });

    if (!outline) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(201).json({
      message: 'Outline created',
      outline,
    });
  } catch (error) {
    return next(error);
  }
};

exports.listOutlines = async (req, res, next) => {
  try {
    const projectId = req.query.projectId ?? req.query.project_id;
    const outlines = await repository.listByUser(req.user.id, projectId);
    return res.status(200).json({ outlines });
  } catch (error) {
    return next(error);
  }
};

exports.getOutlineById = async (req, res, next) => {
  try {
    const outline = await outlineService.getOutlineById({
      userId: req.user.id,
      outlineId: req.params.id,
    });

    if (!outline) {
      return res.status(404).json({ message: 'Outline not found' });
    }

    return res.status(200).json({ outline });
  } catch (error) {
    return next(error);
  }
};

exports.getOutlineByProject = async (req, res, next) => {
  try {
    const outline = await outlineService.getOutlineByProject({
      userId: req.user.id,
      projectId: req.params.projectId,
    });

    if (!outline) {
      return res.status(404).json({ message: 'Outline not found' });
    }

    return res.status(200).json({ outline });
  } catch (error) {
    return next(error);
  }
};

exports.uploadOutline = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { parseOutlineFile } = require('./parser');
    const parsed = await parseOutlineFile(req.file.path, req.file.mimetype);

    const outline = await outlineService.createOutline({
      userId: req.user.id,
      projectId: req.body.projectId ?? req.body.project_id,
      title: req.body.title || parsed.rawText.split('\n')[0] || 'Untitled Outline',
      items: parsed.topics || [],
      status: req.body.status,
    });

    if (!outline) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(201).json({
      message: 'Outline uploaded and created',
      outline,
    });
  } catch (error) {
    if (error.code === 'INVALID_OUTLINE_PAYLOAD') {
      return res.status(error.status || 400).json({
        message: 'Invalid request payload',
        errors: error.details || [],
      });
    }

    return next(error);
  }
};

exports.normalizeOutlineCreateBody = normalizeOutlineCreateBody;
