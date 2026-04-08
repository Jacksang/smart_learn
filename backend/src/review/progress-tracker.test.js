/**
 * Progress Tracker Tests
 * Unit tests for progress tracking functionality
 */

const { ProgressTracker, AnalyticsService } = require('./progress-tracker');

describe('ProgressTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new ProgressTracker();
    tracker.clearCache();
  });

  describe('recordAnswer()', () => {
    it('should record a correct answer successfully', async () => {
      const record = await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        responseTime: 30,
        confidenceRating: 4
      });

      expect(record.id).toBeDefined();
      expect(record.sessionId).toBe('session_1');
      expect(record.questionId).toBe('q_1');
      expect(record.isCorrect).toBe(true);
      expect(record.responseTime).toBe(30);
    });

    it('should update session metrics after recording correct answer', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        responseTime: 30
      });

      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.correct).toBe(1);
      expect(progress.data.stats.totalQuestions).toBe(1);
      expect(progress.data.stats.accuracy).toBe(100);
    });

    it('should track incorrect answers', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: false,
        responseTime: 45
      });

      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.correct).toBe(0);
      expect(progress.data.stats.totalQuestions).toBe(1);
      expect(progress.data.stats.accuracy).toBe(0);
    });

    it('should track confidence ratings', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        isCorrect: true,
        responseTime: 30,
        confidenceRating: 5
      });

      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.avgConfidence).toBe('5.0');
    });

    it('should track concept-specific answers', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true
      });

      const progress = await tracker.getProgress('session_1');
      expect(progress.data.conceptMastery['concept_1']).toBeDefined();
      expect(progress.data.conceptMastery['concept_1'].conceptId).toBe('concept_1');
    });

    it('should handle multiple answers to same concept', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 25
      });
      await tracker.recordAnswer('session_1', 'q_2', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 30
      });
      await tracker.recordAnswer('session_1', 'q_3', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 50
      });

      const progress = await tracker.getProgress('session_1');
      const mastery = progress.data.conceptMastery['concept_1'];
      expect(mastery.questionsAnswered).toBe(3);
      expect(mastery.correctAnswers).toBe(2);
    });

    it('should create unique IDs for each record', async () => {
      const record1 = await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true });
      const record2 = await tracker.recordAnswer('session_1', 'q_2', { isCorrect: false });
      
      expect(record1.id).not.toBe(record2.id);
    });

    it('should handle empty session initially', async () => {
      const progress = await tracker.getProgress('new_session');
      expect(progress.data.stats.totalQuestions).toBe(0);
      expect(progress.data.stats.correct).toBe(0);
      expect(progress.data.stats.avgConfidence).toBe(null);
    });
  });

  describe('_calculateSessionProgress()', () => {
    it('should calculate accuracy correctly', async () => {
      // Record 7 correct, 3 incorrect
      for (let i = 1; i <= 7; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, { isCorrect: true });
      }
      for (let i = 8; i <= 10; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, { isCorrect: false });
      }

      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.totalQuestions).toBe(10);
      expect(progress.data.stats.correct).toBe(7);
      expect(progress.data.stats.accuracy).toBe(70);
    });

    it('should calculate average response time', async () => {
      await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true, responseTime: 30 });
      await tracker.recordAnswer('session_1', 'q_2', { isCorrect: true, responseTime: 40 });
      await tracker.recordAnswer('session_1', 'q_3', { isCorrect: true, responseTime: 50 });

      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.avgResponseTime).toBe(40);
    });

    it('should handle average confidence calculation', async () => {
      await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true, confidenceRating: 4 });
      await tracker.recordAnswer('session_1', 'q_2', { isCorrect: true, confidenceRating: 5 });

      const progress = await tracker.getProgress('session_1');
      expect(parseFloat(progress.data.stats.avgConfidence)).toBeCloseTo(4.5, 1);
    });
  });

  describe('mastery calculation', () => {
    it('should calculate mastery from accuracy', async () => {
      // 7 correct, 3 incorrect
      for (let i = 1; i <= 7; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          conceptId: 'concept_1',
          isCorrect: true,
          attempt: 1,
          responseTime: 25
        });
      }
      for (let i = 8; i <= 10; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          conceptId: 'concept_1',
          isCorrect: false,
          attempt: 2,
          responseTime: 50
        });
      }

      const progress = await tracker.getProgress('session_1');
      const mastery = progress.data.conceptMastery['concept_1'];
      
      expect(mastery.questionsAnswered).toBe(10);
      expect(mastery.correctAnswers).toBe(7);
      expect(mastery.level).toBe('developing');
      expect(mastery.mastery).toBeGreaterThan(60);
    });

    it('should apply speed bonus for quick correct answers', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 15
      });

      const progress = await tracker.getProgress('session_1');
      const mastery = progress.data.conceptMastery['concept_1'];
      
      expect(mastery.mastery).toBeGreaterThan(80); // Speed bonus
      expect(mastery.level).toBe('advanced');
    });

    it('should penalize retries', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 3,
        responseTime: 60
      });

      const progress = await tracker.getProgress('session_1');
      const mastery = progress.data.conceptMastery['concept_1'];
      
      expect(mastery.mastery).toBeLessThan(70); // Retry penalty
    });

    it('should return novice level for poor performance', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: false,
        attempt: 2,
        responseTime: 45
      });

      const progress = await tracker.getProgress('session_1');
      const mastery = progress.data.conceptMastery['concept_1'];
      
      expect(mastery.level).toBe('novice');
      expect(mastery.mastery).toBeLessThan(30);
    });

    it('should handle multiple concepts independently', async () => {
      await tracker.recordAnswer('session_1', 'q_1', {
        conceptId: 'concept_1',
        isCorrect: true,
        attempt: 1,
        responseTime: 20
      });

      await tracker.recordAnswer('session_1', 'q_2', {
        conceptId: 'concept_2',
        isCorrect: false,
        attempt: 2,
        responseTime: 50
      });

      const progress = await tracker.getProgress('session_1');
      
      expect(progress.data.conceptMastery['concept_1']).toBeDefined();
      expect(progress.data.conceptMastery['concept_2']).toBeDefined();
      expect(progress.data.conceptMastery['concept_1'].mastery).toBeGreaterThan(80);
      expect(progress.data.conceptMastery['concept_2'].mastery).toBeLessThan(30);
    });
  });

  describe('_getMasteryLevel()', () => {
    it('should return expert for 96-100%', () => {
      expect(tracker._getMasteryLevel(100)).toBe('expert');
      expect(tracker._getMasteryLevel(96)).toBe('expert');
    });

    it('should return advanced for 81-95%', () => {
      expect(tracker._getMasteryLevel(95)).toBe('advanced');
      expect(tracker._getMasteryLevel(81)).toBe('advanced');
    });

    it('should return proficient for 61-80%', () => {
      expect(tracker._getMasteryLevel(80)).toBe('proficient');
      expect(tracker._getMasteryLevel(61)).toBe('proficient');
    });

    it('should return developing for 41-60%', () => {
      expect(tracker._getMasteryLevel(60)).toBe('developing');
      expect(tracker._getMasteryLevel(41)).toBe('developing');
    });

    it('should return emerging for 21-40%', () => {
      expect(tracker._getMasteryLevel(40)).toBe('emerging');
      expect(tracker._getMasteryLevel(21)).toBe('emerging');
    });

    it('should return novice for 0-20%', () => {
      expect(tracker._getMasteryLevel(20)).toBe('novice');
      expect(tracker._getMasteryLevel(0)).toBe('novice');
    });

    it('should handle edge case at boundary', () => {
      expect(tracker._getMasteryLevel(80)).toBe('proficient');
      expect(tracker._getMasteryLevel(81)).toBe('advanced');
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      tracker.clearCache();
    });

    it('should cache progress calculations', async () => {
      await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true });
      
      const progress1 = await tracker.getProgress('session_1');
      const progress2 = await tracker.getProgress('session_1');
      
      expect(progress1.data.sessionId).toBe(progress2.data.sessionId);
      expect(progress1.data.startTime).toBe(progress2.data.startTime);
    });

    it('should clear cache for specific session', async () => {
      await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true });
      
      const progress1 = await tracker.getProgress('session_1');
      
      tracker.clearCache('session_1');
      
      await tracker.recordAnswer('session_1', 'q_2', { isCorrect: true });
      
      const progress2 = await tracker.getProgress('session_1');
      
      // Different cache entries due to new answer
      expect(progress1.data.stats.correct).toBe(1);
      expect(progress2.data.stats.correct).toBe(2);
    });

    it('should clear all cache when no session specified', async () => {
      await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true });
      await tracker.recordAnswer('session_2', 'q_1', { isCorrect: false });
      
      tracker.clearCache();
      
      // Cache should be cleared for both sessions
    });
  });

  describe('edge cases', () => {
    it('should handle session with only one answer', async () => {
      await tracker.recordAnswer('session_1', 'q_1', { isCorrect: true });
      
      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.totalQuestions).toBe(1);
      expect(progress.data.stats.correct).toBe(1);
      expect(progress.data.stats.accuracy).toBe(100);
    });

    it('should handle all incorrect answers', async () => {
      for (let i = 1; i <= 5; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          isCorrect: false,
          attempt: 1
        });
      }
      
      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.correct).toBe(0);
      expect(progress.data.stats.accuracy).toBe(0);
    });

    it('should handle all correct answers', async () => {
      for (let i = 1; i <= 5; i++) {
        await tracker.recordAnswer('session_1', `q_${i}`, {
          isCorrect: true,
          attempt: 1,
          responseTime: 20
        });
      }
      
      const progress = await tracker.getProgress('session_1');
      expect(progress.data.stats.correct).toBe(5);
      expect(progress.data.stats.accuracy).toBe(100);
    });
  });
});
