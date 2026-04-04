const {
  USER_WEIGHT_DEFAULT,
  SYSTEM_WEIGHT_DEFAULT,
  NEUTRAL_WEIGHT_DEFAULT,
  DEFAULT_WEIGHT_RULES,
  inferDefaultWeight,
  normalizeWeight,
  prepareMaterialCreateInput,
  prepareMaterialUpdateInput,
  decorateMaterialWithWeight,
} = require('./service');

describe('materials service weighting', () => {
  test('exposes explicit MVP default weight rules for each material origin bucket', () => {
    expect(DEFAULT_WEIGHT_RULES).toEqual({
      userProvided: {
        defaultWeight: USER_WEIGHT_DEFAULT,
        priority: 'high',
        sourceKinds: ['upload', 'file', 'text', 'manual', 'url'],
      },
      systemGenerated: {
        defaultWeight: SYSTEM_WEIGHT_DEFAULT,
        priority: 'low',
        sourceKinds: ['system', 'base_knowledge', 'generated'],
        materialTypes: ['base_knowledge'],
      },
      unknown: {
        defaultWeight: NEUTRAL_WEIGHT_DEFAULT,
        priority: 'normal',
      },
    });
  });

  test('assigns a higher default weight to user-provided materials', () => {
    expect(inferDefaultWeight({ sourceKind: 'upload' })).toBe(USER_WEIGHT_DEFAULT);
    expect(inferDefaultWeight({ sourceKind: 'text' })).toBe(USER_WEIGHT_DEFAULT);
  });

  test('assigns a lower default weight to system-generated base knowledge', () => {
    expect(inferDefaultWeight({ sourceKind: 'system' })).toBe(SYSTEM_WEIGHT_DEFAULT);
    expect(inferDefaultWeight({ materialType: 'base_knowledge' })).toBe(SYSTEM_WEIGHT_DEFAULT);
  });

  test('falls back to neutral weight for unknown material origins', () => {
    expect(inferDefaultWeight({ sourceKind: 'unknown' })).toBe(NEUTRAL_WEIGHT_DEFAULT);
  });

  test('normalizes explicit create-time weight values', () => {
    expect(prepareMaterialCreateInput({ sourceKind: 'upload', weight: '1.236' }).weight).toBe(1.24);
  });

  test('uses inferred defaults when create-time weight is omitted', () => {
    expect(prepareMaterialCreateInput({ sourceKind: 'upload' }).weight).toBe(USER_WEIGHT_DEFAULT);
    expect(prepareMaterialCreateInput({ sourceKind: 'generated' }).weight).toBe(SYSTEM_WEIGHT_DEFAULT);
  });

  test('treats empty create-time weight inputs as missing and preserves low-priority defaults', () => {
    expect(prepareMaterialCreateInput({ sourceKind: 'generated', weight: '' }).weight).toBe(
      SYSTEM_WEIGHT_DEFAULT
    );
    expect(prepareMaterialCreateInput({ materialType: 'base_knowledge', weight: null }).weight).toBe(
      SYSTEM_WEIGHT_DEFAULT
    );
  });

  test('keeps existing material weight when update input omits weight entirely', () => {
    expect(
      prepareMaterialUpdateInput(
        { title: 'Still prioritized by existing material' },
        { sourceKind: 'system', weight: 0.4 }
      )
    ).toEqual({ title: 'Still prioritized by existing material' });
  });

  test('falls back to current low-priority weight when update input passes an empty weight value', () => {
    expect(
      prepareMaterialUpdateInput(
        { weight: '' },
        { sourceKind: 'generated', materialType: 'base_knowledge', weight: 0.5 }
      )
    ).toEqual({ weight: 0.5 });
  });

  test('normalizes update-time weight values without altering unrelated fields', () => {
    expect(
      prepareMaterialUpdateInput(
        { title: 'Updated title', weight: '0.555' },
        { sourceKind: 'system', weight: 0.75 }
      )
    ).toEqual({ title: 'Updated title', weight: 0.56 });
  });

  test('adds derived priority for downstream weighting consumers', () => {
    expect(decorateMaterialWithWeight({ sourceKind: 'upload' }).priority).toBe('high');
    expect(decorateMaterialWithWeight({ sourceKind: 'generated' }).priority).toBe('low');
    expect(decorateMaterialWithWeight({ weight: 1.0 }).priority).toBe('normal');
  });

  test('treats missing materials and missing low-priority weights safely for downstream consumers', () => {
    expect(decorateMaterialWithWeight(null)).toBeNull();
    expect(decorateMaterialWithWeight({ materialType: 'base_knowledge', weight: '' })).toEqual({
      materialType: 'base_knowledge',
      weight: SYSTEM_WEIGHT_DEFAULT,
      priority: 'low',
    });
  });

  test('rejects invalid numeric weights', () => {
    expect(() => normalizeWeight('abc', 1)).toThrow('Material weight must be a finite number');
    expect(() => normalizeWeight(-1, 1)).toThrow(
      'Material weight must be greater than or equal to 0'
    );
  });
});
