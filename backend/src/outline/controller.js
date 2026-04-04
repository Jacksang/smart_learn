const { parseOutlineFile } = require('./parser');
const { listByUser, createOutline } = require('./repository');

exports.listOutlines = async (req, res, next) => {
  try {
    const outlines = await listByUser(req.user.id);
    return res.status(200).json({ outlines });
  } catch (error) {
    return next(error);
  }
};

exports.createOutline = async (req, res, next) => {
  try {
    const outline = await createOutline({
      userId: req.user.id,
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

exports.uploadOutline = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Outline file is required' });
    }

    const parsed = await parseOutlineFile(req.file.path, req.file.mimetype);

    const outline = await createOutline({
      userId: req.user.id,
      courseTitle: req.body.courseTitle || req.file.originalname,
      subject: req.body.subject || 'General',
      sourceType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'text',
      sourcePath: req.file.path,
      topics: parsed.topics,
      aiSummary: parsed.rawText.slice(0, 1000),
      status: 'processed',
    });

    return res.status(201).json({
      message: 'Outline uploaded and parsed',
      outline,
      extractedTopics: parsed.topics.length,
    });
  } catch (error) {
    return next(error);
  }
};
