/**
 * Voice Interaction Router
 * Route definitions for voice interaction API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  recordVoiceInput,
  executeVoiceCommand,
  getSessionDetails,
  getVoiceStatus,
  getAvailableModels,
  initializeVoiceService
} = require('./voice-interaction-controller');

/**
 * POST /api/projects/:projectId/review/voice/record
 * Record and transcribe voice input
 */
router.post('/projects/:projectId/review/voice/record', recordVoiceInput);

/**
 * POST /api/projects/:projectId/review/voice/command
 * Parse and execute voice command
 */
router.post('/projects/:projectId/review/voice/command', executeVoiceCommand);

/**
 * GET /api/projects/:projectId/review/voice/session/:sessionId
 * Get voice interaction session details
 */
router.get('/projects/:projectId/review/voice/session/:sessionId', getSessionDetails);

/**
 * GET /api/projects/:projectId/review/voice/status
 * Get voice interaction system status
 */
router.get('/projects/:projectId/review/voice/status', getVoiceStatus);

/**
 * GET /api/projects/:projectId/review/voice/models
 * List available Whisper models
 */
router.get('/projects/:projectId/review/voice/models', getAvailableModels);

/**
 * POST /api/projects/:projectId/review/voice/initialize
 * Initialize voice interaction service
 */
router.post('/projects/:projectId/review/voice/initialize', initializeVoiceService);

module.exports = router;
