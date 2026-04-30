/**
 * Authentication Router
 * Mounts all enhanced auth endpoints with middleware chains
 */

const express = require('express');
const router = express.Router();

const authController = require('./auth-controller');
const {
  passwordResetLimiter,
  passwordResetCompleteLimiter,
  emailVerificationLimiter,
  sessionListLimiter,
  sessionRevokeLimiter,
  validatePasswordResetRequest,
  validatePasswordResetComplete,
  validateEmailVerificationRequest,
  validateEmailVerificationComplete,
  validateOAuthLinking,
} = require('./auth-middleware');
const { protect } = require('../users/middleware');

// ============================================================
//  PASSWORD RESET (public — no auth required)
// ============================================================

// POST /api/auth/password-reset/request
router.post(
  '/password-reset/request',
  passwordResetLimiter,
  validatePasswordResetRequest,
  authController.requestPasswordReset
);

// POST /api/auth/password-reset/complete
router.post(
  '/password-reset/complete',
  passwordResetCompleteLimiter,
  validatePasswordResetComplete,
  authController.resetPassword
);

// ============================================================
//  EMAIL VERIFICATION (mixed — request requires auth,
//  completion is public via token)
// ============================================================

// POST /api/auth/verification/request
router.post(
  '/verification/request',
  protect,
  emailVerificationLimiter,
  validateEmailVerificationRequest,
  authController.requestEmailVerification
);

// POST /api/auth/verification/complete
router.post(
  '/verification/complete',
  validateEmailVerificationComplete,
  authController.verifyEmail
);

// ============================================================
//  SESSION MANAGEMENT (protected)
// ============================================================

// GET /api/auth/sessions
router.get(
  '/sessions',
  protect,
  sessionListLimiter,
  authController.listSessions
);

// DELETE /api/auth/sessions/all
router.delete(
  '/sessions/all',
  protect,
  sessionRevokeLimiter,
  authController.revokeAllUserSessions
);

// DELETE /api/auth/sessions/:sessionId
router.delete(
  '/sessions/:sessionId',
  protect,
  sessionRevokeLimiter,
  authController.revokeUserSession
);

// ============================================================
//  OAUTH PROVIDER LINKING (protected)
// ============================================================

// POST /api/auth/oauth/link
router.post(
  '/oauth/link',
  protect,
  validateOAuthLinking,
  authController.linkOAuth
);

// GET /api/auth/oauth/providers
router.get(
  '/oauth/providers',
  protect,
  authController.listOAuthProviders
);

// DELETE /api/auth/oauth/:provider
router.delete(
  '/oauth/:provider',
  protect,
  authController.unlinkOAuth
);

module.exports = router;
