/**
 * Concept Graph Analysis System
 * Builds and analyzes concept relationship graphs
 */

/**
 * Graph structure for concept relationships
 * - Nodes: Concepts with properties and metadata
 * - Edges: Relationships between concepts
 * - Analysis: Centrality, coverage, clusters
 */

class ConceptGraph {
  constructor() {
    this.nodes = new Map(); // conceptId -> concept object
    this.edges = []; // array of relationship objects
    this.adjacencyList = new Map(); // conceptId -> array of connected ids
  }

  /**
   * Build graph from extracted concepts
   */
  build(concepts, relationships = []) {
    // Clear existing data
    this.nodes.clear();
    this.edges = [];
    this.adjacencyList = new Map();

    // Add nodes
    concepts.forEach(concept => {
      this.addNode({
        id: concept.id || `concept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        term: concept.term,
        definition: concept.definition,
        priority: concept.priority || 0.5,
        type: concept.type || 'term',
        coverage: concept.coverage || 'pending',
        relatedTerms: concept.relatedTerms || []
      });
    });

    // Add edges from relationships
    relationships.forEach(rel => {
      this.addEdge({
        fromId: rel.fromId,
        toId: rel.toId,
        type: rel.type,
        strength: rel.strength || 0.5
      });
    });

    return this;
  }

  /**
   * Add a concept node
   */
  addNode(concept) {
    if (!this.nodes.has(concept.id)) {
      this.nodes.set(concept.id, {
        ...concept,
        centrality: 0,
        connections: []
      });
      this.adjacencyList.set(concept.id, []);
    }
    return this;
  }

  /**
   * Add an edge between concepts
   */
  addEdge(edge) {
    if (!this.nodes.has(edge.fromId) || !this.nodes.has(edge.toId)) {
      throw new Error(`Edge connects non-existent concepts: ${edge.fromId} -> ${edge.toId}`);
    }

    // Check for duplicate edges
    const exists = this.edges.some(e =>
      e.fromId === edge.fromId &&
      e.toId === edge.toId &&
      e.type === edge.type
    );

    if (exists) {
      // Update existing edge strength
      const existingEdge = this.edges.find(e =>
        e.fromId === edge.fromId &&
        e.toId === edge.toId &&
        e.type === edge.type
      );
      if (existingEdge) {
        existingEdge.strength = Math.max(existingEdge.strength, edge.strength);
      }
    } else {
      this.edges.push({
        id: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        fromId: edge.fromId,
        toId: edge.toId,
        type: edge.type,
        strength: edge.strength
      });
    }

    // Update adjacency lists
    this._updateAdjacency(edge.fromId, edge.toId);
    if (edge.type !== 'directed') {
      this._updateAdjacency(edge.toId, edge.fromId);
    }

    return this;
  }

  /**
   * Update adjacency list
   */
  _updateAdjacency(fromId, toId) {
    const existing = this.adjacencyList.get(fromId) || [];
    if (!existing.includes(toId)) {
      existing.push(toId);
      this.adjacencyList.set(fromId, existing);
    }
  }

  /**
   * Calculate centrality metrics
   */
  calculateCentrality() {
    const nodes = Array.from(this.nodes.values());
    const metrics = {};

    nodes.forEach(node => {
      metrics[node.id] = {
        degree: this._calculateDegree(node.id),
        betweenness: this._calculateBetweenness(node.id),
        closeness: this._calculateCloseness(node.id),
        eigenvector: this._calculateEigenvector(node.id)
      };
    });

    // Normalize and apply to nodes
    const normalized = this._normalizeCentrality(metrics);

    nodes.forEach(node => {
      node.centrality = normalized[node.id].overall;
      node.degree = normalized[node.id].degree;
      node.betweenness = normalized[node.id].betweenness;
      node.closeness = normalized[node.id].closeness;
      node.eigenvector = normalized[node.id].eigenvector;
    });

    return nodes;
  }

  /**
   * Calculate degree centrality
   */
  _calculateDegree(nodeId) {
    const connections = this.adjacencyList.get(nodeId) || [];
    return connections.length / (this.nodes.size - 1);
  }

  /**
   * Calculate betweenness centrality
   */
  _calculateBetweenness(nodeId) {
    let betweenness = 0;
    const nodes = Array.from(this.nodes.keys());

    for (const start of nodes) {
      if (start === nodeId) continue;

      const paths = this._countShortestPaths(start, nodeId, nodes);
      const totalPaths = this._countAllShortestPaths(start, nodes);

      if (totalPaths > 0) {
        betweenness += paths / totalPaths;
      }
    }

    return betweenness / 2; // Undirected graph
  }

  /**
   * Calculate closeness centrality
   */
  _calculateCloseness(nodeId) {
    const distances = this._calculateShortestDistances(nodeId);
    const reachable = Object.values(distances).filter(d => d > 0);
    const avgDistance = reachable.reduce((a, b) => a + b, 0) / reachable.length;

    return reachable.length > 0 ? 1 / avgDistance : 0;
  }

  /**
   * Calculate eigenvector centrality (simplified)
   */
  _calculateEigenvector(nodeId) {
    // Iterative approximation
    let centrality = Array.from(this.nodes.values()).map(n => 1 / this.nodes.size);

    for (let i = 0; i < 10; i++) {
      centrality = this._calculateEigenvectorIteration(centrality);
    }

    const nodeIdIndex = Array.from(this.nodes.keys()).indexOf(nodeId);
    return centrality[nodeIdIndex] || 0;
  }

  /**
   * Normalize centrality scores to 0-1 range
   */
  _normalizeCentrality(metrics) {
    const maxScores = {
      degree: 0,
      betweenness: 0,
      closeness: 0,
      eigenvector: 0
    };

    // Find maximum values
    Object.values(metrics).forEach(scores => {
      maxScores.degree = Math.max(maxScores.degree, scores.degree);
      maxScores.betweenness = Math.max(maxScores.betweenness, scores.betweenness);
      maxScores.closeness = Math.max(maxScores.closeness, scores.closeness);
      maxScores.eigenvector = Math.max(maxScores.eigenvector, scores.eigenvector);
    });

    // Normalize
    const normalized = {};
    Object.keys(metrics).forEach(nodeId => {
      const m = metrics[nodeId];
      normalized[nodeId] = {
        degree: maxScores.degree > 0 ? m.degree / maxScores.degree : 0,
        betweenness: maxScores.betweenness > 0 ? m.betweenness / maxScores.betweenness : 0,
        closeness: maxScores.closeness > 0 ? m.closeness / maxScores.closeness : 0,
        eigenvector: maxScores.eigenvector > 0 ? m.eigovector / maxScores.eigenvector : 0,
        overall: (m.degree + m.betweenness + m.closeness + m.eigenvector) / 4
      };
    });

    return normalized;
  }

  /**
   * Get graph metadata
   */
  getMetadata() {
    const nodes = Array.from(this.nodes.values());
    const edges = this.edges;

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      density: edges.length / (nodes.length * (nodes.length - 1) / 2),
      avgDegree: nodes.reduce((sum, n) => sum + n.degree, 0) / nodes.length,
      avgCentrality: nodes.reduce((sum, n) => sum + n.centrality, 0) / nodes.length
    };
  }

  /**
   * Get concept with highest centrality
   */
  getMostCentralConcept() {
    const nodes = Array.from(this.nodes.values());
    const mostCentral = nodes.reduce((max, node) =>
      node.centrality > max.centrality ? node : max
    );
    return mostCentral;
  }

  /**
   * Get connected components
   */
  getConnectedComponents() {
    const visited = new Set();
    const components = [];

    const dfs = (nodeId, component) => {
      visited.add(nodeId);
      component.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, component);
        }
      });
    };

    this.nodes.forEach((node, nodeId) => {
      if (!visited.has(nodeId)) {
        const component = [];
        dfs(nodeId, component);
        components.push(component);
      }
    });

    return components;
  }

  /**
   * Export graph as JSON
   */
  toJSON() {
    return {
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
        id,
        term: node.term,
        definition: node.definition,
        centrality: node.centrality,
        degree: node.degree,
        priority: node.priority
      })),
      edges: this.edges.map(edge => ({
        fromId: edge.fromId,
        toId: edge.toId,
        type: edge.type,
        strength: edge.strength
      })),
      metadata: this.getMetadata()
    };
  }
}

// Helper functions for centrality calculations
const CentralityHelpers = {
  /**
   * Count shortest paths from start to target passing through middle
   */
  countShortestPaths(start, middle, allNodes) {
    // Simplified BFS implementation
    return 1; // Placeholder for actual implementation
  },

  /**
   * Count all shortest paths between two nodes
   */
  countAllShortestPaths(start, allNodes) {
    // Simplified implementation
    return 1; // Placeholder for actual implementation
  },

  /**
   * Calculate shortest distances from a node to all others
   */
  calculateShortestDistances(source) {
    // BFS implementation
    const distances = {};
    const visited = new Set();
    const queue = [{ nodeId: source, distance: 0 }];

    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift();

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      distances[nodeId] = distance;

      const neighbors = Array.from(new CentralityHelpers().adjacencyList.get(nodeId) || []);
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, distance: distance + 1 });
        }
      });
    }

    return distances;
  },

  /**
   * Iterative eigenvector centrality calculation
   */
  calculateEigenvectorIteration(centrality) {
    const newCentrality = centrality.map((_, i) => {
      let sum = 0;
      // Simplified: sum neighbors' centrality
      return sum / centrality.length;
    });
    return newCentrality;
  }
};

module.exports = {
  ConceptGraph,
  CentralityHelpers
};
