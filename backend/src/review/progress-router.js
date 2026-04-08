/**
 * Progress Router
 * Route definitions for progress tracking API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  recordAnswer,
  getSessionProgress,
  getLearningProgress,
  getWeakAreas,
  generateRecommendations
} = require('./progress-controller');

/**
 * POST /api/projects/:projectId/review/progress/record
 * Record answer submission
 */
router.post('/projects/:projectId/review/progress/record', recordAnswer);

/**
 * GET /api/projects/:projectId/review/progress/session/:sessionId
 * Get session progress
 */
router.get('/projects/:projectId/review/progress/session/:sessionId', getSessionProgress);

/**
 * GET /api/projects/:projectId/review/progress/learning
 * Get learning progress
 */
router.get('/projects/:projectId/review/progress/learning', getLearningProgress);

/**
 * GET /api/projects/:projectId/review/progress/weak-areas
 * Get weak areas for focus
 */
router.get('/projects/:projectId/review/progress/weak-areas', getWeakAreas);

/**
 * POST /api/projects/:projectId/review/progress/recommendations
 * Generate personalized recommendations
 */
router.post('/projects/:projectId/review/progress/recommendations', generateRecommendations);

module.exports = router;
