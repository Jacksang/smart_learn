/**
 * Concept Mapping Controller
 * API endpoints for concept mapping operations
 */

const { conceptMappingService } = require('./visualization-service');

/**
 * POST /api/projects/:projectId/review/concept-map/generate
 * Generate new concept map from materials
 */
async function generateConceptMap(req, res) {
  try {
    const { projectId } = req.params;
    const { concepts, outlineItems, options } = req.body;

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'concepts is required and must be a non-empty array'
      });
    }

    const result = await conceptMappingService.generateConceptMap(
      projectId,
      concepts,
      outlineItems || []
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in generateConceptMap:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/concept-maps
 * List all concept maps for a project
 */
async function listConceptMaps(req, res) {
  try {
    const { projectId } = req.params;

    const result = conceptMappingService.listConceptMaps(projectId);

    return res.json(result);
  } catch (error) {
    console.error('Error in listConceptMaps:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/concept-map/:mapId
 * Get specific concept map details
 */
async function getConceptMap(req, res) {
  try {
    const { projectId, mapId } = req.params;

    const result = conceptMappingService.getConceptMap(mapId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in getConceptMap:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/concept-map/:mapId/linked-flashcards
 * Get flashcards linked to concept map
 */
async function getLinkedFlashcards(req, res) {
  try {
    const { projectId, mapId } = req.params;

    const result = conceptMappingService.getLinkedFlashcards(mapId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in getLinkedFlashcards:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/concepts
 * Get all concepts for a project
 */
async function getAllConcepts(req, res) {
  try {
    const { projectId } = req.params;

    const result = conceptMappingService.getAllConcepts(projectId);

    return res.json(result);
  } catch (error) {
    console.error('Error in getAllConcepts:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/projects/:projectId/review/concept-map/:mapId/export
 * Export concept map for persistence
 */
async function exportConceptMap(req, res) {
  try {
    const { projectId, mapId } = req.params;

    const result = conceptMappingService.exportConceptMap(mapId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in exportConceptMap:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/projects/:projectId/review/concept-map/import
 * Import concept map from external source
 */
async function importConceptMap(req, res) {
  try {
    const { projectId } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'import data is required'
      });
    }

    const result = conceptMappingService.importConceptMap(data);

    return res.json(result);
  } catch (error) {
    console.error('Error in importConceptMap:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  generateConceptMap,
  listConceptMaps,
  getConceptMap,
  getLinkedFlashcards,
  getAllConcepts,
  exportConceptMap,
  importConceptMap
};
