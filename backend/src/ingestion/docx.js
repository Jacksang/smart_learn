const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);

const DEFAULT_MAX_TEXT_CHARS = 100000;
const EXTRACTOR_TYPE = 'docx-unzip';
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function normalizeExtractedText(text, maxTextChars = DEFAULT_MAX_TEXT_CHARS) {
  const normalized = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!normalized) {
    return {
      text: '',
      characterCount: 0,
      truncated: false,
    };
  }

  if (normalized.length <= maxTextChars) {
    return {
      text: normalized,
      characterCount: normalized.length,
      truncated: false,
    };
  }

  return {
    text: normalized.slice(0, maxTextChars).trimEnd(),
    characterCount: maxTextChars,
    truncated: true,
  };
}

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

function extractTextFromDocumentXml(documentXml) {
  if (!documentXml) {
    return '';
  }

  return decodeXmlEntities(String(documentXml).replace(/>\s+</g, '><'))
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<w:cr\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ');
}

function buildBaseMetadata({ fileBuffer, maxTextChars }) {
  return {
    extractorType: EXTRACTOR_TYPE,
    mimeType: DOCX_MIME_TYPE,
    fileSizeBytes: Buffer.isBuffer(fileBuffer) ? fileBuffer.length : 0,
    maxTextChars,
    truncated: false,
    characterCount: 0,
    documentXmlLength: 0,
  };
}

async function defaultUnzipDocumentXml(fileBuffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-learn-docx-'));
  const tempFilePath = path.join(tempDir, `${crypto.randomUUID()}.docx`);

  try {
    await fs.writeFile(tempFilePath, fileBuffer);
    const { stdout } = await execFileAsync('unzip', ['-p', tempFilePath, 'word/document.xml'], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    return stdout;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function extractDocxText({
  fileBuffer,
  maxTextChars = DEFAULT_MAX_TEXT_CHARS,
  unzipDocumentXml = defaultUnzipDocumentXml,
} = {}) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error('fileBuffer must be a non-empty Buffer');
  }

  const metadata = buildBaseMetadata({ fileBuffer, maxTextChars });

  try {
    const documentXml = await unzipDocumentXml(fileBuffer);
    const normalized = normalizeExtractedText(
      extractTextFromDocumentXml(documentXml),
      maxTextChars
    );

    return {
      status: normalized.text ? 'success' : 'empty',
      text: normalized.text,
      error: null,
      metadata: {
        ...metadata,
        documentXmlLength: Buffer.byteLength(String(documentXml || ''), 'utf8'),
        characterCount: normalized.characterCount,
        truncated: normalized.truncated,
      },
    };
  } catch (error) {
    return {
      status: 'failed',
      text: '',
      error: {
        code: 'DOCX_EXTRACT_FAILED',
        message: error.message,
      },
      metadata,
    };
  }
}

module.exports = {
  DEFAULT_MAX_TEXT_CHARS,
  DOCX_MIME_TYPE,
  EXTRACTOR_TYPE,
  normalizeExtractedText,
  decodeXmlEntities,
  extractTextFromDocumentXml,
  extractDocxText,
  defaultUnzipDocumentXml,
};
