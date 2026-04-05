const {
  detectStruggleSignals,
  chooseRecoveryAction,
  getRecoveryRecommendation,
} = require('./service');

describe('reinforce service', () => {
  test('flags repeated incorrect attempts on the same topic and recommends an easier fallback', () => {
    const recommendation = getRecoveryRecommendation({
      session: {
        mode: 'quiz',
        currentOutlineItemId: 'topic-fractions',
      },
      recentAttempts: [
        { outlineItemId: 'topic-fractions', isCorrect: false },
        { outlineItemId: 'topic-fractions', isCorrect: false },
      ],
      weakAreas: [],
    });

    expect(recommendation).toEqual({
      isStruggling: true,
      reason: 'Repeated incorrect attempts on the same topic indicate the learner is struggling.',
      reasonCode: 'repeated_incorrect_attempts',
      recommendedAction: 'fallback_easier_question',
      currentMode: 'quiz',
      targetOutlineItemId: 'topic-fractions',
      supportMessage: 'This concept is still wobbly, so let’s switch to a simpler version and lock in the foundation.',
      signals: {
        sessionProgressStruggling: false,
        weakAreaStruggling: false,
        hasWeakAreaHit: false,
        confidenceDrop: false,
        lowConfidence: false,
        recentIncorrectStreak: 2,
        lastAttemptIncorrect: true,
      },
    });
  });

  test('treats an incorrect attempt on an existing weak area as struggle and recommends review in quiz mode', () => {
    const recommendation = getRecoveryRecommendation({
      session: {
        mode: 'quiz',
        currentOutlineItemId: 'topic-cells',
      },
      recentAttempts: [
        { outlineItemId: 'topic-cells', isCorrect: true },
        { outlineItemId: 'topic-cells', isCorrect: false },
      ],
      weakAreas: [
        { outlineItemId: 'topic-cells', progressState: 'in_progress', title: 'Cells' },
      ],
    });

    expect(recommendation.isStruggling).toBe(true);
    expect(recommendation.reasonCode).toBe('incorrect_attempt_on_weak_area');
    expect(recommendation.recommendedAction).toBe('review');
    expect(recommendation.supportMessage).toBe('Let’s slow it down and isolate the key idea before we push ahead.');
  });

  test('detects confidence-drop struggle signals and recommends reinforce mode', () => {
    const recommendation = getRecoveryRecommendation({
      session: {
        mode: 'review',
        currentOutlineItemId: 'topic-photosynthesis',
        priorConfidence: 0.8,
        confidence: 0.35,
      },
      recentAttempts: [
        { outlineItemId: 'topic-photosynthesis', isCorrect: true },
      ],
      weakAreas: [],
    });

    expect(recommendation.isStruggling).toBe(true);
    expect(recommendation.reasonCode).toBe('confidence_drop');
    expect(recommendation.recommendedAction).toBe('reinforce');
    expect(recommendation.supportMessage).toBe('Let’s lower the pressure and get one small win first.');
  });

  test('inherits an existing struggling progress state even without fresh misses', () => {
    const struggleSignals = detectStruggleSignals({
      session: {
        mode: 'learn',
        currentOutlineItemId: 'topic-decimals',
      },
      recentAttempts: [],
      weakAreas: [
        { outlineItemId: 'topic-decimals', progressState: 'struggling', title: 'Decimals' },
      ],
    });

    expect(struggleSignals.isStruggling).toBe(true);
    expect(struggleSignals.reasonCode).toBe('progress_state_struggling');
    expect(chooseRecoveryAction(struggleSignals)).toBe('reinforce');
  });

  test('does not trigger false recovery when recent performance is stable', () => {
    const recommendation = getRecoveryRecommendation({
      session: {
        mode: 'learn',
        currentOutlineItemId: 'topic-addition',
        priorConfidence: 0.7,
        confidence: 0.68,
      },
      recentAttempts: [
        { outlineItemId: 'topic-addition', isCorrect: true },
        { outlineItemId: 'topic-addition', isCorrect: true },
        { outlineItemId: 'topic-other', isCorrect: false },
      ],
      weakAreas: [],
    });

    expect(recommendation).toEqual({
      isStruggling: false,
      reason: 'No strong struggle signal was detected.',
      reasonCode: 'stable',
      recommendedAction: 'continue',
      currentMode: 'learn',
      targetOutlineItemId: 'topic-addition',
      supportMessage: 'Nice work — you can keep building from here.',
      signals: {
        sessionProgressStruggling: false,
        weakAreaStruggling: false,
        hasWeakAreaHit: false,
        confidenceDrop: false,
        lowConfidence: false,
        recentIncorrectStreak: 0,
        lastAttemptIncorrect: false,
      },
    });
  });

  test('handles missing topic context deterministically by using recent attempts as-is', () => {
    const recommendation = getRecoveryRecommendation({
      session: {
        mode: 'quiz',
      },
      recentAttempts: [
        { isCorrect: false },
        { isCorrect: false },
      ],
      weakAreas: [],
    });

    expect(recommendation.isStruggling).toBe(true);
    expect(recommendation.targetOutlineItemId).toBe(null);
    expect(recommendation.recommendedAction).toBe('fallback_easier_question');
  });
});
