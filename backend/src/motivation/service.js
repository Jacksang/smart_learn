/**
 * Motivation Engine - Service Layer
 * Orchestrates feedback, labels, and milestones
 */

const {
  detectSituation,
  selectFeedbackTemplate,
  getTemplateCategories
} = require('./feedback-templates');

const {
  generateProgressLabels,
  getTopLabel,
  generateEncouragementMessage
} = require('./progress-labels');

const {
  getAllMilestones,
  checkAndAwardMilestones,
  getMilestoneProgressReport
} = require('./milestones');

/**
 * Get feedback for current activity
 * @param {object} context - Activity context
 * @returns {object} - Feedback result
 */
async function getFeedbackForActivity(context) {
  try {
    const result = selectFeedbackTemplate(context);
    
    if (!result || !result.template) {
      return {
        feedback: null,
        suggestedAction: 'continue'
      };
    }
    
    return {
      feedback: {
        id: result.template.id,
        text: result.template.template,
        category: result.template.category
      },
      suggestedAction: getSuggestedAction(result.template.category, context)
    };
  } catch (error) {
    console.error('Error getting feedback:', error);
    return {
      feedback: null,
      suggestedAction: 'continue'
    };
  }
}

/**
 * Get suggested action based on feedback category
 * @param {string} category - Feedback category
 * @param {object} context - Activity context
 * @returns {string} - Suggested action
 */
function getSuggestedAction(category, context) {
  if (category === 'struggle_recovery') {
    return 'try_alternative_approach';
  }
  if (category === 'success_recognition') {
    return 'continue_to_next_topic';
  }
  if (category === 'effort_appreciation') {
    return 'keep_persisting';
  }
  if (category === 'focus_celebration') {
    return 'maintain_current_pace';
  }
  if (category === 'resilience_recognition') {
    return 'build_on_recovery';
  }
  return 'continue';
}

/**
 * Get progress labels for student
 * @param {object} metrics - Student metrics
 * @returns {object} - Labels result
 */
async function getProgressLabels(metrics) {
  try {
    const labels = generateProgressLabels(metrics);
    const topLabel = getTopLabel(metrics);
    
    return {
      labels,
      topLabel: topLabel ? { ...topLabel, score: topLabel.score } : null
    };
  } catch (error) {
    console.error('Error getting progress labels:', error);
    return {
      labels: [],
      topLabel: null
    };
  }
}

/**
 * Generate encouragement message based on current metrics
 * @param {object} metrics - Student metrics
 * @returns {string} - Encouragement message
 */
async function generateEncouragement(metrics) {
  try {
    return generateEncouragementMessage(metrics);
  } catch (error) {
    console.error('Error generating encouragement:', error);
    return 'Keep up the great work - every moment of effort counts!';
  }
}

/**
 * Get milestone progress for student
 * @param {object} metrics - Student metrics
 * @param {object} achievedMilestones - List of achieved milestone IDs
 * @returns {object} - Milestone progress report
 */
async function getMilestoneProgress(metrics, achievedMilestones = []) {
  try {
    const report = getMilestoneProgressReport(metrics, achievedMilestones);
    
    // Add recently achieved (those achieved in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    report.recentlyAchieved = report.achieved.filter(m => {
      const achievedDate = new Date(m.achievedAt);
      return achievedDate >= sevenDaysAgo;
    });
    
    return report;
  } catch (error) {
    console.error('Error getting milestone progress:', error);
    return {
      achieved: [],
      locked: [],
      recentlyAchieved: []
    };
  }
}

/**
 * Check and award milestones based on current activity
 * @param {object} metrics - Student metrics
 * @param {string} studentId - Student ID (for tracking)
 * @param {object} achievedMilestones - List of already achieved milestone IDs
 * @returns {object} - Award result
 */
async function checkAndAwardMilestonesForStudent(metrics, studentId, achievedMilestones = []) {
  try {
    const toAward = checkAndAwardMilestones(metrics, achievedMilestones);
    
    const awarded = toAward.map(milestone => ({
      milestone,
      awardedTo: studentId,
      awardedAt: new Date().toISOString()
    }));
    
    return {
      awarded,
      totalAwarded: awarded.length
    };
  } catch (error) {
    console.error('Error checking milestones:', error);
    return {
      awarded: [],
      totalAwarded: 0
    };
  }
}

/**
 * Get all milestone definitions
 * @returns {object} - Milestone definitions
 */
async function getMilestoneDefinitions() {
  try {
    return getAllMilestones();
  } catch (error) {
    console.error('Error getting milestone definitions:', error);
    return {};
  }
}

/**
 * Track motivation-relevant activity
 * @param {object} activity - Activity data
 * @returns {object} - Tracking result
 */
async function trackMotivationActivity(activity) {
  try {
    // Validate activity
    if (!activity.activityType || !activity.result) {
      return {
        tracked: false,
        error: 'Invalid activity data'
      };
    }
    
    // Update metrics based on activity
    const updatedMetrics = await updateMetricsFromActivity(activity);
    
    return {
      tracked: true,
      updatedMetrics,
      activityType: activity.activityType,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error tracking motivation activity:', error);
    return {
      tracked: false,
      error: error.message
    };
  }
}

/**
 * Update student metrics from activity
 * @param {object} activity - Activity data
 * @returns {object} - Updated metrics
 */
async function updateMetricsFromActivity(activity) {
  // In a real implementation, this would query the database
  // For now, return placeholder metrics
  return {
    totalAttempts: 1,
    totalTime: activity.timeSpent || 0,
    sessionCount: 1,
    longestSession: activity.timeSpent || 0,
    recoveries: activity.result === 'incorrect' ? 0 : 1,
    topicsMastered: activity.result === 'correct' ? 1 : 0
  };
}

/**
 * Get available feedback categories
 * @returns {string[]} - List of categories
 */
async function getFeedbackCategories() {
  try {
    return getTemplateCategories();
  } catch (error) {
    console.error('Error getting feedback categories:', error);
    return [];
  }
}

module.exports = {
  // Feedback
  getFeedbackForActivity,
  getSuggestedAction,
  
  // Progress Labels
  getProgressLabels,
  generateEncouragement,
  
  // Milestones
  getMilestoneProgress,
  checkAndAwardMilestonesForStudent,
  getMilestoneDefinitions,
  
  // Activity Tracking
  trackMotivationActivity,
  updateMetricsFromActivity,
  
  // Utilities
  getFeedbackCategories
};
