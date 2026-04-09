# Learning Session Page - Detailed Design

**Page:** Learning Session  
**Version:** 1.0  
**Date:** 2026-04-09

---

## Page Structure Overview

```
┌──────────────────────────────────────────────────────────┬─────┬──────┐
│ LEARNING SESSION                                    [🔕]│ [❐]│ [≡]│
│ 🎯 Current Topic: Atomic Structure                      [🔽]│ [◼]│      │
│ Progress: 67% ████████░░░░░░░░░░                          │      │      │
├──────────────────────────────────────────────────────────┴─────┴──────┤
│                                                                        │
│ 📖 LESSON CONTENT                                                      │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────┐      │
│ │ Section 1: The Atom Fundamentals                             │      │
│ │                                                              │      │
│ │ An atom is the basic unit of matter. It consists of three  │      │
│ │ types of particles:                                          │      │
│ │                                                              │      │
│ │ ⚛️  Protons - Positively charged particles in the nucleus  │      │
│ │    Charge: +1, Mass: ~1 amu                                  │      │
│ │                                                              │      │
│ │ 🎯 Neutrons - Neutral particles in the nucleus             │      │
│ │    Charge: 0, Mass: ~1 amu                                   │      │
│ │                                                              │      │
│ │ ⚡ Electrons - Negatively charged particles orbiting the   │      │
│ │    nucleus                                                   │      │
│ │    Charge: -1, Mass: ~1/1836 amu                             │      │
│ │                                                              │      │
│ │ [📺 Watch Video] [📄 Download PDF] [🔖 Bookmark Section]    │      │
│ │                                                              │      │
│ │ Atomic Structure:                                            │      │
│ │ • Protons define the element (atomic number)               │      │
│ │ • Protons + Neutrons = Mass number                          │      │
│ │ • Electrons = Protons in neutral atoms                      │      │
│ └──────────────────────────────────────────────────────────────┘      │
│                                                                        │
│ 🧠 KEY CONCEPTS                                                        │
│                                                                        │
│ ┌─ [✓] Atomic number defines element type                       ─┐     │
│ │ • The number of protons determines what element an atom is    │     │
│ │ • Hydrogen = 1 proton, Carbon = 6 protons, Gold = 79 protons │     │
│ └────────────────────────────────────────────────────────────────┘     │
│ ┌─ [✓] Mass number is the sum of protons and neutrons            ─┐     │
│ │ • Example: Carbon-12 has 6 protons + 6 neutrons = 12             │     │
│ │ • Example: Uranium-238 has 92 protons + 146 neutrons = 238       │     │
│ └────────────────────────────────────────────────────────────────┘     │
│                                                                        │
│ 🎯 PRACTICE QUESTIONS                                                  │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────┐      │
│ │ Question 1 of 3: What particle determines the element?      │      │
│ │                                                              │      │
│ │ A. Neutron       B. Proton       C. Electron       D. Nucleus│      │
│ │                                                              │      │
│ │ [⏪ Previous] [⏩ Next Question] [⏸ Pause Session]           │      │
│ └──────────────────────────────────────────────────────────────┘      │
│                                                                        │
│ 💭 ASK AI TUTOR (Quick Chat)                                           │
│ ┌──────────────────────────────────────────────────────────────┐      │
│ │ [💬 Ask about this topic...]                                │      │
│ └──────────────────────────────────────────────────────────────┘      │
│                                                                        │
├───────────────────────────────────────────────────────────────────────┤
│ [🎵 Narration] [📝 Quiz Mode] [⚙️ Settings] [📊 Track Progress] [▶️ ▶️]│
└───────────────────────────────────────────────────────────────────────┘
```

---

## Header Section

```
┌──────────────────────────────────────────────────────────────────────┐
│ [🔕 Mute Audio]  Atomic Structure                    [▼ Section ▼]  │
│ Progress: 67% ██████████░░░░░░░░░░                                  │
│ [❐] [◼] [≡]                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Header Specifications:**

```
Title Section:
- Lesson Title: "Atomic Structure" (H2, 24px, bold, #111827)
- Topic Indicator: "Current Topic: Atomic Structure" (14px, #6B7280)
- Mute button: 🔕 icon, 20px, toggle state
- Section dropdown: Shows current section title

Progress Bar:
- Container: 100% width, #E5E7EB bg, 8px height
- Fill: #10B981 (green), 67% width, smooth fill animation
- Percentage: "67%" (16px, bold, #111827)
- Left side of progress bar

Player Controls (Right side):
- Mute: 🔕 / 🔊 toggle
- Chapter Dropdown: "▼ Section Name ▼"
- Minimize: ❐ (16px)
- Maximize: ◼ (16px)
- Menu: ≡ (hamburger, 20px)
```

---

## Lesson Content Display

```
Content Card:
┌─────────┬──────────────────────────────────────────────────────┐
│ Sidebar │ Section Title: The Atom Fundamentals                │
│  25%    │                                                    │
│         │ Content Body:                                    │
│         │ An atom is the basic unit of matter. It consists│
│         │ of three types of particles:                    │
│         │                                                    │
│         │ • ⚛️ Protons - Positively charged...           │
│         │ • 🎯 Neutrons - Neutral particles...           │
│         │ • ⚡ Electrons - Negatively charged...         │
│         │                                                    │
│         │ [📺 Video] [📄 PDF] [🔖 Bookmark]                │
│         │                                                    │
│         │ Atomic Structure Points:                         │
│         │ 1. Protons define the element                    │
│         │ 2. Protons + Neutrons = Mass                    │
│         │ 3. Electrons = Protons (neutral)                 │
├─────────┼──────────────────────────────────────────────────────┤
│ 1. Intro│ KEY CONCEPTS                                │
│ 2. Prots│ 1. ✓ Atomic number defines element           │
│ 3. Neuts│ 2. ✓ Mass number = protons + neutrons        │
│ 4. Eelect│                                                    │
│ 5. Config│ PRACTICE QUESTIONS                          │
│         │ Q1: What particle defines element?         │
│ 6. Bonds │ [A. Neutron] [B. Proton] [C. Electron]     │
│         │                                                    │
├─────────┴──────────────────────────────────────────────────────┤
│ ASK AI TUTOR                                                   │
│ [💬 Ask about this topic...]                                │
└────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**

```
Sidebar Table of Contents:
- Width: 25% (max 250px, min 180px)
- Background: #F9FAFB
- Scrollable if 10+ sections
- Section items: 40px height, padding 12px
- Active section: #DBEAFE bg, #1E40AF text
- Completed section: Green checkmark ✓
- Hover: #F3F4F6 bg, cursor pointer
- Icons: Section number + icon + title

Main Content Area:
- Width: 75%
- Padding: 24px
- Background: #FFFFFF
- Shadow: 0 1px 3px rgba(0,0,0,0.05)
- Border-radius: 12px

Section Title:
- Font: H3, 20px, bold, #111827
- Margin-bottom: 16px

Content Text:
- Font: 16px, line-height 1.6
- Color: #374151
- Emojis: Icons for particles
- Lists: Bullet points with custom bullets

Action Buttons:
- [📺 Watch Video] - Primary, #3B82F6 bg
- [📄 Download PDF] - Secondary, outline style
- [🔖 Bookmark Section] - Tertiary, icon only
- Height: 32px
- Padding: 8px 12px
- Gap: 8px

Key Concepts:
- Each concept as card (margin-top: 16px)
- Checkmark: ✓ green, completed items
- Indented bullet points
- Examples: Smaller text, gray
- Background: #F9FAFB

Practice Questions:
- Card with question number
- Multiple choice buttons (4 options)
- [⏪ Previous] [⏩ Next Question] [⏸ Pause]
- Selected answer: #DBEAFE bg, #1E40AF border
- Correct answer: #DCFCE7 bg, #10B981 border
- Incorrect: #FEE2E2 bg, #EF4444 border
```

---

## Quiz Interface

```
Quiz Card:
┌─────────────────────────────────────────────────────────────────┐
│ Question 1 of 5                                                │
│                                                                │
│ What particle determines the element type?                   │
│                                                                │
│ A. Neutron       B. Proton       C. Electron       D. Nucleus│
│ [      ]       [  ●  ]       [      ]       [      ]         │
│                                                                │
│ [💬 Ask AI about this question]                                │
│                                                                │
│ [⏪ Previous Question] [⏩ Next Question] [⏸ Pause Session]   │
└─────────────────────────────────────────────────────────────────┘
```

**Quiz Specifications:**

```
Question Header:
- Counter: "Question 1 of 5" (14px, #6B7280, bold)
- Progress: Visual bar showing 1/5 (16px height)

Question Text:
- Font: 18px, bold, #111827
- Margin-bottom: 20px
- Clear, readable spacing

Answer Options:
- 4 columns (responsive: 2×2 on tablet, 1 column mobile)
- Each option: Radio button + label
- Selected: ● filled, #3B82F6 background
- Default: ○ empty, #D1D5DB border
- Hover: #EFF6FF bg
- Padding: 16px, rounded corners

AI Tutor Button:
- [💬 Ask AI about this question]
- Text link style, #3B82F6 color
- Opens inline chat or side panel

Navigation Buttons:
- [⏪ Previous Question] - Disabled if Q1
- [⏩ Next Question] - Always enabled
- [⏸ Pause Session] - Pause learning
- Primary button: #3B82F6 for "Next"
- Secondary: Outline for "Previous"
- Tertiary: Icon for "Pause"
```

---

## AI Tutor Interaction

```
AI Tutor Chat (Inline):
┌──────●─────────────────────────────────────────────────────┐
│ 💬 Ask AI Tutor                                           │
│ [💬 Ask about this topic...]                            │
├────────────────────────────────────────────────────────────┤
│ [💬 Your question here...]                              │
│ [Send →]                                                 │
└────────────────────────────────────────────────────────────┘

AI Response (appears after submission):
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI Tutor                                                  │
│                                                              │
│ Great question! The answer is **Proton** (B).            │
│                                                              │
│ **Explanation:**                                           │
│ The number of protons in an atom's nucleus determines    │
│ what element it is. For example:                           │
│ • 1 proton = Hydrogen                                       │
│ • 6 protons = Carbon                                        │
│ • 79 protons = Gold                                         │
│                                                              │
│ [📚 Learn More] [✅ I understand] [❓ Another question]  │
└─────────────────────────────────────────────────────────────┘
```

**Chat Specifications:**

```
Input Field:
- Height: 48px
- Padding: 12px 16px
- Border-radius: 8px
- Border: 1px solid #D1D5DB
- Placeholder: "Ask about this topic..."
- Send button: [→] blue, #3B82F6 bg

AI Response Card:
- Background: #F0FDF4 (light green tint)
- Border-radius: 12px
- Padding: 16px
- Icon: 🤖 24px, #10B981
- Explanation text: 16px, line-height 1.6
- Bold terms: **Proton** for key concepts
- Actions: 3 buttons, inline layout

Button Styles:
- [📚 Learn More] - Primary, opens additional content
- [✅ I understand] - Success, green, closes chat
- [❓ Another question] - Secondary, asks follow-up
```

---

## Footer Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│ [🎵 Narration] [📝 Quiz Mode] [⚙️ Settings] [📊 Track] [▶▶]    │
└─────────────────────────────────────────────────────────────────┘
```

**Footer Specifications:**

```
Navigation Buttons:
- 5 main action buttons
- All same height: 48px
- Icons: 20px, left-aligned
- Text: 14px, center
- Active state: #DBEAFE bg, #1E40AF text
- Hover: Shadow increase, scale 1.02
- Spacing: Equal distribution

Quick Actions:
- [🎵 Narration] - Toggle audio on/off
- [📝 Quiz Mode] - Switch to quiz mode
- [⚙️ Settings] - Session settings
- [📊 Track Progress] - View progress overlay
- [▶▶] - Fast forward 30 seconds

Responsive:
- Desktop: All 5 buttons visible
- Tablet: Scrollable or wrap
- Mobile: 2 rows of 3 buttons each
```

---

## Interactive States

### Progress Tracking

```
Progress Updates:
┌─┬────────────────────────────────────────────────────────┐
│ │ ✓ Completed Section 1                               │ │
│ │ • Reading: Atomic Structure                         │ │
│ │ • Quiz: 2/3 answered                                │ │
│ │ • Mastery: 67% → 70%                                 │ │
└─┴────────────────────────────────────────────────────────┘
- Real-time updates (1-2 second delay)
- Green checkmark for completed items
- Progress bar fills smoothly
- Mastery % updates after quiz submission
```

### Content Types

```
Visual Elements:
- Atom diagram: Interactive SVG, hover shows particles
- Video player: Custom controls, captions
- PDF viewer: Inline or modal
- Animated sequences: Particle movement, orbital paths
- Icons: Unicode and emoji for all elements
```

---

## Responsive Behavior

### Desktop (>1024px)
```
Full layout:
- Sidebar: 250px fixed
- Content: 75% width
- All features visible
- AI chat: Inline or side panel
```

### Tablet (768px - 1024px)
```
Compact layout:
- Sidebar: Collapsible (toggle)
- Content: 100% width
- AI chat: Modal overlay
- Quiz: Stack options vertically
```

### Mobile (<768px)
```
Stacked layout:
- Sidebar: Bottom navigation
- Content: Full width
- AI chat: Full-screen modal
- Quiz: Full-width options
- All buttons: 2×2 grid
```

---

## Keyboard Navigation

```
Key Bindings:
- Space: Pause/Resume narration
- Arrow Left: Previous section
- Arrow Right: Next section
- Q: Toggle quiz mode
- M: Toggle mute
- ?: Open AI tutor
- Esc: Close modals, exit fullscreen
```

---

## Accessibility

```
Screen Reader Support:
- All interactive elements labeled
- Progress announcements (live region)
- Aria labels on all buttons
- Semantic HTML structure

Keyboard Accessibility:
- All functions accessible via keyboard
- Focus indicators: 2px blue outline
- Tab order: Logical progression
- Skip links for navigation
```

---

## Performance

```
Optimizations:
- Lazy load videos
- Progressive image loading
- Cached AI responses
- Optimized SVG rendering
- Debounced scroll events
- Virtualized content list
```

---

## Animation Guidelines

```
Transitions:
- Section change: Slide in from right (300ms)
- Progress fill: Grow from left (200ms)
- Quiz selection: Scale 1.02 (150ms)
- AI response: Fade in (250ms)
- Modal: Slide down (300ms)
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component implementation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
