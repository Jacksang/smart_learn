const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), 'uploads', 'materials');
const STORAGE_VERSION = 1;

function normalizeProjectId(projectId) {
  const value = String(projectId || '').trim();

  if (!value) {
    throw new Error('projectId is required');
  }

  return value;
}

function sanitizeFileName(fileName) {
  const trimmed = String(fileName || '').trim();
  if (!trimmed) {
    throw new Error('originalFileName is required');
  }

  const normalized = trimmed.replace(/\\/g, '/').split('/').pop() || trimmed;
  const collapsedWhitespace = normalized.replace(/\s+/g, '-');
  const sanitized = collapsedWhitespace.replace(/[^a-zA-Z0-9._-]/g, '-');
  const deduped = sanitized.replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');

  return deduped || 'file';
}

function buildStoredFileName({ originalFileName, checksum }) {
  const safeName = sanitizeFileName(originalFileName);
  const extension = path.extname(safeName);
  const baseName = path.basename(safeName, extension) || 'file';
  const checksumPrefix = String(checksum || '').slice(0, 12) || 'unknown';

  return `${baseName}-${checksumPrefix}${extension.toLowerCase()}`;
}

function buildStorageKey({ projectId, originalFileName, checksum, storageVersion = STORAGE_VERSION }) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const storedFileName = buildStoredFileName({ originalFileName, checksum });

  return path.posix.join('project-materials', `v${storageVersion}`, normalizedProjectId, storedFileName);
}

function resolveStoragePath(storageKey, options = {}) {
  const storageRoot = options.storageRoot || DEFAULT_STORAGE_ROOT;
  return path.join(storageRoot, ...String(storageKey).split('/'));
}

function detectExtension(originalFileName, mimeType) {
  const explicitExtension = path.extname(sanitizeFileName(originalFileName));
  if (explicitExtension) {
    return explicitExtension.toLowerCase();
  }

  const mimeExtensions = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
  };

  return mimeExtensions[mimeType] || '';
}

function createContentChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function persistUploadedSourceFile({
  projectId,
  fileBuffer,
  originalFileName,
  mimeType,
  storageRoot,
  storedAt = new Date(),
}) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error('fileBuffer must be a non-empty Buffer');
  }

  const checksum = createContentChecksum(fileBuffer);
  const normalizedProjectId = normalizeProjectId(projectId);
  const normalizedOriginalFileName = sanitizeFileName(originalFileName);
  const storageKey = buildStorageKey({
    projectId: normalizedProjectId,
    originalFileName: normalizedOriginalFileName,
    checksum,
  });
  const absolutePath = resolveStoragePath(storageKey, { storageRoot });

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, fileBuffer);

  const fileStats = await fs.stat(absolutePath);
  const recordedAt = new Date(storedAt).toISOString();

  return {
    storageKey,
    absolutePath,
    metadata: {
      storageKey,
      storageVersion: STORAGE_VERSION,
      projectId: normalizedProjectId,
      originalFileName: normalizedOriginalFileName,
      storedFileName: path.basename(absolutePath),
      mimeType: mimeType || null,
      extension: detectExtension(normalizedOriginalFileName, mimeType),
      fileSizeBytes: fileStats.size,
      checksum,
      storedAt: recordedAt,
    },
  };
}

module.exports = {
  DEFAULT_STORAGE_ROOT,
  STORAGE_VERSION,
  sanitizeFileName,
  buildStoredFileName,
  buildStorageKey,
  resolveStoragePath,
  createContentChecksum,
  persistUploadedSourceFile,
};
