const { normalizeSessionMode, normalizeCurrentTopicId } = require('../sessions/service');

const RECOVERY_ACTIONS = ['continue', 'review', 'reinforce', 'fallback_easier_question'];
const LOW_CONFIDENCE_THRESHOLD = 0.4;
const MIN_CONFIDENCE_DROP = 0.25;
const MAX_RECENT_ATTEMPTS = 5;
const DIFFICULTY_LEVEL_ORDER = ['easy', 'medium', 'hard'];
const QUESTION_TYPE_EASINESS_ORDER = ['true_false', 'multiple_choice', 'short_answer'];

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

function normalizeDifficultyLevel(value) {
  const normalized = normalizeNullableText(value)?.toLowerCase() || null;
  return DIFFICULTY_LEVEL_ORDER.includes(normalized) ? normalized : null;
}

function normalizeQuestionType(value) {
  const normalized = normalizeNullableText(value)?.toLowerCase() || null;
  return QUESTION_TYPE_EASINESS_ORDER.includes(normalized) ? normalized : normalized;
}

function normalizeQuestionCandidate(question = {}) {
  return {
    id: normalizeNullableText(question.id ?? question.questionId ?? question.question_id),
    outlineItemId: normalizeCurrentTopicId(
      question.outlineItemId
      ?? question.outline_item_id
      ?? question.currentOutlineItemId
      ?? question.current_outline_item_id
      ?? question.topicId
      ?? question.topic_id
    ),
    difficultyLevel: normalizeDifficultyLevel(question.difficultyLevel ?? question.difficulty_level),
    questionType: normalizeQuestionType(question.questionType ?? question.question_type),
    prompt: normalizeNullableText(question.prompt),
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

function getDifficultyRank(value) {
  const index = DIFFICULTY_LEVEL_ORDER.indexOf(normalizeDifficultyLevel(value));
  return index === -1 ? null : index;
}

function getQuestionTypeRank(value) {
  const index = QUESTION_TYPE_EASINESS_ORDER.indexOf(normalizeQuestionType(value));
  return index === -1 ? QUESTION_TYPE_EASINESS_ORDER.length : index;
}

function selectEasierFallbackQuestion({
  struggleSignals = {},
  session = {},
  recentAttempts = [],
  questionCandidates = [],
  currentQuestion = {},
} = {}) {
  if (!struggleSignals.isStruggling) {
    return null;
  }

  const normalizedSession = normalizeSessionState(session);
  const normalizedCurrentQuestion = normalizeQuestionCandidate(currentQuestion);
  const targetOutlineItemId = struggleSignals.targetOutlineItemId || normalizedCurrentQuestion.outlineItemId || normalizedSession.currentOutlineItemId;
  const currentQuestionDifficultyRank = getDifficultyRank(normalizedCurrentQuestion.difficultyLevel);
  const attemptedQuestionIds = new Set(
    recentAttempts
      .map((attempt) => normalizeNullableText(attempt.questionId ?? attempt.question_id))
      .filter(Boolean)
  );

  const rankedCandidates = questionCandidates
    .map(normalizeQuestionCandidate)
    .filter((candidate) => candidate.id)
    .filter((candidate) => candidate.id !== normalizedCurrentQuestion.id)
    .filter((candidate) => !attemptedQuestionIds.has(candidate.id))
    .map((candidate) => {
      const candidateDifficultyRank = getDifficultyRank(candidate.difficultyLevel);
      const sameTopic = Boolean(targetOutlineItemId) && candidate.outlineItemId === targetOutlineItemId;
      const easierThanCurrent = currentQuestionDifficultyRank !== null
        ? candidateDifficultyRank !== null && candidateDifficultyRank < currentQuestionDifficultyRank
        : candidate.difficultyLevel === 'easy';

      return {
        candidate,
        sameTopic,
        easierThanCurrent,
        difficultyRank: candidateDifficultyRank,
        questionTypeRank: getQuestionTypeRank(candidate.questionType),
      };
    })
    .filter(({ candidate, sameTopic, easierThanCurrent }) => {
      if (targetOutlineItemId) {
        return sameTopic && easierThanCurrent;
      }

      return easierThanCurrent || candidate.difficultyLevel === 'easy';
    })
    .sort((left, right) => {
      if (Number(right.sameTopic) !== Number(left.sameTopic)) {
        return Number(right.sameTopic) - Number(left.sameTopic);
      }

      if (Number(right.easierThanCurrent) !== Number(left.easierThanCurrent)) {
        return Number(right.easierThanCurrent) - Number(left.easierThanCurrent);
      }

      if ((left.difficultyRank ?? Number.MAX_SAFE_INTEGER) !== (right.difficultyRank ?? Number.MAX_SAFE_INTEGER)) {
        return (left.difficultyRank ?? Number.MAX_SAFE_INTEGER) - (right.difficultyRank ?? Number.MAX_SAFE_INTEGER);
      }

      if (left.questionTypeRank !== right.questionTypeRank) {
        return left.questionTypeRank - right.questionTypeRank;
      }

      return (left.candidate.id || '').localeCompare(right.candidate.id || '');
    });

  if (rankedCandidates.length === 0) {
    return null;
  }

  const selected = rankedCandidates[0].candidate;

  return {
    questionId: selected.id,
    outlineItemId: selected.outlineItemId || targetOutlineItemId || null,
    difficultyLevel: selected.difficultyLevel,
    questionType: selected.questionType,
    prompt: selected.prompt,
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
  const easierQuestionFallback = recommendedAction === 'fallback_easier_question'
    ? selectEasierFallbackQuestion({
      struggleSignals,
      session: input.session,
      recentAttempts: input.recentAttempts,
      questionCandidates: input.questionCandidates,
      currentQuestion: input.currentQuestion,
    })
    : null;

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
    easierQuestionFallback,
    signals: struggleSignals.signals,
  };
}

function buildRecoverySummary(input = {}) {
  const recommendation = getRecoveryRecommendation(input);
  const weakArea = (input.weakAreas || [])
    .map(normalizeWeakArea)
    .find((area) => area.outlineItemId && area.outlineItemId === recommendation.targetOutlineItemId);

  const weakAreaLabel = weakArea?.title
    || recommendation.targetOutlineItemId
    || 'current topic';

  if (!recommendation.isStruggling) {
    return {
      isStruggling: false,
      weakArea: null,
      recoveryAction: 'continue',
      summaryMessage: 'You kept a steady pace in this session. Keep going with the next topic when you’re ready.',
      nextStep: 'Continue with the next planned question or topic.' ,
      recommendation,
    };
  }

  const actionSummaryMap = {
    review: {
      summaryMessage: `We slowed down around ${weakAreaLabel} to make the core idea clearer.`,
      nextStep: `Do one short recap on ${weakAreaLabel} before moving back into full difficulty.`,
    },
    reinforce: {
      summaryMessage: `We shifted into support mode around ${weakAreaLabel} so you could rebuild confidence without extra pressure.`,
      nextStep: `Come back to ${weakAreaLabel} with one guided example or confidence-building practice step.`,
    },
    fallback_easier_question: {
      summaryMessage: `We stepped down the difficulty on ${weakAreaLabel} to lock in the foundation first.`,
      nextStep: `Try one easier check on ${weakAreaLabel}, then move back up once it feels steadier.`,
    },
    continue: {
      summaryMessage: `You stayed on track with ${weakAreaLabel}.`,
      nextStep: `Continue building on ${weakAreaLabel} at the current pace.`,
    },
  };

  const selectedSummary = actionSummaryMap[recommendation.recommendedAction] || actionSummaryMap.reinforce;

  return {
    isStruggling: true,
    weakArea: {
      outlineItemId: recommendation.targetOutlineItemId,
      title: weakArea?.title || null,
    },
    recoveryAction: recommendation.recommendedAction,
    summaryMessage: selectedSummary.summaryMessage,
    nextStep: selectedSummary.nextStep,
    recommendation,
  };
}

module.exports = {
  RECOVERY_ACTIONS,
  LOW_CONFIDENCE_THRESHOLD,
  MIN_CONFIDENCE_DROP,
  detectStruggleSignals,
  chooseRecoveryAction,
  selectEasierFallbackQuestion,
  getRecoveryRecommendation,
  buildRecoverySummary,
};
