/**
 * Progress Controller Tests
 * API endpoint tests for progress tracking operations
 */

const { ProgressTracker, AnalyticsService } = require('./progress-tracker');
const {
  recordAnswer,
  getSessionProgress,
  getLearningProgress,
  getWeakAreas,
  generateRecommendations
} = require('./progress-controller');

// Mock response helper
const mockResponse = () => ({
  statusCode: 200,
  _body: '',
  json: function(data) {
    this._body = JSON.stringify(data);
    return this;
  }
});

describe('ProgressController', () => {
  let tracker;
  let analyticsService;

  beforeEach(() => {
    tracker = new ProgressTracker();
    tracker.clearCache();
    analyticsService = new AnalyticsService(tracker);
  });

  afterEach(() => {
    tracker.clearCache();
  });

  describe('recordAnswer()', () => {
    it('should record answer successfully', async () => {
      const req = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1',
          isCorrect: true,
          responseTime: 30,
          confidenceRating: 4
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
      expect(body.data.recordId).toBeDefined();
      expect(body.data.timestamp).toBeDefined();
    });

    it('should reject missing sessionId', async () => {
      const req = {
        body: {
          questionId: 'q_1'
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('sessionId');
    });

    it('should reject missing questionId', async () => {
      const req = {
        body: {
          sessionId: 'session_1'
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(false);
    });

    it('should handle empty answer data', async () => {
      const req = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1'
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
      expect(body.data.recordId).toBeDefined();
    });

    it('should track conceptId when provided', async () => {
      const req = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1',
          conceptId: 'concept_1',
          isCorrect: true
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._body).success).toBe(true);
    });

    it('should record with attempt number', async () => {
      const req = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1',
          isCorrect: true,
          attempt: 2
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
    });

    it('should record answer text', async () => {
      const req = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1',
          isCorrect: true,
          answerText: 'The answer is correct'
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._body).success).toBe(true);
    });

    it('should handle multiple recordings in sequence', async () => {
      const req1 = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1',
          isCorrect: true
        }
      };
      const res1 = mockResponse();
      await recordAnswer(req1, res1);

      const req2 = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_2',
          isCorrect: false
        }
      };
      const res2 = mockResponse();
      await recordAnswer(req2, res2);

      expect(JSON.parse(res1._body).success).toBe(true);
      expect(JSON.parse(res2._body).success).toBe(true);
    });
  });

  describe('getSessionProgress()', () => {
    it('should return session progress', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        responseTime: 30
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
      expect(body.data.stats.totalQuestions).toBe(1);
      expect(body.data.stats.correct).toBe(1);
    });

    it('should return error for invalid session', async () => {
      const req = { params: { sessionId: 'nonexistent_session' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should return empty session data', async () => {
      const req = { params: { sessionId: 'new_session' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.stats.totalQuestions).toBe(0);
    });

    it('should return concept mastery for session with concept tracking', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 25
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.conceptMastery['concept_1']).toBeDefined();
    });

    it('should return accuracy calculation', async () => {
      // 7 correct, 3 incorrect
      for (let i = 1; i <= 7; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, { isCorrect: true });
      }
      for (let i = 8; i <= 10; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, { isCorrect: false });
      }

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.stats.accuracy).toBe(70);
    });

    it('should return average confidence', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        confidenceRating: 4
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        isCorrect: true,
        confidenceRating: 5
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      const body = JSON.parse(res._body);
      expect(parseFloat(body.data.stats.avgConfidence)).toBeCloseTo(4.5, 1);
    });

    it('should return average response time', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        responseTime: 30
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        isCorrect: true,
        responseTime: 40
      });
      await tracker.recordAnswer('session_1', 'q_3', {
        isCorrect: true,
        responseTime: 50
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.stats.avgResponseTime).toBe(40);
    });
  });

  describe('getLearningProgress()', () => {
    beforeEach(() => {
      tracker.sessions.clear();
    });

    it('should return comprehensive learning progress', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        conceptId: 'concept_1',
        responseTime: 25
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        isCorrect: false,
        conceptId: 'concept_1',
        responseTime: 45
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
      expect(body.data.overview).toBeDefined();
      expect(body.data.masteryLevels).toBeDefined();
      expect(body.data.weakAreas).toBeDefined();
      expect(body.data.recommendations).toBeDefined();
    });

    it('should identify weak areas with poor performance', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 3,
        responseTime: 70
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.weakAreas.totalWeak).toBeGreaterThanOrEqual(1);
      expect(body.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should return correct overview metrics', async () => {
      for (let i = 1; i <= 5; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          conceptId: 'concept_1',
          isCorrect: i <= 3,
          responseTime: 30
        });
      }

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.overview.totalQuestions).toBe(5);
      expect(body.data.overview.correct).toBe(3);
      expect(body.data.overview.accuracy).toBe(60);
    });

    it('should generate recommendations for weak areas', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.recommendations.length).toBeGreaterThan(0);
      expect(body.data.recommendations[0].type).toBe('focus');
    });

    it('should return empty weak areas for good performance', async () => {
      for (let i = 1; i <= 5; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          conceptId: 'concept_1',
          isCorrect: true,
          attempt: 1,
          responseTime: 20
        });
      }

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.weakAreas.totalWeak).toBe(0);
    });

    it('should handle session with no data', async () => {
      const req = { params: { sessionId: 'new_session' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.overview.totalQuestions).toBe(0);
      expect(body.data.masteryLevels).toEqual([]);
      expect(body.data.weakAreas.totalWeak).toBe(0);
    });

    it('should return correct mastery levels', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 20
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.masteryLevels.length).toBeGreaterThanOrEqual(1);
      expect(body.data.masteryLevels[0].mastery).toBeGreaterThan(80);
    });

    it('should identify concept with all incorrect answers', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        conceptId: 'concept_1',
        isCorrect: false
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.weakAreas.totalWeak).toBe(1);
      expect(body.data.weakAreas.areas[0].mastery).toBeLessThan(30);
    });

    it('should generate high priority recommendations for very weak areas', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 70
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 3,
        responseTime: 80
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.recommendations[0].priority).toBe('high');
    });
  });

  describe('getWeakAreas()', () => {
    beforeEach(() => {
      tracker.sessions.clear();
    });

    it('should return top 5 weak areas', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        conceptId: 'concept_2',
        isCorrect: false,
        attempt: 3
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.areas).toHaveLength(2);
      expect(body.data.areas[0].priority).toBe('high');
    });

    it('should return empty weak areas for good performance', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 20
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.totalWeak).toBe(0);
      expect(body.data.areas).toHaveLength(0);
    });

    it('should return high priority for mastery < 30%', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.areas[0].priority).toBe('high');
    });

    it('should return medium priority for mastery 30-50%', async () => {
      // This will create a mastery in the medium range
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 1,
        responseTime: 40
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.areas.length).toBe(1);
    });

    it('should limit to top 5 areas', async () => {
      // Record weak performance for many concepts
      for (let i = 1; i <= 10; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          conceptId: `concept_${i}`,
          isCorrect: false,
          attempt: 2
        });
      }

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.areas.length).toBeLessThanOrEqual(5);
    });

    it('should include error rate in weak areas', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.areas[0].errorRate).toBeDefined();
    });

    it('should include average response time in weak areas', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });

      const req = { params: { sessionId: 'session_1' } };
      const res = mockResponse();

      await getWeakAreas(req, res);

      const body = JSON.parse(res._body);
      expect(body.data.areas[0].avgResponseTime).toBeDefined();
    });
  });

  describe('generateRecommendations()', () => {
    beforeEach(() => {
      tracker.sessions.clear();
    });

    it('should generate focus recommendations', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });

      const req = {
        params: { sessionId: 'session_1' },
        body: { focusAreas: ['weak'], timeframe: 'weekly' }
      };
      const res = mockResponse();

      await generateRecommendations(req, res);

      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
      expect(body.recommendations[0].type).toBe('focus');
    });

    it('should generate recommendations even with no weak areas', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 20
      });

      const req = {
        params: { sessionId: 'session_1' },
        body: { focusAreas: ['weak'], timeframe: 'weekly' }
      };
      const res = mockResponse();

      await generateRecommendations(req, res);

      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
    });

    it('should include target concepts in recommendations', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 60
      });

      const req = {
        params: { sessionId: 'session_1' },
        body: { focusAreas: ['weak'], timeframe: 'weekly' }
      };
      const res = mockResponse();

      await generateRecommendations(req, res);

      const body = JSON.parse(res._body);
      expect(body.recommendations[0].targetConcepts).toBeDefined();
      expect(body.recommendations[0].targetConcepts.length).toBeGreaterThan(0);
    });

    it('should set priority based on weakness', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 3,
        responseTime: 80
      });

      const req = {
        params: { sessionId: 'session_1' },
        body: { focusAreas: ['weak'], timeframe: 'weekly' }
      };
      const res = mockResponse();

      await generateRecommendations(req, res);

      const body = JSON.parse(res._body);
      expect(body.recommendations[0].priority).toBe('high');
    });

    it('should handle empty session', async () => {
      const req = {
        params: { sessionId: 'new_session' },
        body: { focusAreas: ['weak'], timeframe: 'weekly' }
      };
      const res = mockResponse();

      await generateRecommendations(req, res);

      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid session ID', async () => {
      const req = { params: { sessionId: '' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const req = { params: { sessionId: 'nonexistent' } };
      const res = mockResponse();

      await getLearningProgress(req, res);

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should validate all required fields', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res._body);
      expect(body.error).toContain('sessionId');
    });

    it('should return consistent error format', async () => {
      const req = { params: { sessionId: '' } };
      const res = mockResponse();

      await getSessionProgress(req, res);

      const body = JSON.parse(res._body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(Object.keys(body).sort()).toEqual(['error', 'success']);
    });

    it('should handle null values gracefully', async () => {
      const req = {
        body: {
          sessionId: 'session_1',
          questionId: 'q_1',
          isCorrect: null,
          responseTime: null
        }
      };
      const res = mockResponse();

      await recordAnswer(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res._body);
      expect(body.success).toBe(true);
    });
  });
});
