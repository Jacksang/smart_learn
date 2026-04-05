const express = require('express');
const { protect } = require('../users/middleware');
const {
  listProjectQuestions,
  getProjectQuestion,
  generateProjectQuestions,
  generateNextProjectQuestionBatch,
} = require('./controller');

const projectScopedRouter = express.Router({ mergeParams: true });
const topLevelRouter = express.Router();

projectScopedRouter.get('/', listProjectQuestions);
projectScopedRouter.post('/generate', generateProjectQuestions);
projectScopedRouter.post('/generate-next-batch', generateNextProjectQuestionBatch);
projectScopedRouter.get('/:questionId', getProjectQuestion);

topLevelRouter.use(protect);
topLevelRouter.projectScopedRouter = projectScopedRouter;

module.exports = topLevelRouter;
