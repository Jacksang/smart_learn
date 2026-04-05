const { persistUploadedSourceFile } = require('./storage');
const { extractPdfText } = require('./pdf');
const { extractDocxText, DOCX_MIME_TYPE } = require('./docx');
const { extractImageOcrText } = require('./image-ocr');
const { ingestExtractedFileAsMaterial } = require('./service');

const IMAGE_MIME_PREFIX = 'image/';

function normalizeProjectId(projectId) {
  const value = String(projectId || '').trim();

  if (!value) {
    return null;
  }

  return value;
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed || undefined;
}

function selectExtractor(file = {}) {
  const mimeType = String(file.mimetype || '').toLowerCase();

  if (mimeType === 'application/pdf') {
    return extractPdfText;
  }

  if (mimeType === DOCX_MIME_TYPE) {
    return extractDocxText;
  }

  if (mimeType.startsWith(IMAGE_MIME_PREFIX)) {
    return (options) => extractImageOcrText({
      ...options,
      mimeType,
    });
  }

  return null;
}

exports.uploadProjectMaterial = async (req, res, next) => {
  try {
    const projectId = normalizeProjectId(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    if (!req.file || !Buffer.isBuffer(req.file.buffer) || req.file.buffer.length === 0) {
      return res.status(400).json({ message: 'file is required' });
    }

    const extractor = selectExtractor(req.file);
    if (!extractor) {
      return res.status(400).json({ message: 'Unsupported file type' });
    }

    const storedFile = await persistUploadedSourceFile({
      projectId,
      fileBuffer: req.file.buffer,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    const extractionResult = await extractor({
      fileBuffer: req.file.buffer,
    });

    const result = await ingestExtractedFileAsMaterial({
      projectId,
      userId: req.user.id,
      materialId: normalizeOptionalString(req.body.materialId ?? req.body.material_id),
      title: normalizeOptionalString(req.body.title),
      weight: req.body.weight,
      storedFile,
      extractionResult,
    });

    if (!result.material) {
      return res.status(404).json({
        message: 'Project not found',
        ingestion: result.ingestion,
      });
    }

    return res.status(201).json({
      message: 'Material uploaded',
      material: result.material,
      ingestion: result.ingestion,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadProjectMaterial: exports.uploadProjectMaterial,
  normalizeProjectId,
  normalizeOptionalString,
  selectExtractor,
};
