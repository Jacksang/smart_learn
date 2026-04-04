const express = require('express');
const { protect } = require('../users/middleware');
const { listProjectQuestions, getProjectQuestion } = require('./controller');

const projectScopedRouter = express.Router({ mergeParams: true });
const topLevelRouter = express.Router();

projectScopedRouter.get('/', listProjectQuestions);
projectScopedRouter.get('/:questionId', getProjectQuestion);

topLevelRouter.use(protect);
topLevelRouter.projectScopedRouter = projectScopedRouter;

module.exports = topLevelRouter;
