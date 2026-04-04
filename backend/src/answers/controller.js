const Answer = require('../../models/Answer');
const Question = require('../../models/Question');

function normalize(value) {
  if (Array.isArray(value)) return value.map(String).sort();
  if (typeof value === 'boolean') return value;
  return String(value).trim();
}

exports.listAnswers = async (req, res, next) => {
  try {
    const answers = await Answer.find({ user: req.user.id })
      .populate('question', 'topic type prompt')
      .sort({ createdAt: -1 });

    return res.status(200).json({ answers });
  } catch (error) {
    return next(error);
  }
};

exports.submitAnswer = async (req, res, next) => {
  try {
    const question = await Question.findById(req.body.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const submitted = normalize(req.body.submittedAnswer);
    const expected = normalize(question.correctAnswer);
    const isCorrect = JSON.stringify(submitted) === JSON.stringify(expected);

    const previousAttempts = await Answer.countDocuments({
      user: req.user.id,
      question: question._id,
    });

    const answer = await Answer.create({
      user: req.user.id,
      question: question._id,
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
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  } catch (error) {
    return next(error);
  }
};
