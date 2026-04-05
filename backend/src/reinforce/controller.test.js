jest.mock('./service', () => ({
  getRecoveryRecommendation: jest.fn(),
  buildRecoverySummary: jest.fn(),
}));

const { getRecoveryRecommendation, buildRecoverySummary } = require('./service');
const controller = require('./controller');
const router = require('./router');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('reinforce controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers the protected recovery recommendation route', () => {
    const recommendationLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === '/projects/:projectId/sessions/:sessionId/reinforce/recommendation'
    );

    expect(recommendationLayer).toBeDefined();
    expect(recommendationLayer.route.methods.post).toBe(true);
    expect(recommendationLayer.route.stack).toHaveLength(2);
    expect(recommendationLayer.route.stack[1].handle).toBe(controller.getProjectSessionRecoveryRecommendation);
  });

  test('registers the protected recovery summary route', () => {
    const summaryLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === '/projects/:projectId/sessions/:sessionId/reinforce/summary'
    );

    expect(summaryLayer).toBeDefined();
    expect(summaryLayer.route.methods.post).toBe(true);
    expect(summaryLayer.route.stack).toHaveLength(2);
    expect(summaryLayer.route.stack[1].handle).toBe(controller.getProjectSessionRecoverySummary);
  });

  test('returns the current project/session recovery recommendation payload', async () => {
    const recommendation = {
      isStruggling: true,
      reason: 'Repeated incorrect attempts on the same topic indicate the learner is struggling.',
      reasonCode: 'repeated_incorrect_attempts',
      recommendedAction: 'fallback_easier_question',
      currentMode: 'quiz',
      targetOutlineItemId: 'topic-fractions',
      supportMessage: 'This concept is still wobbly, so let’s switch to a simpler version and lock in the foundation.',
      easierQuestionFallback: {
        questionId: 'question-easy-best',
        outlineItemId: 'topic-fractions',
        difficultyLevel: 'easy',
        questionType: 'true_false',
        prompt: 'Easy same-topic fallback',
      },
      signals: {
        sessionProgressStruggling: false,
        weakAreaStruggling: false,
        hasWeakAreaHit: false,
        confidenceDrop: false,
        lowConfidence: false,
        recentIncorrectStreak: 2,
        lastAttemptIncorrect: true,
      },
    };
    getRecoveryRecommendation.mockReturnValue(recommendation);

    const req = {
      params: {
        projectId: ' project-1 ',
        sessionId: ' session-1 ',
      },
      body: {
        projectId: 'project-1',
        sessionId: 'session-1',
        session: {
          mode: 'quiz',
          currentOutlineItemId: 'topic-fractions',
        },
        recentAttempts: [
          { outlineItemId: 'topic-fractions', isCorrect: false },
          { outlineItemId: 'topic-fractions', isCorrect: false },
        ],
        weakAreas: [],
        questionCandidates: [],
        currentQuestion: {
          id: 'question-hard-current',
        },
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectSessionRecoveryRecommendation(req, res, next);

    expect(getRecoveryRecommendation).toHaveBeenCalledWith({
      session: {
        mode: 'quiz',
        currentOutlineItemId: 'topic-fractions',
      },
      recentAttempts: [
        { outlineItemId: 'topic-fractions', isCorrect: false },
        { outlineItemId: 'topic-fractions', isCorrect: false },
      ],
      weakAreas: [],
      questionCandidates: [],
      currentQuestion: {
        id: 'question-hard-current',
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        projectId: 'project-1',
        sessionId: 'session-1',
        recommendation,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects invalid input before calling the recovery service', async () => {
    const req = {
      params: {
        projectId: 'project-1',
        sessionId: 'session-1',
      },
      body: {
        recentAttempts: {},
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectSessionRecoveryRecommendation(req, res, next);

    expect(getRecoveryRecommendation).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'recentAttempts must be an array when provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns the end-of-session recovery summary payload', async () => {
    const summary = {
      isStruggling: true,
      weakArea: {
        outlineItemId: 'topic-fractions',
        title: 'Fractions',
      },
      recoveryAction: 'fallback_easier_question',
      summaryMessage: 'We stepped down the difficulty on Fractions to lock in the foundation first.',
      nextStep: 'Try one easier check on Fractions, then move back up once it feels steadier.',
      recommendation: {
        isStruggling: true,
        reasonCode: 'repeated_incorrect_attempts',
      },
    };
    buildRecoverySummary.mockReturnValue(summary);

    const req = {
      params: {
        projectId: 'project-1',
        sessionId: 'session-1',
      },
      body: {
        session: {
          mode: 'quiz',
          currentOutlineItemId: 'topic-fractions',
        },
        recentAttempts: [
          { outlineItemId: 'topic-fractions', isCorrect: false },
          { outlineItemId: 'topic-fractions', isCorrect: false },
        ],
        weakAreas: [
          { outlineItemId: 'topic-fractions', title: 'Fractions' },
        ],
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectSessionRecoverySummary(req, res, next);

    expect(buildRecoverySummary).toHaveBeenCalledWith({
      session: {
        mode: 'quiz',
        currentOutlineItemId: 'topic-fractions',
      },
      recentAttempts: [
        { outlineItemId: 'topic-fractions', isCorrect: false },
        { outlineItemId: 'topic-fractions', isCorrect: false },
      ],
      weakAreas: [
        { outlineItemId: 'topic-fractions', title: 'Fractions' },
      ],
      questionCandidates: [],
      currentQuestion: {},
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        projectId: 'project-1',
        sessionId: 'session-1',
        summary,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks unauthorized access before returning a recommendation', async () => {
    const req = {
      params: {
        projectId: 'project-1',
        sessionId: 'session-1',
      },
      body: {},
      user: null,
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectSessionRecoveryRecommendation(req, res, next);

    expect(getRecoveryRecommendation).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
