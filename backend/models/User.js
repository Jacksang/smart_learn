/**
 * User Model — DOCUMENTATION ONLY
 * 
 * This file is a historical Mongoose schema, retained for documentation.
 * The active runtime uses PostgreSQL via backend/config/database.js and
 * backend/src/users/repository.js with raw SQL queries.
 * 
 * DO NOT import this file at runtime — no controllers reference it.
 */

// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
//
// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: [true, 'Please provide a name'],
//         trim: true
//     },
//     email: {
//         type: String,
//         required: [true, 'Please provide an email'],
//         unique: true,
//         lowercase: true,
//         match: [/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w{2,3}$/, 'Please provide a valid email']
//     },
//     password: {
//         type: String,
//         required: [true, 'Please provide a password'],
//         minlength: 6,
//         select: false
//     },
//     age: {
//         type: Number,
//         min: 5,
//         max: 120
//     },
//     gradeLevel: {
//         type: String,
//         enum: ['elementary', 'middle', 'high school', 'college'],
//         default: 'elementary'
//     },
//     subjects: [{ type: String }],
//     learningStyle: {
//         type: String,
//         enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
//         default: 'visual'
//     },
//     goals: [{ type: String }],
//     active: { type: Boolean, default: true },
//     lastActive: { type: Date, default: Date.now },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// }, { timestamps: true });
//
// // Pre-save password hashing
// userSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// });
//
// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
// };
//
// // Get public profile
// userSchema.methods.getPublicProfile = function() {
//     return {
//         _id: this._id,
//         name: this.name,
//         email: this.email,
//         age: this.age,
//         gradeLevel: this.gradeLevel,
//         subjects: this.subjects,
//         createdAt: this.createdAt
//     };
// };
//
// module.exports = mongoose.model('User', userSchema);

/**
 * === PostgreSQL Equivalent (active) ===
 * 
 * Table: users
 * Columns:
 *   id              SERIAL PRIMARY KEY
 *   email           VARCHAR(255) UNIQUE NOT NULL
 *   password_hash   VARCHAR(255) NOT NULL
 *   name            VARCHAR(255)
 *   age             INT CHECK (age >= 5 AND age <= 120)
 *   grade_level     VARCHAR(50) DEFAULT 'elementary'
 *   subjects        TEXT[] (array)
 *   learning_style  VARCHAR(50) DEFAULT 'visual'
 *   goals           TEXT[] (array)
 *   email_verified  BOOLEAN DEFAULT false
 *   status          VARCHAR(20) DEFAULT 'active'
 *   last_active     TIMESTAMPTZ
 *   created_at      TIMESTAMPTZ DEFAULT NOW()
 *   updated_at      TIMESTAMPTZ DEFAULT NOW()
 *   password_changed_at   TIMESTAMPTZ
 *   last_password_reset_at TIMESTAMPTZ
 *
 * Repository: backend/src/users/repository.js
 */
