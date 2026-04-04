const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true,
  },
  submittedAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  feedback: {
    type: String,
    default: '',
  },
  attemptNumber: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });

module.exports = mongoose.model('Answer', answerSchema);
