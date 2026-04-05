const {
  SESSION_MODES,
  normalizeSessionMode,
  normalizeCurrentTopicId,
  buildSessionStateUpdates,
  mapSessionState,
} = require('./service');

describe('sessions service', () => {
  test('exposes the supported MVP learning session modes', () => {
    expect(SESSION_MODES).toEqual(['learn', 'review', 'quiz', 'reinforce']);
  });

  test('normalizes supported session modes consistently', () => {
    expect(normalizeSessionMode('  LEARN  ')).toBe('learn');
    expect(normalizeSessionMode('Review')).toBe('review');
    expect(normalizeSessionMode('quiz')).toBe('quiz');
    expect(normalizeSessionMode(' reinforce ')).toBe('reinforce');
  });

  test('rejects unsupported or empty session modes cleanly', () => {
    expect(() => normalizeSessionMode(' guided ')).toThrow('Unsupported session mode:  guided ');
    expect(() => normalizeSessionMode('   ')).toThrow('mode is required');
    expect(() => normalizeSessionMode(null, { fieldName: 'currentMode' })).toThrow('currentMode is required');
  });

  test('normalizes topic identifiers for storage and supports explicit clearing', () => {
    expect(normalizeCurrentTopicId('  topic-cells  ')).toBe('topic-cells');
    expect(normalizeCurrentTopicId('   ')).toBeNull();
    expect(normalizeCurrentTopicId(null)).toBeNull();
    expect(normalizeCurrentTopicId(undefined)).toBeUndefined();
  });

  test('builds repository-facing session state updates from mixed API field names', () => {
    expect(
      buildSessionStateUpdates({
        currentMode: ' REVIEW ',
        currentTopicId: '  topic-energy  ',
      })
    ).toEqual({
      mode: 'review',
      current_outline_item_id: 'topic-energy',
    });

    expect(
      buildSessionStateUpdates({
        mode: 'quiz',
        current_outline_item_id: ' topic-quiz-1 ',
      })
    ).toEqual({
      mode: 'quiz',
      current_outline_item_id: 'topic-quiz-1',
    });
  });

  test('preserves an explicit topic clear without requiring a mode change', () => {
    expect(
      buildSessionStateUpdates({
        currentOutlineItemId: '   ',
      })
    ).toEqual({
      current_outline_item_id: null,
    });
  });

  test('maps persisted session state into a stable resume-friendly shape', () => {
    expect(
      mapSessionState({
        id: 'session-1',
        projectId: 'project-1',
        mode: ' QUIZ ',
        status: 'active',
        currentOutlineItemId: '  topic-cells  ',
      })
    ).toEqual({
      id: 'session-1',
      projectId: 'project-1',
      mode: 'quiz',
      status: 'active',
      currentOutlineItemId: 'topic-cells',
      currentTopicId: 'topic-cells',
    });
  });

  test('returns null for an absent session state model', () => {
    expect(mapSessionState(null)).toBeNull();
  });
});
