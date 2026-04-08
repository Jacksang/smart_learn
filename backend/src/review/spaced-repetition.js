/**
 * Spaced Repetition System
 * Implements SM-2 algorithm for optimal review scheduling
 */

/**
 * SM-2 Algorithm Overview:
 * - Initial interval: 1 day
 * - After correct: interval * multiplier based on difficulty
 * - After incorrect: reset to 1 day
 * - Difficulty: 0-5 scale (0=too hard, 5=easy)
 */

const SM2_MULTIPLIER = 0.135; // Exponential multiplier
const MIN_INTERVAL = 1; // Minimum interval in days
const MAX_INTERVAL = 365; // Maximum interval in days

/**
 * Initialize spaced repetition schedule for new flashcard
 * @param {object} options - Initialization options
 * @returns {object} - Initial schedule state
 */
function initializeSchedule(options = {}) {
  const {
    priority = 0.5, // Concept priority (0-1)
    initialInterval = 1 // Initial interval in days
  } = options;

  // Higher priority concepts start with shorter intervals
  const adjustedInterval = initialInterval;

  return {
    interval: adjustedInterval,
    repetitions: 0,
    difficulty: 3, // Neutral starting difficulty
    nextReview: new Date(Date.now() + adjustedInterval * 24 * 60 * 60 * 1000),
    lastReview: null,
    totalReviews: 0,
    successCount: 0,
    failedCount: 0
  };
}

/**
 * Calculate next review based on student performance
 * @param {object} currentSchedule - Current schedule state
 * @param {number} rating - Student rating (0-5)
 * @returns {object} - Updated schedule
 */
function calculateNextReview(currentSchedule, rating) {
  const ratingInt = Math.round(rating);

  // Validate rating
  if (ratingInt < 0 || ratingInt > 5) {
    throw new Error('Rating must be between 0 and 5');
  }

  // Failed review (rating < 3)
  if (ratingInt < 3) {
    return {
      interval: 1,
      repetitions: 0,
      difficulty: Math.max(0, ratingInt),
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reset: true
    };
  }

  // Successful review
  let newInterval;
  let newRepetitions;

  if (currentSchedule.repetitions === 0) {
    // First successful review
    newInterval = 1;
    newRepetitions = 1;
  } else if (currentSchedule.repetitions === 1) {
    // Second successful review
    newInterval = 6;
    newRepetitions = 2;
  } else {
    // Subsequent reviews: SM-2 formula
    const multiplier = Math.exp((ratingInt - 3) * SM2_MULTIPLIER);
    newInterval = Math.round(currentSchedule.interval * multiplier);
    newInterval = Math.max(newInterval, currentSchedule.interval + 1);
    newRepetitions = currentSchedule.repetitions + 1;
  }

  // Cap interval at maximum
  newInterval = Math.min(newInterval, MAX_INTERVAL);

  // Update difficulty based on rating
  const newDifficulty = calculateNewDifficulty(currentSchedule.difficulty, ratingInt);

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    difficulty: newDifficulty,
    nextReview: calculateNextReviewDate(newInterval),
    reset: false
  };
}

/**
 * Calculate new difficulty rating
 */
function calculateNewDifficulty(oldDifficulty, rating) {
  // Adjust difficulty based on rating and previous difficulty
  const adjustment = (rating - 3) * 0.1;
  const newDifficulty = oldDifficulty + adjustment;

  // Clamp to 0-5 range
  return Math.max(0, Math.min(5, newDifficulty));
}

/**
 * Calculate next review date
 */
function calculateNextReviewDate(intervalDays) {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date;
}

/**
 * Get flashcards due for review
 * @param {object[]} flashcards - Array of flashcards with schedules
 * @param {Date} targetDate - Date to check (default: today)
 * @returns {object[]} - Flashcards due for review
 */
function getFlashcardsDue(flashcards, targetDate = new Date()) {
  const due = [];

  flashcards.forEach(flashcard => {
    const schedule = flashcard.schedule || {};
    const nextReview = new Date(schedule.nextReview);

    if (nextReview <= targetDate && schedule.status !== 'mastered') {
      due.push({
        flashcardId: flashcard.id,
        term: flashcard.term,
        nextReview: schedule.nextReview,
        interval: schedule.interval,
        repetitions: schedule.repetitions,
        dueToday: nextReview.toDateString() === targetDate.toDateString()
      });
    }
  });

  return due;
}

/**
 * Get review schedule for student
 * @param {object[]} flashcards - Student's flashcards
 * @param {Date} startDate - Start date for schedule
 * @param {number} days - Number of days to show
 * @returns {object} - Schedule object
 */
function getReviewSchedule(flashcards, startDate = new Date(), days = 7) {
  const schedule = {
    targetDate: startDate.toISOString(),
    days: [],
    totalDue: 0,
    totalUpcoming: 0
  };

  const current = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const date = new Date(current);
    const flashcardsDue = getFlashcardsDue(flashcards, date);

    schedule.days.push({
      date: date.toISOString().split('T')[0],
      flashcardsDue: flashcardsDue.length,
      items: flashcardsDue.map(f => ({
        id: f.flashcardId,
        term: f.term,
        interval: f.interval,
        repetitions: f.repetitions
      }))
    });

    schedule.totalDue += flashcardsDue.length;

    current.setDate(current.getDate() + 1);
  }

  // Add total upcoming (next 30 days)
  const upComingDate = new Date(startDate);
  upComingDate.setDate(upComingDate.getDate() + 30);
  schedule.totalUpcoming = getFlashcardsDue(flashcards, upComingDate).length;

  return schedule;
}

/**
 * Calculate review statistics for a flashcard
 */
function calculateReviewStats(flashcard) {
  const schedule = flashcard.schedule;
  const totalReviews = schedule.totalReviews || 0;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      successRate: 0,
      averageInterval: 0,
      lastReviewed: schedule.lastReview
    };
  }

  const successRate = (schedule.successCount / totalReviews) * 100;
  const averageInterval = schedule.successCount > 0
    ? schedule.interval // Use current interval as proxy
    : 0;

  return {
    totalReviews,
    successRate: successRate.toFixed(1),
    averageInterval,
    lastReviewed: schedule.lastReview
  };
}

/**
 * Check if flashcard should be mastered
 */
function checkMastered(schedule, masteryThreshold = 15) {
  // Flashcard is mastered if:
  // - Has 15+ successful consecutive reviews
  // - And current interval is 30+ days
  const isReady = schedule.repetitions >= masteryThreshold &&
                  schedule.interval >= 30;

  return {
    isMastered: isReady,
    threshold: masteryThreshold,
    currentInterval: schedule.interval
  };
}

/**
 * Reset schedule (for manual review or relearning)
 */
function resetSchedule(flashcardId) {
  return {
    flashcardId,
    schedule: initializeSchedule(),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  initializeSchedule,
  calculateNextReview,
  calculateNewDifficulty,
  calculateNextReviewDate,
  getFlashcardsDue,
  getReviewSchedule,
  calculateReviewStats,
  checkMastered,
  resetSchedule,
  SM2_MULTIPLIER,
  MIN_INTERVAL,
  MAX_INTERVAL
};
