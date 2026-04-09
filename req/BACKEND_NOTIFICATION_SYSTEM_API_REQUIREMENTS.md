# Backend API Requirements: Notification System

**Version:** 1.0  
**Date:** 2026-04-09  
**Priority:** MEDIUM (Priority #4)  
**Status:** DRAFT FOR REVIEW  
**Prepared by:** Eva2 AI Guardian

---

## 📋 Overview

This document defines backend API requirements for the Smart Learn notification system. This system will handle user notifications, preferences, and delivery across multiple channels (in-app, email, push).

**Motivation:**
- Frontend requires notification functionality for engagement
- Backend currently lacks notification infrastructure
- Need multi-channel delivery (in-app, email, push)
- User preference management essential
- Real-time updates required

**Target:** Complete implementation within 2 weeks.

---

## 🎯 Goals & Objectives

### Primary Objectives:
1. ✅ Implement notification CRUD operations
2. ✅ Support multiple notification channels (in-app, email, push)
3. ✅ User notification preferences management
4. ✅ Real-time notification delivery
5. ✅ Notification templates and personalization
6. ✅ Integration with third-party services (SendGrid, Firebase)

### Third-Party Services Recommendation:

#### 1. **Firebase Cloud Messaging (FCM)** - Push Notifications
**Why Firebase:**
- ✅ Free tier: Unlimited messages (100k/month free)
- ✅ Commercial use allowed
- ✅ Google-backed infrastructure
- ✅ Cross-platform (iOS, Android, Web)
- ✅ Excellent documentation
- ✅ Easy integration with existing Firebase setup
- ✅ Supports data messages, notification messages
- ✅ Topic-based messaging

**Cost:** Free (sufficient for MVP)

#### 2. **SendGrid** - Email Notifications
**Why SendGrid:**
- ✅ Free tier: 100 emails/day
- ✅ Commercial use allowed
- ✅ Transactional email delivery
- ✅ Email templates
- ✅ Webhook support
- ✅ GDPR compliant
- ✅ Already used for password reset

**Cost:** Free (100 emails/day)

#### 3. **In-App Storage** - PostgreSQL (Existing)
- ✅ Use existing PostgreSQL database
- ✅ No additional cost
- ✅ Full control over data
- ✅ Can query notification history
- ✅ Supports rich notifications

---

## 📊 Database Schema

### Table: `notifications`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- achievement, reminder, progress, system, marketing
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',    -- structured data for actions
    channel VARCHAR(50) NOT NULL,  -- email, push, in_app, all
    priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high
    imageUrl VARCHAR(500),
    actionUrl VARCHAR(500),
    actionLabel VARCHAR(100),
    expiresAt TIMESTAMP,
    sentAt TIMESTAMP,
    deliveredAt TIMESTAMP,
    readAt TIMESTAMP,
    isRead BOOLEAN DEFAULT false,
    isSent BOOLEAN DEFAULT false,
    isDelivered BOOLEAN DEFAULT false,
    failedAttempts INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_id (userId),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_read (isRead),
    INDEX idx_notifications_created (createdAt),
    INDEX idx_notifications_sent (isSent, userId)
);
```

### Table: `notification_templates`

```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    emailBody TEXT,
    pushBody TEXT,
    inAppBody TEXT,
    variables JSONB NOT NULL,  -- list of template variables
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type)
);
```

### Table: `notification_preferences`

```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id) ON DELETE CASCADE,
    emailEnabled BOOLEAN DEFAULT true,
    pushEnabled BOOLEAN DEFAULT false,
    emailAchievement BOOLEAN DEFAULT true,
    emailReminder BOOLEAN DEFAULT true,
    emailProgress BOOLEAN DEFAULT true,
    emailSystem BOOLEAN DEFAULT true,
    emailMarketing BOOLEAN DEFAULT false,
    pushAchievement BOOLEAN DEFAULT true,
    pushReminder BOOLEAN DEFAULT false,
    pushProgress BOOLEAN DEFAULT true,
    pushSystem BOOLEAN DEFAULT false,
    pushMarketing BOOLEAN DEFAULT false,
    inAppAchievement BOOLEAN DEFAULT true,
    inAppReminder BOOLEAN DEFAULT true,
    inAppProgress BOOLEAN DEFAULT true,
    inAppSystem BOOLEAN DEFAULT true,
    inAppMarketing BOOLEAN DEFAULT true,
    quietHoursStart TIME DEFAULT '22:00',
    quietHoursEnd TIME DEFAULT '07:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId)
);
```

### Table: `notification_delivery_logs`

```sql
CREATE TABLE notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notificationId UUID REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,  -- pending, sent, delivered, failed
    deliveryId VARCHAR(255),  -- FCM message ID, SendGrid ID, etc.
    attempt INTEGER DEFAULT 1,
    errorMessage TEXT,
    metadata JSONB DEFAULT '{}',
    attemptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_delivery_notification_id (notificationId),
    INDEX idx_notification_delivery_status (status)
);
```

---

## 🔌 API Endpoints Specification

### Base URL Pattern
All endpoints follow the pattern: `https://api.smartlearn.com/api/notifications`

### Authentication
All endpoints require authentication via JWT token

### Rate Limiting
- Notifications list: 60/minute
- Mark read: 120/minute
- Preferences update: 30/minute
- Test notification: 10/minute

---

### 1. Get User Notifications

**Endpoint:** `GET /api/notifications`

**Purpose:** Retrieve user's notifications with filtering and pagination

**Request:**
```http
GET /api/notifications?type=achievement&read=false&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Filter by type (achievement, reminder, progress, system, marketing)
- `read` (optional): Filter by read status (true/false/all)
- `limit` (default: 20, max: 100): Items per page
- `page` (default: 1): Page number
- `channel` (optional): Filter by channel (email, push, in_app, all)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "achievement",
        "title": "Streak Master! 🎉",
        "body": "You've maintained a 14-day learning streak!",
        "imageUrl": "https://cdn.smartlearn.com/images/streak-master.png",
        "actionUrl": "/achievements",
        "actionLabel": "View Achievements",
        "data": {
          "streak": 14,
          "badge": "streak_master"
        },
        "sentAt": "2026-04-09T09:00:00Z",
        "deliveredAt": "2026-04-09T09:00:05Z",
        "read": false,
        "channel": "in_app",
        "priority": "normal",
        "expiresAt": "2026-04-16T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "summary": {
      "total": 45,
      "unread": 12,
      "today": 3,
      "thisWeek": 8
    }
  }
}
```

---

### 2. Get Single Notification

**Endpoint:** `GET /api/notifications/:notificationId`

**Purpose:** Get specific notification details

**Request:**
```http
GET /api/notifications/uuid-notification
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "uuid",
      "type": "achievement",
      "title": "Streak Master! 🎉",
      "body": "You've maintained a 14-day learning streak!",
      "imageUrl": "https://cdn.smartlearn.com/images/streak-master.png",
      "actionUrl": "/achievements",
      "actionLabel": "View Achievements",
      "data": {
        "streak": 14,
        "badge": "streak_master"
      },
      "sentAt": "2026-04-09T09:00:00Z",
      "deliveredAt": "2026-04-09T09:00:05Z",
      "read": false,
      "channel": "in_app",
      "priority": "normal",
      "deliveryStatus": "delivered",
      "deliveryLogs": [
        {
          "id": "uuid-log",
          "channel": "in_app",
          "status": "delivered",
          "deliveredAt": "2026-04-09T09:00:05Z"
        }
      ]
    }
  }
}
```

---

### 3. Mark Notification as Read

**Endpoint:** `POST /api/notifications/:notificationId/read`

**Purpose:** Mark a specific notification as read

**Request:**
```http
POST /api/notifications/uuid-notification/read
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "read": true,
    "readAt": "2026-04-09T10:30:00Z"
  },
  "meta": {
    "message": "Notification marked as read"
  }
}
```

**Batch Read:**
```http
POST /api/notifications/read-all
Content-Type: application/json
Authorization: Bearer <token>

{
  "notificationIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "readCount": 3,
    "readAt": "2026-04-09T10:30:00Z"
  }
}
```

---

### 4. Mark All Notifications as Read

**Endpoint:** `POST /api/notifications/mark-all-read`

**Purpose:** Mark all unread notifications as read

**Request:**
```http
POST /api/notifications/mark-all-read
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "readCount": 12,
    "readAt": "2026-04-09T10:30:00Z"
  },
  "meta": {
    "message": "All unread notifications marked as read"
  }
}
```

---

### 5. Delete Notification

**Endpoint:** `DELETE /api/notifications/:notificationId`

**Purpose:** Delete a notification from user's inbox

**Request:**
```http
DELETE /api/notifications/uuid-notification
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Notification deleted successfully"
  }
}
```

---

### 6. Delete All Notifications

**Endpoint:** `DELETE /api/notifications`

**Purpose:** Delete all notifications for user

**Request:**
```http
DELETE /api/notifications?type=marketing&read=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Filter by type
- `read` (optional): Filter by read status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deletedCount": 5,
    "message": "5 notifications deleted successfully"
  }
}
```

---

### 7. Get Notification Preferences

**Endpoint:** `GET /api/notifications/preferences`

**Purpose:** Get user's notification preferences

**Request:**
```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "emailEnabled": true,
      "pushEnabled": false,
      "emailAchievement": true,
      "emailReminder": true,
      "emailProgress": true,
      "emailSystem": true,
      "emailMarketing": false,
      "pushAchievement": true,
      "pushReminder": false,
      "pushProgress": true,
      "pushSystem": false,
      "pushMarketing": false,
      "inAppAchievement": true,
      "inAppReminder": true,
      "inAppProgress": true,
      "inAppSystem": true,
      "inAppMarketing": true,
      "quietHoursEnabled": true,
      "quietHoursStart": "22:00",
      "quietHoursEnd": "07:00",
      "timezone": "America/New_York"
    }
  }
}
```

---

### 8. Update Notification Preferences

**Endpoint:** `PATCH /api/notifications/preferences`

**Purpose:** Update user's notification preferences

**Request:**
```http
PATCH /api/notifications/preferences
Content-Type: application/json
Authorization: Bearer <token>

{
  "pushEnabled": true,
  "emailAchievement": false,
  "quietHoursEnabled": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "pushEnabled": true,
      "emailAchievement": false,
      "quietHoursEnabled": false,
      "updatedAt": "2026-04-09T10:30:00Z"
    }
  },
  "meta": {
    "message": "Preferences updated successfully"
  }
}
```

---

### 9. Send Test Notification

**Endpoint:** `POST /api/notifications/test`

**Purpose:** Send a test notification to verify settings

**Request:**
```http
POST /api/notifications/test
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "achievement",
  "title": "Test Notification",
  "body": "This is a test notification",
  "channel": "in_app"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid-test",
    "message": "Test notification sent successfully"
  }
}
```

---

### 10. Delete All Notifications from User

**Endpoint:** `DELETE /api/notifications/all`

**Purpose:** Delete all notifications (for account deletion)

**Request:**
```http
DELETE /api/notifications/all
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deletedCount": 150,
    "message": "All notifications deleted successfully"
  }
}
```

---

## 🔧 Notification Delivery Services

### Firebase Cloud Messaging (FCM)

#### Configuration:
```typescript
// fcm-configuration.ts
import { initializeApp, getApps, messaging } from 'firebase-admin';

const fcm = getApps().length === 0
  ? initializeApp({
      credential: applicationDefault(),
    })
  : getApps()[0];

export const admin = messaging();
```

#### Push Notification Function:
```typescript
// services/notificationService.ts
export async function sendPushNotification(
  userId: string,
  notification: NotificationPayload
): Promise<DeliveryResult> {
  const user = await userService.getUserById(userId);
  
  const fcmToken = await fcmTokenService.getFcmToken(userId);
  if (!fcmToken) {
    return { success: false, reason: 'NO_FCM_TOKEN' };
  }

  const message: messaging.Message = {
    token: fcmToken.token,
    notification: {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
    },
    data: notification.data || {},
    android: {
      priority: notification.priority === 'high' ? 'high' : 'normal',
      notification: {
        sound: 'default',
        clickAction: 'OPEN_APP',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  const response = await admin.messaging().send(message);
  
  return {
    success: true,
    deliveryId: response,
    channel: 'push',
  };
}
```

### SendGrid Email Service

#### Configuration:
```typescript
// sendgrid-config.ts
import { SendGridMailService } from '@sendgrid/mail';

export const sendgrid = new SendGridMailService(process.env.SENDGRID_API_KEY);
```

#### Email Notification Function:
```typescript
// services/emailNotificationService.ts
export async function sendEmailNotification(
  userId: string,
  notification: EmailNotificationPayload
): Promise<DeliveryResult> {
  const user = await userService.getUserById(userId);
  
  const template = await getNotificationTemplate(
    notification.type,
    'email'
  );

  const msg = {
    to: user.email,
    from: 'noreply@smartlearn.com',
    templateId: template.templateId,
    dynamicTemplateData: {
      user_name: user.displayName,
      notification_title: notification.title,
      notification_body: notification.body,
      notification_action_label: notification.actionLabel,
      notification_action_url: notification.actionUrl,
      notification_image: notification.imageUrl,
      unsubscribe_url: `https://smartlearn.com/notifications/unsubscribe?token=...`,
    },
  };

  try {
    await sendgrid.send(msg);
    return {
      success: true,
      deliveryId: msg.id,
      channel: 'email',
    };
  } catch (error) {
    return {
      success: false,
      reason: 'EMAIL_SEND_FAILED',
      errorMessage: error.message,
    };
  }
}
```

---

## 📧 Email Templates

### Achievement Email Template

**Subject:** `{notification_title}`

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{notification_title}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #3B82F6;">{{notification_title}}</h1>
    <p style="font-size: 16px;">{{notification_body}}</p>
    
    {{#notification_image}}
    <img src="{{notification_image}}" alt="Achievement" style="max-width: 100%; border-radius: 8px; margin: 20px 0;">
    {{/notification_image}}
    
    {{#notification_action_url}}
    <a href="{{notification_action_url}}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
      {{notification_action_label}}
    </a>
    {{/notification_action_url}}
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
    
    <p style="font-size: 12px; color: #666; text-align: center;">
      You're receiving this because you have Smart Learn notifications enabled.<br>
      <a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
```

---

## 🧪 Testing Requirements

### Unit Tests:
- Notification creation
- Template rendering
- Delivery logic
- Preference filtering
- Quiet hours logic

### Integration Tests:
- Complete notification flow
- FCM push delivery
- SendGrid email delivery
- Notification filtering by preferences
- Quiet hours enforcement

### E2E Tests:
- Send and receive notification
- Mark as read
- Update preferences
- Delete notifications
- Real-time updates

### Performance Tests:
- Batch notification creation < 2 seconds
- Push delivery < 1 second
- Email delivery < 3 seconds
- Query performance with pagination

---

## 🚀 Implementation Plan

### Phase 1: Database Setup (Day 1-2)
- ✅ Create notifications table
- ✅ Create notification_templates table
- ✅ Create notification_preferences table
- ✅ Create notification_delivery_logs table
- ✅ Create indexes
- ✅ Write and run migrations

### Phase 2: Core CRUD APIs (Days 3-4)
- ✅ Notifications list endpoint
- ✅ Single notification endpoint
- ✅ Mark as read endpoints
- ✅ Delete endpoints
- ✅ Validation and error handling
- ✅ Unit testing

### Phase 3: Preferences Management (Day 5)
- ✅ Preferences get endpoint
- ✅ Preferences update endpoint
- ✅ Preference validation
- ✅ Filtering by preferences
- ✅ Testing

### Phase 4: FCM Integration (Days 6-7)
- ✅ Firebase setup
- ✅ Push notification service
- ✅ FCM token management
- ✅ Push delivery logic
- ✅ Testing with devices

### Phase 5: SendGrid Integration (Days 8-9)
- ✅ SendGrid setup
- ✅ Email service
- ✅ Template rendering
- ✅ Email delivery logic
- ✅ Testing with email clients

### Phase 6: Notification System (Day 10)
- ✅ Notification creation service
- ✅ Delivery scheduling
- ✅ Retry logic
- ✅ Delivery logging
- ✅ Final testing

---

## 🔒 Security Requirements

### Authentication:
- All endpoints require valid JWT token
- Token validation on every request
- User ownership validation
- No cross-user notification access

### Data Privacy:
- No sensitive data in notifications
- PII not stored in delivery logs
- Email unsubscribe links
- Data retention policies
- GDPR compliance support

### Rate Limiting:
- Notifications list: 60/minute
- Mark read: 120/minute
- Preferences update: 30/minute
- Test notification: 10/minute
- Email: 100/day (SendGrid limit)
- Push: Unbounded (FCM free tier)

### Spam Prevention:
- Quiet hours enforcement
- User preference respect
- Email unsubscribe support
- Rate limiting on notification creation
- Template validation

---

## 📊 Notification Types and Templates

### Achievement Notifications
```json
{
  "type": "achievement",
  "title": "Streak Master! 🎉",
  "body": "You've maintained a 14-day learning streak!",
  "data": {
    "streak": 14,
    "badge": "streak_master"
  },
  "channels": ["in_app", "email", "push"]
}
```

### Progress Notifications
```json
{
  "type": "progress",
  "title": "Weekly Progress Report 📊",
  "body": "You've completed 5 sessions this week!",
  "data": {
    "sessionsCompleted": 5,
    "timeSpent": 240,
    "masteryGain": 12
  },
  "channels": ["in_app", "email"]
}
```

### Reminder Notifications
```json
{
  "type": "reminder",
  "title": "Continue Learning 📚",
  "body": "You have a session in progress. Continue where you left off!",
  "data": {
    "sessionId": "uuid",
    "progress": 65,
    "timeSpent": 45
  },
  "channels": ["in_app", "push", "email"]
}
```

### System Notifications
```json
{
  "type": "system",
  "title": "System Update ℹ️",
  "body": "New features available! Check out the latest improvements.",
  "data": {
    "featureName": "Enhanced Analytics",
    "version": "2.0"
  },
  "channels": ["in_app", "email"]
}
```

### Marketing Notifications
```json
{
  "type": "marketing",
  "title": "Special Offer 🎉",
  "body": "Get 50% off Premium for the next 24 hours!",
  "data": {
    "discountCode": "SPECIAL50",
    "expiresIn": 86400
  },
  "channels": ["in_app", "email"],
  "marketingOptInRequired": true
}
```

---

## 📈 Analytics and Monitoring

### Metrics to Track:
- Notification delivery rates by channel
- Open rates (email)
- Click-through rates
- User engagement by notification type
- Unsubscribe rates
- Quiet hours usage
- Error rates by delivery channel

### Monitoring:
- Delivery success/failure rates
- API response times
- Rate limit hits
- FCM delivery status
- SendGrid delivery status
- User feedback (clicks, dismissals)

### Alerting:
- High error rates (>5%)
- Delivery failures (FCM/SendGrid downtime)
- Unusual spike in notifications
- Rate limit approaching
- Template rendering errors

---

**Document Version:** 1.0  
**Status:** DRAFT FOR REVIEW  
**Last Updated:** 2026-04-09  
**Prepared By:** Eva2 AI Guardian  
**Next Step:** User review and approval

---

**Questions or Comments?**
- Specific notification types to prioritize?
- Email template customization requirements?
- FCM vs alternative push service?
- Additional analytics requirements?
- Quiet hours timezone handling?

**Ready to proceed with implementation once approved!** 🚀
