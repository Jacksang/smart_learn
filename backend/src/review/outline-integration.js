/**
 * Outline Integration System
 * Links concepts to lesson outline items
 */

/**
 * Integration strategies:
 * - Semantic matching between concepts and outline items
 * - Coverage tracking (covered, partial, missing)
 * - Distribution analysis
 * - Gap identification
 */

class OutlineIntegration {
  constructor() {
    this.coverageThresholds = {
      covered: 0.7,
      partial: 0.4
    };
  }

  /**
   * Link concepts to outline items
   */
  link(concepts, outlineItems) {
    const linked = [];

    concepts.forEach(concept => {
      const match = this.findBestMatch(concept, outlineItems);

      linked.push({
        concept: {
          id: concept.id,
          term: concept.term,
          definition: concept.definition
        },
        outlineItem: match.item || null,
        matchScore: match.score,
        coverageStatus: this._determineCoverageStatus(match.score),
        coverageDetails: match.coverageDetails || {}
      });
    });

    return linked;
  }

  /**
   * Find best matching outline item for a concept
   */
  findBestMatch(concept, outlineItems) {
    let bestMatch = { item: null, score: 0, coverageDetails: {} };

    outlineItems.forEach(item => {
      const score = this.calculateSemanticSimilarity(concept.term, item.text);

      if (score > bestMatch.score) {
        bestMatch = {
          item,
          score,
          coverageDetails: {
            matchedKeywords: this._findMatchingKeywords(concept.term, item.text),
            coveragePercent: score * 100
          }
        };
      }
    });

    return bestMatch;
  }

  /**
   * Calculate semantic similarity
   */
  calculateSemanticSimilarity(term, text) {
    const termWords = this._extractWords(term.toLowerCase());
    const textWords = this._extractWords(text.toLowerCase());

    if (termWords.length === 0 || textWords.length === 0) {
      return 0;
    }

    // Jaccard similarity
    const intersection = termWords.filter(word => textWords.includes(word));
    const union = [...new Set([...termWords, ...textWords])];

    const jaccard = intersection.length / union.length;

    // Partial match bonus
    const termAsSubstrings = termWords.filter(word =>
      textWords.some(tw => tw.includes(word) || word.includes(tw))
    );
    const partialMatchRatio = termAsSubstrings.length / termWords.length;

    // Weighted combination
    const score = (jaccard * 0.6) + (partialMatchRatio * 0.4);

    return score;
  }

  /**
   * Extract words from string
   */
  _extractWords(text) {
    return text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Find matching keywords
   */
  _findMatchingKeywords(term, text) {
    const termWords = this._extractWords(term.toLowerCase());
    const textWords = this._extractWords(text.toLowerCase());

    return termWords.filter(word =>
      textWords.some(tw => tw.includes(word) || word.includes(tw))
    );
  }

  /**
   * Determine coverage status based on match score
   */
  _determineCoverageStatus(score) {
    if (score >= this.coverageThresholds.covered) {
      return 'covered';
    } else if (score >= this.coverageThresholds.partial) {
      return 'partial';
    } else {
      return 'missing';
    }
  }

  /**
   * Analyze coverage distribution
   */
  analyzeCoverage(linkedConcepts) {
    const total = linkedConcepts.length;

    const covered = linkedConcepts.filter(c => c.coverageStatus === 'covered');
    const partial = linkedConcepts.filter(c => c.coverageStatus === 'partial');
    const missing = linkedConcepts.filter(c => c.coverageStatus === 'missing');

    return {
      totalConcepts: total,
      covered: {
        count: covered.length,
        percentage: total > 0 ? (covered.length / total) * 100 : 0
      },
      partial: {
        count: partial.length,
        percentage: total > 0 ? (partial.length / total) * 100 : 0
      },
      missing: {
        count: missing.length,
        percentage: total > 0 ? (missing.length / total) * 100 : 0
      },
      overallCoverage: total > 0
        ? (covered.length + (partial.length * 0.5)) / total * 100
        : 0
    };
  }

  /**
   * Get distribution by outline section
   */
  getDistributionBySection(linkedConcepts, outlineItems) {
    const distribution = {};

    outlineItems.forEach(item => {
      const matchingConcepts = linkedConcepts.filter(c =>
        c.outlineItem && c.outlineItem.id === item.id
      );

      const covered = matchingConcepts.filter(c => c.coverageStatus === 'covered').length;
      const partial = matchingConcepts.filter(c => c.coverageStatus === 'partial').length;
      const missing = matchingConcepts.filter(c => c.coverageStatus === 'missing').length;

      distribution[item.id] = {
        section: item.section || 'Section',
        totalConcepts: matchingConcepts.length,
        covered,
        partial,
        missing,
        coverageRate: matchingConcepts.length > 0
          ? ((covered * 100) + (partial * 50)) / matchingConcepts.length
          : 0
      };
    });

    return distribution;
  }

  /**
   * Identify coverage gaps
   */
  identifyGaps(linkedConcepts, topCentrality = 5) {
    const missing = linkedConcepts.filter(c => c.coverageStatus === 'missing');

    // Sort by concept centrality (if available)
    const sorted = missing.sort((a, b) => {
      const centralityA = a.concept.centrality || 0;
      const centralityB = b.concept.centrality || 0;
      return centralityB - centralityA;
    });

    return {
      totalGaps: missing.length,
      highPriorityGaps: sorted.slice(0, topCentrality).map(gap => ({
        concept: gap.concept,
        matchScore: gap.matchScore,
        priority: 'high'
      })),
      allGaps: sorted.map(gap => ({
        concept: gap.concept,
        matchScore: gap.matchScore,
        priority: 'medium'
      }))
    };
  }

  /**
   * Get concept coverage summary
   */
  getCoverageSummary(linkedConcepts, outlineItems) {
    const coverage = this.analyzeCoverage(linkedConcepts);
    const distribution = this.getDistributionBySection(linkedConcepts, outlineItems);
    const gaps = this.identifyGaps(linkedConcepts);

    return {
      coverage,
      distribution,
      gaps,
      recommendations: this._generateRecommendations(coverage, distribution)
    };
  }

  /**
   * Generate recommendations based on coverage analysis
   */
  _generateRecommendations(coverage, distribution) {
    const recommendations = [];

    if (coverage.missing.percentage > 20) {
      recommendations.push({
        type: 'coverage',
        message: 'Consider adding more concepts to improve coverage',
        priority: 'high'
      });
    }

    const lowCoverageSections = Object.values(distribution).filter(
      section => section.coverageRate < 50
    );

    if (lowCoverageSections.length > 0) {
      recommendations.push({
        type: 'sections',
        message: 'Some sections have low concept coverage: ' +
          lowCoverageSections.map(s => s.section).join(', '),
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

module.exports = {
  OutlineIntegration
};
