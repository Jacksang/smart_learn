/**
 * Auth Repository Tests
 * Tests all authentication database functions with mocked pg Pool
 */

jest.mock('pg', () => {
  const mQuery = jest.fn();
  const mPool = jest.fn(() => ({
    query: mQuery,
    end: jest.fn(),
  }));
  return { Pool: mPool };
});

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// We need to re-require the repository after mocks are in place
const authRepo = require('./auth-repository');

describe('auth repository', () => {
  let mockQuery;

  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
    // Get the mock query function from the Pool constructor
    const poolInstance = Pool.mock.results[0]?.value;
    mockQuery = poolInstance ? poolInstance.query : Pool();
    mockQuery = Pool().query;
  });

  // ==========================================
  // Password Reset Functions
  // ==========================================

  describe('createPasswordResetToken', () => {
    test('creates a password reset token for a user', async () => {
      const fakeRecord = {
        id: 'token-1',
        user_id: 1,
        token: 'abc123token...',
        expires_at: new Date('2026-06-03T15:12:00Z'),
        created_at: new Date('2026-06-02T15:12:00Z'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const expiresAt = new Date('2026-06-03T15:12:00Z');
      const result = await authRepo.createPasswordResetToken(1, expiresAt);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO password_reset_tokens'),
        [1, expect.any(String), expiresAt]
      );
      // Token should be a hex string (64 characters = 32 bytes)
      expect(mockQuery.mock.calls[0][1][1]).toMatch(/^[a-f0-9]{128}$/);
      expect(result).toEqual(fakeRecord);
    });
  });

  describe('verifyPasswordResetToken', () => {
    test('returns token data when valid token exists', async () => {
      const fakeRecord = {
        id: 'token-1',
        user_id: 1,
        token: 'valid-token',
        used_at: null,
        expires_at: new Date('2099-01-01'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const result = await authRepo.verifyPasswordResetToken('valid-token');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM password_reset_tokens'),
        ['valid-token']
      );
      expect(mockQuery.mock.calls[0][0]).toContain('used_at IS NULL AND expires_at > NOW()');
      expect(result).toEqual(fakeRecord);
    });

    test('returns null when token is expired or already used', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.verifyPasswordResetToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('markPasswordResetTokenUsed', () => {
    test('marks token as used and returns updated record', async () => {
      const fakeRecord = {
        id: 'token-1',
        user_id: 1,
        token: 'valid-token',
        used_at: new Date('2026-06-02T15:12:00Z'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const result = await authRepo.markPasswordResetTokenUsed('valid-token');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE password_reset_tokens'),
        ['valid-token']
      );
      expect(mockQuery.mock.calls[0][0]).toContain('used_at = NOW()');
      expect(mockQuery.mock.calls[0][0]).toContain('RETURNING');
      expect(result).toEqual(fakeRecord);
    });

    test('returns undefined when token not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.markPasswordResetTokenUsed('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('cleanExpiredPasswordResetTokens', () => {
    test('deletes expired or used tokens and returns count', async () => {
      mockQuery.mockResolvedValue({ rowCount: 3 });

      const result = await authRepo.cleanExpiredPasswordResetTokens();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM password_reset_tokens')
      );
      expect(mockQuery.mock.calls[0][0]).toContain('expires_at < NOW() OR used_at IS NOT NULL');
      expect(result).toBe(3);
    });

    test('returns 0 when no tokens to clean', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      const result = await authRepo.cleanExpiredPasswordResetTokens();

      expect(result).toBe(0);
    });
  });

  // ==========================================
  // Email Verification Functions
  // ==========================================

  describe('createEmailVerificationToken', () => {
    test('creates an email verification token for a user', async () => {
      const fakeRecord = {
        id: 'verify-1',
        user_id: 1,
        token: 'abc123...',
        email: 'user@example.com',
        expires_at: new Date('2026-06-03T15:12:00Z'),
        created_at: new Date('2026-06-02T15:12:00Z'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const expiresAt = new Date('2026-06-03T15:12:00Z');
      const result = await authRepo.createEmailVerificationToken(1, 'user@example.com', expiresAt);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_verification_tokens'),
        [1, expect.any(String), 'user@example.com', expiresAt]
      );
      expect(mockQuery.mock.calls[0][1][1]).toMatch(/^[a-f0-9]{128}$/);
      expect(result).toEqual(fakeRecord);
    });
  });

  describe('verifyEmailVerificationToken', () => {
    test('returns token data when valid verification token exists', async () => {
      const fakeRecord = {
        id: 'verify-1',
        user_id: 1,
        token: 'valid-verify-token',
        email: 'user@example.com',
        used_at: null,
        expires_at: new Date('2099-01-01'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const result = await authRepo.verifyEmailVerificationToken('valid-verify-token');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM email_verification_tokens'),
        ['valid-verify-token']
      );
      expect(mockQuery.mock.calls[0][0]).toContain('used_at IS NULL AND expires_at > NOW()');
      expect(result).toEqual(fakeRecord);
    });

    test('returns null when verification token is expired or used', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.verifyEmailVerificationToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('markEmailVerificationTokenUsed', () => {
    test('marks email verification token as used', async () => {
      const fakeRecord = {
        id: 'verify-1',
        user_id: 1,
        token: 'valid-verify-token',
        used_at: new Date('2026-06-02T15:12:00Z'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const result = await authRepo.markEmailVerificationTokenUsed('valid-verify-token');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE email_verification_tokens'),
        ['valid-verify-token']
      );
      expect(mockQuery.mock.calls[0][0]).toContain('used_at = NOW()');
      expect(result).toEqual(fakeRecord);
    });

    test('returns undefined when verification token not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.markEmailVerificationTokenUsed('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('updateUserEmail', () => {
    test('updates user email and marks as verified', async () => {
      const fakeUser = {
        id: 1,
        email: 'new@example.com',
        email_verified: true,
        updated_at: new Date('2026-06-02T15:12:00Z'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeUser] });

      const result = await authRepo.updateUserEmail(1, 'new@example.com');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['new@example.com', 1]
      );
      expect(mockQuery.mock.calls[0][0]).toContain('email = $1, email_verified = true');
      expect(result).toEqual(fakeUser);
    });
  });

  describe('cleanExpiredEmailVerificationTokens', () => {
    test('deletes expired or used email verification tokens', async () => {
      mockQuery.mockResolvedValue({ rowCount: 2 });

      const result = await authRepo.cleanExpiredEmailVerificationTokens();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM email_verification_tokens')
      );
      expect(mockQuery.mock.calls[0][0]).toContain('expires_at < NOW() OR used_at IS NOT NULL');
      expect(result).toBe(2);
    });
  });

  // ==========================================
  // Session Management Functions
  // ==========================================

  describe('getActiveSessions', () => {
    test('returns active sessions for a user ordered by last_accessed_at', async () => {
      const fakeSessions = [
        { id: 1, session_token: 'tok1', device_info: 'Chrome', ip_address: '1.2.3.4', is_active: true, expires_at: new Date('2099-01-01'), created_at: new Date(), last_accessed_at: new Date('2026-06-02T14:00:00Z') },
        { id: 2, session_token: 'tok2', device_info: 'Safari', ip_address: '5.6.7.8', is_active: true, expires_at: new Date('2099-01-01'), created_at: new Date(), last_accessed_at: new Date('2026-06-02T13:00:00Z') },
      ];
      mockQuery.mockResolvedValue({ rows: fakeSessions });

      const result = await authRepo.getActiveSessions(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = true');
      expect(mockQuery.mock.calls[0][0]).toContain('expires_at > NOW()');
      expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY last_accessed_at DESC');
      expect(result).toEqual(fakeSessions);
    });

    test('returns empty array when no active sessions', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.getActiveSessions(1);

      expect(result).toEqual([]);
    });
  });

  describe('revokeSession', () => {
    test('revokes a specific session for a user', async () => {
      const fakeSession = {
        id: 1,
        session_token: 'tok1',
        user_id: 1,
        is_active: false,
        updated_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [fakeSession] });

      const result = await authRepo.revokeSession(1, 1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_sessions'),
        [1, 1]
      );
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = false');
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = true'); // WHERE clause
      expect(result).toEqual(fakeSession);
    });

    test('returns undefined when session not found or already revoked', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.revokeSession(999, 1);

      expect(result).toBeUndefined();
    });
  });

  describe('revokeAllSessions', () => {
    test('revokes all sessions except current one when currentSessionId is provided', async () => {
      mockQuery.mockResolvedValue({ rowCount: 3 });

      const result = await authRepo.revokeAllSessions(1, 5);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_sessions'),
        [1, 5]
      );
      expect(mockQuery.mock.calls[0][0]).toContain('id != $2');
      expect(result).toBe(3);
    });

    test('revokes all sessions when currentSessionId is null', async () => {
      mockQuery.mockResolvedValue({ rowCount: 4 });

      const result = await authRepo.revokeAllSessions(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_sessions'),
        [1]
      );
      expect(mockQuery.mock.calls[0][0]).not.toContain('id !=');
      expect(result).toBe(4);
    });

    test('returns 0 when no sessions to revoke', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      const result = await authRepo.revokeAllSessions(1, 5);

      expect(result).toBe(0);
    });
  });

  describe('createSession', () => {
    test('creates a new user session with JSON-stringified device info', async () => {
      const fakeSession = {
        id: 1,
        user_id: 1,
        session_token: 'sess-token',
        device_info: '{"browser":"Chrome"}',
        ip_address: '1.2.3.4',
        is_active: true,
        expires_at: new Date('2099-01-01'),
        created_at: new Date(),
        last_accessed_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [fakeSession] });

      const expiresAt = new Date('2099-01-01');
      const deviceInfo = { browser: 'Chrome' };
      const result = await authRepo.createSession(
        1,
        'sess-token',
        'refresh-token',
        deviceInfo,
        '1.2.3.4',
        expiresAt
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_sessions'),
        [1, 'sess-token', 'refresh-token', JSON.stringify(deviceInfo), '1.2.3.4', expiresAt]
      );
      expect(result).toEqual(fakeSession);
    });
  });

  // ==========================================
  // OAuth Functions
  // ==========================================

  describe('linkOAuthProvider', () => {
    test('inserts OAuth provider link for a user', async () => {
      const fakeRecord = {
        id: 1,
        user_id: 1,
        provider: 'google',
        provider_user_id: 'google-123',
        access_token: 'atoken',
        refresh_token: 'rtoken',
        token_expires_at: new Date('2099-01-01'),
        email: 'user@gmail.com',
        created_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const tokenData = {
        accessToken: 'atoken',
        refreshToken: 'rtoken',
        expiresAt: new Date('2099-01-01'),
        email: 'user@gmail.com',
      };
      const result = await authRepo.linkOAuthProvider(1, 'google', 'google-123', tokenData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO oauth_users'),
        [1, 'google', 'google-123', 'atoken', 'rtoken', new Date('2099-01-01'), 'user@gmail.com']
      );
      expect(result).toEqual(fakeRecord);
    });

    test('handles null token fields gracefully', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1, provider: 'github' }] });

      const result = await authRepo.linkOAuthProvider(1, 'github', 'gh-123', {});

      expect(mockQuery.mock.calls[0][1]).toEqual([
        1, 'github', 'gh-123',
        null, null, null, null
      ]);
    });
  });

  describe('getOAuthUser', () => {
    test('returns OAuth user record when found', async () => {
      const fakeRecord = { id: 1, provider: 'google', provider_user_id: 'g-123', user_id: 1 };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const result = await authRepo.getOAuthUser('google', 'g-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM oauth_users'),
        ['google', 'g-123']
      );
      expect(result).toEqual(fakeRecord);
    });

    test('returns null when OAuth user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.getOAuthUser('google', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOAuthTokens', () => {
    test('updates OAuth tokens for a user', async () => {
      const fakeRecord = {
        id: 1,
        provider: 'google',
        provider_user_id: 'g-123',
        access_token: 'new-at',
        refresh_token: 'new-rt',
        token_expires_at: new Date('2099-01-01'),
        updated_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const tokenData = {
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        expiresAt: new Date('2099-01-01'),
      };
      const result = await authRepo.updateOAuthTokens(1, tokenData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE oauth_users'),
        ['new-at', 'new-rt', new Date('2099-01-01'), 1]
      );
      expect(result).toEqual(fakeRecord);
    });
  });

  describe('removeOAuthProvider', () => {
    test('deletes OAuth provider link and returns the record', async () => {
      const fakeRecord = { id: 1, provider: 'google', user_id: 1 };
      mockQuery.mockResolvedValue({ rows: [fakeRecord] });

      const result = await authRepo.removeOAuthProvider(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM oauth_users'),
        [1]
      );
      expect(result).toEqual(fakeRecord);
    });

    test('returns undefined when OAuth record not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await authRepo.removeOAuthProvider(999);

      expect(result).toBeUndefined();
    });
  });

  // ==========================================
  // Password Functions
  // ==========================================

  describe('hashPassword', () => {
    test('hashes password with bcrypt using cost factor 12', async () => {
      bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword...');

      const result = await authRepo.hashPassword('MySecurePass123!');

      expect(bcrypt.hash).toHaveBeenCalledWith('MySecurePass123!', 12);
      expect(result).toBe('$2b$12$hashedpassword...');
    });
  });

  describe('verifyPassword', () => {
    test('returns true when password matches hash', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await authRepo.verifyPassword('MySecurePass123!', '$2b$12$hash...');

      expect(bcrypt.compare).toHaveBeenCalledWith('MySecurePass123!', '$2b$12$hash...');
      expect(result).toBe(true);
    });

    test('returns false when password does not match', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await authRepo.verifyPassword('wrongpass', '$2b$12$hash...');

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    test('returns valid for a strong password', () => {
      const result = authRepo.validatePasswordStrength('StrongPass1!');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('rejects password shorter than 8 characters', () => {
      const result = authRepo.validatePasswordStrength('Ab1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    test('rejects password without uppercase letter', () => {
      const result = authRepo.validatePasswordStrength('weakpass1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('rejects password without lowercase letter', () => {
      const result = authRepo.validatePasswordStrength('WEAKPASS1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('rejects password without number', () => {
      const result = authRepo.validatePasswordStrength('WeakPass!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('rejects password without special character', () => {
      const result = authRepo.validatePasswordStrength('WeakPass1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    test('accumulates multiple validation errors for a very weak password', () => {
      const result = authRepo.validatePasswordStrength('short');

      // 'short' fails: min length, uppercase, lowercase is fine, number, special
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('updateUserPassword', () => {
    test('updates password hash and related timestamps for a user', async () => {
      const fakeUser = {
        id: 1,
        email: 'user@example.com',
        password_changed_at: new Date('2026-06-02T15:12:00Z'),
        updated_at: new Date('2026-06-02T15:12:00Z'),
      };
      mockQuery.mockResolvedValue({ rows: [fakeUser] });

      const result = await authRepo.updateUserPassword(1, '$2b$12$newhash...');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['$2b$12$newhash...', 1]
      );
      expect(mockQuery.mock.calls[0][0]).toContain('password_hash = $1');
      expect(mockQuery.mock.calls[0][0]).toContain('password_changed_at = NOW()');
      expect(mockQuery.mock.calls[0][0]).toContain('last_password_reset_at = NOW()');
      expect(result).toEqual(fakeUser);
    });
  });

  // ==========================================
  // Utility Functions
  // ==========================================

  describe('cleanExpiredTokens', () => {
    test('cleans both password reset and email verification tokens and returns total count', async () => {
      // First call: cleanExpiredPasswordResetTokens returns 3
      // Second call: cleanExpiredEmailVerificationTokens returns 2
      mockQuery
        .mockResolvedValueOnce({ rowCount: 3 })
        .mockResolvedValueOnce({ rowCount: 2 });

      const result = await authRepo.cleanExpiredTokens();

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain('DELETE FROM password_reset_tokens');
      expect(mockQuery.mock.calls[1][0]).toContain('DELETE FROM email_verification_tokens');
      expect(result).toBe(5);
    });
  });
});
