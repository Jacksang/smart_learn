const { normalizeSessionMode, normalizeCurrentTopicId } = require('../sessions/service');

const RECOVERY_ACTIONS = ['continue', 'review', 'reinforce', 'fallback_easier_question'];
const LOW_CONFIDENCE_THRESHOLD = 0.4;
const MIN_CONFIDENCE_DROP = 0.25;
const MAX_RECENT_ATTEMPTS = 5;

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeNullableText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  return normalized || null;
}

function normalizeNumericConfidence(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric > 1) {
    return Math.min(1, Math.max(0, numeric / 100));
  }

  return Math.min(1, Math.max(0, numeric));
}

function normalizeAttempt(attempt = {}) {
  const outlineItemId = normalizeCurrentTopicId(
    attempt.outlineItemId
      ?? attempt.outline_item_id
      ?? attempt.currentOutlineItemId
      ?? attempt.current_outline_item_id
      ?? attempt.topicId
      ?? attempt.topic_id
  );

  const isCorrect = hasOwn(attempt, 'isCorrect')
    ? Boolean(attempt.isCorrect)
    : hasOwn(attempt, 'is_correct')
      ? Boolean(attempt.is_correct)
      : typeof attempt.score === 'number'
        ? attempt.score >= 100
        : typeof attempt.score === 'string' && attempt.score.trim() !== ''
          ? Number(attempt.score) >= 100
          : null;

  return {
    outlineItemId,
    isCorrect,
    confidence: normalizeNumericConfidence(
      attempt.confidence
      ?? attempt.confidenceScore
      ?? attempt.confidence_score
      ?? attempt.selfReportedConfidence
      ?? attempt.self_reported_confidence
    ),
  };
}

function normalizeWeakArea(area = {}) {
  return {
    outlineItemId: normalizeCurrentTopicId(area.outlineItemId ?? area.outline_item_id),
    progressState: normalizeNullableText(area.progressState ?? area.progress_state)?.toLowerCase() || null,
    title: normalizeNullableText(area.title),
  };
}

function normalizeSessionState(session = {}) {
  const mode = session.mode === undefined && session.currentMode === undefined && session.current_mode === undefined
    ? 'learn'
    : normalizeSessionMode(session.mode ?? session.currentMode ?? session.current_mode);

  const currentOutlineItemId = normalizeCurrentTopicId(
    session.currentOutlineItemId
    ?? session.current_outline_item_id
    ?? session.currentTopicId
    ?? session.current_topic_id
    ?? null
  );

  return {
    mode,
    currentOutlineItemId,
    confidence: normalizeNumericConfidence(
      session.confidence
      ?? session.confidenceScore
      ?? session.confidence_score
      ?? session.selfReportedConfidence
      ?? session.self_reported_confidence
    ),
    priorConfidence: normalizeNumericConfidence(
      session.priorConfidence
      ?? session.previousConfidence
      ?? session.previous_confidence
      ?? session.baselineConfidence
      ?? session.baseline_confidence
    ),
    progressState: normalizeNullableText(session.progressState ?? session.progress_state)?.toLowerCase() || null,
  };
}

function getRecentAttemptsForTarget(attempts = [], targetOutlineItemId = null) {
  const normalizedAttempts = attempts.map(normalizeAttempt);
  const recentAttempts = normalizedAttempts.slice(-MAX_RECENT_ATTEMPTS);

  if (!targetOutlineItemId) {
    return recentAttempts;
  }

  return recentAttempts.filter((attempt) => attempt.outlineItemId === targetOutlineItemId);
}

function detectStruggleSignals({ recentAttempts = [], session = {}, weakAreas = [] } = {}) {
  const normalizedSession = normalizeSessionState(session);
  const targetOutlineItemId = normalizedSession.currentOutlineItemId;
  const attemptsForTarget = getRecentAttemptsForTarget(recentAttempts, targetOutlineItemId);
  const incorrectAttempts = attemptsForTarget.filter((attempt) => attempt.isCorrect === false);
  const weakArea = weakAreas
    .map(normalizeWeakArea)
    .find((area) => area.outlineItemId && area.outlineItemId === targetOutlineItemId);

  const sessionProgressStruggling = normalizedSession.progressState === 'struggling';
  const weakAreaStruggling = weakArea?.progressState === 'struggling';
  const hasWeakAreaHit = Boolean(weakArea);
  const confidenceDrop = normalizedSession.confidence !== null
    && normalizedSession.priorConfidence !== null
    && (normalizedSession.priorConfidence - normalizedSession.confidence) >= MIN_CONFIDENCE_DROP;
  const lowConfidence = normalizedSession.confidence !== null
    && normalizedSession.confidence <= LOW_CONFIDENCE_THRESHOLD;
  const recentIncorrectStreak = incorrectAttempts.length;
  const lastAttemptIncorrect = attemptsForTarget.length > 0
    && attemptsForTarget[attemptsForTarget.length - 1].isCorrect === false;

  if (sessionProgressStruggling || weakAreaStruggling) {
    return {
      isStruggling: true,
      reason: 'Existing progress already marks this topic as struggling.',
      reasonCode: 'progress_state_struggling',
      currentMode: normalizedSession.mode,
      targetOutlineItemId,
      signals: {
        sessionProgressStruggling,
        weakAreaStruggling,
        hasWeakAreaHit,
        confidenceDrop,
        lowConfidence,
        recentIncorrectStreak,
        lastAttemptIncorrect,
      },
    };
  }

  if (recentIncorrectStreak >= 2) {
    return {
      isStruggling: true,
      reason: 'Repeated incorrect attempts on the same topic indicate the learner is struggling.',
      reasonCode: 'repeated_incorrect_attempts',
      currentMode: normalizedSession.mode,
      targetOutlineItemId,
      signals: {
        sessionProgressStruggling,
        weakAreaStruggling,
        hasWeakAreaHit,
        confidenceDrop,
        lowConfidence,
        recentIncorrectStreak,
        lastAttemptIncorrect,
      },
    };
  }

  if (recentIncorrectStreak >= 1 && hasWeakAreaHit) {
    return {
      isStruggling: true,
      reason: 'A new miss on an existing weak area suggests reinforcement is needed.',
      reasonCode: 'incorrect_attempt_on_weak_area',
      currentMode: normalizedSession.mode,
      targetOutlineItemId,
      signals: {
        sessionProgressStruggling,
        weakAreaStruggling,
        hasWeakAreaHit,
        confidenceDrop,
        lowConfidence,
        recentIncorrectStreak,
        lastAttemptIncorrect,
      },
    };
  }

  if (confidenceDrop && lowConfidence) {
    return {
      isStruggling: true,
      reason: 'Confidence dropped sharply and is now low, so the learner likely needs recovery support.',
      reasonCode: 'confidence_drop',
      currentMode: normalizedSession.mode,
      targetOutlineItemId,
      signals: {
        sessionProgressStruggling,
        weakAreaStruggling,
        hasWeakAreaHit,
        confidenceDrop,
        lowConfidence,
        recentIncorrectStreak,
        lastAttemptIncorrect,
      },
    };
  }

  return {
    isStruggling: false,
    reason: 'No strong struggle signal was detected.',
    reasonCode: 'stable',
    currentMode: normalizedSession.mode,
    targetOutlineItemId,
    signals: {
      sessionProgressStruggling,
      weakAreaStruggling,
      hasWeakAreaHit,
      confidenceDrop,
      lowConfidence,
      recentIncorrectStreak,
      lastAttemptIncorrect,
    },
  };
}

function buildSupportMessage({ recommendedAction, reasonCode }) {
  switch (recommendedAction) {
    case 'fallback_easier_question':
      return 'This concept is still wobbly, so let’s switch to a simpler version and lock in the foundation.';
    case 'reinforce':
      return reasonCode === 'confidence_drop'
        ? 'Let’s lower the pressure and get one small win first.'
        : 'No problem. This just means we need a steadier ramp, not more pressure.';
    case 'review':
      return 'Let’s slow it down and isolate the key idea before we push ahead.';
    case 'continue':
    default:
      return 'Nice work — you can keep building from here.';
  }
}

function chooseRecoveryAction(struggleSignals = {}) {
  if (!struggleSignals.isStruggling) {
    return 'continue';
  }

  if (struggleSignals.reasonCode === 'repeated_incorrect_attempts') {
    return 'fallback_easier_question';
  }

  if (struggleSignals.reasonCode === 'confidence_drop') {
    return 'reinforce';
  }

  if (struggleSignals.currentMode === 'quiz') {
    return 'review';
  }

  return 'reinforce';
}

function getRecoveryRecommendation(input = {}) {
  const struggleSignals = detectStruggleSignals(input);
  const recommendedAction = chooseRecoveryAction(struggleSignals);

  return {
    isStruggling: struggleSignals.isStruggling,
    reason: struggleSignals.reason,
    reasonCode: struggleSignals.reasonCode,
    recommendedAction,
    currentMode: struggleSignals.currentMode,
    targetOutlineItemId: struggleSignals.targetOutlineItemId,
    supportMessage: buildSupportMessage({
      recommendedAction,
      reasonCode: struggleSignals.reasonCode,
    }),
    signals: struggleSignals.signals,
  };
}

module.exports = {
  RECOVERY_ACTIONS,
  LOW_CONFIDENCE_THRESHOLD,
  MIN_CONFIDENCE_DROP,
  detectStruggleSignals,
  chooseRecoveryAction,
  getRecoveryRecommendation,
};
