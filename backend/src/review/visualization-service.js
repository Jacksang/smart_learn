/**
 * Concept Mapping Service Layer
 * Orchestrates concept mapping generation and analysis
 */

const { ConceptGraph } = require('./concept-graph');
const { LayoutAlgorithms } = require('./layout-algorithms');
const { OutlineIntegration } = require('./outline-integration');

/**
 * Concept Mapping Service Class
 * Manages concept map creation, analysis, and visualization
 */
class ConceptMappingService {
  constructor() {
    this.conceptGraph = new ConceptGraph();
    this.layoutAlgorithms = new LayoutAlgorithms();
    this.outlineIntegration = new OutlineIntegration();
    this.maps = new Map(); // In-memory storage for MVP
  }

  /**
   * Generate concept map from concepts and outline
   */
  async generateConceptMap(projectId, concepts, outlineItems = []) {
    try {
      // Build concept graph
      const graph = this._buildConceptGraph(concepts);

      // Calculate centrality
      graph.calculateCentrality();

      // Select optimal layout
      const layoutRecommendation = this.layoutAlgorithms.recommendLayout(graph);
      const layout = this.layoutAlgorithms.generate(layoutRecommendation.recommended, graph);

      // Integrate with outline
      const linkedConcepts = this.outlineIntegration.link(concepts, outlineItems);
      const coverageAnalysis = this.outlineIntegration.analyzeCoverage(linkedConcepts);
      const coverageSummary = this.outlineIntegration.getCoverageSummary(
        linkedConcepts,
        outlineItems
      );

      // Create concept map object
      const conceptMap = {
        id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        projectId,
        graph: {
          nodes: Array.from(graph.nodes.values()).map(node => ({
            id: node.id,
            term: node.term,
            definition: node.definition,
            centrality: node.centrality,
            priority: node.priority
          })),
          edges: graph.edges.map(edge => ({
            fromId: edge.fromId,
            toId: edge.toId,
            type: edge.type,
            strength: edge.strength
          })),
          metadata: graph.getMetadata()
        },
        layout,
        coverage: coverageSummary.coverage,
        gaps: coverageSummary.gaps,
        recommendations: coverageSummary.recommendations,
        linkedConcepts,
        createdAt: new Date().toISOString(),
        status: 'complete'
      };

      // Store map
      this.maps.set(conceptMap.id, conceptMap);

      return {
        success: true,
        data: {
          mapId: conceptMap.id,
          conceptMap,
          stats: {
            conceptsExtracted: concepts.length,
            relationshipsIdentified: graph.edges.length,
            layoutType: layoutRecommendation.recommended,
            coveragePercentage: coverageSummary.coverage.overallCoverage.toFixed(1),
            gapsCount: coverageSummary.gaps.totalGaps,
            layoutReason: layoutRecommendation.reason
          }
        }
      };
    } catch (error) {
      console.error('Error generating concept map:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build concept graph from extracted concepts
   */
  _buildConceptGraph(concepts) {
    const relationships = concepts.flatMap(concept => {
      return concept.relatedTerms?.map(term => ({
        fromId: concept.id,
        toId: this._findConceptId(concept.id, term),
        type: 'associative',
        strength: 0.7
      })) || [];
    });

    this.conceptGraph.build(concepts, relationships);

    return this.conceptGraph;
  }

  /**
   * Find concept ID by term (simplified)
   */
  _findConceptId(currentId, term) {
    // In production, this would search for matching concept
    // For now, generate a new ID
    return `concept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get concept map by ID
   */
  getConceptMap(mapId) {
    const map = this.maps.get(mapId);

    if (!map) {
      return {
        success: false,
        error: 'Concept map not found'
      };
    }

    return {
      success: true,
      data: map
    };
  }

  /**
   * List all concept maps for a project
   */
  listConceptMaps(projectId) {
    const projectMaps = Array.from(this.maps.values()).filter(
      map => map.projectId === projectId
    );

    return {
      success: true,
      data: {
        maps: projectMaps.map(map => ({
          id: map.id,
          projectId: map.projectId,
          conceptsCount: map.graph.metadata.totalNodes,
          coverage: map.coverage.overallCoverage.toFixed(1),
          layoutType: map.layout.type,
          createdAt: map.createdAt
        })),
        total: projectMaps.length
      }
    };
  }

  /**
   * Get linked flashcards for a concept map
   */
  getLinkedFlashcards(mapId) {
    const map = this.maps.get(mapId);

    if (!map) {
      return {
        success: false,
        error: 'Concept map not found'
      };
    }

    const linkedFlashcards = map.linkedConcepts.map(link => ({
      conceptId: link.concept.id,
      conceptTerm: link.concept.term,
      coverageStatus: link.coverageStatus
    }));

    return {
      success: true,
      data: {
        conceptId: mapId,
        linkedFlashcards
      }
    };
  }

  /**
   * Get all concepts for a project
   */
  getAllConcepts(projectId) {
    const projectMaps = Array.from(this.maps.values()).filter(
      map => map.projectId === projectId
    );

    const allConcepts = projectMaps.flatMap(map =>
      map.graph.nodes.map(node => ({
        id: node.id,
        term: node.term,
        centrality: node.centrality,
        priority: node.priority,
        mapId: map.id
      }))
    );

    const uniqueConcepts = [...new Map(allConcepts.map(c => [c.id, c])).values()];

    return {
      success: true,
      data: {
        concepts: uniqueConcepts.sort((a, b) => b.centrality - a.centrality),
        total: uniqueConcepts.length,
        metrics: {
          avgCentrality: uniqueConcepts.length > 0
            ? uniqueConcepts.reduce((sum, c) => sum + c.centrality, 0) / uniqueConcepts.length
            : 0
        }
      }
    };
  }

  /**
   * Export concept map for persistence
   */
  exportConceptMap(mapId) {
    const map = this.maps.get(mapId);

    if (!map) {
      return {
        success: false,
        error: 'Concept map not found'
      };
    }

    return {
      success: true,
      data: {
        id: map.id,
        projectId: map.projectId,
        graph: map.graph,
        layout: map.layout,
        coverage: map.coverage,
        createdAt: map.createdAt
      }
    };
  }

  /**
   * Import concept map from persistence
   */
  importConceptMap(importData) {
    const map = {
      ...importData,
      status: 'imported'
    };

    this.maps.set(map.id, map);

    return {
      success: true,
      imported: 1
    };
  }
}

// Global instance
const conceptMappingService = new ConceptMappingService();

module.exports = {
  ConceptMappingService,
  conceptMappingService
};
