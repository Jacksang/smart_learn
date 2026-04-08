/**
 * Motivation Engine - Feedback Templates
 * Provides encouraging feedback based on student situation and activity
 */

/**
 * Feedback template categories:
 * - success_recognition: Celebrating correct answers
 * - struggle_recovery: Encouraging after incorrect answers
 * - effort_appreciation: Recognizing time and persistence
 * - focus_celebration: Rewarding session continuity
 * - resilience_recognition: Celebrating recovery and comeback
 */

const FEEDBACK_TEMPLATES = {
  // Success Recognition Templates
  success_recognition: [
    {
      id: 'success_first_attempt',
      template: 'Perfect! You got it on the first try! 🎉',
      minConfidence: 0.8,
      maxConsecutiveFailures: 0
    },
    {
      id: 'success_quick_wins',
      template: 'Great job! Those quick wins build momentum! 💪',
      minConfidence: 0.7,
      maxConsecutiveFailures: 1
    },
    {
      id: 'success_improvement',
      template: 'Excellent! I can see your improvement! Keep going! ⭐',
      minConfidence: 0.5,
      maxConsecutiveFailures: 2
    },
    {
      id: 'success_mastery_approaching',
      template: 'Outstanding! You\'re really mastering this concept! 🌟',
      minConfidence: 0.6,
      maxConsecutiveFailures: 1
    }
  ],

  // Struggle Recovery Templates
  struggle_recovery: [
    {
      id: 'struggle_recovery_first_fail',
      template: 'That\'s okay! Every expert was once a beginner. Let\'s try a different approach. 🌱',
      minConfidence: 0.9,
      maxConsecutiveFailures: 1
    },
    {
      id: 'struggle_recovery_gentle',
      template: 'I see this is challenging. That\'s exactly how learning happens! Let me help you break it down. 💡',
      minConfidence: 0.8,
      maxConsecutiveFailures: 2
    },
    {
      id: 'struggle_recovery_normalizing',
      template: 'This is a tricky concept! Even the smartest students find it challenging sometimes. Let\'s work through it together. 🤔',
      minConfidence: 0.7,
      maxConsecutiveFailures: 3
    },
    {
      id: 'struggle_recovery_confidence_build',
      template: 'You\'re working through a challenging moment - that\'s where real learning happens! Try this approach and I bet you\'ll get it. 🚀',
      minConfidence: 0.5,
      maxConsecutiveFailures: 4
    },
    {
      id: 'struggle_recovery_deep_challenge',
      template: 'This is a deep concept that even takes time to master. Don\'t worry - I know you can get through this with a fresh perspective. 💫',
      minConfidence: 0.4,
      maxConsecutiveFailures: 5
    }
  ],

  // Effort Appreciation Templates
  effort_appreciation: [
    {
      id: 'effort_first_try',
      template: 'First time tackling this? That takes courage! I\'m proud of you for trying. 🙌',
      minTimeSpent: 0,
      maxAttempts: 1
    },
    {
      id: 'effort_persistence',
      template: 'I see you haven\'t given up - that persistence is going to serve you well! ⏰',
      minTimeSpent: 60,
      maxAttempts: 5
    },
    {
      id: 'effort_dedication',
      template: 'You\'re putting in the work! This kind of dedication leads to real mastery. 💪',
      minTimeSpent: 180,
      maxAttempts: 10
    },
    {
      id: 'effort_grind',
      template: 'The grind is paying off! Keep pushing - you\'re building serious skills. 🔥',
      minTimeSpent: 300,
      maxAttempts: 15
    }
  ],

  // Focus Celebration Templates
  focus_celebration: [
    {
      id: 'focus_beginner',
      template: 'Nice focused session! Building your study habit one session at a time. 📚',
      minSessionLength: 5,
      maxSessionLength: 15
    },
    {
      id: 'focus_building',
      template: 'Great focus today! Those longer sessions are where the magic happens. ✨',
      minSessionLength: 15,
      maxSessionLength: 30
    },
    {
      id: 'focus_deep',
      template: 'Impressive focus! You\'re in a really productive state. Keep it up! 🎯',
      minSessionLength: 30,
      maxSessionLength: 60
    },
    {
      id: 'focus_flow',
      template: 'You\'re in flow! This deep engagement is where real breakthroughs happen. 🌊',
      minSessionLength: 60,
      maxSessionLength: null
    }
  ],

  // Resilience Recognition Templates
  resilience_recognition: [
    {
      id: 'resilience_first_comeback',
      template: 'You bounced back from that! That recovery skill is invaluable. 🔄',
      minRecoveries: 1,
      maxRecoveryRate: null
    },
    {
      id: 'resilience_building',
      template: 'Your comeback ability is growing! Every recovery makes you stronger. 💪',
      minRecoveries: 3,
      maxRecoveryRate: null
    },
    {
      id: 'resilience_strong',
      template: 'You\'re showing real resilience! The ability to recover is a superpower. ⭐',
      minRecoveries: 5,
      maxRecoveryRate: null
    },
    {
      id: 'resilience_champion',
      template: 'Your comeback streak is impressive! This kind of persistence is what separates good from great. 🏆',
      minRecoveries: 10,
      maxRecoveryRate: null
    }
  ]
};

/**
 * Detect the situation based on activity context
 * @param {object} activityContext - { outcome, consecutiveFailures, confidence, timeSpent, sessionLength, recoveryCount }
 * @returns {string} - Situation category
 */
function detectSituation(activityContext) {
  const { outcome, consecutiveFailures, confidence, timeSpent, sessionLength, recoveryCount } = activityContext;

  // Success situations
  if (outcome === 'correct' && consecutiveFailures === 0) {
    return 'success_recognition';
  }
  if (outcome === 'correct' && consecutiveFailures <= 1) {
    return 'success_improvement';
  }

  // Struggle situations
  if (outcome === 'incorrect') {
    return 'struggle_recovery';
  }

  // Effort situations (based on time and attempts)
  if (timeSpent > 0) {
    return 'effort_appreciation';
  }

  // Focus situations (based on session length)
  if (sessionLength > 5) {
    return 'focus_celebration';
  }

  // Resilience situations (based on recovery count)
  if (recoveryCount > 0) {
    return 'resilience_recognition';
  }

  // Default to effort appreciation for any activity
  return 'effort_appreciation';
}

/**
 * Score how well a template matches the current context
 * @param {object} template - Feedback template
 * @param {object} context - Activity context
 * @returns {number} - Match score (higher = better match)
 */
function scoreTemplateMatch(template, context) {
  let score = 0;

  // Confidence-based templates
  if (template.minConfidence !== undefined) {
    if (context.confidence >= template.minConfidence) {
      score += 2;
    }
    if (template.maxConsecutiveFailures !== undefined) {
      if (context.consecutiveFailures <= template.maxConsecutiveFailures) {
        score += 2;
      }
    }
  }

  // Time-based templates
  if (template.minTimeSpent !== undefined) {
    if (context.timeSpent >= template.minTimeSpent) {
      score += 3;
    }
  }

  // Session length templates
  if (template.minSessionLength !== undefined) {
    if (context.sessionLength >= template.minSessionLength) {
      score += 3;
    }
  }

  // Recovery count templates
  if (template.minRecoveries !== undefined) {
    if (context.recoveryCount >= template.minRecoveries) {
      score += 3;
    }
  }

  return score;
}

/**
 * Select the best feedback template for current context
 * @param {object} context - Activity context
 * @returns {object|null} - Selected template or null
 */
function selectFeedbackTemplate(context) {
  const situation = detectSituation(context);
  const candidates = FEEDBACK_TEMPLATES[situation] || [];

  // Score all candidates
  const scored = candidates.map(template => ({
    template,
    score: scoreTemplateMatch(template, context)
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return highest scoring template
  if (scored.length > 0 && scored[0].score > 0) {
    return scored[0];
  }

  // If no good match, return first template of the category
  return scored.length > 0 ? { template: scored[0].template, score: 0 } : null;
}

/**
 * Get all available template categories
 * @returns {string[]} - List of categories
 */
function getTemplateCategories() {
  return Object.keys(FEEDBACK_TEMPLATES);
}

/**
 * Get all templates for a specific category
 * @param {string} category - Template category
 * @returns {object[]} - Array of templates
 */
function getTemplatesByCategory(category) {
  return FEEDBACK_TEMPLATES[category] || [];
}

module.exports = {
  FEEDBACK_TEMPLATES,
  detectSituation,
  scoreTemplateMatch,
  selectFeedbackTemplate,
  getTemplateCategories,
  getTemplatesByCategory
};
