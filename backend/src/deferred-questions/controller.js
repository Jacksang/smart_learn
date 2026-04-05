const { createForProjectSessionAndUser, listForProjectSessionAndUser } = require('./repository');

function normalizeString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function mapDeferredQuestionToApi(deferredQuestion) {
  if (!deferredQuestion) {
    return null;
  }

  return {
    id: deferredQuestion.id,
    projectId: normalizeString(deferredQuestion.project_id),
    sessionId: normalizeString(deferredQuestion.session_id) ?? null,
    outlineItemId: normalizeString(deferredQuestion.outline_item_id) ?? null,
    questionText: normalizeString(deferredQuestion.question_text),
    deferReason: normalizeString(deferredQuestion.defer_reason),
    status: normalizeString(deferredQuestion.status),
    briefResponse: normalizeString(deferredQuestion.brief_response) ?? null,
    createdAt: deferredQuestion.created_at,
    updatedAt: deferredQuestion.updated_at,
    resolvedAt: deferredQuestion.resolved_at,
  };
}

exports.listDeferredQuestions = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const sessionIdInput = req.query?.sessionId ?? req.query?.session_id;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    let sessionId;
    if (sessionIdInput !== undefined) {
      sessionId = normalizeString(sessionIdInput);

      if (!sessionId) {
        return res.status(400).json({ message: 'sessionId must be a non-empty string when provided' });
      }
    }

    const deferredQuestions = await listForProjectSessionAndUser({
      projectId,
      sessionId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        deferredQuestions: deferredQuestions.map(mapDeferredQuestionToApi),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.createDeferredQuestion = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const bodyProjectId = normalizeString(req.body?.projectId ?? req.body?.project_id);
    const sessionIdInput = req.body?.sessionId ?? req.body?.session_id;
    const outlineItemIdInput = req.body?.outlineItemId ?? req.body?.outline_item_id;
    const questionText = normalizeString(req.body?.questionText ?? req.body?.question_text);
    const deferReason = normalizeString(req.body?.deferReason ?? req.body?.defer_reason);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    if (bodyProjectId && bodyProjectId !== projectId) {
      return res.status(400).json({ message: 'projectId in body must match route projectId' });
    }

    if (!questionText) {
      return res.status(400).json({ message: 'questionText is required' });
    }

    if (!deferReason) {
      return res.status(400).json({ message: 'deferReason is required' });
    }

    let sessionId = null;
    if (sessionIdInput !== undefined) {
      sessionId = normalizeString(sessionIdInput);

      if (!sessionId) {
        return res.status(400).json({ message: 'sessionId must be a non-empty string when provided' });
      }
    }

    let outlineItemId = null;
    if (outlineItemIdInput !== undefined) {
      outlineItemId = normalizeString(outlineItemIdInput);

      if (!outlineItemId) {
        return res.status(400).json({ message: 'outlineItemId must be a non-empty string when provided' });
      }
    }

    const deferredQuestion = await createForProjectSessionAndUser({
      projectId,
      sessionId,
      userId: req.user.id,
      outlineItemId,
      questionText,
      deferReason,
      status: 'deferred',
    });

    if (!deferredQuestion) {
      return res.status(404).json({ message: 'Project or session not found' });
    }

    return res.status(201).json({
      success: true,
      data: {
        deferredQuestion: mapDeferredQuestionToApi(deferredQuestion),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.mapDeferredQuestionToApi = mapDeferredQuestionToApi;
