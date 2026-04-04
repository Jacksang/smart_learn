const Outline = require('../../models/Outline');

exports.listOutlines = async (req, res, next) => {
  try {
    const outlines = await Outline.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ outlines });
  } catch (error) {
    return next(error);
  }
};

exports.createOutline = async (req, res, next) => {
  try {
    const outline = await Outline.create({
      user: req.user.id,
      courseTitle: req.body.courseTitle,
      subject: req.body.subject,
      sourceType: req.body.sourceType || 'manual',
      sourcePath: req.body.sourcePath || null,
      topics: req.body.topics || [],
      aiSummary: req.body.aiSummary || '',
      status: req.body.status || 'draft',
    });

    return res.status(201).json({ message: 'Outline created', outline });
  } catch (error) {
    return next(error);
  }
};
