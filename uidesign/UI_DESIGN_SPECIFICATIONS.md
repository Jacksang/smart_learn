# Smart Learn UI Design Specifications

**Version:** 1.0  
**Date:** 2026-04-09  
**Status:** ✅ Design Complete

---

## Design System Overview

### Color Palette

```
Primary Colors:
┌─────────────────────────────────────────────────────┐
│ Primary Blue    #3B82F6  - Main brand color        │
│ Primary Dark    #1E40AF  - Headers, strong actions│
│ Primary Light   #DBEAFE  - Backgrounds, hints      │
└─────────────────────────────────────────────────────┘

Secondary Colors:
┌─────────────────────────────────────────────────────┐
│ Success Green   #10B981  - Positive feedback       │
│ Warning Orange  #F59E0B  - Attention needed        │
│ Danger Red      #EF4444  - Errors, critical        │
│ Info Blue       #3B82F6  - Information             │
└─────────────────────────────────────────────────────┘

Neutral Colors:
┌─────────────────────────────────────────────────────┐
│ Gray 900        #111827  - Primary text            │
│ Gray 700        #374151  - Secondary text          │
│ Gray 500        #6B7280  - Placeholder, disabled   │
│ Gray 200        #E5E7EB  - Borders, separators     │
│ Gray 100        #F3F4F6  - Backgrounds             │
│ White           #FFFFFF  - Cards, surfaces          │
└─────────────────────────────────────────────────────┘

Mastery Levels:
┌─────────────────────────────────────────────────────┐
│ Expert      #059669  (Teal)    - 90-100%           │
│ Advanced    #0891B2  (Blue)    - 80-89%            │
│ Proficient  #0284C7  (Deep)    - 70-79%            │
│ Developing  #059669  (Green)   - 50-69%            │
│ Emerging    #F59E0B  (Orange)  - 30-49%            │
│ Novice      #EF4444  (Red)     - 0-29%             │
└─────────────────────────────────────────────────────┘
```

### Typography

```
Font Family: Inter, -apple-system, BlinkMacSystemFont, sans-serif

Type Scale:
┌─────────────────────────────────────────────────────┐
│ H1:  2.5rem (40px)  Font-weight: 700  Line-height: 1.2
│ H2:  2rem (32px)    Font-weight: 600  Line-height: 1.3
│ H3:  1.5rem (24px)  Font-weight: 600  Line-height: 1.4
│ H4:  1.25rem (20px) Font-weight: 600  Line-height: 1.5
│ Body: 1rem (16px)   Font-weight: 400  Line-height: 1.6
│ Small: 0.875rem     Font-weight: 400  Line-height: 1.5
│ Caption: 0.75rem    Font-weight: 400  Line-height: 1.4
└─────────────────────────────────────────────────────┘

Spacing Scale:
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

### Component Sizes

```
Buttons:
┌─────────────────────────────────────────────────────┐
│ Height: 40px (default)                               │
│ Padding: 12px 20px                                   │
│ Border-radius: 8px                                   │
│ Font-size: 1rem                                      │
└─────────────────────────────────────────────────────┘

Cards:
┌─────────────────────────────────────────────────────┐
│ Padding: 24px                                        │
│ Border-radius: 12px                                  │
│ Box-shadow: 0 1px 3px rgba(0,0,0,0.1)               │
│ Border: 1px solid #E5E7EB                           │
└─────────────────────────────────────────────────────┘

Input Fields:
┌─────────────────────────────────────────────────────┐
│ Height: 44px                                         │
│ Padding: 12px 16px                                   │
│ Border-radius: 8px                                   │
│ Border: 1px solid #D1D5DB                            │
│ Focus: Border-color #3B82F6, Ring 2px               │
└─────────────────────────────────────────────────────┘
```

---

## Page Layouts

### 1. Dashboard Overview Page

```
┌─────────────────────────────────────────────────────────────────┐
│ SMART LEARN DASHBOARD                                         │
│                                                                 │
│ [📚] [📊] [🎯] [⚙️]                    [👤 User] [🔔] [🎵]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📚 Welcome back, Student! 👋                                    │
│                                                                 │
│  Last session: 2 hours ago • Next lesson: Atomic Structure    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OVERVIEW METRICS                                               │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │ SESSIONS    │ │ QUESTIONS   │ │ MASTERY AVG │ │ STREAK   ││
│  │    24       │ │   186       │ │    72%      │ │   5d     ││
│  │  📅 Total   │ │  ✅ Done    │ │  📈 ↑12%    │ │  🔥 5d   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 LEARNING PROGRESS (Last 7 Days)                             │
│                                                                 │
│    ████ ██████ ████████ ██████████ ████████ ██████            │
│    Mon   Tue     Wed      Thu      Fri      Sat    Sun        │
│                                                                 │
│    Avg: 45 min/day • Questions: 23 • Mastery: +3%            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔥 CURRENT SESSION: Atomic Structure                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Progress: 67% ████████████████████░░░░░░░░                │
│  │ Topics: 4/6 completed                                       │
│  │ Next: Electron Configuration                                │
│  │ [▶️ Resume Session] [📖 Review Topics]                     │
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 QUICK ACTIONS                                               │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │ 📝 Quiz     │ │ 🎯 Review   │ │ 📚 New      │ │ 🎵 Listen││
│  │ Start Quiz  │ │ Weak Areas  │ │ Lessons     │ │ Narration ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

```
Header Section:
┌──────────────────────────────────────────────────────────────┐
│ Logo [Smart Learn]            Nav: [📚 Dashboard] [📊 Analyze]│
│                          [🎯 Goals] [⚙️ Settings]    [👤 User] │
└──────────────────────────────────────────────────────────────┘
- Height: 64px
- Background: #FFFFFF
- Border-bottom: 1px solid #E5E7EB
- Sticky: true (on scroll)

Welcome Banner:
┌──────────────────────────────────────────────────────────────┐
│ H2: "Welcome back, Student! 👋"                              │
│ Text: "Last session: 2 hours ago • Next lesson: Atomic..." │
│ Button: [🎵 Start Narration]                                  │
└──────────────────────────────────────────────────────────────┘
- Padding: 24px
- Background: linear-gradient(135deg, #3B82F6, #1E40AF)
- Text: #FFFFFF
- Border-radius: 16px

Metrics Cards (Grid 4 columns):
┌──────────────────────────────────────────────────────────────┐
│ Card 1: Sessions                                              │
│   Icon: 📚 (32px, #3B82F6)                                  │
│   Value: 24 (48px, #111827, 700)                            │
│   Label: Total sessions (14px, #6B7280)                     │
│   Trend: ↑12% (14px, #10B981, +)                            │
└──────────────────────────────────────────────────────────────┘

Progress Chart:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Learning Progress (Last 7 Days)"                         │
│ Chart: Bar chart (height: 200px)                            │
│   Bars: #3B82F6 (75% opacity)                               │
│   Hover: #1E40AF (100% opacity)                             │
│   Grid lines: #E5E7EB, 1px                                   │
│   X-axis labels: Mon, Tue, Wed...                           │
│   Y-axis: 0, 10, 20, 30, 40, 50 min                         │
└──────────────────────────────────────────────────────────────┘

Current Session Card:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Current Session: Atomic Structure"                       │
│ Progress bar (height: 8px, #E5E7EB bg, #10B981 fill)       │
│ Stats: 4/6 topics completed                                  │
│ Next topic: Electron Configuration                           │
│ Buttons: [▶️ Resume] [📖 Review] (secondary, outlined)       │
└──────────────────────────────────────────────────────────────┘
```

---

### 2. Analytics & Progress Page

```
┌─────────────────────────────────────────────────────────────────┐
│ ANALYTICS & PROGRESS                                            │
│                                                                 │
│ Filters: [All Time ▼] [Last 30 Days] [Custom Range] [📅]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ LEARNING ACTIVITY (Last 30 Days)                                │
│                                                                 │
│    ████████████████████████████████████████████████████████    │
│    ████████████████████████████████████████████████████████    │
│    ████████████████████████████████████████████████████████    │
│                                                                 │
│    Week 1   Week 2   Week 3   Week 4                            │
│                                                                 │
│    Avg: 45 min/day • Questions: 234 • Mastery: +15%          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ MASTERY TRENDS (6 Concepts)                                      │
│                                                                 │
│   100% ┤                                                   ───  │
│         │                                               ──      │
│    80% ┤                                         ──            │
│         │                                     ──                │
│    60% ┤                               ──                        │
│         │                         ──                              │
│    40% ┤                 ──                                      │
│         │           ──                                            │
│    20% ┤   ──                                                  │
│         │                                                     ─  │
│     0% ┼──────────────────────────────────────────────────────────
│         Q1      Q2      Q3      Q4     Q5      Q6
│         Time →   │     │     │     │     │     │
│                Now
│                                                                 │
│   📈 Legend: Blue=Current, Green=Previous, Dashed=Target (70%) │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ TOPICS PERFORMANCE                                               │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Atomic Structure        ████░░░░░░░░░░░░░  67% ████░░░░  │ │
│ │ Electron Config       ████░░░░░░░░░░░░░  72% ████░░░░  │ │
│ │ Chemical Bonds       ████████░░░░░░░░░░  85% ██████░░░  │ │
│ │ Periodic Table      ██████████░░░░░░░░░  91% ████████░  │ │
│ │ Molecular Shapes    ████░░░░░░░░░░░░░  58% ████░░░░░░  │ │
│ │ Chemical Reactions  █████░░░░░░░░░░░░░  76% █████░░░░░░ │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│   Dark = Mastery, Light = Target, Bar = Current               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📊 PERFORMANCE DISTRIBUTION                                      │
│                                                                 │
│    85%  ┤              ████████                                │
│    80%  ┤             ████████                                │
│    75%  ┤            ████████                                │
│    70%  ┤           ████████                                │
│    65%  ┤          ████████                                │
│    60%  ┤         ████████                                │
│    55%  ┤        ████████                                │
│    50%  ┤       ████████                                │
│         └─────────────────────────────────────────────       │
│         Easy    Medium    Hard    Very Hard                    │
│                                                                 │
│   Avg: 72% • Easy: 89% • Medium: 71% • Hard: 58%             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

```
Filters Bar:
┌──────────────────────────────────────────────────────────────┐
│ Select: [All Time ▼] [Last 30 Days] [Custom Range] [📅]    │
│ Height: 48px                                                │
│ Background: #F9FAFB                                          │
│ Border-bottom: 1px solid #E5E7EB                           │
└──────────────────────────────────────────────────────────────┘

Activity Chart:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Learning Activity (Last 30 Days)"                        │
│ Chart type: Line chart (height: 250px)                      │
│   Line: #3B82F6, 3px, smooth curve                          │
│   Fill: #3B82F6, 20% opacity                               │
│   Grid: #E5E7EB, 1px                                        │
│   Tooltip: Shows exact values on hover                       │
│   X-axis: Week 1, Week 2, Week 3, Week 4                    │
│   Y-axis: 0, 10, 20, 30, 40, 50 min                         │
│   Statistics below: "Avg: 45 min/day • Questions: 234..."  │
└──────────────────────────────────────────────────────────────┘

Mastery Trends Chart:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Mastery Trends (6 Concepts)"                             │
│ Chart type: Line chart (height: 300px)                      │
│   Lines: 6 concept lines (#3B82F6, #10B981, #0891B2...)  │
│   Current: Solid, Previous: Dashed, Target: Dotted          │
│   Target line: #10B981, dashed, at 70%                      │
│   X-axis: Q1 to Q6 (dates)                                  │
│   Y-axis: 0% to 100%                                        │
│   Legend: Toggleable below chart                            │
│   Data points: Show on hover                                │
└──────────────────────────────────────────────────────────────┘

Topics Performance (Table):
┌──────────────────────────────────────────────────────────────┐
│ H3: "Topics Performance"                                      │
│ Table: 6 columns (Topic, Mastery %, Progress, Target,      │
│        Status, Actions)                                      │
│ Rows: 6 topics                                                │
│   Sortable columns: Mastery %, Progress                     │
│   Progress bars: Horizontal, #E5E7EB bg, fill based on %  │
│   Status badges: 🟢 Strong (80%+), 🟡 Good (60-79%), 🟠  │
│                  Needs Work (<60%)                          │
│   Actions: [📖 Review], [🎯 Targeted Practice]              │
└──────────────────────────────────────────────────────────────┘

Performance Distribution:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Performance Distribution"                                │
│ Chart type: Histogram (height: 200px)                       │
│   Bars: #3B82F6, grouped by difficulty                      │
│   X-axis: Easy, Medium, Hard, Very Hard                     │
│   Y-axis: Accuracy % (0-100%)                               │
│   Avg badge: Top right (72%)                               │
│   Details below: Easy: 89%, Medium: 71%, etc.             │
└──────────────────────────────────────────────────────────────┘
```

---

### 3. Weak Areas & Recommendations Page

```
┌─────────────────────────────────────────────────────────────────┐
│ WEAK AREAS & RECOMMENDATIONS                                    │
│                                                                 │
│ Priority Filter: [All ▼] [High 🔴] [Medium 🟡] [Low 🟢]       │
│ Show: [✅ Recommendations] [📊 Data] [📝 Action Items]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔴 HIGH PRIORITY - Review Immediately                           │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ MOLECULAR SHAPES                                          │ │
│ │ Mastery: 58% ████████░░░░░░░░░░░ (Target: 70%)          │ │
│ │ Status: Needs improvement - 12% below target             │ │
│ │                                                             │ │
│ │ Issues Identified:                                        │ │
│ │   ❌ Confused about VSEPR theory application             │ │
│ │   ❌ Struggling with trigonal bipyramidal shapes       │ │
│ │   ✅ Good understanding of linear and bent shapes      │ │
│ │                                                             │ │
│ │ Recommended Actions:                                      │ │
│ │   1. [📝 Review: VSEPR Theory Basics] (15 min)          │ │
│ │   2. [🎯 Practice: Interactive 3D Models] (20 min)      │ │
│ │   3. [📊 Watch: Video Tutorial] (10 min)                │ │
│ │                                                             │ │
│ │ Expected Impact: +15% mastery in 2 sessions              │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🟡 MEDIUM PRIORITY - Schedule Review                            │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ATOMIC STRUCTURE                                            │ │
│ │ Mastery: 67% ██████████░░░░░░░░ (Target: 70%)            │ │
│ │ Status: Approaching target - 3% below target             │ │
│ │                                                             │ │
│ │ Issues Identified:                                        │ │
│ │   ❌ Inconsistent with electron configuration rules      │ │
│ │   ✅ Strong grasp of protons/neutrons/electrons        │ │
│ │                                                             │ │
│ │ Recommended Actions:                                      │ │
│ │   1. [📝 Practice: Electron Configuration Drills] (10 min) │
│ │   2. [🎯 Quick Quiz: Fill in the Blanks] (8 min)        │ │
│ │                                                             │ │
│ │ Expected Impact: +8% mastery in 1 session                │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🟢 LOW PRIORITY - Continue Monitoring                           │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ CHEMICAL BONDS                                              │ │
│ │ Mastery: 85% ████████████████████ (Target: 80%)            │ │
│ │ Status: On track - 5% above target                         │ │
│ │                                                             │ │
│ │ Strengths: Strong understanding of ionic and covalent    │ │
│ │ Maintenance: Weekly review recommended                     │ │
│ │                                                             │ │
│ │ Recommended Actions:                                      │ │
│ │   1. [📝 Quick Review: Bond Types] (5 min)               │ │
│ │                                                             │ │
│ │ Expected Impact: Maintain current level                  │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📋 ACTION PLAN SUMMARY                                          │
│                                                                 │
│ Total Action Items: 8                                           │
│ Estimated Time: 90 minutes total                              │
│                                                                 │
│ Today's Focus (3 actions - 35 min):                           │
│   ✅ [VSEPR Theory Basics] - Complete (15 min)               │
│   ⏳ [Interactive 3D Models] - Pending (20 min)               │
│   ⏳ [Electron Configuration] - Pending (25 min)              │
│                                                                 │
│ [📅 Schedule Review Session] [📊 Track Progress]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

```
Priority Filter:
┌──────────────────────────────────────────────────────────────┐
│ Select: [All ▼] [High 🔴] [Medium 🟡] [Low 🟢]             │
│ Height: 48px                                                 │
│ Badges: 12px, rounded, appropriate color                    │
└──────────────────────────────────────────────────────────────┘

Weak Area Card (High Priority):
┌──────────────────────────────────────────────────────────────┐
│ Topic: MOLECULAR SHAPES (H2, #111827)                       │
│ Progress bar: 58% filled (8px height, #10B981)            │
│ Target indicator: 70% target line (dashed, #10B981)       │
│ Status badge: 🟠 Needs improvement (orange, 12px)          │
│                                                             │
│ Issues Section:                                             │
│   - ❌ Confused about VSEPR theory (3 lines max)          │
│   - ❌ Struggling with trigonal bipyramidal (3 lines)    │
│   - ✅ Good understanding of linear (green check)        │
│                                                             │
│ Recommendations Section:                                    │
│   - Action buttons: [📝 Review...] (primary, 40px height)│
│   - Duration: 15 min (badge, secondary)                   │
│                                                             │
│ Expected Impact: "+15% mastery in 2 sessions" (caption)   │
│                                                             │
│ Border-left: 4px solid #EF4444 (red for high priority)   │
│ Background: #FEF2F2 (light red tint)                      │
└──────────────────────────────────────────────────────────────┘

Medium Priority Card:
┌──────────────────────────────────────────────────────────────┐
│ Border-left: 4px solid #F59E0B (orange)                     │
│ Background: #FFFBEB (light yellow tint)                    │
│ All other specifications same as High Priority card        │
└──────────────────────────────────────────────────────────────┘

Low Priority Card:
┌──────────────────────────────────────────────────────────────┐
│ Border-left: 4px solid #10B981 (green)                      │
│ Background: #ECFDF5 (light green tint)                      │
│ All other specifications same as High Priority card        │
└──────────────────────────────────────────────────────────────┘

Action Plan Summary:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Action Plan Summary"                                     │
│ Stats: "Total: 8 items • Time: 90 min"                      │
│                                                             │
│ Today's Focus (checklist style):                            │
│   ✅ VSEPR Theory Basics (15 min) - Completed               │
│   ⏳ Interactive 3D Models (20 min) - Pending               │
│   ⏳ Electron Configuration (25 min) - Pending               │
│                                                             │
│ Buttons: [📅 Schedule] [📊 Track] (secondary)               │
└──────────────────────────────────────────────────────────────┘
```

---

### 4. Mastery Visualization Page

```
┌─────────────────────────────────────────────────────────────────┐
│ MASTERY VISUALIZATION                                           │
│                                                                 │
│ View: [Rings] [Bars] [Heatmap] [Comparison] [📊 Views ▼]       │
│ Time Period: [Last 30 Days ▼] [All Time] [Custom]              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CONCEPT MASTERY RINGS                                           │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐   │
│   │                                                       │   │
│   │    🔴 85%           🟢 92%         🔵 78%           │   │
│   │     Chemical          Periodic           Molecular    │   │
│   │      Bonds            Table             Shapes        │   │
│   │                                                       │   │
│   │    🟡 67%           🟠 58%           🟢 91%           │   │
│   │    Atomic           Electron          Chemical       │   │
│   │   Structure       Configuration        Reactions     │   │
│   │                                                       │   │
│   └───────────────────────────────────────────────────────┘   │
│                                                                 │
│   Size: 120px diameter rings                                    │
│   Stroke: 12px width                                           │
│   Colors by mastery level:                                     │
│     🟢 80-100%: #10B981 (green)                               │
│     🟡 60-79%: #F59E0B (amber)                                │
│     🔴 <60%: #EF4444 (red)                                    │
│   Label: Mastery % (32px, bold), Concept name (16px)          │
│   Progress bar around ring: 4px, opacity 0.2                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ MASTERY DISTRIBUTION (Bar Chart)                                │
│                                                                 │
│   100 ┤█████████████████████████████████████████████████████   │
│    80 ┤█████████████████████████████████████████████████     │
│    60 ┤█████████████████████████████████████████             │
│    40 ┤██████████████████████████████████                    │
│    20 ┤████████████████████████                            │
│     0 ┼─────────────────────────────────────────────────────
│         Novice  Emerging Dev.  Prof. Advanced  Expert
│                                                                 │
│   Count: 3, 5, 12, 18, 8, 4 (total: 50 concepts)             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ MASTERY BY DIFFICULTY                                           │
│                                                                 │
│    90% ┤           ████████████████████                        │
│    80% ┤       ████████████████████                            │
│    70% ┤   ████████████████████                                │
│    60% ┤██████████████████                                      │
│    50% ┤                                                        │
│         Easy    Medium    Hard    Very Hard                    │
│                                                                 │
│   Current Avg: 72% • Target: 70%                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ TREND INDICATORS                                                │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Last 7 Days: ↑ +5% 📈 Trend: Improving                    │ │
│ │ Last 30 Days: ↑ +12% 📈 Trend: Improving                  │ │
│ │ This Month: = +0% ⚖️ Trend: Stable                        │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

```
View Selector:
┌──────────────────────────────────────────────────────────────┐
│ Segmented control: [Rings] [Bars] [Heatmap] [Comparison]    │
│ Height: 40px                                                 │
│ Selected: #3B82F6, white text                                │
│ Unselected: #E5E7EB, dark text                               │
│ Border-radius: 8px                                           │
└──────────────────────────────────────────────────────────────┘

Mastery Rings Grid:
┌──────────────────────────────────────────────────────────────┐
│ Grid: 3 columns × 2 rows (responsive, adapts to screen)    │
│ Each ring: 120px diameter, 12px stroke                     │
│ Stroke colors by mastery level:                             │
│   🟢 80-100%: #10B981 (strong mastery)                    │
│   🟡 60-79%: #F59E0B (good mastery)                        │
│   🔴 <60%: #EF4444 (needs improvement)                     │
│ Labels: % size bold, concept name below (16px)             │
│ Hover: Ring scales 10%, shows trend indicators              │
│ Click: Opens concept detail view                            │
│ Progress bar: 4px width, 20% opacity, around outer edge   │
└──────────────────────────────────────────────────────────────┘

Distribution Chart:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Mastery Distribution"                                    │
│ Chart type: Horizontal bar chart (height: 250px)            │
│   Bars: 6 categories (Novice to Expert)                     │
│   Colors by mastery level (same as rings)                   │
│   X-axis: Count (0-25)                                      │
│   Y-axis: 6 mastery categories                              │
│   Label on bar: Count value, percentage                     │
│   Stats below: "3, 5, 12, 18, 8, 4 (total: 50 concepts)"  │
│   Tooltip: Shows exact counts and percentages on hover       │
└──────────────────────────────────────────────────────────────┘

Difficulty Comparison:
┌──────────────────────────────────────────────────────────────┐
│ H3: "Mastery by Difficulty"                                   │
│ Chart type: Grouped bars (height: 200px)                    │
│   Bars: 4 difficulty levels (Easy, Medium, Hard, Very Hard)│
│   Colors: #3B82F6 (current), #10B981 (target, 70%)        │
│   X-axis: Difficulty levels                                 │
│   Y-axis: 0% to 100%                                        │
│   Current avg badge: 72%                                    │
│   Target line: Dashed at 70%                                │
│   Hover: Shows exact values for current and target         │
└──────────────────────────────────────────────────────────────┘

Trend Indicators:
┌──────────────────────────────────────────────────────────────┐
│ Card with trend statistics:                                   │
│   - Last 7 Days: +5% 📈 (up arrow, green)                   │
│   - Last 30 Days: +12% 📈 (up arrow, green)                 │
│   - This Month: = 0% ⚖️ (balance icon, gray)                │
│ Height: 80px                                                  │
│ Background: #F9FAFB                                           │
│ Border-radius: 8px                                            │
│ Each row: Label, percentage, trend icon, trend description   │
└──────────────────────────────────────────────────────────────┘
```

---

## Responsive Design Specifications

### Breakpoints

```
Mobile (< 768px):
┌──────────────────────────────────────────────────────────────┐
│ Single column layout                                          │
│ Cards stack vertically                                       │
│ Charts reduce to 100% width                                  │
│ Tables become card-based or scrollable                       │
│ Navigation collapses to hamburger menu                       │
└──────────────────────────────────────────────────────────────┘

Tablet (768px - 1024px):
┌──────────────────────────────────────────────────────────────┐
│ 2-column grid for cards                                      │
│ Charts maintain readability                                │
│ Navigation: Icon-only or condensed labels                  │
│ Touch targets: 44px minimum                                 │
└──────────────────────────────────────────────────────────────┘

Desktop (> 1024px):
┌──────────────────────────────────────────────────────────────┐
│ Full 3-4 column grids                                      │
│ Expanded charts with tooltips                             │
│ Full navigation labels visible                            │
│ Hover states enabled                                     │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Adaptations

```
Dashboard (Mobile):
┌──────────────────────────────────────────────────────────────┐
│ [📱 Smart Learn]    [☰ Menu]  [🔔] [👤]                    │
│ H2: Welcome back!                                          │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Last session: 2h ago                                   │   │
│ │ Next: Atomic Structure                                 │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ [📚 Sessions] [📊 Questions] [📈 Mastery] [🔥 Streak]      │
│ (2x2 grid, 4 cards)                                          │
│                                                              │
│ [📊 Learning Progress]                                       │
│ Bar chart (simplified, 150px height)                        │
│                                                              │
│ [🎯 Current Session: Atomic Structure]                      │
│ Progress bar, Resume button, Review button                  │
│                                                              │
│ [🎵 Listen] [📝 Quiz] [📚 New] [🎯 Review]                  │
│ (horizontal scrollable buttons)                             │
└──────────────────────────────────────────────────────────────┘

Analytics (Mobile):
┌──────────────────────────────────────────────────────────────┐
│ [📊 Analytics]                                               │
│ Filters: [Last 30 Days ▼] [📅]                            │
│                                                              │
│ [📈 Activity (Simplified)]                                   │
│ Line chart (80px height, 5 data points)                     │
│                                                              │
│ [📊 Topics Performance]                                      │
│ Each topic as card:                                        │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Atomic Structure      67% ████████░░░░                │   │
│ │ [📖 Review]                                           │   │
│ └────────────────────────────────────────────────────────┘   │
│ (scrollable list of cards)                                    │
│                                                              │
│ [📈 Mastery Trends]                                          │
│ Simplified line chart, toggleable concepts                  │
└──────────────────────────────────────────────────────────────┘

Weak Areas (Mobile):
┌──────────────────────────────────────────────────────────────┐
│ [🎯 Weak Areas]                                              │
│ Priority: [All ▼] [High] [Medium] [Low]                   │
│                                                              │
│ [🔴 HIGH: Molecular Shapes]                                  │
│ Card with progress, issues, actions                         │
│ All sections collapsible (expandable)                       │
│                                                              │
│ [🟡 MEDIUM: Atomic Structure]                                │
│ Same layout, different priority color                       │
│                                                              │
│ [📋 Action Plan Summary]                                     │
│ Collapsible section                                         │
│ List of action items with completion status                 │
│                                                              │
│ [📅 Schedule Review] [📊 Track Progress]                    │
│ (full-width buttons at bottom)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Interactive States

### Button States

```
Primary Button:
┌──────────────────────────────────────────────────────────────┐
│ Normal: #3B82F6 bg, #FFFFFF text, 0 1px 2px shadow        │
│ Hover: #1E40AF bg, scale 1.02, shadow increases           │
│ Active: #1E3A8A bg, scale 0.98                            │
│ Disabled: #E5E7EB bg, #6B7280 text, no shadow            │
│ Loading: Spinner icon, text "Loading..."                  │
└──────────────────────────────────────────────────────────────┘

Secondary Button:
┌──────────────────────────────────────────────────────────────┐
│ Normal: #FFFFFF bg, #3B82F6 text, 1px solid #3B82F6      │
│ Hover: #EFF6FF bg, #1E40AF text, shadow increases       │
│ Active: #DBEAFE bg, #1E3A8A text                        │
│ Disabled: #F3F4F6 bg, #9CA3AF text, #D1D5DB border     │
└──────────────────────────────────────────────────────────────┘

Outline Button:
┌──────────────────────────────────────────────────────────────┐
│ Normal: Transparent, 1px solid #6B7280, #6B7280 text     │
│ Hover: #F9FAFB bg, #374151 text, #6B7280 border         │
│ Active: #F3F4F6 bg, #111827 text                        │
└──────────────────────────────────────────────────────────────┘
```

### Card States

```
Normal Card:
┌──────────────────────────────────────────────────────────────┐
│ Padding: 24px                                              │
│ Border-radius: 12px                                        │
│ Border: 1px solid #E5E7EB                                │
│ Shadow: 0 1px 3px rgba(0,0,0,0.1)                        │
│ Background: #FFFFFF                                        │
└──────────────────────────────────────────────────────────────┘

Hover Card:
┌──────────────────────────────────────────────────────────────┐
│ Shadow: 0 4px 6px rgba(0,0,0,0.1) (increases)            │
│ Border: 1px solid #3B82F6 (on hover)                       │
│ Transform: translateY(-2px)                               │
│ Transition: all 0.2s ease                                  │
└──────────────────────────────────────────────────────────────┘

Selected Card:
┌──────────────────────────────────────────────────────────────┐
│ Border: 2px solid #3B82F6                                  │
│ Shadow: 0 4px 12px rgba(59,130,246,0.2)                   │
│ Background: #EFF6FF (light blue tint)                     │
└──────────────────────────────────────────────────────────────┘

Loading State:
┌──────────────────────────────────────────────────────────────┐
│ Background: #F3F4F6 (skeleton loader colors)              │
│ Animation: Shimmer effect                                  │
│ Width: 100% for all elements                               │
│ Border-radius: 8px                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Animation Guidelines

### Transitions

```
Standard:
- Duration: 200ms
- Timing function: ease-in-out
- Property: all

Fast:
- Duration: 100ms
- Timing function: ease-out
- Property: transform, opacity

Slow:
- Duration: 300ms
- Timing function: cubic-bezier(0.4, 0, 0.2, 1)
- Property: all

Smooth Scale:
- Duration: 150ms
- Timing function: cubic-bezier(0.34, 1.56, 0.64, 1)
- Property: transform
- Use for buttons on hover/click
```

### Animations

```
Fade In:
- Opacity: 0 → 1
- Transform: translateY(10px) → translateY(0)
- Duration: 300ms
- Delay: staggered for multiple elements

Slide Up:
- Transform: translateY(20px) → translateY(0)
- Duration: 250ms
- Delay: staggered

Bounce:
- Transform: scale(0.95) → scale(1)
- Duration: 150ms
- Timing: cubic-bezier(0.34, 1.56, 0.64, 1)

Shimmer:
- Background gradient animation
- Duration: infinite
- Direction: left to right
```

---

## Accessibility Standards

### Color Contrast
- All text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: 3:1 minimum

### Focus Indicators
- All interactive elements: Visible focus ring
- Ring width: 2px
- Ring color: #3B82F6 (primary)
- Ring offset: 2px from element

### Keyboard Navigation
- Tab order: Logical flow through content
- Focus visible: Always on keyboard interactions
- Skip links: "Skip to main content" at top
- Focus trap: Modals and dialogs

### Screen Reader Support
- Alt text: All images and icons with meaning
- Labels: All form inputs properly labeled
- ARIA: Proper ARIA roles and attributes
- Live regions: Dynamic content announced
- Heading hierarchy: H1 → H2 → H3 structure

### Touch Targets
- Minimum size: 44px × 44px
- Spacing: 8px between interactive elements
- Touch feedback: Visual feedback on tap

---

## Implementation Notes

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-primary-dark: #1E40AF;
  --color-primary-light: #DBEAFE;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  
  /* Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 6px rgba(0,0,0,0.1);
}
```

---

## Next Steps

1. ✅ Review design specifications with team
2. ✅ Finalize color palette and typography
3. 🔄 Create component library (React/Vue/Angular)
4. 🔄 Implement responsive breakpoints
5. 🔄 Add animations and transitions
6. 🔄 Test accessibility (WCAG 2.1 AA)
7. 🔄 User testing and feedback collection
8. 🔄 Iterate based on feedback

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component library creation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
