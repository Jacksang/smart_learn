const {
  USER_WEIGHT_DEFAULT,
  SYSTEM_WEIGHT_DEFAULT,
  NEUTRAL_WEIGHT_DEFAULT,
  MIN_USER_MATERIAL_COUNT,
  MIN_USER_MATERIAL_TEXT_CHARS,
  BASE_KNOWLEDGE_FALLBACK_DECISION_POINT,
  BASE_KNOWLEDGE_FALLBACK_REASONS,
  BASE_KNOWLEDGE_FALLBACK_RESPONSE,
  USE_PROJECT_MATERIALS_RESPONSE,
  DEFAULT_WEIGHT_RULES,
  inferDefaultWeight,
  normalizeWeight,
  prepareMaterialCreateInput,
  prepareMaterialUpdateInput,
  decorateMaterialWithWeight,
  resolveMaterialText,
  isSystemGeneratedMaterial,
  isUserMaterialCandidate,
  evaluateBaseKnowledgeFallback,
  buildBaseKnowledgeFallbackDecision,
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

  test('extracts normalized text from extracted_text before raw_text aliases', () => {
    expect(
      resolveMaterialText({
        extracted_text: 'Normalized text',
        raw_text: 'Raw fallback',
      })
    ).toBe('Normalized text');
    expect(resolveMaterialText({ rawText: 'Camel fallback' })).toBe('Camel fallback');
  });

  test('identifies system-generated base knowledge materials for fallback exclusion', () => {
    expect(isSystemGeneratedMaterial({ source_kind: 'generated' })).toBe(true);
    expect(isSystemGeneratedMaterial({ materialType: 'base_knowledge' })).toBe(true);
    expect(isSystemGeneratedMaterial({ sourceKind: 'upload', materialType: 'pdf' })).toBe(false);
  });

  test('counts only active non-system materials with text as usable user material candidates', () => {
    expect(
      isUserMaterialCandidate({ sourceKind: 'upload', extracted_text: '  useful text  ', isActive: true })
    ).toBe(true);
    expect(isUserMaterialCandidate({ sourceKind: 'generated', extracted_text: 'system text' })).toBe(
      false
    );
    expect(isUserMaterialCandidate({ sourceKind: 'upload', extracted_text: '   ' })).toBe(false);
    expect(isUserMaterialCandidate({ sourceKind: 'upload', extracted_text: 'text', isActive: false })).toBe(
      false
    );
  });

  test('exposes explicit fallback reason and response contracts for MVP callers', () => {
    expect(BASE_KNOWLEDGE_FALLBACK_REASONS).toEqual({
      MISSING_USER_MATERIAL: 'missing_user_material',
      INSUFFICIENT_USER_MATERIAL: 'insufficient_user_material',
    });
    expect(BASE_KNOWLEDGE_FALLBACK_RESPONSE).toEqual({
      action: 'create_base_knowledge',
      decisionPoint: BASE_KNOWLEDGE_FALLBACK_DECISION_POINT,
      targetRoute: 'POST /api/projects/:projectId/materials/base-knowledge',
    });
    expect(USE_PROJECT_MATERIALS_RESPONSE).toEqual({
      action: 'use_project_materials',
      decisionPoint: BASE_KNOWLEDGE_FALLBACK_DECISION_POINT,
    });
  });

  test('triggers base knowledge fallback when no usable active user material exists', () => {
    expect(evaluateBaseKnowledgeFallback([])).toEqual({
      shouldFallback: true,
      reason: BASE_KNOWLEDGE_FALLBACK_REASONS.MISSING_USER_MATERIAL,
      usableUserMaterialCount: 0,
      totalUserTextChars: 0,
    });

    expect(
      evaluateBaseKnowledgeFallback([
        {
          sourceKind: 'generated',
          materialType: 'base_knowledge',
          extracted_text: 'system supplied notes',
        },
      ])
    ).toEqual({
      shouldFallback: true,
      reason: BASE_KNOWLEDGE_FALLBACK_REASONS.MISSING_USER_MATERIAL,
      usableUserMaterialCount: 0,
      totalUserTextChars: 0,
    });
  });

  test('triggers fallback when user material exists but is still too thin for MVP use', () => {
    const thinText = 'a'.repeat(MIN_USER_MATERIAL_TEXT_CHARS - 1);

    expect(
      evaluateBaseKnowledgeFallback([
        {
          sourceKind: 'upload',
          extracted_text: thinText,
          isActive: true,
        },
      ])
    ).toEqual({
      shouldFallback: true,
      reason: BASE_KNOWLEDGE_FALLBACK_REASONS.INSUFFICIENT_USER_MATERIAL,
      usableUserMaterialCount: MIN_USER_MATERIAL_COUNT,
      totalUserTextChars: MIN_USER_MATERIAL_TEXT_CHARS - 1,
    });
  });

  test('does not trigger fallback once active user material reaches the MVP sufficiency threshold', () => {
    const sufficientText = 'a'.repeat(MIN_USER_MATERIAL_TEXT_CHARS);

    expect(
      evaluateBaseKnowledgeFallback([
        {
          sourceKind: 'upload',
          extracted_text: sufficientText,
          isActive: true,
        },
      ])
    ).toEqual({
      shouldFallback: false,
      reason: null,
      usableUserMaterialCount: MIN_USER_MATERIAL_COUNT,
      totalUserTextChars: MIN_USER_MATERIAL_TEXT_CHARS,
    });
  });

  test('allows multiple active user materials to satisfy sufficiency in aggregate', () => {
    expect(
      evaluateBaseKnowledgeFallback([
        {
          source_kind: 'file',
          extracted_text: 'a'.repeat(120),
          is_active: true,
        },
        {
          sourceKind: 'manual',
          rawText: 'b'.repeat(80),
          isActive: true,
        },
      ])
    ).toEqual({
      shouldFallback: false,
      reason: null,
      usableUserMaterialCount: 2,
      totalUserTextChars: 200,
    });
  });

  test('returns an explicit fallback decision payload for downstream base-knowledge creation', () => {
    expect(
      buildBaseKnowledgeFallbackDecision([], { projectId: 'project-123' })
    ).toEqual({
      shouldFallback: true,
      reason: BASE_KNOWLEDGE_FALLBACK_REASONS.MISSING_USER_MATERIAL,
      usableUserMaterialCount: 0,
      totalUserTextChars: 0,
      decisionPoint: BASE_KNOWLEDGE_FALLBACK_DECISION_POINT,
      response: {
        ...BASE_KNOWLEDGE_FALLBACK_RESPONSE,
        projectId: 'project-123',
        reason: BASE_KNOWLEDGE_FALLBACK_REASONS.MISSING_USER_MATERIAL,
      },
    });
  });

  test('returns an explicit continue-with-project-materials decision payload once material is sufficient', () => {
    expect(
      buildBaseKnowledgeFallbackDecision(
        [
          {
            sourceKind: 'upload',
            extracted_text: 'a'.repeat(MIN_USER_MATERIAL_TEXT_CHARS),
            isActive: true,
          },
        ],
        { projectId: 'project-123' }
      )
    ).toEqual({
      shouldFallback: false,
      reason: null,
      usableUserMaterialCount: MIN_USER_MATERIAL_COUNT,
      totalUserTextChars: MIN_USER_MATERIAL_TEXT_CHARS,
      decisionPoint: BASE_KNOWLEDGE_FALLBACK_DECISION_POINT,
      response: {
        ...USE_PROJECT_MATERIALS_RESPONSE,
        projectId: 'project-123',
        reason: null,
      },
    });
  });

  test('rejects invalid numeric weights', () => {
    expect(() => normalizeWeight('abc', 1)).toThrow('Material weight must be a finite number');
    expect(() => normalizeWeight(-1, 1)).toThrow(
      'Material weight must be greater than or equal to 0'
    );
  });
});
