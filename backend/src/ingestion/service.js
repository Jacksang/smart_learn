const path = require('path');

const {
  createMaterialForUser,
  updateMaterialForUser,
} = require('../materials/repository');
const {
  prepareMaterialCreateInput,
  prepareMaterialUpdateInput,
  decorateMaterialWithWeight,
} = require('../materials/service');
const { refreshOutline } = require('../outline/service');

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const { parse: csvParse } = require('./csv');
const { parse: excelParse } = require('./excel');
const { parse: transcriptParse } = require('./transcript');
const { parse: audioParse } = require('./audio');
const { parse: videoParse } = require('./video');

function validateStoredFile(storedFile) {
  const metadata = storedFile?.metadata;

  if (!metadata?.storageKey) {
    throw new Error('storedFile.metadata.storageKey is required');
  }

  if (!metadata?.projectId) {
    throw new Error('storedFile.metadata.projectId is required');
  }

  if (!metadata?.originalFileName) {
    throw new Error('storedFile.metadata.originalFileName is required');
  }

  return metadata;
}

function stripFileExtension(fileName) {
  const extension = path.extname(String(fileName || ''));
  return path.basename(String(fileName || ''), extension).trim() || String(fileName || '').trim();
}

function inferMaterialType({ mimeType, originalFileName } = {}) {
  const normalizedMimeType = String(mimeType || '').toLowerCase();
  const extension = path.extname(String(originalFileName || '')).toLowerCase();

  // PDF files
  if (normalizedMimeType === 'application/pdf' || extension === '.pdf') {
    return 'pdf';
  }

  // DOCX files
  if (normalizedMimeType === DOCX_MIME_TYPE || extension === '.docx') {
    return 'docx';
  }

  // Image files
  if (normalizedMimeType.startsWith('image/')) {
    return 'image';
  }

  // CSV files
  if (normalizedMimeType === 'text/csv' || extension === '.csv') {
    return 'csv';
  }

  // Excel files
  if (normalizedMimeType === 'application/vnd.ms-excel' || 
      normalizedMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      extension === '.xls' || extension === '.xlsx') {
    return 'excel';
  }

  // Subtitle files
  if (extension === '.srt' || extension === '.vtt') {
    return 'subtitle';
  }

  // Audio files
  if (normalizedMimeType.startsWith('audio/') || 
      extension === '.mp3' || extension === '.wav' || 
      extension === '.m4a' || extension === '.flac' || extension === '.ogg') {
    return 'audio';
  }

  // Video files
  if (normalizedMimeType.startsWith('video/') || 
      extension === '.mp4' || extension === '.avi' || 
      extension === '.mov' || extension === '.mkv') {
    return 'video';
  }

  // Default to file type
  return 'file';
}

function normalizeExtractedText(extractionResult) {
  if (typeof extractionResult?.text !== 'string') {
    return null;
  }

  const trimmed = extractionResult.text.trim();
  return trimmed || null;
}

function buildIngestionMaterialPayload({ projectId, title, weight, storedFile, extractionResult } = {}) {
  const fileMetadata = validateStoredFile(storedFile);
  const resolvedProjectId = projectId || fileMetadata.projectId;

  return {
    projectId: resolvedProjectId,
    sourceKind: 'upload',
    materialType: inferMaterialType({
      mimeType: fileMetadata.mimeType,
      originalFileName: fileMetadata.originalFileName,
    }),
    title: title || stripFileExtension(fileMetadata.originalFileName),
    originalFileName: fileMetadata.originalFileName,
    mimeType: fileMetadata.mimeType || null,
    storagePath: fileMetadata.storageKey,
    rawText: null,
    extractedText: normalizeExtractedText(extractionResult),
    weight,
    isActive: true,
    sourceVersion: 1,
  };
}

function buildIngestionResult({ operation, storedFile, extractionResult }) {
  return {
    operation,
    status: extractionResult?.status || 'unknown',
    error: extractionResult?.error || null,
    storedFile: storedFile.metadata,
    extraction: {
      textLength: typeof extractionResult?.text === 'string' ? extractionResult.text.length : 0,
      metadata: extractionResult?.metadata || {},
    },
  };
}

async function extractFileContent(filePath, mimeType) {
  const extension = path.extname(String(filePath || '')).toLowerCase();
  const normalizedMimeType = String(mimeType || '').toLowerCase();

  // CSV files
  if (normalizedMimeType === 'text/csv' || extension === '.csv') {
    return await csvParse(filePath);
  }

  // Excel files
  if (normalizedMimeType === 'application/vnd.ms-excel' || 
      normalizedMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      extension === '.xls' || extension === '.xlsx') {
    return await excelParse(filePath);
  }

  // Subtitle files (SRT, VTT) and text transcripts
  if (extension === '.srt' || extension === '.vtt' || extension === '.txt') {
    return await transcriptParse(filePath);
  }

  // Audio files (mp3, wav, m4a, flac, ogg)
  if (normalizedMimeType.startsWith('audio/') || 
      extension === '.mp3' || extension === '.wav' || 
      extension === '.m4a' || extension === '.flac' || extension === '.ogg') {
    return await audioParse(filePath);
  }

  // Video files (mp4, avi, mov, mkv)
  if (normalizedMimeType.startsWith('video/') || 
      extension === '.mp4' || extension === '.avi' || 
      extension === '.mov' || extension === '.mkv') {
    return await videoParse(filePath);
  }

  throw new Error(`Unsupported file type: ${mimeType || extension}`);
}

async function ingestExtractedFileAsMaterial({
  projectId,
  userId,
  materialId,
  title,
  weight,
  storedFile,
  extractionResult = {},
} = {}) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const materialPayload = buildIngestionMaterialPayload({
    projectId,
    title,
    weight,
    storedFile,
    extractionResult,
  });

  let material;
  let operation;

  if (materialId) {
    operation = 'updated';
    material = await updateMaterialForUser(
      materialId,
      userId,
      prepareMaterialUpdateInput({
        source_kind: materialPayload.sourceKind,
        material_type: materialPayload.materialType,
        title: materialPayload.title,
        original_file_name: materialPayload.originalFileName,
        mime_type: materialPayload.mimeType,
        storage_path: materialPayload.storagePath,
        raw_text: materialPayload.rawText,
        extracted_text: materialPayload.extractedText,
        weight: materialPayload.weight,
        is_active: materialPayload.isActive,
        source_version: materialPayload.sourceVersion,
      })
    );
  } else {
    operation = 'created';
    material = await createMaterialForUser(
      prepareMaterialCreateInput({
        ...materialPayload,
        userId,
      })
    );
  }

  if (!material) {
    return {
      material: null,
      ingestion: buildIngestionResult({ operation, storedFile, extractionResult }),
    };
  }

  await refreshOutline({
    projectId: material.project_id,
    userId,
    trigger: materialId ? 'material_updated' : 'material_created',
    materialId: material.id,
  });

  return {
    material: decorateMaterialWithWeight(material),
    ingestion: buildIngestionResult({ operation, storedFile, extractionResult }),
  };
}

module.exports = {
  DOCX_MIME_TYPE,
  stripFileExtension,
  inferMaterialType,
  buildIngestionMaterialPayload,
  ingestExtractedFileAsMaterial,
};
