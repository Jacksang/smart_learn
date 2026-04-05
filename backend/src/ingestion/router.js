const express = require('express');
const multer = require('multer');
const { uploadProjectMaterial } = require('./controller');
const { DOCX_MIME_TYPE } = require('./docx');

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  DOCX_MIME_TYPE,
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_UPLOAD_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
      return cb(null, true);
    }

    return cb(new Error('Unsupported file type'));
  },
});

const router = express.Router({ mergeParams: true });

router.post('/upload', upload.single('file'), uploadProjectMaterial);

module.exports = router;
module.exports.MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_BYTES;
module.exports.SUPPORTED_UPLOAD_MIME_TYPES = SUPPORTED_UPLOAD_MIME_TYPES;
