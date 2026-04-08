/**
 * Adaptive Encouragement Service
 * Integrates struggle detection, confidence support, and recommendations
 */

const { detectStruggleSignals, getRecommendedAction, generateEncouragement } = require('./struggle-detection');
const { generateConfidenceSupport, getMessageCategories } = require('./confidence-support');
const { recommendNextSteps, recordStudentResponse } = require('./next-steps');
const { adaptiveLearningSystem } = require('./adaptive-learning');

/**
 * Detect struggle and generate full adaptive support response
 * @param {object} activityHistory - Recent student activity
 * @param {object} studentContext - Student context for personalization
 * @returns {object} - Complete support response
 */
async function getAdaptiveSupport(activityHistory, studentContext = {}) {
  try {
    // Step 1: Detect struggle
    const struggleAnalysis = detectStruggleSignals(activityHistory);

    // If no struggle detected, return default encouragement
    if (!struggleAnalysis.struggleDetected) {
      return {
        struggleDetected: false,
        encouragement: generateEncouragement({ severity: 'low', patterns: [] }),
        recommendations: []
      };
    }

    // Step 2: Generate confidence-support message
    const supportMessage = generateConfidenceSupport(struggleAnalysis, studentContext);

    // Step 3: Generate recommendations
    const baseRecommendations = recommendNextSteps(struggleAnalysis, studentContext);

    // Step 4: Personalize recommendations
    const personalizedRecommendations = adaptiveLearningSystem.getPersonalizedRecommendations(
      baseRecommendations,
      studentContext.studentId
    );

    return {
      struggleDetected: true,
      struggleAnalysis,
      supportMessage,
      recommendations: personalizedRecommendations,
      suggestedAction: getRecommendedAction(struggleAnalysis),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getAdaptiveSupport:', error);
    return {
      struggleDetected: false,
      encouragement: 'Something went wrong - please try again',
      recommendations: []
    };
  }
}

/**
 * Record student response to recommendation for learning
 */
async function recordResponse(studentId, recommendationId, action, outcome, timeSpent) {
  try {
    const profile = adaptiveLearningSystem.recordResponse(
      studentId,
      recommendationId,
      action,
      outcome,
      timeSpent
    );

    return {
      success: true,
      studentId,
      profile
    };
  } catch (error) {
    console.error('Error recording response:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get student's learning insights
 */
async function getStudentInsights(studentId) {
  try {
    const insights = adaptiveLearningSystem.getStudentInsights(studentId);

    return {
      success: true,
      data: insights
    };
  } catch (error) {
    console.error('Error getting insights:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get available message categories
 */
async function getMessageCategoriesHandler() {
  const categories = getMessageCategories();

  return {
    success: true,
    categories
  };
}

/**
 * Generate encouragement for current activity
 */
async function generateEncouragementHandler(activityData) {
  try {
    const support = await getAdaptiveSupport(activityData.history, {
      studentId: activityData.studentId,
      messageStyle: activityData.messageStyle
    });

    return {
      success: true,
      data: support
    };
  } catch (error) {
    console.error('Error generating encouragement:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get struggle analysis for current activity
 */
async function getStruggleAnalysisHandler(activityData) {
  try {
    const analysis = detectStruggleSignals(activityData.history);

    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    console.error('Error in struggle analysis:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getAdaptiveSupport,
  recordResponse,
  getStudentInsights,
  getMessageCategoriesHandler,
  generateEncouragementHandler,
  getStruggleAnalysisHandler
};
