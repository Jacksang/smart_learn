/**
 * Confidence-Support Messaging System
 * Provides supportive, confidence-building messages during struggle
 */

/**
 * Message categories:
 * - validation: Acknowledge difficulty is normal
 * - perspective: Reframe challenge as learning opportunity
 * - self_efficacy: Remind of past successes
 * - growth_mindset: Emphasize effort over innate ability
 * - future_orientation: Connect struggle to long-term growth
 */

const CONFIDENCE_MESSAGES = {
  // Validation Messages
  validation: [
    {
      text: 'This concept is challenging - that\'s completely normal! Many students find this part tricky at first.',
      keywords: ['challenging', 'difficult', 'hard']
    },
    {
      text: 'It\'s okay to feel stuck - that\'s a natural part of learning. You\'re not alone in this.',
      keywords: ['stuck', 'confused', 'unclear']
    },
    {
      text: 'This is a tough concept - the fact that it\'s challenging means you\'re pushing your boundaries.',
      keywords: ['tough', 'difficult', 'hard']
    },
    {
      text: 'Everyone struggles with this at some point. That doesn\'t mean you can\'t master it - it just means it takes time.',
      keywords: ['everyone', 'struggles']
    }
  ],

  // Perspective Messages
  perspective: [
    {
      text: 'Every expert was once a beginner who struggled with exactly this concept. This is part of the journey.',
      keywords: ['expert', 'beginner']
    },
    {
      text: 'Struggling with this means your brain is actively building new neural pathways - that\'s growth happening!',
      keywords: ['brain', 'growth', 'learning']
    },
    {
      text: 'These challenging moments are where real learning happens. You\'re building skills that will last.',
      keywords: ['challenging', 'learning', 'skills']
    },
    {
      text: 'This is exactly the kind of challenge that makes learning meaningful - you\'re working through something valuable.',
      keywords: ['challenge', 'meaningful', 'valuable']
    }
  ],

  // Self-Efficacy Messages
  self_efficacy: [
    {
      text: 'You\'ve figured out hard things before - you can absolutely work through this too.',
      keywords: ['before', 'figure', 'solved']
    },
    {
      text: 'Remember when you mastered [earlier_topic]? You\'re building on those same skills now.',
      keywords: ['remember', 'mastered', 'build']
    },
    {
      text: 'You have the skills to work through this - you\'re stronger than you think.',
      keywords: ['skills', 'stronger', 'think']
    },
    {
      text: 'This feels challenging now, but you have everything you need to get through it.',
      keywords: ['feel', 'challenging', 'need', 'get through']
    }
  ],

  // Growth Mindset Messages
  growth_mindset: [
    {
      text: 'It\'s not about being good at this yet - it\'s about learning how. Every attempt builds your understanding.',
      keywords: ['yet', 'learning', 'builds']
    },
    {
      text: 'Every attempt, even the ones that don\'t work, is strengthening your learning pathways.',
      keywords: ['attempts', 'strengthening', 'learning']
    },
    {
      text: 'The effort you\'re putting in right now is what makes you stronger - this is growth in action.',
      keywords: ['effort', 'stronger', 'growth']
    },
    {
      text: 'You\'re not failing - you\'re learning. Each try brings you closer to mastery.',
      keywords: ['failing', 'learning', 'closer', 'mastery']
    }
  ],

  // Future-Oriented Messages
  future_orientation: [
    {
      text: 'This challenge is building skills you\'ll use forever - the effort you\'re making now pays off for years.',
      keywords: ['forever', 'effort', 'pays', 'years']
    },
    {
      text: 'Mastering this will make the next concepts feel easy - you\'re building your foundation right now.',
      keywords: ['mastering', 'foundation', 'building']
    },
    {
      text: 'Today\'s struggle is tomorrow\'s strength - you\'re investing in your future learning.',
      keywords: ['today', 'tomorrow', 'investing', 'future']
    },
    {
      text: 'The skills you\'re developing through this challenge will help you tackle anything in the future.',
      keywords: ['skills', 'developing', 'future', 'anything']
    }
  ]
};

/**
 * Select appropriate confidence-support message based on struggle pattern
 * @param {object} struggleAnalysis - Struggle analysis with patterns and severity
 * @param {object} studentContext - Student context for personalization
 * @returns {object} - Selected message with category
 */
function selectConfidenceSupportMessage(struggleAnalysis, studentContext = {}) {
  const { patterns, severity } = struggleAnalysis;

  // Determine which message type to use
  const messageCategory = getMessageCategory(struggleAnalysis, studentContext);

  // Get candidate messages
  const candidates = getCandidateMessages(messageCategory, struggleAnalysis);

  // Personalize and score
  const scored = candidates.map(msg => ({
    message: msg,
    score: scoreMessageMatch(msg, struggleAnalysis, studentContext)
  }));

  // Select best match
  scored.sort((a, b) => b.score - a.score);
  const selected = scored[0];

  return {
    message: selected.message,
    category: messageCategory,
    score: selected.score
  };
}

/**
 * Determine which message category to use
 */
function getMessageCategory(struggleAnalysis, studentContext) {
  const { patterns, severity } = struggleAnalysis;

  // High severity: Use validation + growth mindset
  if (severity === 'high') {
    if (patterns.includes('frustration_pattern')) {
      return 'validation';
    }
    return 'self_efficacy';
  }

  // Based on patterns
  if (patterns.includes('repeated_failures')) {
    return 'validation';
  }

  if (patterns.includes('long_response_times')) {
    return 'perspective';
  }

  if (patterns.includes('rapid_switching')) {
    return 'growth_mindset';
  }

  if (patterns.includes('help_requested')) {
    return 'self_efficacy';
  }

  // Default to perspective for ongoing struggle
  return 'perspective';
}

/**
 * Get candidate messages based on category and context
 */
function getCandidateMessages(messageCategory, struggleAnalysis) {
  const messages = CONFIDENCE_MESSAGES[messageCategory] || [];

  // Filter based on struggle patterns
  return messages.filter(msg =>
    msg.keywords.some(keyword =>
      keyword.toLowerCase() === 'challenging' ||
      keyword.toLowerCase() === 'difficult' ||
      keyword.toLowerCase() === 'hard' ||
      keyword.toLowerCase() === 'struggling'
    )
  );
}

/**
 * Score how well a message matches the current context
 */
function scoreMessageMatch(message, struggleAnalysis, studentContext) {
  let score = 10; // Base score

  const { patterns, severity } = struggleAnalysis;

  // Boost score if keywords match patterns
  message.keywords.forEach(keyword => {
    if (patterns.some(p => p.includes(keyword.toLowerCase()))) {
      score += 3;
    }
  });

  // Boost score based on severity
  if (severity === 'high' && messageCategoryIsAppropriate(message.category, 'high')) {
    score += 5;
  }

  // Personalize based on student context
  if (studentContext.recentSuccesses > 2) {
    score += 2; // Can use self-efficacy messages more
  }

  if (studentContext.sessionDuration > 1800) {
    score += 2; // Long sessions benefit from perspective messages
  }

  return score;
}

/**
 * Check if message category is appropriate for severity level
 */
function messageCategoryIsAppropriate(category, severity) {
  if (severity === 'high') {
    return ['validation', 'self_efficacy'].includes(category);
  }

  return true;
}

/**
 * Personalize message based on student history
 */
function personalizeMessage(message, studentContext) {
  const { message, category } = typeof message === 'string'
    ? { message, category: 'perspective' }
    : message;

  // Check if student has recent topic mastery to reference
  if (studentContext.recentMasteryTopics && studentContext.recentMasteryTopics.length > 0) {
    const topic = studentContext.recentMasteryTopics[0];
    return message.replace('[earlier_topic]', topic);
  }

  // If student prefers direct messages
  if (studentContext.messageStyle === 'direct') {
    return message;
  }

  // If student prefers encouraging messages
  if (studentContext.messageStyle === 'encouraging') {
    const prefixes = [
      'You\'ve got this! ',
      'Keep going! ',
      'You\'re doing great! '
    ];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + message;
  }

  return message;
}

/**
 * Generate confidence-support message with optional personalization
 */
function generateConfidenceSupport(struggleAnalysis, studentContext = {}) {
  const result = selectConfidenceSupportMessage(struggleAnalysis, studentContext);

  // Personalize message
  const personalized = personalizeMessage(result.message, studentContext);

  return {
    ...result,
    message: personalized,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get all message categories
 */
function getMessageCategories() {
  return Object.keys(CONFIDENCE_MESSAGES);
}

/**
 * Get messages by category
 */
function getMessagesByCategory(category) {
  return CONFIDENCE_MESSAGES[category] || [];
}

/**
 * Create message template for custom messages
 */
function createMessageTemplate(category, text) {
  if (!CONFIDENCE_MESSAGES[category]) {
    CONFIDENCE_MESSAGES[category] = [];
  }

  CONFIDENCE_MESSAGES[category].push({ text, keywords: [] });
  return CONFIDENCE_MESSAGES[category];
}

/**
 * Get message variety to avoid repetition
 */
function getNextMessage(category, usedMessages = []) {
  const available = getMessagesByCategory(category);
  const unused = available.filter(msg => !usedMessages.includes(msg.text));

  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)];
  }

  // All messages used, return first one
  return available[0];
}

module.exports = {
  CONFIDENCE_MESSAGES,
  selectConfidenceSupportMessage,
  generateConfidenceSupport,
  getMessageCategories,
  getMessagesByCategory,
  createMessageTemplate,
  getNextMessage,
  personalizeMessage
};
