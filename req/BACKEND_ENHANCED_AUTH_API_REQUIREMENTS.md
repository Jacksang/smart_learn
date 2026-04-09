# Backend API Requirements: Enhanced Authentication

**Version:** 1.0  
**Date:** 2026-04-09  
**Priority:** HIGH (Priority #2)  
**Status:** DRAFT FOR REVIEW  
**Prepared by:** Eva2 AI Guardian

---

## 📋 Overview

This document defines backend API requirements for enhanced authentication features. These APIs are critical for account recovery, email verification, and session management.

**Motivation:**
- Frontend UI requires password recovery and email verification
- Backend currently only has basic login/register
- Users need ability to manage active sessions across devices
- Need third-party auth service integration recommendation

**Target:** Complete implementation within 1-2 weeks.

---

## 🎯 Goals & Objectives

### Primary Objectives:
1. ✅ Implement password recovery flow (forgot password, reset password)
2. ✅ Add email verification system (initial verification, resend)
3. ✅ Support session management (list, revoke, revoke all)
4. ✅ Integrate third-party authentication service
5. ✅ Implement secure token handling
6. ✅ Support multi-device session management

### Third-Party Auth Service Recommendation:

**Recommended Service:** **Auth0**  
**Reason:**
- ✅ Free tier allows up to 7,000 MAUs (sufficient for MVP)
- ✅ Commercial use allowed in free tier
- ✅ SOC 2 Type II certified (security compliant)
- ✅ GDPR compliant (data privacy)
- ✅ Excellent documentation and SDKs
- ✅ Built-in passwordless auth support
- ✅ Customizable login UI components
- ✅ Supports social logins (Google, GitHub, etc.)

**Alternative:** **Firebase Authentication**  
**Reason:**
- ✅ Free tier generous (10,000 MAUs)
- ✅ Commercial use allowed
- ✅ Google-backed infrastructure
- ✅ Email verification built-in
- ✅ Phone authentication support
- ⚠️ More complex setup for email templates

**Decision:** Use **Auth0** for production auth service with email/password support.

---

## 📊 Database Schema Changes

### Existing Table: `users` - Current State
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255),  -- NULL if using OAuth
    displayName VARCHAR(100),
    role VARCHAR(50) DEFAULT 'student',
    status VARCHAR(50) DEFAULT 'active',
    emailVerified BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Tables Needed:

#### 1. Password Reset Tokens
```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_tokens_user_id (userId),
    INDEX idx_password_reset_tokens_token (token)
);
```

#### 2. Email Verification Tokens
```sql
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_verification_tokens_user_id (userId),
    INDEX idx_email_verification_tokens_token (token)
);
```

#### 3. User Sessions (for session management)
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    refreshToken VARCHAR(500),
    deviceInfo VARCHAR(255),
    ipAddress VARCHAR(45),
    userAgent VARCHAR(500),
    lastActiveAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NOT NULL,
    isRevoked BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_sessions_user_id (userId),
    INDEX idx_user_sessions_token (token),
    INDEX idx_user_sessions_expires (expiresAt)
);
```

#### 4. OAuth Users (linking to Auth0)
```sql
CREATE TABLE oauth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    auth0Id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,  -- 'auth0', 'google', 'github'
    accessToken VARCHAR(500),
    refreshToken VARCHAR(500),
    tokenExpiresAt TIMESTAMP,
    profileData JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auth0Id, provider)
);
```

---

## 🔌 API Endpoints Specification

### Base URL Pattern
All endpoints follow the pattern: `https://api.smartlearn.com/api/auth`

### Authentication
- **JWT tokens** in Authorization header
- **Refresh tokens** for session renewal
- **OAuth tokens** for third-party auth

---

### 1. Password Recovery: Request Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Purpose:** Request password reset email

**Request:**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent."
  },
  "meta": {
    "deliveryMethod": "email",
    "estimatedDelivery": "within 5 minutes"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_FOUND",
    "message": "Account not found",
    "details": [
      {
        "field": "email",
        "issue": "No account found for this email"
      }
    ]
  }
}
```

**Validation:**
- Email must be valid format
- Email must exist in system
- Can only request reset once per 10 minutes

**Rate Limiting:** 5 requests per hour per IP

---

### 2. Password Recovery: Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Purpose:** Reset password using token from email

**Request:**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)
- Cannot match last 3 passwords

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful. Please log in with your new password."
  }
}
```

**Error Responses:**
```json
// Token expired
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Reset token has expired"
  }
}

// Invalid token
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Reset token is invalid or has already been used"
  }
}

// Weak password
{
  "success": false,
  "error": {
    "code": "PASSWORD_TOO_WEAK",
    "message": "Password does not meet requirements"
  }
}
```

---

### 3. Email Verification: Request Verification

**Endpoint:** `POST /api/auth/verify-email/resend`

**Purpose:** Resend email verification link

**Request:**
```http
POST /api/auth/verify-email/resend
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent successfully"
  }
}
```

**Error Responses:**
```json
// Already verified
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_VERIFIED",
    "message": "Email is already verified"
  }
}

// Rate limited
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Please wait 10 minutes before requesting another verification email"
  }
}
```

**Rate Limiting:** 3 requests per hour per user

---

### 4. Email Verification: Complete Verification

**Endpoint:** `POST /api/auth/verify-email`

**Purpose:** Verify email using token from verification email

**Request:**
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": true
    }
  }
}
```

**Error Responses:**
```json
// Invalid token
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Verification token is invalid or has already been used"
  }
}

// Token expired
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Verification token has expired"
  }
}
```

---

### 5. Get User Sessions

**Endpoint:** `GET /api/auth/sessions`

**Purpose:** List active user sessions

**Request:**
```http
GET /api/auth/sessions
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "deviceInfo": "Chrome on Windows 10",
        "ipAddress": "192.168.1.1",
        "lastActiveAt": "2026-04-09T08:30:00Z",
        "currentSession": true,
        "expiresAt": "2026-04-16T08:30:00Z"
      },
      {
        "id": "uuid",
        "deviceInfo": "Safari on macOS",
        "ipAddress": "192.168.1.2",
        "lastActiveAt": "2026-04-08T14:20:00Z",
        "currentSession": false,
        "expiresAt": "2026-04-09T14:20:00Z"
      }
    ],
    "total": 2
  }
}
```

---

### 6. Revoke Session

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`

**Purpose:** Revoke specific user session

**Request:**
```http
DELETE /api/auth/sessions/uuid-session-id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Session revoked successfully"
  }
}
```

**Error Responses:**
```json
// Cannot revoke current session
{
  "success": false,
  "error": {
    "code": "CANNOT_REVOCATE_CURRENT_SESSION",
    "message": "Cannot revoke your current session"
  }
}
```

---

### 7. Revoke All Sessions

**Endpoint:** `DELETE /api/auth/sessions`

**Purpose:** Revoke all user sessions (force logout from all devices)

**Request:**
```http
DELETE /api/auth/sessions
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "All sessions revoked. Please log in again."
  }
}
```

---

### 8. OAuth: Link Provider

**Endpoint:** `POST /api/auth/link-provider`

**Purpose:** Link OAuth provider (e.g., Google, GitHub) to account

**Request:**
```http
POST /api/auth/link-provider
Content-Type: application/json
Authorization: Bearer <token>

{
  "provider": "google",
  "authorizationUrl": "https://auth0.com/oauth/authorize?..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://auth0.com/oauth/authorize?...",
    "provider": "google"
  }
}
```

---

### 9. OAuth: Complete Link

**Endpoint:** `POST /api/auth/complete-link`

**Purpose:** Complete OAuth provider linking

**Request:**
```http
POST /api/auth/complete-link
Content-Type: application/json

{
  "provider": "google",
  "code": "authorization-code-from-oauth",
  "userId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "OAuth provider linked successfully"
  }
}
```

---

## 🔒 Security Requirements

### Token Security:
- JWT tokens: 1 hour expiry, signed with RS256
- Refresh tokens: 30 days expiry, stored securely
- Reset tokens: 1 hour expiry, single-use
- Verification tokens: 24 hours expiry, single-use
- All tokens cryptographically secure (256-bit)

### Password Security:
- Hash using bcrypt (cost factor 12)
- Never log or return password hashes
- Enforce password complexity requirements
- Check against common passwords list (Have I Been Pwned)
- Prevent password reuse (last 3 passwords)

### Session Security:
- HTTP-only cookies for refresh tokens
- Secure flag for cookies (HTTPS only)
- SameSite=Strict for CSRF protection
- Automatic expiration
- IP binding option for high security

### Rate Limiting:
- Password reset: 5/hour per IP
- Email verification: 3/hour per user
- Password reset attempts: 10/day per email
- Session list: 60/minute per user
- Session revoke: 30/minute per user

### CSRF Protection:
- CSRF tokens for state-changing operations
- SameSite cookies
- Origin/Referer validation

---

## 📧 Email Templates

### Password Reset Email

**Subject:** Password Reset Request - Smart Learn

**Body:**
```
Hi {displayName},

You requested a password reset for your Smart Learn account.

Reset Link: {resetLink}

This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.

Best regards,
Smart Learn Team
```

### Email Verification Email

**Subject:** Verify Your Email - Smart Learn

**Body:**
```
Hi {displayName},

Welcome to Smart Learn! Please verify your email address to get started.

Verify Email: {verificationLink}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

Best regards,
Smart Learn Team
```

---

## 🧪 Testing Requirements

### Unit Tests:
- Password reset flow
- Email verification flow
- Token generation and validation
- Password strength validation
- Session management
- OAuth integration

### Integration Tests:
- Complete password recovery flow
- Complete email verification flow
- Session listing and revocation
- Rate limiting enforcement
- Email delivery simulation

### E2E Tests:
- Password reset via email
- Email verification via link
- Multi-device session management
- OAuth login flow
- Rate limit blocking

### Security Tests:
- Token injection attempts
- Rate limit bypass attempts
- CSRF attack simulations
- Session fixation tests
- OAuth flow validation

---

## 🚀 Implementation Plan

### Phase 1: Database Setup (Day 1)
- ✅ Create password_reset_tokens table
- ✅ Create email_verification_tokens table
- ✅ Create user_sessions table
- ✅ Create oauth_users table
- ✅ Add emailVerified field to users
- ✅ Write and run migrations

### Phase 2: Core Auth Endpoints (Days 2-3)
- ✅ Password reset request endpoint
- ✅ Password reset completion endpoint
- ✅ Email verification resend endpoint
- ✅ Email verification completion endpoint
- ✅ Validation and error handling
- ✅ Unit testing

### Phase 3: Session Management (Days 4-5)
- ✅ Session listing endpoint
- ✅ Session revocation endpoint
- ✅ All sessions revocation endpoint
- ✅ Token generation and validation
- ✅ Integration testing

### Phase 4: Auth0 Integration (Days 6-7)
- ✅ Auth0 tenant setup
- ✅ OAuth provider configuration
- ✅ Link/unlink provider endpoints
- ✅ Email template customization
- ✅ E2E testing

### Phase 5: Security & Polish (Day 8)
- ✅ Rate limiting implementation
- ✅ CSRF protection
- ✅ Email delivery (SendGrid)
- ✅ Security audit
- ✅ Final testing

### Phase 6: Documentation (Day 9-10)
- ✅ API documentation
- ✅ Integration guides
- ✅ Email template designs
- ✅ Security documentation
- ✅ Deployment checklist

---

## 📋 Acceptance Criteria

### Must Have (100%):
- ✅ All endpoints implemented per specification
- ✅ All validation rules enforced
- ✅ All error responses match format
- ✅ Security requirements met (password, tokens, sessions)
- ✅ Rate limiting functional
- ✅ Auth0 integration complete
- ✅ All tests passing (95%+ coverage)
- ✅ Email delivery working (SendGrid)

### Should Have:
- ✅ Complete email templates
- ✅ Session device detection
- ✅ IP logging for security
- ✅ Audit logging
- ✅ API documentation (Swagger)

### Nice to Have:
- ✅ Magic link authentication
- ✅ Biometric authentication
- ✅ Password strength meter
- ✅ Session activity notifications
- ✅ Advanced threat detection

---

## 📊 Third-Party Services

### 1. Auth0 (Authentication Service)

**Why Auth0:**
- ✅ Free tier: 7,000 MAUs (sufficient for MVP)
- ✅ Commercial use allowed
- ✅ SOC 2 Type II certified
- ✅ GDPR compliant
- ✅ Email authentication templates included
- ✅ Customizable login UI
- ✅ SDKs for all major frameworks
- ✅ Excellent documentation

**Cost:** Free (up to 7,000 MAUs)

**Setup:**
1. Create Auth0 tenant
2. Configure email provider (SendGrid)
3. Create custom login page
4. Configure JWT signing
5. Set up passwordless auth options

---

### 2. SendGrid (Email Delivery)

**Why SendGrid:**
- ✅ Free tier: 100 emails/day (sufficient for MVP)
- ✅ Commercial use allowed
- ✅ Transactional email delivery
- ✅ Email templates
- ✅ Open/click tracking
- ✅ Webhook support
- ✅ GDPR compliant

**Cost:** Free (100 emails/day)

**Setup:**
1. Create SendGrid account
2. Verify sending domain
3. Configure email templates
4. API key setup
5. Webhook configuration

---

## 📝 Migration Notes

### Database Migration Script
```sql
-- Migration: Enhanced Authentication

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(userId);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Create email verification tokens table
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(userId);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Create user sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    refreshToken VARCHAR(500),
    deviceInfo VARCHAR(255),
    ipAddress VARCHAR(45),
    userAgent VARCHAR(500),
    lastActiveAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NOT NULL,
    isRevoked BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(userId);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expiresAt);

-- Create oauth users table
CREATE TABLE oauth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    auth0Id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    accessToken VARCHAR(500),
    refreshToken VARCHAR(500),
    tokenExpiresAt TIMESTAMP,
    profileData JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_oauth_users_auth0_provider ON oauth_users(auth0Id, provider);

-- Add emailVerified to users (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastLoginAt TIMESTAMP;

-- Create index for email verification
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, emailVerified);
```

---

**Document Version:** 1.0  
**Status:** DRAFT FOR REVIEW  
**Last Updated:** 2026-04-09  
**Prepared By:** Eva2 AI Guardian  
**Next Step:** User review and approval

---

**Questions or Comments?**
- Any additional OAuth providers to support?
- Specific password requirements?
- Custom email branding requirements?
- Session timeout preferences?

**Ready to proceed with implementation once approved!** 🚀
