const STATUS_VALUES = ['draft', 'published'];
const VALID_LEVELS = [1, 2, 3, 4, 5];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function validateOutlineItem(item, path, errors) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!isNonEmptyString(item.title)) {
    errors.push(`${path}.title is required and must be a non-empty string`);
  }

  if (item.level !== undefined && !VALID_LEVELS.includes(item.level)) {
    errors.push(`${path}.level must be one of: ${VALID_LEVELS.join(', ')}`);
  }

  if (
    item.orderIndex !== undefined
    && (!Number.isInteger(item.orderIndex) || item.orderIndex < 0)
  ) {
    errors.push(`${path}.orderIndex must be a non-negative integer`);
  }

  if (
    item.content !== undefined
    && item.content !== null
    && typeof item.content !== 'string'
  ) {
    errors.push(`${path}.content must be a string or null`);
  }

  if (item.children !== undefined && !Array.isArray(item.children)) {
    errors.push(`${path}.children must be an array`);
    return;
  }

  (item.children || []).forEach((child, index) => {
    validateOutlineItem(child, `${path}.children[${index}]`, errors);
  });
}

function validateOutlineCreatePayload(payload = {}) {
  const errors = [];

  if (!isNonEmptyString(payload.projectId)) {
    errors.push('projectId is required and must be a non-empty string');
  }

  if (!isNonEmptyString(payload.title)) {
    errors.push('title is required and must be a non-empty string');
  }

  if (payload.status !== undefined && !STATUS_VALUES.includes(payload.status)) {
    errors.push(`status must be one of: ${STATUS_VALUES.join(', ')}`);
  }

  if (payload.items !== undefined && !Array.isArray(payload.items)) {
    errors.push('items must be an array');
  }

  (payload.items || []).forEach((item, index) => {
    validateOutlineItem(item, `items[${index}]`, errors);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function flattenItems(items = [], parentClientKey = null, state = { nextKey: 1, nextOrderIndex: 0 }) {
  const flattened = [];

  items.forEach((item) => {
    const clientKey = `item-${state.nextKey}`;
    state.nextKey += 1;

    flattened.push({
      clientKey,
      parentClientKey,
      level: item.level || 1,
      title: item.title.trim(),
      content: item.content ?? null,
      orderIndex: item.orderIndex ?? state.nextOrderIndex,
    });

    state.nextOrderIndex += 1;

    if (Array.isArray(item.children) && item.children.length > 0) {
      flattened.push(...flattenItems(item.children, clientKey, state));
    }
  });

  return flattened;
}

function normalizeCreatePayload(payload = {}) {
  return {
    projectId: payload.projectId.trim(),
    title: payload.title.trim(),
    status: payload.status || 'draft',
    items: flattenItems(payload.items || []),
  };
}

function buildOutlineItemsFromMaterials(materials = []) {
  return materials
    .filter((material) => material && material.is_active !== false)
    .map((material, index) => {
      const title = [
        material.title,
        material.original_file_name,
        material.originalFileName,
        material.material_type,
        material.materialType,
        material.source_kind,
        material.sourceKind,
        `Material ${index + 1}`,
      ].find((value) => isNonEmptyString(value));

      const contentSource = [
        material.extracted_text,
        material.extractedText,
        material.raw_text,
        material.rawText,
      ].find((value) => typeof value === 'string' && value.trim() !== '');

      return {
        title,
        level: 1,
        content: contentSource ? contentSource.trim().slice(0, 500) : null,
      };
    });
}

function prepareOutlineCreateInput(payload = {}) {
  const validation = validateOutlineCreatePayload(payload);

  if (!validation.isValid) {
    return {
      isValid: false,
      errors: validation.errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    ...normalizeCreatePayload(payload),
  };
}

async function createOutline(payload, deps = {}) {
  const repository = deps.repository || require('./repository');
  const prepared = prepareOutlineCreateInput(payload);

  if (!prepared.isValid) {
    const error = new Error('Invalid outline payload');
    error.code = 'INVALID_OUTLINE_PAYLOAD';
    error.status = 400;
    error.details = prepared.errors;
    throw error;
  }

  return repository.createOutlineForUser({
    userId: payload.userId,
    projectId: prepared.projectId,
    title: prepared.title,
    status: prepared.status,
    items: prepared.items,
  });
}

function buildNestedOutlineItems(items = []) {
  const itemMap = new Map();
  const roots = [];

  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  items.forEach((item) => {
    const nestedItem = itemMap.get(item.id);

    if (item.parent_item_id) {
      const parent = itemMap.get(item.parent_item_id);
      if (parent) {
        parent.children.push(nestedItem);
        return;
      }
    }

    roots.push(nestedItem);
  });

  return roots;
}

async function getOutlineById(payload, deps = {}) {
  const repository = deps.repository || require('./repository');
  const outline = await repository.findByIdForUser(payload.outlineId, payload.userId);

  if (!outline) {
    return null;
  }

  const items = await repository.findItemsByOutlineId(outline.id);

  return {
    ...outline,
    outline_items: buildNestedOutlineItems(items),
  };
}

async function getOutlineByProject(payload, deps = {}) {
  const repository = deps.repository || require('./repository');
  const outline = await repository.findCurrentByProjectForUser(payload.projectId, payload.userId);

  if (!outline) {
    return null;
  }

  const items = await repository.findItemsByOutlineId(outline.id);

  return {
    ...outline,
    outline_items: buildNestedOutlineItems(items),
  };
}

async function refreshOutline(payload, deps = {}) {
  const repository = deps.repository || require('./repository');
  const materialsRepository = deps.materialsRepository || require('../materials/repository');
  const projectsRepository = deps.projectsRepository || require('../projects/repository');

  const project = await projectsRepository.findByIdForUser(payload.projectId, payload.userId);
  if (!project) {
    return null;
  }

  const outline = await repository.findCurrentByProjectForUser(payload.projectId, payload.userId);
  if (!outline) {
    return null;
  }

  const materials = await materialsRepository.listByProjectForUser(payload.projectId, payload.userId);
  const generatedItems = flattenItems(buildOutlineItemsFromMaterials(materials));

  return repository.replaceOutlineItems(outline.id, generatedItems);
}

module.exports = {
  STATUS_VALUES,
  VALID_LEVELS,
  validateOutlineCreatePayload,
  flattenItems,
  normalizeCreatePayload,
  prepareOutlineCreateInput,
  buildOutlineItemsFromMaterials,
  buildNestedOutlineItems,
  createOutline,
  getOutlineById,
  getOutlineByProject,
  refreshOutline,
};
