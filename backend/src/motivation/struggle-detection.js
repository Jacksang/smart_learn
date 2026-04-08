/**
 * Struggle Signal Detection System
 * Detects when students are experiencing difficulty
 */

/**
 * Struggle signal categories:
 * - repeatedFailures: Multiple consecutive incorrect answers
 * - longResponseTimes: Student taking unusually long
 * - rapidSwitching: Student frequently changing answers
 * - helpRequests: Explicit request for help
 * - frustrationPatterns: Multiple indicators within short timeframe
 */

const STRUGGLE_THRESHOLDS = {
  repeatedFailures: { threshold: 2, weight: 30 },
  longResponseTimes: { threshold: 3, weight: 20 },
  rapidSwitching: { threshold: 3, weight: 25 },
  helpRequests: { threshold: 1, weight: 50 },
  frustrationPatterns: { threshold: 2, weight: 40 }
};

const STRUGGLE_SEVERITY = {
  low: { minScore: 0, maxScore: 40, description: 'Minor difficulty' },
  moderate: { minScore: 41, maxScore: 80, description: 'Clear struggle' },
  high: { minScore: 81, maxScore: 120, description: 'Significant struggle' }
};

/**
 * Detect struggle signals from recent activity history
 * @param {object[]} activityHistory - Array of recent activity objects
 * @returns {object} - Struggle analysis result
 */
function detectStruggleSignals(activityHistory) {
  const signals = {
    repeatedFailures: { score: 0, threshold: STRUGGLE_THRESHOLDS.repeatedFailures.threshold },
    longResponseTimes: { score: 0, threshold: STRUGGLE_THRESHOLDS.longResponseTimes.threshold },
    rapidSwitching: { score: 0, threshold: STRUGGLE_THRESHOLDS.rapidSwitching.threshold },
    helpRequests: { score: 0, threshold: STRUGGLE_THRESHOLDS.helpRequests.threshold },
    frustrationPatterns: { score: 0, threshold: STRUGGLE_THRESHOLDS.frustrationPatterns.threshold }
  };

  // Filter to recent activity (last 10 activities)
  const recentActivity = activityHistory.slice(-10);

  if (recentActivity.length === 0) {
    return {
      struggleDetected: false,
      severity: 'low',
      signals,
      patterns: [],
      score: 0
    };
  }

  // Analyze each signal type
  signals.repeatedFailures.score = analyzeRepeatedFailures(recentActivity);
  signals.longResponseTimes.score = analyzeLongResponseTimes(recentActivity);
  signals.rapidSwitching.score = analyzeRapidSwitching(recentActivity);
  signals.helpRequests.score = analyzeHelpRequests(recentActivity);

  // Calculate frustration pattern score
  signals.frustrationPatterns.score = calculateFrustrationPatternScore(signals);

  // Determine if struggle is detected
  const activeSignals = Object.values(signals).filter(
    s => s.score >= s.threshold
  );

  // Calculate total score
  const totalScore = Object.values(signals)
    .reduce((sum, s) => sum + (s.score * STRUGGLE_THRESHOLDS[Object.keys(s)].weight), 0);

  // Identify patterns
  const patterns = identifyPatterns(signals);

  // Determine severity
  const severity = determineSeverity(totalScore, activeSignals.length);

  return {
    struggleDetected: activeSignals.length >= 2,
    severity,
    signals,
    patterns,
    score: totalScore
  };
}

/**
 * Analyze repeated failures in activity
 */
function analyzeRepeatedFailures(activityHistory) {
  let consecutiveFailures = 0;

  // Count consecutive failures from most recent
  for (let i = activityHistory.length - 1; i >= 0; i--) {
    if (activityHistory[i].result === 'incorrect') {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  return consecutiveFailures;
}

/**
 * Analyze long response times
 */
function analyzeLongResponseTimes(activityHistory) {
  if (activityHistory.length === 0) {
    return 0;
  }

  const responseTimes = activityHistory
    .filter(a => a.responseTime)
    .map(a => a.responseTime);

  if (responseTimes.length === 0) {
    return 0;
  }

  const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
  const longResponses = responseTimes.filter(t => t > avgResponseTime * 3).length;

  return longResponses;
}

/**
 * Analyze rapid answer switching
 */
function analyzeRapidSwitching(activityHistory) {
  let switches = 0;

  for (let i = 1; i < activityHistory.length; i++) {
    const current = activityHistory[i];
    const previous = activityHistory[i - 1];

    // Check if answers were switched within 60 seconds
    const timeDiff = current.timestamp - previous.timestamp;
    if (timeDiff <= 60000 && current.lastAnswerId && previous.lastAnswerId &&
        current.lastAnswerId !== previous.lastAnswerId) {
      switches++;
    }
  }

  return switches;
}

/**
 * Analyze help requests
 */
function analyzeHelpRequests(activityHistory) {
  const helpRequests = activityHistory.filter(a => a.type === 'help_request').length;
  return helpRequests;
}

/**
 * Calculate frustration pattern score
 */
function calculateFrustrationPatternScore(signals) {
  const activeSignals = Object.values(signals).filter(s => s.score >= s.threshold);

  // Score based on number of active signals
  if (activeSignals.length >= 3) {
    return 3;
  } else if (activeSignals.length >= 2) {
    return 2;
  } else {
    return 0;
  }
}

/**
 * Identify specific struggle patterns
 */
function identifyPatterns(signals) {
  const patterns = [];

  if (signals.repeatedFailures.score >= signals.repeatedFailures.threshold) {
    patterns.push('repeated_failures');
  }

  if (signals.longResponseTimes.score >= signals.longResponseTimes.threshold) {
    patterns.push('long_response_times');
  }

  if (signals.rapidSwitching.score >= signals.rapidSwitching.threshold) {
    patterns.push('rapid_switching');
  }

  if (signals.helpRequests.score >= signals.helpRequests.threshold) {
    patterns.push('help_requested');
  }

  if (signals.frustrationPatterns.score >= signals.frustrationPatterns.threshold) {
    patterns.push('frustration_pattern');
  }

  return patterns;
}

/**
 * Determine severity level
 */
function determineSeverity(score, activeSignalCount) {
  if (score >= 81 || activeSignalCount >= 3) {
    return 'high';
  } else if (score >= 41 || activeSignalCount >= 2) {
    return 'moderate';
  } else {
    return 'low';
  }
}

/**
 * Get recommended action based on struggle patterns
 */
function getRecommendedAction(struggleAnalysis) {
  const { patterns, severity } = struggleAnalysis;

  if (severity === 'high') {
    return 'break';
  }

  if (patterns.includes('repeated_failures')) {
    return 'different_approach';
  }

  if (patterns.includes('long_response_times')) {
    return 'break_it_down';
  }

  if (patterns.includes('rapid_switching')) {
    return 'review_prerequisites';
  }

  if (patterns.includes('help_requested')) {
    return 'seek_help';
  }

  return 'continue';
}

/**
 * Generate encouragement message based on struggle type
 */
function generateEncouragement(struggleAnalysis) {
  const { patterns, severity } = struggleAnalysis;

  if (severity === 'high') {
    return getHighSeverityMessage(patterns);
  }

  if (patterns.includes('repeated_failures')) {
    return getValidationMessage(patterns);
  }

  if (patterns.includes('long_response_times')) {
    return getPerspectiveMessage(patterns);
  }

  if (patterns.includes('rapid_switching')) {
    return getGrowthMindset(patterns);
  }

  if (patterns.includes('help_requested')) {
    return getSupportiveMessage(patterns);
  }

  return 'Keep up the great work - you\'re doing great!';
}

/**
 * High severity encouragement
 */
function getHighSeverityMessage(patterns) {
  if (patterns.includes('frustration_pattern')) {
    return 'This is tough right now, and that\'s completely okay. Sometimes a short break helps your brain reset - would you like to try something different for a few minutes?';
  }

  if (patterns.includes('repeated_failures')) {
    return 'You\'re working through a challenging moment - that\'s where real learning happens! Let\'s try a different approach and I know you\'ll get through this.';
  }

  return 'You\'ve got this! Every expert was once a beginner who didn\'t give up. Let\'s take a step back and approach this differently.';
}

/**
 * Validation message for repeated failures
 */
function getValidationMessage(patterns) {
  if (patterns.includes('long_response_times')) {
    return 'This concept is challenging - that\'s completely normal! You\'re taking the time to really understand it, and that\'s exactly the right approach.';
  }

  return 'Many students find this part tricky at first. You\'re not alone in this, and with the right approach, you\'ll master it.';
}

/**
 * Perspective message for long response times
 */
function getPerspectiveMessage(patterns) {
  return 'Taking time to work through this means your brain is growing! Every moment of struggle is building neural pathways that will make this concept stick.';
}

/**
 * Growth mindset message
 */
function getGrowthMindset(patterns) {
  if (patterns.includes('rapid_switching')) {
    return 'It sounds like you\'re exploring different approaches - that\'s excellent! Sometimes the right answer comes after trying a few different paths.';
  }

  return 'The effort you\'re putting in right now is what makes you stronger. Every attempt builds your understanding, even the ones that don\'t work out.';
}

/**
 * Supportive message for help requests
 */
function getSupportiveMessage(patterns) {
  return 'You reached out for help, and that shows great self-awareness! That\'s a real strength. Let me share some different ways to approach this.';
}

module.exports = {
  detectStruggleSignals,
  getRecommendedAction,
  generateEncouragement,
  STRUGGLE_THRESHOLDS,
  STRUGGLE_SEVERITY
};
