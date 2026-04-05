jest.mock('./service', () => ({
  getRecoveryRecommendation: jest.fn(),
}));

const { getRecoveryRecommendation } = require('./service');
const controller = require('./controller');

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
