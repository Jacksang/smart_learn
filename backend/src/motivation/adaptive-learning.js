/**
 * Adaptive Learning System
 * Learns from student responses to improve future recommendations
 */

/**
 * Student preference profile
 * @typedef {object} StudentProfile
 * @property {string} studentId - Student identifier
 * @property {object} recommendationPreferences - Preferences for each recommendation type
 * @property {object} messageStylePreferences - Preferred message styles
 * @property {number} lastUpdated - Timestamp of last update
 */

class AdaptiveLearningSystem {
  constructor() {
    this.profiles = new Map();
  }

  /**
   * Initialize profile for student
   */
  initializeProfile(studentId) {
    if (!this.profiles.has(studentId)) {
      this.profiles.set(studentId, {
        studentId,
        recommendationPreferences: {},
        messageStylePreferences: {},
        recentlyRejected: [],
        lastUpdated: Date.now()
      });
    }

    return this.profiles.get(studentId);
  }

  /**
   * Record student response to recommendation
   */
  recordResponse(studentId, recommendationId, action, outcome, timeSpent) {
    const profile = this.initializeProfile(studentId);

    // Update recommendation preferences
    if (!profile.recommendationPreferences[recommendationId]) {
      profile.recommendationPreferences[recommendationId] = {
        totalShown: 0,
        accepted: 0,
        rejected: 0,
        resolved: 0,
        avgTimeToResolution: 0,
        lastUsed: null
      };
    }

    const prefs = profile.recommendationPreferences[recommendationId];
    prefs.totalShown++;
    prefs.lastUsed = new Date().toISOString();

    if (action === 'accepted') {
      prefs.accepted++;
    }

    if (action === 'rejected') {
      prefs.rejected++;
      this.addRecentlyRejected(profile, recommendationId);
    }

    if (outcome === 'resolved') {
      prefs.resolved++;
      if (timeSpent) {
        const totalTime = prefs.totalTime || 0;
        const totalResolutions = prefs.totalTimeResolutions || 0;
        prefs.totalTime = totalTime + timeSpent;
        prefs.totalTimeResolutions = totalResolutions + 1;
        prefs.avgTimeToResolution = prefs.totalTime / prefs.totalTimeResolutions;
      }
    }

    profile.lastUpdated = Date.now();

    return profile;
  }

  /**
   * Add recently rejected recommendations (to avoid showing again)
   */
  addRecentlyRejected(profile, recommendationId) {
    const maxRecent = 3;

    // Remove from end if exceeds max
    if (profile.recentlyRejected.length >= maxRecent) {
      profile.recentlyRejected.shift();
    }

    // Add to front
    profile.recentlyRejected.push(recommendationId);
  }

  /**
   * Get personalized recommendations for student
   */
  getPersonalizedRecommendations(baseRecommendations, studentId) {
    const profile = this.profiles.get(studentId);

    if (!profile) {
      return baseRecommendations;
    }

    // Score each recommendation based on student preferences
    const scored = baseRecommendations.map(rec => {
      let score = rec.score || 0;

      // Boost previously successful recommendations
      const recPrefs = profile.recommendationPreferences[rec.id];
      if (recPrefs && recPrefs.accepted > recPrefs.rejected) {
        score += 5;
      }

      // Penalize recently rejected
      if (profile.recentlyRejected.includes(rec.id)) {
        score -= 10;
      }

      // Boost if resolved quickly
      if (recPrefs && recPrefs.avgTimeToResolution < 300 && rec.confidenceBoost) {
        score += 3;
      }

      return {
        ...rec,
        personalizedScore: score
      };
    });

    // Sort by personalized score
    scored.sort((a, b) => b.personalizedScore - a.personalizedScore);

    return scored;
  }

  /**
   * Learn message style preferences
   */
  learnMessagePreference(studentId, messageStyle, rating) {
    const profile = this.initializeProfile(studentId);

    if (!profile.messageStylePreferences[messageStyle]) {
      profile.messageStylePreferences[messageStyle] = {
        positiveRatings: 0,
        negativeRatings: 0,
        lastUsed: null
      };
    }

    const prefs = profile.messageStylePreferences[messageStyle];
    prefs.lastUsed = new Date().toISOString();

    if (rating >= 4) {
      prefs.positiveRatings++;
    } else if (rating <= 2) {
      prefs.negativeRatings++;
    }

    profile.lastUpdated = Date.now();

    return profile;
  }

  /**
   * Get student's preferred message style
   */
  getPreferredMessageStyle(studentId) {
    const profile = this.profiles.get(studentId);

    if (!profile || !profile.messageStylePreferences) {
      return 'encouraging'; // Default
    }

    // Find style with best ratio of positive to negative
    const styles = Object.entries(profile.messageStylePreferences)
      .map(([style, prefs]) => ({
        style,
        score: prefs.positiveRatings / (prefs.positiveRatings + prefs.negativeRatings || 1)
      }))
      .sort((a, b) => b.score - a.score);

    return styles[0]?.style || 'encouraging';
  }

  /**
   * Get insights about student learning patterns
   */
  getStudentInsights(studentId) {
    const profile = this.profiles.get(studentId);

    if (!profile) {
      return null;
    }

    // Calculate success rates for each recommendation type
    const recommendationInsights = Object.entries(profile.recommendationPreferences)
      .map(([id, prefs]) => ({
        id,
        successRate: prefs.accepted / prefs.totalShown || 0,
        resolutionTime: prefs.avgTimeToResolution,
        totalShown: prefs.totalShown
      }))
      .filter(item => item.totalShown >= 2); // Need enough data

    // Find best and worst performing recommendations
    const sorted = [...recommendationInsights].sort((a, b) => b.successRate - a.successRate);

    const bestPerforming = sorted[0];
    const worstPerforming = sorted[sorted.length - 1];

    return {
      studentId,
      totalRecommendations: Object.keys(profile.recommendationPreferences).length,
      bestPerformingRecommendation: bestPerforming,
      worstPerformingRecommendation: worstPerforming,
      recentlyRejectedCount: profile.recentlyRejected.length,
      lastUpdated: new Date(profile.lastUpdated).toISOString()
    };
  }

  /**
   * Export profile for persistence
   */
  exportProfile(studentId) {
    const profile = this.profiles.get(studentId);
    return profile ? { ...profile } : null;
  }

  /**
   * Import profile from storage
   */
  importProfile(studentId, profileData) {
    this.profiles.set(studentId, {
      ...this.initializeProfile(studentId),
      ...profileData,
      lastUpdated: Date.now()
    });
  }
}

// Global instance
const adaptiveLearningSystem = new AdaptiveLearningSystem();

module.exports = {
  AdaptiveLearningSystem,
  adaptiveLearningSystem
};
