const {
  DEFERRED_QUESTION_STATUSES,
  normalizeDeferredQuestionStatus,
  validateDeferredQuestionTransition,
  buildDeferredQuestionStateUpdate,
} = require('./service');

describe('deferred questions service', () => {
  test('exposes the supported MVP deferred-question statuses', () => {
    expect(DEFERRED_QUESTION_STATUSES).toEqual(['deferred', 'revisited', 'resolved']);
  });

  test('normalizes supported statuses and the parked alias consistently', () => {
    expect(normalizeDeferredQuestionStatus(' DEFERRED ')).toBe('deferred');
    expect(normalizeDeferredQuestionStatus('revisited')).toBe('revisited');
    expect(normalizeDeferredQuestionStatus('Resolved')).toBe('resolved');
    expect(normalizeDeferredQuestionStatus(' parked ')).toBe('deferred');
  });

  test('rejects unsupported or empty statuses cleanly', () => {
    expect(() => normalizeDeferredQuestionStatus(' dismissed ')).toThrow(
      'Unsupported deferred question status:  dismissed '
    );
    expect(() => normalizeDeferredQuestionStatus('   ')).toThrow('status is required');
    expect(() => normalizeDeferredQuestionStatus(null, { fieldName: 'nextStatus' })).toThrow(
      'nextStatus is required'
    );
  });

  test('allows forward-only revisit and resolution transitions', () => {
    expect(validateDeferredQuestionTransition('deferred', 'revisited')).toBe('revisited');
    expect(validateDeferredQuestionTransition('deferred', 'resolved')).toBe('resolved');
    expect(validateDeferredQuestionTransition('revisited', 'resolved')).toBe('resolved');
    expect(validateDeferredQuestionTransition('resolved', 'resolved')).toBe('resolved');
  });

  test('rejects backwards transitions once a question has progressed', () => {
    expect(() => validateDeferredQuestionTransition('revisited', 'deferred')).toThrow(
      'Deferred question cannot transition from revisited to deferred'
    );
    expect(() => validateDeferredQuestionTransition('resolved', 'revisited')).toThrow(
      'Deferred question cannot transition from resolved to revisited'
    );
  });

  test('builds repository-facing state updates for revisit and resolution flows', () => {
    expect(
      buildDeferredQuestionStateUpdate({
        currentStatus: 'deferred',
        status: ' parked ',
        briefResponse: '  We will come back after finishing limits.  ',
        now: '2026-04-05T08:30:00.000Z',
      })
    ).toEqual({
      status: 'deferred',
      brief_response: 'We will come back after finishing limits.',
      resolved_at: null,
    });

    expect(
      buildDeferredQuestionStateUpdate({
        currentStatus: 'deferred',
        status: 'revisited',
        briefResponse: '  Revisiting this now. ',
        now: '2026-04-05T08:31:00.000Z',
      })
    ).toEqual({
      status: 'revisited',
      brief_response: 'Revisiting this now.',
      resolved_at: null,
    });

    expect(
      buildDeferredQuestionStateUpdate({
        currentStatus: 'revisited',
        status: 'resolved',
        briefResponse: ' Covered after the recap. ',
        now: '2026-04-05T08:32:00.000Z',
      })
    ).toEqual({
      status: 'resolved',
      brief_response: 'Covered after the recap.',
      resolved_at: '2026-04-05T08:32:00.000Z',
    });
  });

  test('preserves an explicit resolved timestamp when resolving', () => {
    expect(
      buildDeferredQuestionStateUpdate({
        currentStatus: 'revisited',
        status: 'resolved',
        resolvedAt: ' 2026-04-05T08:45:00.000Z ',
      })
    ).toEqual({
      status: 'resolved',
      resolved_at: '2026-04-05T08:45:00.000Z',
    });
  });
});
