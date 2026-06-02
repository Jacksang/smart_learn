/**
 * Auth Middleware Tests
 * Tests rate limiters configuration and validator functions
 */

const rateLimit = require('express-rate-limit');

jest.mock('express-rate-limit', () => {
  const mockRateLimit = jest.fn((opts) => {
    // Return a mock middleware function that carries the options for inspection
    const middleware = jest.fn((req, res, next) => next());
    middleware.opts = opts;
    return middleware;
  });
  return mockRateLimit;
});

// Must require after mocks are set up
const authMiddleware = require('./auth-middleware');

function createReq(body = {}, params = {}, query = {}) {
  return { body, params, query };
}

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Rate Limiters
  // ==========================================

  describe('passwordResetLimiter', () => {
    test('is configured with 5 requests per hour', () => {
      expect(authMiddleware.passwordResetLimiter.opts).toMatchObject({
        windowMs: 60 * 60 * 1000,
        max: 5,
      });
    });

    test('returns the correct rate limit error message', () => {
      expect(authMiddleware.passwordResetLimiter.opts.message).toEqual({
        success: false,
        message: 'Too many password reset requests. Please try again in an hour.',
        error: 'PASSWORD_RESET_RATE_LIMIT',
      });
    });

    test('has standard headers enabled', () => {
      expect(authMiddleware.passwordResetLimiter.opts.standardHeaders).toBe(true);
      expect(authMiddleware.passwordResetLimiter.opts.legacyHeaders).toBe(false);
    });
  });

  describe('passwordResetCompleteLimiter', () => {
    test('is configured with 5 requests per hour', () => {
      expect(authMiddleware.passwordResetCompleteLimiter.opts).toMatchObject({
        windowMs: 60 * 60 * 1000,
        max: 5,
      });
    });

    test('returns the correct rate limit error message', () => {
      expect(authMiddleware.passwordResetCompleteLimiter.opts.message).toEqual({
        success: false,
        message: 'Too many password reset attempts. Please try again in an hour.',
        error: 'PASSWORD_RESET_COMPLETE_RATE_LIMIT',
      });
    });
  });

  describe('emailVerificationLimiter', () => {
    test('is configured with 3 requests per hour with custom keyGenerator', () => {
      expect(authMiddleware.emailVerificationLimiter.opts).toMatchObject({
        windowMs: 60 * 60 * 1000,
        max: 3,
      });
      expect(authMiddleware.emailVerificationLimiter.opts.keyGenerator).toBeDefined();
    });

    test('keyGenerator uses email from body or falls back to IP', () => {
      const req1 = { body: { email: 'user@example.com' }, ip: '1.2.3.4' };
      const req2 = { body: {}, ip: '5.6.7.8' };

      const keyGen = authMiddleware.emailVerificationLimiter.opts.keyGenerator;
      expect(keyGen(req1)).toBe('user@example.com');
      expect(keyGen(req2)).toBe('5.6.7.8');
    });
  });

  describe('sessionListLimiter', () => {
    test('is configured with 60 requests per minute', () => {
      expect(authMiddleware.sessionListLimiter.opts).toMatchObject({
        windowMs: 60 * 1000,
        max: 60,
      });
    });
  });

  describe('sessionRevokeLimiter', () => {
    test('is configured with 10 requests per minute', () => {
      expect(authMiddleware.sessionRevokeLimiter.opts).toMatchObject({
        windowMs: 60 * 1000,
        max: 10,
      });
    });
  });

  // ==========================================
  // Validation Middleware
  // ==========================================

  describe('validatePasswordResetRequest', () => {
    test('passes with valid email', () => {
      const req = createReq({ email: 'user@example.com' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('rejects missing email', () => {
      const req = createReq({});
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Email is required'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects invalid email format', () => {
      const req = createReq({ email: 'not-an-email' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Invalid email format'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects empty string email', () => {
      const req = createReq({ email: '' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Email is required'],
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validatePasswordResetComplete', () => {
    test('passes with valid token and strong password', () => {
      const req = createReq({
        token: 'a'.repeat(64), // 64 hex chars
        newPassword: 'StrongPass1!',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('rejects missing token', () => {
      const req = createReq({ newPassword: 'StrongPass1!' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Reset token is required'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects missing new password', () => {
      const req = createReq({ token: 'a'.repeat(64) });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['New password is required'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects weak password (too short)', () => {
      const req = createReq({ token: 'a'.repeat(64), newPassword: 'Ab1!' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Password must be at least 8 characters']),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects password missing uppercase, lowercase, number, and special', () => {
      const req = createReq({ token: 'a'.repeat(64), newPassword: 'longenough' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          'Password must contain at least one uppercase letter',
          'Password must contain at least one number',
          'Password must contain at least one special character',
        ]),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects invalid token format (not hex)', () => {
      const req = createReq({ token: 'not-hex-token!!', newPassword: 'StrongPass1!' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format',
        errors: ['Token must be a valid hexadecimal string'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects token that is not exactly 64 hex chars', () => {
      const req = createReq({ token: 'a'.repeat(63), newPassword: 'StrongPass1!' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format',
        errors: ['Token must be a valid hexadecimal string'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('accumulates all password errors', () => {
      const req = createReq({ token: 'a'.repeat(64), newPassword: 'short' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validatePasswordResetComplete(req, res, next);

      const errors = res.json.mock.calls[0][0].errors;
      expect(errors.length).toBeGreaterThanOrEqual(4); // short, no upper, no number, no special
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateEmailVerificationRequest', () => {
    test('passes without email (defaults to user email)', () => {
      const req = createReq({});  // no email provided
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationRequest(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('passes with valid email', () => {
      const req = createReq({ email: 'user@example.com' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationRequest(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('rejects invalid email format', () => {
      const req = createReq({ email: 'not-email' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format',
        errors: ['Email must be a valid email address'],
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateEmailVerificationComplete', () => {
    test('passes with valid 64-char hex token', () => {
      const req = createReq({ token: 'a'.repeat(64) });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationComplete(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('rejects missing token', () => {
      const req = createReq({});
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Verification token is required',
        errors: ['Token is required'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects non-hex token', () => {
      const req = createReq({ token: 'not-hex!' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format',
        errors: ['Token must be a valid hexadecimal string'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects token that is too short', () => {
      const req = createReq({ token: 'abc123' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format',
        errors: ['Token must be a valid hexadecimal string'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects empty token string', () => {
      const req = createReq({ token: '' });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateEmailVerificationComplete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Verification token is required',
        errors: ['Token is required'],
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateOAuthLinking', () => {
    test('passes with valid provider, user ID, and access token', () => {
      const req = createReq({
        provider: 'google',
        provider_user_id: 'g-123',
        access_token: 'at-123',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('normalizes provider to lowercase', () => {
      const req = createReq({
        provider: 'GitHub',
        provider_user_id: 'gh-123',
        access_token: 'at-123',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('rejects missing provider', () => {
      const req = createReq({
        provider_user_id: 'g-123',
        access_token: 'at-123',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Provider is required']),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects invalid provider', () => {
      const req = createReq({
        provider: 'twitter',
        provider_user_id: 't-123',
        access_token: 'at-123',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: ['Invalid provider. Must be one of: google, facebook, github, apple'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects missing provider_user_id', () => {
      const req = createReq({
        provider: 'google',
        access_token: 'at-123',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Provider user ID is required']),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejects missing access_token', () => {
      const req = createReq({
        provider: 'google',
        provider_user_id: 'g-123',
      });
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining(['Access token from OAuth provider is required']),
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('accumulates multiple validation errors', () => {
      const req = createReq({ provider: 'twitter' }); // missing provider_user_id, access_token, AND invalid provider
      const res = createRes();
      const next = jest.fn();

      authMiddleware.validateOAuthLinking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const errors = res.json.mock.calls[0][0].errors;
      expect(errors).toContain('Invalid provider. Must be one of: google, facebook, github, apple');
      expect(errors).toContain('Provider user ID is required');
      expect(errors).toContain('Access token from OAuth provider is required');
      expect(next).not.toHaveBeenCalled();
    });

    test('accepts all valid providers', () => {
      const validProviders = ['google', 'facebook', 'github', 'apple'];
      validProviders.forEach((provider) => {
        const req = createReq({
          provider,
          provider_user_id: `${provider}-123`,
          access_token: 'at-123',
        });
        const res = createRes();
        const next = jest.fn();

        authMiddleware.validateOAuthLinking(req, res, next);
        expect(next).toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });
  });
});
