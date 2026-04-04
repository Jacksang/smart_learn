const {
  listByProjectForUser,
  findByIdForProjectAndUser,
  insertQuestionBatch,
} = require('./repository');
const { generateQuestionBatch, DEFAULT_BATCH_SIZE } = require('./service');

function normalizeGenerateQuestionsBody(body = {}) {
  return {
    outlineItemId: body.outlineItemId ?? body.outline_item_id,
    batchSize: body.batchSize ?? body.batch_size,
    difficultyLevel: body.difficultyLevel ?? body.difficulty_level,
    questionTypes: body.questionTypes ?? body.question_types,
  };
}

exports.listProjectQuestions = async (req, res, next) => {
  try {
    const questions = await listByProjectForUser({
      projectId: req.params.projectId,
      userId: req.user.id,
      outlineItemId: req.query.outlineItemId,
      batchNo: req.query.batchNo,
      status: req.query.status,
    });

    return res.status(200).json({ questions });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectQuestion = async (req, res, next) => {
  try {
    const question = await findByIdForProjectAndUser(
      req.params.questionId,
      req.params.projectId,
      req.user.id
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    return res.status(200).json({ question });
  } catch (error) {
    return next(error);
  }
};

exports.generateProjectQuestions = async (req, res, next) => {
  try {
    const input = normalizeGenerateQuestionsBody(req.body);

    if (!input.outlineItemId || !String(input.outlineItemId).trim()) {
      return res.status(400).json({ message: 'outlineItemId is required' });
    }

    const parsedBatchSize = input.batchSize === undefined ? DEFAULT_BATCH_SIZE : Number(input.batchSize);
    if (!Number.isInteger(parsedBatchSize) || parsedBatchSize <= 0) {
      return res.status(400).json({ message: 'batchSize must be a positive integer' });
    }

    const generation = await generateQuestionBatch({
      projectId: req.params.projectId,
      userId: req.user.id,
      outlineItemId: String(input.outlineItemId).trim(),
      batchSize: parsedBatchSize,
      difficultyLevel: input.difficultyLevel,
      questionTypes: input.questionTypes,
      batchNo: 1,
    });

    const questions = await insertQuestionBatch(generation.questions);

    return res.status(201).json({
      message: 'Question batch generated',
      projectId: req.params.projectId,
      outlineItemId: generation.outlineItem.id,
      batchNo: questions[0]?.batch_no || 1,
      batchSize: questions.length,
      questions,
    });
  } catch (error) {
    if (error.code === 'INVALID_DIFFICULTY_LEVEL' || error.code === 'INVALID_QUESTION_TYPES') {
      return res.status(error.status || 422).json({
        message: error.message,
        errors: error.details || [],
      });
    }

    if (error.code === 'PROJECT_NOT_FOUND' || error.code === 'OUTLINE_NOT_FOUND' || error.code === 'OUTLINE_ITEM_NOT_FOUND') {
      return res.status(error.status || 404).json({ message: error.message });
    }

    return next(error);
  }
};

exports.normalizeGenerateQuestionsBody = normalizeGenerateQuestionsBody;
