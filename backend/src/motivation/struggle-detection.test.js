const {
  detectStruggleSignals,
  getRecommendedAction,
  generateEncouragement,
  STRUGGLE_THRESHOLDS,
  STRUGGLE_SEVERITY
} = require('./struggle-detection');

describe('Struggle Signal Detection', () => {
  describe('detectStruggleSignals - Empty Activity', () => {
    test('should return no struggle for empty history', () => {
      const result = detectStruggleSignals([]);

      expect(result.struggleDetected).toBe(false);
      expect(result.severity).toBe('low');
      expect(result.score).toBe(0);
      expect(result.patterns).toEqual([]);
    });
  });

  describe('detectStruggleSignals - Repeated Failures', () => {
    test('should detect repeated failures with 3 consecutive', () => {
      const activity = [
        { result: 'correct', timestamp: Date.now() - 10000 },
        { result: 'incorrect', timestamp: Date.now() - 8000 },
        { result: 'incorrect', timestamp: Date.now() - 6000 },
        { result: 'incorrect', timestamp: Date.now() - 4000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.struggleDetected).toBe(true);
      expect(result.patterns).toContain('repeated_failures');
      expect(result.signals.repeatedFailures.score).toBe(3);
      expect(result.severity).toBe('moderate');
    });

    test('should not detect struggle with only 1 failure', () => {
      const activity = [
        { result: 'correct', timestamp: Date.now() - 5000 },
        { result: 'incorrect', timestamp: Date.now() - 2000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.struggleDetected).toBe(false);
      expect(result.patterns).not.toContain('repeated_failures');
    });
  });

  describe('detectStruggleSignals - Long Response Times', () => {
    test('should detect long response times', () => {
      const avgTime = 100;
      const activity = [
        { result: 'incorrect', responseTime: avgTime, timestamp: Date.now() },
        { result: 'incorrect', responseTime: avgTime * 4, timestamp: Date.now() - 1000 },
        { result: 'incorrect', responseTime: avgTime * 5, timestamp: Date.now() - 2000 },
        { result: 'incorrect', responseTime: avgTime * 3, timestamp: Date.now() - 3000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.struggleDetected).toBe(true);
      expect(result.patterns).toContain('long_response_times');
      expect(result.signals.longResponseTimes.score).toBeGreaterThanOrEqual(2);
    });

    test('should not detect when all responses are average length', () => {
      const activity = [
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() },
        { result: 'incorrect', responseTime: 110, timestamp: Date.now() - 1000 },
        { result: 'incorrect', responseTime: 95, timestamp: Date.now() - 2000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.patterns).not.toContain('long_response_times');
    });
  });

  describe('detectStruggleSignals - Rapid Switching', () => {
    test('should detect rapid answer switching', () => {
      const activity = [
        { result: 'correct', lastAnswerId: 'ans_1', timestamp: Date.now() - 5000 },
        { result: 'correct', lastAnswerId: 'ans_2', timestamp: Date.now() - 3000 },
        { result: 'correct', lastAnswerId: 'ans_3', timestamp: Date.now() - 1000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.patterns).toContain('rapid_switching');
      expect(result.signals.rapidSwitching.score).toBeGreaterThanOrEqual(2);
    });
  });

  describe('detectStruggleSignals - Help Requests', () => {
    test('should detect help requests', () => {
      const activity = [
        { result: 'correct', timestamp: Date.now() - 5000 },
        { type: 'help_request', timestamp: Date.now() - 2000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.struggleDetected).toBe(true);
      expect(result.patterns).toContain('help_requested');
      expect(result.signals.helpRequests.score).toBe(1);
    });
  });

  describe('detectStruggleSignals - Frustration Patterns', () => {
    test('should detect frustration pattern with 2+ different signals', () => {
      const activity = [
        { result: 'incorrect', responseTime: 500, timestamp: Date.now() - 5000 },
        { result: 'incorrect', responseTime: 600, timestamp: Date.now() - 3000 },
        { result: 'incorrect', responseTime: 400, timestamp: Date.now() - 1000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.patterns).toContain('repeated_failures');
      expect(result.patterns).toContain('long_response_times');
      expect(result.signals.frustrationPatterns.score).toBeGreaterThanOrEqual(2);
      expect(result.severity).toBe('moderate');
    });
  });

  describe('detectStruggleSignals - Severity Determination', () => {
    test('should determine low severity for minimal struggle', () => {
      const activity = [
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.severity).toBe('low');
      expect(result.score).toBeLessThan(41);
    });

    test('should determine moderate severity for clear struggle', () => {
      const activity = [
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() },
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() - 1000 },
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() - 2000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.severity).toBe('moderate');
      expect(result.score).toBeGreaterThanOrEqual(41);
    });

    test('should determine high severity for significant struggle', () => {
      const activity = [
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() },
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() - 1000 },
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() - 2000 },
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() - 3000 },
        { result: 'incorrect', responseTime: 100, timestamp: Date.now() - 4000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.severity).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(81);
    });
  });

  describe('getRecommendedAction', () => {
    test('should recommend break for high severity', () => {
      const analysis = {
        severity: 'high',
        patterns: ['frustration_pattern']
      };

      const action = getRecommendedAction(analysis);

      expect(action).toBe('break');
    });

    test('should recommend different approach for repeated failures', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['repeated_failures']
      };

      const action = getRecommendedAction(analysis);

      expect(action).toBe('different_approach');
    });

    test('should recommend break_it_down for long response times', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['long_response_times']
      };

      const action = getRecommendedAction(analysis);

      expect(action).toBe('break_it_down');
    });

    test('should recommend review_prerequisites for rapid switching', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['rapid_switching']
      };

      const action = getRecommendedAction(analysis);

      expect(action).toBe('review_prerequisites');
    });

    test('should recommend seek_help for help requests', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['help_requested']
      };

      const action = getRecommendedAction(analysis);

      expect(action).toBe('seek_help');
    });

    test('should recommend continue for no struggle', () => {
      const analysis = {
        severity: 'low',
        patterns: []
      };

      const action = getRecommendedAction(analysis);

      expect(action).toBe('continue');
    });
  });

  describe('generateEncouragement', () => {
    test('should generate high severity encouragement for frustration', () => {
      const analysis = {
        severity: 'high',
        patterns: ['frustration_pattern']
      };

      const message = generateEncouragement(analysis);

      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message.toLowerCase()).toContain('break')
        .toBe(true);
    });

    test('should generate validation message for repeated failures', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['repeated_failures']
      };

      const message = generateEncouragement(analysis);

      expect(typeof message).toBe('string');
      expect(message.toLowerCase()).toContain('challenging')
        .toBe(true);
    });

    test('should generate perspective message for long response times', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['long_response_times']
      };

      const message = generateEncouragement(analysis);

      expect(typeof message).toBe('string');
      expect(message.toLowerCase()).toContain('growing')
        .toBe(true);
    });

    test('should generate growth mindset message for rapid switching', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['rapid_switching']
      };

      const message = generateEncouragement(analysis);

      expect(typeof message).toBe('string');
      expect(message.toLowerCase()).toContain('effort')
        .toBe(true);
    });

    test('should generate supportive message for help requests', () => {
      const analysis = {
        severity: 'moderate',
        patterns: ['help_requested']
      };

      const message = generateEncouragement(analysis);

      expect(typeof message).toBe('string');
      expect(message.toLowerCase()).toContain('help')
        .toBe(true);
    });

    test('should generate default encouragement for no struggle', () => {
      const analysis = {
        severity: 'low',
        patterns: []
      };

      const message = generateEncouragement(analysis);

      expect(typeof message).toBe('string');
      expect(message.toLowerCase()).toContain('great')
        .toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle activities with no responseTime', () => {
      const activity = [
        { result: 'incorrect', timestamp: Date.now() },
        { result: 'incorrect', timestamp: Date.now() - 1000 },
        { result: 'incorrect', timestamp: Date.now() - 2000 }
      ];

      const result = detectStruggleSignals(activity);

      expect(result.patterns).toContain('repeated_failures');
      expect(result.patterns).not.toContain('long_response_times');
    });

    test('should handle mixed activities', () => {
      const activity = [
        { result: 'correct', timestamp: Date.now() - 10000 },
        { result: 'incorrect', responseTime: 500, timestamp: Date.now() - 8000 },
        { result: 'incorrect', responseTime: 500, timestamp: Date.now() - 6000 },
        { result: 'correct', timestamp: Date.now() - 4000 },
        { result: 'incorrect', responseTime: 800, timestamp: Date.now() - 2000 }
      ];

      const result = detectStruggleSignals(activity);

      // Should not detect continuous struggle
      expect(result.struggleDetected).toBe(false);
    });

    test('should handle very long activity history', () => {
      const activity = Array.from({ length: 50 }, (_, i) => ({
        result: i % 3 === 0 ? 'incorrect' : 'correct',
        timestamp: Date.now() - i * 1000
      }));

      const result = detectStruggleSignals(activity);

      // Should only analyze last 10
      expect(result.signals.repeatedFailures.score).toBeLessThanOrEqual(3);
    });
  });
});
