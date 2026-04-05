const {
  DEFAULT_LANGUAGE,
  DEFAULT_MAX_TEXT_CHARS,
  DEFAULT_OCR_TIMEOUT_MS,
  extractImageOcrText,
  normalizeExtractedText,
  parseConfidence,
} = require('./image-ocr');

describe('image OCR ingestion service', () => {
  test('normalizes OCR text into a stable bounded string', () => {
    expect(normalizeExtractedText('  Line 1\r\n\r\nLine 2\u0000  ')).toEqual({
      text: 'Line 1\nLine 2',
      characterCount: 'Line 1\nLine 2'.length,
      truncated: false,
    });
  });

  test('parses OCR confidence values defensively', () => {
    expect(parseConfidence('87.55')).toBe(87.55);
    expect(parseConfidence('not-a-number')).toBeNull();
  });

  test('returns extracted text and metadata for successful OCR', async () => {
    const fileBuffer = Buffer.from('png mock');

    await expect(
      extractImageOcrText({
        fileBuffer,
        mimeType: 'image/png',
        performOcr: jest.fn().mockResolvedValue({
          text: '  Mitochondria\n\nPowerhouse of the cell  ',
          confidence: 96.4,
        }),
      })
    ).resolves.toEqual({
      status: 'success',
      text: 'Mitochondria\nPowerhouse of the cell',
      error: null,
      metadata: {
        extractorType: 'tesseract-cli',
        mimeType: 'image/png',
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        language: DEFAULT_LANGUAGE,
        timeoutMs: DEFAULT_OCR_TIMEOUT_MS,
        truncated: false,
        characterCount: 'Mitochondria\nPowerhouse of the cell'.length,
        confidence: 96.4,
      },
    });
  });

  test('returns an empty status when OCR yields no usable text', async () => {
    const fileBuffer = Buffer.from('png empty');

    await expect(
      extractImageOcrText({
        fileBuffer,
        mimeType: 'image/png',
        performOcr: jest.fn().mockResolvedValue({
          text: '  \n\n ',
          confidence: null,
        }),
      })
    ).resolves.toEqual({
      status: 'empty',
      text: '',
      error: null,
      metadata: {
        extractorType: 'tesseract-cli',
        mimeType: 'image/png',
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        language: DEFAULT_LANGUAGE,
        timeoutMs: DEFAULT_OCR_TIMEOUT_MS,
        truncated: false,
        characterCount: 0,
        confidence: null,
      },
    });
  });

  test('caps OCR text at the requested bound and marks truncation', async () => {
    const result = await extractImageOcrText({
      fileBuffer: Buffer.from('png bounded'),
      mimeType: 'image/png',
      maxTextChars: 5,
      performOcr: jest.fn().mockResolvedValue({
        text: 'abcdefghi',
        confidence: '90.12',
      }),
    });

    expect(result.status).toBe('success');
    expect(result.text).toBe('abcde');
    expect(result.metadata.truncated).toBe(true);
    expect(result.metadata.characterCount).toBe(5);
    expect(result.metadata.maxTextChars).toBe(5);
    expect(result.metadata.confidence).toBe(90.12);
  });

  test('returns a stable failure contract when OCR throws', async () => {
    const fileBuffer = Buffer.from('png broken');

    await expect(
      extractImageOcrText({
        fileBuffer,
        mimeType: 'image/png',
        performOcr: jest.fn().mockRejectedValue(new Error('tesseract unavailable')),
      })
    ).resolves.toEqual({
      status: 'failed',
      text: '',
      error: {
        code: 'IMAGE_OCR_FAILED',
        message: 'tesseract unavailable',
      },
      metadata: {
        extractorType: 'tesseract-cli',
        mimeType: 'image/png',
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        language: DEFAULT_LANGUAGE,
        timeoutMs: DEFAULT_OCR_TIMEOUT_MS,
        truncated: false,
        characterCount: 0,
        confidence: null,
      },
    });
  });

  test('rejects empty file buffers before OCR starts', async () => {
    await expect(extractImageOcrText({ fileBuffer: Buffer.alloc(0) })).rejects.toThrow(
      'fileBuffer must be a non-empty Buffer'
    );
  });
});
