const express = require('express');
const { protect } = require('../users/middleware');
const upload = require('../../utils/fileUpload');
const {
  listOutlines,
  createOutline,
  uploadOutline,
  getOutlineById,
  getOutlineByProject,
} = require('./controller');

const router = express.Router();

router.get('/', protect, listOutlines);
router.get('/project/:projectId', protect, getOutlineByProject);
router.get('/:id', protect, getOutlineById);
router.post('/', protect, createOutline);
router.post('/upload', protect, upload.single('outline'), uploadOutline);

module.exports = router;
