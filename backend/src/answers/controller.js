const { findByIdForProjectAndUser } = require('../questions/repository');
const {
  listByQuestionForProjectAndUser,
  listRecentByProjectForUser,
  findNextAttemptNoByQuestionInProject,
  createAnswerAttempt,
} = require('./repository');
const { evaluateAnswerAttempt } = require('./service');

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

function normalizeSessionId(body = {}) {
  return normalizeString(body.sessionId ?? body.session_id);
}

function normalizeUserAnswer(body = {}) {
  if (Object.prototype.hasOwnProperty.call(body, 'userAnswer')) {
    return body.userAnswer;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'user_answer')) {
    return body.user_answer;
  }

  return undefined;
}

function mapAnswerAttemptToApi(answerAttempt, explanation) {
  return {
    id: answerAttempt.id,
    questionId: answerAttempt.question_id,
    projectId: answerAttempt.project_id,
    sessionId: answerAttempt.session_id,
    userAnswer: answerAttempt.user_answer,
    isCorrect: answerAttempt.is_correct,
    score: answerAttempt.score,
    feedbackText: answerAttempt.feedback_text,
    attemptNo: answerAttempt.attempt_no,
    answeredAt: answerAttempt.answered_at,
    explanation: explanation ?? undefined,
  };
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
      count: answers.length,
      answers,
    });
  } catch (error) {
    return next(error);
  }
};

exports.submitProjectAnswer = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const questionId = normalizeString(req.params.questionId);
    const bodyProjectId = normalizeString(req.body?.projectId ?? req.body?.project_id);
    const bodyQuestionId = normalizeString(req.body?.questionId ?? req.body?.question_id);
    const sessionId = normalizeSessionId(req.body);
    const userAnswer = normalizeUserAnswer(req.body);

    if (!projectId || !questionId) {
      return res.status(400).json({ message: 'projectId and questionId are required' });
    }

    if (bodyProjectId && bodyProjectId !== projectId) {
      return res.status(400).json({ message: 'projectId in body must match route projectId' });
    }

    if (bodyQuestionId && bodyQuestionId !== questionId) {
      return res.status(400).json({ message: 'questionId in body must match route questionId' });
    }

    if (userAnswer === undefined) {
      return res.status(400).json({ message: 'userAnswer is required' });
    }

    if ((req.body?.sessionId !== undefined || req.body?.session_id !== undefined) && !sessionId) {
      return res.status(400).json({ message: 'sessionId must be a non-empty string when provided' });
    }

    const question = await findByIdForProjectAndUser(questionId, projectId, req.user.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const evaluation = evaluateAnswerAttempt({
      question,
      userAnswer,
    });

    const attemptNo = await findNextAttemptNoByQuestionInProject({
      projectId,
      questionId,
    });

    const answerAttempt = await createAnswerAttempt({
      questionId,
      projectId,
      sessionId,
      userAnswer,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      feedbackText: evaluation.feedbackText,
      attemptNo,
    });

    return res.status(201).json({
      success: true,
      data: {
        answerAttempt: mapAnswerAttemptToApi(answerAttempt, evaluation.explanation),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.evaluateProjectAnswers = async (req, res) =>
  res.status(501).json({
    message: 'Project-scoped answer evaluation scaffold is not implemented yet.',
    detail: 'Complete D1.5.D to evaluate answer attempts through this route.',
  });
