const { findByIdForProjectAndUser } = require('../questions/repository');
const {
  listByQuestionForProjectAndUser,
  listRecentByProjectForUser,
} = require('./repository');

function normalizeString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

exports.listQuestionAnswers = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const questionId = normalizeString(req.params.questionId);

    if (!projectId || !questionId) {
      return res.status(400).json({ message: 'projectId and questionId are required' });
    }

    const question = await findByIdForProjectAndUser(questionId, projectId, req.user.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const answers = await listByQuestionForProjectAndUser({
      projectId,
      questionId,
      userId: req.user.id,
    });

    return res.status(200).json({
      projectId,
      questionId,
      answers,
    });
  } catch (error) {
    return next(error);
  }
};

exports.listProjectAnswerHistory = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const limit = parsePositiveInteger(req.query.limit ?? req.query.pageSize, 20);
    if (limit === null) {
      return res.status(400).json({ message: 'limit must be a positive integer' });
    }

    const answers = await listRecentByProjectForUser({
      projectId,
      userId: req.user.id,
      limit,
    });

    return res.status(200).json({
      projectId,
      limit,
      answers,
    });
  } catch (error) {
    return next(error);
  }
};

exports.submitProjectAnswer = async (req, res) =>
  res.status(501).json({
    message: 'Project-scoped answer submission scaffold is aligned to answer_attempts but not implemented yet.',
    detail: 'Complete D1.5.C to persist and evaluate answer attempts through this route.',
  });

exports.evaluateProjectAnswers = async (req, res) =>
  res.status(501).json({
    message: 'Project-scoped answer evaluation scaffold is not implemented yet.',
    detail: 'Complete D1.5.D to evaluate answer attempts through this route.',
  });
