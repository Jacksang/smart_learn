const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
  STORAGE_VERSION,
  sanitizeFileName,
  buildStorageKey,
  createContentChecksum,
  persistUploadedSourceFile,
} = require('./storage');

describe('ingestion storage', () => {
  test('sanitizes original file names into stable storage-safe names', () => {
    expect(sanitizeFileName(' Lecture Notes (Week 1).PDF ')).toBe('Lecture-Notes-Week-1-.PDF');
    expect(sanitizeFileName('../../biology final?.docx')).toBe('biology-final-.docx');
  });

  test('builds a deterministic storage key from project id, file name, and checksum', () => {
    const checksum = createContentChecksum(Buffer.from('cell-membrane'));

    expect(
      buildStorageKey({
        projectId: 'project-123',
        originalFileName: 'Lesson 1.pdf',
        checksum,
      })
    ).toBe(`project-materials/v${STORAGE_VERSION}/project-123/Lesson-1-${checksum.slice(0, 12)}.pdf`);
  });

  test('persists an uploaded file and records metadata needed for later extraction', async () => {
    const storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-learn-storage-'));
    const fileBuffer = Buffer.from('Photosynthesis converts light into chemical energy.');

    const result = await persistUploadedSourceFile({
      projectId: 'project-456',
      fileBuffer,
      originalFileName: 'Chapter 2 Notes.pdf',
      mimeType: 'application/pdf',
      storageRoot,
      storedAt: new Date('2026-04-05T13:00:00.000Z'),
    });

    await expect(fs.readFile(result.absolutePath)).resolves.toEqual(fileBuffer);
    expect(result.metadata).toEqual({
      storageKey: result.storageKey,
      storageVersion: STORAGE_VERSION,
      projectId: 'project-456',
      originalFileName: 'Chapter-2-Notes.pdf',
      storedFileName: `Chapter-2-Notes-${createContentChecksum(fileBuffer).slice(0, 12)}.pdf`,
      mimeType: 'application/pdf',
      extension: '.pdf',
      fileSizeBytes: fileBuffer.length,
      checksum: createContentChecksum(fileBuffer),
      storedAt: '2026-04-05T13:00:00.000Z',
    });
  });

  test('rejects empty file buffers', async () => {
    await expect(
      persistUploadedSourceFile({
        projectId: 'project-789',
        fileBuffer: Buffer.alloc(0),
        originalFileName: 'empty.pdf',
        mimeType: 'application/pdf',
      })
    ).rejects.toThrow('fileBuffer must be a non-empty Buffer');
  });
});
