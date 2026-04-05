function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeCasefoldedText(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeBooleanAnswer(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = normalizeCasefoldedText(value);
  if (!normalized) {
    return null;
  }

  if (['true', 't', 'yes', 'y', '1'].includes(normalized)) {
    return true;
  }

  if (['false', 'f', 'no', 'n', '0'].includes(normalized)) {
    return false;
  }

  return null;
}

function unwrapAnswerValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      return value.value;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'answer')) {
      return value.answer;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'text')) {
      return value.text;
    }
  }

  return value;
}

function normalizeAnswerPayload(userAnswer) {
  const rawValue = unwrapAnswerValue(userAnswer);

  return {
    raw: userAnswer,
    value: rawValue,
    text: normalizeWhitespace(rawValue),
    normalizedText: normalizeCasefoldedText(rawValue),
    booleanValue: normalizeBooleanAnswer(rawValue),
  };
}

function normalizeCorrectAnswer(correctAnswer) {
  const rawValue = unwrapAnswerValue(correctAnswer);
  const aliases = Array.isArray(correctAnswer?.aliases)
    ? correctAnswer.aliases.map((alias) => normalizeCasefoldedText(alias)).filter(Boolean)
    : [];

  return {
    raw: correctAnswer,
    value: rawValue,
    text: normalizeWhitespace(rawValue),
    normalizedText: normalizeCasefoldedText(rawValue),
    booleanValue: normalizeBooleanAnswer(rawValue),
    aliases,
  };
}

function buildFeedbackText({ isCorrect, expectedText }) {
  if (isCorrect) {
    return 'Correct';
  }

  if (expectedText) {
    return `Incorrect. Expected: ${expectedText}`;
  }

  return 'Incorrect';
}

function evaluateMultipleChoice(normalizedAnswer, normalizedCorrectAnswer) {
  const isCorrect =
    normalizedAnswer.normalizedText.length > 0
    && normalizedAnswer.normalizedText === normalizedCorrectAnswer.normalizedText;

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
  };
}

function evaluateTrueFalse(normalizedAnswer, normalizedCorrectAnswer) {
  const isCorrect =
    normalizedAnswer.booleanValue !== null
    && normalizedCorrectAnswer.booleanValue !== null
    && normalizedAnswer.booleanValue === normalizedCorrectAnswer.booleanValue;

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
  };
}

function evaluateShortAnswer(normalizedAnswer, normalizedCorrectAnswer) {
  const acceptedAnswers = [normalizedCorrectAnswer.normalizedText, ...normalizedCorrectAnswer.aliases].filter(Boolean);
  const isCorrect =
    normalizedAnswer.normalizedText.length > 0
    && acceptedAnswers.includes(normalizedAnswer.normalizedText);

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
  };
}

function evaluateAnswerAttempt({ question, userAnswer }) {
  const normalizedAnswer = normalizeAnswerPayload(userAnswer);
  const normalizedCorrectAnswer = normalizeCorrectAnswer(question?.correct_answer);

  let evaluation;
  switch (question?.question_type) {
    case 'true_false':
      evaluation = evaluateTrueFalse(normalizedAnswer, normalizedCorrectAnswer);
      break;
    case 'short_answer':
      evaluation = evaluateShortAnswer(normalizedAnswer, normalizedCorrectAnswer);
      break;
    case 'multiple_choice':
    default:
      evaluation = evaluateMultipleChoice(normalizedAnswer, normalizedCorrectAnswer);
      break;
  }

  return {
    isCorrect: evaluation.isCorrect,
    score: evaluation.score,
    feedbackText: buildFeedbackText({
      isCorrect: evaluation.isCorrect,
      expectedText: normalizedCorrectAnswer.text,
    }),
    explanation: question?.explanation || null,
  };
}

module.exports = {
  normalizeWhitespace,
  normalizeBooleanAnswer,
  normalizeAnswerPayload,
  normalizeCorrectAnswer,
  evaluateAnswerAttempt,
};
