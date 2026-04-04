const bcrypt = require('bcrypt');
const db = require('../../config/database');

function toPublicProfile(row) {
  return {
    id: row.id,
    name: row.display_name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const USER_PUBLIC_COLUMNS = 'id, email, display_name, role, status, created_at, updated_at';
const USER_PRIVATE_COLUMNS = `${USER_PUBLIC_COLUMNS}, password_hash`;

async function findByEmail(email, { includePassword = false } = {}) {
  const columns = includePassword ? USER_PRIVATE_COLUMNS : USER_PUBLIC_COLUMNS;
  const result = await db.query(`SELECT ${columns} FROM users WHERE email = $1 LIMIT 1`, [email]);
  return result.rows[0] || null;
}

async function findById(id, { includePassword = false } = {}) {
  const columns = includePassword ? USER_PRIVATE_COLUMNS : USER_PUBLIC_COLUMNS;
  const result = await db.query(`SELECT ${columns} FROM users WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] || null;
}

async function createUser(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const result = await db.query(
    `INSERT INTO users (
      email, password_hash, display_name, role, status
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING ${USER_PUBLIC_COLUMNS}`,
    [
      payload.email,
      passwordHash,
      payload.name || payload.displayName || payload.email,
      payload.role || 'student',
      payload.status || 'active',
    ]
  );

  return result.rows[0];
}

async function comparePassword(candidatePassword, passwordHash) {
  return bcrypt.compare(candidatePassword, passwordHash);
}

async function touchLastActive(id) {
  await db.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [id]);
}

module.exports = {
  toPublicProfile,
  findByEmail,
  findById,
  createUser,
  comparePassword,
  touchLastActive,
};
