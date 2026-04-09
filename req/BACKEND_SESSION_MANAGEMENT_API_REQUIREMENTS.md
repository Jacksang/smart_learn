# Backend API Requirements: Session Management

**Version:** 1.0  
**Date:** 2026-04-09  
**Priority:** HIGH (Priority #3)  
**Status:** DRAFT FOR REVIEW  
**Prepared by:** Eva2 AI Guardian

---

## 📋 Overview

This document defines backend API requirements for enhanced session management features. These APIs are critical for complete learning session lifecycle management including pause/resume, end with summary, and real-time progress tracking.

**Motivation:**
- Frontend UI requires complete session lifecycle management
- Backend currently lacks pause/resume endpoints
- No real-time progress tracking API
- Missing session summary generation
- Need to support tutor-flow state machine

**Target:** Complete implementation within 1-2 weeks.

---

## 🎯 Goals & Objectives

### Primary Objectives:
1. ✅ Implement session pause/resume endpoints
2. ✅ Add session end with summary generation
3. ✅ Create real-time progress tracking endpoint
4. ✅ Support session state machine transitions
5. ✅ Enable session mode switching (learn/review/quiz/reinforce)
6. ✅ Support session data export

### User Stories:
1. **As a learner**, I want to pause my session so that I can take a break
2. **As a learner**, I want to resume my paused session so that I can continue where I left off
3. **As a learner**, I want my session to end with a summary so that I know what I accomplished
4. **As a learner**, I want real-time progress updates so that I can track my learning
5. **As a learner**, I want to switch between session modes so that I can focus on different learning activities
6. **As a learner**, I want to export my session data so that I can review it offline

---

## 📊 Database Schema Changes

### Current Tables (from D0.1):
```sql
-- learning_sessions table (existing)
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projectId UUID REFERENCES learning_projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',  -- active, paused, completed
    mode VARCHAR(50) DEFAULT 'learn',     -- learn, review, quiz, reinforce
    currentOutlineItemId UUID,
    currentQuestionId UUID,
    progress INTEGER DEFAULT 0,           -- 0-100 percentage
    startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pausedAt TIMESTAMP,
    completedAt TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    summary TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Tables Needed:

#### 1. Session Progress Snapshots (for real-time tracking)
```sql
CREATE TABLE session_progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessionId UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER,                    -- 0-100 percentage
    currentOutlineItemId UUID,
    currentQuestionId UUID,
    questionsAnswered INTEGER DEFAULT 0,
    correctAnswers INTEGER DEFAULT 0,
    timeSpent INTEGER,                   -- seconds
    mood INTEGER,                        -- 1-5 scale
    notes TEXT,
    data JSONB DEFAULT '{}',             -- additional metrics
    INDEX idx_session_progress_session_id (sessionId),
    INDEX idx_session_progress_timestamp (timestamp)
);
```

#### 2. Session Summaries (for end-of-session summaries)
```sql
CREATE TABLE session_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessionId UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT,
    insights JSONB DEFAULT '{}',
    weakAreas TEXT[],
    strengths TEXT[],
    nextRecommendations TEXT[],
    masteryChange INTEGER,               -- percentage point change
    timeSpent INTEGER,                   -- total seconds
    questionsAttempted INTEGER,
    questionsCorrect INTEGER,
    accuracy NUMERIC(5,2),               -- percentage
    created BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_summaries_session_id (sessionId)
);
```

#### 3. Session Mode History (for mode switching tracking)
```sql
CREATE TABLE session_mode_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessionId UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    fromMode VARCHAR(50),
    toMode VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    previousModeData JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_mode_session_id (sessionId),
    INDEX idx_session_mode_timestamp (timestamp)
);
```

### Modified Tables:

#### Add fields to learning_sessions:
```sql
ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS currentMode VARCHAR(50) DEFAULT 'learn';
ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS pauseReason VARCHAR(100);
ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS sessionDuration INTEGER;  -- total seconds learned
ALTER TABLE learning_sessions ADD COLUMN IF NOT EXISTS lastProgressUpdate TIMESTAMP;
```

#### Update indexes:
```sql
-- Index for active sessions
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status 
    ON learning_sessions(status, projectId);

-- Index for session mode
CREATE INDEX IF NOT EXISTS idx_learning_sessions_mode 
    ON learning_sessions(mode, projectId);

-- Index for last progress update
CREATE INDEX IF NOT EXISTS idx_learning_sessions_progress_update 
    ON learning_sessions(projectId, lastProgressUpdate);
```

---

## 🔌 API Endpoints Specification

### Base URL Pattern
All endpoints follow the pattern: `https://api.smartlearn.com/api/projects/:projectId/sessions`

### Authentication
All endpoints require authentication via JWT token

### Rate Limiting
- Session create: 60/minute
- Session update: 120/minute
- Progress tracking: 30/minute

---

### 1. Create Session

**Endpoint:** `POST /api/projects/:projectId/sessions`

**Purpose:** Start a new learning session

**Request:**
```http
POST /api/projects/uuid/projects/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "mode": "learn",
  "outlineItemId": "uuid-topic",
  "preferences": {
    "questionCount": 5,
    "autoAdvance": true,
    "showHints": true
  }
}
```

**Modes:**
- `learn`: Learn content with occasional questions
- `review`: Rapid-fire review questions
- `quiz`: Timed assessment mode
- `reinforce`: Focus on weak areas

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "projectId": "uuid-project",
      "status": "active",
      "mode": "learn",
      "currentOutlineItemId": "uuid-topic",
      "currentQuestionId": null,
      "progress": 0,
      "startedAt": "2026-04-09T10:00:00Z",
      "metadata": {
        "questionCount": 5,
        "autoAdvance": true,
        "showHints": true
      },
      "outline": {
        "id": "uuid-outline",
        "title": "Introduction to AWS",
        "topics": [
          {
            "id": "uuid-topic",
            "title": "Core AWS Services",
            "summary": "EC2, S3, VPC basics"
          }
        ]
      }
    }
  }
}
```

**Error Responses:**
```json
// No active outline for project
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_OUTLINE",
    "message": "Please generate an outline before starting a session"
  }
}

// Invalid outline item
{
  "success": false,
  "error": {
    "code": "OUTLINE_ITEM_NOT_FOUND",
    "message": "Outline item not found or not available for this session mode"
  }
}
```

---

### 2. Pause Session

**Endpoint:** `POST /api/projects/:projectId/sessions/:sessionId/pause`

**Purpose:** Pause an active learning session

**Request:**
```http
POST /api/projects/uuid/projects/sessions/uuid-sessions/pause
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "taking a break"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "status": "paused",
      "pausedAt": "2026-04-09T10:30:00Z",
      "pauseReason": "taking a break",
      "progress": 35,
      "currentOutlineItemId": "uuid-topic",
      "timeSpentInSession": 1800  // seconds
    }
  },
  "meta": {
    "message": "Session paused. You can resume anytime."
  }
}
```

**Validation:**
- Session must be in 'active' status
- Cannot pause completed sessions
- Reason is optional, defaults to "user pause"

---

### 3. Resume Session

**Endpoint:** `POST /api/projects/:projectId/sessions/:sessionId/resume`

**Purpose:** Resume a paused learning session

**Request:**
```http
POST /api/projects/uuid/projects/sessions/uuid-sessions/resume
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "status": "active",
      "pausedAt": null,
      "progress": 35,
      "currentOutlineItemId": "uuid-topic",
      "currentQuestionId": "uuid-question",
      "resumedAt": "2026-04-09T11:00:00Z",
      "outline": {
        "id": "uuid-outline",
        "title": "Introduction to AWS",
        "nextTopics": [
          {
            "id": "uuid-topic-2",
            "title": "Compute Services",
            "summary": "EC2, Lambda basics"
          }
        ]
      }
    }
  }
}
```

**Features:**
- Continues from where user left off
- Shows progress from pause point
- Suggests next topics based on learning flow
- Resets pause timer

---

### 4. Update Session Progress (Real-time)

**Endpoint:** `PATCH /api/projects/:projectId/sessions/:sessionId`

**Purpose:** Update session progress in real-time

**Request:**
```http
PATCH /api/projects/uuid/projects/sessions/uuid-sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "progress": 45,
  "currentQuestionId": "uuid-question-2",
  "outlineItemId": "uuid-topic-2",
  "timeSpentInSession": 2100,
  "metadata": {
    "currentTopic": "Compute Services",
    "questionsAnswered": 3,
    "correctAnswers": 2,
    "mood": 4
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "progress": 45,
      "updatedProgressSnapshot": {
        "id": "uuid-snapshot",
        "timestamp": "2026-04-09T11:05:00Z",
        "progress": 45,
        "timeSpent": 2100,
        "questionsAnswered": 3,
        "correctAnswers": 2,
        "mood": 4
      }
    }
  },
  "meta": {
    "message": "Progress updated successfully"
  }
}
```

**Features:**
- Creates real-time progress snapshot
- Updates session metadata
- Triggers progress calculations
- Sends WebSocket updates (if enabled)

---

### 5. End Session with Summary

**Endpoint:** `POST /api/projects/:projectId/sessions/:sessionId/end`

**Purpose:** Complete a learning session and generate summary

**Request:**
```http
POST /api/projects/uuid/projects/sessions/uuid-sessions/end
Authorization: Bearer <token>

{
  "feedback": {
    "difficulty": "just_right",
    "engagement": "high",
    "notes": "Found the VPC explanation very helpful"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "status": "completed",
      "completedAt": "2026-04-09T11:30:00Z",
      "duration": 2700,  // total seconds
      "progress": 65
    },
    "summary": {
      "id": "uuid-summary",
      "title": "Introduction to AWS - Summary",
      "summary": "You spent 45 minutes learning about Core AWS Services. You answered 8 questions, with 6 correct. Your mastery of this topic improved by 12%.",
      "insights": {
        "strongPoints": [
          "EC2 services",
          "S3 storage concepts"
        ],
        "weakPoints": [
          "VPC networking details"
        ],
        "learningSpeed": "moderate",
        "retentionScore": 0.75
      },
      "weakAreas": [
        {
          "topicId": "uuid-topic-3",
          "title": "VPC Networking",
          "masteryScore": 45,
          "recommendation": "Review the VPC documentation and practice with subnet configuration"
        }
      ],
      "strengths": [
        {
          "topicId": "uuid-topic-1",
          "title": "Compute Services",
          "masteryScore": 85
        }
      ],
      "nextRecommendations": [
        {
          "type": "practice",
          "title": "EC2 Configuration Practice",
          "description": "Hands-on EC2 setup exercise",
          "estimatedTime": 15
        },
        {
          "type": "review",
          "title": "VPC Networking Review",
          "description": "Quick VPC concepts refresher",
          "estimatedTime": 10
        }
      ],
      "masteryChange": {
        "overall": 12,
        "topics": [
          {
            "topicId": "uuid-topic-1",
            "change": 15
          },
          {
            "topicId": "uuid-topic-2",
            "change": 8
          }
        ]
      },
      "performance": {
        "questionsAttempted": 8,
        "questionsCorrect": 6,
        "accuracy": 75.0,
        "averageTimePerQuestion": 180  // seconds
      },
      "feedback": {
        "difficulty": "just_right",
        "engagement": "high",
        "notes": "Found the VPC explanation very helpful"
      }
    }
  }
}
```

**Summary Generation Logic:**
- Analyzes questions answered
- Calculates accuracy and engagement
- Identifies strong/weak areas based on performance
- Generates personalized recommendations
- Calculates mastery score changes
- Considers user feedback

---

### 6. Get Session Details

**Endpoint:** `GET /api/projects/:projectId/sessions/:sessionId`

**Purpose:** Get detailed session information

**Request:**
```http
GET /api/projects/uuid/projects/sessions/uuid-session
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "projectId": "uuid-project",
      "status": "active",
      "mode": "learn",
      "currentOutlineItemId": "uuid-topic",
      "currentQuestionId": "uuid-question",
      "progress": 45,
      "startedAt": "2026-04-09T10:00:00Z",
      "lastProgressUpdate": "2026-04-09T11:05:00Z",
      "timeSpentInSession": 2100,
      "questionsAnswered": 3,
      "correctAnswers": 2,
      "outline": {
        "id": "uuid-outline",
        "title": "Introduction to AWS",
        "currentItem": {
          "id": "uuid-topic",
          "title": "Core AWS Services",
          "summary": "EC2, S3, VPC basics",
          "progress": 45
        }
      },
      "progress": [
        {
          "timestamp": "2026-04-09T10:30:00Z",
          "progress": 15
        },
        {
          "timestamp": "2026-04-09T11:00:00Z",
          "progress": 35
        },
        {
          "timestamp": "2026-04-09T11:05:00Z",
          "progress": 45
        }
      ]
    }
  }
}
```

---

### 7. Get Session Progress (Real-time)

**Endpoint:** `GET /api/projects/:projectId/sessions/:sessionId/progress`

**Purpose:** Get real-time progress updates

**Request:**
```http
GET /api/projects/uuid/projects/sessions/uuid-session/progress
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "progress": {
      "currentProgress": 45,
      "timeSpentInSession": 2100,
      "questionsAnswered": 3,
      "correctAnswers": 2,
      "accuracy": 66.67,
      "currentTopic": {
        "id": "uuid-topic",
        "title": "Core AWS Services",
        "completionPercentage": 45
      },
      "nextTopics": [
        {
          "id": "uuid-topic-2",
          "title": "Compute Services",
          "estimatedTime": 20
        },
        {
          "id": "uuid-topic-3",
          "title": "Storage Services",
          "estimatedTime": 15
        }
      ],
      "recentActivity": [
        {
          "timestamp": "2026-04-09T11:05:00Z",
          "type": "question_answered",
          "details": {
            "questionId": "uuid-question",
            "correct": true,
            "timeSpent": 120
          }
        },
        {
          "timestamp": "2026-04-09T11:02:00Z",
          "type": "topic_completed",
          "details": {
            "topicId": "uuid-topic-1",
            "completionScore": 75
          }
        }
      ],
      "mastery": {
        "current": 67,
        "previous": 55,
        "change": 12
      }
    }
  }
}
```

---

### 8. Switch Session Mode

**Endpoint:** `PATCH /api/projects/:projectId/sessions/:sessionId/mode`

**Purpose:** Switch session between modes (learn/review/quiz/reinforce)

**Request:**
```http
PATCH /api/projects/uuid/projects/sessions/uuid-sessions/mode
Content-Type: application/json
Authorization: Bearer <token>

{
  "mode": "quiz",
  "reason": "test my knowledge"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "mode": "quiz",
      "previousMode": "learn",
      "modeSwitchedAt": "2026-04-09T11:10:00Z"
    },
    "modeInfo": {
      "currentMode": "quiz",
      "description": "Timed assessment mode - test your knowledge under time pressure",
      "recommendedQuestionCount": 10,
      "features": [
        "timer active",
        "no hints",
        "immediate feedback"
      ],
      "estimatedDuration": 15
    },
    "modeHistory": [
      {
        "fromMode": "learn",
        "toMode": "quiz",
        "timestamp": "2026-04-09T11:10:00Z",
        "reason": "test my knowledge"
      }
    ]
  }
}
```

**Mode Transition Rules:**
- Can switch between any modes
- Progress preserved across modes
- Some features mode-specific (e.g., quiz mode has timer)
- Mode switches logged for analytics

---

### 9. Get Session Mode History

**Endpoint:** `GET /api/projects/:projectId/sessions/:sessionId/mode-history`

**Purpose:** View all mode switches during session

**Request:**
```http
GET /api/projects/uuid/projects/sessions/uuid-session/mode-history
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "modeHistory": [
      {
        "id": "uuid",
        "fromMode": "learn",
        "toMode": "quiz",
        "reason": "test my knowledge",
        "timestamp": "2026-04-09T11:10:00Z"
      },
      {
        "id": "uuid",
        "fromMode": "review",
        "toMode": "learn",
        "reason": "needed more content",
        "timestamp": "2026-04-09T10:45:00Z"
      }
    ],
    "modeDistribution": {
      "learn": 60,
      "quiz": 30,
      "review": 10
    }
  }
}
```

---

## 🔒 Security Requirements

### Authentication:
- All endpoints require valid JWT token
- Token validation on every request
- Session ownership validation
- Project access validation

### Session Security:
- Sessions are tied to specific user/project
- Cannot access sessions from other projects
- Cannot view other users' sessions
- Session tokens expire after 24 hours

### Rate Limiting:
- Session create: 60/minute per user
- Session update: 120/minute per session
- Progress tracking: 30/minute per session
- Mode switching: 30/minute per session

### Data Privacy:
- No sensitive data in session metadata
- Personal information not logged
- Progress data encrypted at rest
- Session summaries anonymized for analytics

---

## 🧪 Testing Requirements

### Unit Tests:
- Session creation logic
- Pause/resume transitions
- Progress calculation
- Summary generation
- Mode switching logic
- Time tracking calculations

### Integration Tests:
- Complete session lifecycle
- Progress updates
- Mode switching
- Summary generation flow
- WebSocket real-time updates

### E2E Tests:
- Start session and complete
- Pause and resume session
- Switch between modes
- End session and view summary
- Real-time progress tracking
- Multi-device session access

### Performance Tests:
- Session creation < 200ms
- Progress update < 100ms
- Summary generation < 2 seconds
- Real-time updates < 500ms latency

---

## 🚀 Implementation Plan

### Phase 1: Database Setup (Day 1-2)
- ✅ Create session_progress_snapshots table
- ✅ Create session_summaries table
- ✅ Create session_mode_history table
- ✅ Add new fields to learning_sessions
- ✅ Create indexes
- ✅ Write and run migrations

### Phase 2: Session CRUD (Days 3-4)
- ✅ Session creation endpoint
- ✅ Session details endpoint
- ✅ Progress update endpoint
- ✅ Validation and error handling
- ✅ Unit testing

### Phase 3: Pause/Resume (Day 5)
- ✅ Pause session endpoint
- ✅ Resume session endpoint
- ✅ Pause reason tracking
- ✅ Time calculation
- ✅ Integration testing

### Phase 4: Summary Generation (Days 6-7)
- ✅ End session endpoint
- ✅ Summary generation logic
- ✅ Weak areas identification
- ✅ Recommendations generation
- ✅ Performance optimization

### Phase 5: Mode Switching (Days 8-9)
- ✅ Mode switch endpoint
- ✅ Mode history tracking
- ✅ Mode-specific features
- ✅ Mode transition logic
- ✅ Testing

### Phase 6: Real-time Features (Day 10)
- ✅ Real-time progress tracking
- ✅ WebSocket integration
- ✅ Progress calculation
- ✅ Activity timeline
- ✅ Final testing

---

## 📋 Acceptance Criteria

### Must Have (100%):
- ✅ All endpoints implemented per specification
- ✅ All validation rules enforced
- ✅ All error responses match format
- ✅ Session state machine working correctly
- ✅ Summary generation accurate
- ✅ All tests passing (95%+ coverage)
- ✅ Real-time updates working
- ✅ Performance targets achieved

### Should Have:
- ✅ WebSocket real-time updates
- ✅ Activity timeline
- ✅ Mode-specific features
- ✅ Session export functionality
- ✅ API documentation (Swagger)

### Nice to Have:
- ✅ Progress predictions
- ✅ Learning path optimization
- ✅ Session comparison analytics
- ✅ Mobile push notifications
- ✅ Offline mode support

---

## 📊 Summary Generation Logic

### Summary Content:
1. **Overall Performance**
   - Questions attempted vs correct
   - Accuracy percentage
   - Average time per question
   - Total session duration

2. **Topic Performance**
   - Mastery score per topic
   - Strong points (high mastery)
   - Weak areas (low mastery)
   - Mastery changes

3. **Learning Insights**
   - Learning speed analysis
   - Retention score
   - Engagement level
   - Difficulty perception

4. **Recommendations**
   - Practice exercises
   - Review materials
   - Next topics in sequence
   - Time estimates

### Algorithm:
- Analyze answer patterns
- Calculate topic-level mastery
- Identify performance trends
- Generate personalized insights
- Create actionable recommendations

---

## 🔗 Integration Points

### With Outline System:
- Current outline item tracking
- Next topics suggestion
- Topic completion detection
- Learning path navigation

### With Question System:
- Answer tracking
- Question difficulty adaptation
- Performance-based question selection
- Correct/incorrect analysis

### With Progress System:
- Progress snapshot creation
- Mastery score updates
- Weak areas identification
- Learning analytics

### With Notification System:
- Session completion notifications
- Streak reminders
- Achievement unlocks
- Progress updates

---

**Document Version:** 1.0  
**Status:** DRAFT FOR REVIEW  
**Last Updated:** 2026-04-09  
**Prepared By:** Eva2 AI Guardian  
**Next Step:** User review and approval

---

**Questions or Comments?**
- Specific summary content requirements?
- Additional session metadata fields?
- WebSocket vs polling preference for real-time?
- Session export format requirements?

**Ready to proceed with implementation once approved!** 🚀
