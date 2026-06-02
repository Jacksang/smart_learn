/**
 * Auth Controller Tests
 * Tests all controller functions with mocked repositories and req/res
 */

jest.mock('./auth-repository', () => ({
  createPasswordResetToken: jest.fn(),
  verifyPasswordResetToken: jest.fn(),
  markPasswordResetTokenUsed: jest.fn(),
  createEmailVerificationToken: jest.fn(),
  verifyEmailVerificationToken: jest.fn(),
  markEmailVerificationTokenUsed: jest.fn(),
  updateUserEmail: jest.fn(),
  getActiveSessions: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllSessions: jest.fn(),
  linkOAuthProvider: jest.fn(),
  getOAuthUser: jest.fn(),
  removeOAuthProvider: jest.fn(),
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
  updateUserPassword: jest.fn(),
}));

jest.mock('../users/repository', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
}));

const authRepo = require('./auth-repository');
const userRepo = require('../users/repository');
const controller = require('./auth-controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('auth controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  describe('requestPasswordReset', () => {
    test('sends reset token when user is found and active', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        status: 'active',
      });
      authRepo.createPasswordResetToken.mockResolvedValue({
        id: 'tok-1',
        token: 'hex-token...',
        user_id: 1,
      });

      const req = { body: { email: '  User@Example.com  ' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestPasswordReset(req, res, next);

      expect(userRepo.findByEmail).toHaveBeenCalledWith('user@example.com', { includePassword: false });
      expect(authRepo.createPasswordResetToken).toHaveBeenCalledWith(1, expect.any(Date));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset link has been sent to your email.',
        resetToken: 'hex-token...',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns generic success message even when user is not found (prevent enumeration)', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const req = { body: { email: 'unknown@example.com' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestPasswordReset(req, res, next);

      expect(userRepo.findByEmail).toHaveBeenCalledWith('unknown@example.com', { includePassword: false });
      expect(authRepo.createPasswordResetToken).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns generic message when user status is not active', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 1, email: 'inactive@example.com', status: 'suspended' });

      const req = { body: { email: 'inactive@example.com' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestPasswordReset(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      expect(authRepo.createPasswordResetToken).not.toHaveBeenCalled();
    });

    test('calls next with error when repository throws', async () => {
      const error = new Error('DB error');
      userRepo.findByEmail.mockRejectedValue(error);

      const req = { body: { email: 'user@example.com' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestPasswordReset(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('resetPassword', () => {
    test('completes password reset with valid token and strong password', async () => {
      authRepo.verifyPasswordResetToken.mockResolvedValue({
        id: 'tok-1',
        user_id: 1,
        token: 'valid-hex-token',
      });
      authRepo.validatePasswordStrength.mockReturnValue({ valid: true, errors: [] });
      authRepo.hashPassword.mockResolvedValue('$2b$12$hashed...');
      authRepo.updateUserPassword.mockResolvedValue({ id: 1, email: 'user@example.com' });
      authRepo.markPasswordResetTokenUsed.mockResolvedValue({ id: 'tok-1', used_at: new Date() });
      authRepo.revokeAllSessions.mockResolvedValue(3);

      const req = { body: { token: 'valid-hex-token', newPassword: 'StrongPass1!' } };
      const res = createRes();
      const next = jest.fn();

      await controller.resetPassword(req, res, next);

      expect(authRepo.verifyPasswordResetToken).toHaveBeenCalledWith('valid-hex-token');
      expect(authRepo.validatePasswordStrength).toHaveBeenCalledWith('StrongPass1!');
      expect(authRepo.hashPassword).toHaveBeenCalledWith('StrongPass1!');
      expect(authRepo.updateUserPassword).toHaveBeenCalledWith(1, '$2b$12$hashed...');
      expect(authRepo.markPasswordResetTokenUsed).toHaveBeenCalledWith('valid-hex-token');
      expect(authRepo.revokeAllSessions).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 400 when token is invalid or expired', async () => {
      authRepo.verifyPasswordResetToken.mockResolvedValue(null);

      const req = { body: { token: 'invalid-token', newPassword: 'StrongPass1!' } };
      const res = createRes();
      const next = jest.fn();

      await controller.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired reset token. Please request a new one.',
        error: 'INVALID_RESET_TOKEN',
      });
      expect(authRepo.validatePasswordStrength).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 400 when password is too weak', async () => {
      authRepo.verifyPasswordResetToken.mockResolvedValue({
        id: 'tok-1',
        user_id: 1,
        token: 'valid-hex-token',
      });
      authRepo.validatePasswordStrength.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters', 'Password must contain at least one uppercase letter'],
      });

      const req = { body: { token: 'valid-hex-token', newPassword: 'weak' } };
      const res = createRes();
      const next = jest.fn();

      await controller.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password does not meet requirements.',
        errors: ['Password must be at least 8 characters', 'Password must contain at least one uppercase letter'],
      });
      expect(authRepo.hashPassword).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next with error when repository throws', async () => {
      const error = new Error('DB error');
      authRepo.verifyPasswordResetToken.mockRejectedValue(error);

      const req = { body: { token: 'token', newPassword: 'StrongPass1!' } };
      const res = createRes();
      const next = jest.fn();

      await controller.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  describe('requestEmailVerification', () => {
    test('creates verification token when email is not already verified', async () => {
      userRepo.findById.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        email_verified: false,
      });
      authRepo.createEmailVerificationToken.mockResolvedValue({
        id: 'v-tok-1',
        token: 'verify-hex-token',
      });

      const req = { user: { id: 1 }, body: { email: 'user@example.com' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestEmailVerification(req, res, next);

      expect(userRepo.findById).toHaveBeenCalledWith(1);
      expect(authRepo.createEmailVerificationToken).toHaveBeenCalledWith(
        1,
        'user@example.com',
        expect.any(Date)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email has been sent.',
        verificationToken: 'verify-hex-token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns already verified when email matches and is verified', async () => {
      userRepo.findById.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        email_verified: true,
      });

      const req = { user: { id: 1 }, body: { email: 'user@example.com' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestEmailVerification(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email is already verified.',
        verified: true,
      });
      expect(authRepo.createEmailVerificationToken).not.toHaveBeenCalled();
    });

    test('creates token for new email even when current is verified', async () => {
      userRepo.findById.mockResolvedValue({
        id: 1,
        email: 'old@example.com',
        email_verified: true,
      });
      authRepo.createEmailVerificationToken.mockResolvedValue({
        id: 'v-tok-2',
        token: 'new-email-token',
      });

      const req = { user: { id: 1 }, body: { email: 'new@example.com' } };
      const res = createRes();
      const next = jest.fn();

      await controller.requestEmailVerification(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email has been sent.',
        verificationToken: 'new-email-token',
      });
      expect(authRepo.createEmailVerificationToken).toHaveBeenCalledWith(1, 'new@example.com', expect.any(Date));
    });

    test('uses user email from database when body email not provided', async () => {
      userRepo.findById.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        email_verified: false,
      });
      authRepo.createEmailVerificationToken.mockResolvedValue({ id: 'v-tok-3', token: 'tok' });

      const req = { user: { id: 1 }, body: {} };
      const res = createRes();
      const next = jest.fn();

      await controller.requestEmailVerification(req, res, next);

      expect(authRepo.createEmailVerificationToken).toHaveBeenCalledWith(1, 'user@example.com', expect.any(Date));
    });

    test('returns 404 when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      const req = { user: { id: 999 }, body: {} };
      const res = createRes();
      const next = jest.fn();

      await controller.requestEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found.',
      });
    });
  });

  describe('verifyEmail', () => {
    test('completes email verification with valid token', async () => {
      authRepo.verifyEmailVerificationToken.mockResolvedValue({
        id: 'v-tok-1',
        user_id: 1,
        token: 'valid-verify-token',
        email: 'new@example.com',
      });
      userRepo.findByEmail.mockResolvedValue({ id: 1, email: 'new@example.com' }); // same user
      authRepo.updateUserEmail.mockResolvedValue({ id: 1, email: 'new@example.com', email_verified: true });
      authRepo.markEmailVerificationTokenUsed.mockResolvedValue({});

      const req = { body: { token: 'valid-verify-token' } };
      const res = createRes();
      const next = jest.fn();

      await controller.verifyEmail(req, res, next);

      expect(authRepo.verifyEmailVerificationToken).toHaveBeenCalledWith('valid-verify-token');
      expect(userRepo.findByEmail).toHaveBeenCalledWith('new@example.com', { includePassword: false });
      expect(authRepo.updateUserEmail).toHaveBeenCalledWith(1, 'new@example.com');
      expect(authRepo.markEmailVerificationTokenUsed).toHaveBeenCalledWith('valid-verify-token');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully.',
        verified_email: 'new@example.com',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 400 when token is invalid or expired', async () => {
      authRepo.verifyEmailVerificationToken.mockResolvedValue(null);

      const req = { body: { token: 'invalid-token' } };
      const res = createRes();
      const next = jest.fn();

      await controller.verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired verification token. Please request a new one.',
        error: 'INVALID_VERIFICATION_TOKEN',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 409 when email is already in use by another user', async () => {
      authRepo.verifyEmailVerificationToken.mockResolvedValue({
        id: 'v-tok-1',
        user_id: 1,
        token: 'valid-token',
        email: 'taken@example.com',
      });
      userRepo.findByEmail.mockResolvedValue({ id: 2, email: 'taken@example.com' }); // different user

      const req = { body: { token: 'valid-token' } };
      const res = createRes();
      const next = jest.fn();

      await controller.verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This email is already associated with another account.',
        error: 'EMAIL_ALREADY_IN_USE',
      });
      expect(authRepo.updateUserEmail).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  describe('listSessions', () => {
    test('returns list of active sessions with current session marked', async () => {
      authRepo.getActiveSessions.mockResolvedValue([
        { id: 1, session_token: 'tok-1', device_info: 'Chrome', ip_address: '1.2.3.4', is_active: true, expires_at: new Date(), created_at: new Date(), last_accessed_at: new Date() },
        { id: 2, session_token: 'tok-2', device_info: 'Safari', ip_address: '5.6.7.8', is_active: true, expires_at: new Date(), created_at: new Date(), last_accessed_at: new Date() },
      ]);

      const req = { user: { id: 1, sessionToken: 'tok-1' } };
      const res = createRes();
      const next = jest.fn();

      await controller.listSessions(req, res, next);

      expect(authRepo.getActiveSessions).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        sessions: [
          expect.objectContaining({ id: 1, is_current: true }),
          expect.objectContaining({ id: 2, is_current: false }),
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('strips session_token from response for security', () => {
      const sessions = [
        { id: 1, session_token: 'tok-1', device_info: 'Chrome', ip_address: '1.2.3.4', is_active: true, expires_at: new Date(), created_at: new Date(), last_accessed_at: new Date() },
      ];
      authRepo.getActiveSessions.mockResolvedValue(sessions);

      const req = { user: { id: 1, sessionToken: 'tok-1' } };
      const res = createRes();
      const next = jest.fn();

      return controller.listSessions(req, res, next).then(() => {
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.sessions[0]).not.toHaveProperty('session_token');
      });
    });
  });

  describe('revokeUserSession', () => {
    test('revokes a specific session', async () => {
      authRepo.getActiveSessions.mockResolvedValue([
        { id: 1, session_token: 'current-tok' },
        { id: 2, session_token: 'other-tok' },
      ]);
      authRepo.revokeSession.mockResolvedValue({
        id: 2,
        session_token: 'other-tok',
        is_active: false,
        updated_at: new Date(),
      });

      const req = { user: { id: 1, sessionToken: 'current-tok' }, params: { sessionId: '2' } };
      const res = createRes();
      const next = jest.fn();

      await controller.revokeUserSession(req, res, next);

      expect(authRepo.revokeSession).toHaveBeenCalledWith(2, 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session revoked successfully.',
        session: expect.objectContaining({ id: 2, is_active: false }),
      });
    });

    test('returns 400 when trying to revoke current session', async () => {
      authRepo.getActiveSessions.mockResolvedValue([
        { id: 1, session_token: 'current-tok' },
      ]);

      const req = { user: { id: 1, sessionToken: 'current-tok' }, params: { sessionId: '1' } };
      const res = createRes();
      const next = jest.fn();

      await controller.revokeUserSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot revoke your current session. Use "revoke all" to log out everywhere.',
        error: 'CANNOT_REVOKE_CURRENT_SESSION',
      });
      expect(authRepo.revokeSession).not.toHaveBeenCalled();
    });

    test('returns 404 when session not found', async () => {
      authRepo.getActiveSessions.mockResolvedValue([
        { id: 1, session_token: 'current-tok' },
      ]);
      authRepo.revokeSession.mockResolvedValue(null);

      const req = { user: { id: 1, sessionToken: 'current-tok' }, params: { sessionId: '999' } };
      const res = createRes();
      const next = jest.fn();

      await controller.revokeUserSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found or already revoked.',
        error: 'SESSION_NOT_FOUND',
      });
    });
  });

  describe('revokeAllUserSessions', () => {
    test('revokes all sessions except current', async () => {
      authRepo.getActiveSessions.mockResolvedValue([
        { id: 1, session_token: 'current-tok' },
        { id: 2, session_token: 'other-tok' },
      ]);
      authRepo.revokeAllSessions.mockResolvedValue(1);

      const req = { user: { id: 1, sessionToken: 'current-tok' } };
      const res = createRes();
      const next = jest.fn();

      await controller.revokeAllUserSessions(req, res, next);

      expect(authRepo.revokeAllSessions).toHaveBeenCalledWith(1, 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Revoked 1 session(s). Current session preserved.',
        revoked_count: 1,
      });
    });

    test('revokes all sessions when current session not found in list', async () => {
      authRepo.getActiveSessions.mockResolvedValue([
        { id: 1, session_token: 'tok-1' },
        { id: 2, session_token: 'tok-2' },
      ]);
      authRepo.revokeAllSessions.mockResolvedValue(2);

      const req = { user: { id: 1, sessionToken: 'nonexistent-tok' } };
      const res = createRes();
      const next = jest.fn();

      await controller.revokeAllUserSessions(req, res, next);

      expect(authRepo.revokeAllSessions).toHaveBeenCalledWith(1, null);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Revoked 2 session(s). Current session preserved.',
        revoked_count: 2,
      });
    });
  });

  // ==========================================
  // OAUTH
  // ==========================================

  describe('linkOAuth', () => {
    test('links a new OAuth provider to the user', async () => {
      authRepo.getOAuthUser.mockResolvedValue(null); // not linked yet
      authRepo.linkOAuthProvider.mockResolvedValue({
        id: 1,
        provider: 'google',
        user_id: 1,
      });

      const req = {
        user: { id: 1 },
        body: {
          provider: 'Google',
          provider_user_id: 'g-123',
          access_token: 'at-123',
          refresh_token: 'rt-123',
          email: 'user@gmail.com',
        },
      };
      const res = createRes();
      const next = jest.fn();

      await controller.linkOAuth(req, res, next);

      expect(authRepo.getOAuthUser).toHaveBeenCalledWith('google', 'g-123');
      expect(authRepo.linkOAuthProvider).toHaveBeenCalledWith(
        1, 'google', 'g-123',
        expect.objectContaining({
          accessToken: 'at-123',
          refreshToken: 'rt-123',
          email: 'user@gmail.com',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'google account linked successfully.',
        provider: 'google',
      });
    });

    test('returns success when OAuth already linked to this user', async () => {
      authRepo.getOAuthUser.mockResolvedValue({
        id: 1,
        user_id: 1,
        provider: 'google',
        provider_user_id: 'g-123',
      });

      const req = {
        user: { id: 1 },
        body: { provider: 'google', provider_user_id: 'g-123', access_token: 'at' },
      };
      const res = createRes();
      const next = jest.fn();

      await controller.linkOAuth(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'This google account is already linked.',
        provider: 'google',
      });
      expect(authRepo.linkOAuthProvider).not.toHaveBeenCalled();
    });

    test('returns 409 when OAuth account is linked to another user', async () => {
      authRepo.getOAuthUser.mockResolvedValue({
        id: 1,
        user_id: 2,
        provider: 'google',
        provider_user_id: 'g-123',
      });

      const req = {
        user: { id: 1 },
        body: { provider: 'google', provider_user_id: 'g-123', access_token: 'at' },
      };
      const res = createRes();
      const next = jest.fn();

      await controller.linkOAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This google account is already linked to another user.',
        error: 'OAUTH_ALREADY_LINKED',
      });
    });
  });

  describe('unlinkOAuth', () => {
    test('unlinks an OAuth provider', async () => {
      authRepo.getOAuthUser.mockResolvedValue({
        id: 1,
        user_id: 1,
        provider: 'google',
        provider_user_id: 'g-123',
      });
      authRepo.removeOAuthProvider.mockResolvedValue({ id: 1 });

      const req = {
        user: { id: 1 },
        params: { provider: 'google' },
        query: { provider_user_id: 'g-123' },
      };
      const res = createRes();
      const next = jest.fn();

      await controller.unlinkOAuth(req, res, next);

      expect(authRepo.getOAuthUser).toHaveBeenCalledWith('google', 'g-123');
      expect(authRepo.removeOAuthProvider).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'google account unlinked successfully.',
      });
    });

    test('returns 404 when OAuth link not found', async () => {
      authRepo.getOAuthUser.mockResolvedValue(null);

      const req = {
        user: { id: 1 },
        params: { provider: 'google' },
        query: { provider_user_id: 'nonexistent' },
      };
      const res = createRes();
      const next = jest.fn();

      await controller.unlinkOAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'OAuth provider link not found.',
        error: 'OAUTH_NOT_FOUND',
      });
    });

    test('returns 404 when OAuth belongs to another user', async () => {
      authRepo.getOAuthUser.mockResolvedValue({
        id: 1,
        user_id: 2,
        provider: 'google',
      });

      const req = {
        user: { id: 1 },
        params: { provider: 'google' },
        query: { provider_user_id: 'g-123' },
      };
      const res = createRes();
      const next = jest.fn();

      await controller.unlinkOAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(authRepo.removeOAuthProvider).not.toHaveBeenCalled();
    });
  });

  describe('listOAuthProviders', () => {
    /**
     * The listOAuthProviders controller function creates its own pg Pool inline.
     * The top-level jest.mock('pg') gives us a Pool that we can control.
     * We replace the Pool prototype to control what new Pool() returns.
     */

    beforeEach(() => {
      // Reset the combined mock for each test in this describe block
      delete require.cache[require.resolve('./auth-controller')];
    });

    test('returns list of linked OAuth providers', async () => {
      // Since Pool is a mock constructor, we need to make Pool.prototype.query work
      // The controller does: const db = new Pool({...}); then db.query(...)
      // Pool from jest.mock('pg') creates a mock jest.fn() constructor that returns {}
      // We need to provide query and end methods on the instance

      // Let's take a different approach: re-mock pg just for listOAuthProviders tests
      // by modifying the cached module
      const pgModule = require('pg');
      const fakeProviders = [
        { provider: 'google', provider_user_id: 'g-123', email: 'user@gmail.com', created_at: new Date(), updated_at: new Date() },
      ];

      // Create a mock pool instance
      const mockPoolQuery = jest.fn().mockResolvedValue({ rows: fakeProviders });
      const mockPoolInstance = {
        query: mockPoolQuery,
        end: jest.fn(),
      };

      // Replace the Pool constructor to return our mock instance
      const originalPool = pgModule.Pool;
      pgModule.Pool = jest.fn(() => mockPoolInstance);

      // Clear the require cache for auth-controller so it re-requires pg
      delete require.cache[require.resolve('./auth-controller')];
      const freshController = require('./auth-controller');

      const req = { user: { id: 1 } };
      const res = createRes();
      const next = jest.fn();

      await freshController.listOAuthProviders(req, res, next);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        linked_providers: fakeProviders,
      });
      expect(next).not.toHaveBeenCalled();

      // Restore
      pgModule.Pool = originalPool;
    });

    test('returns empty list when no providers linked', async () => {
      const pgModule = require('pg');
      const mockPoolQuery = jest.fn().mockResolvedValue({ rows: [] });
      const mockPoolInstance = {
        query: mockPoolQuery,
        end: jest.fn(),
      };

      const originalPool = pgModule.Pool;
      pgModule.Pool = jest.fn(() => mockPoolInstance);

      delete require.cache[require.resolve('./auth-controller')];
      const freshController = require('./auth-controller');

      const req = { user: { id: 1 } };
      const res = createRes();
      const next = jest.fn();

      await freshController.listOAuthProviders(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        linked_providers: [],
      });

      pgModule.Pool = originalPool;
    });
  });
});
