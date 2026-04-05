const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const execFileAsync = promisify(execFile);

const DEFAULT_MAX_TEXT_CHARS = 100000;
const DEFAULT_OCR_TIMEOUT_MS = 15000;
const EXTRACTOR_TYPE = 'tesseract-cli';
const DEFAULT_LANGUAGE = 'eng';

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

function extensionForMimeType(mimeType) {
  const mimeExtensions = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
  };

  return mimeExtensions[mimeType] || '.img';
}

function buildBaseMetadata({ fileBuffer, mimeType, maxTextChars, language, timeoutMs }) {
  return {
    extractorType: EXTRACTOR_TYPE,
    mimeType: mimeType || null,
    fileSizeBytes: Buffer.isBuffer(fileBuffer) ? fileBuffer.length : 0,
    maxTextChars,
    language,
    timeoutMs,
    truncated: false,
    characterCount: 0,
    confidence: null,
  };
}

function parseConfidence(value) {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

async function defaultPerformOcr({ fileBuffer, mimeType, language = DEFAULT_LANGUAGE, timeoutMs = DEFAULT_OCR_TIMEOUT_MS }) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-learn-image-ocr-'));
  const extension = extensionForMimeType(mimeType);
  const tempFilePath = path.join(tempDir, `${crypto.randomUUID()}${extension}`);

  try {
    await fs.writeFile(tempFilePath, fileBuffer);
    const { stdout } = await execFileAsync(
      'tesseract',
      [tempFilePath, 'stdout', '--dpi', '300', '-l', language, 'tsv'],
      {
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const rows = String(stdout || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (rows.length <= 1) {
      return { text: '', confidence: null };
    }

    const header = rows.shift().split('\t');
    const textIndex = header.indexOf('text');
    const confidenceIndex = header.indexOf('conf');

    const words = [];
    const confidences = [];

    rows.forEach((row) => {
      const columns = row.split('\t');
      const word = textIndex >= 0 ? String(columns[textIndex] || '').trim() : '';
      const confidence = confidenceIndex >= 0 ? parseConfidence(columns[confidenceIndex]) : null;

      if (word) {
        words.push(word);
      }

      if (confidence !== null && confidence >= 0) {
        confidences.push(confidence);
      }
    });

    const averageConfidence = confidences.length
      ? Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(2))
      : null;

    return {
      text: words.join(' '),
      confidence: averageConfidence,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function extractImageOcrText({
  fileBuffer,
  mimeType,
  maxTextChars = DEFAULT_MAX_TEXT_CHARS,
  language = DEFAULT_LANGUAGE,
  timeoutMs = DEFAULT_OCR_TIMEOUT_MS,
  performOcr = defaultPerformOcr,
} = {}) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error('fileBuffer must be a non-empty Buffer');
  }

  const metadata = buildBaseMetadata({ fileBuffer, mimeType, maxTextChars, language, timeoutMs });

  try {
    const ocrResult = await performOcr({
      fileBuffer,
      mimeType,
      language,
      timeoutMs,
    });
    const normalized = normalizeExtractedText(ocrResult?.text, maxTextChars);

    return {
      status: normalized.text ? 'success' : 'empty',
      text: normalized.text,
      error: null,
      metadata: {
        ...metadata,
        confidence: parseConfidence(ocrResult?.confidence),
        characterCount: normalized.characterCount,
        truncated: normalized.truncated,
      },
    };
  } catch (error) {
    return {
      status: 'failed',
      text: '',
      error: {
        code: 'IMAGE_OCR_FAILED',
        message: error.message,
      },
      metadata,
    };
  }
}

module.exports = {
  DEFAULT_MAX_TEXT_CHARS,
  DEFAULT_OCR_TIMEOUT_MS,
  DEFAULT_LANGUAGE,
  EXTRACTOR_TYPE,
  normalizeExtractedText,
  extensionForMimeType,
  parseConfidence,
  defaultPerformOcr,
  extractImageOcrText,
};
