# Backend API Requirements: User Profile & Settings

**Version:** 1.0  
**Date:** 2026-04-09  
**Priority:** HIGH  
**Status:** DRAFT FOR REVIEW  
**Prepared by:** Eva2 AI Guardian

---

## 📋 Overview

This document defines the backend API requirements for user profile and settings management features needed by the Smart Learn frontend UI.

**Motivation:**
- Frontend UI design includes comprehensive Profile and Settings pages
- Backend currently lacks these essential user management APIs
- These features are critical for user experience and account security

**Target:** Complete implementation within 1-2 weeks to support frontend development.

---

## 🎯 Goals & Objectives

### Primary Objectives:
1. ✅ Enable user profile editing (displayName, avatar, bio)
2. ✅ Support user avatar upload and management
3. ✅ Implement notification preferences management
4. ✅ Support learning preferences customization
5. ✅ Add password change functionality with security
6. ✅ Enable subscription/billing information display
7. ✅ Support user data export for compliance

### User Stories:
1. **As a user**, I want to edit my profile so that I can update my information
2. **As a user**, I want to upload an avatar so that I can personalize my account
3. **As a user**, I want to manage my notification preferences so that I receive relevant updates
4. **As a user**, I want to change my password so that I can maintain account security
5. **As a user**, I want to view my subscription details so that I know my plan status
6. **As a user**, I want to export my data so that I can have a copy of my information

---

## 📊 Database Schema Changes

### Table: `users` - Add Profile Fields

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  displayName VARCHAR(100);

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  avatarUrl VARCHAR(500);

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  bio TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  learningPreferences JSONB DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  notificationPreferences JSONB DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  subscriptionPlan VARCHAR(50) DEFAULT 'free';

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  subscriptionStatus VARCHAR(50) DEFAULT 'active';

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  subscriptionExpiresAt TIMESTAMP;

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  dataExportUrl VARCHAR(500);

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  dataExportRequestedAt TIMESTAMP;

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  lastLoginAt TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_displayname ON users(displayName);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### Table: `notification_preferences` (if not using JSONB in users)

```sql
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    emailNotifications BOOLEAN DEFAULT true,
    pushNotifications BOOLEAN DEFAULT false,
    weeklySummary BOOLEAN DEFAULT true,
    streakReminders BOOLEAN DEFAULT true,
    achievementNotifications BOOLEAN DEFAULT true,
    learningTips BOOLEAN DEFAULT true,
    marketingEmails BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId)
);
```

### Table: `user_sessions` (for session management)

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    deviceInfo VARCHAR(255),
    ipAddress VARCHAR(45),
    userAgent VARCHAR(500),
    lastActiveAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP,
    isRevoked BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_sessions_user_id (userId),
    INDEX idx_user_sessions_token (token)
);
```

---

## 🔌 API Endpoints Specification

### Base URL Pattern
All endpoints follow the pattern: `https://api.smartlearn.com/api/profile`

### Authentication
All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

---

### 1. Get User Profile

**Endpoint:** `GET /api/profile`

**Purpose:** Retrieve current user's profile information

**Request:**
```http
GET /api/profile
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "avatarUrl": "https://cdn.example.com/avatars/user123.jpg",
      "bio": "Learning enthusiast and tech lover",
      "role": "student",
      "status": "active",
      "createdAt": "2026-04-01T00:00:00Z",
      "lastLoginAt": "2026-04-09T08:30:00Z"
    },
    "subscription": {
      "plan": "premium",
      "status": "active",
      "features": ["unlimited_sessions", "advanced_analytics", "priority_support"],
      "expiresAt": "2027-04-01T00:00:00Z"
    },
    "preferences": {
      "learningPreferences": {
        "dailyGoalMinutes": 30,
        "preferredSessionLength": 25,
        "difficultyLevel": "intermediate",
        "learningStyle": "visual"
      },
      "notificationPreferences": {
        "emailNotifications": true,
        "pushNotifications": false,
        "weeklySummary": true,
        "streakReminders": true,
        "achievementNotifications": true,
        "learningTips": true
      }
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Token missing or invalid
- `404 Not Found` - User profile not found

---

### 2. Update User Profile

**Endpoint:** `PATCH /api/profile`

**Purpose:** Update user profile information

**Request:**
```http
PATCH /api/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "displayName": "John D.",
  "bio": "Updated bio text"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "John D.",
      "avatarUrl": "https://cdn.example.com/avatars/user123.jpg",
      "bio": "Updated bio text",
      "role": "student",
      "status": "active"
    }
  },
  "meta": {
    "message": "Profile updated successfully"
  }
}
```

**Request Validation:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "displayName",
        "issue": "must be between 2 and 100 characters"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `422 Unprocessable Entity` - Invalid data format

---

### 3. Upload Avatar

**Endpoint:** `POST /api/profile/avatar`

**Purpose:** Upload user avatar image

**Request:**
```http
POST /api/profile/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

form-data:
  avatar: <binary file>
```

**Supported Formats:**
- JPEG/JPG
- PNG
- WebP
- GIF (first frame only)

**Max File Size:** 5MB

**Validation:**
- File type validation
- File size validation
- Image dimensions (min: 200x200, max: 2000x2000)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatars/user123_updated.jpg",
    "thumbnailUrl": "https://cdn.example.com/avatars/user123_thumbnail.jpg"
  },
  "meta": {
    "message": "Avatar uploaded successfully"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file type or size
- `413 Payload Too Large` - File exceeds size limit
- `415 Unsupported Media Type` - Unsupported file format
- `413 Request Entity Too Large` - File too big

---

### 4. Delete Avatar

**Endpoint:** `DELETE /api/profile/avatar`

**Purpose:** Remove user avatar and revert to default

**Request:**
```http
DELETE /api/profile/avatar
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": null,
    "message": "Avatar removed successfully"
  }
}
```

---

### 5. Update Learning Preferences

**Endpoint:** `PATCH /api/profile/preferences/learning`

**Purpose:** Update user learning preferences

**Request:**
```http
PATCH /api/profile/preferences/learning
Content-Type: application/json
Authorization: Bearer <token>

{
  "dailyGoalMinutes": 45,
  "preferredSessionLength": 30,
  "difficultyLevel": "advanced",
  "learningStyle": "kinesthetic"
}
```

**Field Validation:**
- `dailyGoalMinutes`: 15-120 minutes (default: 30)
- `preferredSessionLength`: 15-60 minutes (default: 25)
- `difficultyLevel`: "beginner" | "intermediate" | "advanced" (default: "intermediate")
- `learningStyle`: "visual" | "auditory" | "read-write" | "kinesthetic" (default: "visual")

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "learningPreferences": {
      "dailyGoalMinutes": 45,
      "preferredSessionLength": 30,
      "difficultyLevel": "advanced",
      "learningStyle": "kinesthetic"
    }
  },
  "meta": {
    "message": "Learning preferences updated successfully"
  }
}
```

---

### 6. Update Notification Preferences

**Endpoint:** `PATCH /api/profile/preferences/notifications`

**Purpose:** Update notification preferences

**Request:**
```http
PATCH /api/profile/preferences/notifications
Content-Type: application/json
Authorization: Bearer <token>

{
  "emailNotifications": false,
  "pushNotifications": true,
  "weeklySummary": true,
  "streakReminders": false,
  "achievementNotifications": true,
  "learningTips": true
}
```

**Field Validation:**
- All boolean fields
- Default values when not provided

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationPreferences": {
      "emailNotifications": false,
      "pushNotifications": true,
      "weeklySummary": true,
      "streakReminders": false,
      "achievementNotifications": true,
      "learningTips": true
    }
  },
  "meta": {
    "message": "Notification preferences updated successfully"
  }
}
```

---

### 7. Change Password

**Endpoint:** `POST /api/profile/change-password`

**Purpose:** Change user password with security validation

**Request:**
```http
POST /api/profile/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "old-password-123",
  "newPassword": "new-secure-password-456",
  "confirmPassword": "new-secure-password-456"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

**Validation:**
- Current password must be correct
- New password must differ from current password
- New password must meet complexity requirements
- New password must match confirmation

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  },
  "meta": {
    "message": "Please log in again with your new password"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Password doesn't meet requirements
- `401 Unauthorized` - Current password incorrect
- `422 Unprocessable Entity` - New password matches current password
- `400 Bad Request` - Passwords don't match

---

### 8. Get Subscription Information

**Endpoint:** `GET /api/profile/subscription`

**Purpose:** Get current subscription details

**Request:**
```http
GET /api/profile/subscription
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "plan": "premium",
      "status": "active",
      "features": [
        "unlimited_sessions",
        "advanced_analytics",
        "priority_support",
        "custom_avatars",
        "export_data"
      ],
      "price": {
        "amount": 12.99,
        "currency": "USD",
        "period": "monthly"
      },
      "currentPeriodStart": "2026-04-01T00:00:00Z",
      "currentPeriodEnd": "2027-04-01T00:00:00Z",
      "remainingSessions": 4,
      "renewalDate": "2026-04-14T00:00:00Z"
    }
  }
}
```

---

### 9. Request Data Export

**Endpoint:** `POST /api/profile/data-export`

**Purpose:** Request export of user data for compliance (GDPR, CCPA)

**Request:**
```http
POST /api/profile/data-export
Authorization: Bearer <token>

{
  "format": "json" // or "csv"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "format": "json",
    "status": "processing",
    "estimatedCompletionTime": "2026-04-09T11:00:00Z",
    "downloadUrl": null
  },
  "meta": {
    "message": "Export request received. You will receive an email when ready."
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "format": "json",
    "status": "completed",
    "downloadUrl": "https://cdn.smartlearn.com/exports/user123_export_20260409.zip",
    "expiresAt": "2026-04-16T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid format
- `429 Too Many Requests` - Too many export requests (max 1 per week)

---

### 10. Get User Sessions

**Endpoint:** `GET /api/profile/sessions`

**Purpose:** List active user sessions across devices

**Request:**
```http
GET /api/profile/sessions
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
        "isCurrentSession": true,
        "expiresAt": "2026-04-16T08:30:00Z"
      },
      {
        "id": "uuid",
        "deviceInfo": "Safari on macOS",
        "ipAddress": "192.168.1.2",
        "lastActiveAt": "2026-04-08T14:20:00Z",
        "isCurrentSession": false,
        "expiresAt": "2026-04-09T14:20:00Z"
      }
    ]
  }
}
```

---

### 11. Revoke Session

**Endpoint:** `DELETE /api/profile/sessions/:sessionId`

**Purpose:** Revoke a user session (logout from device)

**Request:**
```http
DELETE /api/profile/sessions/uuid-session-id
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

---

### 12. Revoke All Sessions

**Endpoint:** `DELETE /api/profile/sessions/all`

**Purpose:** Revoke all user sessions (force logout from all devices)

**Request:**
```http
DELETE /api/profile/sessions/all
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

## 🔒 Security Requirements

### Authentication & Authorization
- All endpoints require valid JWT token
- Token validation on every request
- Session-based revocation support
- Rate limiting on sensitive operations

### Password Security
- Hash passwords using bcrypt (cost factor 12)
- Never log or return password hashes
- Enforce password complexity requirements
- Prevent common password usage
- Don't allow reusing recent passwords

### File Upload Security
- Validate file type on server
- Scan for malware before storage
- Store files outside web root
- Use signed URLs for download access
- Implement file size limits
- Process images server-side

### Data Privacy
- GDPR-compliant data export
- CCPA-compliant data deletion
- Anonymize data in logs
- No PII in error messages
- Secure data transmission (HTTPS only)

### Rate Limiting
- Profile updates: 10 requests/minute
- Password changes: 5 requests/hour
- Avatar uploads: 5 requests/hour
- Data exports: 1 request/week
- Session revocations: 10 requests/minute

---

## 🧪 Testing Requirements

### Unit Tests
- Test all service layer functions
- Test database query functions
- Test validation logic
- Test error handling

### Integration Tests
- Test API endpoints with mock database
- Test authentication flows
- Test file upload/download
- Test notification preferences

### E2E Tests
- Complete profile update flow
- Avatar upload and delete flow
- Password change flow
- Data export flow

### Security Tests
- SQL injection prevention
- XSS prevention
- CSRF protection
- Authentication bypass attempts
- File upload bypass attempts

---

## 📈 Performance Requirements

### Response Time Targets
- Profile GET: < 200ms
- Profile UPDATE: < 300ms
- Avatar upload: < 2000ms (file-dependent)
- Data export: < 30 seconds (generate time)
- Sessions list: < 100ms

### Database Optimization
- Indexes on frequently queried fields
- Query optimization for profile data
- Connection pooling
- Cache frequently accessed user data (5 minutes)

### File Storage
- CDN for avatar images
- Lazy loading for large exports
- Async processing for data exports
- Compression for export files

---

## 🚀 Implementation Plan

### Phase 1: Core Profile APIs (Week 1, Days 1-3)
- ✅ Database schema changes
- ✅ User profile GET/PATCH endpoints
- ✅ Profile validation logic
- ✅ Basic testing

### Phase 2: Avatar Management (Week 1, Days 4-5)
- ✅ File upload handling
- ✅ Image processing
- ✅ CDN integration
- ✅ Avatar CRUD endpoints
- ✅ Testing

### Phase 3: Preferences Management (Week 2, Days 1-2)
- ✅ Learning preferences endpoints
- ✅ Notification preferences endpoints
- ✅ Validation and defaults
- ✅ Testing

### Phase 4: Security Features (Week 2, Days 3-4)
- ✅ Password change functionality
- ✅ Session management
- ✅ Security validations
- ✅ Testing

### Phase 5: Additional Features (Week 2, Day 5)
- ✅ Subscription info endpoint
- ✅ Data export functionality
- ✅ Final testing
- ✅ Documentation

---

## 📋 Acceptance Criteria

### Must Have (100%):
- ✅ All endpoints implemented per specification
- ✅ All validation rules enforced
- ✅ All error responses match format
- ✅ Security requirements met
- ✅ Performance targets achieved
- ✅ All tests passing (95%+ coverage)

### Should Have:
- ✅ Rate limiting implemented
- ✅ File upload security
- ✅ Comprehensive error logging
- ✅ API documentation (Swagger/OpenAPI)

### Nice to Have:
- ✅ Email notifications for profile changes
- ✅ Session device detection improvements
- ✅ Advanced analytics for profile usage
- ✅ Audit logging for sensitive operations

---

## 🔍 Testing Scenarios

### User Profile Updates
1. Update displayName successfully
2. Update bio with long text
3. Update with invalid characters
4. Update with empty displayName
5. Update with displayName > 100 characters

### Avatar Upload
1. Upload valid JPEG file
2. Upload valid PNG file
3. Upload file > 5MB (should fail)
4. Upload invalid file type
5. Upload missing file
6. Upload valid image > 2000x2000

### Password Change
1. Change password successfully
2. Change password with weak password
3. Change password with matching current password
4. Change password with mismatched confirmation
5. Change password with wrong current password
6. Change password with special characters

### Notifications
1. Update all notification preferences
2. Update single notification preference
3. Update without providing preferences (use defaults)

### Sessions
1. List active sessions
2. Revoke single session
3. Revoke all sessions
4. Revoke current session (self-protection)
5. Revoke non-existent session

---

## 📝 Migration Notes

### Database Migration
```sql
-- Run this migration before deploying new endpoints
-- Migration version: 1.0

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS displayName VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatarUrl VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS learningPreferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notificationPreferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscriptionPlan VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscriptionStatus VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscriptionExpiresAt TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dataExportUrl VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dataExportRequestedAt TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastLoginAt TIMESTAMP;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_displayname ON users(displayName);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add indexes for new JSONB fields
CREATE INDEX IF NOT EXISTS idx_users_learning_difficulty ON users((learningPreferences->>'difficultyLevel'));
CREATE INDEX IF NOT EXISTS idx_users_learning_style ON users((learningPreferences->>'learningStyle'));

-- Create notification_preferences table if needed
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    emailNotifications BOOLEAN DEFAULT true,
    pushNotifications BOOLEAN DEFAULT false,
    weeklySummary BOOLEAN DEFAULT true,
    streakReminders BOOLEAN DEFAULT true,
    achievementNotifications BOOLEAN DEFAULT true,
    learningTips BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId)
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    deviceInfo VARCHAR(255),
    ipAddress VARCHAR(45),
    userAgent VARCHAR(500),
    lastActiveAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP,
    isRevoked BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_sessions_user_id (userId),
    INDEX idx_user_sessions_token (token)
);
```

---

## 📊 Monitoring & Logging

### Key Metrics to Track
- Profile update success/failure rates
- Avatar upload success/failure rates
- Password change success/failure rates
- API response times (p50, p95, p99)
- Rate limit hits
- Data export completion times

### Log Events to Capture
- User profile updated (user ID, fields changed)
- Avatar uploaded (file size, duration)
- Password changed (timestamp, device info)
- Session revoked (user ID, device)
- Data export requested (format, user ID)

### Alerting Conditions
- High error rate (>5%) on any endpoint
- Average response time > 1 second
- Multiple failed authentication attempts
- Unusual upload activity (many large files)
- Data export failures

---

**Document Version:** 1.0  
**Status:** DRAFT FOR REVIEW  
**Last Updated:** 2026-04-09  
**Prepared By:** Eva2 AI Guardian  
**Next Step:** User review and approval before implementation

---

**Questions or Comments?**
- Any additional fields needed in user profile?
- Specific subscription plan requirements?
- Additional security requirements?
- Integration with existing auth system?

**Ready to proceed with implementation once approved!** 🚀
