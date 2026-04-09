# Quiz Page - Detailed Design

**Page:** Quiz Interface  
**Version:** 1.0  
**Date:** 2026-04-09

---

## Page Structure Overview

```
┌────────────────────────────────────────────────────────────┬─────┬──────┐
│ QUIZ MODE                                             [🔕]│ [❐]│      │
│ Current: Atomic Structure                        [⏸ Pause]│      │      │
│ Progress: Q2 of 5 ████░░░░░░░░░░░░░░                        │      │      │
├────────────────────────────────────────────────────────────┴─────┴──────┤
│                                                                          │
│ 📊 QUIZ INTERFACE                                                         │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐    │
│ │ Question 2 of 5                                                   │    │
│ │                                                                  │    │
│ │ Which of the following correctly describes the relationship    │    │
│ │ between protons and neutrons in an atom's mass?                │    │
│ │                                                                  │    │
│ │ [A] Protons + Neutrons = Mass Number                           │    │
│ │ [B] Protons - Neutrons = Atomic Mass                            │    │
│ │ [C] Protons × Neutrons = Element Mass                          │    │
│ │ [D] Neutrons - Protons = Stability Ratio                       │    │
│ │                                                                  │    │
│ │ [  ] Selected: [●] Protons + Neutrons = Mass Number           │    │
│ │ [  ] Not selected: [○] Protons - Neutrons = Atomic Mass       │    │
│ │ [  ] Not selected: [○] Protons × Neutrons = Element Mass      │    │
│ │ [  ] Not selected: [○] Neutrons - Protons = Stability Ratio   │    │
│ │                                                                  │    │
│ │ [💬 Ask AI about this question]                                │    │
│ │                                                                  │    │
│ │ [⏪ Previous] [⏩ Next Question] [⏸ Pause]                      │    │
│ └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
├───────────────────────────────────────────────────────────────────────┤
│ [🎵 Narration] [📝 Quiz Mode] [⚙️ Settings] [📊 Results] [▶ ▶]         │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Quiz Header

```
┌────────────────────────────────────────────────────────────┐
│ [🔕] [⏸ Pause]  Atomic Structure                       [❐]│
│ Progress: Q2 of 5 ██░░░░░░░░░░░░░░                        │
└────────────────────────────────────────────────────────────┘
```

**Header Specifications:**

```
Mute Toggle:
- 🔕 / 🔊 icon, 20px
- Click: Toggles audio mute state
- Active: #3B82F6, red icon if muted

Pause Button:
- ⏸ icon, 24px
- Click: Pauses all session activity
- Visual: Gray background, white icon

Lesson Title:
- "Atomic Structure" (H2, 24px, bold, #111827)
- Centered in header

Progress Bar:
- Container: #E5E7EB bg, 10px height, 100% width
- Fill: #10B981, width varies by question number
- Text: "Q2 of 5" (16px, bold, left side)
- Smooth animation on progress change

Minimize Button:
- ❐ icon, 16px
- Click: Minimizes content area
```

---

## Quiz Question Display

```
Question Card:
┌─────────────────────────────────────────────────────────────────┐
│ Question Counter:                                               │
│ ┌─ Question 2 of 5 ──────────────────────────────────────┐     │
│ │ Progress: ████░░░░░░░░░░░░░░ (2/5 = 40%)              │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                 │
│ Question Text:                                                │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Which of the following correctly describes the          │  │
│ │ relationship between protons and neutrons in an atom's  │  │
│ │ mass?                                                   │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Answer Options:                                               │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ A. Protons + Neutrons = Mass Number                       │  │
│ │    [  ] Empty option                                      │  │
│ │                                                           │  │
│ │ B. Protons - Neutrons = Atomic Mass                      │  │
│ │    [  ] Empty option                                      │  │
│ │                                                           │  │
│ │ C. Protons × Neutrons = Element Mass                     │  │
│ │    [  ] Empty option                                      │  │
│ │                                                           │  │
│ │ D. Neutrons - Protons = Stability Ratio                 │  │
│ │    [  ] Empty option                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ AI Tutor:                                                     │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [💬 Ask AI about this question] (blue, 14px)             │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Navigation:                                                   │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [⏪ Previous] [⏩ Next Question] [⏸ Pause]                 │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Question Card Specifications:**

```
Question Counter:
- Background: #F3F4F6, rounded corners
- Padding: 12px 16px
- Text: "Question 2 of 5" (bold, 14px, #374151)
- Progress: Small bar (height: 4px, green fill)

Question Text:
- Font: 18px, bold, #111827
- Line-height: 1.6
- Padding: 20px
- Background: #FFFFFF
- Border-radius: 8px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Margin-bottom: 20px

Answer Options:
- Grid: 2 columns (responsive: 1 column on mobile)
- Each option:
  - Radio button: 24px × 24px
  - Empty: ○, #D1D5DB border
  - Selected: ●, #3B82F6 bg, white text
  - Hover: #EFF6FF bg, cursor pointer
  - Selected: #DBEAFE bg, #1E40AF border
  - Padding: 16px
  - Margin: 8px
  - Transition: all 200ms ease
  - Font: 16px, #374151

AI Tutor Button:
- Style: Link, #3B82F6 color
- Icon: 💬 chat bubble
- Hover: #1E40AF color
- Opens inline chat or side panel

Navigation Buttons:
- [⏪ Previous Question]: 
  - Disabled if Q1
  - Secondary button, outline style
  - Width: 140px
- [⏩ Next Question]:
  - Primary button, #3B82F6 bg
  - Always enabled
  - Width: 160px
- [⏸ Pause Session]:
  - Tertiary button, icon only
  - Width: 60px
  - Height: 40px
```

---

## Quiz Review Mode

```
After Quiz Completion:
┌─────────────────────────────────────────────────────────────────┐
│ ✅ QUIZ COMPLETE!                                               │
│                                                                 │
│ Results:                                                      │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Score: 4/5 (80%)                                          │  │
│ │ Mastery: Developing → Proficient (70% → 75%)            │  │
│ │ Time: 3 minutes 24 seconds                               │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Question Review:                                              │
│ ┌─ Question 1 - Correct ✓                                   ─┐  │
│ │ What particle determines the element?                      │  │
│ │ Your answer: B. Proton                                     │  │
│ │ Correct answer: B. Proton                                  │  │
│ │ [📚 Review Topic]                                           │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Question 2 - Incorrect ✗                                   ─┐  │
│ │ Which describes protons + neutrons?                       │  │
│ │ Your answer: B. Protons - Neutrons                          │  │
│ │ Correct answer: A. Protons + Neutrons = Mass Number        │  │
│ │ Explanation: The mass number is calculated by adding       │  │
│ │ protons and neutrons. Protons define the element type,    │  │
│ │ while the sum gives the atom's mass.                       │  │
│ │ [📚 Review Mass Number] [❓ Ask AI]                          │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Question 3 - Correct ✓                                   ─┐  │
│ │ (Previous questions shown similarly)                       │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Question 4 - Correct ✓                                   ─┐  │
│ │ (Previous questions shown similarly)                       │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Actions:                                                      │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [📝 Retake Quiz] [📚 Review All Topics] [✅ Continue]    │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Review Mode Specifications:**

```
Summary Card:
- Score: Large (48px, bold, #111827)
- Percentage: (24px, bold, #10B981)
- Mastery Change: Arrow ↑ or ↓, color-coded
- Time: 14px, #6B7280
- Background: #F0FDF4 (light green)
- Padding: 24px
- Margin-bottom: 24px

Question Review Cards:
- Correct (✓): Green checkmark, light green bg
- Incorrect (✗): Red X, light red bg
- Each card:
  - Question text (bold)
  - User's answer
  - Correct answer (highlighted)
  - Explanation (for incorrect)
  - Action buttons
  - Padding: 16px
  - Margin: 8px

Action Buttons:
- [📝 Retake Quiz]: Primary, #3B82F6
- [📚 Review All Topics]: Secondary, outline
- [✅ Continue]: Success, green, default
- All 48px height, 200px width
```

---

## Question Types

### Multiple Choice (MCQ)

```
┌─────────────────────────────────────────────────────────────────┐
│ Select the correct answer:                                     │
│                                                                 │
│ [○] Option A                                                   │
│ [●] Option B (selected)                                        │
│ [○] Option C                                                   │
│ [○] Option D                                                   │
│                                                                 │
│ [✔️ Submit Answer] [🔀 Skip This Question]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Fill in the Blank

```
┌─────────────────────────────────────────────────────────────────┐
│ Complete the sentence:                                         │
│                                                                 │
│ The number of ________ in an atom determines its element.    │
│                                                                 │
│ [_________________]                                            │
│                                                                 │
│ [💡 Hint: This particle has a positive charge]               │
│                                                                 │
│ [✔️ Submit Answer] [❓ Skip]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Matching

```
┌─────────────────────────────────────────────────────────────────┐
│ Match the particle with its charge:                            │
│                                                                 │
│ Left Side              │        Right Side                    │
│ ┌──────────────────┐  │  ┌──────────────────┐                │
│ │ Proton           │  │  │ Positive (+1)    │                │
│ │ Neutron          │  │  │ Neutral (0)      │                │
│ │ Electron         │  │  │ Negative (-1)    │                │
│ │ Nucleus          │  │  │ Central Core     │                │
│ └──────────────────┘  │  └──────────────────┘                │
│                                                                 │
│ Drag and drop to match items                                   │
│                                                                 │
│ [✔️ Check Answers] [🔀 Shuffle]                                │
└─────────────────────────────────────────────────────────────────┘
```

### True/False

```
┌─────────────────────────────────────────────────────────────────┐
│ True or False:                                                 │
│                                                                 │
│ "An atom's atomic number is determined by the number of      │
│ electrons."                                                    │
│                                                                 │
│ [●] True    [○] False                                          │
│                                                                 │
│ [✔️ Submit Answer] [❓ Skip]                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Timer and Progress

```
Timer Display:
┌─────────────────────────────────────────────────────────────────┐
│ ⏱️ Timer: 3:24 remaining                                         │
│                                                                 │
│ [⏸ Pause] [▶ Continue] [⏹ Reset]                               │
└─────────────────────────────────────────────────────────────────┘
```

**Timer Specifications:**

```
Timer Display:
- Font: 20px, monospace, #EF4444 (red)
- Bold for final 30 seconds
- Shows minutes:seconds format
- Timer countdown on submit

Control Buttons:
- [⏸ Pause]: Pause timer
- [▶ Continue]: Resume timer
- [⏹ Reset]: Restart quiz timer
- Small buttons, 32px height
```

---

## AI Tutor Integration

```
Inline AI Assistant:
┌─────────────────────────────────────────────────────────────────┐
│ 💬 AI Tutor - This Question                                    │
│                                                                 │
│ You can ask about:                                             │
│ - Why an answer is correct/incorrect                          │
│ - Explanation of concepts                                     │
│ - Related topics                                              │
│                                                                 │
│ [💬 What is a neutron?]                                      │
│ [💬 Explain atomic mass]                                     │
│                                                                 │
│ Type your question... [_________________] [Send →]           │
└─────────────────────────────────────────────────────────────────┘
```

**AI Chat Specifications:**

```
Chat Input:
- Placeholder: "Type your question..."
- Height: 40px
- Border-radius: 8px
- Send button: → blue, right side

Suggested Questions:
- Pre-written common questions
- Quick links to topics
- Click to auto-fill input

AI Response Card:
- Background: #F0FDF4
- Icon: 🤖 24px
- Explanation text
- Links to related content
- Action buttons

Response States:
- Loading: "Thinking..." with spinner
- Error: "Let me try that again" with retry
- Complete: Full explanation with formatting
```

---

## Responsive Behavior

### Desktop (>1024px)
```
Full quiz layout:
- Question options: 2 columns
- Timer: Always visible
- AI chat: Inline or side panel
- All controls accessible
```

### Tablet (768px - 1024px)
```
Compact layout:
- Question options: 2 columns
- Timer: Collapsible header
- AI chat: Modal overlay
- Controls: Scrollable if needed
```

### Mobile (<768px)
```
Single column:
- Question options: 1 column (stacked)
- Timer: Minimal, toggleable
- AI chat: Full-screen modal
- All buttons: 2×2 grid
```

---

## Quiz Flow States

### Before Quiz Starts
```
┌─────────────────────────────────────────────────────────────────┐
│ 📝 QUIZ PREVIEW                                                │
│                                                                 │
│ You're about to start a quiz on: Atomic Structure             │
│                                                                 │
│ Quiz Details:                                                 │
│ • 5 questions                                                  │
│ • 10 minutes time limit                                        │
│ • Multiple choice and true/false                               │
│ • No going back after submission                               │
│                                                                 │
│ Current Mastery: 67% (Developing)                             │
│ After Quiz: Will update based on performance                 │
│                                                                 │
│ [▶️ Start Quiz Now] [📚 Review Topics First] [❌ Cancel]     │
└─────────────────────────────────────────────────────────────────┘
```

### During Quiz
```
Active quiz with timer counting down
- Question counter updates
- Progress bar fills
- Selected answers highlighted
- Timer visible and countdowning
```

### Quiz Complete
```
Results screen with summary
- Score and percentage
- Mastery update
- Question review
- Next action buttons
```

---

## Scoring System

```
Score Calculation:
┌─────────────────────────────────────────────────────────────────┐
│ Scoring Rules:                                                 │
│                                                                 │
│ Correct Answers:                                              │
│ ✓ Multiple Choice: +1 point each                              │
│ ✓ Fill in the Blank: +1 point each                            │
│ ✓ Matching: +1 point per correct pair                         │
│ ✓ True/False: +1 point each                                   │
│                                                                 │
│ Penalties:                                                    │
│ ✗ No penalty for wrong answers                                │
│ ✗ No penalty for skipped questions                            │
│ ✗ No penalty for retaking questions                           │
│                                                                 │
│ Mastery Update:                                               │
│ 100%: +5% mastery                                             │
│ 80-99%: +3% mastery                                           │
│ 60-79%: +1% mastery                                           │
│ <60%: No change                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Accessibility

```
Screen Reader Support:
- Question announcements
- Counter updates (live region)
- Answer selection feedback
- Timer announcements (every 30s)

Keyboard Navigation:
- Tab through questions
- Arrow keys for options
- Enter to submit
- Esc to close AI chat
- Space for checkboxes
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component implementation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
