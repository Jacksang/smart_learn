/**
 * Voice Interaction Controller
 * API endpoints for voice interaction operations
 */

const { voiceQuizService } = require('./voice-quiz-service');

/**
 * POST /api/projects/:projectId/review/voice/record
 * Record and transcribe voice input
 */
async function recordVoiceInput(req, res) {
  try {
    const { projectId } = req.params;
    const { sessionId, questionId, audioPath, options } = req.body;

    if (!sessionId || !questionId || !audioPath) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, questionId, and audioPath are required'
      });
    }

    const result = await voiceQuizService.recordInput(sessionId, questionId, audioPath, options);

    return res.json(result);
  } catch (error) {
    console.error('Error in recordVoiceInput:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record voice input'
    });
  }
}

/**
 * POST /api/projects/:projectId/review/voice/command
 * Parse and execute voice command
 */
async function executeVoiceCommand(req, res) {
  try {
    const { projectId } = req.params;
    const { sessionId, transcribedText, options } = req.body;

    if (!sessionId || !transcribedText) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and transcribedText are required'
      });
    }

    const result = await voiceQuizService.executeCommand(sessionId, transcribedText, options);

    return res.json(result);
  } catch (error) {
    console.error('Error in executeVoiceCommand:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute voice command'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/voice/session/:sessionId
 * Get voice interaction session details
 */
async function getSessionDetails(req, res) {
  try {
    const { projectId, sessionId } = req.params;

    const recordings = voiceQuizService.getSessionRecordings(sessionId);
    const stats = voiceQuizService.getSessionStats(sessionId);

    return res.json({
      success: true,
      data: {
        sessionId,
        recordings,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getSessionDetails:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get session details'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/voice/status
 * Get voice interaction system status
 */
async function getVoiceStatus(req, res) {
  try {
    const status = await voiceQuizService.getStatus();

    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in getVoiceStatus:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get voice status'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/voice/models
 * List available Whisper models
 */
async function getAvailableModels(req, res) {
  try {
    const models = voiceQuizService.getModels();

    return res.json({
      success: true,
      data: {
        models,
        default: 'small'
      }
    });
  } catch (error) {
    console.error('Error in getAvailableModels:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get available models'
    });
  }
}

/**
 * POST /api/projects/:projectId/review/voice/initialize
 * Initialize voice interaction service
 */
async function initializeVoiceService(req, res) {
  try {
    const { projectId } = req.params;
    const { lessonPlayer } = req.body;

    if (!lessonPlayer) {
      return res.status(400).json({
        success: false,
        error: 'lessonPlayer reference is required'
      });
    }

    await voiceQuizService.initialize(lessonPlayer);

    return res.json({
      success: true,
      message: 'Voice service initialized'
    });
  } catch (error) {
    console.error('Error in initializeVoiceService:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize voice service'
    });
  }
}

module.exports = {
  recordVoiceInput,
  executeVoiceCommand,
  getSessionDetails,
  getVoiceStatus,
  getAvailableModels,
  initializeVoiceService
};
