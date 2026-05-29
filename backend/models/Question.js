/**
 * Question Model — DOCUMENTATION ONLY
 * 
 * This file is a historical Mongoose schema, retained for documentation.
 * The active runtime uses PostgreSQL via backend/src/questions/repository.js
 * with raw SQL queries.
 * 
 * DO NOT import this file at runtime — no controllers reference it.
 */

// const mongoose = require('mongoose');
//
// const optionSchema = new mongoose.Schema({
//   key: { type: String, required: true },
//   text: { type: String, required: true },
// }, { _id: false });
//
// const questionSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true,
//   },
//   outline: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Outline',
//     default: null,
//     index: true,
//   },
//   topic: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   type: {
//     type: String,
//     enum: ['single-choice', 'multiple-choice', 'true-false', 'short-answer'],
//     required: true,
//   },
//   difficulty: {
//     type: String,
//     enum: ['easy', 'medium', 'hard'],
//     default: 'medium',
//   },
//   prompt: {
//     type: String,
//     required: true,
//   },
//   options: [optionSchema],
//   correctAnswer: {
//     type: mongoose.Schema.Types.Mixed,
//     required: true,
//   },
//   explanation: {
//     type: String,
//     default: '',
//   },
//   source: {
//     type: String,
//     enum: ['ai-generated', 'manual'],
//     default: 'ai-generated',
//   },
//   tags: [{ type: String }],
// }, { timestamps: true });
//
// module.exports = mongoose.model('Question', questionSchema);

/**
 * === PostgreSQL Equivalent (active) ===
 * 
 * Table: questions (managed by backend/src/questions/repository.js)
 * Columns:
 *   id             SERIAL PRIMARY KEY
 *   user_id        INT REFERENCES users(id)
 *   outline_id     INT REFERENCES outlines(id)
 *   topic          VARCHAR(255) NOT NULL
 *   type           VARCHAR(50) NOT NULL  -- single-choice|multiple-choice|true-false|short-answer
 *   difficulty     VARCHAR(20) DEFAULT 'medium'
 *   prompt         TEXT NOT NULL
 *   options        JSONB  -- array of {key, text}
 *   correct_answer JSONB / TEXT
 *   explanation    TEXT
 *   source         VARCHAR(50) DEFAULT 'ai-generated'
 *   tags           TEXT[] (array)
 *   created_at     TIMESTAMPTZ DEFAULT NOW()
 *   updated_at     TIMESTAMPTZ DEFAULT NOW()
 *
 * Repository: backend/src/questions/repository.js
 */
