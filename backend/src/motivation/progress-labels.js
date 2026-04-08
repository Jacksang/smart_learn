/**
 * Motivation Engine - Progress Labels
 * Generates encouraging progress labels based on student metrics
 */

/**
 * Progress label taxonomy:
 * - effort: Time spent, attempts made, persistence
 * - focus: Session continuity, engagement depth
 * - resilience: Recovery from failure, comeback ability
 * - improvement: Skill acquisition, mastery progression
 */

const PROGRESS_LABELS = {
  // Effort Labels
  effort: [
    {
      id: 'effort_first_timer',
      displayName: 'First Timer',
      description: 'You\'re just starting - that\'s the most important step!',
      category: 'effort',
      minScore: 0,
      maxScore: 0.25,
      icon: '🌱'
    },
    {
      id: 'effort_regular',
      displayName: 'Regular Practitioner',
      description: 'Consistent practice is building your foundation.',
      category: 'effort',
      minScore: 0.25,
      maxScore: 0.5,
      icon: '📚'
    },
    {
      id: 'effort_dedicated',
      displayName: 'Dedicated Student',
      description: 'Your dedication is really paying off - keep it up!',
      category: 'effort',
      minScore: 0.5,
      maxScore: 0.75,
      icon: '💪'
    },
    {
      id: 'effort_persistent',
      displayName: 'Persistent Learner',
      description: 'Exceptional persistence! You\'re building serious skills.',
      category: 'effort',
      minScore: 0.75,
      maxScore: 1.0,
      icon: '🔥'
    }
  ],

  // Focus Labels
  focus: [
    {
      id: 'focus_beginner',
      displayName: 'Building Your Habit',
      description: 'Every session is strengthening your study muscle.',
      category: 'focus',
      minScore: 0,
      maxScore: 0.33,
      icon: '📖'
    },
    {
      id: 'focus_developing',
      displayName: 'Deepening Focus',
      description: 'Your attention span is growing - that\'s great!',
      category: 'focus',
      minScore: 0.33,
      maxScore: 0.66,
      icon: '🎯'
    },
    {
      id: 'focus_master',
      displayName: 'Deep Diver',
      description: 'You\'re in the zone - deep, meaningful learning!',
      category: 'focus',
      minScore: 0.66,
      maxScore: 0.9,
      icon: '✨'
    },
    {
      id: 'focus_flow',
      displayName: 'Flow State',
      description: 'This level of engagement is where breakthroughs happen!',
      category: 'focus',
      minScore: 0.9,
      maxScore: 1.0,
      icon: '🌊'
    }
  ],

  // Resilience Labels
  resilience: [
    {
      id: 'resilience_early',
      displayName: 'Learning to Bounce Back',
      description: 'Every recovery builds your mental strength.',
      category: 'resilience',
      minScore: 0,
      maxScore: 0.33,
      icon: '🔄'
    },
    {
      id: 'resilience_building',
      displayName: 'Bounce Back Builder',
      description: 'You\'re developing great recovery skills!',
      category: 'resilience',
      minScore: 0.33,
      maxScore: 0.66,
      icon: '💪'
    },
    {
      id: 'resilience_strong',
      displayName: 'Resilience Champion',
      description: 'Your ability to recover from challenges is impressive!',
      category: 'resilience',
      minScore: 0.66,
      maxScore: 0.9,
      icon: '⭐'
    },
    {
      id: 'resilience_champion',
      displayName: 'Comeback Queen/King',
      description: 'This comeback ability is what separates good from great!',
      category: 'resilience',
      minScore: 0.9,
      maxScore: 1.0,
      icon: '🏆'
    }
  ],

  // Improvement Labels
  improvement: [
    {
      id: 'improvement_started',
      displayName: 'Progress Starter',
      description: 'Your first steps of improvement are showing!',
      category: 'improvement',
      minScore: 0,
      maxScore: 0.25,
      icon: '🚀'
    },
    {
      id: 'improvement_accelerating',
      displayName: 'Learning Accelerator',
      description: 'Your learning curve is steep - excellent progress!',
      category: 'improvement',
      minScore: 0.25,
      maxScore: 0.5,
      icon: '⚡'
    },
    {
      id: 'improvement_mastery_approaching',
      displayName: 'Mastery in Sight',
      description: 'You\'re getting closer to true mastery of this topic!',
      category: 'improvement',
      minScore: 0.5,
      maxScore: 0.75,
      icon: '🌟'
    },
    {
      id: 'improvement_mastery',
      displayName: 'Topic Master',
      description: 'You\'ve truly mastered this concept - incredible work!',
      category: 'improvement',
      minScore: 0.75,
      maxScore: 1.0,
      icon: '👑'
    }
  ]
};

/**
 * Calculate effort score based on student metrics
 * @param {object} metrics - { totalAttempts, totalTime, sessionCount }
 * @returns {number} - Score from 0 to 1
 */
function calculateEffortScore(metrics) {
  const { totalAttempts, totalTime, sessionCount } = metrics;
  
  // Normalize metrics (adjust thresholds based on actual data)
  const attemptsScore = Math.min(totalAttempts / 50, 1); // 50+ attempts = max
  const timeScore = Math.min(totalTime / 3600, 1); // 1 hour = max
  const sessionScore = Math.min(sessionCount / 20, 1); // 20+ sessions = max
  
  // Weighted average
  const effortScore = (attemptsScore * 0.4) + (timeScore * 0.35) + (sessionScore * 0.25);
  
  return Math.min(Math.max(effortScore, 0), 1);
}

/**
 * Calculate focus score based on student metrics
 * @param {object} metrics - { sessionCount, totalTime, avgSessionLength, longestSession }
 * @returns {number} - Score from 0 to 1
 */
function calculateFocusScore(metrics) {
  const { sessionCount, totalTime, avgSessionLength, longestSession } = metrics;
  
  // Normalize metrics
  const consistencyScore = Math.min(sessionCount / 10, 1); // 10+ sessions = max
  const lengthScore = Math.min(longestSession / 1800, 1); // 30 min = max
  const depthScore = Math.min(avgSessionLength / 900, 1); // 15 min avg = max
  
  // Weighted average (depth and consistency more important)
  const focusScore = (depthScore * 0.4) + (consistencyScore * 0.35) + (lengthScore * 0.25);
  
  return Math.min(Math.max(focusScore, 0), 1);
}

/**
 * Calculate resilience score based on student metrics
 * @param {object} metrics - { totalAttempts, recoveries, recoveryRate, consecutiveSuccesses }
 * @returns {number} - Score from 0 to 1
 */
function calculateResilienceScore(metrics) {
  const { totalAttempts, recoveries, recoveryRate, consecutiveSuccesses } = metrics;
  
  // Normalize metrics
  const recoveryCountScore = Math.min(recoveries / 10, 1); // 10+ recoveries = max
  const rateScore = recoveryRate * 2; // Cap at 2, will be normalized later
  const streakScore = Math.min(consecutiveSuccesses / 10, 1); // 10+ in a row = max
  
  // Weighted average (recovery rate and count most important)
  const resilienceScore = (recoveryCountScore * 0.4) + (Math.min(rateScore, 1) * 0.35) + (streakScore * 0.25);
  
  return Math.min(Math.max(resilienceScore, 0), 1);
}

/**
 * Calculate improvement score based on student metrics
 * @param {object} metrics - { topicsMastered, totalTopics, accuracyTrend, lastWeekAccuracy }
 * @returns {number} - Score from 0 to 1
 */
function calculateImprovementScore(metrics) {
  const { topicsMastered, totalTopics, accuracyTrend, lastWeekAccuracy } = metrics;
  
  // Normalize metrics
  const masteryScore = Math.min(topicsMastered / totalTopics, 1);
  const trendScore = Math.max(0, (accuracyTrend + 1) / 2); // -1 to +1 → 0 to 1
  const currentAccuracyScore = lastWeekAccuracy;
  
  // Weighted average (current accuracy and trend most important)
  const improvementScore = (currentAccuracyScore * 0.4) + (trendScore * 0.35) + (masteryScore * 0.25);
  
  return Math.min(Math.max(improvementScore, 0), 1);
}

/**
 * Generate progress labels based on student metrics
 * @param {object} metrics - { effort, focus, resilience, improvement }
 * @returns {object[]} - Array of labels with scores
 */
function generateProgressLabels(metrics) {
  const labels = [];
  
  // Effort labels
  const effortScore = calculateEffortScore(metrics.effort);
  const effortLabel = PROGRESS_LABELS.effort.find(l => 
    effortScore >= l.minScore && effortScore < l.maxScore
  );
  if (effortLabel) {
    labels.push({ ...effortLabel, score: effortScore });
  }
  
  // Focus labels
  const focusScore = calculateFocusScore(metrics.focus);
  const focusLabel = PROGRESS_LABELS.focus.find(l => 
    focusScore >= l.minScore && focusScore < l.maxScore
  );
  if (focusLabel) {
    labels.push({ ...focusLabel, score: focusScore });
  }
  
  // Resilience labels
  const resilienceScore = calculateResilienceScore(metrics.resilience);
  const resilienceLabel = PROGRESS_LABELS.resilience.find(l => 
    resilienceScore >= l.minScore && resilienceScore < l.maxScore
  );
  if (resilienceLabel) {
    labels.push({ ...resilienceLabel, score: resilienceScore });
  }
  
  // Improvement labels
  const improvementScore = calculateImprovementScore(metrics.improvement);
  const improvementLabel = PROGRESS_LABELS.improvement.find(l => 
    improvementScore >= l.minScore && improvementScore < l.maxScore
  );
  if (improvementLabel) {
    labels.push({ ...improvementLabel, score: improvementScore });
  }
  
  // Sort by score descending
  labels.sort((a, b) => b.score - a.score);
  
  return labels;
}

/**
 * Get the top (highest scoring) label
 * @param {object} metrics - Student metrics
 * @returns {object|null} - Top label or null
 */
function getTopLabel(metrics) {
  const labels = generateProgressLabels(metrics);
  return labels.length > 0 ? labels[0] : null;
}

/**
 * Get labels by category
 * @param {string} category - Label category (effort, focus, resilience, improvement)
 * @param {object} metrics - Student metrics
 * @returns {object[]} - Filtered labels
 */
function getLabelsByCategory(category, metrics) {
  const labels = generateProgressLabels(metrics);
  return labels.filter(l => l.category === category);
}

/**
 * Generate encouragement message based on top label
 * @param {object} metrics - Student metrics
 * @returns {string} - Encouragement message
 */
function generateEncouragementMessage(metrics) {
  const topLabel = getTopLabel(metrics);
  
  if (!topLabel) {
    return 'Keep up the great work - every moment of effort counts!';
  }
  
  const baseMessage = `🌟 ${topLabel.icon} ${topLabel.displayName}: ${topLabel.description}`;
  
  // Add specific encouragement based on category
  if (topLabel.category === 'effort') {
    return baseMessage + ' Your dedication is building real skills!';
  }
  if (topLabel.category === 'focus') {
    return baseMessage + ' That deep engagement is where the magic happens!';
  }
  if (topLabel.category === 'resilience') {
    return baseMessage + ' This comeback ability is a superpower!';
  }
  if (topLabel.category === 'improvement') {
    return baseMessage + ' You\'re on an amazing learning journey!';
  }
  
  return baseMessage;
}

module.exports = {
  PROGRESS_LABELS,
  calculateEffortScore,
  calculateFocusScore,
  calculateResilienceScore,
  calculateImprovementScore,
  generateProgressLabels,
  getTopLabel,
  getLabelsByCategory,
  generateEncouragementMessage
};
