function clampPercent(value) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return Math.min(100, Math.max(0, numeric));
}

function roundToTwoDecimals(value) {
  return Math.round(clampPercent(value) * 100) / 100;
}

function deriveCompletionPercent({ answeredQuestionCount = 0, totalQuestionCount = 0 }) {
  if (!totalQuestionCount) {
    return 0;
  }

  return roundToTwoDecimals((answeredQuestionCount / totalQuestionCount) * 100);
}

function deriveMasteryScore({ averageScore = null, recentAttemptCount = 0, recentCorrectAttemptCount = 0, totalAttemptCount = 0 }) {
  if (!totalAttemptCount) {
    return 0;
  }

  const baseScore = averageScore === null ? 0 : clampPercent(averageScore);
  const recentScore = recentAttemptCount > 0
    ? (recentCorrectAttemptCount / recentAttemptCount) * 100
    : baseScore;

  return roundToTwoDecimals((baseScore * 0.7) + (recentScore * 0.3));
}

function deriveProgressState({ completionPercent = 0, masteryScore = 0, totalAttemptCount = 0 }) {
  if (totalAttemptCount === 0 && completionPercent === 0) {
    return 'not_started';
  }

  if (masteryScore < 40) {
    return 'struggling';
  }

  if (masteryScore >= 85 && completionPercent >= 80) {
    return 'mastered';
  }

  if (masteryScore >= 70) {
    return 'strong';
  }

  return 'in_progress';
}

function toSnapshotArea(topicSnapshot) {
  return {
    outlineItemId: topicSnapshot.outline_item_id,
    title: topicSnapshot.title,
    masteryScore: topicSnapshot.mastery_score,
    completionPercent: topicSnapshot.completion_percent,
    progressState: topicSnapshot.progress_state,
    answeredQuestionCount: topicSnapshot.answered_question_count,
    totalQuestionCount: topicSnapshot.total_question_count,
    totalAttemptCount: topicSnapshot.total_attempt_count,
  };
}

function compareTopicSnapshots(a, b) {
  return (
    a.mastery_score - b.mastery_score
    || a.completion_percent - b.completion_percent
    || (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER)
    || String(a.title || '').localeCompare(String(b.title || ''))
    || String(a.outline_item_id || '').localeCompare(String(b.outline_item_id || ''))
  );
}

function compareStrengthSnapshots(a, b) {
  return (
    b.mastery_score - a.mastery_score
    || b.completion_percent - a.completion_percent
    || (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER)
    || String(a.title || '').localeCompare(String(b.title || ''))
    || String(a.outline_item_id || '').localeCompare(String(b.outline_item_id || ''))
  );
}

function deriveWeakAndStrengthAreas(topicSnapshots = []) {
  const meaningfulSnapshots = topicSnapshots.filter(
    (snapshot) => snapshot.answered_question_count > 0 || snapshot.total_attempt_count > 0
  );

  const weakAreas = meaningfulSnapshots
    .filter((snapshot) => snapshot.mastery_score < 60)
    .sort(compareTopicSnapshots)
    .map(toSnapshotArea);

  const strengthAreas = meaningfulSnapshots
    .filter((snapshot) => snapshot.mastery_score >= 80)
    .sort(compareStrengthSnapshots)
    .map(toSnapshotArea);

  return {
    weakAreas,
    strengthAreas,
  };
}

function buildProgressSummary({ projectSnapshot, weakAreas = [], strengthAreas = [] }) {
  if (!projectSnapshot || projectSnapshot.progress_state === 'not_started') {
    return 'No learning activity yet. Answer questions to generate progress insights.';
  }

  const stateLabel = projectSnapshot.progress_state.replace(/_/g, ' ');
  const parts = [
    `Project is ${stateLabel} with ${projectSnapshot.completion_percent}% completion and ${projectSnapshot.mastery_score}% mastery.`,
  ];

  if (weakAreas.length > 0) {
    parts.push(`Weak areas: ${weakAreas.slice(0, 3).map((area) => area.title).join(', ')}.`);
  }

  if (strengthAreas.length > 0) {
    parts.push(`Strength areas: ${strengthAreas.slice(0, 3).map((area) => area.title).join(', ')}.`);
  }

  return parts.join(' ');
}

function buildSnapshotBase(aggregate = {}, snapshotType) {
  const completionPercent = deriveCompletionPercent({
    answeredQuestionCount: aggregate.answered_question_count,
    totalQuestionCount: aggregate.total_question_count,
  });

  const masteryScore = deriveMasteryScore({
    averageScore: aggregate.average_score,
    recentAttemptCount: aggregate.recent_attempt_count,
    recentCorrectAttemptCount: aggregate.recent_correct_attempt_count,
    totalAttemptCount: aggregate.total_attempt_count,
  });

  return {
    project_id: aggregate.project_id,
    outline_item_id: aggregate.outline_item_id ?? null,
    snapshot_type: snapshotType,
    title: aggregate.outline_item_title || null,
    outline_item_level: aggregate.outline_item_level ?? null,
    parent_item_id: aggregate.parent_item_id ?? null,
    order_index: aggregate.order_index ?? null,
    total_question_count: aggregate.total_question_count || 0,
    answered_question_count: aggregate.answered_question_count || 0,
    total_attempt_count: aggregate.total_attempt_count || 0,
    correct_attempt_count: aggregate.correct_attempt_count || 0,
    recent_attempt_count: aggregate.recent_attempt_count || 0,
    recent_correct_attempt_count: aggregate.recent_correct_attempt_count || 0,
    completion_percent: completionPercent,
    mastery_score: masteryScore,
    progress_state: deriveProgressState({
      completionPercent,
      masteryScore,
      totalAttemptCount: aggregate.total_attempt_count || 0,
    }),
    weak_areas: [],
    strength_areas: [],
    summary_text: null,
  };
}

function buildTopicProgressSnapshots(topicAggregates = []) {
  return topicAggregates.map((aggregate) => buildSnapshotBase(aggregate, 'topic'));
}

function buildProjectProgressSnapshot(aggregate = {}, topicSnapshots = []) {
  const projectSnapshot = buildSnapshotBase(aggregate, 'project');
  const { weakAreas, strengthAreas } = deriveWeakAndStrengthAreas(topicSnapshots);

  return {
    ...projectSnapshot,
    weak_areas: weakAreas,
    strength_areas: strengthAreas,
    summary_text: buildProgressSummary({
      projectSnapshot,
      weakAreas,
      strengthAreas,
    }),
  };
}

module.exports = {
  deriveCompletionPercent,
  deriveMasteryScore,
  deriveProgressState,
  deriveWeakAndStrengthAreas,
  buildProgressSummary,
  buildTopicProgressSnapshots,
  buildProjectProgressSnapshot,
};
