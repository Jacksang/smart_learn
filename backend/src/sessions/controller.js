const {
  createForProjectAndUser,
  findActiveByProjectForUser,
  findByIdForProjectAndUser,
  updateSessionState,
  createProgressSnapshot,
  getProgressSnapshots,
  getSessionSummary,
  upsertSessionSummary,
  recordModeSwitch,
  getModeHistory,
  pauseSession,
  resumeSession,
  updateSessionProgress,
  endSession,
  switchSessionMode,
  mapSessionRow,
  mapSessionRowExtended,
} = require('./repository');
const {
  buildSessionStateUpdates,
  mapSessionState,
  normalizeSessionMode,
  normalizeCurrentTopicId,
  generateSessionSummary,
  calculateSessionStats,
  identifyWeakTopics,
  getRecommendedActions,
} = require('./service');

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

exports.getCurrentProjectSession = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const activeSession = await findActiveByProjectForUser({
      projectId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        session: mapSessionToApi(activeSession),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProjectSessionState = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const sessionId = normalizeString(req.params.sessionId);
    const bodyProjectId = readBodyProjectId(req.body);
    const bodySessionId = normalizeString(req.body?.sessionId ?? req.body?.session_id);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    if (bodyProjectId && bodyProjectId !== projectId) {
      return res.status(400).json({ message: 'projectId in body must match route projectId' });
    }

    if ((req.body?.sessionId !== undefined || req.body?.session_id !== undefined) && !bodySessionId) {
      return res.status(400).json({ message: 'sessionId must be a non-empty string when provided' });
    }

    if (bodySessionId && bodySessionId !== sessionId) {
      return res.status(400).json({ message: 'sessionId in body must match route sessionId' });
    }

    let updates;
    try {
      updates = buildSessionStateUpdates(req.body ?? {});
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'At least one of mode or currentOutlineItemId is required' });
    }

    const updatedSession = await updateSessionState({
      sessionId,
      projectId,
      userId: req.user.id,
      updates,
    });

    if (!updatedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: mapSessionToApi(updatedSession),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.mapSessionToApi = mapSessionToApi;

// ── New session lifecycle & detail functions ────────────────────────────────

const VALID_MODES = ['learn', 'review', 'quiz', 'reinforce'];

exports.pauseProjectSession = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active sessions can be paused' });
    }

    const reason = normalizeString(req.body?.reason) ?? null;
    const result = await pauseSession(sessionId, reason);

    return res.status(200).json({
      success: true,
      data: { session: mapSessionRowExtended(result) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.resumeProjectSession = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'paused') {
      return res.status(400).json({ success: false, message: 'Only paused sessions can be resumed' });
    }

    const result = await resumeSession(sessionId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    return res.status(200).json({
      success: true,
      data: { session: mapSessionRowExtended(result) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProjectSessionProgress = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const body = req.body ?? {};
    const progress = body.progress;
    const currentQuestionId = normalizeString(body.currentQuestionId);
    const currentOutlineItemId = body.outlineItemId ?? readCurrentOutlineItemId(body);
    const sessionDuration = body.timeSpentInSession;
    const currentMode = body.mode;
    const metadata = body.metadata;

    const updatedSession = await updateSessionProgress(sessionId, {
      progress,
      currentQuestionId,
      currentOutlineItemId,
      sessionDuration,
      currentMode,
      metadata,
    });

    const snapshot = await createProgressSnapshot(sessionId, {
      progress,
      currentOutlineItemId,
      currentQuestionId,
      questionsAnswered: body.questionsAnswered,
      correctAnswers: body.correctAnswers,
      timeSpent: sessionDuration,
      mood: body.mood,
      notes: body.notes,
      data: metadata,
    });

    return res.status(200).json({
      success: true,
      data: { session: mapSessionRowExtended(updatedSession), snapshot },
    });
  } catch (error) {
    return next(error);
  }
};

exports.endProjectSession = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Session is already completed' });
    }

    const duration = req.body?.duration ?? 0;
    const endedSession = await endSession(sessionId, duration);
    const summary = await generateSessionSummary(sessionId);

    return res.status(200).json({
      success: true,
      data: { session: mapSessionRowExtended(endedSession), summary },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectSessionDetails = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const progress = await getProgressSnapshots(sessionId);
    const summary = await getSessionSummary(sessionId);

    return res.status(200).json({
      success: true,
      data: { session: mapSessionRowExtended(session), progress, summary },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectSessionProgress = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const snapshots = await getProgressSnapshots(sessionId);
    const latestSnapshot = Array.isArray(snapshots) && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const stats = await calculateSessionStats(sessionId);

    return res.status(200).json({
      success: true,
      data: {
        progress: {
          currentProgress: latestSnapshot?.progress ?? 0,
          timeSpent: latestSnapshot?.timeSpent ?? 0,
          questionsAnswered: latestSnapshot?.questionsAnswered ?? 0,
          correctAnswers: latestSnapshot?.correctAnswers ?? 0,
          accuracy: latestSnapshot?.questionsAnswered
            ? Math.round((latestSnapshot.correctAnswers / latestSnapshot.questionsAnswered) * 100)
            : 0,
          ...stats,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.switchProjectSessionMode = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const newMode = normalizeString(req.body?.mode);

    if (!newMode) {
      return res.status(400).json({ success: false, message: 'mode is required' });
    }

    if (!VALID_MODES.includes(newMode)) {
      return res.status(400).json({ success: false, message: 'Invalid mode. Must be one of: learn, review, quiz, reinforce' });
    }

    const oldMode = session.mode ?? session.current_mode ?? null;
    const updatedSession = await switchSessionMode(sessionId, newMode);
    const modeInfo = await recordModeSwitch(sessionId, oldMode, newMode, req.body?.reason ?? null);

    return res.status(200).json({
      success: true,
      data: {
        session: mapSessionRowExtended(updatedSession),
        previousMode: oldMode,
        modeInfo,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectSessionModeHistory = async (req, res, next) => {
  try {
    const sessionId = normalizeString(req.params.sessionId);
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await findByIdForProjectAndUser({ sessionId, projectId: normalizeString(req.params.projectId), userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const modeHistory = await getModeHistory(sessionId);

    const modeDistribution = {};
    if (Array.isArray(modeHistory)) {
      for (const entry of modeHistory) {
        const mode = entry.newMode ?? entry.new_mode ?? entry.mode;
        if (mode) {
          modeDistribution[mode] = (modeDistribution[mode] || 0) + 1;
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: { modeHistory, modeDistribution },
    });
  } catch (error) {
    return next(error);
  }
};
