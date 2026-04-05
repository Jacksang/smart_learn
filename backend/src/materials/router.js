const express = require('express');
const { protect } = require('../users/middleware');
const {
  listProjectMaterials,
  createProjectMaterial,
  createBaseKnowledgeMaterial,
  updateMaterial,
} = require('./controller');
const ingestionRouter = require('../ingestion/router');

const projectScopedRouter = express.Router({ mergeParams: true });
const topLevelRouter = express.Router();

projectScopedRouter.get('/', listProjectMaterials);
projectScopedRouter.use('/', ingestionRouter);
projectScopedRouter.post('/', createProjectMaterial);
projectScopedRouter.post('/base-knowledge', createBaseKnowledgeMaterial);

topLevelRouter.use(protect);
topLevelRouter.patch('/:materialId', updateMaterial);

topLevelRouter.projectScopedRouter = projectScopedRouter;

module.exports = topLevelRouter;
