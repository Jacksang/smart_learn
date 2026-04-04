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

function normalizeMaterialCreateBody(body = {}, projectId) {
  return {
    projectId,
    sourceKind: body.sourceKind ?? body.source_kind,
    materialType: body.materialType ?? body.material_type,
    title: body.title,
    originalFileName: body.originalFileName ?? body.original_file_name,
    mimeType: body.mimeType ?? body.mime_type,
    storagePath: body.storagePath ?? body.storage_path,
    rawText: body.rawText ?? body.raw_text,
    extractedText: body.extractedText ?? body.extracted_text,
    weight: body.weight,
    isActive: body.isActive ?? body.is_active,
    sourceVersion: body.sourceVersion ?? body.source_version,
  };
}

function normalizeMaterialUpdateBody(body = {}) {
  const updates = {};
  const fieldMap = {
    sourceKind: 'source_kind',
    source_kind: 'source_kind',
    materialType: 'material_type',
    material_type: 'material_type',
    title: 'title',
    originalFileName: 'original_file_name',
    original_file_name: 'original_file_name',
    mimeType: 'mime_type',
    mime_type: 'mime_type',
    storagePath: 'storage_path',
    storage_path: 'storage_path',
    rawText: 'raw_text',
    raw_text: 'raw_text',
    extractedText: 'extracted_text',
    extracted_text: 'extracted_text',
    weight: 'weight',
    isActive: 'is_active',
    is_active: 'is_active',
    sourceVersion: 'source_version',
    source_version: 'source_version',
  };

  Object.entries(fieldMap).forEach(([inputKey, repoKey]) => {
    if (Object.prototype.hasOwnProperty.call(body, inputKey)) {
      updates[repoKey] = body[inputKey];
    }
  });

  return updates;
}

exports.listProjectMaterials = async (req, res, next) => {
  try {
    const materials = await listByProjectForUser(req.params.projectId, req.user.id);
    const decoratedMaterials = materials.map(decorateMaterialWithWeight);
    const fallback = buildBaseKnowledgeFallbackDecision(decoratedMaterials, {
      projectId: req.params.projectId,
    });

    return res.status(200).json({ materials: decoratedMaterials, fallback });
  } catch (error) {
    return next(error);
  }
};

exports.createProjectMaterial = async (req, res, next) => {
  try {
    const normalizedInput = normalizeMaterialCreateBody(req.body, req.params.projectId);

    if (!normalizedInput.sourceKind || !normalizedInput.materialType) {
      return res.status(400).json({ message: 'sourceKind/source_kind and materialType/material_type are required' });
    }

    const material = await createMaterialForUser({
      ...prepareMaterialCreateInput(normalizedInput),
      userId: req.user.id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(201).json({
      message: 'Material created',
      material: decorateMaterialWithWeight(material),
    });
  } catch (error) {
    return next(error);
  }
};

exports.createBaseKnowledgeMaterial = async (req, res, next) => {
  try {
    const material = await createMaterialForUser({
      ...prepareMaterialCreateInput({
        projectId: req.params.projectId,
        sourceKind: 'base_knowledge',
        materialType: 'base_knowledge',
        title: req.body.title || 'Base knowledge fallback',
        rawText: req.body.rawText ?? req.body.raw_text ?? null,
        extractedText: req.body.extractedText ?? req.body.extracted_text ?? null,
        sourceVersion: req.body.sourceVersion ?? req.body.source_version,
        isActive: req.body.isActive ?? req.body.is_active,
        weight: req.body.weight,
      }),
      userId: req.user.id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(201).json({
      message: 'Base knowledge material created',
      material: decorateMaterialWithWeight(material),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateMaterial = async (req, res, next) => {
  try {
    const updates = normalizeMaterialUpdateBody(req.body);
    const normalizedUpdates = prepareMaterialUpdateInput(updates);
    const material = await updateMaterialForUser(req.params.materialId, req.user.id, normalizedUpdates);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.status(200).json({
      message: 'Material updated',
      material: decorateMaterialWithWeight(material),
    });
  } catch (error) {
    return next(error);
  }
};
