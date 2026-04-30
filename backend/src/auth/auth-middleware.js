/**
 * Authentication Middleware
 * Rate limiting and validation for auth endpoints
 */

const rateLimit = require('express-rate-limit');

// == Rate Limiters ==

/**
 * Password reset request limiter
 * 5 requests per hour per IP
 */
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in an hour.',
    error: 'PASSWORD_RESET_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset completion limiter
 * 5 requests per hour per IP
 */
exports.passwordResetCompleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in an hour.',
    error: 'PASSWORD_RESET_COMPLETE_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Email verification request limiter
 * 3 requests per hour per user email
 */
exports.emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body.email || req.ip,
  message: {
    success: false,
    message: 'Too many verification requests. Please try again in an hour.',
    error: 'EMAIL_VERIFICATION_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Session list limiter
 * 60 requests per minute per user
 */
exports.sessionListLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    message: 'Too many session list requests. Please try again in a minute.',
    error: 'SESSION_LIST_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Session revoke limiter
 * 10 requests per minute per user
 */
exports.sessionRevokeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: 'Too many session revocation requests. Please try again in a minute.',
    error: 'SESSION_REVOKE_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// == Validation Middleware ==

/**
 * Validate password reset request body
 * Checks: email is present and valid format
 */
exports.validatePasswordResetRequest = (req, res, next) => {
  const { email } = req.body;
  
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  next();
};

/**
 * Validate password reset completion body
 * Checks: token is present and valid, password meets requirements
 */
exports.validatePasswordResetComplete = (req, res, next) => {
  const { token, newPassword } = req.body;
  
  const errors = [];
  
  if (!token) {
    errors.push('Reset token is required');
  }
  
  if (!newPassword) {
    errors.push('New password is required');
  } else {
    // Password strength validation
    if (newPassword.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      errors.push('Password must contain at least one special character');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  // Check if token is valid hex (64 characters = 32 bytes)
  if (token && !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid token format',
      errors: ['Token must be a valid hexadecimal string']
    });
  }
  
  next();
};

/**
 * Validate email verification request body
 * Checks: email is present and valid format (if provided)
 */
exports.validateEmailVerificationRequest = (req, res, next) => {
  const { email } = req.body;
  
  // If email is provided, validate it
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      errors: ['Email must be a valid email address']
    });
  }
  
  next();
};

/**
 * Validate email verification completion body
 * Checks: token is present and valid format
 */
exports.validateEmailVerificationComplete = (req, res, next) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required',
      errors: ['Token is required']
    });
  }
  
  // Check if token is valid hex (64 characters = 32 bytes)
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid token format',
      errors: ['Token must be a valid hexadecimal string']
    });
  }
  
  next();
};

/**
 * Validate OAuth provider linking
 * Checks: provider, provider_user_id, and access_token are present
 */
exports.validateOAuthLinking = (req, res, next) => {
  const { provider, provider_user_id, access_token } = req.body;
  
  const errors = [];
  
  // Validate provider
  const validProviders = ['google', 'facebook', 'github', 'apple'];
  if (!provider) {
    errors.push('Provider is required');
  } else if (!validProviders.includes(provider.toLowerCase())) {
    errors.push(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
  }
  
  // Validate provider user ID
  if (!provider_user_id) {
    errors.push('Provider user ID is required');
  }
  
  // Validate access token
  if (!access_token) {
    errors.push('Access token from OAuth provider is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  next();
};


