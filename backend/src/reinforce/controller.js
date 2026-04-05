const { getRecoveryRecommendation, buildRecoverySummary } = require('./service');

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

function validateOptionalArrayField(value, fieldName) {
  if (value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    return `${fieldName} must be an array when provided`;
  }

  return null;
}

function getValidatedRequestPayload(req, res) {
  const projectId = normalizeString(req.params.projectId);
  const sessionId = normalizeString(req.params.sessionId);
  const bodyProjectId = normalizeString(req.body?.projectId ?? req.body?.project_id);
  const bodySessionId = normalizeString(req.body?.sessionId ?? req.body?.session_id);
  const userId = normalizeString(req.user?.id);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  if (!projectId) {
    res.status(400).json({ message: 'projectId is required' });
    return null;
  }

  if (!sessionId) {
    res.status(400).json({ message: 'sessionId is required' });
    return null;
  }

  if (hasOwn(req.body ?? {}, 'projectId') || hasOwn(req.body ?? {}, 'project_id')) {
    if (!bodyProjectId) {
      res.status(400).json({ message: 'projectId must be a non-empty string when provided' });
      return null;
    }

    if (bodyProjectId !== projectId) {
      res.status(400).json({ message: 'projectId in body must match route projectId' });
      return null;
    }
  }

  if (hasOwn(req.body ?? {}, 'sessionId') || hasOwn(req.body ?? {}, 'session_id')) {
    if (!bodySessionId) {
      res.status(400).json({ message: 'sessionId must be a non-empty string when provided' });
      return null;
    }

    if (bodySessionId !== sessionId) {
      res.status(400).json({ message: 'sessionId in body must match route sessionId' });
      return null;
    }
  }

  const arrayValidationError = [
    validateOptionalArrayField(req.body?.recentAttempts, 'recentAttempts'),
    validateOptionalArrayField(req.body?.weakAreas, 'weakAreas'),
    validateOptionalArrayField(req.body?.questionCandidates, 'questionCandidates'),
  ].find(Boolean);

  if (arrayValidationError) {
    res.status(400).json({ message: arrayValidationError });
    return null;
  }

  return {
    projectId,
    sessionId,
    serviceInput: {
      session: req.body?.session ?? {},
      recentAttempts: req.body?.recentAttempts ?? [],
      weakAreas: req.body?.weakAreas ?? [],
      questionCandidates: req.body?.questionCandidates ?? [],
      currentQuestion: req.body?.currentQuestion ?? {},
    },
  };
}

exports.getProjectSessionRecoveryRecommendation = async (req, res, next) => {
  try {
    const payload = getValidatedRequestPayload(req, res);
    if (!payload) {
      return undefined;
    }

    const recommendation = getRecoveryRecommendation(payload.serviceInput);

    return res.status(200).json({
      success: true,
      data: {
        projectId: payload.projectId,
        sessionId: payload.sessionId,
        recommendation,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectSessionRecoverySummary = async (req, res, next) => {
  try {
    const payload = getValidatedRequestPayload(req, res);
    if (!payload) {
      return undefined;
    }

    const summary = buildRecoverySummary(payload.serviceInput);

    return res.status(200).json({
      success: true,
      data: {
        projectId: payload.projectId,
        sessionId: payload.sessionId,
        summary,
      },
    });
  } catch (error) {
    return next(error);
  }
};
