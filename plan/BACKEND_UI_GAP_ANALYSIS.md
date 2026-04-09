# Smart Learn - API and UI Gap Analysis

**Version:** 1.0  
**Date:** 2026-04-09  
**Prepared by:** Eva2 AI Guardian

---

## 📊 Executive Summary

This analysis identifies gaps between:
1. **Backend API Specifications** - What the backend currently supports
2. **Frontend UI Requirements** - What the UI needs to function
3. **Missing Features** - Backend APIs needed for frontend features
4. **Design Enhancements** - Backend-supported features without UI designs

---

## 📋 Analysis Results

### ✅ Gap Analysis Completed:
- **Backend APIs Documented:** 60+ endpoints across 10 resource types
- **Frontend Features Planned:** 12 major pages with API integration
- **Critical Gaps Identified:** 8 missing backend APIs
- **Design Enhancements:** 5 features with backend support but no UI

---

## 🔍 Gap Category 1: Missing Backend APIs for Frontend Features

### Critical Missing APIs Needed

#### 1. **User Profile and Settings APIs**
**Frontend Needs:**
- Edit user profile information
- Upload user avatar
- Change password
- Update notification preferences
- Update learning preferences
- Get/update subscription information
- View and download user data exports

**Missing Backend APIs:**
```bash
# Current Backend Support: NO
# Frontend Requires: YES

GET    /api/profile           # ❌ MISSING
PUT    /api/profile           # ❌ MISSING
POST   /api/profile/avatar    # ❌ MISSING
GET    /api/profile/settings  # ❌ MISSING
PUT    /api/profile/settings  # ❌ MISSING
POST   /api/profile/change-password # ❌ MISSING
GET    /api/profile/subscription # ❌ MISSING
GET    /api/profile/data-export # ❌ MISSING
```

**Impact:** Profile page cannot be implemented without these APIs.

**Recommended Backend Tasks:**
1. Create `users` table fields for profile data (displayName, avatarUrl, bio, preferences)
2. Implement avatar upload endpoint with file storage
3. Create settings schema and CRUD endpoints
4. Add password change validation and security (2FA ready)
5. Add subscription/billing fields and endpoints

---

#### 2. **Authentication Enhancement APIs**
**Frontend Needs:**
- Password reset flow
- Email verification
- Session management
- Remember me functionality
- OAuth login options (future)

**Missing Backend APIs:**
```bash
# Current Backend Support: PARTIAL
# Frontend Requires: FULL

POST   /api/auth/forgot-password      # ❌ MISSING
POST   /api/auth/reset-password       # ❌ MISSING
POST   /api/auth/verify-email         # ❌ MISSING
POST   /api/auth/resend-verification  # ❌ MISSING
POST   /api/auth/logout-all-sessions  # ❌ MISSING
```

**Impact:** Password recovery and email verification cannot be implemented.

**Recommended Backend Tasks:**
1. Add password reset token storage
2. Implement email verification flow
3. Support multiple device sessions
4. Add OAuth provider setup for future

---

#### 3. **Learning Project APIs**
**Frontend Dashboard Needs:**
- Get project list with filtering
- Create new project
- Get project details
- Get project overview (for dashboard metrics)
- Update project metadata
- Archive/delete project

**Missing Backend APIs:**
```bash
# Current Backend Support: PARTIAL
# Frontend Requires: FULL

GET    /api/projects              # ✅ EXISTS (MVP)
POST   /api/projects              # ✅ EXISTS (MVP)
GET    /api/projects/:id          # ✅ EXISTS (MVP)
PATCH  /api/projects/:id          # ✅ EXISTS (MVP)
GET    /api/projects/:id/overview # ❌ MISSING
DELETE /api/projects/:id          # ❌ MISSING (or archive)
GET    /api/projects/:id/stats    # ❌ MISSING
```

**Impact:** Dashboard metrics and project management incomplete.

**Recommended Backend Tasks:**
1. Implement project overview endpoint with aggregated data
2. Add project statistics calculation endpoint
3. Add soft delete/archival support for projects

---

#### 4. **Learning Session Enhanced APIs**
**Frontend Needs:**
- Start learning session
- Resume paused session
- Pause session
- End session
- Get session details
- Get session progress in real-time
- Update session state

**Missing Backend APIs:**
```bash
# Current Backend Support: PARTIAL
# Frontend Requires: FULL

POST   /api/projects/:projectId/sessions           # ✅ EXISTS (MVP)
GET    /api/projects/:projectId/sessions           # ✅ EXISTS (MVP)
GET    /api/projects/:projectId/sessions/:id       # ✅ EXISTS (MVP)
PATCH  /api/projects/:projectId/sessions/:id       # ✅ EXISTS (MVP)
POST   /api/projects/:projectId/sessions/:id/resume # ❌ MISSING
POST   /api/projects/:projectId/sessions/:id/pause  # ❌ MISSING
POST   /api/projects/:projectId/sessions/:id/end    # ❌ MISSING
GET    /api/projects/:projectId/sessions/:id/progress # ❌ MISSING
```

**Impact:** Session lifecycle management incomplete.

**Recommended Backend Tasks:**
1. Add session pause/resume endpoints
2. Add session end with summary endpoint
3. Add real-time progress tracking endpoint

---

#### 5. **Question and Answer Enhanced APIs**
**Frontend Quiz Needs:**
- Submit answer
- Get answer history
- Evaluate answer
- Get question details
- Get question with hints
- Get related questions
- Skip/question deferral

**Missing Backend APIs:**
```bash
# Current Backend Support: PARTIAL
# Frontend Requires: FULL

POST   /api/projects/:projectId/questions/:id/answers          # ✅ EXISTS (MVP)
GET    /api/projects/:projectId/questions/:id/answers          # ✅ EXISTS (MVP)
POST   /api/projects/:projectId/answers/evaluate               # ✅ EXISTS (MVP)
GET    /api/projects/:projectId/questions/:id                  # ✅ EXISTS (MVP)
GET    /api/projects/:projectId/questions/:id/hints            # ❌ MISSING
GET    /api/projects/:projectId/questions/:id/similar          # ❌ MISSING
POST   /api/projects/:projectId/questions/:id/defer            # ❌ MISSING (uses deferred_questions)
```

**Impact:** Quiz experience enhanced features missing.

**Recommended Backend Tasks:**
1. Add hint generation and retrieval
2. Add similar questions for reinforcement
3. Integrate question deferral with deferred_questions table

---

#### 6. **Analytics and Reporting APIs**
**Frontend Analytics Needs:**
- Get learning activity history
- Get mastery trends over time
- Get topic-level progress
- Get performance distribution
- Export analytics data
- Get weak areas trends
- Compare performance periods

**Missing Backend APIs:**
```bash
# Current Backend Support: PARTIAL
# Frontend Requires: FULL

GET    /api/projects/:projectId/analytics/activity    # ❌ MISSING
GET    /api/projects/:projectId/analytics/mastery     # ❌ MISSING
GET    /api/projects/:projectId/analytics/topics      # ❌ MISSING
GET    /api/projects/:projectId/analytics/distribution # ❌ MISSING
POST   /api/projects/:projectId/analytics/export      # ❌ MISSING
GET    /api/projects/:projectId/analytics/weak-trends # ❌ MISSING
GET    /api/projects/:projectId/analytics/compare/:period # ❌ MISSING
```

**Impact:** Analytics page cannot display detailed charts.

**Recommended Backend Tasks:**
1. Create analytics query functions for activity trends
2. Implement mastery trend calculations
3. Add topic-level analytics aggregation
4. Add export functionality (CSV/PDF)
5. Create comparison queries for different periods

---

#### 7. **Notification System APIs**
**Frontend Needs:**
- Get user notifications
- Mark notifications as read
- Delete notifications
- Get notification preferences
- Update notification preferences
- Real-time notifications (WebSocket)

**Missing Backend APIs:**
```bash
# Current Backend Support: NO
# Frontend Requires: YES

GET    /api/notifications                  # ❌ MISSING
POST   /api/notifications/:id/read         # ❌ MISSING
DELETE /api/notifications/:id              # ❌ MISSING
GET    /api/notifications/settings         # ❌ MISSING
PUT    /api/notifications/settings         # ❌ MISSING
POST   /api/notifications/test             # ❌ MISSING
```

**Impact:** Notification system cannot be implemented.

**Recommended Backend Tasks:**
1. Create notifications table and CRUD endpoints
2. Implement notification preferences
3. Add WebSocket or polling for real-time updates
4. Add notification types and templates

---

#### 8. **Content Upload and File Management APIs**
**Frontend Needs:**
- Upload file (PDF, DOCX, images)
- Extract text from files
- Process OCR for images
- Get file metadata
- Delete uploaded files
- List uploaded files

**Missing Backend APIs:**
```bash
# Current Backend Support: PARTIAL
# Frontend Requires: FULL

POST   /api/projects/:projectId/materials/upload       # ✅ EXISTS (MVP)
POST   /api/projects/:projectId/materials/base-knowledge # ✅ EXISTS (MVP)
GET    /api/projects/:projectId/materials/:id/extracted-text # ❌ MISSING
POST   /api/projects/:projectId/materials/:id/ocr      # ❌ MISSING
DELETE /api/projects/:projectId/materials/:id          # ✅ EXISTS (MVP)
GET    /api/materials/:id/download                     # ❌ MISSING
```

**Impact:** File processing and download features missing.

**Recommended Backend Tasks:**
1. Add text extraction result storage
2. Implement OCR processing endpoint
3. Add file download functionality
4. Add file metadata endpoints

---

## 🎨 Gap Category 2: Backend Features Without UI Design

### Feature 1: **Material Weighting System**
**Backend Supports:**
- ✅ `POST /api/projects/:projectId/materials/reweight` - Apply material weighting rules
- ✅ Material weight field in `source_materials` table
- ✅ Material weighting calculation logic

**Missing UI Design:**
- ❌ No UI component for adjusting material weights
- ❌ No interface for setting material importance levels
- ❌ No visualization of weighted content distribution

**Recommendation:**
Add a "Material Weights" section to the Dashboard or Settings page where users can:
- View all materials and their current weights
- Adjust weights via sliders
- See impact on outline generation
- Compare weighted vs. unweighted results

---

### Feature 2: **Base Knowledge Fallback**
**Backend Supports:**
- ✅ `POST /api/projects/:projectId/materials/base-knowledge` - Add system-generated content
- ✅ Automatic detection of insufficient materials
- ✅ Base knowledge material creation

**Missing UI Design:**
- ❌ No user-facing notification when base knowledge is added
- ❌ No indication which topics use base knowledge
- ❌ No way to review or customize base knowledge content

**Recommendation:**
Add a "Content Sources" section showing:
- Which topics use base knowledge
- Toggle to use/customize base knowledge
- Content summary for base knowledge topics
- Option to add user-provided content instead

---

### Feature 3: **Outline Versioning**
**Backend Supports:**
- ✅ Multiple outline versions stored
- ✅ `GET /api/projects/:projectId/outlines` - List all versions
- ✅ `POST /api/projects/:projectId/outlines/:outlineId/activate` - Switch versions
- ✅ Version tracking in database

**Missing UI Design:**
- ❌ No interface to view outline versions
- ❌ No comparison between versions
- ❌ No way to revert to previous versions
- ❌ No visual indicator of which version is active

**Recommendation:**
Add an "Outline Versions" page/modal showing:
- List of all outline versions with dates
- Side-by-side comparison of versions
- Version summary and changes
- Switch to different versions
- Revert to previous versions
- Visual diff between versions

---

### Feature 4: **Deferred Question Management**
**Backend Supports:**
- ✅ `GET /api/projects/:projectId/deferred-questions` - List deferred questions
- ✅ `POST /api/projects/:projectId/deferred-questions` - Add deferred question
- ✅ `PATCH /api/projects/:projectId/deferred-questions/:id` - Update status
- ✅ `POST /api/projects/:projectId/deferred-questions/:id/revisit` - Return to tutor flow
- ✅ `deferred_questions` table for parking questions

**Missing UI Design:**
- ❌ No interface to view deferred questions
- ❌ No "park question" button during learning
- ❌ No "review deferred questions" workflow
- ❌ No history of deferred questions

**Recommendation:**
Add deferred question management:
1. **During Learning Session:**
   - Add "Defer This Question" button
   - Show count of deferred questions
   - Quick access to deferred pool

2. **Deferred Questions Page:**
   - List all deferred questions
   - Filter by status (deferred, revisited, resolved)
   - Mark as resolved after answering
   - Revisit questions when ready
   - Export deferred questions

---

### Feature 5: **Session Mode Types**
**Backend Supports:**
- ✅ Multiple session modes: `learn`, `review`, `quiz`, `reinforce`
- ✅ Mode switching logic
- ✅ Session state machine
- ✅ Mode-specific question selection

**Missing UI Design:**
- ❌ No UI indicator of current mode
- ❌ No mode switching controls
- ❌ Mode-specific visual themes
- ❌ No explanation of mode differences

**Recommendation:**
Add mode-aware UI:
1. **Mode Indicator:**
   - Visual badge showing current mode
   - Different color themes per mode
   - Mode description/tooltips

2. **Mode Switcher:**
   - Switch between learn/review/quiz/reinforce
   - Mode-specific question types
   - Progress tracking per mode

3. **Mode-Specific Views:**
   - Learn: Content + occasional questions
   - Review: Rapid-fire questions
   - Quiz: Timed assessment mode
   - Reinforce: Focused practice on weak areas

---

## 📊 Gap Summary Statistics

### Backend APIs by Status:
- ✅ **Implemented (MVP):** 43 endpoints
- ❌ **Missing for Frontend:** 8 categories, ~30 endpoints
- ⚠️ **Partial Support:** 5 categories need enhancement

### Frontend Features by Status:
- ✅ **Fully Supported:** 3 pages (Dashboard, Quiz, Basic Session)
- ⚠️ **Partial Support:** 4 pages (Analytics, Weak Areas, Learning Session)
- ❌ **Unsupported:** 2 pages (Profile, Settings, Notifications)

### Design Enhancements Needed:
- ✅ **UI Components:** 117 components designed
- ⚠️ **Missing UI for Backend Features:** 5 major features
- ❌ **No UI:** 8 backend features without any design

---

## 🎯 Recommended Action Plan

### Phase A: Backend Development Priority
1. **Critical User Features** (Week 1-2)
   - User profile and settings APIs
   - Enhanced authentication (password reset)
   - Project overview and statistics APIs

2. **Session Management** (Week 2-3)
   - Session lifecycle endpoints
   - Real-time progress tracking

3. **Analytics & Reporting** (Week 3-4)
   - Analytics data aggregation
   - Export functionality
   - Comparison queries

4. **Supporting Features** (Week 4-5)
   - Notification system
   - Enhanced question APIs
   - File processing improvements

### Phase B: UI Development Priority
1. **Core Pages** (Week 1-2)
   - Dashboard with real data
   - Learning session with full lifecycle
   - Quiz with complete workflow

2. **Feature Enhancement** (Week 2-3)
   - Profile and Settings pages
   - Analytics page with charts
   - Weak areas with actions

3. **Design Enhancement** (Week 3-4)
   - Material weights interface
   - Outline versioning UI
   - Deferred question management
   - Session mode indicators

### Phase C: Integration
- Connect all backend APIs
- Full system testing
- Performance optimization
- User acceptance testing

---

## 📝 Backend Task Creation

Based on this analysis, the following backend requirement documents need to be created:

1. **Backend Profile & Settings APIs**
   - File: `req/BACKEND_PROFILE_SETTINGS_API_REQUIREMENTS.md`
   - Scope: User profile, settings, avatar, notifications, preferences
   - Priority: High

2. **Backend Enhanced Authentication**
   - File: `req/BACKEND_AUTH_ENHANCEMENTS.md`
   - Scope: Password reset, email verification, session management
   - Priority: High

3. **Backend Analytics APIs**
   - File: `req/BACKEND_ANALYTICS_API_REQUIREMENTS.md`
   - Scope: Activity, mastery trends, export, comparisons
   - Priority: Medium

4. **Backend Material & File Management**
   - File: `req/BACKEND_MATERIAL_FILE_MANAGEMENT.md`
   - Scope: OCR, text extraction, file download
   - Priority: Low

5. **Backend Notification System**
   - File: `req/BACKEND_NOTIFICATION_SYSTEM.md`
   - Scope: Notifications CRUD, preferences, real-time
   - Priority: Medium

---

## 🎨 UI Design Enhancement Recommendations

### New Pages to Design:

1. **Material Weights Page**
   - Adjust material importance
   - Visual weight distribution
   - Impact on learning content

2. **Outline Versions Page**
   - Compare outline versions
   - Revert to previous versions
   - Version history

3. **Deferred Questions Manager**
   - Queue of deferred questions
   - Review and resolve
   - Export functionality

4. **Session Mode Selector**
   - Switch between learn/review/quiz/reinforce
   - Mode-specific customization
   - Progress per mode

5. **User Profile & Settings Pages**
   - Profile editing
   - Notification preferences
   - Learning preferences
   - Account security

6. **Analytics Enhancement Page**
   - Export functionality
   - Period comparison
   - Custom date ranges
   - Topic drill-down

---

## 🔗 Next Steps

1. **Review this analysis** - Confirm gaps and priorities
2. **Create backend requirement documents** - For missing APIs
3. **Create UI design documents** - For new feature pages
4. **Update frontend requirements** - Include all necessary API integrations
5. **Prioritize implementation** - Based on user feedback and MVP goals

---

**Document Version:** 1.0  
**Status:** Ready for Review  
**Last Updated:** 2026-04-09  
**Prepared By:** Eva2 AI Guardian

**Recommendation:** Please review this analysis and let me know which gaps you want to address first. I will create detailed requirement documents for the highest priority items.
