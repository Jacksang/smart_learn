const { createForProjectAndUser, findActiveByProjectForUser } = require('./repository');
const { mapSessionState, normalizeSessionMode, normalizeCurrentTopicId } = require('./service');

function normalizeString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readBodyProjectId(body = {}) {
  return normalizeString(body.projectId ?? body.project_id);
}

function readModeInput(body = {}) {
  if (hasOwn(body, 'mode')) {
    return {
      present: true,
      value: body.mode,
      fieldName: 'mode',
    };
  }

  if (hasOwn(body, 'currentMode')) {
    return {
      present: true,
      value: body.currentMode,
      fieldName: 'currentMode',
    };
  }

  if (hasOwn(body, 'current_mode')) {
    return {
      present: true,
      value: body.current_mode,
      fieldName: 'current_mode',
    };
  }

  return {
    present: false,
    value: undefined,
    fieldName: 'mode',
  };
}

function readCurrentOutlineItemId(body = {}) {
  if (hasOwn(body, 'currentOutlineItemId')) {
    return body.currentOutlineItemId;
  }

  if (hasOwn(body, 'current_outline_item_id')) {
    return body.current_outline_item_id;
  }

  if (hasOwn(body, 'currentTopicId')) {
    return body.currentTopicId;
  }

  if (hasOwn(body, 'current_topic_id')) {
    return body.current_topic_id;
  }

  return undefined;
}

function mapSessionToApi(session) {
  const mapped = mapSessionState(session);

  if (!mapped) {
    return null;
  }

  return {
    id: mapped.id,
    projectId: mapped.projectId,
    mode: mapped.mode,
    status: mapped.status,
    currentOutlineItemId: mapped.currentOutlineItemId,
    startedAt: mapped.startedAt,
    endedAt: mapped.endedAt,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
  };
}

exports.createProjectSession = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const bodyProjectId = readBodyProjectId(req.body);
    const modeInput = readModeInput(req.body);
    const currentOutlineItemIdInput = readCurrentOutlineItemId(req.body);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    if (bodyProjectId && bodyProjectId !== projectId) {
      return res.status(400).json({ message: 'projectId in body must match route projectId' });
    }

    let mode;
    if (modeInput.present) {
      try {
        mode = normalizeSessionMode(modeInput.value, { fieldName: modeInput.fieldName });
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    let currentOutlineItemId;
    if (currentOutlineItemIdInput !== undefined) {
      currentOutlineItemId = normalizeCurrentTopicId(currentOutlineItemIdInput);
    }

    const userId = req.user.id;
    const activeSession = await findActiveByProjectForUser({ projectId, userId });

    if (activeSession) {
      return res.status(200).json({
        success: true,
        data: {
          session: mapSessionToApi(activeSession),
        },
      });
    }

    if (mode === undefined) {
      return res.status(400).json({ message: 'mode is required' });
    }

    const createdSession = await createForProjectAndUser({
      projectId,
      userId,
      mode,
      status: 'active',
      currentOutlineItemId: currentOutlineItemId ?? null,
    });

    if (!createdSession) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(201).json({
      success: true,
      data: {
        session: mapSessionToApi(createdSession),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.mapSessionToApi = mapSessionToApi;
