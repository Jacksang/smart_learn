/**
 * Concept Extraction System
 * Extracts key concepts, terms, and definitions from study materials
 */

/**
 * Concept extraction strategies:
 * - Noun phrase identification
 * - Definition pattern matching
 * - Relationship mapping
 * - Frequency-based prioritization
 * - Context-aware filtering
 */

const MAX_CONCEPTS = 100; // Limit to prevent overload
const MIN_CONFIDENCE = 0.3; // Minimum confidence to include

/**
 * Extract concepts from study content
 * @param {string} content - Raw text content from uploaded files
 * @param {object} options - Extraction options
 * @param {number} options.maxConcepts - Maximum concepts to extract (default: 50)
 * @param {string[]} options.contentTypes - Types of content being processed
 * @returns {object} - Extracted concepts with metadata
 */
function extractConcepts(content, options = {}) {
  const {
    maxConcepts = 50,
    contentTypes = []
  } = options;

  // Preprocess content
  const cleanedContent = preprocessContent(content);

  // Extract noun phrases
  const nounPhrases = identifyNounPhrases(cleanedContent);

  // Extract definitions
  const definitions = extractDefinitions(nounPhrases, cleanedContent);

  // Identify relationships
  const relationships = mapRelationships(definitions);

  // Prioritize concepts
  const prioritized = prioritizeConcepts(definitions, relationships, cleanedContent);

  // Filter and format
  const filtered = prioritized
    .filter(c => c.confidence >= MIN_CONFIDENCE)
    .slice(0, maxConcepts);

  return {
    concepts: filtered.map(c => ({
      term: c.term,
      definition: c.definition,
      relatedTerms: c.relatedTerms,
      priority: c.priority,
      confidence: c.confidence
    })),
    metadata: {
      totalExtracted: filtered.length,
      totalCandidate: prioritized.length,
      processingTime: Date.now(),
      contentTypes: contentTypes
    }
  };
}

/**
 * Preprocess content for extraction
 */
function preprocessContent(content) {
  // Normalize whitespace
  let processed = content.replace(/\s+/g, ' ').trim();

  // Remove common boilerplate text
  processed = processed.replace(/Copyright \d{4}/g, '');
  processed = processed.replace(/All rights reserved/g, '');
  processed = processed.replace(/Table of Contents/g, '');

  return processed;
}

/**
 * Identify noun phrases in content
 */
function identifyNounPhrases(content) {
  const phrases = [];
  const lines = content.split('\n');

  lines.forEach(line => {
    // Skip empty lines
    if (!line.trim()) return;

    // Look for definition patterns
    const definitionMatch = extractDefinitionFromLine(line);
    if (definitionMatch) {
      phrases.push({
        term: definitionMatch.term,
        definition: definitionMatch.definition,
        source: line,
        type: 'definition',
        confidence: definitionMatch.confidence
      });
      return;
    }

    // Look for standalone technical terms
    const term = extractTechnicalTerms(line);
    if (term) {
      phrases.push({
        term: term,
        definition: '',
        source: line,
        type: 'term',
        confidence: 0.5
      });
    }
  });

  return phrases;
}

/**
 * Extract definition from a single line
 */
function extractDefinitionFromLine(line) {
  const trimmed = line.trim();

  // Pattern 1: "Term is defined as..."
  const isDefinedAs = trimmed.match(/^(.+?)\s+is\s+defined\s+as\s+(.+)$/i);
  if (isDefinedAs) {
    return {
      term: isDefinedAs[1].trim(),
      definition: isDefinedAs[2].trim(),
      confidence: 0.9
    };
  }

  // Pattern 2: "Term refers to..."
  const refersTo = trimmed.match(/^(.+?)\s+refers\s+to\s+(.+)$/i);
  if (refersTo) {
    return {
      term: refersTo[1].trim(),
      definition: refersTo[2].trim(),
      confidence: 0.85
    };
  }

  // Pattern 3: "Term - definition" (dash separator)
  const dashSep = trimmed.match(/^([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s*-\s*(.+)$/);
  if (dashSep) {
    return {
      term: dashSep[1].trim(),
      definition: dashSep[2].trim(),
      confidence: 0.8
    };
  }

  // Pattern 4: "Term:" (colon separator)
  const colonSep = trimmed.match(/^([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)*)\s*:\s*(.+)$/);
  if (colonSep) {
    return {
      term: colonSep[1].trim(),
      definition: colonSep[2].trim(),
      confidence: 0.75
    };
  }

  // Pattern 5: Mathematical formula or scientific notation
  const mathFormula = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
  if (mathFormula) {
    return {
      term: mathFormula[1].trim(),
      definition: mathFormula[2].trim(),
      confidence: 0.9
    };
  }

  return null;
}

/**
 * Extract technical terms from line
 */
function extractTechnicalTerms(line) {
  // Look for capitalized terms that appear to be technical
  const terms = [];
  const potentialTerms = line.match(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/g);

  if (potentialTerms) {
    // Filter to likely technical terms (longer, more complex)
    potentialTerms.forEach(term => {
      if (term.length > 3 && term.length < 50) {
        terms.push(term);
      }
    });
  }

  return terms[0] || null;
}

/**
 * Map relationships between concepts
 */
function mapRelationships(definitions) {
  const relationships = [];

  definitions.forEach(definition => {
    // Find related terms in definition
    const related = findRelatedTerms(definition);

    // Identify causal relationships
    const causes = findCausalRelationships(definition);

    // Identify hierarchical relationships
    const hierarchy = findHierarchicalRelationships(definition);

    relationships.push({
      term: definition.term,
      relatedTerms: related,
      causes: causes,
      hierarchy: hierarchy
    });
  });

  return relationships;
}

/**
 * Find related terms in a definition
 */
function findRelatedTerms(definition) {
  const related = [];

  // Extract capitalized words that might be related concepts
  const potentialRelated = definition.definition.match(/[A-Z][a-zA-Z]+/g) || [];

  potentialRelated.forEach(word => {
    // Skip if same as term
    if (word.toLowerCase() === definition.term.toLowerCase()) return;

    // Skip if already in term
    if (definition.term.toLowerCase().includes(word.toLowerCase())) return;

    // Check confidence
    if (word.length > 3 && word.length < 20) {
      related.push(word);
    }
  });

  return [...new Set(related)]; // Remove duplicates
}

/**
 * Find causal relationships (A causes B)
 */
function findCausalRelationships(definition) {
  const patterns = [
    /causes?\s+(.+)/i,
    /leads\s+to\s+(.+)/i,
    /results\s+in\s+(.+)/i,
    /produces\s+(.+)/i,
    /enables\s+(.+)/i
  ];

  const text = definition.definition;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return [];
}

/**
 * Find hierarchical relationships (A is a type of B)
 */
function findHierarchicalRelationships(definition) {
  const patterns = [
    /is\s+a\s+(type|form|kind)\s+of\s+(.+)/i,
    /is\s+classified\s+as\s+(.+)/i,
    /belongs\s+to\s+(.+)/i,
    /is\s+part\s+of\s+(.+)/i
  ];

  const text = definition.definition;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[2].trim();
    }
  }

  return null;
}

/**
 * Prioritize concepts based on multiple factors
 */
function prioritizeConcepts(definitions, relationships, content) {
  return definitions.map(definition => {
    // Base score from extraction confidence
    let score = definition.confidence;

    // Frequency scoring (appears often = important)
    const frequency = calculateFrequency(definition.term, content);
    score += frequency * 0.2;

    // Relationship density (well-connected = important)
    const relCount = relationships.find(r => r.term === definition.term);
    if (relCount) {
      score += (relCount.relatedTerms.length + relCount.causes.length) * 0.1;
    }

    // Position scoring (early in document = important)
    const position = content.indexOf(definition.term);
    if (position >= 0) {
      const positionScore = 1 - (position / content.length);
      score += positionScore * 0.15;
    }

    // Definition quality scoring
    const definitionScore = calculateDefinitionQuality(definition);
    score += definitionScore * 0.15;

    return {
      ...definition,
      priority: Math.min(score, 1.0),
      relatedTerms: relCount ? relCount.relatedTerms : []
    };
  });
}

/**
 * Calculate term frequency in content
 */
function calculateFrequency(term, content) {
  const termLower = term.toLowerCase();
  const matches = (content.match(new RegExp(termLower, 'g')) || []).length;

  // Normalize to 0-1 range
  return Math.min(matches / 10, 1.0);
}

/**
 * Calculate definition quality score
 */
function calculateDefinitionQuality(definition) {
  const definitionLength = definition.definition.length;

  // Too short = low quality
  if (definitionLength < 20) return 0.2;

  // Too long = might be multiple concepts
  if (definitionLength > 500) return 0.5;

  // Has proper ending punctuation
  const hasEnding = /[.!?]$/.test(definition.definition);
  const qualityScore = hasEnding ? 0.8 : 0.5;

  // Contains key terms
  const keyTerms = ['process', 'system', 'function', 'mechanism', 'method', 'principle'];
  const hasKeyTerm = keyTerms.some(term => definition.definition.toLowerCase().includes(term));

  return hasKeyTerm ? qualityScore + 0.1 : qualityScore;
}

module.exports = {
  extractConcepts,
  preprocessContent,
  identifyNounPhrases,
  extractDefinitionFromLine,
  mapRelationships,
  prioritizeConcepts,
  calculateFrequency,
  calculateDefinitionQuality
};
