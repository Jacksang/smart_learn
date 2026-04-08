/**
 * Lesson Narration Controller
 * API endpoints for narration operations
 */

const { narrationService } = require('./narration-service');

/**
 * POST /api/projects/:projectId/review/narration/generate
 * Generate new narration from lesson materials
 */
async function generateNarration(req, res) {
  try {
    const { projectId } = req.params;
    const { lessonId, materials, options } = req.body;

    if (!lessonId || !materials || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        error: 'lessonId and materials (array) are required'
      });
    }

    const result = await narrationService.generateNarration(
      projectId,
      lessonId,
      materials,
      options || {}
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in generateNarration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/narrations
 * List all narrations for a project
 */
async function listNarrations(req, res) {
  try {
    const { projectId } = req.params;

    const result = narrationService.listNarrations(projectId);

    return res.json(result);
  } catch (error) {
    console.error('Error in listNarrations:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/narration/:narrationId
 * Get specific narration details
 */
async function getNarration(req, res) {
  try {
    const { projectId, narrationId } = req.params;

    const result = narrationService.getNarration(narrationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in getNarration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/narration/:narrationId/status
 * Get narration generation status
 */
async function getNarrationStatus(req, res) {
  try {
    const { projectId, narrationId } = req.params;

    const result = narrationService.getNarrationStatus(narrationId);

    return res.json(result);
  } catch (error) {
    console.error('Error in getNarrationStatus:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * DELETE /api/projects/:projectId/review/narration/:narrationId
 * Delete narration
 */
async function deleteNarration(req, res) {
  try {
    const { projectId, narrationId } = req.params;

    const result = narrationService.deleteNarration(narrationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in deleteNarration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/narration/:narrationId/download
 * Download narration audio file
 */
async function downloadNarration(req, res) {
  try {
    const { projectId, narrationId } = req.params;

    const result = narrationService.getNarration(narrationId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    // In production, serve actual audio file
    // For now, return metadata
    return res.json({
      success: true,
      message: 'Narration download endpoint',
      downloadUrl: result.data.audioUrl
    });
  } catch (error) {
    console.error('Error in downloadNarration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/narration/voices
 * List available TTS voices
 */
async function getVoices(req, res) {
  try {
    const voices = await narrationService.ttsEngine.getVoices();

    return res.json({
      success: true,
      voices
    });
  } catch (error) {
    console.error('Error in getVoices:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/narration/music-styles
 * List available music styles
 */
async function getMusicStyles(req, res) {
  try {
    const styles = narrationService.audioMixer.getAvailableMusicStyles();

    return res.json({
      success: true,
      styles
    });
  } catch (error) {
    console.error('Error in getMusicStyles:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  generateNarration,
  listNarrations,
  getNarration,
  getNarrationStatus,
  deleteNarration,
  downloadNarration,
  getVoices,
  getMusicStyles
};
