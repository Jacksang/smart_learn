const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  text: { type: String, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  outline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outline',
    default: null,
    index: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['single-choice', 'multiple-choice', 'true-false', 'short-answer'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  prompt: {
    type: String,
    required: true,
  },
  options: [optionSchema],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    enum: ['ai-generated', 'manual'],
    default: 'ai-generated',
  },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
