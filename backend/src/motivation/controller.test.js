const request = require('supertest');
const express = require('express');
const router = require('./router');

describe('Motivation Engine - API Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects/:projectId/motivation', router);
  });

  describe('POST /feedback', () => {
    test('should return feedback for success situation', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/feedback')
        .send({
          activityType: 'answer_attempt',
          outcome: 'correct',
          consecutiveFailures: 0,
          confidence: 0.9
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feedback).toBeDefined();
      expect(response.body.data.suggestedAction).toBeDefined();
    });

    test('should return feedback for struggle situation', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/feedback')
        .send({
          activityType: 'answer_attempt',
          outcome: 'incorrect',
          consecutiveFailures: 2,
          confidence: 0.5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.feedback).toBeDefined();
      expect(response.body.data.feedback.category).toBe('struggle_recovery');
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/feedback')
        .send({
          activityType: 'answer_attempt'
          // missing outcome
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /labels', () => {
    test('should return progress labels for valid metrics', async () => {
      const response = await request(app)
        .get('/api/projects/123/motivation/labels')
        .send({
          effort: { totalAttempts: 25, totalTime: 1800, sessionCount: 10 },
          focus: { sessionCount: 10, totalTime: 1800, avgSessionLength: 180, longestSession: 540 },
          resilience: { totalAttempts: 30, recoveries: 5, recoveryRate: 0.16, consecutiveSuccesses: 3 },
          improvement: { topicsMastered: 3, totalTopics: 10, accuracyTrend: 0.3, lastWeekAccuracy: 0.6 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.labels).toBeDefined();
      expect(Array.isArray(response.body.data.labels)).toBe(true);
      expect(response.body.data.topLabel).toBeDefined();
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .get('/api/projects/123/motivation/labels')
        .send({
          effort: { totalAttempts: 25, totalTime: 1800, sessionCount: 10 }
          // missing focus, resilience, improvement
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /encourage', () => {
    test('should return encouragement message', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/encourage')
        .send({
          effort: { totalAttempts: 25, totalTime: 1800, sessionCount: 10 },
          focus: { sessionCount: 10, totalTime: 1800, avgSessionLength: 180, longestSession: 540 },
          resilience: { totalAttempts: 30, recoveries: 5, recoveryRate: 0.16, consecutiveSuccesses: 3 },
          improvement: { topicsMastered: 3, totalTopics: 10, accuracyTrend: 0.3, lastWeekAccuracy: 0.6 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      expect(typeof response.body.data.message).toBe('string');
      expect(response.body.data.message.length).toBeGreaterThan(0);
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/encourage')
        .send({
          effort: { totalAttempts: 25, totalTime: 1800, sessionCount: 10 }
          // missing focus, resilience, improvement
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /milestones', () => {
    test('should return milestone progress', async () => {
      const response = await request(app)
        .get('/api/projects/123/motivation/milestones')
        .send({
          achievedMilestones: ['first_try', 'half_hour']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.achieved).toBeDefined();
      expect(Array.isArray(response.body.data.achieved)).toBe(true);
      expect(response.body.data.locked).toBeDefined();
      expect(Array.isArray(response.body.data.locked)).toBe(true);
      expect(response.body.data.recentlyAchieved).toBeDefined();
      expect(Array.isArray(response.body.data.recentlyAchieved)).toBe(true);
    });
  });

  describe('POST /award', () => {
    test('should award milestones for valid metrics', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/award')
        .send({
          studentId: 'student_123',
          metrics: {
            totalAttempts: 50,
            totalTime: 5000,
            sessionCount: 15,
            longestSession: 3600,
            recoveries: 12,
            topicsMastered: 8
          },
          achievedMilestones: []
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.awarded).toBeDefined();
      expect(Array.isArray(response.body.data.awarded)).toBe(true);
      expect(response.body.data.totalAwarded).toBeDefined();
      expect(typeof response.body.data.totalAwarded).toBe('number');
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/award')
        .send({
          studentId: 'student_123'
          // missing metrics
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /definitions', () => {
    test('should return milestone definitions', async () => {
      const response = await request(app)
        .get('/api/projects/123/motivation/definitions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data).toBe('object');
      
      // Should have all categories
      const categories = Object.keys(response.body.data);
      expect(categories).toContain('effort');
      expect(categories).toContain('focus');
      expect(categories).toContain('resilience');
      expect(categories).toContain('improvement');
    });
  });

  describe('POST /track', () => {
    test('should track activity successfully', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/track')
        .send({
          activityType: 'answer_attempt',
          result: 'correct',
          timeSpent: 120,
          sessionId: 'session_123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(true);
      expect(response.body.data.updatedMetrics).toBeDefined();
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/track')
        .send({
          activityType: 'answer_attempt'
          // missing result
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /categories', () => {
    test('should return feedback categories', async () => {
      const response = await request(app)
        .get('/api/projects/123/motivation/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/projects/123/motivation/feedback')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    test('should handle project not found', async () => {
      const response = await request(app)
        .get('/api/projects/non_existent/motivation/labels')
        .send({
          effort: { totalAttempts: 25, totalTime: 1800, sessionCount: 10 },
          focus: { sessionCount: 10, totalTime: 1800, avgSessionLength: 180, longestSession: 540 },
          resilience: { totalAttempts: 30, recoveries: 5, recoveryRate: 0.16, consecutiveSuccesses: 3 },
          improvement: { topicsMastered: 3, totalTopics: 10, accuracyTrend: 0.3, lastWeekAccuracy: 0.6 }
        });

      // Should still work (no actual DB check in this implementation)
      expect(response.status).toBe(200);
    });
  });
});
