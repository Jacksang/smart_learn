# Dashboard Overview - Detailed Page Design

**Page:** Dashboard Overview  
**Version:** 1.0  
**Date:** 2026-04-09

---

## Page Structure

### Header Section

```
┌─────────────────────────────────────────────────────────────────┐
│ SMART LEARN                         Dashboard  Analytics  Goals  │
│ [📚] Welcome back, Student! 👋                                 │
│                                                                 │
│ Last session: 2 hours ago • Next lesson: Atomic Structure     │
│                                                                 │
│ [🎵 Start Narration]                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

```
Logo Area:
- Icon: 32px × 32px, #FFFFFF
- Text: "Smart Learn" (20px, bold)
- Color: #FFFFFF
- Position: Left side
- Spacing: 24px from edges

Navigation:
- Items: Dashboard, Analytics, Goals, Settings
- Active state: Bold, underline #FFFFFF
- Hover: Slight brightness increase
- Icons: 16px × 16px (optional)
- Right side items: Notifications bell, User avatar

User Actions:
- Notifications: Bell icon with badge if needed
- User: Avatar circle, dropdown menu on click
- Settings: Gear icon

Welcome Banner:
- Background: Linear gradient #3B82F6 → #1E40AF
- Border-radius: 16px
- Padding: 24px
- Text color: #FFFFFF
- Shadow: 0 4px 12px rgba(59,130,246,0.3)
- Button: Secondary, outlined, white text

Spacing:
- Header height: 64px
- Navigation gap: 32px
- Welcome banner gap: 16px
```

---

### Metrics Cards Section

```
┌─────────────────────────────────────────────────────────────────┐
│ OVERVIEW METRICS                                                │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ SESSIONS    │ │ QUESTIONS   │ │ MASTERY AVG │ │ STREAK   │ │
│ │    24       │ │   186       │ │    72%      │ │   5d     │ │
│ │  📅 Total   │ │  ✅ Done    │ │  📈 ↑12%    │ │  🔥 5d   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specs:**

```
Card Container:
- Grid: 4 columns (responsive: 2×2 on tablet, 1 on mobile)
- Gap: 16px
- Background: #FFFFFF
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Border-radius: 12px
- Padding: 24px

Individual Card:
- Height: 120px (fixed)
- Icon: 32px × 32px, primary color
- Value: 48px, bold, #111827
- Label: 14px, #6B7280
- Trend: 14px, #10B981, ↑ or ↓ arrow
- Gap: 8px between elements
- Border-top: 4px solid (theme color)

Card Variations:
1. Sessions Card:
   - Icon: 📚 or 📅
   - Value: 24 (total sessions)
   - Label: "Total sessions"
   - Trend: ↑12% (positive, green)

2. Questions Card:
   - Icon: ✅ or 📝
   - Value: 186 (completed)
   - Label: "Questions answered"
   - Trend: None

3. Mastery Card:
   - Icon: 📈 or 🎯
   - Value: 72% (average)
   - Label: "Average mastery"
   - Trend: ↑12% (improving, green)

4. Streak Card:
   - Icon: 🔥 or ⚡
   - Value: 5d (current streak)
   - Label: "Day streak"
   - Trend: None

Responsive Breakpoints:
- Desktop (>1024px): 4 columns
- Tablet (768-1024px): 2×2 grid
- Mobile (<768px): 1 column, full width
```

---

### Learning Progress Chart

```
┌─────────────────────────────────────────────────────────────────┐
│ LEARNING PROGRESS (Last 7 Days)                                 │
│                                                                 │
│    ██░░░░░░  ███░░░░░  ████░░░░  ██████  ████░░░░  ██░░░░  ██  │
│    Mon   Tue     Wed      Thu      Fri      Sat    Sun        │
│                                                                 │
│    Avg: 45 min/day • Questions: 23 • Mastery: +3%            │
│                                                                 │
│ Chart Specifications:
│ - Type: Bar chart
│ - Height: 200px
│ - Width: 100%
│ - Bars: 7 bars, one per day
│ - Bar width: 40px (desktop), responsive
│ - Bar colors: #3B82F6, 75% opacity
│ - Hover: #1E40AF, 100% opacity, tooltip appears
│ - Grid lines: #E5E7EB, 1px, horizontal only
│ - X-axis: Day labels (Mon, Tue, etc.)
│ - Y-axis: 0, 10, 20, 30, 40, 50 minutes
│ - Tooltip: Shows exact minutes for that day
│ - Stat line below chart: "Avg: 45 min/day • Questions: 23..."
└─────────────────────────────────────────────────────────────────┘
```

**Chart Implementation:**

```
Bar Chart Component:
- Container: Relative positioning
- Y-axis: Absolute left, labels aligned
- X-axis: Absolute bottom, labels centered
- Bars: Flexbox or absolute positioning
- Grid lines: Dividers, light gray
- Tooltip: Absolute position, follows cursor
- Legend: Below chart or inline
- Responsive: Scales with container
- Animation: Bars grow from bottom (300ms)
- Hover effect: Scale 1.05, opacity 100%

Y-axis Labels:
- Font: 12px
- Color: #6B7280
- Alignment: Right of axis line
- Spacing: Equidistant

X-axis Labels:
- Font: 12px
- Color: #6B7280
- Alignment: Centered under bars
- Spacing: Equal distribution

Tooltip:
- Background: #111827
- Color: #FFFFFF
- Padding: 8px 12px
- Border-radius: 4px
- Shadow: 0 2px 8px rgba(0,0,0,0.2)
- Arrow: Triangle at bottom
- Position: Below cursor, within viewport

Data Points:
- Mon: 45min
- Tue: 32min
- Wed: 51min
- Thu: 58min
- Fri: 47min
- Sat: 38min
- Sun: 52min
```

---

### Current Session Card

```
┌─────────────────────────────────────────────────────────────────┐
│ CURRENT SESSION: Atomic Structure                               │
│                                                                 │
│ Progress: 67%                                                  │
│ ████████████████████░░░░░░░░░░░░ (32px height)               │
│                                                                 │
│ Topics: 4/6 completed                                          │
│ Next: Electron Configuration                                   │
│                                                                 │
│ [▶️ Resume Session] [📖 Review Topics]                         │
│                                                                 │
│ Card Specifications:
│ - Background: #F9FAFB (light gray)
│ - Border-radius: 12px
│ - Padding: 24px
│ - Border: 1px solid #E5E7EB
│ - Shadow: 0 1px 3px rgba(0,0,0,0.05)
│ - Title: H3, #111827
│ - Progress bar container: #E5E7EB bg, 8px height
│ - Progress bar fill: #10B981 (green), 67% width
│ - Topic progress: 14px, #374151
│ - Next topic: 14px, #6B7280
│ - Buttons: Primary and secondary styles
│ - Gap between elements: 8-16px
└─────────────────────────────────────────────────────────────────┘
```

**Button Specifications:**

```
Resume Session Button (Primary):
- Style: #3B82F6 bg, white text
- Height: 40px
- Padding: 12px 20px
- Icon: ▶️ (play symbol)
- Text: "Resume Session"
- Icon position: Left
- Border-radius: 8px
- Hover: #1E40AF bg, scale 1.02
- Active: #1E3A8A bg, scale 0.98

Review Topics Button (Secondary):
- Style: White bg, #3B82F6 text, outline
- Height: 40px
- Padding: 12px 20px
- Icon: 📖 (book symbol)
- Text: "Review Topics"
- Icon position: Left
- Border: 1px solid #3B82F6
- Hover: #EFF6BF bg, #1E40AF text

Responsive Behavior:
- Desktop: Buttons side by side
- Tablet: Buttons side by side
- Mobile: Buttons stacked, full width
```

---

### Quick Actions Section

```
┌─────────────────────────────────────────────────────────────────┐
│ QUICK ACTIONS                                                   │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ 📝 Quiz     │ │ 🎯 Review   │ │ 📚 New      │ │ 🎵 Listen│ │
│ │ Start Quiz  │ │ Weak Areas  │ │ Lessons     │ │ Narration │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                 │
│ Button Specifications:
│ - Type: Icon + Text buttons
│ - Icon: 32px × 32px
│ - Icon color: #3B82F6
│ - Text: 14px, #6B7280
│ - Height: 80px (fixed)
│ - Padding: 16px
│ - Background: #FFFFFF
│ - Border: 1px solid #E5E7EB
│ - Border-radius: 12px
│ - Shadow: 0 1px 2px rgba(0,0,0,0.05)
│ - Hover: Shadow increases, scale 1.02
│ - Active: Shadow, scale 0.98
│ - Grid: 4 columns (responsive)
│
│ Button Variations:
│ 1. Quiz Button:
│    - Icon: 📝 or 📝
│    - Text: "Start Quiz"
│    - Subtext: Optional description
│
│ 2. Review Button:
│    - Icon: 🎯 or 🎯
│    - Text: "Weak Areas"
│    - Badge: Shows number of weak areas
│
│ 3. New Lessons Button:
│    - Icon: 📚 or ✨
│    - Text: "New Lessons"
│    - Badge: Shows new lesson count
│
│ 4. Listen Button:
│    - Icon: 🎵 or 🎧
│    - Text: "Narration"
│    - Subtext: "Listen to lessons"
│
│ Responsive Breakpoints:
│ - Desktop: 4 columns, equal width
│ - Tablet: 2×2 grid
│ - Mobile: 2 columns or scrollable horizontal
```

---

### Component Interaction States

```
Card Hover State:
┌─────────────────────────────────────────────────────────────────┐
│ Normal: Shadow 0 1px 3px rgba(0,0,0,0.1)                      │
│ Hover:  Shadow 0 4px 6px rgba(0,0,0,0.15)                     │
│        Border 1px solid #3B82F6                               │
│        Transform translateY(-2px)                             │
│        Transition: all 0.2s ease                              │
└─────────────────────────────────────────────────────────────────┘

Button Click State:
┌─────────────────────────────────────────────────────────────────┐
│ Click: Scale 0.98                                              │
│        Shadow: None                                            │
│        Color: Darker shade                                    │
│        Transition: all 0.1s ease-in-out                       │
└─────────────────────────────────────────────────────────────────┘

Loading State:
┌─────────────────────────────────────────────────────────────────┐
│ Skeleton loader:                                              │
│ - Background: #F3F4F6                                         │
│ - Animation: Shimmer effect (left to right)                  │
│ - Width: 100% for all elements                                │
│ - Border-radius: 8px                                          │
│ - Height: Matches content                                     │
└─────────────────────────────────────────────────────────────────┘

Empty State:
┌─────────────────────────────────────────────────────────────────┐
│ No data available                                             │
│ [Icon: Empty state illustration]                              │
│ [Message: "No sessions yet"]                                  │
│ [Button: "Start Learning Now"]                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (>1024px)

```
Full dashboard with all sections visible:
- Metrics: 4-column grid
- Chart: Full width, detailed tooltips
- Cards: All content visible
- Actions: 4-column grid
```

### Tablet (768px - 1024px)

```
Adapted layout:
- Metrics: 2×2 grid
- Chart: Responsive width, simplified
- Cards: Maintains structure
- Actions: 2×2 grid
```

### Mobile (<768px)

```
Single column layout:
- Metrics: Vertical stack
- Chart: Simplified, 100px height
- Cards: Maintains structure, scrollable
- Actions: Scrollable horizontal or 2 columns
```

---

## Accessibility Features

```
Keyboard Navigation:
- Tab order: Logical left-to-right, top-to-bottom
- Focus indicators: 2px solid #3B82F6
- Skip links: "Skip to main content"
- Keyboard shortcuts: Not required for basic navigation

Screen Reader:
- All icons have text alternatives
- ARIA labels on interactive elements
- Live regions for dynamic updates
- Heading hierarchy: H1 → H2 → H3

Color Contrast:
- All text meets WCAG 2.1 AA standards
- Minimum 4.5:1 ratio for normal text
- Minimum 3:1 ratio for large text

Touch Targets:
- Minimum 44px × 44px for all interactive elements
- Adequate spacing between buttons (8px minimum)
```

---

## Performance Optimizations

```
Lazy Loading:
- Load metrics immediately
- Load chart after initial paint
- Load cards progressively
- Lazy load images if any

Virtual Scrolling:
- For long lists of actions
- Render only visible items
- Smooth scrolling

Debouncing:
- Chart hover interactions
- Search filters
- Type-ahead inputs

Caching:
- Dashboard data cached for 5 minutes
- Charts cached for 15 minutes
- User preferences cached locally
```

---

## Animation Guidelines

```
Page Load:
- Fade in: All cards (staggered, 300ms each)
- Grow bars: Progress bar animation (300ms)
- Slide in: Navigation elements (200ms)

Interactions:
- Card hover: 200ms, ease-in-out
- Button click: 100ms, ease-out
- Loading shimmer: Infinite, 1.5s duration

Transitions:
- All: 200ms ease-in-out (default)
- Fast: 100ms ease-out
- Slow: 300ms cubic-bezier
- Scale: cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component implementation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
