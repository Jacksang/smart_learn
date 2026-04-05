const {
  deriveProgressState,
  deriveWeakAndStrengthAreas,
  buildProgressSummary,
  buildTopicProgressSnapshots,
  buildProjectProgressSnapshot,
} = require('./service');

describe('progress service', () => {
  test('builds a sane zero-state project snapshot', () => {
    const topicSnapshots = buildTopicProgressSnapshots([]);

    const snapshot = buildProjectProgressSnapshot(
      {
        project_id: 'project-1',
        total_question_count: 6,
        answered_question_count: 0,
        total_attempt_count: 0,
        correct_attempt_count: 0,
        average_score: null,
        recent_attempt_count: 0,
        recent_correct_attempt_count: 0,
      },
      topicSnapshots
    );

    expect(snapshot).toEqual({
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project',
      title: null,
      outline_item_level: null,
      parent_item_id: null,
      order_index: null,
      total_question_count: 6,
      answered_question_count: 0,
      total_attempt_count: 0,
      correct_attempt_count: 0,
      recent_attempt_count: 0,
      recent_correct_attempt_count: 0,
      completion_percent: 0,
      mastery_score: 0,
      progress_state: 'not_started',
      weak_areas: [],
      strength_areas: [],
      summary_text: 'No learning activity yet. Answer questions to generate progress insights.',
    });
  });

  test('classifies weak and strong areas deterministically for mixed topic performance', () => {
    const topicSnapshots = buildTopicProgressSnapshots([
      {
        project_id: 'project-1',
        outline_item_id: 'topic-weak',
        outline_item_title: 'Fractions',
        order_index: 2,
        total_question_count: 4,
        answered_question_count: 3,
        total_attempt_count: 4,
        correct_attempt_count: 1,
        average_score: 25,
        recent_attempt_count: 2,
        recent_correct_attempt_count: 0,
      },
      {
        project_id: 'project-1',
        outline_item_id: 'topic-strong',
        outline_item_title: 'Addition',
        order_index: 1,
        total_question_count: 5,
        answered_question_count: 5,
        total_attempt_count: 6,
        correct_attempt_count: 5,
        average_score: 90,
        recent_attempt_count: 3,
        recent_correct_attempt_count: 3,
      },
      {
        project_id: 'project-1',
        outline_item_id: 'topic-mid',
        outline_item_title: 'Subtraction',
        order_index: 3,
        total_question_count: 4,
        answered_question_count: 3,
        total_attempt_count: 4,
        correct_attempt_count: 2,
        average_score: 65,
        recent_attempt_count: 2,
        recent_correct_attempt_count: 1,
      },
      {
        project_id: 'project-1',
        outline_item_id: 'topic-empty',
        outline_item_title: 'Decimals',
        order_index: 4,
        total_question_count: 3,
        answered_question_count: 0,
        total_attempt_count: 0,
        correct_attempt_count: 0,
        average_score: null,
        recent_attempt_count: 0,
        recent_correct_attempt_count: 0,
      },
    ]);

    expect(topicSnapshots.map((snapshot) => ({
      outline_item_id: snapshot.outline_item_id,
      mastery_score: snapshot.mastery_score,
      progress_state: snapshot.progress_state,
    }))).toEqual([
      {
        outline_item_id: 'topic-weak',
        mastery_score: 17.5,
        progress_state: 'struggling',
      },
      {
        outline_item_id: 'topic-strong',
        mastery_score: 93,
        progress_state: 'mastered',
      },
      {
        outline_item_id: 'topic-mid',
        mastery_score: 60.5,
        progress_state: 'in_progress',
      },
      {
        outline_item_id: 'topic-empty',
        mastery_score: 0,
        progress_state: 'not_started',
      },
    ]);

    expect(deriveWeakAndStrengthAreas(topicSnapshots)).toEqual({
      weakAreas: [
        {
          outlineItemId: 'topic-weak',
          title: 'Fractions',
          masteryScore: 17.5,
          completionPercent: 75,
          progressState: 'struggling',
          answeredQuestionCount: 3,
          totalQuestionCount: 4,
          totalAttemptCount: 4,
        },
      ],
      strengthAreas: [
        {
          outlineItemId: 'topic-strong',
          title: 'Addition',
          masteryScore: 93,
          completionPercent: 100,
          progressState: 'mastered',
          answeredQuestionCount: 5,
          totalQuestionCount: 5,
          totalAttemptCount: 6,
        },
      ],
    });
  });

  test('uses explicit progress-state thresholds for borderline mastery scenarios', () => {
    expect(deriveProgressState({ completionPercent: 0, masteryScore: 0, totalAttemptCount: 0 })).toBe('not_started');
    expect(deriveProgressState({ completionPercent: 40, masteryScore: 39.99, totalAttemptCount: 1 })).toBe('struggling');
    expect(deriveProgressState({ completionPercent: 40, masteryScore: 40, totalAttemptCount: 1 })).toBe('in_progress');
    expect(deriveProgressState({ completionPercent: 55, masteryScore: 70, totalAttemptCount: 2 })).toBe('strong');
    expect(deriveProgressState({ completionPercent: 79.99, masteryScore: 85, totalAttemptCount: 3 })).toBe('strong');
    expect(deriveProgressState({ completionPercent: 80, masteryScore: 85, totalAttemptCount: 3 })).toBe('mastered');
  });

  test('builds project summary text aligned with computed state and topic insights', () => {
    const topicSnapshots = buildTopicProgressSnapshots([
      {
        project_id: 'project-1',
        outline_item_id: 'topic-1',
        outline_item_title: 'Fractions',
        order_index: 2,
        total_question_count: 4,
        answered_question_count: 3,
        total_attempt_count: 4,
        correct_attempt_count: 1,
        average_score: 25,
        recent_attempt_count: 2,
        recent_correct_attempt_count: 0,
      },
      {
        project_id: 'project-1',
        outline_item_id: 'topic-2',
        outline_item_title: 'Addition',
        order_index: 1,
        total_question_count: 5,
        answered_question_count: 5,
        total_attempt_count: 6,
        correct_attempt_count: 5,
        average_score: 90,
        recent_attempt_count: 3,
        recent_correct_attempt_count: 3,
      },
    ]);

    const projectSnapshot = buildProjectProgressSnapshot(
      {
        project_id: 'project-1',
        total_question_count: 9,
        answered_question_count: 7,
        total_attempt_count: 10,
        correct_attempt_count: 6,
        average_score: 68,
        recent_attempt_count: 5,
        recent_correct_attempt_count: 3,
      },
      topicSnapshots
    );

    expect(projectSnapshot.summary_text).toBe(
      'Project is in progress with 77.78% completion and 65.6% mastery. Weak areas: Fractions. Strength areas: Addition.'
    );

    expect(buildProgressSummary({
      projectSnapshot,
      weakAreas: projectSnapshot.weak_areas,
      strengthAreas: projectSnapshot.strength_areas,
    })).toBe(projectSnapshot.summary_text);
  });
});
