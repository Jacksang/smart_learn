/**
 * Motivation Engine - Milestone System
 * Tracks and awards milestones for effort, focus, and resilience
 */

/**
 * Milestone categories:
 * - effort: Time spent, attempts made, persistence
 * - focus: Session continuity, engagement depth
 * - resilience: Recovery from failure, comeback ability
 * - improvement: Skill acquisition, mastery progression
 */

const MILESTONE_DEFINITIONS = {
  // Effort Milestones
  effort: [
    {
      id: 'first_try',
      displayName: 'First Try',
      description: 'You took your first step - that takes courage!',
      category: 'effort',
      icon: '🌱',
      checkFunction: (metrics) => metrics.totalAttempts >= 1 && metrics.totalAttempts <= 1
    },
    {
      id: 'ten_minutes',
      displayName: 'Ten Minute Warrior',
      description: 'You\'ve spent 10 minutes diving into learning!',
      category: 'effort',
      icon: '⏰',
      checkFunction: (metrics) => metrics.totalTime >= 600 && metrics.totalTime < 1200
    },
    {
      id: 'half_hour',
      displayName: 'Half Hour Hero',
      description: '30 minutes of dedicated practice - impressive!',
      category: 'effort',
      icon: '⚡',
      checkFunction: (metrics) => metrics.totalTime >= 1800 && metrics.totalTime < 3600
    },
    {
      id: 'full_hour',
      displayName: 'Hour of Study',
      description: 'An entire hour of focused learning - amazing dedication!',
      category: 'effort',
      icon: '💪',
      checkFunction: (metrics) => metrics.totalTime >= 3600 && metrics.totalTime < 7200
    },
    {
      id: 'two_hours',
      displayName: 'Two Hour Dynamo',
      description: '2 hours of study - you\'re building real skills!',
      category: 'effort',
      icon: '🔥',
      checkFunction: (metrics) => metrics.totalTime >= 7200 && metrics.totalTime < 10800
    },
    {
      id: 'five_hours',
      displayName: 'Five Hour Marvel',
      description: '5 hours of commitment - this is serious dedication!',
      category: 'effort',
      icon: '🌟',
      checkFunction: (metrics) => metrics.totalTime >= 18000
    }
  ],

  // Focus Milestones
  focus: [
    {
      id: 'session_starter',
      displayName: 'Session Starter',
      description: 'You completed your first session - habit building!',
      category: 'focus',
      icon: '📚',
      checkFunction: (metrics) => metrics.sessionCount >= 1 && metrics.sessionCount <= 1
    },
    {
      id: 'habit_builder',
      displayName: 'Habit Builder',
      description: '3 sessions in a week - you\'re building a habit!',
      category: 'focus',
      icon: '📖',
      checkFunction: (metrics) => metrics.sessionCount >= 3 && metrics.sessionCount < 5
    },
    {
      id: 'deep_diver',
      displayName: 'Deep Diver',
      description: 'One session longer than 30 minutes - deep learning!',
      category: 'focus',
      icon: '🎯',
      checkFunction: (metrics) => metrics.longestSession >= 1800 && metrics.longestSession < 3600
    },
    {
      id: 'flow_candidate',
      displayName: 'Flow State Candidate',
      description: 'Sessions regularly exceeding 45 minutes - focus mastery!',
      category: 'focus',
      icon: '✨',
      checkFunction: (metrics) => metrics.longestSession >= 3600 && metrics.longestSession < 5400
    },
    {
      id: 'flow_master',
      displayName: 'Flow State Master',
      description: 'Sustained deep focus - this is where breakthroughs happen!',
      category: 'focus',
      icon: '🌊',
      checkFunction: (metrics) => metrics.longestSession >= 5400
    }
  ],

  // Resilience Milestones
  resilience: [
    {
      id: 'comeback_kid',
      displayName: 'Comeback Kid',
      description: 'You recovered from 3 consecutive challenges - amazing!',
      category: 'resilience',
      icon: '🔄',
      checkFunction: (metrics) => metrics.recoveries >= 3 && metrics.recoveries < 5
    },
    {
      id: 'unstoppable',
      displayName: 'Unstoppable',
      description: '10 recoveries from difficulty - you bounce back strong!',
      category: 'resilience',
      icon: '💪',
      checkFunction: (metrics) => metrics.recoveries >= 10 && metrics.recoveries < 20
    },
    {
      id: 'grinder',
      displayName: 'The Grinder',
      description: '100 total attempts - persistence personified!',
      category: 'resilience',
      icon: '⚒️',
      checkFunction: (metrics) => metrics.totalAttempts >= 100 && metrics.totalAttempts < 200
    },
    {
      id: 'never_give_up',
      displayName: 'Never Give Up',
      description: '200+ attempts - you\'ve shown serious determination!',
      category: 'resilience',
      icon: '🏆',
      checkFunction: (metrics) => metrics.totalAttempts >= 200
    },
    {
      id: 'champion_comeback',
      displayName: 'Champion Comeback',
      description: '30+ recoveries - you\'re a true comeback specialist!',
      category: 'resilience',
      icon: '👑',
      checkFunction: (metrics) => metrics.recoveries >= 30
    }
  ],

  // Improvement Milestones
  improvement: [
    {
      id: 'light_bulb',
      displayName: 'Light Bulb Moment',
      description: 'You mastered your first concept - breakthrough!',
      category: 'improvement',
      icon: '💡',
      checkFunction: (metrics) => metrics.topicsMastered >= 1 && metrics.topicsMastered <= 1
    },
    {
      id: 'momentum',
      displayName: 'Momentum Builder',
      description: '5 consecutive topics mastered - you\'re on fire!',
      category: 'improvement',
      icon: '⚡',
      checkFunction: (metrics) => metrics.topicsMastered >= 5 && metrics.topicsMastered < 10
    },
    {
      id: 'mastery_mode',
      displayName: 'Mastery Mode',
      description: 'All topics in module complete - impressive!',
      category: 'improvement',
      icon: '🎯',
      checkFunction: (metrics) => metrics.topicsMastered >= 10 && metrics.topicsMastered < 20
    },
    {
      id: 'topic_master',
      displayName: 'Topic Master',
      description: '15+ topics mastered - you\'ve achieved mastery!',
      category: 'improvement',
      icon: '🌟',
      checkFunction: (metrics) => metrics.topicsMastered >= 20 && metrics.topicsMastered < 50
    },
    {
      id: 'expert_path',
      displayName: 'Expert Path',
      description: '50+ topics mastered - you\'re an expert in training!',
      category: 'improvement',
      icon: '👑',
      checkFunction: (metrics) => metrics.topicsMastered >= 50
    }
  ]
};

/**
 * Get all milestone definitions
 * @returns {object} - Milestones grouped by category
 */
function getAllMilestones() {
  return MILESTONE_DEFINITIONS;
}

/**
 * Check which milestones should be awarded based on metrics
 * @param {object} metrics - Student metrics
 * @param {object} achievedMilestones - List of already achieved milestone IDs
 * @returns {object[]} - List of milestones to award
 */
function checkAndAwardMilestones(metrics, achievedMilestones = []) {
  const toAward = [];
  
  Object.entries(MILESTONE_DEFINITIONS).forEach(([category, milestones]) => {
    milestones.forEach(milestone => {
      // Skip if already achieved
      if (achievedMilestones.includes(milestone.id)) {
        return;
      }
      
      // Check if milestone should be awarded
      try {
        const shouldAward = milestone.checkFunction(metrics);
        if (shouldAward) {
          toAward.push({
            ...milestone,
            awardedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error checking milestone ${milestone.id}:`, error);
      }
    });
  });
  
  return toAward;
}

/**
 * Get a milestone by ID
 * @param {string} milestoneId - Milestone ID
 * @returns {object|null} - Milestone definition or null
 */
function getMilestoneById(milestoneId) {
  for (const [category, milestones] of Object.entries(MILESTONE_DEFINITIONS)) {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
      return { ...milestone, category };
    }
  }
  return null;
}

/**
 * Get milestones by category
 * @param {string} category - Milestone category
 * @returns {object[]} - Array of milestones in category
 */
function getMilestonesByCategory(category) {
  return MILESTONE_DEFINITIONS[category] || [];
}

/**
 * Get milestone progress
 * @param {object} metrics - Student metrics
 * @param {string} milestoneId - Milestone ID
 * @returns {number} - Progress from 0 to 1
 */
function getMilestoneProgress(metrics, milestoneId) {
  const milestone = getMilestoneById(milestoneId);
  if (!milestone) {
    return 0;
  }
  
  // Extract the numeric threshold from checkFunction
  // This is a simplified approach - in production, you'd want better separation
  const milestoneKey = getMilestoneThresholdKey(milestone);
  const threshold = getMilestoneThresholdValue(milestone);
  const currentValue = metrics[metrics.effort.totalAttempts ? 'totalAttempts' : 'timeSpent'] || 0;
  
  const progress = Math.min(currentValue / threshold, 1);
  return Math.max(progress, 0);
}

/**
 * Get the threshold key for a milestone
 * @param {object} milestone - Milestone definition
 * @returns {string} - Metric name
 */
function getMilestoneThresholdKey(milestone) {
  if (milestone.id.includes('time')) {
    return 'totalTime';
  }
  if (milestone.id.includes('session')) {
    return 'sessionCount';
  }
  if (milestone.id.includes('recover')) {
    return 'recoveries';
  }
  if (milestone.id.includes('attempt')) {
    return 'totalAttempts';
  }
  if (milestone.id.includes('topic')) {
    return 'topicsMastered';
  }
  return 'totalTime';
}

/**
 * Get the threshold value for a milestone
 * @param {object} milestone - Milestone definition
 * @returns {number} - Threshold value
 */
function getMilestoneThresholdValue(milestone) {
  if (milestone.id === 'first_try') return 1;
  if (milestone.id === 'ten_minutes') return 600;
  if (milestone.id === 'half_hour') return 1800;
  if (milestone.id === 'full_hour') return 3600;
  if (milestone.id === 'two_hours') return 7200;
  if (milestone.id === 'five_hours') return 18000;
  if (milestone.id === 'session_starter') return 1;
  if (milestone.id === 'habit_builder') return 3;
  if (milestone.id === 'deep_diver') return 1800;
  if (milestone.id === 'flow_candidate') return 3600;
  if (milestone.id === 'flow_master') return 5400;
  if (milestone.id === 'comeback_kid') return 3;
  if (milestone.id === 'unstoppable') return 10;
  if (milestone.id === 'grinder') return 100;
  if (milestone.id === 'never_give_up') return 200;
  if (milestone.id === 'champion_comeback') return 30;
  if (milestone.id === 'light_bulb') return 1;
  if (milestone.id === 'momentum') return 5;
  if (milestone.id === 'mastery_mode') return 10;
  if (milestone.id === 'topic_master') return 20;
  if (milestone.id === 'expert_path') return 50;
  return 1;
}

/**
 * Get milestones with progress indicators
 * @param {object} metrics - Student metrics
 * @param {object} achievedMilestones - List of achieved milestone IDs
 * @returns {object} - Milestones grouped by achievement status
 */
function getMilestoneProgressReport(metrics, achievedMilestones = []) {
  const allMilestones = getAllMilestones();
  const report = {
    achieved: [],
    locked: [],
    recentlyAchieved: []
  };
  
  Object.entries(allMilestones).forEach(([category, milestones]) => {
    milestones.forEach(milestone => {
      const progress = getMilestoneProgress(metrics, milestone.id);
      
      if (achievedMilestones.includes(milestone.id)) {
        report.achieved.push({
          ...milestone,
          category,
          achievedAt: new Date().toISOString()
        });
      } else if (progress > 0) {
        report.locked.push({
          ...milestone,
          category,
          progress,
          nextMilestone: milestone.displayName,
          currentProgress: `${(progress * 100).toFixed(0)}%`
        });
      }
    });
  });
  
  // Sort by progress descending
  report.locked.sort((a, b) => b.progress - a.progress);
  
  return report;
}

module.exports = {
  MILESTONE_DEFINITIONS,
  getAllMilestones,
  checkAndAwardMilestones,
  getMilestoneById,
  getMilestonesByCategory,
  getMilestoneProgress,
  getMilestoneProgressReport
};
