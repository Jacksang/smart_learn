const express = require('express');
const { protect } = require('../users/middleware');
const {
  createProjectSession,
  getCurrentProjectSession,
  updateProjectSessionState,
  pauseProjectSession,
  resumeProjectSession,
  updateProjectSessionProgress,
  endProjectSession,
  getProjectSessionDetails,
  getProjectSessionProgress,
  switchProjectSessionMode,
  getProjectSessionModeHistory,
} = require('./controller');

const router = express.Router({ mergeParams: true });

// Create a new session
router.post('/projects/:projectId/sessions', protect, createProjectSession);

// Get current active session
router.get('/projects/:projectId/sessions/current', protect, getCurrentProjectSession);

// Session lifecycle actions
router.post('/projects/:projectId/sessions/:sessionId/pause', protect, pauseProjectSession);
router.post('/projects/:projectId/sessions/:sessionId/resume', protect, resumeProjectSession);
router.post('/projects/:projectId/sessions/:sessionId/end', protect, endProjectSession);

// Session details
router.get('/projects/:projectId/sessions/:sessionId', protect, getProjectSessionDetails);

// Session progress
router.get('/projects/:projectId/sessions/:sessionId/progress', protect, getProjectSessionProgress);
router.patch('/projects/:projectId/sessions/:sessionId/progress', protect, updateProjectSessionProgress);

// Session mode
router.patch('/projects/:projectId/sessions/:sessionId/mode', protect, switchProjectSessionMode);
router.get('/projects/:projectId/sessions/:sessionId/mode-history', protect, getProjectSessionModeHistory);

// Session state update (existing route, path specialized to avoid ambiguity with new PATCH routes)
router.patch('/projects/:projectId/sessions/:sessionId/state', protect, updateProjectSessionState);

module.exports = router;
