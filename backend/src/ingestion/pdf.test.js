jest.mock('pdf-parse', () => jest.fn());

const pdfParse = require('pdf-parse');
const { DEFAULT_MAX_TEXT_CHARS, extractPdfText, normalizeExtractedText } = require('./pdf');

describe('pdf ingestion service', () => {
  beforeEach(() => {
    pdfParse.mockReset();
  });

  test('normalizes extracted PDF text into a stable bounded string', () => {
    expect(normalizeExtractedText('  Line 1\r\n\r\nLine 2\u0000  ')).toEqual({
      text: 'Line 1\nLine 2',
      characterCount: 'Line 1\nLine 2'.length,
      truncated: false,
    });
  });

  test('returns extracted text and metadata for successful PDF parsing', async () => {
    const fileBuffer = Buffer.from('%PDF mock');

    pdfParse.mockResolvedValue({
      text: '  Cell theory\n\nAll living things are made of cells.  ',
      numpages: 3,
      info: { Title: 'Biology Notes' },
      metadata: { Author: 'Smart Learn' },
      version: '1.10.100',
    });

    await expect(extractPdfText({ fileBuffer })).resolves.toEqual({
      status: 'success',
      text: 'Cell theory\nAll living things are made of cells.',
      error: null,
      metadata: {
        extractorType: 'pdf-parse',
        mimeType: 'application/pdf',
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        pageCount: 3,
        truncated: false,
        characterCount: 'Cell theory\nAll living things are made of cells.'.length,
        info: { Title: 'Biology Notes' },
        metadata: { Author: 'Smart Learn' },
        version: '1.10.100',
      },
    });
  });

  test('returns an empty status when PDF parsing yields no usable text', async () => {
    pdfParse.mockResolvedValue({
      text: ' \n\n ',
      numpages: 1,
    });

    await expect(extractPdfText({ fileBuffer: Buffer.from('%PDF empty') })).resolves.toEqual({
      status: 'empty',
      text: '',
      error: null,
      metadata: {
        extractorType: 'pdf-parse',
        mimeType: 'application/pdf',
        fileSizeBytes: Buffer.from('%PDF empty').length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        pageCount: 1,
        truncated: false,
        characterCount: 0,
        info: null,
        metadata: null,
        version: null,
      },
    });
  });

  test('caps extracted text at the requested bound and marks truncation', async () => {
    pdfParse.mockResolvedValue({
      text: 'abcdefghi',
      numpages: 2,
    });

    const result = await extractPdfText({
      fileBuffer: Buffer.from('%PDF bounded'),
      maxTextChars: 5,
    });

    expect(result.status).toBe('success');
    expect(result.text).toBe('abcde');
    expect(result.metadata.truncated).toBe(true);
    expect(result.metadata.characterCount).toBe(5);
    expect(result.metadata.maxTextChars).toBe(5);
  });

  test('returns a stable failure contract when the PDF parser throws', async () => {
    const fileBuffer = Buffer.from('%PDF broken');
    pdfParse.mockRejectedValue(new Error('bad xref table'));

    await expect(extractPdfText({ fileBuffer })).resolves.toEqual({
      status: 'failed',
      text: '',
      error: {
        code: 'PDF_EXTRACT_FAILED',
        message: 'bad xref table',
      },
      metadata: {
        extractorType: 'pdf-parse',
        mimeType: 'application/pdf',
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        pageCount: null,
        truncated: false,
        characterCount: 0,
      },
    });
  });

  test('rejects empty file buffers before parsing', async () => {
    await expect(extractPdfText({ fileBuffer: Buffer.alloc(0) })).rejects.toThrow(
      'fileBuffer must be a non-empty Buffer'
    );
  });
});
