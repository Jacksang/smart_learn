/**
 * Authentication Controller
 * Handles password reset, email verification, session management, and OAuth
 */

const {
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  markEmailVerificationTokenUsed,
  updateUserEmail,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  linkOAuthProvider,
  getOAuthUser,
  removeOAuthProvider,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  updateUserPassword,
} = require('./auth-repository');

const { findByEmail, findById } = require('../users/repository');

// ============================================================
//  PASSWORD RESET
// ============================================================

/**
 * POST /api/auth/password-reset/request
 * Request a password reset email
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await findByEmail(normalizedEmail, { includePassword: false });

    // Always return success to prevent email enumeration
    if (!user || user.status !== 'active') {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate token (valid for 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const tokenRecord = await createPasswordResetToken(user.id, expiresAt);

    // In production, send email via SendGrid here
    // For now, return the token (MVP/testing mode)
    res.json({
      success: true,
      message: 'Password reset link has been sent to your email.',
      // NOTE: In production, remove token from response — send via email only
      ...(process.env.NODE_ENV !== 'production' && { resetToken: tokenRecord.token }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/password-reset/complete
 * Complete password reset with token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // 1. Verify token exists and is valid
    const tokenRecord = await verifyPasswordResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new one.',
        error: 'INVALID_RESET_TOKEN',
      });
    }

    // 2. Validate password strength
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements.',
        errors: passwordCheck.errors,
      });
    }

    // 3. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 4. Update user password
    await updateUserPassword(tokenRecord.user_id, hashedPassword);

    // 5. Mark token as used
    await markPasswordResetTokenUsed(token);

    // 6. Revoke all existing sessions for security
    await revokeAllSessions(tokenRecord.user_id);

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  EMAIL VERIFICATION
// ============================================================

/**
 * POST /api/auth/verification/request
 * Request email verification
 */
exports.requestEmailVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // Determine email to verify
    const user = await findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const targetEmail = email || user.email;

    // Check if already verified
    if (user.email_verified && targetEmail === user.email) {
      return res.json({
        success: true,
        message: 'Email is already verified.',
        verified: true,
      });
    }

    // Generate token (valid for 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const tokenRecord = await createEmailVerificationToken(
      userId,
      targetEmail,
      expiresAt
    );

    // In production, send email via SendGrid here
    res.json({
      success: true,
      message: 'Verification email has been sent.',
      // NOTE: In production, remove token from response — send via email only
      ...(process.env.NODE_ENV !== 'production' && { verificationToken: tokenRecord.token }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verification/complete
 * Complete email verification with token
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // 1. Verify token exists and is valid
    const tokenRecord = await verifyEmailVerificationToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token. Please request a new one.',
        error: 'INVALID_VERIFICATION_TOKEN',
      });
    }

    // 2. Check if email is already in use by another user
    const existingUser = await findByEmail(tokenRecord.email, { includePassword: false });
    if (existingUser && existingUser.id !== tokenRecord.user_id) {
      return res.status(409).json({
        success: false,
        message: 'This email is already associated with another account.',
        error: 'EMAIL_ALREADY_IN_USE',
      });
    }

    // 3. Update user email and mark as verified
    const updatedUser = await updateUserEmail(tokenRecord.user_id, tokenRecord.email);

    // 4. Mark token as used
    await markEmailVerificationTokenUsed(token);

    res.json({
      success: true,
      message: 'Email verified successfully.',
      verified_email: updatedUser.email,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  SESSION MANAGEMENT
// ============================================================

/**
 * GET /api/auth/sessions
 * List active user sessions
 */
exports.listSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await getActiveSessions(userId);

    // Strip sensitive data from response
    const safeSessions = sessions.map((s) => ({
      id: s.id,
      device_info: s.device_info,
      ip_address: s.ip_address,
      is_active: s.is_active,
      expires_at: s.expires_at,
      created_at: s.created_at,
      last_accessed_at: s.last_accessed_at,
      is_current: s.session_token === req.user.sessionToken,
    }));

    res.json({
      success: true,
      count: safeSessions.length,
      sessions: safeSessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
exports.revokeUserSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // Prevent revoking current session
    const sessions = await getActiveSessions(userId);
    const currentSession = sessions.find(
      (s) => s.session_token === req.user.sessionToken
    );
    if (currentSession && currentSession.id === parseInt(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke your current session. Use "revoke all" to log out everywhere.',
        error: 'CANNOT_REVOKE_CURRENT_SESSION',
      });
    }

    const revoked = await revokeSession(parseInt(sessionId), userId);
    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already revoked.',
        error: 'SESSION_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Session revoked successfully.',
      session: revoked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/sessions/all
 * Revoke all sessions (force logout from all devices)
 */
exports.revokeAllUserSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current session to exclude
    const sessions = await getActiveSessions(userId);
    const currentSession = sessions.find(
      (s) => s.session_token === req.user.sessionToken
    );

    const count = await revokeAllSessions(
      userId,
      currentSession ? currentSession.id : null
    );

    res.json({
      success: true,
      message: `Revoked ${count} session(s). Current session preserved.`,
      revoked_count: count,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  OAUTH PROVIDER LINKING
// ============================================================

/**
 * POST /api/auth/oauth/link
 * Link an OAuth provider to the user's account
 */
exports.linkOAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { provider, provider_user_id, access_token, refresh_token, email } = req.body;

    const normalizedProvider = provider.toLowerCase();

    // Check if already linked to this account
    const existing = await getOAuthUser(normalizedProvider, provider_user_id);
    if (existing) {
      if (existing.user_id === userId) {
        return res.json({
          success: true,
          message: `This ${normalizedProvider} account is already linked.`,
          provider: normalizedProvider,
        });
      } else {
        return res.status(409).json({
          success: false,
          message: `This ${normalizedProvider} account is already linked to another user.`,
          error: 'OAUTH_ALREADY_LINKED',
        });
      }
    }

    // Link the provider
    const tokenData = {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour typical
      email: email || null,
    };

    const result = await linkOAuthProvider(
      userId,
      normalizedProvider,
      provider_user_id,
      tokenData
    );

    res.status(201).json({
      success: true,
      message: `${normalizedProvider} account linked successfully.`,
      provider: result.provider,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/oauth/:provider
 * Unlink an OAuth provider from the user's account
 */
exports.unlinkOAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;

    // Find the OAuth link
    const oauthUser = await getOAuthUser(provider.toLowerCase(), req.query.provider_user_id);
    if (!oauthUser || oauthUser.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'OAuth provider link not found.',
        error: 'OAUTH_NOT_FOUND',
      });
    }

    await removeOAuthProvider(oauthUser.id);

    res.json({
      success: true,
      message: `${provider} account unlinked successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/oauth/providers
 * List linked OAuth providers for the current user
 */
exports.listOAuthProviders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Query all OAuth links for this user
    const { Pool } = require('pg');
    const db = new Pool({
      user: 'smartlearn',
      host: 'localhost',
      database: 'smartlearn',
      password: 'password',
      port: 5432,
    });

    const query = `
      SELECT provider, provider_user_id, email, created_at, updated_at
      FROM oauth_users
      WHERE user_id = $1
    `;
    const result = await db.query(query, [userId]);
    await db.end();

    res.json({
      success: true,
      linked_providers: result.rows,
    });
  } catch (error) {
    next(error);
  }
};
