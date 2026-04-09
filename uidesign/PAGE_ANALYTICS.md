# Analytics & Progress Page - Detailed Design

**Page:** Analytics & Progress  
**Version:** 1.0  
**Date:** 2026-04-09

---

## Page Header

```
┌─────────────────────────────────────────────────────────────────┐
│ ANALYTICS & PROGRESS                                           │
│                                                                 │
│ Filters: [All Time ▼] [Last 30 Days] [Custom Range] [📅]       │
│                                                                 │
│ Button Group:
│ - Active: #3B82F6 bg, white text
│ - Inactive: #F3F4F6 bg, #6B7280 text
│ - Height: 40px
│ - Padding: 8px 16px
│ - Border-radius: 8px
│ - Dropdown: Select menu for time range
│ - Calendar: Date picker icon
└─────────────────────────────────────────────────────────────────┘
```

---

## Learning Activity Chart

```
┌─────────────────────────────────────────────────────────────────┐
│ LEARNING ACTIVITY (Last 30 Days)                                │
│                                                                 │
│ Chart Area (300px height):                                      │
│                                                                 │
│    ██████████████████████████████████████████████████████████   │
│    ██████████████████████████████████████████████████████████   │
│    ██████████████████████████████████████████████████████████   │
│                                                                 │
│    Week 1   Week 2   Week 3   Week 4                            │
│                                                                 │
│    Avg: 45 min/day • Questions: 234 • Mastery: +15%          │
│                                                                 │
│ Chart Specifications:
│ - Type: Stacked bar chart (4 weeks)
│ - Height: 300px
│ - Width: 100%
│ - Bar groups: 4 groups (one per week)
│ - Sub-bars per week: Daily activities (7 bars)
│ - Colors: #3B82F6 (current), #DBEAFE (hover)
│ - Grid: Horizontal #E5E7EB, 1px
│ - X-axis: Week labels centered
│ - Y-axis: 0, 10, 20, 30, 40, 50 minutes
│ - Tooltip: Shows exact minutes per day
│ - Legend: "Weekly Activity" below chart
│ - Stats line: Below chart, 14px, #6B7280
└─────────────────────────────────────────────────────────────────┘
```

**Chart Interactions:**

```
Hover State:
- Bar scales 1.05
- Opacity 100% (from 75%)
- Tooltip appears below cursor
- Tooltip shows: Date, Minutes, Questions

Click State:
- Bar stays selected
- Shows detailed view panel
- Filters chart by selected date

Responsive:
- Desktop: All details visible
- Tablet: Simplified tooltips
- Mobile: Vertical scroll, tap to expand
```

---

## Mastery Trends Chart

```
┌─────────────────────────────────────────────────────────────────┐
│ MASTERY TRENDS (6 Concepts)                                      │
│                                                                 │
│ Line Chart (350px height):                                        │
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
│ Chart Specifications:
│ - Type: Multi-line chart
│ - Height: 350px
│ - Width: 100%
│ - Lines: 6 concept lines (one per concept)
│ - Colors:
│   Concept 1: #3B82F6 (blue)
│   Concept 2: #10B981 (green)
│   Concept 3: #F59E0B (amber)
│   Concept 4: #EF4444 (red)
│   Concept 5: #8B5CF6 (purple)
│   Concept 6: #EC4899 (pink)
│ - Current: Solid lines, 2px width
│ - Previous: Dashed lines, 2px width
│ - Target: Dotted line, #10B981, 70% level
│ - Data points: Show on hover
│ - X-axis: Q1 to Q6 (dates or weeks)
│ - Y-axis: 0% to 100%
│ - Target line: Horizontal, dashed, at 70%
│ - Legend: Toggleable below chart
└──────────────────────────────────────────────────────────────┘
```

**Chart Components:**

```
Legend:
┌────────────────┬─────────────────┬────────────────┬─────────────┐
│ ☑️ Atomic Structure     (3B82F6)  🟢 85% (↑5%)   📈 Improved │
│ ☑️ Chemical Bonds       (10B981)  🟢 92% (↑3%)   📈 Stable    │
│ ☑️ Molecular Shapes     (F59E0B)  🟡 67% (↑2%)   📈 Improved  │
│ ☑️ Periodic Table       (EF4444)  🟢 78% (↑1%)   📈 Stable    │
│ ☑️ Electron Config      (8B5CF6)  🟡 58% (↑4%)   📈 Improved  │
│ ☑️ Chemical Reactions   (EC4899)  🟢 91% (↑2%)   📈 Stable    │
└────────────────┴─────────────────┴────────────────┴─────────────┘
- Height: Auto (scrollable if 6+ concepts)
- Toggle: Checkbox to show/hide concept
- Sort: Click column header to sort
- Color indicator: Small square matching line color
- Current value: Bold, large font
- Trend: Arrow with percentage
- Status: Badge color-coded

Data Point Tooltip:
┌──────────────┬───────────┬───────────┬───────────┐
│ Atomic Str │ Current: 85% │ Prev: 80% │ Target: 70% │
└──────────────┴───────────┴───────────┴───────────┘
- Background: #111827
- Color: #FFFFFF
- Padding: 8px 12px
- Border-radius: 4px
- Shows: Date, current %, previous %, target %
```

---

## Topics Performance Table

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPICS PERFORMANCE                                               │
│                                                                 │
│ ┌────────┬─────┬──────┬───────┬────────┬─────┬───────┬──────┐ │
│ │ TOPIC  │ %   │PROGRESS│TARGET│STATUS  │🎯│ REV  │📚 │ │
│ ├────────┼─────┼──────┼───────┼────────┼─────┼───────┼──────┤ │
│ │Atomic  │67%  │██░░░░│70%    │🟡Good  │🎯  │📖Rev  │📚  │ │
│ │Electron│72%  │██░░░░│70%    │🟡Good  │🎯  │📖Rev  │📚  │ │
│ │Bonds   │85%  │████  │80%    │🟢Strong│🎯  │📖Rev  │📚  │ │
│ │Periodic│91%  │████  │80%    │🟢Strong│🎯  │📖Rev  │📚  │ │
│ │Shapes  │58%  │░░░░  │60%    │🟠Needs│🎯  │📖Rev  │📚  │ │
│ │Reactions│76% │██░░░░│70%    │🟡Good  │🎯  │📖Rev  │📚  │ │
│ └────────┴─────┴──────┴───────┴────────┴─────┴───────┴──────┘ │
│                                                                 │
│ Column Specifications:
│ 1. TOPIC (sortable):
│    - Width: 200px
│    - Sortable: Click header to sort
│    - Default: Alphabetical
│    - Icon: Book symbol if needed
│    - Hover: Link color, underline
│
│ 2. % (sortable):
│    - Width: 80px
│    - Font: Bold, 20px
│    - Align: Right
│    - Sortable: Ascending/descending
│
│ 3. PROGRESS:
│    - Width: 120px
│    - Progress bar: Horizontal
│    - Fill: #3B82F6
│    - Track: #E5E7EB bg
│    - Height: 8px
│    - Border-radius: 4px
│    - Responsive to percentage
│
│ 4. TARGET:
│    - Width: 60px
│    - Font: 14px, #6B7280
│    - Target line: Visual indicator
│
│ 5. STATUS (badge):
│    - 🟢 Strong (80%+): #10B981 bg, white
│    - 🟡 Good (60-79%): #F59E0B bg, black
│    - 🟠 Needs Work (<60%): #EF4444 bg, white
│    - Size: 12px padding, rounded
│
│ 6. 🎯 (actions):
│    - Width: 40px
│    - Icon: Target/bullseye
│    - Click: Opens targeted practice
│    - Hover: Scale 1.1
│
│ 7. 📖 REV (actions):
│    - Width: 60px
│    - Icon: Book/eye
│    - Click: Opens review mode
│    - Hover: Scale 1.1
│
│ 8. 📚 (actions):
│    - Width: 40px
│    - Icon: Book/learning
│    - Click: Opens detailed view
│    - Hover: Scale 1.1
│
│ Footer:
│ "Dark = Mastery, Light = Target, Bar = Current"
│ - Caption: 12px, #6B7280
│ - Alignment: Left, below table
│ - Margin-top: 8px
└─────────────────────────────────────────────────────────────────┘
```

**Table Features:**

```
Sort Behavior:
- Click column header to toggle sort order
- Visual indicator: Arrow ↑ or ↓
- Default sort: Topic name (A-Z)
- Secondary sort: Percentage (high-low)

Row Hover:
- Background: #F9FAFB
- Shadow: Subtle increase
- Cursor: pointer

Row Click:
- Row highlights: 2px blue border
- Opens detailed view
- Shows concept breakdown

Responsive:
- Desktop: Full table visible
- Tablet: Scrollable horizontally
- Mobile: Card layout, each row = card
```

---

## Performance Distribution Chart

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 PERFORMANCE DISTRIBUTION                                      │
│                                                                 │
│ Histogram Chart (250px height):                                 │
│                                                                 │
│    85%  ┤              ██████████                                │
│    80%  ┤             ██████████                                │
│    75%  ┤            ██████████                                │
│    70%  ┤           ██████████                                │
│    65%  ┤          ██████████                                │
│    60%  ┤         ██████████                                │
│    55%  ┤        ██████████                                │
│    50%  ┤       ██████████                                │
│         └─────────────────────────────────────────────       │
│         Easy    Medium    Hard    Very Hard                    │
│                                                                 │
│ Chart Specifications:
│ - Type: Histogram with grouped bars
│ - Height: 250px
│ - Width: 100%
│ - Bars: 4 groups (by difficulty)
│ - Bars per group: 2 (current, target)
│ - Bar width: 40px each
│ - Bar colors:
│   Current: #3B82F6
│   Target: #10B981, 80% opacity
│ - Grid: Horizontal #E5E7EB, 1px
│ - X-axis: Easy, Medium, Hard, Very Hard
│ - Y-axis: 50%, 60%, 70%, 80%, 85%
│ - Legend: Below chart
│ - Avg badge: Top right, 72%
│ - Details below chart: Each difficulty avg
│
│ Legend:
│ ┌───┬──────────┬──────────┬──────────┐
│ │🔵│ Current  │🟢│ Target    │
│ │3B82F6│    10B981│
│ └───┴──────────┴──────────┴──────────┘
│
│ Hover:
│ - Bar scales 1.1
│ - Tooltip shows exact %
│ - Shows count of questions
└──────────────────────────────────────────────────────────────┘
```

**Chart Statistics:**

```
Quick Stats:
┌────────────────────────────────────────────────────────────────┐
│ Average Accuracy: 72%                                          │
│ Easy: 89% ██████████████████████                               │
│ Medium: 71% ████████████████                                   │
│ Hard: 58% ██████████                                          │
│ Very Hard: 45% █████████                                      │
│                                                                 │
│ Stat Cards:
│ - Background: #F9FAFB
│ - Border-radius: 8px
│ - Padding: 12px
│ - Margin: 4px
│ - Font: 14px
│ - Bar: 4px height, proportional
└────────────────────────────────────────────────────────────────┘
```

---

## Interactive Features

### Filter Controls

```
Time Range Filter:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ [All Time ▼] │[Last 30 Days]│ [Last 7 Days] │ [Custom] │
└─────────────┴─────────────┴─────────────┴─────────────┘
- Active tab: #3B82F6 bg, white text
- Inactive: #F3F4F6 bg, dark text
- Dropdown: Date range picker
- Button height: 40px

Concept Filter:
┌──────────────────────────────────────────────────────────────┐
│ [🎯 Filter Concepts] [Show All] [Only Weak Areas]            │
│ Concepts: [☑️ All Concepts] [Atomic] [Chemical] [Electron]   │
└──────────────────────────────────────────────────────────────┘
```

### Export Functionality

```
Export Options:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ [📥 Export] │[📊 PDF]│ [📄 Excel]│[📝 CSV]│[📧 Email]│
└─────────────┴─────────────┴─────────────┴─────────────┘
- Primary: #3B82F6, white text
- Secondary: Outline style
- Dropdown: Multiple export formats
- Icons: Download symbol
```

---

## Responsive Behavior

### Desktop (>1024px)

```
Full analytics dashboard:
- Charts: All details visible
- Tables: All columns, sortable
- Filters: All options available
- Export: All formats
- Spacing: 24px gaps
```

### Tablet (768px - 1024px)

```
Adapted layout:
- Charts: Simplified tooltips
- Tables: Scrollable horizontally
- Filters: Collapsible sections
- Export: Compact dropdown
```

### Mobile (<768px)

```
Single column:
- Charts: Simplified, tap to expand
- Tables: Card-based layout
- Filters: Vertical stack
- Export: Single button, menu on click
```

---

## Animation & Interaction

```
Chart Animations:
- Initial load: Bars grow from bottom (300ms)
- Line charts: Points appear sequentially (200ms each)
- Hover: Scale 1.05, tooltip fade in (150ms)
- Click: Card expands (250ms, ease-in-out)

Scroll Behavior:
- Smooth scroll: 300ms
- Sticky header: Shows on scroll
- Loading state: Skeleton loader

Loading States:
- Charts: Shimmer animation
- Tables: Row-by-row appearance
- Stats: Count up animation
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component implementation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
