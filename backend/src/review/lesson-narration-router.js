/**
 * Lesson Narration Router
 * Route definitions for narration API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  generateNarration,
  listNarrations,
  getNarration,
  getNarrationStatus,
  deleteNarration,
  downloadNarration,
  getVoices,
  getMusicStyles
} = require('./lesson-narration-controller');

/**
 * POST /api/projects/:projectId/review/narration/generate
 * Generate new narration from lesson materials
 */
router.post('/projects/:projectId/review/narration/generate', generateNarration);

/**
 * GET /api/projects/:projectId/review/narrations
 * List all narrations for a project
 */
router.get('/projects/:projectId/review/narrations', listNarrations);

/**
 * GET /api/projects/:projectId/review/narration/:narrationId
 * Get specific narration details
 */
router.get('/projects/:projectId/review/narration/:narrationId', getNarration);

/**
 * GET /api/projects/:projectId/review/narration/:narrationId/status
 * Get narration generation status
 */
router.get('/projects/:projectId/review/narration/:narrationId/status', getNarrationStatus);

/**
 * DELETE /api/projects/:projectId/review/narration/:narrationId
 * Delete narration
 */
router.delete('/projects/:projectId/review/narration/:narrationId', deleteNarration);

/**
 * GET /api/projects/:projectId/review/narration/:narrationId/download
 * Download narration audio file
 */
router.get('/projects/:projectId/review/narration/:narrationId/download', downloadNarration);

/**
 * GET /api/projects/:projectId/review/narration/voices
 * List available TTS voices
 */
router.get('/projects/:projectId/review/narration/voices', getVoices);

/**
 * GET /api/projects/:projectId/review/narration/music-styles
 * List available music styles
 */
router.get('/projects/:projectId/review/narration/music-styles', getMusicStyles);

module.exports = router;
