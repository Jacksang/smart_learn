const Question = require('../../models/Question');

exports.listQuestions = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.outlineId) filter.outline = req.query.outlineId;
    if (req.query.topic) filter.topic = req.query.topic;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ questions });
  } catch (error) {
    return next(error);
  }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({
      user: req.user.id,
      outline: req.body.outline || null,
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
