/**
 * Outline Model — DOCUMENTATION ONLY
 * 
 * This file is a historical Mongoose schema, retained for documentation.
 * The active runtime uses PostgreSQL via backend/src/outline/repository.js
 * with raw SQL queries.
 * 
 * DO NOT import this file at runtime — no controllers reference it.
 */

// const mongoose = require('mongoose');
//
// const outlineTopicSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, default: '' },
//   learningObjectives: [{ type: String }],
//   difficulty: {
//     type: String,
//     enum: ['easy', 'medium', 'hard'],
//     default: 'medium',
//   },
// }, { _id: false });
//
// const outlineSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true,
//   },
//   courseTitle: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   subject: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   sourceType: {
//     type: String,
//     enum: ['manual', 'pdf', 'docx', 'text'],
//     default: 'manual',
//   },
//   sourcePath: {
//     type: String,
//     default: null,
//   },
//   topics: [outlineTopicSchema],
//   aiSummary: {
//     type: String,
//     default: '',
//   },
//   status: {
//     type: String,
//     enum: ['draft', 'processed', 'archived'],
//     default: 'draft',
//   },
// }, { timestamps: true });
//
// module.exports = mongoose.model('Outline', outlineSchema);

/**
 * === PostgreSQL Equivalent (active) ===
 * 
 * Table: outlines (managed by backend/src/outline/repository.js)
 * Columns:
 *   id          SERIAL PRIMARY KEY
 *   user_id     INT REFERENCES users(id)
 *   course_title VARCHAR(255) NOT NULL
 *   subject     VARCHAR(255) NOT NULL
 *   source_type VARCHAR(50) DEFAULT 'manual'
 *   source_path VARCHAR(500)
 *   topics      JSONB  -- array of {title, description, learningObjectives, difficulty}
 *   ai_summary  TEXT
 *   status      VARCHAR(50) DEFAULT 'draft'
 *   created_at  TIMESTAMPTZ DEFAULT NOW()
 *   updated_at  TIMESTAMPTZ DEFAULT NOW()
 *
 * Repository: backend/src/outline/repository.js
 */
