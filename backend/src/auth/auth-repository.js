/**
 * Authentication Repository Layer
 * Handles all database operations for authentication features
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Database connection
const db = new Pool({
  user: 'smartlearn',
  host: 'localhost',
  database: 'smartlearn',
  password: 'password',
  port: 5432,
});

// Token generation helper
function generateSecureToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// == Password Reset Functions ==

/**
 * Create password reset token
 * @param {number} userId - User ID
 * @param {Date} expiresAt - Token expiration time
 * @returns {Promise<Object>} Created token record
 */
async function createPasswordResetToken(userId, expiresAt) {
  const token = generateSecureToken();
  const query = `
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, token, expires_at, created_at
  `;
  const values = [userId, token, expiresAt];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Verify password reset token
 * @param {string} token - Token to verify
 * @returns {Promise<Object|null>} Token data or null
 */
async function verifyPasswordResetToken(token) {
  const query = `
    SELECT * FROM password_reset_tokens
    WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()
  `;
  const result = await db.query(query, [token]);
  return result.rows[0] || null;
}

/**
 * Mark password reset token as used
 * @param {string} token - Token to mark
 * @returns {Promise<Object>} Updated token record
 */
async function markPasswordResetTokenUsed(token) {
  const query = `
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token = $1 AND used_at IS NULL
    RETURNING *
  `;
  const result = await db.query(query, [token]);
  return result.rows[0];
}

/**
 * Clean expired password reset tokens
 * @returns {Promise<number>} Number of tokens cleaned
 */
async function cleanExpiredPasswordResetTokens() {
  const query = `
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() OR used_at IS NOT NULL
  `;
  const result = await db.query(query);
  return result.rowCount;
}

// == Email Verification Functions ==

/**
 * Create email verification token
 * @param {number} userId - User ID
 * @param {string} email - Email to verify
 * @param {Date} expiresAt - Token expiration time
 * @returns {Promise<Object>} Created token record
 */
async function createEmailVerificationToken(userId, email, expiresAt) {
  const token = generateSecureToken();
  const query = `
    INSERT INTO email_verification_tokens (user_id, token, email, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, token, email, expires_at, created_at
  `;
  const values = [userId, token, email, expiresAt];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Verify email verification token
 * @param {string} token - Token to verify
 * @returns {Promise<Object|null>} Token data or null
 */
async function verifyEmailVerificationToken(token) {
  const query = `
    SELECT * FROM email_verification_tokens
    WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()
  `;
  const result = await db.query(query, [token]);
  return result.rows[0] || null;
}

/**
 * Mark email verification token as used
 * @param {string} token - Token to mark
 * @returns {Promise<Object>} Updated token record
 */
async function markEmailVerificationTokenUsed(token) {
  const query = `
    UPDATE email_verification_tokens
    SET used_at = NOW()
    WHERE token = $1 AND used_at IS NULL
    RETURNING *
  `;
  const result = await db.query(query, [token]);
  return result.rows[0];
}

/**
 * Update user email and mark as verified
 * @param {number} userId - User ID
 * @param {string} newEmail - New email address
 * @returns {Promise<Object>} Updated user record
 */
async function updateUserEmail(userId, newEmail) {
  const query = `
    UPDATE users
    SET email = $1, email_verified = true, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, email_verified, updated_at
  `;
  const result = await db.query(query, [newEmail, userId]);
  return result.rows[0];
}

/**
 * Clean expired email verification tokens
 * @returns {Promise<number>} Number of tokens cleaned
 */
async function cleanExpiredEmailVerificationTokens() {
  const query = `
    DELETE FROM email_verification_tokens
    WHERE expires_at < NOW() OR used_at IS NOT NULL
  `;
  const result = await db.query(query);
  return result.rowCount;
}

// == Session Management Functions ==

/**
 * Get active user sessions
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of active sessions
 */
async function getActiveSessions(userId) {
  const query = `
    SELECT 
      id,
      session_token,
      device_info,
      ip_address,
      is_active,
      expires_at,
      created_at,
      last_accessed_at
    FROM user_sessions
    WHERE user_id = $1 
      AND is_active = true
      AND expires_at > NOW()
    ORDER BY last_accessed_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
}

/**
 * Revoke specific session
 * @param {number} sessionId - Session ID to revoke
 * @param {number} userId - User ID (for authorization check)
 * @returns {Promise<Object|null>} Updated session or null
 */
async function revokeSession(sessionId, userId) {
  const query = `
    UPDATE user_sessions
    SET is_active = false, updated_at = NOW()
    WHERE id = $1 
      AND user_id = $2 
      AND is_active = true
    RETURNING id, session_token, user_id, is_active, updated_at
  `;
  const result = await db.query(query, [sessionId, userId]);
  return result.rows[0];
}

/**
 * Revoke all sessions except current one
 * @param {number} userId - User ID
 * @param {number} currentSessionId - Session ID to keep
 * @returns {Promise<number>} Number of sessions revoked
 */
async function revokeAllSessions(userId, currentSessionId = null) {
  if (currentSessionId) {
    const query = `
      UPDATE user_sessions
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 
        AND id != $2
        AND is_active = true
    `;
    const result = await db.query(query, [userId, currentSessionId]);
    return result.rowCount;
  } else {
    const query = `
      UPDATE user_sessions
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 
        AND is_active = true
    `;
    const result = await db.query(query, [userId]);
    return result.rowCount;
  }
}

/**
 * Create new user session
 * @param {number} userId - User ID
 * @param {string} sessionToken - Session token
 * @param {string} refreshToken - Refresh token
 * @param {Object} deviceInfo - Device information
 * @param {string} ipAddress - User's IP address
 * @param {Date} expiresAt - Session expiration
 * @returns {Promise<Object>} Created session record
 */
async function createSession(userId, sessionToken, refreshToken, deviceInfo, ipAddress, expiresAt) {
  const query = `
    INSERT INTO user_sessions (user_id, session_token, refresh_token, device_info, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, session_token, device_info, ip_address, is_active, expires_at, created_at, last_accessed_at
  `;
  const values = [userId, sessionToken, refreshToken, JSON.stringify(deviceInfo), ipAddress, expiresAt];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

// == OAuth Provider Functions ==

/**
 * Link OAuth provider to user
 * @param {number} userId - User ID
 * @param {string} provider - OAuth provider name
 * @param {string} providerUserId - User ID from provider
 * @param {Object} tokenData - Access/refresh token data
 * @returns {Promise<Object>} Created OAuth user record
 */
async function linkOAuthProvider(userId, provider, providerUserId, tokenData) {
  const query = `
    INSERT INTO oauth_users (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, email)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, email, created_at
  `;
  const values = [
    userId,
    provider,
    providerUserId,
    tokenData.accessToken || null,
    tokenData.refreshToken || null,
    tokenData.expiresAt || null,
    tokenData.email || null
  ];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Get OAuth user by provider and user ID
 * @param {string} provider - OAuth provider name
 * @param {string} providerUserId - User ID from provider
 * @returns {Promise<Object|null>} OAuth user record or null
 */
async function getOAuthUser(provider, providerUserId) {
  const query = `
    SELECT * FROM oauth_users
    WHERE provider = $1 AND provider_user_id = $2
  `;
  const result = await db.query(query, [provider, providerUserId]);
  return result.rows[0] || null;
}

/**
 * Update OAuth tokens
 * @param {number} oauthUserId - OAuth user ID
 * @param {Object} tokenData - New token data
 * @returns {Promise<Object>} Updated OAuth user record
 */
async function updateOAuthTokens(oauthUserId, tokenData) {
  const query = `
    UPDATE oauth_users
    SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
    WHERE id = $4
    RETURNING id, provider, provider_user_id, access_token, refresh_token, token_expires_at, updated_at
  `;
  const values = [
    tokenData.accessToken || null,
    tokenData.refreshToken || null,
    tokenData.expiresAt || null,
    oauthUserId
  ];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Remove OAuth provider link
 * @param {number} oauthUserId - OAuth user ID
 * @returns {Promise<Object|null>} Deleted record or null
 */
async function removeOAuthProvider(oauthUserId) {
  const query = `
    DELETE FROM oauth_users
    WHERE id = $1
    RETURNING *
  `;
  const result = await db.query(query, [oauthUserId]);
  return result.rows[0];
}

// == Password Functions ==

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {Object} Validation result
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} newPasswordHash - New password hash
 * @returns {Promise<Object>} Updated user record
 */
async function updateUserPassword(userId, newPasswordHash) {
  const query = `
    UPDATE users
    SET password_hash = $1, password_changed_at = NOW(), last_password_reset_at = NOW(), updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, password_changed_at, updated_at
  `;
  const result = await db.query(query, [newPasswordHash, userId]);
  return result.rows[0];
}

/**
 * Clean expired tokens (cron job)
 * @returns {Promise<number>} Total tokens cleaned
 */
async function cleanExpiredTokens() {
  const resetCleaned = await cleanExpiredPasswordResetTokens();
  const verifyCleaned = await cleanExpiredEmailVerificationTokens();
  return resetCleaned + verifyCleaned;
}

// == Export ==
module.exports = {
  // Password Reset
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
  cleanExpiredPasswordResetTokens,
  
  // Email Verification
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  markEmailVerificationTokenUsed,
  updateUserEmail,
  cleanExpiredEmailVerificationTokens,
  
  // Session Management
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  createSession,
  
  // OAuth Provider
  linkOAuthProvider,
  getOAuthUser,
  updateOAuthTokens,
  removeOAuthProvider,
  
  // Password
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  updateUserPassword,
  
  // Utilities
  cleanExpiredTokens
};
