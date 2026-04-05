const express = require('express');
const { protect } = require('../users/middleware');
const {
  createProjectSession,
  getCurrentProjectSession,
  updateProjectSessionState,
} = require('./controller');

const router = express.Router({ mergeParams: true });

router.post('/projects/:projectId/sessions', protect, createProjectSession);
router.get('/projects/:projectId/sessions/current', protect, getCurrentProjectSession);
router.patch('/projects/:projectId/sessions/:sessionId', protect, updateProjectSessionState);

module.exports = router;
