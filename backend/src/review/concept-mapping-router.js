/**
 * Concept Mapping Router
 * Route definitions for concept mapping API endpoints
 */

const express = require('express');
const router = express.Router();

const {
  generateConceptMap,
  listConceptMaps,
  getConceptMap,
  getLinkedFlashcards,
  getAllConcepts,
  exportConceptMap,
  importConceptMap
} = require('./concept-mapping-controller');

/**
 * POST /api/projects/:projectId/review/concept-map/generate
 * Generate new concept map from materials
 */
router.post('/projects/:projectId/review/concept-map/generate', generateConceptMap);

/**
 * GET /api/projects/:projectId/review/concept-maps
 * List all concept maps for a project
 */
router.get('/projects/:projectId/review/concept-maps', listConceptMaps);

/**
 * GET /api/projects/:projectId/review/concept-map/:mapId
 * Get specific concept map details
 */
router.get('/projects/:projectId/review/concept-map/:mapId', getConceptMap);

/**
 * GET /api/projects/:projectId/review/concept-map/:mapId/linked-flashcards
 * Get flashcards linked to concept map
 */
router.get('/projects/:projectId/review/concept-map/:mapId/linked-flashcards', getLinkedFlashcards);

/**
 * GET /api/projects/:projectId/review/concepts
 * Get all concepts for a project
 */
router.get('/projects/:projectId/review/concepts', getAllConcepts);

/**
 * GET /api/projects/:projectId/review/concept-map/:mapId/export
 * Export concept map for persistence
 */
router.get('/projects/:projectId/review/concept-map/:mapId/export', exportConceptMap);

/**
 * POST /api/projects/:projectId/review/concept-map/import
 * Import concept map from external source
 */
router.post('/projects/:projectId/review/concept-map/import', importConceptMap);

module.exports = router;
