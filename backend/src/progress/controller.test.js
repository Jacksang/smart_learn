jest.mock('./repository', () => ({
  getProjectProgressAggregate: jest.fn(),
  listTopicProgressAggregates: jest.fn(),
  createProjectSnapshot: jest.fn(),
  createTopicSnapshots: jest.fn(),
  findLatestProjectSnapshotForUser: jest.fn(),
  findLatestTopicSnapshotForUser: jest.fn(),
  findLatestWeakAreasForUser: jest.fn(),
}));

jest.mock('./service', () => ({
  buildTopicProgressSnapshots: jest.fn(),
  buildProjectProgressSnapshot: jest.fn(),
}));

const {
  getProjectProgressAggregate,
  listTopicProgressAggregates,
  createProjectSnapshot,
  createTopicSnapshots,
  findLatestProjectSnapshotForUser,
  findLatestTopicSnapshotForUser,
  findLatestWeakAreasForUser,
} = require('./repository');
const {
  buildTopicProgressSnapshots,
  buildProjectProgressSnapshot,
} = require('./service');
const controller = require('./controller');
const router = require('./router');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('progress controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers the protected project-scoped refresh route', () => {
    const refreshLayer = router.stack.find(
      (layer) => layer.route && layer.route.path === '/projects/:projectId/progress/refresh'
    );

    expect(refreshLayer).toBeDefined();
    expect(refreshLayer.route.methods.post).toBe(true);
    expect(refreshLayer.route.stack).toHaveLength(2);
    expect(refreshLayer.route.stack[1].handle).toBe(controller.refreshProjectProgress);
  });

  test('returns the latest project progress snapshot payload for an owned project', async () => {
    const persistedProjectSnapshot = {
      id: 'snapshot-project-1',
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project',
      completion_percent: 62.5,
      mastery_score: 84.75,
      progress_state: 'strong',
      weak_areas: [],
      strength_areas: [
        {
          outlineItemId: 'item-1',
          title: 'Addition',
          masteryScore: 91,
          completionPercent: 100,
          progressState: 'mastered',
        },
      ],
      summary_text: 'Project is strong with 62.5% completion and 84.75% mastery. Strength areas: Addition.',
      created_at: '2026-04-05T03:10:00.000Z',
    };

    findLatestProjectSnapshotForUser.mockResolvedValue(persistedProjectSnapshot);

    const req = {
      params: { projectId: ' project-1 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectProgress(req, res, next);

    expect(findLatestProjectSnapshotForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      progressSnapshot: {
        id: 'snapshot-project-1',
        projectId: 'project-1',
        outlineItemId: null,
        snapshotType: 'project',
        completionPercent: 62.5,
        masteryScore: 84.75,
        progressState: 'strong',
        weakAreas: [],
        strengthAreas: [
          {
            outlineItemId: 'item-1',
            title: 'Addition',
            masteryScore: 91,
            completionPercent: 100,
            progressState: 'mastered',
          },
        ],
        summaryText: 'Project is strong with 62.5% completion and 84.75% mastery. Strength areas: Addition.',
        createdAt: '2026-04-05T03:10:00.000Z',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns a clean null progress snapshot when no persisted project snapshot exists yet', async () => {
    findLatestProjectSnapshotForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectProgress(req, res, next);

    expect(findLatestProjectSnapshotForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      progressSnapshot: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId for project progress retrieval before repository access', async () => {
    const req = {
      params: { projectId: '   ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectProgress(req, res, next);

    expect(findLatestProjectSnapshotForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns the latest topic progress snapshot payload for an owned project topic', async () => {
    const persistedTopicSnapshot = {
      id: 'snapshot-topic-1',
      project_id: 'project-1',
      outline_item_id: 'item-1',
      snapshot_type: 'topic',
      completion_percent: 75,
      mastery_score: 88.5,
      progress_state: 'strong',
      weak_areas: [],
      strength_areas: [],
      summary_text: 'Topic progress is strong with improving mastery.',
      created_at: '2026-04-05T04:10:00.000Z',
    };

    findLatestTopicSnapshotForUser.mockResolvedValue(persistedTopicSnapshot);

    const req = {
      params: { projectId: ' project-1 ', itemId: ' item-1 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getTopicProgress(req, res, next);

    expect(findLatestTopicSnapshotForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      outlineItemId: 'item-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      itemId: 'item-1',
      progressSnapshot: {
        id: 'snapshot-topic-1',
        projectId: 'project-1',
        outlineItemId: 'item-1',
        snapshotType: 'topic',
        completionPercent: 75,
        masteryScore: 88.5,
        progressState: 'strong',
        weakAreas: [],
        strengthAreas: [],
        summaryText: 'Topic progress is strong with improving mastery.',
        createdAt: '2026-04-05T04:10:00.000Z',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns a clean null topic progress snapshot when no persisted topic snapshot exists yet', async () => {
    findLatestTopicSnapshotForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1', itemId: 'item-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getTopicProgress(req, res, next);

    expect(findLatestTopicSnapshotForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      outlineItemId: 'item-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      itemId: 'item-1',
      progressSnapshot: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId for topic progress retrieval before repository access', async () => {
    const req = {
      params: { projectId: '   ', itemId: 'item-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getTopicProgress(req, res, next);

    expect(findLatestTopicSnapshotForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing itemId for topic progress retrieval before repository access', async () => {
    const req = {
      params: { projectId: 'project-1', itemId: '   ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getTopicProgress(req, res, next);

    expect(findLatestTopicSnapshotForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'itemId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns the latest weak-area payload for an owned project', async () => {
    findLatestWeakAreasForUser.mockResolvedValue({
      project_id: 'project-1',
      weak_areas: [
        {
          outlineItemId: 'item-2',
          title: 'Fractions',
          masteryScore: 42,
          completionPercent: 60,
          progressState: 'needs_attention',
        },
      ],
      summary_text: 'Fractions need more review.',
      created_at: '2026-04-05T04:30:00.000Z',
    });

    const req = {
      params: { projectId: ' project-1 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectWeakAreas(req, res, next);

    expect(findLatestWeakAreasForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      weakAreas: [
        {
          outlineItemId: 'item-2',
          title: 'Fractions',
          masteryScore: 42,
          completionPercent: 60,
          progressState: 'needs_attention',
        },
      ],
      summaryText: 'Fractions need more review.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns an empty weak-area payload when no persisted project snapshot exists yet', async () => {
    findLatestWeakAreasForUser.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectWeakAreas(req, res, next);

    expect(findLatestWeakAreasForUser).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      weakAreas: [],
      summaryText: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId for weak-area retrieval before repository access', async () => {
    const req = {
      params: { projectId: '   ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.getProjectWeakAreas(req, res, next);

    expect(findLatestWeakAreasForUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('refreshes project progress, persists project/topic snapshots, and returns API-facing payload', async () => {
    const projectAggregate = {
      project_id: 'project-1',
      total_question_count: 8,
      answered_question_count: 5,
      total_attempt_count: 7,
      correct_attempt_count: 5,
      average_score: 82.5,
      recent_attempt_count: 5,
      recent_correct_attempt_count: 4,
    };
    const topicAggregates = [
      {
        project_id: 'project-1',
        outline_item_id: 'item-1',
        outline_item_title: 'Addition',
      },
    ];
    const topicSnapshotPayloads = [
      {
        project_id: 'project-1',
        outline_item_id: 'item-1',
        snapshot_type: 'topic',
        completion_percent: 100,
        mastery_score: 91,
        progress_state: 'mastered',
        weak_areas: [],
        strength_areas: [],
        summary_text: null,
      },
    ];
    const projectSnapshotPayload = {
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project',
      completion_percent: 62.5,
      mastery_score: 84.75,
      progress_state: 'strong',
      weak_areas: [],
      strength_areas: [
        {
          outlineItemId: 'item-1',
          title: 'Addition',
          masteryScore: 91,
          completionPercent: 100,
          progressState: 'mastered',
          answeredQuestionCount: 3,
          totalQuestionCount: 3,
          totalAttemptCount: 4,
        },
      ],
      summary_text: 'Project is strong with 62.5% completion and 84.75% mastery. Strength areas: Addition.',
    };
    const persistedProjectSnapshot = {
      id: 'snapshot-project-1',
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project',
      completion_percent: 62.5,
      mastery_score: 84.75,
      progress_state: 'strong',
      weak_areas: [],
      strength_areas: projectSnapshotPayload.strength_areas,
      summary_text: projectSnapshotPayload.summary_text,
      created_at: '2026-04-05T03:10:00.000Z',
    };
    const persistedTopicSnapshots = [
      {
        id: 'snapshot-topic-1',
        project_id: 'project-1',
        outline_item_id: 'item-1',
        snapshot_type: 'topic',
        completion_percent: 100,
        mastery_score: 91,
        progress_state: 'mastered',
        weak_areas: [],
        strength_areas: [],
        summary_text: null,
        created_at: '2026-04-05T03:10:01.000Z',
      },
    ];

    getProjectProgressAggregate.mockResolvedValue(projectAggregate);
    listTopicProgressAggregates.mockResolvedValue(topicAggregates);
    buildTopicProgressSnapshots.mockReturnValue(topicSnapshotPayloads);
    buildProjectProgressSnapshot.mockReturnValue(projectSnapshotPayload);
    createProjectSnapshot.mockResolvedValue(persistedProjectSnapshot);
    createTopicSnapshots.mockResolvedValue(persistedTopicSnapshots);

    const req = {
      params: { projectId: ' project-1 ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.refreshProjectProgress(req, res, next);

    expect(getProjectProgressAggregate).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(listTopicProgressAggregates).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
    });
    expect(buildTopicProgressSnapshots).toHaveBeenCalledWith(topicAggregates);
    expect(buildProjectProgressSnapshot).toHaveBeenCalledWith(projectAggregate, topicSnapshotPayloads);
    expect(createProjectSnapshot).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      snapshot: projectSnapshotPayload,
    });
    expect(createTopicSnapshots).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      topicSnapshots: topicSnapshotPayloads,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      projectSnapshot: {
        id: 'snapshot-project-1',
        projectId: 'project-1',
        outlineItemId: null,
        snapshotType: 'project',
        completionPercent: 62.5,
        masteryScore: 84.75,
        progressState: 'strong',
        weakAreas: [],
        strengthAreas: projectSnapshotPayload.strength_areas,
        summaryText: projectSnapshotPayload.summary_text,
        createdAt: '2026-04-05T03:10:00.000Z',
      },
      topicSnapshots: [
        {
          id: 'snapshot-topic-1',
          projectId: 'project-1',
          outlineItemId: 'item-1',
          snapshotType: 'topic',
          completionPercent: 100,
          masteryScore: 91,
          progressState: 'mastered',
          weakAreas: [],
          strengthAreas: [],
          summaryText: null,
          createdAt: '2026-04-05T03:10:01.000Z',
        },
      ],
      weakAreas: [],
      strengthAreas: projectSnapshotPayload.strength_areas,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns a persisted zero-state snapshot when the owned project has no attempts yet', async () => {
    const projectAggregate = {
      project_id: 'project-1',
      total_question_count: 4,
      answered_question_count: 0,
      total_attempt_count: 0,
      correct_attempt_count: 0,
      average_score: null,
      recent_attempt_count: 0,
      recent_correct_attempt_count: 0,
    };
    const projectSnapshotPayload = {
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project',
      completion_percent: 0,
      mastery_score: 0,
      progress_state: 'not_started',
      weak_areas: [],
      strength_areas: [],
      summary_text: 'No learning activity yet. Answer questions to generate progress insights.',
    };
    const persistedProjectSnapshot = {
      id: 'snapshot-project-zero',
      project_id: 'project-1',
      outline_item_id: null,
      snapshot_type: 'project',
      completion_percent: 0,
      mastery_score: 0,
      progress_state: 'not_started',
      weak_areas: [],
      strength_areas: [],
      summary_text: 'No learning activity yet. Answer questions to generate progress insights.',
      created_at: '2026-04-05T03:12:00.000Z',
    };

    getProjectProgressAggregate.mockResolvedValue(projectAggregate);
    listTopicProgressAggregates.mockResolvedValue([]);
    buildTopicProgressSnapshots.mockReturnValue([]);
    buildProjectProgressSnapshot.mockReturnValue(projectSnapshotPayload);
    createProjectSnapshot.mockResolvedValue(persistedProjectSnapshot);
    createTopicSnapshots.mockResolvedValue([]);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.refreshProjectProgress(req, res, next);

    expect(createTopicSnapshots).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      topicSnapshots: [],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 'project-1',
      projectSnapshot: {
        id: 'snapshot-project-zero',
        projectId: 'project-1',
        outlineItemId: null,
        snapshotType: 'project',
        completionPercent: 0,
        masteryScore: 0,
        progressState: 'not_started',
        weakAreas: [],
        strengthAreas: [],
        summaryText: 'No learning activity yet. Answer questions to generate progress insights.',
        createdAt: '2026-04-05T03:12:00.000Z',
      },
      topicSnapshots: [],
      weakAreas: [],
      strengthAreas: [],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects missing projectId before orchestration starts', async () => {
    const req = {
      params: { projectId: '   ' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.refreshProjectProgress(req, res, next);

    expect(getProjectProgressAggregate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId is required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when the project is not owned or does not exist', async () => {
    getProjectProgressAggregate.mockResolvedValue(null);

    const req = {
      params: { projectId: 'project-missing' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await controller.refreshProjectProgress(req, res, next);

    expect(getProjectProgressAggregate).toHaveBeenCalledWith({
      projectId: 'project-missing',
      userId: 'user-1',
    });
    expect(listTopicProgressAggregates).not.toHaveBeenCalled();
    expect(createProjectSnapshot).not.toHaveBeenCalled();
    expect(createTopicSnapshots).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    expect(next).not.toHaveBeenCalled();
  });
});
