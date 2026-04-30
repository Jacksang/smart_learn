const repository = require('./repository');
const db = require('../../config/database');

const SESSION_MODES = ['learn', 'review', 'quiz', 'reinforce'];

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSessionMode(value, { allowNull = false, fieldName = 'mode' } = {}) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    throw new Error(`${fieldName} is required`);
  }

  const normalized = normalizeWhitespace(value).toLowerCase();

  if (!normalized) {
    if (allowNull) {
      return null;
    }

    throw new Error(`${fieldName} is required`);
  }

  if (!SESSION_MODES.includes(normalized)) {
    throw new Error(`Unsupported session mode: ${value}`);
  }

  return normalized;
}

function normalizeCurrentTopicId(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  return normalized || null;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readModeInput(input = {}) {
  if (hasOwn(input, 'mode')) {
    return {
      present: true,
      value: input.mode,
      fieldName: 'mode',
    };
  }

  if (hasOwn(input, 'currentMode')) {
    return {
      present: true,
      value: input.currentMode,
      fieldName: 'currentMode',
    };
  }

  if (hasOwn(input, 'current_mode')) {
    return {
      present: true,
      value: input.current_mode,
      fieldName: 'current_mode',
    };
  }

  return {
    present: false,
    value: undefined,
    fieldName: 'mode',
  };
}

function readTopicInput(input = {}) {
  if (hasOwn(input, 'currentOutlineItemId')) {
    return input.currentOutlineItemId;
  }

  if (hasOwn(input, 'current_outline_item_id')) {
    return input.current_outline_item_id;
  }

  if (hasOwn(input, 'currentTopicId')) {
    return input.currentTopicId;
  }

  if (hasOwn(input, 'current_topic_id')) {
    return input.current_topic_id;
  }

  return undefined;
}

function buildSessionStateUpdates(input = {}) {
  const updates = {};
  const modeInput = readModeInput(input);
  const topicInput = readTopicInput(input);

  if (modeInput.present) {
    updates.mode = normalizeSessionMode(modeInput.value, {
      fieldName: modeInput.fieldName,
    });
  }

  if (topicInput !== undefined) {
    updates.current_outline_item_id = normalizeCurrentTopicId(topicInput);
  }

  return updates;
}

function mapSessionState(session) {
  if (!session) {
    return null;
  }

  return {
    ...session,
    mode: normalizeSessionMode(session.mode),
    currentTopicId: normalizeCurrentTopicId(session.currentTopicId ?? session.currentOutlineItemId),
    currentOutlineItemId: normalizeCurrentTopicId(session.currentOutlineItemId ?? session.currentTopicId),
  };
}

// ─── Summary Generation ────────────────────────────────────────────────

async function calculateSessionStats(sessionId) {
  const snapshots = await repository.getProgressSnapshots(sessionId, 100);

  if (!snapshots || snapshots.length === 0) {
    return {
      totalTimeSpent: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      accuracy: 0,
      progressDelta: 0,
      snapshotCount: 0,
    };
  }

  let totalTimeSpent = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;

  for (const snap of snapshots) {
    totalTimeSpent += Number(snap.time_spent) || 0;
    totalQuestions += Number(snap.questions_answered) || 0;
    totalCorrect += Number(snap.correct_answers) || 0;
  }

  const accuracy = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const firstProgress = Number(snapshots[snapshots.length - 1]?.progress) || 0;
  const lastProgress = Number(snapshots[0]?.progress) || 0;
  const progressDelta = lastProgress - firstProgress;

  return {
    totalTimeSpent,
    totalQuestions,
    totalCorrect,
    accuracy,
    progressDelta,
    snapshotCount: snapshots.length,
  };
}

async function identifyWeakTopics(sessionId) {
  const snapshots = await repository.getProgressSnapshots(sessionId, 100);

  if (!snapshots || snapshots.length === 0) {
    return [];
  }

  // Aggregate per-topic performance from snapshot data JSONB fields
  const topicStats = {};

  for (const snap of snapshots) {
    const data = snap.data;
    if (!data) continue;

    // Support both raw JSONB (already parsed by pg) and stringified JSONB
    const parsed = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
    if (!parsed) continue;

    const topics = parsed.topics || parsed.topicPerformance || [];
    for (const topic of topics) {
      const name = topic.topicName || topic.name || topic.topic || 'Unknown';
      if (!topicStats[name]) {
        topicStats[name] = { correctCount: 0, totalCount: 0 };
      }
      topicStats[name].correctCount += Number(topic.correct) || 0;
      topicStats[name].totalCount += Number(topic.total) || 0;
    }

    // Also check per-question data that might include topic info
    const questions = parsed.questions || [];
    for (const q of questions) {
      const name = q.topicName || q.topic || q.category || 'Unknown';
      if (!topicStats[name]) {
        topicStats[name] = { correctCount: 0, totalCount: 0 };
      }
      topicStats[name].totalCount += 1;
      if (q.correct || q.isCorrect) {
        topicStats[name].correctCount += 1;
      }
    }
  }

  // Convert to array with accuracy
  const results = Object.entries(topicStats).map(([topicName, stats]) => ({
    topicName,
    correctCount: stats.correctCount,
    totalCount: stats.totalCount,
    accuracy: stats.totalCount > 0
      ? Math.round((stats.correctCount / stats.totalCount) * 100)
      : 0,
  }));

  return results;
}

async function getRecommendedActions(sessionId) {
  const topics = await identifyWeakTopics(sessionId);
  const recommendations = [];

  // Weak topics: <60% accuracy
  const weakTopics = topics.filter((t) => t.accuracy < 60 && t.totalCount >= 2);

  for (const topic of weakTopics) {
    recommendations.push({
      type: topic.accuracy < 30 ? 'review' : 'practice',
      title: `${topic.accuracy < 30 ? 'Review' : 'Practice'}: ${topic.topicName}`,
      description: `Focus on ${topic.topicName} — current accuracy is ${topic.accuracy}% (${topic.correctCount}/${topic.totalCount}).`,
      estimatedTime: topic.accuracy < 30 ? 10 : 5,
    });
  }

  // Always add a generic review recommendation
  recommendations.push({
    type: 'review',
    title: 'Quick Review',
    description: 'Review key concepts from this session',
    estimatedTime: 5,
  });

  return recommendations;
}

async function generateSessionSummary(sessionId) {
  const snapshots = await repository.getProgressSnapshots(sessionId, 100);
  const stats = await calculateSessionStats(sessionId);
  const topics = await identifyWeakTopics(sessionId);

  // Identify weak areas: topics with <60% correct
  const weakAreas = topics.filter((t) => t.accuracy < 60 && t.totalCount >= 2);

  // Identify strengths: topics with >=80% correct
  const strengths = topics.filter((t) => t.accuracy >= 80 && t.totalCount >= 2);

  // Generate recommendations
  const recommendations = await getRecommendedActions(sessionId);

  // Mastery change: compare first and last snapshot progress
  let masteryChange = 0;
  if (snapshots && snapshots.length >= 2) {
    const firstProgress = Number(snapshots[snapshots.length - 1]?.progress) || 0;
    const lastProgress = Number(snapshots[0]?.progress) || 0;
    masteryChange = lastProgress - firstProgress;
  }

  // Build summary text
  let summaryText = `You spent ${stats.totalTimeSpent} minutes learning. `;
  summaryText += `You answered ${stats.totalQuestions} questions with ${stats.totalCorrect} correct (${stats.accuracy}% accuracy).`;

  if (strengths.length > 0) {
    const strengthNames = strengths.map((s) => s.topicName).join(', ');
    summaryText += ` Strong areas: ${strengthNames}.`;
  }

  if (weakAreas.length > 0) {
    const weakNames = weakAreas.map((w) => `${w.topicName} (${w.accuracy}%)`).join(', ');
    summaryText += ` Needs work: ${weakNames}.`;
  }

  // Build summary data for persistence
  const summaryData = {
    title: `Session Summary`,
    summary: summaryText,
    insights: topics.length > 0 ? topics : null,
    weakAreas: weakAreas.length > 0 ? weakAreas : null,
    strengths: strengths.length > 0 ? strengths : null,
    nextRecommendations: recommendations.length > 0 ? recommendations : null,
    masteryChange,
    timeSpent: stats.totalTimeSpent,
    questionsAttempted: stats.totalQuestions,
    questionsCorrect: stats.totalCorrect,
    accuracy: stats.accuracy,
  };

  // Persist via repository
  await repository.upsertSessionSummary(sessionId, summaryData);

  return summaryData;
}

// ─── Exports ───────────────────────────────────────────────────────────

module.exports = {
  SESSION_MODES,
  normalizeWhitespace,
  normalizeSessionMode,
  normalizeCurrentTopicId,
  buildSessionStateUpdates,
  mapSessionState,
  generateSessionSummary,
  calculateSessionStats,
  identifyWeakTopics,
  getRecommendedActions,
};
