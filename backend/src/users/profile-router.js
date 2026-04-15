const express = require('express');
const router = express.Router();

const profileController = require('./profile-controller');
const {
  profileUpdateLimiter,
  passwordChangeLimiter,
  avatarUploadLimiter,
  sessionRevokeLimiter,
  validateAvatarFile,
  validatePasswordChange,
  validateLearningPreferences,
  validateNotificationPreferences,
  validateDataExport,
} = require('./profile-middleware');
const { protect } = require('./middleware');

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', profileController.getProfile);

/**
 * @route   PATCH /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/', profileUpdateLimiter, profileController.updateProfile);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar', avatarUploadLimiter, validateAvatarFile, profileController.uploadAvatar);

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete('/avatar', profileController.deleteAvatar);

/**
 * @route   PATCH /api/profile/preferences/learning
 * @desc    Update learning preferences
 * @access  Private
 */
router.patch('/preferences/learning', profileUpdateLimiter, validateLearningPreferences, profileController.updateLearningPreferences);

/**
 * @route   PATCH /api/profile/preferences/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.patch('/preferences/notifications', profileUpdateLimiter, validateNotificationPreferences, profileController.updateNotificationPreferences);

/**
 * @route   POST /api/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', passwordChangeLimiter, validatePasswordChange, profileController.changePassword);

/**
 * @route   GET /api/profile/subscription
 * @desc    Get subscription information
 * @access  Private
 */
router.get('/subscription', profileController.getSubscription);

/**
 * @route   POST /api/profile/data-export
 * @desc    Request data export
 * @access  Private
 */
router.post('/data-export', profileUpdateLimiter, validateDataExport, profileController.requestDataExport);

/**
 * @route   GET /api/profile/sessions
 * @desc    Get active user sessions
 * @access  Private
 */
router.get('/sessions', profileController.getSessions);

/**
 * @route   DELETE /api/profile/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', sessionRevokeLimiter, profileController.revokeSession);

/**
 * @route   DELETE /api/profile/sessions/all
 * @desc    Revoke all sessions
 * @access  Private
 */
router.delete('/sessions/all', sessionRevokeLimiter, profileController.revokeAllSessions);

module.exports = router;
