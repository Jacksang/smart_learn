const express = require('express');
const { protect } = require('../users/middleware');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
} = require('./controller');
const materialRouter = require('../materials/router');
const projectMaterialRouter = materialRouter.projectScopedRouter;

const router = express.Router();

router.use(protect);
router.get('/', listProjects);
router.post('/', createProject);
router.get('/:projectId', getProject);
router.patch('/:projectId', updateProject);
router.use('/:projectId/materials', projectMaterialRouter);

module.exports = router;
