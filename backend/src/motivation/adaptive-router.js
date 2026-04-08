/**
 * Adaptive Encouragement Router
 * Route definitions for adaptive encouragement API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  detectStruggle,
  getRecommendations,
  recordFeedback,
  getStruggleInsights,
  generateEncouragement
} = require('./adaptive-controller');

/**
 * POST /api/projects/:projectId/motivation/detect-struggle
 * Detects struggle signals from recent activity
 */
router.post('/projects/:projectId/motivation/detect-struggle', detectStruggle);

/**
 * POST /api/projects/:projectId/motivation/recommend
 * Get personalized recommendations based on struggle analysis
 */
router.post('/projects/:projectId/motivation/recommend', getRecommendations);

/**
 * POST /api/projects/:projectId/motivation/feedback
 * Record student response to recommendation
 */
router.post('/projects/:projectId/motivation/feedback', recordFeedback);

/**
 * GET /api/projects/:projectId/motivation/struggle-insights
 * Get historical struggle patterns and insights
 */
router.get('/projects/:projectId/motivation/struggle-insights', getStruggleInsights);

/**
 * POST /api/projects/:projectId/motivation/encouragement
 * Generate encouragement for current activity
 */
router.post('/projects/:projectId/motivation/encouragement', generateEncouragement);

module.exports = router;
