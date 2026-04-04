const bcrypt = require('bcrypt');
const db = require('../../config/database');

function toPublicProfile(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    age: row.age,
    gradeLevel: row.grade_level,
    subjects: row.subjects || [],
    learningStyle: row.learning_style,
    goals: row.goals || [],
    createdAt: row.created_at,
  };
}

async function findByEmail(email, { includePassword = false } = {}) {
  const columns = includePassword ? '*' : 'id, name, email, age, grade_level, subjects, learning_style, goals, created_at, updated_at, last_active, active';
  const result = await db.query(`SELECT ${columns} FROM users WHERE email = $1 LIMIT 1`, [email]);
  return result.rows[0] || null;
}

async function findById(id, { includePassword = false } = {}) {
  const columns = includePassword ? '*' : 'id, name, email, age, grade_level, subjects, learning_style, goals, created_at, updated_at, last_active, active';
  const result = await db.query(`SELECT ${columns} FROM users WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] || null;
}

async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const result = await db.query(
    `INSERT INTO users (
      name, email, password_hash, age, grade_level, subjects, learning_style, goals, active, last_active
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, true, NOW())
    RETURNING id, name, email, age, grade_level, subjects, learning_style, goals, created_at, updated_at, last_active, active`,
    [
      payload.name,
      payload.email,
      passwordHash,
      payload.age || null,
      payload.gradeLevel || 'elementary',
      JSON.stringify(payload.subjects || []),
      payload.learningStyle || 'visual',
      JSON.stringify(payload.goals || []),
    ]
  );

  return result.rows[0];
}

async function comparePassword(candidatePassword, passwordHash) {
  return bcrypt.compare(candidatePassword, passwordHash);
}

async function touchLastActive(id) {
  await db.query('UPDATE users SET last_active = NOW(), updated_at = NOW() WHERE id = $1', [id]);
}

module.exports = {
  toPublicProfile,
  findByEmail,
  findById,
  createUser,
  comparePassword,
  touchLastActive,
};
