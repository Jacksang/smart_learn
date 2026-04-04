const { listQuestions, createQuestion } = require('./repository');

exports.listQuestions = async (req, res, next) => {
  try {
    const questions = await listQuestions({
      userId: req.user.id,
      outlineId: req.query.outlineId,
      topic: req.query.topic,
    });
    return res.status(200).json({ questions });
  } catch (error) {
    return next(error);
  }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const question = await createQuestion({
      userId: req.user.id,
      outlineId: req.body.outline || null,
      topic: req.body.topic,
      type: req.body.type,
      difficulty: req.body.difficulty || 'medium',
      prompt: req.body.prompt,
      options: req.body.options || [],
      correctAnswer: req.body.correctAnswer,
      explanation: req.body.explanation || '',
      source: req.body.source || 'manual',
      tags: req.body.tags || [],
    });

    return res.status(201).json({ message: 'Question created', question });
  } catch (error) {
    return next(error);
  }
};
