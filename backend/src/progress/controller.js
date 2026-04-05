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

function normalizeString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function mapPersistedSnapshotToApi(snapshot) {
  if (!snapshot) {
    return null;
  }

  return {
    id: snapshot.id,
    projectId: snapshot.project_id,
    outlineItemId: snapshot.outline_item_id,
    snapshotType: snapshot.snapshot_type,
    completionPercent: snapshot.completion_percent,
    masteryScore: snapshot.mastery_score,
    progressState: snapshot.progress_state,
    weakAreas: snapshot.weak_areas ?? [],
    strengthAreas: snapshot.strength_areas ?? [],
    summaryText: snapshot.summary_text,
    createdAt: snapshot.created_at,
  };
}

exports.getProjectProgress = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const userId = req.user.id;
    const progressSnapshot = await findLatestProjectSnapshotForUser({ projectId, userId });

    return res.status(200).json({
      projectId,
      progressSnapshot: mapPersistedSnapshotToApi(progressSnapshot),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getTopicProgress = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);
    const itemId = normalizeString(req.params.itemId);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    const userId = req.user.id;
    const progressSnapshot = await findLatestTopicSnapshotForUser({
      projectId,
      outlineItemId: itemId,
      userId,
    });

    return res.status(200).json({
      projectId,
      itemId,
      progressSnapshot: mapPersistedSnapshotToApi(progressSnapshot),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectWeakAreas = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const userId = req.user.id;
    const weakAreaSummary = await findLatestWeakAreasForUser({ projectId, userId });

    return res.status(200).json({
      projectId,
      weakAreas: weakAreaSummary?.weak_areas ?? [],
      summaryText: weakAreaSummary?.summary_text ?? null,
    });
  } catch (error) {
    return next(error);
  }
};

exports.refreshProjectProgress = async (req, res, next) => {
  try {
    const projectId = normalizeString(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const userId = req.user.id;
    const projectAggregate = await getProjectProgressAggregate({ projectId, userId });

    if (!projectAggregate) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const topicAggregates = await listTopicProgressAggregates({ projectId, userId });
    const topicSnapshotPayloads = buildTopicProgressSnapshots(topicAggregates);
    const projectSnapshotPayload = buildProjectProgressSnapshot(projectAggregate, topicSnapshotPayloads);

    const persistedProjectSnapshot = await createProjectSnapshot({
      projectId,
      userId,
      snapshot: projectSnapshotPayload,
    });

    if (!persistedProjectSnapshot) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const persistedTopicSnapshots = await createTopicSnapshots({
      projectId,
      userId,
      topicSnapshots: topicSnapshotPayloads,
    });

    return res.status(200).json({
      projectId,
      projectSnapshot: mapPersistedSnapshotToApi(persistedProjectSnapshot),
      topicSnapshots: persistedTopicSnapshots.map(mapPersistedSnapshotToApi),
      weakAreas: persistedProjectSnapshot.weak_areas ?? [],
      strengthAreas: persistedProjectSnapshot.strength_areas ?? [],
    });
  } catch (error) {
    return next(error);
  }
};

exports.mapPersistedSnapshotToApi = mapPersistedSnapshotToApi;
