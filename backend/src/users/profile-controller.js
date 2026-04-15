/**
 * User Profile & Settings Controller
 * Handles all profile-related operations:
 * - Profile view and updates
 * - Avatar management
 * - Preferences (learning & notification)
 * - Password management
 * - Session management
 * - Subscription information
 * - Data export
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { exec } = require('child_process');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

const db = require('../../config/database');
const {
  findById,
  findByEmail,
  updateProfile,
  updatePreferences,
  updateSubscription,
  touchLastActive,
  changePassword,
  getNotificationPreferences,
  createNotificationPreferences,
  getActiveSessions,
  createSession,
  revokeSession,
  revokeAllSessions,
  updateDataExport,
  getUserSubscriptions,
} = require('./repository');

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

// Multer configuration for avatar upload
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_AVATAR_SIZE,
  },
  fileFilter: fileFilter,
});

/**
 * Helper functions
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

const generateDeviceName = (userAgent) => {
  // Simple device detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isDesktop = !isMobile;
  
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return `${browser} on ${isMobile ? 'Mobile' : os}`;
};

const processAvatarImage = async (buffer, userId) => {
  const uploadDir = path.join(__dirname, '../../uploads/avatars');
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const fileExt = 'jpg';
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = path.join(uploadDir, fileName);
  
  // Save file
  await fs.promises.writeFile(filePath, buffer);
  
  // Generate thumbnail (using a simple approach - in production use sharp or similar)
  const thumbDir = path.join(uploadDir, 'thumbnails');
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }
  const thumbPath = path.join(thumbDir, `${uuidv4()}.${fileExt}`);
  
  // For now, just copy the full image to thumbnail (in production, resize with sharp)
  await fs.promises.copyFile(filePath, thumbPath);
  
  // Generate CDN-style URL
  const avatarUrl = `https://cdn.smartlearn.com/avatars/${fileName}`;
  const thumbnailUrl = `https://cdn.smartlearn.com/avatars/thumbnails/${path.basename(thumbPath)}`;
  
  return { avatarUrl, thumbnailUrl };
};

/**
 * Get user profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }
    
    // Fetch notification preferences
    let notificationPrefs = null;
    try {
      notificationPrefs = await getNotificationPreferences(req.user.id);
    } catch (error) {
      // If no preferences exist, create defaults
      notificationPrefs = await createNotificationPreferences(req.user.id);
    }
    
    // Get subscription info
    const subscription = await getUserSubscriptions(req.user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          role: user.role,
          status: user.status,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at,
          dailyGoalMinutes: user.daily_goal_minutes,
          preferredSessionLength: user.preferred_session_length,
          difficultyLevel: user.difficulty_level,
          learningStyle: user.learning_style
        },
        subscription: subscription ? {
          plan: subscription.plan_name,
          status: subscription.status,
          features: subscription.features,
          expiresAt: subscription.expires_at,
          price: {
            amount: subscription.price_amount,
            currency: subscription.price_currency
          }
        } : null,
        preferences: {
          learningPreferences: {
            dailyGoalMinutes: user.daily_goal_minutes,
            preferredSessionLength: user.preferred_session_length,
            difficultyLevel: user.difficulty_level,
            learningStyle: user.learning_style
          },
          notificationPreferences: notificationPrefs
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio } = req.body;
    
    // Validate displayName if provided
    if (displayName !== undefined && displayName !== null) {
      if (typeof displayName !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Display name must be a string',
            details: [{
              field: 'displayName',
              issue: 'must be a string'
            }]
          }
        });
      }
      
      if (displayName.length < 2 || displayName.length > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Display name must be between 2 and 100 characters',
            details: [{
              field: 'displayName',
              issue: 'must be between 2 and 100 characters'
            }]
          }
        });
      }
    }
    
    // Validate bio if provided
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bio must be a string',
            details: [{
              field: 'bio',
              issue: 'must be a string'
            }]
          }
        });
      }
      
      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bio must not exceed 500 characters',
            details: [{
              field: 'bio',
              issue: 'must not exceed 500 characters'
            }]
          }
        });
      }
    }
    
    // Update profile
    const updatedUser = await updateProfile(req.user.id, {
      display_name: displayName || req.user.display_name,
      bio: bio
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.display_name,
          avatarUrl: updatedUser.avatar_url,
          bio: updatedUser.bio,
          role: updatedUser.role,
          status: updatedUser.status
        }
      },
      meta: {
        message: 'Profile updated successfully'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Upload avatar
 */
exports.uploadAvatar = upload.single('avatar', async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }
    
    // Validate file size
    if (req.file.size > MAX_AVATAR_SIZE) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File is too large. Maximum size is 5MB'
        }
      });
    }
    
    // Process avatar
    const { avatarUrl, thumbnailUrl } = await processAvatarImage(req.file.buffer, req.user.id);
    
    // Update user
    const updatedUser = await updateProfile(req.user.id, { avatar_url: avatarUrl });
    
    return res.status(200).json({
      success: true,
      data: {
        avatarUrl: avatarUrl,
        thumbnailUrl: thumbnailUrl
      },
      meta: {
        message: 'Avatar uploaded successfully'
      }
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File is too large. Maximum size is 5MB'
          }
        });
      }
    }
    return next(error);
  }
});

/**
 * Delete avatar
 */
exports.deleteAvatar = async (req, res, next) => {
  try {
    const updatedUser = await updateProfile(req.user.id, { avatar_url: null });
    
    return res.status(200).json({
      success: true,
      data: {
        avatarUrl: null,
        message: 'Avatar removed successfully'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update learning preferences
 */
exports.updateLearningPreferences = async (req, res, next) => {
  try {
    const { dailyGoalMinutes, preferredSessionLength, difficultyLevel, learningStyle } = req.body;
    
    // Validate dailyGoalMinutes
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
    
    // Validate preferredSessionLength
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
    
    // Validate difficultyLevel
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
    
    // Validate learningStyle
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
    
    // Update preferences
    const prefs = {
      daily_goal_minutes: dailyGoalMinutes,
      preferred_session_length: preferredSessionLength,
      difficulty_level: difficultyLevel,
      learning_style: learningStyle
    };
    
    const updatedUser = await updatePreferences(req.user.id, 'learning', prefs);
    
    return res.status(200).json({
      success: true,
      data: {
        learningPreferences: updatedUser
      },
      meta: {
        message: 'Learning preferences updated successfully'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update notification preferences
 */
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const { emailNotifications, pushNotifications, weeklySummary, streakReminders, achievementNotifications, learningTips, marketingEmails } = req.body;
    
    // Validate all boolean fields
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
    
    // Update preferences
    const prefs = {
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      weekly_summary: weeklySummary,
      streak_reminders: streakReminders,
      achievement_notifications: achievementNotifications,
      learning_tips: learningTips,
      marketing_emails: marketingEmails
    };
    
    const result = await updatePreferences(req.user.id, 'notifications', prefs);
    
    return res.status(200).json({
      success: true,
      data: {
        notificationPreferences: {
          emailNotifications: result.email_notifications,
          pushNotifications: result.push_notifications,
          weeklySummary: result.weekly_summary,
          streakReminders: result.streak_reminders,
          achievementNotifications: result.achievement_notifications,
          learningTips: result.learning_tips,
          marketingEmails: result.marketing_emails
        }
      },
      meta: {
        message: 'Notification preferences updated successfully'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
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
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: passwordValidation.reason
        }
      });
    }
    
    // Verify current password
    const user = await findById(req.user.id, { includePassword: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }
    
    // Check if new password is same as current
    const newPasswordMatch = await bcrypt.compare(newPassword, user.password_hash);
    if (newPasswordMatch) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'SAME_PASSWORD',
          message: 'New password must be different from current password'
        }
      });
    }
    
    // Change password
    const result = await changePassword(req.user.id, newPassword);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FAILED',
          message: 'Failed to change password'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully. Please log in again with your new password.'
      },
      meta: {
        message: 'Please log in again with your new password'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get subscription information
 */
exports.getSubscription = async (req, res, next) => {
  try {
    const subscription = await getUserSubscriptions(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription information not found'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          plan: subscription.plan_name,
          status: subscription.status,
          features: subscription.features,
          price: {
            amount: subscription.price_amount,
            currency: subscription.price_currency,
            period: subscription.billing_period
          },
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          renewalDate: subscription.renewal_date,
          remainingSessions: subscription.remaining_sessions
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Request data export
 */
exports.requestDataExport = async (req, res, next) => {
  try {
    const { format } = req.body;
    
    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid format. Must be "json" or "csv"'
        }
      });
    }
    
    // Check rate limiting (max 1 export per week)
    const lastExport = await db.query(
      `SELECT data_export_requested_at 
       FROM users 
       WHERE id = $1 
       ORDER BY data_export_requested_at DESC 
       LIMIT 1`,
      [req.user.id]
    );
    
    if (lastExport.rows.length > 0 && lastExport.rows[0].data_export_requested_at) {
      const daysSinceLastExport = (Date.now() - new Date(lastExport.rows[0].data_export_requested_at)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastExport < 7) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'You can request an export once per week. Please try again later.'
          }
        });
      }
    }
    
    // Create export ID and initiate async export process
    const exportId = uuidv4();
    const requestedAt = new Date();
    const estimatedCompletionTime = new Date(requestedAt.getTime() + 60000); // 1 minute from now
    
    // Mark export as processing
    await db.query(
      `UPDATE users SET 
       data_export_url = NULL,
       data_export_requested_at = $1,
       updated_at = NOW()
       WHERE id = $2`,
      [requestedAt, req.user.id]
    );
    
    // In production, this would trigger a background job to generate the export
    // For now, we'll simulate completion
    setTimeout(() => {
      // Background job would generate and save export
      const downloadUrl = `https://cdn.smartlearn.com/exports/${req.user.id}_${exportId}.${format}`;
      db.query(
        `UPDATE users SET 
         data_export_url = $1,
         data_export_requested_at = $2
         WHERE id = $3`,
        [downloadUrl, requestedAt, req.user.id]
      );
    }, 5000); // 5 seconds for demo
    
    return res.status(200).json({
      success: true,
      data: {
        exportId: exportId,
        format: format,
        status: 'processing',
        estimatedCompletionTime: estimatedCompletionTime,
        downloadUrl: null
      },
      meta: {
        message: 'Export request received. You will receive an email when ready.'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get active sessions
 */
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await getActiveSessions(req.user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session.id,
          deviceInfo: session.device_info,
          ipAddress: session.ip_address,
          lastActiveAt: session.last_active_at,
          isCurrentSession: session.token === req.user.token,
          expiresAt: session.expires_at
        })),
        total: sessions.length
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Revoke specific session
 */
exports.revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Prevent revoking current session (safety)
    if (sessionId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_REVOCATE_CURRENT_SESSION',
          message: 'Cannot revoke your current session'
        }
      });
    }
    
    const result = await revokeSession(req.user.id, sessionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found or not owned by this user'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'Session revoked successfully'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Revoke all sessions
 */
exports.revokeAllSessions = async (req, res, next) => {
  try {
    await revokeAllSessions(req.user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'All sessions revoked. Please log in again.'
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = exports;
