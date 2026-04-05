const {
  normalizeAnswerPayload,
  evaluateAnswerAttempt,
} = require('./service');

describe('answers service', () => {
  test('normalizes object and scalar answer payloads consistently', () => {
    expect(normalizeAnswerPayload({ value: '  TRUE  ' })).toEqual({
      raw: { value: '  TRUE  ' },
      value: '  TRUE  ',
      text: 'TRUE',
      normalizedText: 'true',
      booleanValue: true,
    });

    expect(normalizeAnswerPayload('  Cell membrane  ')).toEqual({
      raw: '  Cell membrane  ',
      value: '  Cell membrane  ',
      text: 'Cell membrane',
      normalizedText: 'cell membrane',
      booleanValue: null,
    });
  });

  test('evaluates multiple choice answers deterministically', () => {
    expect(
      evaluateAnswerAttempt({
        question: {
          question_type: 'multiple_choice',
          correct_answer: { value: 'B' },
          explanation: 'B is the right option.',
        },
        userAnswer: { value: 'b' },
      })
    ).toEqual({
      isCorrect: true,
      score: 100,
      feedbackText: 'Correct',
      explanation: 'B is the right option.',
    });
  });

  test('evaluates short answer answers using normalized aliases', () => {
    expect(
      evaluateAnswerAttempt({
        question: {
          question_type: 'short_answer',
          correct_answer: {
            value: 'Cell membrane',
            aliases: ['plasma membrane'],
          },
          explanation: 'The plasma membrane surrounds the cell.',
        },
        userAnswer: ' Plasma   Membrane ',
      })
    ).toEqual({
      isCorrect: true,
      score: 100,
      feedbackText: 'Correct',
      explanation: 'The plasma membrane surrounds the cell.',
    });
  });

  test('evaluates true/false answers deterministically and returns expected feedback', () => {
    expect(
      evaluateAnswerAttempt({
        question: {
          question_type: 'true_false',
          correct_answer: { value: 'False' },
          explanation: 'That statement is false for this topic.',
        },
        userAnswer: { value: 'true' },
      })
    ).toEqual({
      isCorrect: false,
      score: 0,
      feedbackText: 'Incorrect. Expected: False',
      explanation: 'That statement is false for this topic.',
    });
  });
});
