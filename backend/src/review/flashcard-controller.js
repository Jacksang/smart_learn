/**
 * Flashcard Controller
 * API endpoints for flashcard generation and review
 */

const { flashcardService } = require('./flashcard-service');

/**
 * POST /api/projects/:projectId/review/generate-flashcards
 * Generate flashcards from study materials
 */
async function generateFlashcards(req, res) {
  try {
    const { projectId } = req.params;
    const {
      materials,
      options
    } = req.body;

    if (!materials || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        error: 'materials is required and must be an array'
      });
    }

    // Validate options
    const validOptions = {
      maxFlashcards: options?.maxFlashcards || 50,
      questionTypes: options?.questionTypes || ['multiple_choice', 'fill_blank'],
      includeOpenEnded: options?.includeOpenEnded || false,
      cognitiveLevel: options?.cognitiveLevel || 'recall'
    };

    // Check for content in materials
    let content;
    let contentType;

    if (materials[0].content) {
      content = materials[0].content;
      contentType = materials[0].contentType;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Material content is required for flashcard generation'
      });
    }

    const result = await flashcardService.generateFlashcards(projectId, materials, {
      ...validOptions,
      content,
      contentType
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in generateFlashcards:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/flashcards/:flashcardId
 * Get a specific flashcard
 */
async function getFlashcard(req, res) {
  try {
    const { projectId, flashcardId } = req.params;

    const result = flashcardService.getFlashcard(flashcardId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in getFlashcard:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/projects/:projectId/review/review-flashcard
 * Record a review of a flashcard
 */
async function reviewFlashcard(req, res) {
  try {
    const { projectId, flashcardId } = req.params;
    const { rating, responseTime } = req.body;

    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'rating is required and must be between 0 and 5'
      });
    }

    const result = await flashcardService.reviewFlashcard(
      flashcardId,
      rating,
      responseTime
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in reviewFlashcard:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/review-schedule
 * Get upcoming review schedule
 */
async function getReviewSchedule(req, res) {
  try {
    const { projectId } = req.params;
    const { startDate, days } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const duration = parseInt(days) || 7;

    const result = flashcardService.getReviewSchedule(start, duration);

    return res.json(result);
  } catch (error) {
    console.error('Error in getReviewSchedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/due
 * Get flashcards due for review
 */
async function getDueFlashcards(req, res) {
  try {
    const { projectId } = req.params;
    const { targetDate } = req.query;

    const date = targetDate ? new Date(targetDate) : new Date();

    const result = flashcardService.getFlashcardsDue(date);

    return res.json(result);
  } catch (error) {
    console.error('Error in getDueFlashcards:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/stats
 * Get student progress statistics
 */
async function getStats(req, res) {
  try {
    const { projectId } = req.params;

    const stats = flashcardService.getStudentProgress(projectId);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/projects/:projectId/review/reset
 * Reset a flashcard's schedule
 */
async function resetSchedule(req, res) {
  try {
    const { projectId, flashcardId } = req.params;

    const result = flashcardService.resetFlashcardSchedule(flashcardId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in resetSchedule:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  generateFlashcards,
  getFlashcard,
  reviewFlashcard,
  getReviewSchedule,
  getDueFlashcards,
  getStats,
  resetSchedule
};
