const express = require('express');
const { protect } = require('../users/middleware');
const {
  getProjectProgress,
  getTopicProgress,
  getProjectWeakAreas,
  refreshProjectProgress,
} = require('./controller');

const router = express.Router({ mergeParams: true });

router.get('/projects/:projectId/progress', protect, getProjectProgress);
router.get('/projects/:projectId/progress/topics/:itemId', protect, getTopicProgress);
router.get('/projects/:projectId/progress/weak-areas', protect, getProjectWeakAreas);
router.post('/projects/:projectId/progress/refresh', protect, refreshProjectProgress);

module.exports = router;
