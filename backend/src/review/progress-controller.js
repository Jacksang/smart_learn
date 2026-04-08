/**
 * Progress Controller
 * API endpoints for progress tracking operations
 */

const { ProgressTracker, AnalyticsService } = require('./progress-tracker');

// Global instances
const tracker = new ProgressTracker();
const analyticsService = new AnalyticsService(tracker);

/**
 * POST /api/projects/:projectId/review/progress/record
 * Record answer submission
 */
async function recordAnswer(req, res) {
  try {
    const { sessionId, questionId, conceptId, isCorrect, isPartial, attempt, responseTime, confidenceRating, answerText } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and questionId are required'
      });
    }

    const answerData = {
      sessionId,
      questionId,
      conceptId,
      isCorrect: isCorrect || false,
      isPartial: isPartial || false,
      attempt: attempt || 1,
      responseTime: responseTime || null,
      confidenceRating: confidenceRating || null,
      answerText: answerText || null
    };

    const record = await tracker.recordAnswer(sessionId, questionId, answerData);

    return res.json({
      success: true,
      data: {
        recordId: record.id,
        timestamp: record.timestamp
      }
    });
  } catch (error) {
    console.error('Error in recordAnswer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record answer'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/progress/session/:sessionId
 * Get session progress
 */
async function getSessionProgress(req, res) {
  try {
    const { sessionId } = req.params;

    const result = await tracker.getProgress(sessionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in getSessionProgress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get session progress'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/progress/learning
 * Get learning progress
 */
async function getLearningProgress(req, res) {
  try {
    const { sessionId } = req.params;

    const result = await analyticsService.calculateLearningProgress(sessionId);

    return res.json(result);
  } catch (error) {
    console.error('Error in getLearningProgress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get learning progress'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/progress/weak-areas
 * Get weak areas for focus
 */
async function getWeakAreas(req, res) {
  try {
    const { sessionId } = req.params;

    const result = await analyticsService.calculateLearningProgress(sessionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      data: {
        weakAreas: result.data.weakAreas,
        totalWeak: result.data.weakAreas.totalWeak,
        areas: result.data.weakAreas.areas
      }
    });
  } catch (error) {
    console.error('Error in getWeakAreas:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get weak areas'
    });
  }
}

/**
 * POST /api/projects/:projectId/review/progress/recommendations
 * Generate personalized recommendations
 */
async function generateRecommendations(req, res) {
  try {
    const { sessionId } = req.params;
    const { focusAreas, timeframe } = req.body;

    const result = await analyticsService.calculateLearningProgress(sessionId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      data: {
        recommendations: result.data.recommendations
      }
    });
  } catch (error) {
    console.error('Error in generateRecommendations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
}

module.exports = {
  recordAnswer,
  getSessionProgress,
  getLearningProgress,
  getWeakAreas,
  generateRecommendations
};
