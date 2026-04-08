/**
 * Layout Algorithms for Concept Maps
 * Generates visual layouts for concept graphs
 */

/**
 * Layout types:
 * - tree: Hierarchical tree structure
 * - network: Force-directed network layout
 * - timeline: Chronological timeline layout
 * - custom: User-defined custom layout
 */

class LayoutAlgorithms {
  constructor() {
    this.defaultSpacing = {
      vertical: 100,
      horizontal: 150
    };
    this.forceParams = {
      springLength: 100,
      springConstant: 0.01,
      repulsion: 500,
      iterations: 200
    };
  }

  /**
   * Generate layout based on type and graph
   */
  generate(layoutType, graph) {
    switch (layoutType) {
      case 'tree':
        return this.generateTreeLayout(graph);
      case 'network':
        return this.generateNetworkLayout(graph);
      case 'timeline':
        return this.generateTimelineLayout(graph);
      case 'custom':
        return this.generateCustomLayout(graph);
      default:
        return this.generateNetworkLayout(graph);
    }
  }

  /**
   * Generate tree layout for hierarchical content
   */
  generateTreeLayout(graph) {
    const nodes = Array.from(graph.nodes.values());
    const mostCentral = graph.getMostCentralConcept();

    if (!mostCentral) {
      return {
        type: 'tree',
        nodes: [],
        spacing: this.defaultSpacing
      };
    }

    // Build hierarchy from concept relationships
    const hierarchy = this._buildHierarchy(graph, mostCentral.id);

    // Calculate positions
    const positions = this._calculateTreePositions(hierarchy, this.defaultSpacing);

    return {
      type: 'tree',
      rootId: mostCentral.id,
      levels: this._groupNodesByLevel(hierarchy),
      positions: positions,
      spacing: this.defaultSpacing
    };
  }

  /**
   * Build hierarchy from graph
   */
  _buildHierarchy(graph, rootId) {
    const hierarchy = {
      id: rootId,
      children: []
    };

    const visited = new Set();
    const queue = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = graph.nodes.get(currentId);
      if (!current) continue;

      const connections = graph.adjacencyList.get(currentId) || [];
      const childConnections = connections.filter(id => !visited.has(id));

      current.children = childConnections.map(childId => ({
        id: childId,
        term: graph.nodes.get(childId)?.term || 'Unknown',
        priority: graph.nodes.get(childId)?.priority || 0.5
      }));

      queue.push(...childConnections);
    }

    return hierarchy;
  }

  /**
   * Calculate tree positions
   */
  _calculateTreePositions(hierarchy, spacing) {
    const positions = [];
    const levelPositions = new Map();

    const assignPositions = (node, level, index) => {
      const levelStart = levelPositions.get(level) || { x: 0, y: 0, count: 0 };
      const x = levelStart.x + (index - levelStart.count / 2) * spacing.horizontal;
      const y = level * spacing.vertical;

      levelPositions.set(level, { x: levelStart.x, y: y, count: levelStart.count + 1 });

      positions.push({
        id: node.id,
        x,
        y,
        level
      });

      if (node.children) {
        node.children.forEach((child, idx) => {
          assignPositions(child, level + 1, idx);
        });
      }
    };

    assignPositions(hierarchy, 0, 0);

    return positions;
  }

  /**
   * Group nodes by level
   */
  _groupNodesByLevel(hierarchy) {
    const levels = [];
    const levelGroups = new Map();

    const groupNodes = (node, level) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(node.id);

      if (node.children) {
        node.children.forEach(child => groupNodes(child, level + 1));
      }
    };

    groupNodes(hierarchy, 0);

    return Array.from(levelGroups.entries()).map(([level, ids]) => ({ level, ids }));
  }

  /**
   * Generate force-directed network layout
   */
  generateNetworkLayout(graph) {
    const nodes = Array.from(graph.nodes.values());
    const positions = [];

    // Initialize random positions
    nodes.forEach(node => {
      positions.push({
        id: node.id,
        x: Math.random() * 800,
        y: Math.random() * 600
      });
    });

    // Force-directed simulation
    for (let i = 0; i < this.forceParams.iterations; i++) {
      this._applyForces(positions, graph.edges, i);
    }

    // Normalize positions to center
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    positions.forEach(p => {
      p.x -= centerX;
      p.y -= centerY;
    });

    return {
      type: 'network',
      algorithm: 'forceDirected',
      parameters: this.forceParams,
      positions: positions
    };
  }

  /**
   * Apply force-directed layout algorithms
   */
  _applyForces(positions, edges, iteration) {
    const n = positions.length;

    // Repulsion forces
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = this._distance(positions[i], positions[j]);
        const force = this.forceParams.repulsion / (dist * dist);

        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;

        positions[i].x -= (dx / dist) * force * 0.01;
        positions[i].y -= (dy / dist) * force * 0.01;
        positions[j].x += (dx / dist) * force * 0.01;
        positions[j].y += (dy / dist) * force * 0.01;
      }
    }

    // Attraction forces (springs)
    edges.forEach(edge => {
      const fromPos = positions.find(p => p.id === edge.fromId);
      const toPos = positions.find(p => p.id === edge.toId);

      if (!fromPos || !toPos) return;

      const dist = this._distance(fromPos, toPos);
      const force = (dist - this.forceParams.springLength) * this.forceParams.springConstant;

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;

      fromPos.x += (dx / dist) * force;
      fromPos.y += (dy / dist) * force;
      toPos.x -= (dx / dist) * force;
      toPos.y -= (dy / dist) * force;
    });

    // Centering force
    positions.forEach(pos => {
      pos.x *= 0.95;
      pos.y *= 0.95;
    });
  }

  /**
   * Calculate distance between two positions
   */
  _distance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
  }

  /**
   * Generate timeline layout for chronological content
   */
  generateTimelineLayout(graph) {
    const nodes = Array.from(graph.nodes.values());
    const positions = [];

    // Filter for concepts with temporal properties (simplified)
    const temporalNodes = nodes.filter(node => node.definition && /date|year|century|era|period/i.test(node.definition));

    const nodesToLayout = temporalNodes.length > 0 ? temporalNodes : nodes;

    // Simple linear layout
    nodesToLayout.forEach((node, index) => {
      positions.push({
        id: node.id,
        x: index * this.defaultSpacing.horizontal,
        y: 50,
        date: this._extractDate(node)
      });
    });

    const totalWidth = (nodesToLayout.length - 1) * this.defaultSpacing.horizontal;
    const scale = {
      start: 'auto',
      end: 'auto',
      pixelsPerUnit: totalWidth / Math.max(nodesToLayout.length, 1)
    };

    return {
      type: 'timeline',
      events: positions,
      scale
    };
  }

  /**
   * Extract date from concept (simplified)
   */
  _extractDate(node) {
    // Look for year patterns in definition
    const yearMatch = node.definition?.match(/\b(1\d{3}|2\d{3})\b/);
    return yearMatch ? yearMatch[0] : null;
  }

  /**
   * Generate custom layout
   */
  generateCustomLayout(graph, customOptions = {}) {
    const nodes = Array.from(graph.nodes.values());
    const positions = [];

    // Use custom options if provided
    const layoutType = customOptions.type || 'manual';

    if (layoutType === 'manual') {
      // Manual layout (user-defined)
      positions.push(...(customOptions.positions || []));
    } else {
      // Default to network layout
      return this.generateNetworkLayout(graph);
    }

    return {
      type: 'custom',
      layoutType: layoutType,
      positions: positions
    };
  }

  /**
   * Analyze graph and recommend optimal layout
   */
  recommendLayout(graph) {
    const metadata = graph.getMetadata();
    const nodes = Array.from(graph.nodes.values());

    // Score different layout types
    const scores = {
      tree: 0,
      network: 0,
      timeline: 0
    };

    // Score for tree: high hierarchy presence
    const hierarchicalEdges = graph.edges.filter(e => e.type === 'hierarchical').length;
    if (hierarchicalEdges / Math.max(graph.edges.length, 1) > 0.5) {
      scores.tree = 0.9;
    }

    // Score for network: good density
    if (metadata.density > 0.2) {
      scores.network = 0.8;
    } else if (metadata.density > 0.1) {
      scores.network = 0.6;
    }

    // Score for timeline: temporal patterns
    const temporalNodes = nodes.filter(n => n.definition && /date|year|century|era/i.test(n.definition));
    if (temporalNodes.length / Math.max(nodes.length, 1) > 0.3) {
      scores.timeline = 0.8;
    }

    // Select best layout
    const bestLayout = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      recommended: bestLayout[0],
      scores,
      reason: this._getLayoutReason(bestLayout[0], metadata)
    };
  }

  /**
   * Get explanation for layout recommendation
   */
  _getLayoutReason(layoutType, metadata) {
    switch (layoutType) {
      case 'tree':
        return 'High proportion of hierarchical relationships detected';
      case 'network':
        return 'Good network density with well-distributed connections';
      case 'timeline':
        return 'Significant temporal content detected in concepts';
      default:
        return 'Default layout selection based on graph properties';
    }
  }
}

module.exports = {
  LayoutAlgorithms
};
