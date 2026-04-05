const {
  DEFAULT_MAX_TEXT_CHARS,
  DOCX_MIME_TYPE,
  extractDocxText,
  extractTextFromDocumentXml,
  normalizeExtractedText,
} = require('./docx');

describe('docx ingestion service', () => {
  test('normalizes extracted DOCX text into a stable bounded string', () => {
    expect(normalizeExtractedText('  Topic A\r\n\r\nTopic B\u0000  ')).toEqual({
      text: 'Topic A\nTopic B',
      characterCount: 'Topic A\nTopic B'.length,
      truncated: false,
    });
  });

  test('extracts readable text from DOCX document xml', () => {
    const documentXml = [
      '<w:document>',
      '  <w:body>',
      '    <w:p><w:r><w:t>First line</w:t></w:r></w:p>',
      '    <w:p><w:r><w:t xml:space="preserve">Second &amp; third</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>item</w:t></w:r></w:p>',
      '    <w:p><w:r><w:t>Line</w:t></w:r><w:r><w:br/></w:r><w:r><w:t>break</w:t></w:r></w:p>',
      '  </w:body>',
      '</w:document>',
    ].join('');

    expect(extractTextFromDocumentXml(documentXml)).toBe('First line\nSecond & third\titem\nLine\nbreak\n');
  });

  test('returns extracted text and metadata for successful DOCX parsing', async () => {
    const fileBuffer = Buffer.from('PK mock docx');
    const documentXml = [
      '<w:document>',
      '  <w:body>',
      '    <w:p><w:r><w:t>Cell theory</w:t></w:r></w:p>',
      '    <w:p><w:r><w:t>All living things are made of cells.</w:t></w:r></w:p>',
      '  </w:body>',
      '</w:document>',
    ].join('');

    await expect(
      extractDocxText({
        fileBuffer,
        unzipDocumentXml: jest.fn().mockResolvedValue(documentXml),
      })
    ).resolves.toEqual({
      status: 'success',
      text: 'Cell theory\nAll living things are made of cells.',
      error: null,
      metadata: {
        extractorType: 'docx-unzip',
        mimeType: DOCX_MIME_TYPE,
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        truncated: false,
        characterCount: 'Cell theory\nAll living things are made of cells.'.length,
        documentXmlLength: Buffer.byteLength(documentXml, 'utf8'),
      },
    });
  });

  test('returns an empty status when DOCX parsing yields no usable text', async () => {
    const fileBuffer = Buffer.from('PK empty docx');

    await expect(
      extractDocxText({
        fileBuffer,
        unzipDocumentXml: jest.fn().mockResolvedValue('<w:document><w:body><w:p/></w:body></w:document>'),
      })
    ).resolves.toEqual({
      status: 'empty',
      text: '',
      error: null,
      metadata: {
        extractorType: 'docx-unzip',
        mimeType: DOCX_MIME_TYPE,
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        truncated: false,
        characterCount: 0,
        documentXmlLength: Buffer.byteLength('<w:document><w:body><w:p/></w:body></w:document>', 'utf8'),
      },
    });
  });

  test('caps extracted text at the requested bound and marks truncation', async () => {
    const result = await extractDocxText({
      fileBuffer: Buffer.from('PK bounded docx'),
      maxTextChars: 5,
      unzipDocumentXml: jest.fn().mockResolvedValue(
        '<w:document><w:body><w:p><w:r><w:t>abcdefghi</w:t></w:r></w:p></w:body></w:document>'
      ),
    });

    expect(result.status).toBe('success');
    expect(result.text).toBe('abcde');
    expect(result.metadata.truncated).toBe(true);
    expect(result.metadata.characterCount).toBe(5);
    expect(result.metadata.maxTextChars).toBe(5);
  });

  test('returns a stable failure contract when DOCX extraction fails', async () => {
    const fileBuffer = Buffer.from('PK broken docx');

    await expect(
      extractDocxText({
        fileBuffer,
        unzipDocumentXml: jest.fn().mockRejectedValue(new Error('invalid zip archive')),
      })
    ).resolves.toEqual({
      status: 'failed',
      text: '',
      error: {
        code: 'DOCX_EXTRACT_FAILED',
        message: 'invalid zip archive',
      },
      metadata: {
        extractorType: 'docx-unzip',
        mimeType: DOCX_MIME_TYPE,
        fileSizeBytes: fileBuffer.length,
        maxTextChars: DEFAULT_MAX_TEXT_CHARS,
        truncated: false,
        characterCount: 0,
        documentXmlLength: 0,
      },
    });
  });

  test('rejects empty file buffers before parsing', async () => {
    await expect(extractDocxText({ fileBuffer: Buffer.alloc(0) })).rejects.toThrow(
      'fileBuffer must be a non-empty Buffer'
    );
  });
});
