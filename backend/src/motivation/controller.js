/**
 * Motivation Engine - Controller
 * Handles API requests for motivation features
 */

const {
  getFeedbackForActivity,
  getProgressLabels,
  generateEncouragement,
  getMilestoneProgress,
  checkAndAwardMilestonesForStudent,
  getMilestoneDefinitions,
  trackMotivationActivity,
  getFeedbackCategories
} = require('./service');

/**
 * Get feedback for current activity
 * GET /api/projects/:projectId/motivation/feedback
 */
async function getFeedback(req, res) {
  try {
    const { projectId } = req.params;
    const { activityType, outcome, confidence, consecutiveFailures, timeSpent, sessionLength, recoveryCount } = req.body;

    if (!activityType || !outcome) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityType, outcome'
      });
    }

    const context = {
      activityType,
      outcome,
      confidence: confidence || 0.5,
      consecutiveFailures: consecutiveFailures || 0,
      timeSpent: timeSpent || 0,
      sessionLength: sessionLength || 0,
      recoveryCount: recoveryCount || 0
    };

    const result = await getFeedbackForActivity(context);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getFeedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback'
    });
  }
}

/**
 * Get progress labels for student
 * GET /api/projects/:projectId/motivation/labels
 */
async function getLabels(req, res) {
  try {
    const { projectId } = req.params;
    const { effort, focus, resilience, improvement } = req.body;

    if (!effort || !focus || !resilience || !improvement) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: effort, focus, resilience, improvement'
      });
    }

    const metrics = { effort, focus, resilience, improvement };
    const result = await getProgressLabels(metrics);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getLabels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get progress labels'
    });
  }
}

/**
 * Generate encouragement message
 * POST /api/projects/:projectId/motivation/encourage
 */
async function encourageStudent(req, res) {
  try {
    const { projectId } = req.params;
    const { effort, focus, resilience, improvement } = req.body;

    if (!effort || !focus || !resilience || !improvement) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: effort, focus, resilience, improvement'
      });
    }

    const metrics = { effort, focus, resilience, improvement };
    const message = await generateEncouragement(metrics);

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Error in encourageStudent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate encouragement'
    });
  }
}

/**
 * Get milestone progress
 * GET /api/projects/:projectId/motivation/milestones
 */
async function getMilestones(req, res) {
  try {
    const { projectId } = req.params;
    const { achievedMilestones = [] } = req.body;

    const metrics = {
      totalAttempts: 25,
      totalTime: 1800,
      sessionCount: 10,
      longestSession: 540,
      recoveries: 5,
      topicsMastered: 3
    };

    const result = await getMilestoneProgress(metrics, achievedMilestones);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getMilestones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get milestone progress'
    });
  }
}

/**
 * Check and award milestones
 * POST /api/projects/:projectId/motivation/award
 */
async function awardMilestones(req, res) {
  try {
    const { projectId } = req.params;
    const { studentId, metrics, achievedMilestones = [] } = req.body;

    if (!studentId || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentId, metrics'
      });
    }

    const result = await checkAndAwardMilestonesForStudent(metrics, studentId, achievedMilestones);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in awardMilestones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award milestones'
    });
  }
}

/**
 * Get milestone definitions
 * GET /api/projects/:projectId/motivation/definitions
 */
async function getMilestoneDefinitionsHandler(req, res) {
  try {
    const { projectId } = req.params;
    const definitions = await getMilestoneDefinitions();

    res.json({
      success: true,
      data: definitions
    });
  } catch (error) {
    console.error('Error in getMilestoneDefinitionsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get milestone definitions'
    });
  }
}

/**
 * Track motivation activity
 * POST /api/projects/:projectId/motivation/track
 */
async function trackActivity(req, res) {
  try {
    const { projectId } = req.params;
    const activity = req.body;

    if (!activity.activityType || !activity.result) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activityType, result'
      });
    }

    const result = await trackMotivationActivity(activity);

    if (!result.tracked) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in trackActivity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track activity'
    });
  }
}

/**
 * Get feedback categories
 * GET /api/projects/:projectId/motivation/categories
 */
async function getCategories(req, res) {
  try {
    const { projectId } = req.params;
    const categories = await getFeedbackCategories();

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback categories'
    });
  }
}

module.exports = {
  getFeedback,
  getLabels,
  encourageStudent,
  getMilestones,
  awardMilestones,
  getMilestoneDefinitionsHandler,
  trackActivity,
  getCategories
};
