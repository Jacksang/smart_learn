/**
 * Answer Model — DOCUMENTATION ONLY
 * 
 * This file is a historical Mongoose schema, retained for documentation.
 * The active runtime uses PostgreSQL via backend/src/answers/repository.js
 * with raw SQL queries.
 * 
 * DO NOT import this file at runtime — no controllers reference it.
 */

// const mongoose = require('mongoose');
//
// const answerSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true,
//   },
//   question: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Question',
//     required: true,
//     index: true,
//   },
//   submittedAnswer: {
//     type: mongoose.Schema.Types.Mixed,
//     required: true,
//   },
//   isCorrect: {
//     type: Boolean,
//     required: true,
//   },
//   score: {
//     type: Number,
//     min: 0,
//     max: 100,
//     default: 0,
//   },
//   feedback: {
//     type: String,
//     default: '',
//   },
//   attemptNumber: {
//     type: Number,
//     default: 1,
//   },
// }, { timestamps: true });
//
// module.exports = mongoose.model('Answer', answerSchema);

/**
 * === PostgreSQL Equivalent (active) ===
 * 
 * Table: answers (managed by backend/src/answers/repository.js)
 * Columns:
 *   id               SERIAL PRIMARY KEY
 *   user_id          INT REFERENCES users(id)
 *   question_id      INT REFERENCES questions(id)
 *   submitted_answer JSONB / TEXT
 *   is_correct       BOOLEAN
 *   score            INT CHECK (score >= 0 AND score <= 100)
 *   feedback         TEXT
 *   attempt_number   INT DEFAULT 1
 *   created_at       TIMESTAMPTZ DEFAULT NOW()
 *   updated_at       TIMESTAMPTZ DEFAULT NOW()
 *
 * Repository: backend/src/answers/repository.js
 */
