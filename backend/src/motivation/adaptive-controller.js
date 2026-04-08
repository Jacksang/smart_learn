/**
 * Adaptive Encouragement Controller
 * API endpoints for struggle detection and recommendations
 */

const {
  getAdaptiveSupport,
  recordResponse,
  getStudentInsights,
  generateEncouragementHandler,
  getStruggleAnalysisHandler
} = require('./adaptive-service');

/**
 * POST /api/projects/:projectId/motivation/detect-struggle
 * Detects struggle signals from recent activity
 */
async function detectStruggle(req, res) {
  try {
    const { projectId } = req.params;
    const { activityHistory, studentId } = req.body;

    if (!activityHistory || !Array.isArray(activityHistory)) {
      return res.status(400).json({
        success: false,
        error: 'activityHistory is required and must be an array'
      });
    }

    const result = await getStruggleAnalysisHandler({
      projectId,
      studentId,
      history: activityHistory
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in detectStruggle:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/projects/:projectId/motivation/recommend
 * Get personalized recommendations based on struggle analysis
 */
async function getRecommendations(req, res) {
  try {
    const { projectId } = req.params;
    const { struggleAnalysis, studentContext } = req.body;

    if (!struggleAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'struggleAnalysis is required'
      });
    }

    const result = await getAdaptiveSupport([], studentContext);

    if (!result.struggleDetected) {
      return res.json({
        success: true,
        data: {
          struggleDetected: false,
          encouragement: 'Keep up the great work - you\'re doing great!',
          recommendations: []
        }
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/projects/:projectId/motivation/feedback
 * Record student response to recommendation
 */
async function recordFeedback(req, res) {
  try {
    const { projectId } = req.params;
    const { studentId, recommendationId, action, outcome, timeSpent } = req.body;

    if (!studentId || !recommendationId || !action) {
      return res.status(400).json({
        success: false,
        error: 'studentId, recommendationId, and action are required'
      });
    }

    const result = await recordResponse(studentId, recommendationId, action, outcome, timeSpent);

    return res.json(result);
  } catch (error) {
    console.error('Error in recordFeedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/motivation/struggle-insights
 * Get historical struggle patterns and insights
 */
async function getStruggleInsights(req, res) {
  try {
    const { projectId } = req.params;
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'studentId is required'
      });
    }

    const result = await getStudentInsights(studentId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in getStruggleInsights:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/projects/:projectId/motivation/encouragement
 * Generate encouragement for current activity
 */
async function generateEncouragement(req, res) {
  try {
    const { projectId } = req.params;
    const { activityHistory, studentId } = req.body;

    if (!activityHistory) {
      return res.status(400).json({
        success: false,
        error: 'activityHistory is required'
      });
    }

    const result = await generateEncouragementHandler({
      projectId,
      studentId,
      history: activityHistory
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in generateEncouragement:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  detectStruggle,
  getRecommendations,
  recordFeedback,
  getStruggleInsights,
  generateEncouragement
};
