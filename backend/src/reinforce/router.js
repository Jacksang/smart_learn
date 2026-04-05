const express = require('express');
const { protect } = require('../users/middleware');
const {
  getProjectSessionRecoveryRecommendation,
  getProjectSessionRecoverySummary,
} = require('./controller');

const router = express.Router({ mergeParams: true });

router.post(
  '/projects/:projectId/sessions/:sessionId/reinforce/recommendation',
  protect,
  getProjectSessionRecoveryRecommendation
);
router.post(
  '/projects/:projectId/sessions/:sessionId/reinforce/summary',
  protect,
  getProjectSessionRecoverySummary
);

module.exports = router;
