jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const answersController = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function createAnswersFlowQueryRouter() {
  const state = {
    project: {
      id: 'project-1',
      user_id: 'user-1',
    },
    question: {
      id: 'question-1',
      project_id: 'project-1',
      outline_item_id: 'topic-cells',
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
    attempts: [],
  };

  return async (text, params) => {
    if (text.includes('FROM questions q') && text.includes('WHERE q.id = $1 AND q.project_id = $2 AND p.user_id = $3')) {
      const [questionId, projectId, userId] = params;
      if (
        questionId === state.question.id
        && projectId === state.question.project_id
        && userId === state.project.user_id
      ) {
        return { rows: [state.question] };
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
        id: `attempt-${attemptNo}`,
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
      text.includes('FROM answer_attempts aa')
      && text.includes('WHERE aa.project_id = $1')
      && text.includes('AND aa.question_id = $2')
      && text.includes('ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.attempt_no DESC')
    ) {
      const [projectId, questionId, userId] = params;
      if (userId !== state.project.user_id) {
        return { rows: [] };
      }

      const rows = state.attempts
        .filter((attempt) => attempt.project_id === projectId && attempt.question_id === questionId)
        .slice()
        .sort((left, right) => {
          if (left.answered_at !== right.answered_at) {
            return right.answered_at.localeCompare(left.answered_at);
          }
          if (left.created_at !== right.created_at) {
            return right.created_at.localeCompare(left.created_at);
          }
          return right.attempt_no - left.attempt_no;
        })
        .map((attempt) => ({
          ...attempt,
          question_prompt: state.question.prompt,
          question_type: state.question.question_type,
          outline_item_id: state.question.outline_item_id,
        }));

      return { rows };
    }

    if (
      text.includes('FROM answer_attempts aa')
      && text.includes('INNER JOIN learning_projects p ON p.id = aa.project_id AND p.user_id = $2')
      && text.includes('ORDER BY aa.answered_at DESC, aa.created_at DESC, aa.id DESC')
      && text.includes('LIMIT $3')
    ) {
      const [projectId, userId, limit] = params;
      if (userId !== state.project.user_id) {
        return { rows: [] };
      }

      const rows = state.attempts
        .filter((attempt) => attempt.project_id === projectId)
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
        .slice(0, limit)
        .map((attempt) => ({
          ...attempt,
          question_prompt: state.question.prompt,
          question_type: state.question.question_type,
          outline_item_id: state.question.outline_item_id,
        }));

      return { rows };
    }

    throw new Error(`Unexpected query: ${text} :: ${JSON.stringify(params)}`);
  };
}

describe('answers flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockImplementation(createAnswersFlowQueryRouter());
  });

  test('submits answers and exposes the persisted attempts through question and project history endpoints', async () => {
    const next = jest.fn();

    const firstSubmitRes = createRes();
    await answersController.submitProjectAnswer(
      {
        params: { projectId: 'project-1', questionId: 'question-1' },
        body: {
          sessionId: 'session-1',
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
        params: { projectId: 'project-1', questionId: 'question-1' },
        body: {
          sessionId: 'session-1',
          userAnswer: { value: 'Cell membrane' },
        },
        user: { id: 'user-1' },
      },
      secondSubmitRes,
      next
    );

    const questionHistoryRes = createRes();
    await answersController.listQuestionAnswers(
      {
        params: { projectId: 'project-1', questionId: 'question-1' },
        query: {},
        user: { id: 'user-1' },
      },
      questionHistoryRes,
      next
    );

    const projectHistoryRes = createRes();
    await answersController.listProjectAnswerHistory(
      {
        params: { projectId: 'project-1' },
        query: { limit: '10' },
        user: { id: 'user-1' },
      },
      projectHistoryRes,
      next
    );

    expect(firstSubmitRes.status).toHaveBeenCalledWith(201);
    expect(firstSubmitRes.json).toHaveBeenCalledWith({
      success: true,
      data: {
        answerAttempt: {
          id: 'attempt-1',
          questionId: 'question-1',
          projectId: 'project-1',
          sessionId: 'session-1',
          userAnswer: { value: 'Nucleus' },
          isCorrect: false,
          score: 0,
          feedbackText: 'Incorrect. Expected: Cell membrane',
          attemptNo: 1,
          answeredAt: '2026-04-05T00:00:01Z',
          explanation: 'The cell membrane regulates what enters and leaves the cell.',
        },
      },
    });

    expect(secondSubmitRes.status).toHaveBeenCalledWith(201);
    expect(secondSubmitRes.json).toHaveBeenCalledWith({
      success: true,
      data: {
        answerAttempt: {
          id: 'attempt-2',
          questionId: 'question-1',
          projectId: 'project-1',
          sessionId: 'session-1',
          userAnswer: { value: 'Cell membrane' },
          isCorrect: true,
          score: 100,
          feedbackText: 'Correct',
          attemptNo: 2,
          answeredAt: '2026-04-05T00:00:02Z',
          explanation: 'The cell membrane regulates what enters and leaves the cell.',
        },
      },
    });

    expect(questionHistoryRes.status).toHaveBeenCalledWith(200);
    expect(questionHistoryRes.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      questionId: 'question-1',
      answers: [
        {
          id: 'attempt-2',
          question_id: 'question-1',
          project_id: 'project-1',
          session_id: 'session-1',
          user_answer: { value: 'Cell membrane' },
          is_correct: true,
          score: 100,
          feedback_text: 'Correct',
          attempt_no: 2,
          answered_at: '2026-04-05T00:00:02Z',
          created_at: '2026-04-05T00:00:02Z',
          question: {
            id: 'question-1',
            prompt: 'Which structure controls what enters and leaves the cell?',
            question_type: 'multiple_choice',
            outline_item_id: 'topic-cells',
          },
        },
        {
          id: 'attempt-1',
          question_id: 'question-1',
          project_id: 'project-1',
          session_id: 'session-1',
          user_answer: { value: 'Nucleus' },
          is_correct: false,
          score: 0,
          feedback_text: 'Incorrect. Expected: Cell membrane',
          attempt_no: 1,
          answered_at: '2026-04-05T00:00:01Z',
          created_at: '2026-04-05T00:00:01Z',
          question: {
            id: 'question-1',
            prompt: 'Which structure controls what enters and leaves the cell?',
            question_type: 'multiple_choice',
            outline_item_id: 'topic-cells',
          },
        },
      ],
    });

    expect(projectHistoryRes.status).toHaveBeenCalledWith(200);
    expect(projectHistoryRes.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      count: 2,
      answers: [
        {
          id: 'attempt-2',
          question_id: 'question-1',
          project_id: 'project-1',
          session_id: 'session-1',
          user_answer: { value: 'Cell membrane' },
          is_correct: true,
          score: 100,
          feedback_text: 'Correct',
          attempt_no: 2,
          answered_at: '2026-04-05T00:00:02Z',
          created_at: '2026-04-05T00:00:02Z',
          question: {
            id: 'question-1',
            prompt: 'Which structure controls what enters and leaves the cell?',
            question_type: 'multiple_choice',
            outline_item_id: 'topic-cells',
          },
        },
        {
          id: 'attempt-1',
          question_id: 'question-1',
          project_id: 'project-1',
          session_id: 'session-1',
          user_answer: { value: 'Nucleus' },
          is_correct: false,
          score: 0,
          feedback_text: 'Incorrect. Expected: Cell membrane',
          attempt_no: 1,
          answered_at: '2026-04-05T00:00:01Z',
          created_at: '2026-04-05T00:00:01Z',
          question: {
            id: 'question-1',
            prompt: 'Which structure controls what enters and leaves the cell?',
            question_type: 'multiple_choice',
            outline_item_id: 'topic-cells',
          },
        },
      ],
    });

    expect(next).not.toHaveBeenCalled();
  });
});
