# Smart Learn - Complete Application Workflows

**Version:** 1.0  
**Date:** 2026-04-09  
**Structure:** Layered workflow documentation

---

## Workflow Layers

This document is organized into **3 layers** of workflows, each focusing on a different aspect of the application:

### Layer 1: Navigation & Core Flows
- Application navigation
- Authentication flows
- Main page transitions
- Basic user journeys

### Layer 2: Learning & Assessment Flows
- Learning session lifecycle
- Quiz workflows
- Progress tracking
- Weak areas remediation

### Layer 3: Advanced & System Flows
- Recommendation engine
- Notification system
- Data export/sharing
- Error handling

---

## Layer 1: Navigation & Core Flows

### 1.1 App Navigation Flow

```mermaid
graph TD
    Start[🔑 App Launch] --> Auth{Authenticated?}
    Auth -->|Yes| Dashboard[📊 Dashboard Page]
    Auth -->|No| Login[🔐 Login Screen]
    
    Login --> Signup[📝 Create Account]
    Signup --> Dashboard
    
    Dashboard --> NavMenu[🧭 Navigation Menu]
    
    NavMenu --> Dashboard
    NavMenu --> Analytics[📈 Analytics Page]
    NavMenu --> WeakAreas[🎯 Weak Areas Page]
    NavMenu --> Mastery[📊 Mastery Visualization]
    NavMenu --> Profile[👤 Profile Page]
    NavMenu --> Settings[⚙️ Settings Page]
    NavMenu --> Learning[📚 Learning Session]
    
    Analytics --> Dashboard
    Analytics --> WeakAreas
    Analytics --> Mastery
    
    WeakAreas --> Dashboard
    WeakAreas --> Analytics
    WeakAreas --> Mastery
    
    Mastery --> Dashboard
    Mastery --> Analytics
    Mastery --> WeakAreas
    
    Profile --> Dashboard
    Profile --> Settings
    
    Settings --> Dashboard
    Settings --> Profile
    Settings --> Notifications[🔔 Notification Settings]
    Settings --> Privacy[🔒 Privacy Settings]
    Settings --> Preferences[🎨 Preferences]
    
    Learning --> Dashboard
    Learning --> Quiz[📝 Quiz Page]
    
    Quiz --> Dashboard
    Quiz --> Learning
    Quiz --> Review[📊 Quiz Results]
    
    Review --> Dashboard
    Review --> Learning
    
    style Start fill:#3B82F6,stroke:#1E40AF,color:#FFFFFF
    style Dashboard fill:#10B981,stroke:#059669,color:#FFFFFF
    style Analytics fill:#3B82F6,stroke:#1E40AF,color:#FFFFFF
    style WeakAreas fill:#F59E0B,stroke:#D97706,color:#111827
    style Mastery fill:#8B5CF6,stroke:#7C3AED,color:#FFFFFF
    style Profile fill:#6B7280,stroke:#4B5563,color:#FFFFFF
    style Settings fill:#6B7280,stroke:#4B5563,color:#FFFFFF
    style Login fill:#EF4444,stroke:#DC2626,color:#FFFFFF
    style Signup fill:#EC4899,stroke:#DB2777,color:#FFFFFF
    style Learning fill:#F9FAFB
    style Quiz fill:#3B82F6,color:#FFFFFF
    style Review fill:#10B981,color:#FFFFFF
```

### 1.2 Authentication Flow

```mermaid
flowchart LR
    Start[🔑 App Launch] --> AuthCheck{Authenticated?}
    AuthCheck -->|No| Login[🔐 Login Screen]
    AuthCheck -->|Yes| Dashboard[📊 Dashboard]
    
    Login --> PasswordInput[🔒 Enter Password]
    PasswordInput --> PasswordValidate{Valid?}
    PasswordValidate -->|No| LoginError[❌ Error: Invalid password]
    LoginError --> PasswordInput
    PasswordValidate -->|Yes| Dashboard
    
    PasswordInput --> SignupLink[📝 No account? Sign up]
    SignupLink --> Signup[📝 Create Account]
    
    Signup --> EmailInput[📧 Enter Email]
    EmailInput --> SignupValidate{Valid?}
    SignupValidate -->|No| SignupError[❌ Invalid email]
    SignupError --> EmailInput
    SignupValidate -->|Yes| PasswordSetup[🔒 Set Password]
    
    PasswordSetup --> PasswordCreate{Strong?}
    PasswordCreate -->|No| PasswordWeak[⚠️ Password too weak]
    PasswordWeak --> PasswordSetup
    PasswordCreate -->|Yes| AccountCreated[✅ Account Created]
    
    AccountCreated --> Dashboard
    
    style Start fill:#3B82F6,color:#FFFFFF
    style Dashboard fill:#10B981,color:#FFFFFF
    style Login fill:#EF4444,color:#FFFFFF
    style Signup fill:#EC4899,color:#FFFFFF
    style PasswordInput fill:#F9FAFB
    style PasswordSetup fill:#F9FAFB
    style EmailInput fill:#F9FAFB
    style LoginError fill:#F9FAFB
    style SignupError fill:#F9FAFB
    style PasswordWeak fill:#F59E0B
    style AccountCreated fill:#10B981,color:#FFFFFF
```

### 1.3 Learning Session Initiation

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Dashboard as 📊 Dashboard
    participant Session as 🎯 Session Manager
    participant Learning as 📚 Learning System
    participant API as 🔌 Backend API
    
    User->>Dashboard: Load Dashboard
    Dashboard->>API: Fetch session status
    API-->>Dashboard: Return session data
    
    User->>Dashboard: Click "Resume Session" 🎵
    Dashboard->>Session: Initiate resume
    Session->>API: Get current session details
    API-->>Session: Session loaded
    
    Session->>Learning: Load lesson content
    Learning-->>Session: Content ready
    Session->>Dashboard: Show learning session
    
    Session->>Learning: Display topic
    Learning-->>User: Lesson displayed
    
    User->>Learning: Start learning
    Learning->>Session: Track progress
    Session-->>Dashboard: Update progress bar
    
    User->>Session: Click "Pause" ⏸
    Session->>Learning: Pause session
    Learning-->>Session: Session paused
    Session->>Dashboard: Show pause status
```

---

## Layer 2: Learning & Assessment Flows

### 2.1 Learning Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NotStarted: No Active Session
    
    NotStarted --> SessionStarted: Click "Resume" 🎵
    NotStarted --> SessionStarted: Click "New Lesson" 📚
    
    SessionStarted --> PreLearning: Load Session
    PreLearning --> Learning: Start Learning
    Learning --> Learning: Study Content
    Learning --> Practice: Start Practice Mode
    Practice --> Practice: Answer Questions
    Practice --> Quiz: Complete Practice, Start Quiz
    Quiz --> Quiz: Take Quiz
    Quiz --> Review: Complete Quiz
    
    Review --> Review: Review Answers
    Review --> Feedback: Submit All Answers
    Feedback --> Results: Calculate Scores
    
    Results --> Results: Show Results Summary
    Results --> SessionSummary: Complete Session
    
    SessionSummary --> SessionComplete: End Session
    
    SessionComplete --> SessionStarted: Resume Later
    SessionComplete --> NotStarted: Complete All Topics
    
    note right of NotStarted
        User has no active session
        Last session stats displayed
    end note
    
    note right of SessionStarted
        Current session loaded
        Progress: 67% complete
        Topics: 4/6 completed
        Next: Electron Configuration
    end note
    
    note right of PreLearning
        Session metadata loaded
        User context retrieved
        Learning goals displayed
    end note
    
    note right of Learning
        AI-generated content displayed
        User interacts with material
        Progress tracked real-time
    end note
    
    note right of Practice
        User answers practice questions
        Immediate feedback provided
        Weak areas identified
    end note
    
    note right of Quiz
        Timed quiz experience
        Multiple question types
        Score tracked and stored
    end note
    
    note right of Review
        User reviews all answers
        Can resubmit if needed
        Final submission triggered
    end note
    
    note right of Feedback
        AI evaluates responses
        Detailed feedback generated
        Mastery updated
    end note
    
    note right of Results
        Quiz scores displayed
        Weak areas highlighted
        Recommendations provided
    end note
    
    note right of SessionSummary
        Session complete message
        Mastery improvements shown
        Next steps suggested
    end note
    
    note right of SessionComplete
        Progress saved to database
        Statistics updated
        User ready for next session
    end note
```

### 2.2 Quiz Workflow

```mermaid
flowchart TD
    QuizStart[📝 Quiz Initiation] --> QuizPreview[📋 Quiz Preview]
    
    QuizPreview --> PreviewInfo{View Preview?}
    PreviewInfo -->|Yes| ShowDetails[📊 Show Quiz Details]
    PreviewInfo -->|No| StartQuiz[▶️ Start Quiz]
    
    ShowDetails --> PreviewInfo
    
    StartQuiz --> QuizActive[📝 Quiz Active]
    QuizActive --> QuizQuestion{Answer Question?}
    
    QuizQuestion -->|Multiple Choice| MCQ[📝 Multiple Choice]
    QuizQuestion -->|Fill Blank| FB[📝 Fill in Blank]
    QuizQuestion -->|Matching| Match[🎯 Matching]
    QuizQuestion -->|True/False| TF[❓ True/False]
    
    MCQ --> MCQAnswer[Select Answer]
    FB --> FBAnswer[Type Answer]
    Match --> MatchAnswer[Drag & Drop]
    TF --> TFAnswer[Select True/False]
    
    MCQAnswer --> SubmitAnswer{Submit?}
    FBAnswer --> SubmitAnswer
    MatchAnswer --> SubmitAnswer
    TFAnswer --> SubmitAnswer
    
    SubmitAnswer -->|Yes| CheckAnswer{Correct?}
    SubmitAnswer -->|No| SkipAnswer[⏭ Skip Question]
    
    CheckAnswer -->|Correct| ScorePoint[✅ +1 Point]
    CheckAnswer -->|Incorrect| Feedback[❌ Show Correct Answer]
    
    ScorePoint --> NextQuestion{More Questions?}
    Feedback --> NextQuestion
    
    NextQuestion -->|Yes| QuizQuestion
    NextQuestion -->|No| QuizComplete[✅ Quiz Complete]
    
    SkipAnswer --> NextQuestion
    
    QuizComplete --> CalculateScore[📊 Calculate Score]
    CalculateScore --> DisplayResults[📊 Show Results]
    
    DisplayResults --> ReviewMode{Review?}
    ReviewMode -->|Yes| QuestionReview[📖 Review Each Question]
    ReviewMode -->|No| EndQuiz[✅ End Quiz]
    
    QuestionReview --> Continue[✅ Continue]
    Continue --> EndQuiz
    Continue --> Retake[📝 Retake Quiz]
    
    Retake --> QuizStart
    EndQuiz --> Dashboard[📊 Return to Dashboard]
    
    style QuizStart fill:#3B82F6,color:#FFFFFF
    style QuizPreview fill:#F9FAFB
    style PreviewInfo diamond
    style ShowDetails fill:#F9FAFB
    style StartQuiz fill:#10B981,color:#FFFFFF
    style QuizActive fill:#3B82F6,color:#FFFFFF
    style QuizQuestion diamond
    style MCQ fill:#F9FAFB
    style FB fill:#F9FAFB
    style Match fill:#F9FAFB
    style TF fill:#F9FAFB
    style MCQAnswer fill:#F9FAFB
    style FBAnswer fill:#F9FAFB
    style MatchAnswer fill:#F9FAFB
    style TFAnswer fill:#F9FAFB
    style SubmitAnswer diamond
    style SkipAnswer fill:#F59E0B,color:#111827
    style CheckAnswer diamond
    style ScorePoint fill:#10B981,color:#FFFFFF
    style Feedback fill:#EF4444,color:#FFFFFF
    style NextQuestion diamond
    style QuizComplete fill:#10B981,color:#FFFFFF
    style CalculateScore fill:#3B82F6,color:#FFFFFF
    style DisplayResults fill:#3B82F6,color:#FFFFFF
    style ReviewMode diamond
    style QuestionReview fill:#F9FAFB
    style EndQuiz fill:#10B981,color:#FFFFFF
    style Continue fill:#3B82F6,color:#FFFFFF
    style Retake fill:#F59E0B,color:#111827
    style Dashboard fill:#10B981,color:#FFFFFF
```

### 2.3 Weak Areas Remediation Flow

```mermaid
flowchart TD
    WeakStart[🎯 Weak Areas Page] --> PriorityFilter{Filter by Priority?}
    
    PriorityFilter -->|High| ShowHigh[🔴 High Priority]
    PriorityFilter -->|Medium| ShowMedium[🟡 Medium Priority]
    PriorityFilter -->|Low| ShowLow[🟢 Low Priority]
    PriorityFilter -->|All| ShowAll[📊 Show All Topics]
    
    ShowHigh --> HighCards[🔴 Priority Cards Displayed]
    ShowMedium --> MediumCards[🟡 Priority Cards Displayed]
    ShowLow --> LowCards[🟢 Priority Cards Displayed]
    ShowAll --> AllCards[📊 All Priority Cards]
    
    HighCards --> HighAction{Card Action?}
    MediumCards --> MediumAction{Card Action?}
    LowCards --> LowAction{Card Action?}
    AllCards --> AllAction{Card Action?}
    
    HighAction -->|Review| StartReview[📖 Start Review Action]
    HighAction -->|Practice| StartPractice[🎯 Start Practice]
    HighAction -->|Watch| StartVideo[📺 Watch Tutorial]
    HighAction -->|Dismiss| DismissCard[🗑️ Dismiss Card]
    HighAction -->|Schedule| ScheduleLater[⏰ Schedule Later]
    
    StartReview --> ReviewContent[📚 Review Content Load]
    ReviewContent --> ReviewStart[🎯 Review Started]
    ReviewStart --> ReviewProgress[📊 Progress Tracked]
    ReviewProgress --> ReviewComplete[✅ Review Complete]
    ReviewComplete --> MasteryCheck[📈 Check Mastery Update]
    MasteryCheck --> MasteryImproved{Improved?}
    MasteryImproved -->|Yes| CardUpdate[✅ Update Card Status]
    MasteryImproved -->|No| WeakStart
    CardUpdate --> WeakStart
    
    StartPractice --> PracticeSession[🎯 Practice Session Initiated]
    PracticeSession --> PracticeInteractive[🎮 Interactive Practice]
    PracticeInteractive --> PracticeComplete[✅ Practice Complete]
    PracticeComplete --> WeakStart
    
    StartVideo --> VideoPlayer[📺 Video Player]
    VideoPlayer --> VideoWatch[▶️ Video Watching]
    VideoWatch --> VideoComplete[✅ Video Complete]
    VideoComplete --> WeakStart
    
    DismissCard --> CardRemoved[🗑️ Card Removed]
    CardRemoved --> WeakStart
    
    ScheduleLater --> ScheduleForm[📅 Schedule Form]
    ScheduleForm --> ScheduleConfirm[✅ Schedule Confirmed]
    ScheduleConfirm --> WeakStart
    
    MediumAction --> SimilarActions[🟡 Similar Actions]
    LowAction --> SimilarActions
    
    SimilarActions --> WeakStart
    
    style WeakStart fill:#F59E0B,color:#111827
    style PriorityFilter diamond
    style ShowHigh fill:#EF4444,color:#FFFFFF
    style ShowMedium fill:#F59E0B,color:#111827
    style ShowLow fill:#10B981,color:#FFFFFF
    style ShowAll fill:#F3F4F6,color:#111827
    style HighCards fill:#FEF2F2,color:#111827
    style MediumCards fill:#FFFBEB,color:#111827
    style LowCards fill:#ECFDF5,color:#111827
    style AllCards fill:#F3F4F6,color:#111827
    style HighAction diamond
    style MediumAction diamond
    style LowAction diamond
    style AllAction diamond
    style StartReview fill:#3B82F6,color:#FFFFFF
    style StartPractice fill:#3B82F6,color:#FFFFFF
    style StartVideo fill:#3B82F6,color:#FFFFFF
    style DismissCard fill:#6B7280,color:#FFFFFF
    style ScheduleLater fill:#6B7280,color:#FFFFFF
    style ReviewContent fill:#F9FAFB
    style ReviewStart fill:#3B82F6,color:#FFFFFF
    style ReviewProgress fill:#3B82F6,color:#FFFFFF
    style ReviewComplete fill:#10B981,color:#FFFFFF
    style MasteryCheck fill:#F9FAFB
    style MasteryImproved diamond
    style CardUpdate fill:#10B981,color:#FFFFFF
    style PracticeSession fill:#3B82F6,color:#FFFFFF
    style PracticeInteractive fill:#3B82F6,color:#FFFFFF
    style PracticeComplete fill:#10B981,color:#FFFFFF
    style VideoPlayer fill:#F9FAFB
    style VideoWatch fill:#3B82F6,color:#FFFFFF
    style VideoComplete fill:#10B981,color:#FFFFFF
    style CardRemoved fill:#EF4444,color:#FFFFFF
    style ScheduleForm fill:#F9FAFB
    style ScheduleConfirm fill:#10B981,color:#FFFFFF
```

---

## Layer 3: Advanced & System Flows

### 3.1 Recommendation Engine Flow

```mermaid
flowchart TD
    RecEngine[🤖 Recommendation Engine] --> InputAnalysis{Analyze Input?}
    
    InputAnalysis -->|New Data| AnalyzeData[📊 Analyze User Data]
    InputAnalysis -->|Periodic| AnalyzeTrends[📈 Analyze Trends]
    
    AnalyzeData --> MasteryScore[📊 Calculate Mastery Score]
    MasteryScore --> EngagementLevel[📈 Determine Engagement]
    EngagementLevel --> LearningStyle[🎯 Identify Learning Style]
    LearningStyle --> WeakPoints[🔍 Identify Weak Points]
    WeakPoints --> GoalAlignment[🎯 Check Goal Alignment]
    
    AnalyzeTrends --> HistoricalData[📚 Review Historical Data]
    HistoricalData --> PatternDetection[🔍 Detect Patterns]
    PatternDetection --> RecommendationStrategy[🎯 Formulate Strategy]
    
    RecommendationStrategy --> ContentMatching[📚 Match Content]
    ContentMatching --> ContentRecs[📚 Generate Content Recommendations]
    
    AnalyzeTrends --> Personalization[🎨 Personalize Recommendations]
    Personalization --> ContentRecs
    
    ContentRecs --> PriorityScoring[🔢 Score by Priority]
    PriorityScoring --> ContextualFilter[🔍 Apply Contextual Filters]
    ContextualFilter --> FinalRecs[📚 Final Recommendations]
    
    FinalRecs --> DashboardPlacement[📊 Place on Dashboard]
    FinalRecs --> WeakAreasPlacement[🎯 Place on Weak Areas]
    FinalRecs --> AnalyticsPlacement[📈 Place on Analytics]
    
    DashboardPlacement --> UserSees[👤 User Sees Recommendations]
    WeakAreasPlacement --> UserSees
    AnalyticsPlacement --> UserSees
    
    UserSees --> UserAction{User Interaction?}
    UserAction -->|Follows| TrackSuccess[📊 Track Success]
    UserAction -->|Ignores| TrackIgnore[📊 Track Ignore]
    UserAction -->|Modifies| TrackModify[📊 Track Modification]
    
    TrackSuccess --> RecEngine
    TrackIgnore --> RecEngine
    TrackModify --> RecEngine
    
    style RecEngine fill:#8B5CF6,color:#FFFFFF
    style InputAnalysis diamond
    style AnalyzeData fill:#F9FAFB
    style AnalyzeTrends fill:#F9FAFB
    style MasteryScore fill:#F9FAFB
    style EngagementLevel fill:#F9FAFB
    style LearningStyle fill:#F9FAFB
    style WeakPoints fill:#F9FAFB
    style GoalAlignment fill:#F9FAFB
    style HistoricalData fill:#F9FAFB
    style PatternDetection fill:#F9FAFB
    style RecommendationStrategy fill:#F9FAFB
    style ContentMatching fill:#F9FAFB
    style ContentRecs fill:#3B82F6,color:#FFFFFF
    style Personalization fill:#F9FAFB
    style PriorityScoring fill:#F9FAFB
    style ContextualFilter fill:#F9FAFB
    style FinalRecs fill:#3B82F6,color:#FFFFFF
    style DashboardPlacement fill:#F9FAFB
    style WeakAreasPlacement fill:#F9FAFB
    style AnalyticsPlacement fill:#F9FAFB
    style UserSees fill:#F3F4F6
    style UserAction diamond
    style TrackSuccess fill:#10B981
    style TrackIgnore fill:#F59E0B
    style TrackModify fill:#3B82F6
```

### 3.2 Notification System Flow

```mermaid
flowchart TD
    NotifySystem[🔔 Notification System] --> TriggerCheck{Trigger Event?}
    
    TriggerCheck -->|Session Complete| NotifyComplete[📚 Session Complete Notification]
    TriggerCheck -->|Milestone Reached| NotifyMilestone[🎯 Milestone Notification]
    TriggerCheck -->|Weak Area Identified| NotifyWeak[🎯 Weak Area Alert]
    TriggerCheck -->|Daily Reminder| NotifyDaily[📅 Daily Reminder]
    TriggerCheck -->|Streak Alert| NotifyStreak[🔥 Streak Alert]
    TriggerCheck -->|Recommendation| NotifyRec[📚 New Recommendation]
    
    NotifyComplete --> CC_Content[📧 Compose Content]
    CC_Content --> CC_Time[⏰ Determine Timing]
    CC_Time --> CC_Recipient[👤 Identify Recipient]
    CC_Recipient --> CC_Template[📝 Apply Template]
    CC_Template --> CC_Personalize[🎨 Personalize Message]
    CC_Personalize --> Send
    
    NotifyMilestone --> CM_Content[📧 Compose Content]
    CM_Content --> CM_Time[⏰ Determine Timing]
    CM_Time --> CM_Recipient[👤 Identify Recipient]
    CM_Recipient --> CM_Template[📝 Apply Template]
    CM_Template --> CM_Personalize[🎨 Personalize Message]
    CM_Personalize --> Send
    
    NotifyWeak --> CW_Content[📧 Compose Content]
    CW_Content --> CW_Time[⏰ Determine Timing]
    CW_Time --> CW_Recipient[👤 Identify Recipient]
    CW_Recipient --> CW_Template[📝 Apply Template]
    CW_Template --> CW_Personalize[🎨 Personalize Message]
    CW_Personalize --> Send
    
    NotifyDaily --> CD_Content[📧 Compose Content]
    CD_Content --> CD_Time[⏰ Determine Timing]
    CD_Time --> CD_Recipient[👤 Identify Recipient]
    CD_Recipient --> CD_Template[📝 Apply Template]
    CD_Template --> CD_Personalize[🎨 Personalize Message]
    CD_Personalize --> Send
    
    NotifyStreak --> CS_Content[📧 Compose Content]
    CS_Content --> CS_Time[⏰ Determine Timing]
    CS_Time --> CS_Recipient[👤 Identify Recipient]
    CS_Recipient --> CS_Template[📝 Apply Template]
    CS_Template --> CS_Personalize[🎨 Personalize Message]
    CS_Personalize --> Send
    
    NotifyRec --> CR_Content[📧 Compose Content]
    CR_Content --> CR_Time[⏰ Determine Timing]
    CR_Time --> CR_Recipient[👤 Identify Recipient]
    CR_Recipient --> CR_Template[📝 Apply Template]
    CR_Template --> CR_Personalize[🎨 Personalize Message]
    CR_Personalize --> Send
    
    Send[📨 Send Notification] --> NotificationType{Send Type?}
    NotificationType -->|Email| EmailSend[📧 Send Email]
    NotificationType -->|Push| PushSend[📱 Send Push]
    NotificationType -->|In-App| InAppSend[💬 Send In-App]
    NotificationType -->|SMS| SMSSend[📱 Send SMS]
    
    EmailSend --> TrackEmail[📊 Track Email Delivery]
    PushSend --> TrackPush[📊 Track Push Delivery]
    InAppSend --> TrackInApp[📊 Track In-App Delivery]
    SMSSend --> TrackSMS[📊 Track SMS Delivery]
    
    TrackEmail --> LogEvent[📝 Log Event]
    TrackPush --> LogEvent
    TrackInApp --> LogEvent
    TrackSMS --> LogEvent
    
    LogEvent --> Analytics[📊 Update Analytics]
    Analytics --> NotifySystem
    
    style NotifySystem fill:#F59E0B,color:#111827
    style TriggerCheck diamond
    style NotifyComplete fill:#F9FAFB
    style NotifyMilestone fill:#F9FAFB
    style NotifyWeak fill:#F9FAFB
    style NotifyDaily fill:#F9FAFB
    style NotifyStreak fill:#F9FAFB
    style NotifyRec fill:#F9FAFB
    style Send diamond
    style EmailSend fill:#3B82F6,color:#FFFFFF
    style PushSend fill:#3B82F6,color:#FFFFFF
    style InAppSend fill:#3B82F6,color:#FFFFFF
    style SMSSend fill:#3B82F6,color:#FFFFFF
    style NotificationType diamond
    style TrackEmail fill:#F9FAFB
    style TrackPush fill:#F9FAFB
    style TrackInApp fill:#F9FAFB
    style TrackSMS fill:#F9FAFB
    style LogEvent fill:#F3F4F6
    style Analytics fill:#3B82F6,color:#FFFFFF
```

### 3.3 Data Export & Sharing Flow

```mermaid
flowchart TD
    ExportInit[📥 Initiate Export] --> ExportType{Export Type?}
    
    ExportType -->|Personal Data| PersonalExport[👤 Personal Data Export]
    ExportType -->|Analytics Report| AnalyticsExport[📊 Analytics Report Export]
    ExportType -->|Session History| SessionExport[📚 Session History Export]
    ExportType -->|Progress Report| ProgressExport[📈 Progress Report Export]
    
    PersonalExport --> PersonalSelect[📋 Select Data Types]
    PersonalExport --> TimeRange[⏰ Select Time Range]
    TimeRange --> PersonalFormat[📄 Select Format]
    PersonalFormat --> PersonalGenerate[🔧 Generate Export]
    PersonalGenerate --> PersonalDownload[⬇️ Download File]
    PersonalDownload --> ExportInit
    
    AnalyticsExport --> AnalyticsSelect[📊 Select Metrics]
    AnalyticsExport --> AnalyticsCompare[🔍 Select Comparison]
    AnalyticsCompare --> AnalyticsFormat[📄 Select Format]
    AnalyticsFormat --> AnalyticsGenerate[🔧 Generate Report]
    AnalyticsGenerate --> AnalyticsDownload[⬇️ Download Report]
    AnalyticsDownload --> ExportInit
    
    SessionExport --> SessionSelect[📚 Select Sessions]
    SessionSelect --> SessionDate[⏰ Select Date Range]
    SessionDate --> SessionFormat[📄 Select Format]
    SessionFormat --> SessionGenerate[🔧 Generate Export]
    SessionGenerate --> SessionDownload[⬇️ Download History]
    SessionDownload --> ExportInit
    
    ProgressExport --> ProgressSelect[📈 Select Progress Metrics]
    ProgressSelect --> ProgressPeriod[⏰ Select Period]
    ProgressPeriod --> ProgressFormat[📄 Select Format]
    ProgressFormat --> ProgressGenerate[🔧 Generate Report]
    ProgressGenerate --> ProgressDownload[⬇️ Download Report]
    ProgressDownload --> ExportInit
    
    ExportInit --> ShareOptions{Share?}
    ShareOptions -->|Yes| ShareEmail[📧 Share via Email]
    ShareOptions -->|Yes| ShareCloud[☁️ Share to Cloud]
    ShareOptions -->|No| ExportInit
    
    ShareEmail --> EmailInput[📧 Enter Email Address]
    EmailInput --> EmailSend[📨 Send Email]
    EmailSend --> ExportInit
    
    ShareCloud --> CloudSelect[☁️ Select Cloud Service]
    CloudSelect --> GoogleDrive[🔗 Google Drive]
    CloudSelect --> Dropbox[🔗 Dropbox]
    CloudSelect --> OneDrive[🔗 OneDrive]
    GoogleDrive --> CloudUpload[☁️ Upload File]
    Dropbox --> CloudUpload
    OneDrive --> CloudUpload
    CloudUpload --> CloudLink[🔗 Generate Share Link]
    CloudLink --> ExportInit
    
    style ExportInit fill:#F3F4F6,color:#111827
    style ExportType diamond
    style PersonalExport fill:#3B82F6,color:#FFFFFF
    style AnalyticsExport fill:#3B82F6,color:#FFFFFF
    style SessionExport fill:#3B82F6,color:#FFFFFF
    style ProgressExport fill:#3B82F6,color:#FFFFFF
    style ShareOptions diamond
    style ShareEmail fill:#F9FAFB
    style ShareCloud fill:#F9FAFB
    style EmailInput fill:#F9FAFB
    style EmailSend fill:#F9FAFB
    style CloudSelect fill:#F9FAFB
    style GoogleDrive fill:#F9FAFB
    style Dropbox fill:#F9FAFB
    style OneDrive fill:#F9FAFB
    style CloudUpload fill:#F9FAFB
    style CloudLink fill:#F9FAFB
```

### 3.4 Error Handling & Recovery Flow

```mermaid
flowchart TD
    ErrorStart[⚠️ Error Detected] --> ErrorClassify{Classify Error?}
    
    ErrorClassify -->|Network| NetworkError[🔌 Network Error]
    ErrorClassify -->|API| APIError[🔌 API Error]
    ErrorClassify -->|Validation| ValidationError[📝 Validation Error]
    ErrorClassify -->|Authentication| AuthError[🔐 Authentication Error]
    ErrorClassify -->|Database| DBError[🗄️ Database Error]
    ErrorClassify -->|Other| OtherError[❓ Other Error]
    
    NetworkError --> NetworkRetry[🔄 Retry Connection]
    NetworkRetry --> NetworkSuccess{Success?}
    NetworkSuccess -->|Yes| Success[✅ Success - Continue]
    NetworkSuccess -->|No| NetworkFallback[🔄 Use Offline Mode]
    NetworkFallback --> NetworkState[💾 Save Offline]
    NetworkState --> NetworkAlert[📡 Notify User]
    
    APIError --> APIRetry[🔄 Retry Request]
    APIRetry --> APIFallback[🔄 Use Cached Data]
    APIFallback --> APIErrorDisplay[❌ Display Error Message]
    
    ValidationError --> ValidateFix[🔧 Fix Validation Issue]
    ValidateFix --> ValidationErrorDisplay[❌ Display Validation Errors]
    
    AuthError --> AuthRetry[🔄 Re-authenticate]
    AuthRetry --> AuthSuccess{Success?}
    AuthSuccess -->|Yes| Success
    AuthSuccess -->|No| Logout[🚪 Logout User]
    Logout --> LoginRequired[🔐 Login Screen]
    
    DBError --> DBRetry[🔄 Retry Database Query]
    DBRetry --> DBSuccess{Success?}
    DBSuccess -->|Yes| Success
    DBSuccess -->|No| DBFallback[🔄 Use Alternative Source]
    DBFallback --> DBErrorDisplay[❌ Display Database Error]
    
    OtherError --> ErrorDisplay[❌ Display Error Message]
    
    NetworkAlert --> ErrorDisplay
    APIErrorDisplay --> ErrorDisplay
    ValidationErrorDisplay --> ErrorDisplay
    DBErrorDisplay --> ErrorDisplay
    ErrorDisplay --> UserDecision{User Action?}
    
    UserDecision -->|Retry| ErrorStart
    UserDecision -->|Contact Support| ContactSupport[📧 Contact Support]
    UserDecision -->|Continue Offline| ContinueOffline[📝 Continue Offline Mode]
    UserDecision -->|Cancel| Cancel[❌ Cancel Operation]
    
    style ErrorStart fill:#EF4444,color:#FFFFFF
    style ErrorClassify diamond
    style NetworkError fill:#F9FAFB
    style APIError fill:#F9FAFB
    style ValidationError fill:#F9FAFB
    style AuthError fill:#F9FAFB
    style DBError fill:#F9FAFB
    style OtherError fill:#F9FAFB
    style NetworkRetry fill:#F9FAFB
    style NetworkFallback fill:#F9FAFB
    style NetworkState fill:#F9FAFB
    style NetworkAlert fill:#F9FAFB
    style APIRetry fill:#F9FAFB
    style APIFallback fill:#F9FAFB
    style APIErrorDisplay fill:#F9FAFB
    style ValidateFix fill:#F9FAFB
    style ValidationErrorDisplay fill:#F9FAFB
    style AuthRetry fill:#F9FAFB
    style AuthSuccess diamond
    style Success fill:#10B981,color:#FFFFFF
    style Logout fill:#F59E0B,color:#111827
    style LoginRequired fill:#EF4444,color:#FFFFFF
    style DBRetry fill:#F9FAFB
    style DBSuccess diamond
    style DBFallback fill:#F9FAFB
    style DBErrorDisplay fill:#F9FAFB
    style ErrorDisplay fill:#EF4444,color:#FFFFFF
    style UserDecision diamond
    style NetworkSuccess diamond
    style AuthSuccess diamond
    style DBSuccess diamond
    style ContactSupport fill:#F9FAFB
    style ContinueOffline fill:#F9FAFB
    style Cancel fill:#EF4444,color:#FFFFFF
```

---

## Summary Statistics

### Layer 1: Navigation & Core Flows
- 3 complete workflows
- App navigation, authentication, session initiation
- Focus: User entry and movement through pages

### Layer 2: Learning & Assessment Flows
- 3 complete workflows  
- Learning session lifecycle, quiz workflow, weak areas remediation
- Focus: Core educational functionality

### Layer 3: Advanced & System Flows
- 4 complete workflows
- Recommendation engine, notifications, export/sharing, error handling
- Focus: System-wide features and resilience

**Total:** 10 complete workflow diagrams

---

## How to Use

### View in Mermaid Live Editor

1. Copy workflow code from any section
2. Go to https://mermaid.live
3. Paste the code
4. View and interact with the flowchart

### VS Code Integration

1. Install Mermaid extension
2. Open this file
3. View preview to see interactive diagrams

---

**Version:** 1.0  
**Date:** 2026-04-09  
**Prepared by:** Eva2 AI Guardian  
**Approved by:** Jacky Chen (Master)
