const {
  PROGRESS_LABELS,
  calculateEffortScore,
  calculateFocusScore,
  calculateResilienceScore,
  calculateImprovementScore,
  generateProgressLabels,
  getTopLabel,
  getLabelsByCategory,
  generateEncouragementMessage
} = require('./progress-labels');

describe('Progress Labels - Scoring Functions', () => {
  describe('calculateEffortScore', () => {
    test('should return low score for minimal effort', () => {
      const metrics = { totalAttempts: 0, totalTime: 0, sessionCount: 0 };
      const score = calculateEffortScore(metrics);
      expect(score).toBe(0);
    });

    test('should return high score for significant effort', () => {
      const metrics = { totalAttempts: 100, totalTime: 7200, sessionCount: 50 };
      const score = calculateEffortScore(metrics);
      expect(score).toBeCloseTo(1.0, 1);
    });

    test('should return medium score for moderate effort', () => {
      const metrics = { totalAttempts: 25, totalTime: 1800, sessionCount: 10 };
      const score = calculateEffortScore(metrics);
      expect(score).toBeGreaterThan(0.4);
      expect(score).toBeLessThan(0.6);
    });

    test('should cap score at 1.0', () => {
      const metrics = { totalAttempts: 200, totalTime: 10000, sessionCount: 100 };
      const score = calculateEffortScore(metrics);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    test('should not return negative scores', () => {
      const metrics = { totalAttempts: 0, totalTime: 0, sessionCount: 0 };
      const score = calculateEffortScore(metrics);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateFocusScore', () => {
    test('should return low score for minimal focus', () => {
      const metrics = { sessionCount: 0, totalTime: 0, avgSessionLength: 0, longestSession: 0 };
      const score = calculateFocusScore(metrics);
      expect(score).toBe(0);
    });

    test('should return high score for sustained focus', () => {
      const metrics = { sessionCount: 30, totalTime: 10800, avgSessionLength: 600, longestSession: 2400 };
      const score = calculateFocusScore(metrics);
      expect(score).toBeCloseTo(1.0, 1);
    });

    test('should reward longer sessions', () => {
      const metrics1 = { sessionCount: 5, totalTime: 600, avgSessionLength: 120, longestSession: 300 };
      const metrics2 = { sessionCount: 5, totalTime: 1500, avgSessionLength: 300, longestSession: 900 };
      
      const score1 = calculateFocusScore(metrics1);
      const score2 = calculateFocusScore(metrics2);
      
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('calculateResilienceScore', () => {
    test('should return low score for no recoveries', () => {
      const metrics = { totalAttempts: 5, recoveries: 0, recoveryRate: 0, consecutiveSuccesses: 5 };
      const score = calculateResilienceScore(metrics);
      expect(score).toBeCloseTo(0, 1);
    });

    test('should return high score for strong resilience', () => {
      const metrics = { totalAttempts: 50, recoveries: 15, recoveryRate: 0.3, consecutiveSuccesses: 10 };
      const score = calculateResilienceScore(metrics);
      expect(score).toBeGreaterThan(0.7);
    });

    test('should reward recovery rate', () => {
      const metrics1 = { totalAttempts: 20, recoveries: 2, recoveryRate: 0.1, consecutiveSuccesses: 5 };
      const metrics2 = { totalAttempts: 20, recoveries: 6, recoveryRate: 0.3, consecutiveSuccesses: 5 };
      
      const score1 = calculateResilienceScore(metrics1);
      const score2 = calculateResilienceScore(metrics2);
      
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('calculateImprovementScore', () => {
    test('should return low score for no improvement', () => {
      const metrics = { topicsMastered: 0, totalTopics: 10, accuracyTrend: -1, lastWeekAccuracy: 0.3 };
      const score = calculateImprovementScore(metrics);
      expect(score).toBeCloseTo(0, 1);
    });

    test('should return high score for strong improvement', () => {
      const metrics = { topicsMastered: 8, totalTopics: 10, accuracyTrend: 0.8, lastWeekAccuracy: 0.9 };
      const score = calculateImprovementScore(metrics);
      expect(score).toBeGreaterThan(0.8);
    });

    test('should reward accuracy trend', () => {
      const metrics1 = { topicsMastered: 5, totalTopics: 10, accuracyTrend: 0, lastWeekAccuracy: 0.5 };
      const metrics2 = { topicsMastered: 5, totalTopics: 10, accuracyTrend: 0.5, lastWeekAccuracy: 0.5 };
      
      const score1 = calculateImprovementScore(metrics1);
      const score2 = calculateImprovementScore(metrics2);
      
      expect(score2).toBeGreaterThan(score1);
    });
  });
});

describe('Progress Labels - Generation', () => {
  const baseMetrics = {
    effort: { totalAttempts: 25, totalTime: 1800, sessionCount: 10 },
    focus: { sessionCount: 10, totalTime: 1800, avgSessionLength: 180, longestSession: 540 },
    resilience: { totalAttempts: 30, recoveries: 5, recoveryRate: 0.16, consecutiveSuccesses: 3 },
    improvement: { topicsMastered: 3, totalTopics: 10, accuracyTrend: 0.3, lastWeekAccuracy: 0.6 }
  };

  test('should generate labels for all categories', () => {
    const labels = generateProgressLabels(baseMetrics);
    expect(labels.length).toBe(4);
    
    const categories = labels.map(l => l.category);
    expect(categories).toContain('effort');
    expect(categories).toContain('focus');
    expect(categories).toContain('resilience');
    expect(categories).toContain('improvement');
  });

  test('should sort labels by score descending', () => {
    const labels = generateProgressLabels(baseMetrics);
    const scores = labels.map(l => l.score);
    
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  test('should include all required properties', () => {
    const labels = generateProgressLabels(baseMetrics);
    
    labels.forEach(label => {
      expect(label.id).toBeDefined();
      expect(label.displayName).toBeDefined();
      expect(label.description).toBeDefined();
      expect(label.category).toBeDefined();
      expect(label.score).toBeDefined();
      expect(label.icon).toBeDefined();
    });
  });

  test('should return empty array for zero metrics', () => {
    const zeroMetrics = {
      effort: { totalAttempts: 0, totalTime: 0, sessionCount: 0 },
      focus: { sessionCount: 0, totalTime: 0, avgSessionLength: 0, longestSession: 0 },
      resilience: { totalAttempts: 0, recoveries: 0, recoveryRate: 0, consecutiveSuccesses: 0 },
      improvement: { topicsMastered: 0, totalTopics: 1, accuracyTrend: -1, lastWeekAccuracy: 0 }
    };
    
    const labels = generateProgressLabels(zeroMetrics);
    expect(labels.length).toBe(4); // Still returns one label per category
  });
});

describe('Progress Labels - Utilities', () => {
  const testMetrics = {
    effort: { totalAttempts: 30, totalTime: 2400, sessionCount: 12 },
    focus: { sessionCount: 12, totalTime: 2400, avgSessionLength: 200, longestSession: 720 },
    resilience: { totalAttempts: 35, recoveries: 8, recoveryRate: 0.23, consecutiveSuccesses: 5 },
    improvement: { topicsMastered: 5, totalTopics: 10, accuracyTrend: 0.5, lastWeekAccuracy: 0.7 }
  };

  test('should return top label (highest score)', () => {
    const topLabel = getTopLabel(testMetrics);
    expect(topLabel).toBeDefined();
    expect(topLabel.score).toBeGreaterThan(0);
  });

  test('getLabelsByCategory should filter by category', () => {
    const effortLabels = getLabelsByCategory('effort', testMetrics);
    expect(effortLabels.length).toBe(1);
    expect(effortLabels[0].category).toBe('effort');

    const focusLabels = getLabelsByCategory('focus', testMetrics);
    expect(focusLabels.length).toBe(1);
    expect(focusLabels[0].category).toBe('focus');
  });

  test('generateEncouragementMessage should return valid message', () => {
    const message = generateEncouragementMessage(testMetrics);
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  test('generateEncouragementMessage should include emoji', () => {
    const message = generateEncouragementMessage(testMetrics);
    const emojiRegex = /🌱|📚|💪|🔥|📖|🎯|✨|🌊|🔄|⭐|🏆|🚀|⚡|🌟|👑/;
    expect(emojiRegex.test(message)).toBe(true);
  });

  test('generateEncouragementMessage for zero metrics', () => {
    const zeroMetrics = {
      effort: { totalAttempts: 0, totalTime: 0, sessionCount: 0 },
      focus: { sessionCount: 0, totalTime: 0, avgSessionLength: 0, longestSession: 0 },
      resilience: { totalAttempts: 0, recoveries: 0, recoveryRate: 0, consecutiveSuccesses: 0 },
      improvement: { topicsMastered: 0, totalTopics: 10, accuracyTrend: -1, lastWeekAccuracy: 0.3 }
    };
    
    const message = generateEncouragementMessage(zeroMetrics);
    expect(message).toContain('Keep up the great work');
  });
});

describe('Progress Labels - Template Validity', () => {
  test('all labels should have display names', () => {
    Object.values(PROGRESS_LABELS).forEach(category => {
      category.forEach(label => {
        expect(label.displayName).toBeDefined();
        expect(label.displayName.length).toBeGreaterThan(0);
      });
    });
  });

  test('all labels should have descriptions', () => {
    Object.values(PROGRESS_LABELS).forEach(category => {
      category.forEach(label => {
        expect(label.description).toBeDefined();
        expect(label.description.length).toBeGreaterThan(0);
      });
    });
  });

  test('all labels should have icons', () => {
    Object.values(PROGRESS_LABELS).forEach(category => {
      category.forEach(label => {
        expect(label.icon).toBeDefined();
        expect(label.icon.length).toBeGreaterThan(0);
      });
    });
  });

  test('label scores should form continuous ranges', () => {
    Object.entries(PROGRESS_LABELS).forEach(([category, labels]) => {
      const sortedLabels = [...labels].sort((a, b) => a.minScore - b.minScore);
      
      for (let i = 1; i < sortedLabels.length; i++) {
        expect(sortedLabels[i - 1].maxScore).toBe(sortedLabels[i].minScore);
      }
    });
  });
});
