/**
 * Flashcard Router
 * Route definitions for review API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  generateFlashcards,
  getFlashcard,
  reviewFlashcard,
  getReviewSchedule,
  getDueFlashcards,
  getStats,
  resetSchedule
} = require('./flashcard-controller');

/**
 * POST /api/projects/:projectId/review/generate-flashcards
 * Generate flashcards from study materials
 */
router.post('/projects/:projectId/review/generate-flashcards', generateFlashcards);

/**
 * GET /api/projects/:projectId/review/flashcards/:flashcardId
 * Get a specific flashcard
 */
router.get('/projects/:projectId/review/flashcards/:flashcardId', getFlashcard);

/**
 * POST /api/projects/:projectId/review/review-flashcard
 * Record a review of a flashcard
 */
router.post('/projects/:projectId/review/review-flashcard', reviewFlashcard);

/**
 * GET /api/projects/:projectId/review/review-schedule
 * Get upcoming review schedule
 */
router.get('/projects/:projectId/review/review-schedule', getReviewSchedule);

/**
 * GET /api/projects/:projectId/review/due
 * Get flashcards due for review
 */
router.get('/projects/:projectId/review/due', getDueFlashcards);

/**
 * GET /api/projects/:projectId/review/stats
 * Get student progress statistics
 */
router.get('/projects/:projectId/review/stats', getStats);

/**
 * POST /api/projects/:projectId/review/reset
 * Reset a flashcard's schedule
 */
router.post('/projects/:projectId/review/reset/:flashcardId', resetSchedule);

module.exports = router;
