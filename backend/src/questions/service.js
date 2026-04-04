const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_BATCH_NO = 1;
const DEFAULT_DIFFICULTY_LEVEL = 'medium';
const DEFAULT_QUESTION_TYPES = ['multiple_choice'];
const VALID_DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const VALID_QUESTION_TYPES = ['multiple_choice', 'short_answer', 'true_false'];

function createServiceError(message, code, status, details) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toSentenceCase(value) {
  const text = normalizeWhitespace(value);
  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildOutlineItemMap(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function buildOutlinePath(item, itemMap) {
  const path = [];
  let current = item;

  while (current) {
    path.unshift(current.title);
    current = current.parent_item_id ? itemMap.get(current.parent_item_id) : null;
  }

  return path;
}

function buildContextSummary(item, outlinePath) {
  const content = normalizeWhitespace(item.content);
  const base = content || `Study focus: ${outlinePath.join(' > ')}`;
  return base.slice(0, 280);
}

function extractKeyPhrases(item, outlinePath) {
  const titleWords = normalizeWhitespace(item.title)
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);

  const contentWords = normalizeWhitespace(item.content)
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 5);

  const pathWords = outlinePath
    .flatMap((segment) => normalizeWhitespace(segment).split(/[^A-Za-z0-9]+/))
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);

  const unique = [];
  [...titleWords, ...contentWords, ...pathWords].forEach((word) => {
    const normalized = word.toLowerCase();
    if (!unique.some((entry) => entry.toLowerCase() === normalized)) {
      unique.push(word);
    }
  });

  return unique.slice(0, 4);
}

function validateQuestionTypes(questionTypes) {
  if (questionTypes === undefined) {
    return DEFAULT_QUESTION_TYPES;
  }

  if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
    throw createServiceError(
      'Question types are invalid',
      'INVALID_QUESTION_TYPES',
      422,
      [{ field: 'questionTypes', issue: 'must be a non-empty array' }]
    );
  }

  const invalidTypes = questionTypes.filter((type) => !VALID_QUESTION_TYPES.includes(type));
  if (invalidTypes.length > 0) {
    throw createServiceError(
      'Question types are invalid',
      'INVALID_QUESTION_TYPES',
      422,
      invalidTypes.map((type) => ({ field: 'questionTypes', issue: `unsupported type: ${type}` }))
    );
  }

  return questionTypes;
}

function validateDifficultyLevel(difficultyLevel) {
  if (difficultyLevel === undefined) {
    return DEFAULT_DIFFICULTY_LEVEL;
  }

  if (!VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
    throw createServiceError(
      'Difficulty level is invalid',
      'INVALID_DIFFICULTY_LEVEL',
      422,
      [{ field: 'difficultyLevel', issue: `must be one of: ${VALID_DIFFICULTY_LEVELS.join(', ')}` }]
    );
  }

  return difficultyLevel;
}

async function loadGenerationContext(payload, deps = {}) {
  const projectsRepository = deps.projectsRepository || require('../projects/repository');
  const outlineRepository = deps.outlineRepository || require('../outline/repository');

  const project = await projectsRepository.findByIdForUser(payload.projectId, payload.userId);
  if (!project) {
    throw createServiceError('Learning project not found', 'PROJECT_NOT_FOUND', 404);
  }

  const outline = await outlineRepository.findCurrentByProjectForUser(payload.projectId, payload.userId);
  if (!outline) {
    throw createServiceError('Current outline not found for project', 'OUTLINE_NOT_FOUND', 404);
  }

  const outlineItems = await outlineRepository.findItemsByOutlineId(outline.id);
  const itemMap = buildOutlineItemMap(outlineItems);
  const outlineItem = itemMap.get(payload.outlineItemId);

  if (!outlineItem) {
    throw createServiceError('Outline item not found in current outline', 'OUTLINE_ITEM_NOT_FOUND', 404);
  }

  return {
    project,
    outline,
    outlineItem,
    outlineItems,
    outlinePath: buildOutlinePath(outlineItem, itemMap),
  };
}

function buildMultipleChoiceQuestion(context, difficultyLevel, positionInBatch) {
  const keyPhrases = extractKeyPhrases(context.outlineItem, context.outlinePath);
  const focus = keyPhrases[0] || context.outlineItem.title;
  const distractors = [
    keyPhrases[1] || context.project.subject || 'unrelated detail',
    keyPhrases[2] || context.outline.title,
    keyPhrases[3] || 'background concept',
  ].map(toSentenceCase);

  const correctOption = toSentenceCase(focus);
  const options = [correctOption, ...distractors]
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .slice(0, 4);

  while (options.length < 4) {
    options.push(`Reference point ${options.length}`);
  }

  return {
    question_type: 'multiple_choice',
    difficulty_level: difficultyLevel,
    prompt: `Question ${positionInBatch}: Which concept best matches ${context.outlinePath.join(' > ')}?`,
    options,
    correct_answer: { value: options[0] },
    explanation: `${options[0]} is the best match based on: ${buildContextSummary(context.outlineItem, context.outlinePath)}`,
  };
}

function buildShortAnswerQuestion(context, difficultyLevel, positionInBatch) {
  const summary = buildContextSummary(context.outlineItem, context.outlinePath);
  return {
    question_type: 'short_answer',
    difficulty_level: difficultyLevel,
    prompt: `Question ${positionInBatch}: In 1-2 sentences, explain the key idea of ${context.outlineItem.title}.`,
    options: null,
    correct_answer: {
      value: toSentenceCase(context.outlineItem.title),
      rubric: summary,
    },
    explanation: `A strong answer should reference: ${summary}`,
  };
}

function buildTrueFalseQuestion(context, difficultyLevel, positionInBatch) {
  const summary = buildContextSummary(context.outlineItem, context.outlinePath);
  return {
    question_type: 'true_false',
    difficulty_level: difficultyLevel,
    prompt: `Question ${positionInBatch}: True or false? ${toSentenceCase(context.outlineItem.title)} is part of ${context.outlinePath.join(' > ')}.`,
    options: ['True', 'False'],
    correct_answer: { value: 'True' },
    explanation: `True — the current outline path is ${context.outlinePath.join(' > ')}. Context: ${summary}`,
  };
}

function buildQuestionByType(type, context, difficultyLevel, positionInBatch) {
  if (type === 'short_answer') {
    return buildShortAnswerQuestion(context, difficultyLevel, positionInBatch);
  }

  if (type === 'true_false') {
    return buildTrueFalseQuestion(context, difficultyLevel, positionInBatch);
  }

  return buildMultipleChoiceQuestion(context, difficultyLevel, positionInBatch);
}

async function generateQuestionBatch(payload, deps = {}) {
  const difficultyLevel = validateDifficultyLevel(payload.difficultyLevel);
  const questionTypes = validateQuestionTypes(payload.questionTypes);
  const batchSize = payload.batchSize || DEFAULT_BATCH_SIZE;
  const batchNo = payload.batchNo || DEFAULT_BATCH_NO;

  const context = await loadGenerationContext(payload, deps);

  const questions = Array.from({ length: batchSize }, (_, index) => {
    const positionInBatch = index + 1;
    const type = questionTypes[index % questionTypes.length];
    const generated = buildQuestionByType(type, context, difficultyLevel, positionInBatch);

    return {
      project_id: context.project.id,
      outline_item_id: context.outlineItem.id,
      batch_no: batchNo,
      position_in_batch: positionInBatch,
      question_type: generated.question_type,
      difficulty_level: generated.difficulty_level,
      prompt: generated.prompt,
      options: generated.options,
      correct_answer: generated.correct_answer,
      explanation: generated.explanation,
      generation_source: 'mock_outline_mvp',
      status: 'active',
    };
  });

  return {
    project: context.project,
    outline: context.outline,
    outlineItem: context.outlineItem,
    outlinePath: context.outlinePath,
    questions,
  };
}

module.exports = {
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_NO,
  DEFAULT_DIFFICULTY_LEVEL,
  DEFAULT_QUESTION_TYPES,
  VALID_DIFFICULTY_LEVELS,
  VALID_QUESTION_TYPES,
  normalizeWhitespace,
  buildOutlineItemMap,
  buildOutlinePath,
  buildContextSummary,
  extractKeyPhrases,
  validateQuestionTypes,
  validateDifficultyLevel,
  loadGenerationContext,
  generateQuestionBatch,
};
