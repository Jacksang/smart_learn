jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const answersController = require('../answers/controller');
const progressController = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function createProgressFlowQueryRouter() {
  const state = {
    project: {
      id: 'project-1',
      user_id: 'user-1',
    },
    questions: [
      {
        id: 'question-1',
        project_id: 'project-1',
        outline_item_id: 'topic-cells',
        outline_item_title: 'Cell Structure',
        outline_item_level: 2,
        parent_item_id: null,
        order_index: 1,
        batch_no: 1,
        position_in_batch: 1,
        question_type: 'multiple_choice',
        difficulty_level: 'medium',
        prompt: 'Which structure controls what enters and leaves the cell?',
        options: ['Cell membrane', 'Nucleus', 'Mitochondria', 'Ribosome'],
        correct_answer: { value: 'Cell membrane' },
        explanation: 'The cell membrane regulates what enters and leaves the cell.',
        generation_source: 'mock_outline_mvp',
        status: 'active',
        created_at: '2026-04-05T00:00:00Z',
        updated_at: '2026-04-05T00:00:00Z',
      },
      {
        id: 'question-2',
        project_id: 'project-1',
        outline_item_id: 'topic-energy',
        outline_item_title: 'Cell Energy',
        outline_item_level: 2,
        parent_item_id: null,
        order_index: 2,
        batch_no: 1,
        position_in_batch: 2,
        question_type: 'multiple_choice',
        difficulty_level: 'medium',
        prompt: 'Which organelle produces most of the cell\'s ATP?',
        options: ['Nucleus', 'Golgi apparatus', 'Mitochondria', 'Lysosome'],
        correct_answer: { value: 'Mitochondria' },
        explanation: 'Mitochondria generate most of the cell\'s ATP.',
        generation_source: 'mock_outline_mvp',
        status: 'active',
        created_at: '2026-04-05T00:00:00Z',
        updated_at: '2026-04-05T00:00:00Z',
      },
    ],
    attempts: [],
    progressSnapshots: [],
    snapshotCounter: 1,
  };

  function findQuestion(questionId) {
    return state.questions.find((question) => question.id === questionId);
  }

  function computeProjectAggregate(projectId) {
    const questions = state.questions.filter((question) => question.project_id === projectId);
    const attempts = state.attempts.filter((attempt) => attempt.project_id === projectId);
    const recentAttempts = attempts
      .slice()
      .sort((left, right) => {
        if (left.answered_at !== right.answered_at) {
          return right.answered_at.localeCompare(left.answered_at);
        }
        if (left.created_at !== right.created_at) {
          return right.created_at.localeCompare(left.created_at);
        }
        return right.id.localeCompare(left.id);
      })
      .slice(0, 5);

    const averageScore = attempts.length > 0
      ? Number((attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts.length).toFixed(2))
      : null;

    return {
      project_id: projectId,
      total_question_count: questions.length,
      answered_question_count: new Set(attempts.map((attempt) => attempt.question_id)).size,
      total_attempt_count: attempts.length,
      correct_attempt_count: attempts.filter((attempt) => attempt.is_correct === true).length,
      average_score: averageScore,
      recent_attempt_count: recentAttempts.length,
      recent_correct_attempt_count: recentAttempts.filter((attempt) => attempt.is_correct === true).length,
    };
  }

  function computeTopicAggregates(projectId) {
    const questions = state.questions.filter((question) => question.project_id === projectId);
    const outlineItemIds = [...new Set(questions.map((question) => question.outline_item_id).filter(Boolean))];

    return outlineItemIds.map((outlineItemId) => {
      const topicQuestions = questions.filter((question) => question.outline_item_id === outlineItemId);
      const topicAttempts = state.attempts.filter((attempt) => {
        const question = findQuestion(attempt.question_id);
        return attempt.project_id === projectId && question?.outline_item_id === outlineItemId;
      });
      const recentAttempts = topicAttempts
        .slice()
        .sort((left, right) => {
          if (left.answered_at !== right.answered_at) {
            return right.answered_at.localeCompare(left.answered_at);
          }
          if (left.created_at !== right.created_at) {
            return right.created_at.localeCompare(left.created_at);
          }
          return right.id.localeCompare(left.id);
        })
        .slice(0, 5);
      const firstQuestion = topicQuestions[0];
      const averageScore = topicAttempts.length > 0
        ? Number((topicAttempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / topicAttempts.length).toFixed(2))
        : null;

      return {
        project_id: projectId,
        outline_item_id: outlineItemId,
        outline_item_title: firstQuestion.outline_item_title,
        outline_item_level: firstQuestion.outline_item_level,
        parent_item_id: firstQuestion.parent_item_id,
        order_index: firstQuestion.order_index,
        total_question_count: topicQuestions.length,
        answered_question_count: new Set(topicAttempts.map((attempt) => attempt.question_id)).size,
        total_attempt_count: topicAttempts.length,
        correct_attempt_count: topicAttempts.filter((attempt) => attempt.is_correct === true).length,
        average_score: averageScore,
        recent_attempt_count: recentAttempts.length,
        recent_correct_attempt_count: recentAttempts.filter((attempt) => attempt.is_correct === true).length,
      };
    });
  }

  function createSnapshotRow({ projectId, snapshot, outlineItemId = null }) {
    const row = {
      id: `snapshot-${state.snapshotCounter++}`,
      project_id: projectId,
      outline_item_id: outlineItemId,
      snapshot_type: snapshot.snapshot_type,
      completion_percent: snapshot.completion_percent,
      mastery_score: snapshot.mastery_score,
      progress_state: snapshot.progress_state,
      weak_areas: snapshot.weak_areas ?? [],
      strength_areas: snapshot.strength_areas ?? [],
      summary_text: snapshot.summary_text ?? null,
      created_at: `2026-04-05T01:00:0${state.snapshotCounter}Z`,
    };
    state.progressSnapshots.push(row);
    return row;
  }

  return async (text, params) => {
    if (text.includes('FROM questions q') && text.includes('WHERE q.id = $1 AND q.project_id = $2 AND p.user_id = $3')) {
      const [questionId, projectId, userId] = params;
      const question = findQuestion(questionId);
      if (question && question.project_id === projectId && userId === state.project.user_id) {
        return { rows: [question] };
      }

      return { rows: [] };
    }

    if (text.includes('SELECT COALESCE(MAX(attempt_no), 0)::int + 1 AS next_attempt_no')) {
      const [projectId, questionId] = params;
      const attempts = state.attempts.filter(
        (attempt) => attempt.project_id === projectId && attempt.question_id === questionId
      );
      const maxAttemptNo = attempts.reduce((max, attempt) => Math.max(max, attempt.attempt_no), 0);
      return { rows: [{ next_attempt_no: maxAttemptNo + 1 }] };
    }

    if (text.includes('INSERT INTO answer_attempts')) {
      const [questionId, projectId, sessionId, rawUserAnswer, isCorrect, score, feedbackText, attemptNo, answeredAt] = params;
      const attempt = {
        id: `attempt-${state.attempts.length + 1}`,
        question_id: questionId,
        project_id: projectId,
        session_id: sessionId,
        user_answer: JSON.parse(rawUserAnswer),
        is_correct: isCorrect,
        score,
        feedback_text: feedbackText,
        attempt_no: attemptNo,
        answered_at: answeredAt || `2026-04-05T00:00:0${attemptNo}Z`,
        created_at: `2026-04-05T00:00:0${attemptNo}Z`,
      };
      state.attempts.push(attempt);
      return { rows: [attempt] };
    }

    if (
      text.includes('COUNT(DISTINCT q.id)::int AS total_question_count')
      && text.includes('FROM owned_project op')
      && !text.includes('FROM outline_item_scope scope')
    ) {
      const [projectId, userId] = params;
      if (projectId !== state.project.id || userId !== state.project.user_id) {
        return { rows: [] };
      }

      return { rows: [computeProjectAggregate(projectId)] };
    }

    if (text.includes('FROM outline_item_scope scope') && text.includes('ORDER BY scope.order_index ASC, scope.outline_item_id ASC')) {
      const [projectId, userId] = params;
      if (projectId !== state.project.id || userId !== state.project.user_id) {
        return { rows: [] };
      }

      return { rows: computeTopicAggregates(projectId) };
    }

    if (text.includes('INSERT INTO progress_snapshots') && text.includes('SELECT') && text.includes('NULL,')) {
      const [projectId, userId, snapshotType, completionPercent, masteryScore, progressState, weakAreasJson, strengthAreasJson, summaryText] = params;
      if (projectId !== state.project.id || userId !== state.project.user_id) {
        return { rows: [] };
      }

      const row = createSnapshotRow({
        projectId,
        snapshot: {
          snapshot_type: snapshotType,
          completion_percent: completionPercent,
          mastery_score: masteryScore,
          progress_state: progressState,
          weak_areas: JSON.parse(weakAreasJson),
          strength_areas: JSON.parse(strengthAreasJson),
          summary_text: summaryText,
        },
      });

      return { rows: [row] };
    }

    if (text.includes('jsonb_to_recordset($3::jsonb)') && text.includes('ORDER BY sr.outline_item_id ASC')) {
      const [projectId, userId, topicSnapshotsJson] = params;
      if (projectId !== state.project.id || userId !== state.project.user_id) {
        return { rows: [] };
      }

      const topicSnapshots = JSON.parse(topicSnapshotsJson);
      const rows = topicSnapshots.map((snapshot) => createSnapshotRow({
        projectId,
        outlineItemId: snapshot.outline_item_id,
        snapshot,
      }));

      return { rows };
    }

    if (text.includes('FROM owned_project op') && text.includes('WHERE ps.outline_item_id IS NULL')) {
      const [projectId, userId] = params;
      if (projectId !== state.project.id || userId !== state.project.user_id) {
        return { rows: [] };
      }

      const row = state.progressSnapshots
        .filter((snapshot) => snapshot.project_id === projectId && snapshot.outline_item_id === null)
        .slice()
        .sort((left, right) => {
          if (left.created_at !== right.created_at) {
            return right.created_at.localeCompare(left.created_at);
          }
          return right.id.localeCompare(left.id);
        })[0];

      return { rows: row ? [row] : [] };
    }

    if (text.includes('FROM owned_project op') && text.includes('WHERE ps.outline_item_id = $2')) {
      const [projectId, outlineItemId, userId] = params;
      if (projectId !== state.project.id || userId !== state.project.user_id) {
        return { rows: [] };
      }

      const row = state.progressSnapshots
        .filter((snapshot) => snapshot.project_id === projectId && snapshot.outline_item_id === outlineItemId)
        .slice()
        .sort((left, right) => {
          if (left.created_at !== right.created_at) {
            return right.created_at.localeCompare(left.created_at);
          }
          return right.id.localeCompare(left.id);
        })[0];

      return { rows: row ? [row] : [] };
    }

    throw new Error(`Unexpected query: ${text} :: ${JSON.stringify(params)}`);
  };
}

describe('progress flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockImplementation(createProgressFlowQueryRouter());
  });

  test('refreshes progress after answer activity and retrieves project, topic, and weak-area data from persisted snapshots', async () => {
    const next = jest.fn();

    const firstSubmitRes = createRes();
    await answersController.submitProjectAnswer(
      {
        params: { projectId: 'project-1', questionId: 'question-1' },
        body: {
          sessionId: 'session-progress',
          userAnswer: { value: 'Nucleus' },
        },
        user: { id: 'user-1' },
      },
      firstSubmitRes,
      next
    );

    const secondSubmitRes = createRes();
    await answersController.submitProjectAnswer(
      {
        params: { projectId: 'project-1', questionId: 'question-2' },
        body: {
          sessionId: 'session-progress',
          userAnswer: { value: 'Mitochondria' },
        },
        user: { id: 'user-1' },
      },
      secondSubmitRes,
      next
    );

    const refreshRes = createRes();
    await progressController.refreshProjectProgress(
      {
        params: { projectId: 'project-1' },
        user: { id: 'user-1' },
      },
      refreshRes,
      next
    );

    const projectProgressRes = createRes();
    await progressController.getProjectProgress(
      {
        params: { projectId: 'project-1' },
        user: { id: 'user-1' },
      },
      projectProgressRes,
      next
    );

    const weakTopicProgressRes = createRes();
    await progressController.getTopicProgress(
      {
        params: { projectId: 'project-1', itemId: 'topic-cells' },
        user: { id: 'user-1' },
      },
      weakTopicProgressRes,
      next
    );

    const weakAreasRes = createRes();
    await progressController.getProjectWeakAreas(
      {
        params: { projectId: 'project-1' },
        user: { id: 'user-1' },
      },
      weakAreasRes,
      next
    );

    expect(firstSubmitRes.status).toHaveBeenCalledWith(201);
    expect(secondSubmitRes.status).toHaveBeenCalledWith(201);

    expect(refreshRes.status).toHaveBeenCalledWith(200);
    expect(refreshRes.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      projectSnapshot: {
        id: 'snapshot-1',
        projectId: 'project-1',
        outlineItemId: null,
        snapshotType: 'project',
        completionPercent: 100,
        masteryScore: 50,
        progressState: 'in_progress',
        weakAreas: [
          {
            outlineItemId: 'topic-cells',
            title: 'Cell Structure',
            masteryScore: 0,
            completionPercent: 100,
            progressState: 'struggling',
            answeredQuestionCount: 1,
            totalQuestionCount: 1,
            totalAttemptCount: 1,
          },
        ],
        strengthAreas: [
          {
            outlineItemId: 'topic-energy',
            title: 'Cell Energy',
            masteryScore: 100,
            completionPercent: 100,
            progressState: 'mastered',
            answeredQuestionCount: 1,
            totalQuestionCount: 1,
            totalAttemptCount: 1,
          },
        ],
        summaryText: 'Project is in progress with 100% completion and 50% mastery. Weak areas: Cell Structure. Strength areas: Cell Energy.',
        createdAt: '2026-04-05T01:00:02Z',
      },
      topicSnapshots: [
        {
          id: 'snapshot-2',
          projectId: 'project-1',
          outlineItemId: 'topic-cells',
          snapshotType: 'topic',
          completionPercent: 100,
          masteryScore: 0,
          progressState: 'struggling',
          weakAreas: [],
          strengthAreas: [],
          summaryText: null,
          createdAt: '2026-04-05T01:00:03Z',
        },
        {
          id: 'snapshot-3',
          projectId: 'project-1',
          outlineItemId: 'topic-energy',
          snapshotType: 'topic',
          completionPercent: 100,
          masteryScore: 100,
          progressState: 'mastered',
          weakAreas: [],
          strengthAreas: [],
          summaryText: null,
          createdAt: '2026-04-05T01:00:04Z',
        },
      ],
      weakAreas: [
        {
          outlineItemId: 'topic-cells',
          title: 'Cell Structure',
          masteryScore: 0,
          completionPercent: 100,
          progressState: 'struggling',
          answeredQuestionCount: 1,
          totalQuestionCount: 1,
          totalAttemptCount: 1,
        },
      ],
      strengthAreas: [
        {
          outlineItemId: 'topic-energy',
          title: 'Cell Energy',
          masteryScore: 100,
          completionPercent: 100,
          progressState: 'mastered',
          answeredQuestionCount: 1,
          totalQuestionCount: 1,
          totalAttemptCount: 1,
        },
      ],
    });

    expect(projectProgressRes.status).toHaveBeenCalledWith(200);
    expect(projectProgressRes.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      progressSnapshot: {
        id: 'snapshot-1',
        projectId: 'project-1',
        outlineItemId: null,
        snapshotType: 'project',
        completionPercent: 100,
        masteryScore: 50,
        progressState: 'in_progress',
        weakAreas: [
          {
            outlineItemId: 'topic-cells',
            title: 'Cell Structure',
            masteryScore: 0,
            completionPercent: 100,
            progressState: 'struggling',
            answeredQuestionCount: 1,
            totalQuestionCount: 1,
            totalAttemptCount: 1,
          },
        ],
        strengthAreas: [
          {
            outlineItemId: 'topic-energy',
            title: 'Cell Energy',
            masteryScore: 100,
            completionPercent: 100,
            progressState: 'mastered',
            answeredQuestionCount: 1,
            totalQuestionCount: 1,
            totalAttemptCount: 1,
          },
        ],
        summaryText: 'Project is in progress with 100% completion and 50% mastery. Weak areas: Cell Structure. Strength areas: Cell Energy.',
        createdAt: '2026-04-05T01:00:02Z',
      },
    });

    expect(weakTopicProgressRes.status).toHaveBeenCalledWith(200);
    expect(weakTopicProgressRes.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      itemId: 'topic-cells',
      progressSnapshot: {
        id: 'snapshot-2',
        projectId: 'project-1',
        outlineItemId: 'topic-cells',
        snapshotType: 'topic',
        completionPercent: 100,
        masteryScore: 0,
        progressState: 'struggling',
        weakAreas: [],
        strengthAreas: [],
        summaryText: null,
        createdAt: '2026-04-05T01:00:03Z',
      },
    });

    expect(weakAreasRes.status).toHaveBeenCalledWith(200);
    expect(weakAreasRes.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      weakAreas: [
        {
          outlineItemId: 'topic-cells',
          title: 'Cell Structure',
          masteryScore: 0,
          completionPercent: 100,
          progressState: 'struggling',
          answeredQuestionCount: 1,
          totalQuestionCount: 1,
          totalAttemptCount: 1,
        },
      ],
      summaryText: 'Project is in progress with 100% completion and 50% mastery. Weak areas: Cell Structure. Strength areas: Cell Energy.',
    });

    expect(next).not.toHaveBeenCalled();
  });
});
