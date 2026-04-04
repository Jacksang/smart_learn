const express = require('express');
const { protect } = require('../users/middleware');
const upload = require('../../utils/fileUpload');
const { listOutlines, createOutline, uploadOutline } = require('./controller');

const router = express.Router();

router.get('/', protect, listOutlines);
router.post('/', protect, createOutline);
router.post('/upload', protect, upload.single('outline'), uploadOutline);

module.exports = router;
