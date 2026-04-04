jest.mock('./repository', () => ({
  listByProjectForUser: jest.fn(),
  createMaterialForUser: jest.fn(),
  updateMaterialForUser: jest.fn(),
}));

jest.mock('./service', () => ({
  prepareMaterialCreateInput: jest.fn((payload) => ({ ...payload, prepared: true })),
  prepareMaterialUpdateInput: jest.fn((updates) => ({ ...updates, prepared: true })),
  decorateMaterialWithWeight: jest.fn((material) =>
    material ? { ...material, weight: material.weight ?? 1, priority: 'normal' } : null
  ),
  buildBaseKnowledgeFallbackDecision: jest.fn(() => ({
    shouldFallback: false,
    reason: null,
    decisionPoint: 'project_material_preflight',
    response: {
      action: 'use_project_materials',
      decisionPoint: 'project_material_preflight',
      projectId: 'project-1',
      reason: null,
    },
  })),
}));

const {
  listByProjectForUser,
  createMaterialForUser,
  updateMaterialForUser,
} = require('./repository');
const {
  prepareMaterialCreateInput,
  prepareMaterialUpdateInput,
  decorateMaterialWithWeight,
  buildBaseKnowledgeFallbackDecision,
} = require('./service');
const controller = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('materials controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists project materials and returns fallback metadata from the service layer', async () => {
    const repoMaterials = [
      { id: 'material-1', source_kind: 'upload', extracted_text: 'notes' },
      { id: 'material-2', material_type: 'base_knowledge', extracted_text: 'fallback' },
    ];
    const decoratedMaterials = [
      { id: 'material-1', source_kind: 'upload', extracted_text: 'notes', weight: 1, priority: 'normal' },
      { id: 'material-2', material_type: 'base_knowledge', extracted_text: 'fallback', weight: 1, priority: 'normal' },
    ];

    listByProjectForUser.mockResolvedValue(repoMaterials);
    decorateMaterialWithWeight
      .mockReturnValueOnce(decoratedMaterials[0])
      .mockReturnValueOnce(decoratedMaterials[1]);
    buildBaseKnowledgeFallbackDecision.mockReturnValue({
      shouldFallback: true,
      reason: 'missing_user_material',
      decisionPoint: 'project_material_preflight',
      response: {
        action: 'create_base_knowledge',
        decisionPoint: 'project_material_preflight',
        projectId: 'project-1',
        reason: 'missing_user_material',
      },
    });

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.listProjectMaterials(req, res, next);

    expect(listByProjectForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(decorateMaterialWithWeight).toHaveBeenCalledTimes(2);
    expect(buildBaseKnowledgeFallbackDecision).toHaveBeenCalledWith(decoratedMaterials, {
      projectId: 'project-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      materials: decoratedMaterials,
      fallback: {
        shouldFallback: true,
        reason: 'missing_user_material',
        decisionPoint: 'project_material_preflight',
        response: {
          action: 'create_base_knowledge',
          decisionPoint: 'project_material_preflight',
          projectId: 'project-1',
          reason: 'missing_user_material',
        },
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('creates a project material with normalized input and decorated output', async () => {
    const createdMaterial = {
      id: 'material-1',
      project_id: 'project-1',
      source_kind: 'upload',
      material_type: 'pdf',
      title: 'Chapter 1',
    };
    const decoratedMaterial = { ...createdMaterial, weight: 1, priority: 'normal' };
    createMaterialForUser.mockResolvedValue(createdMaterial);
    decorateMaterialWithWeight.mockReturnValue(decoratedMaterial);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
      body: {
        sourceKind: 'upload',
        materialType: 'pdf',
        title: 'Chapter 1',
        rawText: 'Content',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectMaterial(req, res, next);

    expect(prepareMaterialCreateInput).toHaveBeenCalledWith({
      projectId: 'project-1',
      sourceKind: 'upload',
      materialType: 'pdf',
      title: 'Chapter 1',
      originalFileName: undefined,
      mimeType: undefined,
      storagePath: undefined,
      rawText: 'Content',
      extractedText: undefined,
      weight: undefined,
      isActive: undefined,
      sourceVersion: undefined,
    });
    expect(createMaterialForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      sourceKind: 'upload',
      materialType: 'pdf',
      title: 'Chapter 1',
      originalFileName: undefined,
      mimeType: undefined,
      storagePath: undefined,
      rawText: 'Content',
      extractedText: undefined,
      weight: undefined,
      isActive: undefined,
      sourceVersion: undefined,
      prepared: true,
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Material created',
      material: decoratedMaterial,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects project material creation when required fields are missing', async () => {
    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
      body: { title: 'Missing metadata' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectMaterial(req, res, next);

    expect(prepareMaterialCreateInput).not.toHaveBeenCalled();
    expect(createMaterialForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'sourceKind/source_kind and materialType/material_type are required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when creating a project material for a missing project', async () => {
    createMaterialForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'missing-project' },
      user: { id: 'user-1' },
      body: {
        source_kind: 'upload',
        material_type: 'pdf',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createProjectMaterial(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('creates a base-knowledge material with fixed fallback source metadata', async () => {
    const createdMaterial = {
      id: 'material-2',
      project_id: 'project-1',
      source_kind: 'base_knowledge',
      material_type: 'base_knowledge',
      title: 'Base knowledge fallback',
    };
    const decoratedMaterial = { ...createdMaterial, weight: 0.75, priority: 'low' };
    createMaterialForUser.mockResolvedValue(createdMaterial);
    decorateMaterialWithWeight.mockReturnValue(decoratedMaterial);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
      body: {
        raw_text: 'Generated baseline facts',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.createBaseKnowledgeMaterial(req, res, next);

    expect(prepareMaterialCreateInput).toHaveBeenCalledWith({
      projectId: 'project-1',
      sourceKind: 'base_knowledge',
      materialType: 'base_knowledge',
      title: 'Base knowledge fallback',
      rawText: 'Generated baseline facts',
      extractedText: null,
      sourceVersion: undefined,
      isActive: undefined,
      weight: undefined,
    });
    expect(createMaterialForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-1',
        sourceKind: 'base_knowledge',
        materialType: 'base_knowledge',
        prepared: true,
        userId: 'user-1',
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Base knowledge material created',
      material: decoratedMaterial,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('updates a material using normalized snake_case fields and decorated output', async () => {
    const updatedMaterial = {
      id: 'material-1',
      title: 'Updated notes',
      weight: 1.5,
    };
    const decoratedMaterial = { ...updatedMaterial, priority: 'normal' };
    updateMaterialForUser.mockResolvedValue(updatedMaterial);
    decorateMaterialWithWeight.mockReturnValue(decoratedMaterial);

    const req = {
      params: { materialId: 'material-1' },
      user: { id: 'user-1' },
      body: {
        title: 'Updated notes',
        rawText: 'New content',
        isActive: false,
      },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateMaterial(req, res, next);

    expect(prepareMaterialUpdateInput).toHaveBeenCalledWith({
      title: 'Updated notes',
      raw_text: 'New content',
      is_active: false,
    });
    expect(updateMaterialForUser).toHaveBeenCalledWith('material-1', 'user-1', {
      title: 'Updated notes',
      raw_text: 'New content',
      is_active: false,
      prepared: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Material updated',
      material: decoratedMaterial,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when updating a material outside the user scope', async () => {
    updateMaterialForUser.mockResolvedValue(null);

    const req = {
      params: { materialId: 'missing-material' },
      user: { id: 'user-1' },
      body: { weight: 0.5 },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.updateMaterial(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Material not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
