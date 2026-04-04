const mongoose = require('mongoose');

const outlineTopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  learningObjectives: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
}, { _id: false });

const outlineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  courseTitle: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  sourceType: {
    type: String,
    enum: ['manual', 'pdf', 'docx', 'text'],
    default: 'manual',
  },
  sourcePath: {
    type: String,
    default: null,
  },
  topics: [outlineTopicSchema],
  aiSummary: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'processed', 'archived'],
    default: 'draft',
  },
}, { timestamps: true });

module.exports = mongoose.model('Outline', outlineSchema);
