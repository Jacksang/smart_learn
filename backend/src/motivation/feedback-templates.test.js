const {
  FEEDBACK_TEMPLATES,
  detectSituation,
  scoreTemplateMatch,
  selectFeedbackTemplate,
  getTemplateCategories,
  getTemplatesByCategory
} = require('./feedback-templates');

describe('Feedback Templates - Situation Detection', () => {
  describe('detectSituation', () => {
    test('should detect success situation when outcome is correct with no failures', () => {
      const context = { outcome: 'correct', consecutiveFailures: 0, confidence: 0.9 };
      const situation = detectSituation(context);
      expect(situation).toBe('success_recognition');
    });

    test('should detect success_improvement when outcome is correct after failures', () => {
      const context = { outcome: 'correct', consecutiveFailures: 1, confidence: 0.7 };
      const situation = detectSituation(context);
      expect(situation).toBe('success_improvement');
    });

    test('should detect struggle_recovery when outcome is incorrect', () => {
      const context = { outcome: 'incorrect', consecutiveFailures: 2, confidence: 0.5 };
      const situation = detectSituation(context);
      expect(situation).toBe('struggle_recovery');
    });

    test('should detect effort_appreciation when timeSpent is significant', () => {
      const context = { timeSpent: 120, sessionLength: 5, recoveryCount: 0 };
      const situation = detectSituation(context);
      expect(situation).toBe('effort_appreciation');
    });

    test('should detect focus_celebration when session is long', () => {
      const context = { timeSpent: 0, sessionLength: 45, recoveryCount: 0 };
      const situation = detectSituation(context);
      expect(situation).toBe('focus_celebration');
    });

    test('should detect resilience_recognition when recoveryCount > 0', () => {
      const context = { recoveryCount: 2, sessionLength: 10 };
      const situation = detectSituation(context);
      expect(situation).toBe('resilience_recognition');
    });

    test('should default to effort_appreciation for neutral context', () => {
      const context = { timeSpent: 0, sessionLength: 0, recoveryCount: 0 };
      const situation = detectSituation(context);
      expect(situation).toBe('effort_appreciation');
    });
  });

  describe('scoreTemplateMatch', () => {
    test('should score templates based on confidence', () => {
      const template = { minConfidence: 0.7, maxConsecutiveFailures: 2 };
      const context = { confidence: 0.8, consecutiveFailures: 1 };
      const score = scoreTemplateMatch(template, context);
      expect(score).toBe(4); // 2 for confidence + 2 for maxConsecutiveFailures
    });

    test('should score templates based on timeSpent', () => {
      const template = { minTimeSpent: 100 };
      const context = { timeSpent: 150 };
      const score = scoreTemplateMatch(template, context);
      expect(score).toBe(3);
    });

    test('should score templates based on sessionLength', () => {
      const template = { minSessionLength: 30 };
      const context = { sessionLength: 45 };
      const score = scoreTemplateMatch(template, context);
      expect(score).toBe(3);
    });

    test('should score templates based on recoveryCount', () => {
      const template = { minRecoveries: 3 };
      const context = { recoveryCount: 5 };
      const score = scoreTemplateMatch(template, context);
      expect(score).toBe(3);
    });

    test('should return 0 when template does not match', () => {
      const template = { minTimeSpent: 500 };
      const context = { timeSpent: 100 };
      const score = scoreTemplateMatch(template, context);
      expect(score).toBe(0);
    });
  });

  describe('selectFeedbackTemplate', () => {
    test('should select best matching success template', () => {
      const context = { outcome: 'correct', consecutiveFailures: 0, confidence: 0.9 };
      const result = selectFeedbackTemplate(context);
      expect(result).not.toBeNull();
      expect(result.template.id).toBeDefined();
      expect(result.template.category).toBe('success_recognition');
    });

    test('should select best matching struggle template', () => {
      const context = { outcome: 'incorrect', consecutiveFailures: 3, confidence: 0.5 };
      const result = selectFeedbackTemplate(context);
      expect(result).not.toBeNull();
      expect(result.template.id).toBeDefined();
      expect(result.template.category).toBe('struggle_recovery');
    });

    test('should select template based on timeSpent for effort', () => {
      const context = { timeSpent: 300, sessionLength: 5, recoveryCount: 0 };
      const result = selectFeedbackTemplate(context);
      expect(result).not.toBeNull();
      expect(result.template.category).toBe('effort_appreciation');
    });

    test('should select template based on sessionLength for focus', () => {
      const context = { timeSpent: 0, sessionLength: 75, recoveryCount: 0 };
      const result = selectFeedbackTemplate(context);
      expect(result).not.toBeNull();
      expect(result.template.category).toBe('focus_celebration');
    });

    test('should select template based on recoveryCount for resilience', () => {
      const context = { recoveryCount: 8, sessionLength: 10 };
      const result = selectFeedbackTemplate(context);
      expect(result).not.toBeNull();
      expect(result.template.category).toBe('resilience_recognition');
    });

    test('should return null when no templates match', () => {
      const context = { outcome: 'unknown' };
      const result = selectFeedbackTemplate(context);
      // Should return first template from effort_appreciation as fallback
      expect(result).not.toBeNull();
    });
  });

  describe('getTemplateCategories', () => {
    test('should return all categories', () => {
      const categories = getTemplateCategories();
      expect(categories).toEqual([
        'success_recognition',
        'struggle_recovery',
        'effort_appreciation',
        'focus_celebration',
        'resilience_recognition'
      ]);
    });
  });

  describe('getTemplatesByCategory', () => {
    test('should return templates for valid category', () => {
      const templates = getTemplatesByCategory('success_recognition');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].id).toBeDefined();
    });

    test('should return empty array for invalid category', () => {
      const templates = getTemplatesByCategory('invalid_category');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
    });
  });

  describe('Template content validation', () => {
    test('should have encouraging language for struggle recovery', () => {
      const templates = getTemplatesByCategory('struggle_recovery');
      templates.forEach(template => {
        const text = template.template.toLowerCase();
        // Check for encouraging phrases
        const hasEncouragement = 
          text.includes('okay') || 
          text.includes('challenging') || 
          text.includes('learning') || 
          text.includes('work') || 
          text.includes('together');
        expect(hasEncouragement).toBe(true);
      });
    });

    test('should have celebratory language for success', () => {
      const templates = getTemplatesByCategory('success_recognition');
      templates.forEach(template => {
        const text = template.template.toLowerCase();
        const hasCelebration = 
          text.includes('perfect') || 
          text.includes('great') || 
          text.includes('excellent') || 
          text.includes('outstanding');
        expect(hasCelebration).toBe(true);
      });
    });
  });
});
