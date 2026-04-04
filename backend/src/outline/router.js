const express = require('express');
const { protect } = require('../users/middleware');
const { listOutlines, createOutline } = require('./controller');

const router = express.Router();

router.get('/', protect, listOutlines);
router.post('/', protect, createOutline);

module.exports = router;
