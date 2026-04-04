const { findById } = require('../questions/repository');
const { listAnswers, countAttempts, createAnswer } = require('./repository');

function normalize(value) {
  if (Array.isArray(value)) return value.map(String).sort();
  if (typeof value === 'boolean') return value;
  return String(value).trim();
}

exports.listAnswers = async (req, res, next) => {
  try {
    const answers = await listAnswers(req.user.id);

    return res.status(200).json({ answers });
  } catch (error) {
    return next(error);
  }
};

exports.submitAnswer = async (req, res, next) => {
  try {
    const question = await findById(req.body.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const submitted = normalize(req.body.submittedAnswer);
    const expected = normalize(question.correct_answer);
    const isCorrect = JSON.stringify(submitted) === JSON.stringify(expected);

    const previousAttempts = await countAttempts(req.user.id, question.id);

    const answer = await createAnswer({
      userId: req.user.id,
      questionId: question.id,
      submittedAnswer: req.body.submittedAnswer,
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect
        ? 'Correct answer'
        : question.explanation || 'Incorrect answer. Review the related topic and try again.',
      attemptNumber: previousAttempts + 1,
    });

    return res.status(201).json({
      message: 'Answer submitted',
      answer,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
    });
  } catch (error) {
    return next(error);
  }
};
