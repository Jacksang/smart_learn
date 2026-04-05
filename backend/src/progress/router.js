const express = require('express');
const { protect } = require('../users/middleware');
const { refreshProjectProgress } = require('./controller');

const router = express.Router({ mergeParams: true });

router.post('/projects/:projectId/progress/refresh', protect, refreshProjectProgress);

module.exports = router;
