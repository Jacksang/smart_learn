const express = require('express');
const { protect } = require('../users/middleware');
const {
  createDeferredQuestion,
  listDeferredQuestions,
  updateDeferredQuestionState,
} = require('./controller');

const router = express.Router({ mergeParams: true });

router.post('/projects/:projectId/deferred-questions', protect, createDeferredQuestion);
router.get('/projects/:projectId/deferred-questions', protect, listDeferredQuestions);
router.patch(
  '/projects/:projectId/deferred-questions/:deferredQuestionId',
  protect,
  updateDeferredQuestionState,
);

module.exports = router;
