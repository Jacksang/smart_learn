/**
 * Progress Tracking System
 * Core tracking logic for learning progress and analytics
 */

/**
 * Progress Tracker Class
 * Manages answer recording, progress calculation, and caching
 */
class ProgressTracker {
  constructor() {
    this.sessions = new Map();
    this.progressCache = new Map();
    this.answers = []; // In-memory storage for MVP
  }

  /**
   * Record answer submission
   */
  async recordAnswer(sessionId, questionId, answerData) {
    // Validate input
    if (!sessionId || !questionId || !answerData) {
      throw new Error('sessionId, questionId, and answerData are required');
    }

    // Create record
    const record = {
      id: `record_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId,
      questionId,
      timestamp: new Date(),
      ...answerData
    };

    // Update session metrics
    this._updateSessionMetrics(sessionId, answerData);

    // Store answer
    this.answers.push(record);

    // Update cache
    await this._updateProgressCache(sessionId);

    return record;
  }

  /**
   * Update session metrics
   */
  _updateSessionMetrics(sessionId, answerData) {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        id: sessionId,
        startTime: new Date(),
        stats: {
          totalQuestions: 0,
          answered: 0,
          correct: 0,
          totalResponseTime: 0,
          confidenceRatings: [],
          conceptAnswers: new Map()
        }
      };
      this.sessions.set(sessionId, session);
    }

    session.stats.totalQuestions++;
    session.stats.answered++;

    if (answerData.isCorrect) {
      session.stats.correct++;
    }

    if (answerData.responseTime) {
      session.stats.totalResponseTime += answerData.responseTime;
    }

    if (answerData.confidenceRating) {
      session.stats.confidenceRatings.push(answerData.confidenceRating);
    }

    // Track per-concept answers
    if (answerData.conceptId) {
      if (!session.stats.conceptAnswers.has(answerData.conceptId)) {
        session.stats.conceptAnswers.set(answerData.conceptId, []);
      }
      session.stats.conceptAnswers.get(answerData.conceptId).push(answerData);
    }
  }

  /**
   * Get progress for session
   */
  async getProgress(sessionId) {
    const cacheKey = `progress_${sessionId}`;

    if (this.progressCache.has(cacheKey)) {
      return this.progressCache.get(cacheKey);
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    const progress = this._calculateSessionProgress(session);

    this.progressCache.set(cacheKey, progress);
    return progress;
  }

  /**
   * Calculate session progress
   */
  _calculateSessionProgress(session) {
    const stats = session.stats;
    const duration = Date.now() - session.startTime.getTime();

    const progress = {
      sessionId: session.id,
      startTime: session.startTime,
      endTime: new Date(),
      duration: Math.round(duration / 1000),
      stats: {
        totalQuestions: stats.totalQuestions,
        answered: stats.answered,
        correct: stats.correct,
        accuracy: stats.totalQuestions > 0
          ? Math.round((stats.correct / stats.totalQuestions) * 100)
          : 0,
        avgResponseTime: stats.answered > 0
          ? Math.round(stats.totalResponseTime / stats.answered)
          : 0,
        avgConfidence: stats.confidenceRatings.length > 0
          ? (stats.confidenceRatings.reduce((sum, r) => sum + r, 0) / stats.confidenceRatings.length).toFixed(1)
          : null
      },
      conceptMastery: this._calculateConceptMastery(stats.conceptAnswers)
    };

    return { success: true, data: progress };
  }

  /**
   * Calculate concept mastery
   */
  _calculateConceptMastery(conceptAnswers) {
    const mastery = {};

    conceptAnswers.forEach(([conceptId, answers]) => {
      mastery[conceptId] = this._calculateConceptScore(conceptId, answers);
    });

    return mastery;
  }

  /**
   * Calculate concept score
   */
  _calculateConceptScore(conceptId, answers) {
    const total = answers.length;
    const correct = answers.filter(a => a.isCorrect).length;
    const firstAttempt = answers.filter(a => a.attempt === 1).length;

    const accuracy = correct / total;
    const speedBonus = answers
      .filter(a => a.isCorrect && a.responseTime < 30)
      .length / total;
    const retryPenalty = answers
      .filter(a => a.attempt > 1)
      .length / total;

    const mastery = (accuracy * 0.6) + (speedBonus * 0.3) - (retryPenalty * 0.1);
    const score = Math.round(Math.max(0, Math.min(100, mastery * 100)));

    return {
      conceptId,
      mastery: score,
      level: this._getMasteryLevel(score),
      questionsAnswered: total,
      correctAnswers: correct,
      lastPractice: answers[answers.length - 1].timestamp
    };
  }

  /**
   * Get mastery level
   */
  _getMasteryLevel(score) {
    if (score >= 96) return 'expert';
    if (score >= 81) return 'advanced';
    if (score >= 61) return 'proficient';
    if (score >= 41) return 'developing';
    if (score >= 21) return 'emerging';
    return 'novice';
  }

  /**
   * Update progress cache
   */
  async _updateProgressCache(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const progress = this._calculateSessionProgress(session);

    this.progressCache.set(`progress_${sessionId}`, progress);
  }

  /**
   * Get all answers for session
   */
  getAnswers(sessionId) {
    return this.answers.filter(a => a.sessionId === sessionId);
  }

  /**
   * Clear cache
   */
  clearCache(sessionId) {
    if (sessionId) {
      this.progressCache.delete(`progress_${sessionId}`);
    } else {
      this.progressCache.clear();
    }
  }
}

/**
 * Analytics Service
 * Calculates learning progress and trends
 */
class AnalyticsService {
  constructor(tracker) {
    this.tracker = tracker;
  }

  /**
   * Calculate learning progress
   */
  async calculateLearningProgress(sessionId) {
    const session = this.tracker.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    const overview = this._calculateOverview(session);
    const masteryLevels = this._calculateMasteryLevels(session);
    const weakAreas = this._identifyWeakAreas(session);
    const recommendations = this._generateRecommendations(weakAreas);

    return {
      success: true,
      data: {
        overview,
        masteryLevels,
        weakAreas,
        recommendations
      }
    };
  }

  /**
   * Calculate overview
   */
  _calculateOverview(session) {
    const stats = session.stats;

    return {
      sessionId: session.id,
      totalQuestions: stats.totalQuestions,
      answered: stats.answered,
      correct: stats.correct,
      accuracy: stats.totalQuestions > 0
        ? Math.round((stats.correct / stats.totalQuestions) * 100)
        : 0,
      avgResponseTime: stats.answered > 0
        ? Math.round(stats.totalResponseTime / stats.answered)
        : 0,
      avgConfidence: stats.confidenceRatings.length > 0
        ? (stats.confidenceRatings.reduce((sum, r) => sum + r, 0) / stats.confidenceRatings.length).toFixed(1)
        : null,
      sessionDuration: session.startTime
    };
  }

  /**
   * Calculate mastery levels
   */
  _calculateMasteryLevels(session) {
    const conceptMastery = this.tracker._calculateConceptMastery(session.stats.conceptAnswers);

    return Object.values(conceptMastery).map(m => ({
      conceptId: m.conceptId,
      mastery: m.mastery,
      level: m.level,
      questionsAnswered: m.questionsAnswered,
      correctAnswers: m.correctAnswers,
      lastPractice: m.lastPractice
    }));
  }

  /**
   * Identify weak areas
   */
  _identifyWeakAreas(session) {
    const conceptMastery = this.tracker._calculateConceptMastery(session.stats.conceptAnswers);

    const weakConcepts = Object.values(conceptMastery)
      .filter(c => c.mastery < 50)
      .map(c => ({
        conceptId: c.conceptId,
        mastery: c.mastery,
        level: c.level,
        questionsAnswered: c.questionsAnswered,
        correctAnswers: c.correctAnswers,
        priority: c.mastery < 30 ? 'high' : 'medium'
      }))
      .sort((a, b) => a.mastery - b.mastery);

    return {
      totalWeak: weakConcepts.length,
      areas: weakConcepts.slice(0, 5)
    };
  }

  /**
   * Generate recommendations
   */
  _generateRecommendations(weakAreas) {
    const recommendations = [];

    if (weakAreas.totalWeak > 0) {
      const topWeak = weakAreas.areas[0];
      recommendations.push({
        type: 'focus',
        priority: topWeak.priority,
        message: `Focus on ${topWeak.conceptId} (${topWeak.mastery}% mastery)`,
        targetConcepts: [topWeak.conceptId]
      });
    }

    return recommendations;
  }
}

module.exports = {
  ProgressTracker,
  AnalyticsService
};
