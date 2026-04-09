# Weak Areas & Recommendations - Detailed Design

**Page:** Weak Areas & Recommendations  
**Version:** 1.0  
**Date:** 2026-04-09

---

## Page Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ WEAK AREAS & RECOMMENDATIONS                                    │
│                                                                 │
│ Filter Row:
│ [All ▼] [High 🔴] [Medium 🟡] [Low 🟢]   [✅ Recommendations] [📊 Data] [📝 Actions]
│                                                                 │
│ Content Area:
│ - High Priority (Red)
│ - Medium Priority (Amber)
│ - Low Priority (Green)
│ - Action Plan Summary (Footer)
└─────────────────────────────────────────────────────────────────┘
```

---

## Filter Controls

```
Priority Filter:
┌─────────────────┬───────────────────┬──────────────────┬────────────────────┐
│ [All Topics ▼]  │ [High 🔴 Priority]│ [Medium 🟡 Priority]│ [Low 🟢 Priority]│
└─────────────────┴───────────────────┴──────────────────┴────────────────────┘
- Height: 48px
- Active tab: Background #EF4444 (red), white text
- Active tab: Background #F59E0B (amber), black text
- Active tab: Background #10B981 (green), white text
- Inactive: #F3F4F6 bg, dark text
- Border-radius: 8px
- Gap: 8px between buttons
- Icons: 16px, centered

View Switcher:
┌───┬───┬───┬───┐
│ [✅ Recommendations] │ [📊 Data] │ [📝 Actions] │
└───┴───┴───┴───┘
- Type: Segmented control
- Active: #3B82F6 bg, white text
- Inactive: #F9FAFB bg, dark text
- Border-radius: 8px
- Height: 40px
- Icon position: Left of text
```

---

## High Priority Card (Critical - Review Immediately)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 HIGH PRIORITY - Molecular Shapes                             │
│                                                                 │
│ Topic: Molecular Shapes                                          │
│ Mastery: 58% ████████░░░░░░░░░░░░░░░░░ (Target: 70%)          │
│ Status: 🟠 Needs Improvement (12% below target)                │
│ Urgency: High - Immediate action required                      │
│                                                                 │
│ Issues Identified:                                              │
│                                                                 │
│ ❌ Confused about VSEPR theory application              (2 lines)│
│ ❌ Struggling with trigonal bipyramidal shapes            (2 lines)│
│ ✅ Good understanding of linear and bent shapes           (2 lines)│
│                                                                 │
│ Recommended Actions:                                            │
│                                                                 │
│ 1. [📝 Review: VSEPR Theory Basics]             [15 min]       │
│ 2. [🎯 Practice: Interactive 3D Models]             [20 min]  │
│ 3. [📊 Watch: Video Tutorial]                       [10 min]   │
│                                                                 │
│ Expected Impact: +15% mastery in 2 sessions (2 lines)           │
│                                                                 │
│ Actions: [🗑️ Dismiss] [⏰ Schedule Later]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Card Specifications:**

```
Card Container:
- Background: #FEF2F2 (light red tint)
- Border-radius: 12px
- Padding: 24px
- Border-left: 4px solid #EF4444 (red)
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Margin-bottom: 16px
- Hover: Shadow increases to 0 4px 6px

Header Section:
┌─────────────────┬───────────────────┐
│ 🔴 HIGH PRIORITY│ Molecular Shapes    │
└─────────────────┴───────────────────┘
- H2 font: 20px, bold, #111827
- Priority badge: #EF4444 bg, white, rounded
- Gap: 16px
- Flex: Space-between

Progress Section:
┌─────────────────┬───────────────────┐
│ Mastery: 58%    │ ████████░░░░...   │
│ Target: 70%     │ ─────────────────  │
└─────────────────┴───────────────────┘
- Label: "Mastery:" bold, 16px
- Value: 58% (32px, bold, #111827)
- Bar container: #E5E7EB bg, 8px height
- Bar fill: #EF4444 (red), 58% width
- Target indicator: Dashed line #10B981 at 70%
- Gap: 8px

Status Section:
┌────────────────────────────────────────────────────────────┐
│ Status: 🟠 Needs Improvement (12% below target)           │
└────────────────────────────────────────────────────────────┘
- Badge: 🟠 orange, #F59E0B bg
- Urgency text: 14px, #6B7280
- Margin-top: 8px

Issues Section:
┌────────────────────────────────────────────────────────────┐
│ Issues Identified:                                          │
│                                                            │
│ ❌ Problem description (3 lines max)                      │
│ ❌ Another problem (3 lines max)                          │
│ ✅ Positive note (3 lines max)                            │
└────────────────────────────────────────────────────────────┘
- Section title: Bold, 16px, #111827
- Icon size: 16px
- Icon colors:
│ ❌ Red: #EF4444
│ ✅ Green: #10B981
- Line height: 1.5
- Margin-top: 16px

Actions Section:
┌────────────────────────────────────────────────────────────┐
│ Recommended Actions:                                        │
│                                                            │
│ 1. [Primary Button] [Duration Badge]                       │
│ 2. [Primary Button] [Duration Badge]                       │
│ 3. [Primary Button] [Duration Badge]                       │
└────────────────────────────────────────────────────────────┘
- Button height: 40px
- Button width: 200px
- Button bg: #3B82F6, white text
- Badge: #F3F4F6 bg, 12px, gray text
- Icon: Left of button text
- Gap: 8px between actions

Footer Section:
┌────────────────────────────────────────────────────────────┐
│ Expected Impact: +15% in 2 sessions                          │
│                                                            │
│ [🗑️ Dismiss] [⏰ Schedule Later]                            │
└────────────────────────────────────────────────────────────┘
- Impact text: 14px, #6B7280
- Buttons: Secondary style, outlined
- Margin-top: 16px
```

---

## Medium Priority Card

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟡 MEDIUM PRIORITY - Atomic Structure                           │
│                                                                 │
│ Topic: Atomic Structure                                          │
│ Mastery: 67% ██████████░░░░░░░░░░░░░░░░░ (Target: 70%)       │
│ Status: 🟡 Approaching Target (3% below target)                │
│ Urgency: Medium - Schedule within 2-3 days                     │
│                                                                 │
│ Issues Identified:                                              │
│                                                                 │
│ ❌ Inconsistent with electron configuration rules    (3 lines)│
│ ✅ Strong grasp of protons/neutrons/electrons          (3 lines)│
│                                                                 │
│ Recommended Actions:                                            │
│                                                                 │
│ 1. [📝 Practice: Electron Configuration Drills]  [10 min]      │
│ 2. [🎯 Quick Quiz: Fill in the Blanks]         [8 min]        │
│                                                                 │
│ Expected Impact: +8% mastery in 1 session                       │
│                                                                 │
│ Actions: [🗑️ Dismiss] [⏰ Schedule Later]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Card Specifications:**

```
Card Container:
- Background: #FFFBEB (light amber tint)
- Border-left: 4px solid #F59E0B (amber)
- All other specs same as high priority

Header Badge: 🟡 amber, #F59E0B bg
Status Badge: 🟡 yellow-orange
Actions: Same as high priority
Expected Impact: +8% mastery in 1 session
```

---

## Low Priority Card

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟢 LOW PRIORITY - Chemical Bonds                                │
│                                                                 │
│ Topic: Chemical Bonds                                            │
│ Mastery: 85% ████████████████████░░░░░░ (Target: 80%)         │
│ Status: 🟢 On Track (5% above target)                          │
│ Urgency: Low - Maintenance required                            │
│                                                                 │
│ Strengths:                                                      │
│ ✅ Strong understanding of ionic and covalent bonds         (3 lines)│
│ ✅ Good grasp of electronegativity trends                   (3 lines)│
│                                                                 │
│ Maintenance: Weekly review recommended (1 line)                │
│                                                                 │
│ Recommended Actions:                                            │
│                                                                 │
│ 1. [📝 Quick Review: Bond Types]                 [5 min]       │
│                                                                 │
│ Expected Impact: Maintain current level                         │
│                                                                 │
│ Actions: [🗑️ Dismiss] [⏰ Schedule Later]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Card Specifications:**

```
Card Container:
- Background: #ECFDF5 (light green tint)
- Border-left: 4px solid #10B981 (green)
- All other specs same as high priority

Header Badge: 🟢 green, #10B981 bg
Status Badge: 🟢 green, #10B981 bg
Icons: ✅ for strengths
Expected Impact: Maintain current level
```

---

## Action Plan Summary (Footer)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 ACTION PLAN SUMMARY                                          │
│                                                                 │
│ Total Action Items: 8                                             │
│ Estimated Time: 90 minutes total                                  │
│                                                                 │
│ Today's Focus (3 actions - 35 min):                            │
│                                                                 │
│ ✅ [VSEPR Theory Basics] - Complete (15 min)                    │
│ ⏳ [Interactive 3D Models] - Pending (20 min)                   │
│ ⏳ [Electron Configuration] - Pending (25 min)                   │
│                                                                 │
│ [📅 Schedule Review Session] [📊 Track Progress]                │
│                                                                 │
│ Section Specifications:                                          │
│ - Background: #F9FAFB                                             │
│ - Border-radius: 12px                                             │
│ - Padding: 24px                                                   │
│ - Shadow: 0 1px 3px rgba(0,0,0,0.05)                           │
│ - Margin-top: 24px                                                │
│                                                                 │
│ Stats:                                                          │
│ - "Total Action Items: 8" (14px, #6B7280)                      │
│ - "Estimated Time: 90 minutes" (14px, #6B7280)                  │
│                                                                 │
│ Today's Focus:                                                  │
│ - H3: "Today's Focus (3 actions - 35 min)" (18px, bold)       │
│ - List items with icons and status                              │
│ - Icon colors:                                                   │
│   ✅ Completed: #10B981 (green)                                  │
│   ⏳ Pending: #F59E0B (amber)                                    │
│ - Duration: Badge, 12px, gray                                   │
│                                                                 │
│ Action Buttons:                                                 │
│ - Primary: "Schedule Review Session" (#3B82F6 bg)               │
│ - Secondary: "Track Progress" (outlined)                         │
│ - Height: 40px                                                    │
│ - Margin-top: 16px                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (>1024px)

```
Full layout with all cards visible:
- Cards: Horizontal layout for actions
- Charts: Detailed view
- Filters: All options expanded
- Grid: 2-column for cards
```

### Tablet (768px - 1024px)

```
Adapted layout:
- Cards: Single column
- Actions: Stack vertically
- Filters: Collapsible sections
- Charts: Simplified
```

### Mobile (<768px)

```
Single column layout:
- Cards: Full width
- Actions: Stack, full width
- Filters: Vertical stack
- Charts: Minimal, tap to expand
- Priority badges: Small icons only
```

---

## Component States

### Card Hover State

```
Normal State:
┌────────────────────────────────────────────────────────────┐
│ Card: Shadow 0 1px 3px rgba(0,0,0,0.1)                    │
│        Border-left 4px solid #EF4444                       │
└────────────────────────────────────────────────────────────┘

Hover State:
┌────────────────────────────────────────────────────────────┐
│ Card: Shadow 0 4px 6px rgba(0,0,0,0.15)                   │
│        Transform translateY(-2px)                         │
│        Transition: all 0.2s ease                          │
└────────────────────────────────────────────────────────────┘

Selected State:
┌────────────────────────────────────────────────────────────┐
│ Card: Border 2px solid #EF4444                            │
│       Background: #FEF2F2 (enhanced red tint)             │
└────────────────────────────────────────────────────────────┘
```

### Button States

```
Primary Action Button:
Normal:
┌────────────────────────────────────────────────────────────┐
│ #3B82F6 bg, white text, shadow                            │
│ Height: 40px, padding: 12px 20px                          │
└────────────────────────────────────────────────────────────┘

Hover:
┌────────────────────────────────────────────────────────────┐
│ #1E40AF bg, scale 1.02, shadow increases                  │
└────────────────────────────────────────────────────────────┘

Loading:
┌────────────────────────────────────────────────────────────┐
│ Spinner icon, text: "Loading..."                          │
└────────────────────────────────────────────────────────────┘

Secondary Button:
Normal:
┌────────────────────────────────────────────────────────────┐
│ White bg, #3B82F6 text, outline                           │
│ Height: 40px, padding: 12px 20px                          │
└────────────────────────────────────────────────────────────┘

Hover:
┌────────────────────────────────────────────────────────────┐
│ #EFF6FF bg, #1E40AF text, shadow increases                │
└────────────────────────────────────────────────────────────┘
```

---

## Interactive Features

### Card Expand/Collapse

```
Expanded View (Default):
- All sections visible: Header, Progress, Issues, Actions, Footer
- Expandable sections
- Smooth transitions

Collapsed View:
- Only visible: Topic title and mastery bar
- Click: Expands to full card
- Icon: chevron down/up to indicate state

Animation:
- Expand: 250ms, ease-in-out
- Collapse: 200ms, ease-in-out
- Height change: smooth transition
```

### Filter States

```
Priority Filter Active States:

High Priority (Selected):
┌───────┬──────┬──────┬──────┐
│[All ▼]│[High]│Medium│ Low │
└───────┴──────┴──────┴──────┘
       Active: Red bg, white text, bold

Medium Priority (Selected):
┌───────┬──────┬──────┬──────┐
│[All ▼]│ High │[Medium]│Low │
└───────┴──────┴──────┴──────┘
              Active: Amber bg, black text, bold

Low Priority (Selected):
┌───────┬──────┬──────┬──────┐
│[All ▼]│ High │Medium│[Low]│
└───────┴──────┴──────┴──────┘
                  Active: Green bg, white text, bold

All Topics (Selected):
┌──────┬──────┬──────┬──────┐
│[All]│High │Medium│Low │
└──────┴──────┴──────┴──────┘
       Active: Blue bg, white text, bold
```

### Action Item States

```
Completed Action:
┌────────────────────────────────────────────────────────────┐
│ ✅ [VSEPR Theory Basics] - Complete (15 min)                │
│   Completed: green checkmark, strikethrough text             │
│   Background: #F0FDF4 (light green)                        │
│   Transition: 300ms, fade out then remove                   │
└────────────────────────────────────────────────────────────┘

Pending Action:
┌────────────────────────────────────────────────────────────┐
│ ⏳ [Interactive 3D Models] - Pending (20 min)               │
│   Pending: amber clock icon, normal text                     │
│   Background: white                                        │
└────────────────────────────────────────────────────────────┘

Scheduled Action:
┌────────────────────────────────────────────────────────────┐
│ 📅 [Electron Configuration] - Scheduled (25 min)            │
│   Scheduled: calendar icon, normal text                      │
│   Background: #FEF2F2 (light red)                        │
└────────────────────────────────────────────────────────────┘
```

---

## Accessibility Features

```
Keyboard Navigation:
- Tab order: Priority filter → Cards → Filters → Action plan
- Focus indicators: 2px solid #3B82F6
- Keyboard shortcuts: Not required for basic navigation

Screen Reader:
- ARIA labels on all buttons
- Landmark regions: main, banner, complementary
- Live regions for dynamic updates
- Heading hierarchy: H1 → H2 → H3

Color Contrast:
- All text meets WCAG 2.1 AA standards
- Minimum 4.5:1 ratio for normal text
- Priority badges: High contrast colors

Touch Targets:
- All buttons: 44px minimum height
- Cards: Adequate spacing (16px gap)
- Action items: Full-width on mobile
```

---

## Animation Guidelines

```
Page Load:
- Cards: Fade in (300ms), staggered
- Filter tabs: Slide down (200ms)
- Action items: Bounce effect (150ms)

Interactions:
- Card hover: 200ms, ease-in-out
- Filter change: 250ms, slide
- Action complete: 300ms, fade out
- Card expand: 250ms, ease-in-out

Transitions:
- All: 200ms ease-in-out (default)
- Fast: 100ms ease-out
- Slow: 300ms cubic-bezier
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component implementation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
