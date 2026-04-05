jest.mock('./storage', () => ({
  persistUploadedSourceFile: jest.fn(),
}));

jest.mock('./pdf', () => ({
  extractPdfText: jest.fn(),
}));

jest.mock('./docx', () => ({
  DOCX_MIME_TYPE: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  extractDocxText: jest.fn(),
}));

jest.mock('./image-ocr', () => ({
  extractImageOcrText: jest.fn(),
}));

jest.mock('./service', () => ({
  ingestExtractedFileAsMaterial: jest.fn(),
}));

const { persistUploadedSourceFile } = require('./storage');
const { extractPdfText } = require('./pdf');
const { extractDocxText, DOCX_MIME_TYPE } = require('./docx');
const { extractImageOcrText } = require('./image-ocr');
const { ingestExtractedFileAsMaterial } = require('./service');
const controller = require('./controller');
const router = require('./router');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('ingestion controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploads a PDF, persists it, extracts text, and creates a material', async () => {
    const fileBuffer = Buffer.from('%PDF mock');
    const storedFile = {
      metadata: {
        storageKey: 'project-materials/v1/project-1/chapter-1-abcdef123456.pdf',
        projectId: 'project-1',
        originalFileName: 'chapter-1.pdf',
        mimeType: 'application/pdf',
      },
    };
    const extractionResult = {
      status: 'success',
      text: 'Cell theory notes',
      error: null,
      metadata: { extractorType: 'pdf-parse', pageCount: 2 },
    };
    const ingestionResult = {
      material: { id: 'material-1', project_id: 'project-1', weight: 1.25, priority: 'high' },
      ingestion: {
        operation: 'created',
        status: 'success',
        error: null,
      },
    };

    persistUploadedSourceFile.mockResolvedValue(storedFile);
    extractPdfText.mockResolvedValue(extractionResult);
    ingestExtractedFileAsMaterial.mockResolvedValue(ingestionResult);

    const req = {
      params: { projectId: ' project-1 ' },
      body: { title: 'Chapter 1', weight: '1.5' },
      file: {
        buffer: fileBuffer,
        originalname: 'chapter-1.pdf',
        mimetype: 'application/pdf',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(persistUploadedSourceFile).toHaveBeenCalledWith({
      projectId: 'project-1',
      fileBuffer,
      originalFileName: 'chapter-1.pdf',
      mimeType: 'application/pdf',
    });
    expect(extractPdfText).toHaveBeenCalledWith({ fileBuffer });
    expect(ingestExtractedFileAsMaterial).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      materialId: undefined,
      title: 'Chapter 1',
      weight: '1.5',
      storedFile,
      extractionResult,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Material uploaded',
      material: ingestionResult.material,
      ingestion: ingestionResult.ingestion,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('routes DOCX uploads to the DOCX extractor', async () => {
    const fileBuffer = Buffer.from('PK mock docx');
    persistUploadedSourceFile.mockResolvedValue({ metadata: { storageKey: 'x', projectId: 'project-1', originalFileName: 'notes.docx' } });
    extractDocxText.mockResolvedValue({ status: 'success', text: 'DOCX text', error: null, metadata: {} });
    ingestExtractedFileAsMaterial.mockResolvedValue({
      material: { id: 'material-2' },
      ingestion: { operation: 'created', status: 'success', error: null },
    });

    const req = {
      params: { projectId: 'project-1' },
      body: {},
      file: {
        buffer: fileBuffer,
        originalname: 'notes.docx',
        mimetype: DOCX_MIME_TYPE,
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(extractDocxText).toHaveBeenCalledWith({ fileBuffer });
    expect(extractPdfText).not.toHaveBeenCalled();
    expect(extractImageOcrText).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  test('routes image uploads to OCR and normalizes optional materialId', async () => {
    const fileBuffer = Buffer.from('image-bytes');
    persistUploadedSourceFile.mockResolvedValue({ metadata: { storageKey: 'x', projectId: 'project-1', originalFileName: 'scan.png' } });
    extractImageOcrText.mockResolvedValue({ status: 'success', text: 'OCR text', error: null, metadata: { confidence: 91.4 } });
    ingestExtractedFileAsMaterial.mockResolvedValue({
      material: { id: 'material-3' },
      ingestion: { operation: 'updated', status: 'success', error: null },
    });

    const req = {
      params: { projectId: 'project-1' },
      body: { material_id: ' material-9 ' },
      file: {
        buffer: fileBuffer,
        originalname: 'scan.png',
        mimetype: 'image/png',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(extractImageOcrText).toHaveBeenCalledWith({
      fileBuffer,
      mimeType: 'image/png',
    });
    expect(ingestExtractedFileAsMaterial).toHaveBeenCalledWith(
      expect.objectContaining({
        materialId: 'material-9',
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId before touching ingestion services', async () => {
    const req = {
      params: { projectId: '   ' },
      body: {},
      file: {
        buffer: Buffer.from('x'),
        originalname: 'notes.pdf',
        mimetype: 'application/pdf',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(persistUploadedSourceFile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing file before touching ingestion services', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(persistUploadedSourceFile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'file is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects unsupported file types before persistence', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: {},
      file: {
        buffer: Buffer.from('blob'),
        originalname: 'archive.zip',
        mimetype: 'application/zip',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(persistUploadedSourceFile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unsupported file type' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 with ingestion metadata when the project scope is missing', async () => {
    persistUploadedSourceFile.mockResolvedValue({ metadata: { storageKey: 'x', projectId: 'project-404', originalFileName: 'notes.pdf' } });
    extractPdfText.mockResolvedValue({ status: 'empty', text: '', error: null, metadata: {} });
    ingestExtractedFileAsMaterial.mockResolvedValue({
      material: null,
      ingestion: { operation: 'created', status: 'empty', error: null },
    });

    const req = {
      params: { projectId: 'project-404' },
      body: {},
      file: {
        buffer: Buffer.from('%PDF'),
        originalname: 'notes.pdf',
        mimetype: 'application/pdf',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.uploadProjectMaterial(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Project not found',
      ingestion: { operation: 'created', status: 'empty', error: null },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('wires the upload route on the ingestion router', () => {
    const routeSummaries = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).filter((method) => layer.route.methods[method]),
      }));

    expect(routeSummaries).toEqual(
      expect.arrayContaining([
        {
          path: '/upload',
          methods: ['post'],
        },
      ])
    );
  });
});
