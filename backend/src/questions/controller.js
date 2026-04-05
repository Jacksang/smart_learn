const {
  listByProjectForUser,
  findByIdForProjectAndUser,
  findMaxBatchNoForProjectOutlineItem,
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

function normalizeListProjectQuestionsQuery(query = {}) {
  return {
    outlineItemId: query.outlineItemId ?? query.outline_item_id,
    batchNo: query.batchNo ?? query.batch_no,
    status: query.status,
  };
}

function buildListProjectQuestionsFilters(query = {}) {
  const normalized = normalizeListProjectQuestionsQuery(query);
  const filters = {};

  if (normalized.outlineItemId !== undefined) {
    const outlineItemId = String(normalized.outlineItemId).trim();
    if (!outlineItemId) {
      return { error: { status: 400, body: { message: 'outlineItemId cannot be empty' } } };
    }
    filters.outlineItemId = outlineItemId;
  }

  if (normalized.batchNo !== undefined) {
    const batchNo = Number(normalized.batchNo);
    if (!Number.isInteger(batchNo) || batchNo <= 0) {
      return { error: { status: 400, body: { message: 'batchNo must be a positive integer' } } };
    }
    filters.batchNo = batchNo;
  }

  if (normalized.status !== undefined) {
    const status = String(normalized.status).trim();
    if (!status) {
      return { error: { status: 400, body: { message: 'status cannot be empty' } } };
    }
    filters.status = status;
  }

  return { filters };
}

exports.listProjectQuestions = async (req, res, next) => {
  try {
    const result = buildListProjectQuestionsFilters(req.query);
    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }

    const questions = await listByProjectForUser({
      projectId: req.params.projectId,
      userId: req.user.id,
      ...result.filters,
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

function buildGenerateQuestionsInput(req) {
  const input = normalizeGenerateQuestionsBody(req.body);

  if (!input.outlineItemId || !String(input.outlineItemId).trim()) {
    return { error: { status: 400, body: { message: 'outlineItemId is required' } } };
  }

  const parsedBatchSize = input.batchSize === undefined ? DEFAULT_BATCH_SIZE : Number(input.batchSize);
  if (!Number.isInteger(parsedBatchSize) || parsedBatchSize <= 0) {
    return { error: { status: 400, body: { message: 'batchSize must be a positive integer' } } };
  }

  return {
    input: {
      projectId: req.params.projectId,
      userId: req.user.id,
      outlineItemId: String(input.outlineItemId).trim(),
      batchSize: parsedBatchSize,
      difficultyLevel: input.difficultyLevel,
      questionTypes: input.questionTypes,
    },
  };
}

async function generateQuestionsResponse(req, res, next, resolveBatchNo) {
  try {
    const result = buildGenerateQuestionsInput(req);
    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }

    const batchNo = await resolveBatchNo(result.input);
    const generation = await generateQuestionBatch({
      ...result.input,
      batchNo,
    });

    const questions = await insertQuestionBatch(generation.questions);

    return res.status(201).json({
      message: 'Question batch generated',
      projectId: req.params.projectId,
      outlineItemId: generation.outlineItem.id,
      batchNo: questions[0]?.batch_no || batchNo,
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
}

exports.generateProjectQuestions = async (req, res, next) => generateQuestionsResponse(req, res, next, async () => 1);

exports.generateNextProjectQuestionBatch = async (req, res, next) => generateQuestionsResponse(
  req,
  res,
  next,
  async (input) => {
    const currentMaxBatchNo = await findMaxBatchNoForProjectOutlineItem(input.projectId, input.outlineItemId);
    return currentMaxBatchNo + 1;
  }
);

exports.normalizeGenerateQuestionsBody = normalizeGenerateQuestionsBody;
exports.normalizeListProjectQuestionsQuery = normalizeListProjectQuestionsQuery;
exports.buildListProjectQuestionsFilters = buildListProjectQuestionsFilters;
exports.buildGenerateQuestionsInput = buildGenerateQuestionsInput;
