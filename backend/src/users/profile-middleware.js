/**
 * Profile Middleware
 * Validation and rate limiting for profile operations
 */

const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

/**
 * Rate limiters for profile operations
 */
const profileUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many profile update attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many password change attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const avatarUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many avatar upload attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const sessionRevokeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many session revocation attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validate avatar file
 */
function validateAvatarFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE',
        message: 'No file uploaded'
      }
    });
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(415).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only image files are allowed (JPEG, PNG, WebP, GIF)'
      }
    });
  }

  if (req.file.size > 5 * 1024 * 1024) { // 5MB
    return res.status(413).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size must be less than 5MB'
      }
    });
  }

  next();
}

/**
 * Validate password change request
 */
function validatePasswordChange(req, res, next) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'Current password, new password, and confirmation are required'
      }
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_MISMATCH',
        message: 'New passwords do not match'
      }
    });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters'
      }
    });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must contain at least one uppercase letter'
      }
    });
  }

  if (!/[a-z]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must contain at least one lowercase letter'
      }
    });
  }

  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must contain at least one number'
      }
    });
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must contain at least one special character'
      }
    });
  }

  next();
}

/**
 * Validate learning preferences
 */
function validateLearningPreferences(req, res, next) {
  const { dailyGoalMinutes, preferredSessionLength, difficultyLevel, learningStyle } = req.body;

  if (dailyGoalMinutes !== undefined && dailyGoalMinutes !== null) {
    if (typeof dailyGoalMinutes !== 'number' || dailyGoalMinutes < 15 || dailyGoalMinutes > 120) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Daily goal minutes must be between 15 and 120',
          details: [{
            field: 'dailyGoalMinutes',
            issue: 'must be between 15 and 120 minutes'
          }]
        }
      });
    }
  }

  if (preferredSessionLength !== undefined && preferredSessionLength !== null) {
    if (typeof preferredSessionLength !== 'number' || preferredSessionLength < 15 || preferredSessionLength > 60) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Preferred session length must be between 15 and 60',
          details: [{
            field: 'preferredSessionLength',
            issue: 'must be between 15 and 60 minutes'
          }]
        }
      });
    }
  }

  if (difficultyLevel !== undefined && difficultyLevel !== null) {
    if (!['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Difficulty level must be one of: beginner, intermediate, advanced',
          details: [{
            field: 'difficultyLevel',
            issue: 'invalid difficulty level'
          }]
        }
      });
    }
  }

  if (learningStyle !== undefined && learningStyle !== null) {
    if (!['visual', 'auditory', 'read-write', 'kinesthetic'].includes(learningStyle)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Learning style must be one of: visual, auditory, read-write, kinesthetic',
          details: [{
            field: 'learningStyle',
            issue: 'invalid learning style'
          }]
        }
      });
    }
  }

  next();
}

/**
 * Validate notification preferences
 */
function validateNotificationPreferences(req, res, next) {
  const booleanFields = [
    'emailNotifications', 'pushNotifications', 'weeklySummary',
    'streakReminders', 'achievementNotifications', 'learningTips', 'marketingEmails'
  ];

  for (const field of booleanFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      if (typeof req.body[field] !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${field} must be a boolean`,
            details: [{
              field: field,
              issue: 'must be a boolean'
            }]
          }
        });
      }
    }
  }

  next();
}

/**
 * Validate data export request
 */
function validateDataExport(req, res, next) {
  const { format } = req.body;

  if (!format || !['json', 'csv'].includes(format)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid format. Must be "json" or "csv"'
      }
    });
  }

  next();
}

module.exports = {
  profileUpdateLimiter,
  passwordChangeLimiter,
  avatarUploadLimiter,
  sessionRevokeLimiter,
  validateAvatarFile,
  validatePasswordChange,
  validateLearningPreferences,
  validateNotificationPreferences,
  validateDataExport,
};
