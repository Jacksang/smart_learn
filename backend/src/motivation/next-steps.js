/**
 * Next-Step Recommendation System
 * Recommends appropriate next actions during struggle
 */

const NEXT_STEPS = {
  // Skip and Return Later
  skip_and_return: {
    id: 'skip_and_return',
    displayName: 'Skip and Return Later',
    description: 'Move to different topic, return in 1-2 days',
    when: ['frustration_pattern', 'high_severity', 'long_session'],
    message: 'Let\'s try something else for now and come back to this fresh later',
    confidenceBoost: false,
    difficulty: 'high'
  },

  // Break It Down
  break_it_down: {
    id: 'break_it_down',
    displayName: 'Break It Down',
    description: 'Break problem into smaller steps',
    when: ['long_response_times', 'complex_problem'],
    message: 'Let\'s break this down into smaller pieces you can tackle one at a time',
    confidenceBoost: true,
    difficulty: 'moderate'
  },

  // Try Different Approach
  different_approach: {
    id: 'different_approach',
    displayName: 'Try Different Approach',
    description: 'Suggest alternative method or perspective',
    when: ['repeated_failures', 'single_method_attempted'],
    message: 'What if we looked at this from a different angle or tried a different method?',
    confidenceBoost: true,
    difficulty: 'moderate'
  },

  // Review Prerequisites
  review_prerequisites: {
    id: 'review_prerequisites',
    displayName: 'Review Prerequisites',
    description: 'Recommend reviewing foundational concepts',
    when: ['foundational_gaps', 'early_stage_struggle'],
    message: 'This might feel challenging because we\'re building on earlier concepts. Let\'s quickly review the basics.',
    confidenceBoost: false,
    difficulty: 'low'
  },

  // Take Break
  take_break: {
    id: 'take_break',
    displayName: 'Take a Break',
    description: 'Suggest stepping away and returning refreshed',
    when: ['high_frustration', 'extended_struggle', 'session_very_long'],
    message: 'You\'ve been working hard! Sometimes a short break helps your brain reset and this will feel easier when you return',
    confidenceBoost: false,
    difficulty: 'low'
  },

  // Seek Help
  seek_help: {
    id: 'seek_help',
    displayName: 'Seek Help',
    description: 'Recommend discussion forum, tutor, or peer help',
    when: ['help_requested', 'extended_struggle', 'foundational_gaps'],
    message: 'You\'re not alone in this - let\'s connect you with someone who can help and support you',
    confidenceBoost: true,
    difficulty: 'high'
  }
};

/**
 * Recommend next steps based on struggle analysis
 * @param {object} struggleAnalysis - Struggle analysis with patterns and severity
 * @param {object} studentContext - Student context for personalization
 * @returns {object[]} - Prioritized list of recommendations
 */
function recommendNextSteps(struggleAnalysis, studentContext = {}) {
  const { patterns, severity } = struggleAnalysis;
  const recommendations = [];

  // Determine recommended steps based on patterns
  if (severity === 'high' || patterns.includes('frustration_pattern')) {
    recommendations.push(NEXT_STEPS.take_break);
    recommendations.push(NEXT_STEPS.skip_and_return);
  }

  if (patterns.includes('repeated_failures')) {
    recommendations.push(NEXT_STEPS.different_approach);
    recommendations.push(NEXT_STEPS.break_it_down);
  }

  if (patterns.includes('long_response_times')) {
    recommendations.push(NEXT_STEPS.break_it_down);
    recommendations.push(NEXT_STEPS.refer_to_example);
  }

  if (patterns.includes('foundational_gaps')) {
    recommendations.push(NEXT_STEPS.review_prerequisites);
  }

  if (patterns.includes('help_requested')) {
    recommendations.push(NEXT_STEPS.seek_help);
  }

  // If no specific patterns, default to different approach
  if (recommendations.length === 0) {
    recommendations.push(NEXT_STEPS.different_approach);
    recommendations.push(NEXT_STEPS.break_it_down);
  }

  // Score and prioritize recommendations
  const scored = recommendations.map(rec => ({
    ...rec,
    score: scoreRecommendation(rec, struggleAnalysis, studentContext)
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3); // Return top 3 recommendations
}

/**
 * Score how appropriate a recommendation is
 */
function scoreRecommendation(recommendation, struggleAnalysis, studentContext) {
  let score = 10;
  const { patterns, severity } = struggleAnalysis;

  // Check if recommendation matches patterns
  recommendation.when.forEach(pattern => {
    if (patterns.some(p => p.includes(pattern) || pattern === p)) {
      score += 3;
    }
  });

  // Boost based on severity
  if (severity === 'high' && ['skip_and_return', 'take_break'].includes(recommendation.id)) {
    score += 4;
  }

  // Boost for confidence-building options during moderate struggle
  if (severity === 'moderate' && recommendation.confidenceBoost) {
    score += 2;
  }

  // Student preferences override
  if (studentContext.preferredApproach === 'visual' && recommendation.id === 'different_approach') {
    score += 3;
  }

  if (studentContext.preferredApproach === 'step_by_step' && recommendation.id === 'break_it_down') {
    score += 3;
  }

  // Avoid previously rejected recommendations
  if (studentContext.recentlyRejected.includes(recommendation.id)) {
    score -= 3;
  }

  return score;
}

/**
 * Get recommended action text
 */
function getActionText(recommendation) {
  return recommendation.message;
}

/**
 * Check if recommendation is appropriate for current context
 */
function isRecommendationAppropriate(recommendation, struggleAnalysis) {
  const { patterns, severity } = struggleAnalysis;

  if (severity === 'high' && ['break_it_down', 'review_prerequisites'].includes(recommendation.id)) {
    return false;
  }

  if (severity === 'low' && ['skip_and_return', 'seek_help'].includes(recommendation.id)) {
    return false;
  }

  return true;
}

/**
 * Track student response to recommendation
 */
function recordStudentResponse(recommendationId, action, outcome, timeSpent) {
  return {
    recommendationId,
    action,
    outcome,
    timeSpent,
    timestamp: new Date().toISOString()
  };
}

/**
 * Learn from responses to improve future recommendations
 */
class RecommendationLearningSystem {
  constructor() {
    this.studentResponses = {};
  }

  recordResponse(studentId, response) {
    if (!this.studentResponses[studentId]) {
      this.studentResponses[studentId] = [];
    }

    this.studentResponses[studentId].push(response);

    // Update learning based on response
    this.updateLearning(studentId, response);
  }

  updateLearning(studentId, response) {
    // Calculate preference score for this recommendation type
    const recommendationId = response.recommendationId;
    const success = response.outcome === 'resolved' || response.outcome === 'accepted';

    if (!this.studentResponses[studentId].learning) {
      this.studentResponses[studentId].learning = {};
    }

    if (!this.studentResponses[studentId].learning[recommendationId]) {
      this.studentResponses[studentId].learning[recommendationId] = {
        totalAttempts: 0,
        successCount: 0
      };
    }

    const stats = this.studentResponses[studentId].learning[recommendationId];
    stats.totalAttempts++;

    if (success) {
      stats.successCount++;
    }
  }

  getPersonalizedRecommendations(studentId) {
    const learning = this.studentResponses[studentId]?.learning;

    if (!learning) {
      return [];
    }

    // Filter to highest-performing recommendations for this student
    const sorted = Object.entries(learning)
      .map(([id, stats]) => ({
        id,
        successRate: stats.successCount / stats.totalAttempts,
        attempts: stats.totalAttempts
      }))
      .filter(item => item.attempts >= 2) // Need at least 2 attempts
      .sort((a, b) => b.successRate - a.successRate);

    return sorted.map(item => item.id);
  }
}

module.exports = {
  NEXT_STEPS,
  recommendNextSteps,
  getActionText,
  isRecommendationAppropriate,
  recordStudentResponse,
  RecommendationLearningSystem
};
