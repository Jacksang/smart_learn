const express = require('express');
const { protect } = require('../users/middleware');
const {
  listQuestionAnswers,
  listProjectAnswerHistory,
  submitProjectAnswer,
  evaluateProjectAnswers,
} = require('./controller');

const router = express.Router({ mergeParams: true });

router.get('/projects/:projectId/questions/:questionId/answers', protect, listQuestionAnswers);
router.post('/projects/:projectId/questions/:questionId/answers', protect, submitProjectAnswer);
router.get('/projects/:projectId/answers/history', protect, listProjectAnswerHistory);
router.post('/projects/:projectId/answers/evaluate', protect, evaluateProjectAnswers);

module.exports = router;
