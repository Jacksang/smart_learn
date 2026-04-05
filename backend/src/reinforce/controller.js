const { getRecoveryRecommendation } = require('./service');

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

exports.getProjectSessionRecoveryRecommendation = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const sessionId = normalizeString(req.params.sessionId);
    const bodyProjectId = normalizeString(req.body?.projectId ?? req.body?.project_id);
    const bodySessionId = normalizeString(req.body?.sessionId ?? req.body?.session_id);
    const userId = normalizeString(req.user?.id);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    if (hasOwn(req.body ?? {}, 'projectId') || hasOwn(req.body ?? {}, 'project_id')) {
      if (!bodyProjectId) {
        return res.status(400).json({ message: 'projectId must be a non-empty string when provided' });
      }

      if (bodyProjectId !== projectId) {
        return res.status(400).json({ message: 'projectId in body must match route projectId' });
      }
    }

    if (hasOwn(req.body ?? {}, 'sessionId') || hasOwn(req.body ?? {}, 'session_id')) {
      if (!bodySessionId) {
        return res.status(400).json({ message: 'sessionId must be a non-empty string when provided' });
      }

      if (bodySessionId !== sessionId) {
        return res.status(400).json({ message: 'sessionId in body must match route sessionId' });
      }
    }

    const arrayValidationError = [
      validateOptionalArrayField(req.body?.recentAttempts, 'recentAttempts'),
      validateOptionalArrayField(req.body?.weakAreas, 'weakAreas'),
      validateOptionalArrayField(req.body?.questionCandidates, 'questionCandidates'),
    ].find(Boolean);

    if (arrayValidationError) {
      return res.status(400).json({ message: arrayValidationError });
    }

    const recommendation = getRecoveryRecommendation({
      session: req.body?.session ?? {},
      recentAttempts: req.body?.recentAttempts ?? [],
      weakAreas: req.body?.weakAreas ?? [],
      questionCandidates: req.body?.questionCandidates ?? [],
      currentQuestion: req.body?.currentQuestion ?? {},
    });

    return res.status(200).json({
      success: true,
      data: {
        projectId,
        sessionId,
        recommendation,
      },
    });
  } catch (error) {
    return next(error);
  }
};
