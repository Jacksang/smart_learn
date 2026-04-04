const { listByProjectForUser, findByIdForProjectAndUser } = require('./repository');

exports.listProjectQuestions = async (req, res, next) => {
  try {
    const questions = await listByProjectForUser({
      projectId: req.params.projectId,
      userId: req.user.id,
      outlineItemId: req.query.outlineItemId,
      batchNo: req.query.batchNo,
      status: req.query.status,
    });

    return res.status(200).json({ questions });
  } catch (error) {
    return next(error);
  }
};

exports.getProjectQuestion = async (req, res, next) => {
  try {
    const question = await findByIdForProjectAndUser(
      req.params.questionId,
      req.params.projectId,
      req.user.id
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    return res.status(200).json({ question });
  } catch (error) {
    return next(error);
  }
};
