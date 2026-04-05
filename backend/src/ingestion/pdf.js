const pdfParse = require('pdf-parse');

const DEFAULT_MAX_TEXT_CHARS = 100000;
const EXTRACTOR_TYPE = 'pdf-parse';

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

function buildBaseMetadata({ fileBuffer, maxTextChars }) {
  return {
    extractorType: EXTRACTOR_TYPE,
    mimeType: 'application/pdf',
    fileSizeBytes: Buffer.isBuffer(fileBuffer) ? fileBuffer.length : 0,
    maxTextChars,
    pageCount: null,
    truncated: false,
    characterCount: 0,
  };
}

async function extractPdfText({ fileBuffer, maxTextChars = DEFAULT_MAX_TEXT_CHARS, parser = pdfParse } = {}) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error('fileBuffer must be a non-empty Buffer');
  }

  const metadata = buildBaseMetadata({ fileBuffer, maxTextChars });

  try {
    const parsed = await parser(fileBuffer);
    const normalized = normalizeExtractedText(parsed?.text, maxTextChars);

    return {
      status: normalized.text ? 'success' : 'empty',
      text: normalized.text,
      error: null,
      metadata: {
        ...metadata,
        pageCount: Number.isInteger(parsed?.numpages) ? parsed.numpages : null,
        info: parsed?.info || null,
        metadata: parsed?.metadata || null,
        version: parsed?.version || null,
        characterCount: normalized.characterCount,
        truncated: normalized.truncated,
      },
    };
  } catch (error) {
    return {
      status: 'failed',
      text: '',
      error: {
        code: 'PDF_EXTRACT_FAILED',
        message: error.message,
      },
      metadata,
    };
  }
}

module.exports = {
  DEFAULT_MAX_TEXT_CHARS,
  EXTRACTOR_TYPE,
  normalizeExtractedText,
  extractPdfText,
};
