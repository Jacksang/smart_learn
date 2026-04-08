/**
 * Flashcard Service Layer
 * Orchestrates flashcard generation and review workflow
 */

const { extractConcepts } = require('./concept-extractor');
const { generateQuestions, generateBatchQuestions } = require('./question-generator');
const {
  initializeSchedule,
  calculateNextReview,
  getFlashcardsDue,
  getReviewSchedule,
  calculateReviewStats,
  checkMastered,
  resetSchedule
} = require('./spaced-repetition');

/**
 * Flashcard Service Class
 * Manages flashcard creation, scheduling, and review
 */
class FlashcardService {
  constructor() {
    this.flashcards = new Map(); // In-memory storage for MVP
    this.reviewHistory = new Map(); // Track review history
  }

  /**
   * Generate flashcards from study materials
   */
  async generateFlashcards(projectId, materials, options = {}) {
    try {
      const {
        content,
        contentType,
        maxFlashcards = 50,
        questionTypes = ['multiple_choice', 'fill_blank'],
        includeOpenEnded = false,
        cognitiveLevel = 'recall'
      } = options;

      // Extract concepts from content
      const extraction = extractConcepts(content, {
        maxConcepts: maxFlashcards,
        contentTypes: [contentType]
      });

      // Generate questions for each concept
      const questionsResult = generateBatchQuestions(extraction.concepts, {
        questionTypes,
        cognitiveLevel,
        includeOpenEnded
      });

      // Create flashcards with schedules
      const flashcards = questionsResult.questions.map(question => ({
        id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        projectId,
        conceptTerm: question.term,
        conceptDefinition: question.conceptDefinition || '',
        question: question,
        cognitiveLevel: question.cognitiveLevel,
        topic: this.inferTopic(question.term, question.question),
        schedule: initializeSchedule({
          priority: 0.5, // Default priority
          initialInterval: 1
        }),
        createdAt: new Date().toISOString(),
        metadata: {
          source: extraction.metadata,
          generationTime: questionsResult.totalGenerated
        }
      }));

      // Store flashcards
      flashcards.forEach(fc => {
        this.flashcards.set(fc.id, fc);
      });

      return {
        success: true,
        flashcards: flashcards,
        metadata: {
          totalGenerated: flashcards.length,
          sourceConcepts: extraction.concepts.length,
          questionTypes: questionTypes,
          processingTime: Date.now() - extraction.metadata.processingTime
        }
      };
    } catch (error) {
      console.error('Error generating flashcards:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Infer topic from term and question
   */
  inferTopic(term, question) {
    // Simple keyword matching for MVP
    const topicKeywords = {
      'Biology': ['cell', 'organism', 'species', 'DNA', 'protein', 'enzyme'],
      'Chemistry': ['molecule', 'atom', 'compound', 'reaction', 'element'],
      'Physics': ['energy', 'force', 'mass', 'velocity', 'acceleration'],
      'Mathematics': ['number', 'equation', 'function', 'integral', 'derivative'],
      'History': ['event', 'period', 'culture', 'society', 'empire'],
      'Literature': ['character', 'narrative', 'theme', 'poetry', 'novel']
    };

    const termLower = term.toLowerCase();
    const questionLower = question.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword =>
        termLower.includes(keyword) || questionLower.includes(keyword)
      )) {
        return topic;
      }
    }

    return 'General'; // Default topic
  }

  /**
   * Get flashcard by ID
   */
  getFlashcard(flashcardId) {
    const flashcard = this.flashcards.get(flashcardId);
    if (!flashcard) {
      return {
        success: false,
        error: 'Flashcard not found'
      };
    }

    const stats = calculateReviewStats(flashcard);
    const mastery = checkMastered(flashcard.schedule);

    return {
      success: true,
      data: {
        ...flashcard,
        reviewStats: stats,
        isMastered: mastery.isMastered
      }
    };
  }

  /**
   * Record review of flashcard
   */
  async reviewFlashcard(flashcardId, rating, responseTime = null) {
    try {
      const flashcard = this.flashcards.get(flashcardId);
      if (!flashcard) {
        return {
          success: false,
          error: 'Flashcard not found'
        };
      }

      // Validate rating
      if (rating < 0 || rating > 5) {
        return {
          success: false,
          error: 'Rating must be between 0 and 5'
        };
      }

      // Calculate new schedule
      const newSchedule = calculateNextReview(flashcard.schedule, rating);

      // Update flashcard
      flashcard.schedule = {
        ...flashcard.schedule,
        ...newSchedule,
        lastReview: new Date().toISOString(),
        totalReviews: flashcard.schedule.totalReviews + 1,
        successCount: rating >= 3 ? flashcard.schedule.successCount + 1 : flashcard.schedule.successCount,
        failedCount: rating < 3 ? flashcard.schedule.failedCount + 1 : flashcard.schedule.failedCount
      };

      // Check if mastered
      const mastery = checkMastered(flashcard.schedule);
      if (mastery.isMastered) {
        flashcard.schedule.status = 'mastered';
      }

      // Record in review history
      this.recordReview(flashcardId, rating, responseTime);

      return {
        success: true,
        data: {
          flashcardId,
          newSchedule: {
            nextReview: flashcard.schedule.nextReview,
            interval: flashcard.schedule.interval,
            repetitions: flashcard.schedule.repetitions
          },
          isMastered: mastery.isMastered
        }
      };
    } catch (error) {
      console.error('Error reviewing flashcard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record review in history
   */
  recordReview(flashcardId, rating, responseTime) {
    if (!this.reviewHistory.has(flashcardId)) {
      this.reviewHistory.set(flashcardId, []);
    }

    this.reviewHistory.get(flashcardId).push({
      flashcardId,
      rating,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get review schedule
   */
  getReviewSchedule(startDate = new Date(), days = 7) {
    const flashcards = Array.from(this.flashcards.values());
    const schedule = getReviewSchedule(flashcards, startDate, days);

    return {
      success: true,
      data: schedule
    };
  }

  /**
   * Get flashcards due for review
   */
  getFlashcardsDue(targetDate = new Date()) {
    const flashcards = Array.from(this.flashcards.values());
    const due = getFlashcardsDue(flashcards, targetDate);

    return {
      success: true,
      data: due
    };
  }

  /**
   * Reset flashcard schedule
   */
  resetFlashcardSchedule(flashcardId) {
    const flashcard = this.flashcards.get(flashcardId);
    if (!flashcard) {
      return {
        success: false,
        error: 'Flashcard not found'
      };
    }

    flashcard.schedule = initializeSchedule();

    return {
      success: true,
      data: {
        flashcardId,
        schedule: flashcard.schedule
      }
    };
  }

  /**
   * Get student progress statistics
   */
  getStudentProgress(projectId) {
    const projectFlashcards = Array.from(this.flashcards.values()).filter(
      fc => fc.projectId === projectId
    );

    const total = projectFlashcards.length;
    const due = projectFlashcards.filter(fc => {
      const nextReview = new Date(fc.schedule.nextReview);
      return nextReview <= new Date() && !fc.schedule.isMastered;
    }).length;

    const mastered = projectFlashcards.filter(fc => fc.schedule.isMastered).length;

    const totalReviews = projectFlashcards.reduce((sum, fc) =>
      sum + (fc.schedule.totalReviews || 0), 0
    );

    const totalSuccesses = projectFlashcards.reduce((sum, fc) =>
      sum + (fc.schedule.successCount || 0), 0
    );

    const averageSuccessRate = totalReviews > 0
      ? (totalSuccesses / totalReviews) * 100
      : 0;

    return {
      totalFlashcards: total,
      flashcardsDue: due,
      flashcardsMastered: mastered,
      flashcardsPending: total - mastered - due,
      totalReviews,
      averageSuccessRate: averageSuccessRate.toFixed(1)
    };
  }

  /**
   * Export all flashcards for persistence
   */
  exportFlashcards() {
    const flashcards = Array.from(this.flashcards.values());
    return {
      flashcards,
      exportTimestamp: new Date().toISOString()
    };
  }

  /**
   * Import flashcards from persistence
   */
  importFlashcards(exportData) {
    const { flashcards } = exportData;

    flashcards.forEach(fc => {
      this.flashcards.set(fc.id, fc);
    });

    return {
      success: true,
      imported: flashcards.length
    };
  }
}

// Global instance
const flashcardService = new FlashcardService();

module.exports = {
  FlashcardService,
  flashcardService
};
