/**
 * Question Generation System
 * Generates review questions from extracted concepts
 */

/**
 * Question types:
 * - multiple_choice: 1 correct + 3 distractors
 * - fill_blank: Missing key term
 * - open_ended: Reflective questions
 */

const COGNITIVE_LEVELS = ['recall', 'understanding', 'application'];
const QUESTION_TYPES = ['multiple_choice', 'fill_blank', 'open_ended'];

/**
 * Generate questions from a concept
 * @param {object} concept - Concept object with term and definition
 * @param {object} options - Generation options
 * @returns {object[]} - Array of generated questions
 */
function generateQuestions(concept, options = {}) {
  const {
    questionTypes = ['multiple_choice', 'fill_blank'],
    cognitiveLevel = 'recall',
    includeOpenEnded = false
  } = options;

  const questions = [];

  // Generate multiple choice if requested
  if (questionTypes.includes('multiple_choice')) {
    const mcq = generateMultipleChoice(concept, cognitiveLevel);
    if (mcq) questions.push(mcq);
  }

  // Generate fill-in-blank if requested
  if (questionTypes.includes('fill_blank')) {
    const blank = generateFillInBlank(concept, cognitiveLevel);
    if (blank) questions.push(blank);
  }

  // Generate open-ended if requested
  if (includeOpenEnded && questionTypes.includes('open_ended')) {
    const open = generateOpenEnded(concept, cognitiveLevel);
    if (open) questions.push(open);
  }

  return questions;
}

/**
 * Generate multiple choice question
 */
function generateMultipleChoice(concept, cognitiveLevel = 'recall') {
  // Validate concept has sufficient definition
  if (!concept.definition || concept.definition.length < 30) {
    return null;
  }

  // Extract key phrase for answer
  const answerKey = concept.term;
  const answerText = concept.definition;

  // Generate distractors
  const distractors = generateDistractors(concept, 3);

  // Create question based on cognitive level
  let question;
  switch (cognitiveLevel) {
    case 'recall':
      question = `What is ${concept.term.toLowerCase()}?`;
      break;
    case 'understanding':
      question = `Which of the following best describes ${concept.term}?`;
      break;
    case 'application':
      question = `In what context would you use ${concept.term}?`;
      break;
    default:
      question = `What is ${concept.term.toLowerCase()}`;
  }

  // Randomize answer position
  const correctPosition = Math.floor(Math.random() * 4);
  const options = [
    { text: answerText, isCorrect: true },
    ...distractors.map(d => ({ text: d, isCorrect: false }))
  ];

  // Shuffle options
  shuffleArray(options);

  return {
    type: 'multiple_choice',
    question,
    options: options.map(o => o.text),
    correctAnswer: correctPosition,
    cognitiveLevel,
    term: concept.term,
    conceptDefinition: concept.definition,
    id: generateQuestionId('mcq', concept.term)
  };
}

/**
 * Generate distractors for multiple choice
 */
function generateDistractors(concept, count) {
  const distractors = [];
  const termLower = concept.term.toLowerCase();

  // Strategy 1: Related terms
  if (concept.relatedTerms && concept.relatedTerms.length > 0) {
    const shuffled = [...concept.relatedTerms].sort(() => Math.random() - 0.5);
    const used = new Set();

    for (const term of shuffled) {
      if (used.has(term.toLowerCase())) continue;
      if (term.toLowerCase() === termLower) continue;

      distractors.push(term);
      used.add(term.toLowerCase());

      if (distractors.length >= Math.ceil(count / 2)) break;
    }
  }

  // Strategy 2: Partial matches
  if (distractors.length < count) {
    const partials = generatePartialDefinitions(concept);
    for (const partial of partials) {
      if (distractors.length >= count) break;
      if (!distractors.includes(partial)) {
        distractors.push(partial);
      }
    }
  }

  // Strategy 3: Common misconceptions
  if (distractors.length < count) {
    const misconceptions = generateMisconceptions(concept);
    for (const misconception of misconceptions) {
      if (distractors.length >= count) break;
      if (!distractors.includes(misconception)) {
        distractors.push(misconception);
      }
    }
  }

  // Pad with generic distractors if needed
  const genericDistractors = [
    'None of the above',
    'All of the above',
    'Not applicable',
    'Insufficient information'
  ];

  while (distractors.length < count && genericDistractors.length > 0) {
    const idx = Math.floor(Math.random() * genericDistractors.length);
    distractors.push(genericDistractors[idx]);
    genericDistractors.splice(idx, 1);
  }

  return distractors;
}

/**
 * Generate partial definitions as distractors
 */
function generatePartialDefinitions(concept) {
  const definitions = [];
  const words = concept.definition.split(' ');

  if (words.length > 5) {
    // Take first half of definition
    const half = Math.floor(words.length / 2);
    definitions.push(words.slice(0, half).join(' '));

    // Take last half
    definitions.push(words.slice(half).join(' '));

    // Remove key phrase
    const withoutKey = concept.definition.replace(concept.term, '_______');
    if (withoutKey.length > 20) {
      definitions.push(withoutKey);
    }
  }

  return definitions;
}

/**
 * Generate common misconceptions
 */
function generateMisconceptions(concept) {
  const misconceptions = [];

  // Simple heuristic: swap first and last word if term has multiple words
  const termWords = concept.term.split(' ');
  if (termWords.length > 1) {
    const reversed = [...termWords].reverse().join(' ');
    misconceptions.push(reversed);
  }

  return misconceptions;
}

/**
 * Generate fill-in-the-blank question
 */
function generateFillInBlank(concept) {
  if (!concept.definition || concept.definition.length < 30) {
    return null;
  }

  // Find a sentence that contains the key term
  const sentences = concept.definition.split(/[.!?]+/);
  let targetSentence = sentences.find(s => 
    s.toLowerCase().includes(concept.term.toLowerCase()) &&
    s.length > 40
  );

  if (!targetSentence) {
    targetSentence = sentences[0];
  }

  // Replace term with blank
  const question = targetSentence.replace(
    new RegExp(concept.term, 'gi'),
    '_______'
  );

  return {
    type: 'fill_blank',
    question: question.trim(),
    answer: concept.term,
    cognitiveLevel: 'recall',
    term: concept.term,
    id: generateQuestionId('blank', concept.term)
  };
}

/**
 * Generate open-ended question
 */
function generateOpenEnded(concept, cognitiveLevel = 'understanding') {
  let question;

  switch (cognitiveLevel) {
    case 'recall':
      question = `Describe ${concept.term.toLowerCase()} in your own words.`;
      break;
    case 'understanding':
      question = `How does ${concept.term} relate to other concepts in this topic?`;
      break;
    case 'application':
      question = `Give a real-world example of ${concept.term.toLowerCase()} in action.`;
      break;
    default:
      question = `Explain the significance of ${concept.term}.`;
  }

  return {
    type: 'open_ended',
    question,
    cognitiveLevel,
    term: concept.term,
    keyConcepts: [concept.term],
    id: generateQuestionId('open', concept.term)
  };
}

/**
 * Generate unique question ID
 */
function generateQuestionId(type, term) {
  const hash = term.substring(0, 4).toLowerCase();
  const timestamp = Date.now().toString(36);
  return `${type}_${hash}_${timestamp}`;
}

/**
 * Validate question quality
 */
function validateQuestion(question) {
  const errors = [];

  // Check question clarity
  if (!question.question || question.question.length < 10) {
    errors.push('Question too short or missing');
  }

  // Check answer clarity for MCQ
  if (question.type === 'multiple_choice' && !question.correctAnswer) {
    errors.push('Missing correct answer position');
  }

  // Check answer clarity for fill-in-blank
  if (question.type === 'fill_blank' && !question.answer) {
    errors.push('Missing correct answer');
  }

  // Check distractor quality for MCQ
  if (question.type === 'multiple_choice') {
    const options = question.options || [];
    if (options.length < 4) {
      errors.push('Insufficient answer options (need at least 4)');
    }

    const uniqueOptions = new Set(options.map(o => o.toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      errors.push('Duplicate answer options');
    }
  }

  // Check cognitive level
  if (!COGNITIVE_LEVELS.includes(question.cognitiveLevel)) {
    errors.push(`Invalid cognitive level: ${question.cognitiveLevel}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    question
  };
}

/**
 * Shuffle array in place
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Generate batch questions from multiple concepts
 */
function generateBatchQuestions(concepts, options = {}) {
  const allQuestions = [];

  concepts.forEach(concept => {
    const questions = generateQuestions(concept, options);
    questions.forEach(question => {
      const validation = validateQuestion(question);
      if (validation.isValid) {
        allQuestions.push(question);
      }
    });
  });

  return {
    questions: allQuestions,
    totalGenerated: allQuestions.length,
    skipped: concepts.length - allQuestions.length
  };
}

module.exports = {
  generateQuestions,
  generateMultipleChoice,
  generateDistractors,
  generateFillInBlank,
  generateOpenEnded,
  generatePartialDefinitions,
  generateMisconceptions,
  validateQuestion,
  shuffleArray,
  generateBatchQuestions,
  COGNITIVE_LEVELS,
  QUESTION_TYPES
};
