jest.mock('../materials/repository', () => ({
  createMaterialForUser: jest.fn(),
  updateMaterialForUser: jest.fn(),
}));

jest.mock('../materials/service', () => ({
  prepareMaterialCreateInput: jest.fn((payload) => ({ ...payload, prepared: true })),
  prepareMaterialUpdateInput: jest.fn((payload) => ({ ...payload, prepared: true })),
  decorateMaterialWithWeight: jest.fn((material) =>
    material ? { ...material, weight: material.weight ?? 1, priority: 'normal' } : null
  ),
}));

jest.mock('../outline/service', () => ({
  refreshOutline: jest.fn(),
}));

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
const {
  inferMaterialType,
  buildIngestionMaterialPayload,
  ingestExtractedFileAsMaterial,
} = require('./service');

describe('ingestion orchestrator service', () => {
  const storedFile = {
    metadata: {
      storageKey: 'project-materials/v1/project-1/chapter-1-abcdef123456.pdf',
      projectId: 'project-1',
      originalFileName: 'Chapter 1.pdf',
      mimeType: 'application/pdf',
      storedFileName: 'chapter-1-abcdef123456.pdf',
      fileSizeBytes: 1234,
      checksum: 'abcdef1234567890',
      storedAt: '2026-04-05T13:00:00.000Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('infers the MVP material type from stored file metadata', () => {
    expect(inferMaterialType({ mimeType: 'application/pdf', originalFileName: 'notes.bin' })).toBe('pdf');
    expect(
      inferMaterialType({
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalFileName: 'notes.unknown',
      })
    ).toBe('docx');
    expect(inferMaterialType({ mimeType: 'image/png', originalFileName: 'scan.png' })).toBe('image');
    expect(inferMaterialType({ mimeType: 'application/octet-stream', originalFileName: 'blob.dat' })).toBe('file');
  });

  test('builds a material-ready payload from stored file metadata and extracted text', () => {
    expect(
      buildIngestionMaterialPayload({
        storedFile,
        extractionResult: { text: '  Cell theory\n  ', status: 'success' },
        weight: 1.5,
      })
    ).toEqual({
      projectId: 'project-1',
      sourceKind: 'upload',
      materialType: 'pdf',
      title: 'Chapter 1',
      originalFileName: 'Chapter 1.pdf',
      mimeType: 'application/pdf',
      storagePath: 'project-materials/v1/project-1/chapter-1-abcdef123456.pdf',
      rawText: null,
      extractedText: 'Cell theory',
      weight: 1.5,
      isActive: true,
      sourceVersion: 1,
    });
  });

  test('creates a source material from a stored upload and refreshes outline once', async () => {
    createMaterialForUser.mockResolvedValue({
      id: 'material-1',
      project_id: 'project-1',
      weight: 1.5,
    });

    const result = await ingestExtractedFileAsMaterial({
      userId: 'user-1',
      title: 'Teacher chapter upload',
      weight: 1.5,
      storedFile,
      extractionResult: {
        status: 'success',
        text: 'Photosynthesis converts light into chemical energy.',
        error: null,
        metadata: {
          extractorType: 'pdf-parse',
          pageCount: 2,
        },
      },
    });

    expect(prepareMaterialCreateInput).toHaveBeenCalledWith({
      projectId: 'project-1',
      sourceKind: 'upload',
      materialType: 'pdf',
      title: 'Teacher chapter upload',
      originalFileName: 'Chapter 1.pdf',
      mimeType: 'application/pdf',
      storagePath: 'project-materials/v1/project-1/chapter-1-abcdef123456.pdf',
      rawText: null,
      extractedText: 'Photosynthesis converts light into chemical energy.',
      weight: 1.5,
      isActive: true,
      sourceVersion: 1,
      userId: 'user-1',
    });
    expect(createMaterialForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-1',
        sourceKind: 'upload',
        materialType: 'pdf',
        prepared: true,
        userId: 'user-1',
      })
    );
    expect(refreshOutline).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      trigger: 'material_created',
      materialId: 'material-1',
    });
    expect(decorateMaterialWithWeight).toHaveBeenCalledWith({
      id: 'material-1',
      project_id: 'project-1',
      weight: 1.5,
    });
    expect(result).toEqual({
      material: {
        id: 'material-1',
        project_id: 'project-1',
        weight: 1.5,
        priority: 'normal',
      },
      ingestion: {
        operation: 'created',
        status: 'success',
        error: null,
        storedFile: storedFile.metadata,
        extraction: {
          textLength: 'Photosynthesis converts light into chemical energy.'.length,
          metadata: {
            extractorType: 'pdf-parse',
            pageCount: 2,
          },
        },
      },
    });
  });

  test('updates an existing material even when extraction fails and surfaces the failure cleanly', async () => {
    updateMaterialForUser.mockResolvedValue({
      id: 'material-9',
      project_id: 'project-1',
      weight: 1.25,
    });

    const result = await ingestExtractedFileAsMaterial({
      userId: 'user-1',
      materialId: 'material-9',
      storedFile: {
        metadata: {
          ...storedFile.metadata,
          originalFileName: 'Scanned page.png',
          mimeType: 'image/png',
          storageKey: 'project-materials/v1/project-1/scanned-page-abcdef123456.png',
        },
      },
      extractionResult: {
        status: 'failed',
        text: '',
        error: {
          code: 'IMAGE_OCR_FAILED',
          message: 'tesseract not installed',
        },
        metadata: {
          extractorType: 'tesseract-cli',
          confidence: null,
        },
      },
    });

    expect(prepareMaterialUpdateInput).toHaveBeenCalledWith({
      source_kind: 'upload',
      material_type: 'image',
      title: 'Scanned page',
      original_file_name: 'Scanned page.png',
      mime_type: 'image/png',
      storage_path: 'project-materials/v1/project-1/scanned-page-abcdef123456.png',
      raw_text: null,
      extracted_text: null,
      weight: undefined,
      is_active: true,
      source_version: 1,
    });
    expect(updateMaterialForUser).toHaveBeenCalledWith('material-9', 'user-1', {
      source_kind: 'upload',
      material_type: 'image',
      title: 'Scanned page',
      original_file_name: 'Scanned page.png',
      mime_type: 'image/png',
      storage_path: 'project-materials/v1/project-1/scanned-page-abcdef123456.png',
      raw_text: null,
      extracted_text: null,
      weight: undefined,
      is_active: true,
      source_version: 1,
      prepared: true,
    });
    expect(refreshOutline).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      trigger: 'material_updated',
      materialId: 'material-9',
    });
    expect(result.ingestion).toEqual({
      operation: 'updated',
      status: 'failed',
      error: {
        code: 'IMAGE_OCR_FAILED',
        message: 'tesseract not installed',
      },
      storedFile: {
        ...storedFile.metadata,
        originalFileName: 'Scanned page.png',
        mimeType: 'image/png',
        storageKey: 'project-materials/v1/project-1/scanned-page-abcdef123456.png',
      },
      extraction: {
        textLength: 0,
        metadata: {
          extractorType: 'tesseract-cli',
          confidence: null,
        },
      },
    });
  });

  test('returns a null material without refreshing outline when the project or material scope is missing', async () => {
    createMaterialForUser.mockResolvedValue(null);

    const result = await ingestExtractedFileAsMaterial({
      userId: 'user-1',
      storedFile,
      extractionResult: {
        status: 'empty',
        text: '',
        error: null,
        metadata: { extractorType: 'pdf-parse' },
      },
    });

    expect(refreshOutline).not.toHaveBeenCalled();
    expect(result).toEqual({
      material: null,
      ingestion: {
        operation: 'created',
        status: 'empty',
        error: null,
        storedFile: storedFile.metadata,
        extraction: {
          textLength: 0,
          metadata: { extractorType: 'pdf-parse' },
        },
      },
    });
  });

  test('rejects missing stored file metadata before touching the materials flow', async () => {
    await expect(
      ingestExtractedFileAsMaterial({
        userId: 'user-1',
        storedFile: { metadata: { projectId: 'project-1' } },
        extractionResult: { status: 'success', text: 'notes' },
      })
    ).rejects.toThrow('storedFile.metadata.storageKey is required');

    expect(createMaterialForUser).not.toHaveBeenCalled();
    expect(updateMaterialForUser).not.toHaveBeenCalled();
    expect(refreshOutline).not.toHaveBeenCalled();
  });
});
