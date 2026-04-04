const express = require('express');
const { protect } = require('../users/middleware');
const { listAnswers, submitAnswer } = require('./controller');

const router = express.Router();

router.get('/', protect, listAnswers);
router.post('/', protect, submitAnswer);

module.exports = router;
