const USER_WEIGHT_DEFAULT = 1.25;
const SYSTEM_WEIGHT_DEFAULT = 0.75;
const NEUTRAL_WEIGHT_DEFAULT = 1.0;

const USER_SOURCE_KINDS = new Set(['upload', 'file', 'text', 'manual', 'url']);
const SYSTEM_SOURCE_KINDS = new Set(['system', 'base_knowledge', 'generated']);

function roundWeight(value) {
  return Number.parseFloat(Number(value).toFixed(2));
}

function inferDefaultWeight({ sourceKind, materialType } = {}) {
  if (SYSTEM_SOURCE_KINDS.has(sourceKind) || materialType === 'base_knowledge') {
    return SYSTEM_WEIGHT_DEFAULT;
  }

  if (USER_SOURCE_KINDS.has(sourceKind)) {
    return USER_WEIGHT_DEFAULT;
  }

  return NEUTRAL_WEIGHT_DEFAULT;
}

function normalizeWeight(weight, fallback) {
  if (weight === undefined || weight === null || weight === '') {
    return fallback;
  }

  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight)) {
    throw new Error('Material weight must be a finite number');
  }

  if (numericWeight < 0) {
    throw new Error('Material weight must be greater than or equal to 0');
  }

  return roundWeight(numericWeight);
}

function prepareMaterialCreateInput(payload = {}) {
  const defaultWeight = inferDefaultWeight(payload);

  return {
    ...payload,
    weight: normalizeWeight(payload.weight, defaultWeight),
  };
}

function prepareMaterialUpdateInput(updates = {}, currentMaterial = null) {
  const fallbackWeight = currentMaterial
    ? normalizeWeight(currentMaterial.weight, inferDefaultWeight(currentMaterial))
    : NEUTRAL_WEIGHT_DEFAULT;

  if (!Object.prototype.hasOwnProperty.call(updates, 'weight')) {
    return { ...updates };
  }

  return {
    ...updates,
    weight: normalizeWeight(updates.weight, fallbackWeight),
  };
}

function decorateMaterialWithWeight(material) {
  if (!material) {
    return null;
  }

  const resolvedWeight = normalizeWeight(
    material.weight,
    inferDefaultWeight(material)
  );

  return {
    ...material,
    weight: resolvedWeight,
    priority:
      resolvedWeight >= USER_WEIGHT_DEFAULT
        ? 'high'
        : resolvedWeight <= SYSTEM_WEIGHT_DEFAULT
          ? 'low'
          : 'normal',
  };
}

module.exports = {
  USER_WEIGHT_DEFAULT,
  SYSTEM_WEIGHT_DEFAULT,
  NEUTRAL_WEIGHT_DEFAULT,
  inferDefaultWeight,
  normalizeWeight,
  prepareMaterialCreateInput,
  prepareMaterialUpdateInput,
  decorateMaterialWithWeight,
};
