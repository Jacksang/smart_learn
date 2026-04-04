const express = require('express');
const { protect } = require('../users/middleware');
const { listQuestions, createQuestion } = require('./controller');

const router = express.Router();

router.get('/', protect, listQuestions);
router.post('/', protect, createQuestion);

module.exports = router;
