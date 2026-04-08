/**
 * Motivation Engine - Router
 * Defines API routes for motivation features
 */

const express = require('express');
const {
  getFeedback,
  getLabels,
  encourageStudent,
  getMilestones,
  awardMilestones,
  getMilestoneDefinitionsHandler,
  trackActivity,
  getCategories
} = require('./controller');

const router = express.Router();

/**
 * POST /api/projects/:projectId/motivation/feedback
 * Get feedback for current activity
 */
router.post('/feedback', (req, res, next) => {
  getFeedback(req, res, next);
});

/**
 * GET /api/projects/:projectId/motivation/labels
 * Get progress labels for student
 */
router.get('/labels', (req, res, next) => {
  getLabels(req, res, next);
});

/**
 * POST /api/projects/:projectId/motivation/encourage
 * Generate encouragement message
 */
router.post('/encourage', (req, res, next) => {
  encourageStudent(req, res, next);
});

/**
 * GET /api/projects/:projectId/motivation/milestones
 * Get milestone progress
 */
router.get('/milestones', (req, res, next) => {
  getMilestones(req, res, next);
});

/**
 * POST /api/projects/:projectId/motivation/award
 * Check and award milestones
 */
router.post('/award', (req, res, next) => {
  awardMilestones(req, res, next);
});

/**
 * GET /api/projects/:projectId/motivation/definitions
 * Get milestone definitions
 */
router.get('/definitions', (req, res, next) => {
  getMilestoneDefinitionsHandler(req, res, next);
});

/**
 * POST /api/projects/:projectId/motivation/track
 * Track motivation activity
 */
router.post('/track', (req, res, next) => {
  trackActivity(req, res, next);
});

/**
 * GET /api/projects/:projectId/motivation/categories
 * Get feedback categories
 */
router.get('/categories', (req, res, next) => {
  getCategories(req, res, next);
});

module.exports = router;
