# Profile Page - Detailed Design

**Page:** User Profile  
**Version:** 1.0  
**Date:** 2026-04-09

---

## Page Structure Overview

```
┌───────────────────────────────────────────────────────┬─────┬─────┬─────┐
│ PROFILE                                               │ 🔔│ ⚙️│ 👤 │
├───────────────────────┬──────────────────────────────┼─────┼─────┼─────┤
│ 👤  JENNIFER CHEN     │ 📊 OVERVIEW                 │ 🔔│ ⚙️│ 👤 │
│ jennifer@eva9.ai     │                              │ 🔔│ ⚙️│ 👤 │
│                      │ ┌──────────────────────────┐ │    │    │    │
│ [✏️ Edit Profile]   │ │ Total Learning: 45h 32m │ │    │    │    │
│ [🔑 Change Pass]     │ │ Sessions: 127            │ │    │    │    │
│ [📊 View Settings]   │ │ Mastery: 72%             │ │    │    │    │
│                      │ │ Streak: 14 days          │ │    │    │    │
│                      │ └──────────────────────────┘ │    │    │    │
│ ───────────────────┤                            │    │    │    │
│                      │ 📈 LEARNING STATISTICS        │    │    │    │
│ 📊 LEARNING STATS   │                              │    │    │    │
│ ┌─────────────────┐ │ ┌──────────────────────────┐ │    │    │    │
│ │ Current Plan:   │ │ │ This Week                │ │    │    │    │
│ │   🟢 Premium    │ │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│ │   $12.99/mo     │ │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│ │   4 sessions    │ │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│ │   Left: 4       │ │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│ │   Renew: 5d     │ │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│ └─────────────────┘ │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│                      │ │ ██████░░░░░░░░░░░░░░    │ │    │    │    │
│ 📚 MY LEARNING      │ │ Mon   Tue   Wed   Thu    │ │    │    │    │
│ ┌─────────────────┐ │ │                         │    │    │    │
│ │ 📚 Atomic       │ │ │ Today: 45 min           │    │    │    │
│ │    Structure    │ │ │ Avg: 38 min/day        │    │    │    │
│ │    ⭐⭐⭐⭐☆   │ │ └──────────────────────────┘ │    │    │    │
│ │    67% Mastery  │ │                          │    │    │    │
│ │    Last: 2h ago │ │                          │    │    │    │
│ ├─────────────────┤ │ 🎯 RECENT ACTIVITY         │    │    │    │
│ │ 📚 Chemical     │ │                          │    │    │    │
│ │    Bonds       │ │ ┌──────────────────────────┐ │    │    │    │
│ │    ⭐⭐⭐⭐⭐   │ │ │ ✅ Quiz: Atomic Struc.   │ │    │    │    │
│ │    92% Mastery  │ │ │   4/5 (80%)            │ │    │    │    │
│ │    Last: 1d ago │ │ │ 📚 Lesson: Chemical Bond │ │    │    │    │
│ ├─────────────────┤ │ │   Completed (32m)      │ │    │    │    │
│ │ 📚 Electron     │ │ │ 🎯 Practice: VSEPR     │ │    │    │    │
│ │    Configuration│ │ │   2/4 correct          │ │    │    │    │
│ │    ⭐⭐⭐⭐☆   │ │ └──────────────────────────┘ │    │    │    │
│ │    58% Mastery  │ │                          │    │    │    │
│ │    Last: 3d ago │ │                          │    │    │    │
│ └─────────────────┘ │ 🎯 RECENT ACTIVITY         │    │    │    │
│                      │ ┌──────────────────────────┐ │    │    │    │
│ 🏆 ACHIEVEMENTS      │ │ • Streak: 14 days      │ │    │    │    │
│                      │ │ • Total: 127 sessions  │ │    │    │    │
│ ┌──────┬──────┬───┐ │ │ • Best: 80% quiz       │ │    │    │    │
│ │ 🔥 14 ││ 🏆 45 ││ ⭐️│ │ │ • Mastered: 12       │ │    │    │    │
│ │  Day ││ Top  ││ 50 │ │ └──────────────────────────┘ │    │    │    │
│ │   👍 ││ List ││  Qs│ │                          │    │    │    │
│ └──────┴──────┴───┘ │ 🎯 RECENT ACTIVITY         │    │    │    │
│                      │                          │    │    │    │
│ 📢 NOTIFICATIONS     │                          │    │    │    │
│ ┌─────────────────┐ │                          │    │    │    │
│ │ [✓] Email Alerts│ │                          │    │    │    │
│ │ [✓] Daily Tips  │ │                          │    │    │    │
│ │ [✓] Progress    │ │                          │    │    │    │
│ │ [✓] Streak      │ │                          │    │    │    │
│ │ [✓] Weekly      │ │                          │    │    │    │
│ └─────────────────┘ │                          │    │    │    │
├──────────────────────┴──────────────────────────────┴─────┴─────┴─────┘
```

---

## Profile Header

```
┌──────────────────────────────────────────────────┬─────┬─────┬─────┐
│ [📷 Profile Pic]  Jennifer Chen                 │ 🔔  │ ⚙️  │ 👤  │
│ jennifer@eva9.ai                              │ 🔔  │ ⚙️  │ 👤  │
│ [✏️ Edit Profile]                            │ 🔔  │ ⚙️  │ 👤  │
│ [🔑 Change Password]                          │ 🔔  │ ⚙️  │ 👤  │
│ [📊 View Settings]                            │ 🔔  │ ⚙️  │ 👤  │
└──────────────────────────────────────────────────┴─────┴─────┴─────┘
```

**Header Specifications:**

```
Profile Picture:
- Avatar circle, 80px diameter
- Default: Blue gradient with initials
- User uploaded: Photo or avatar
- Click: Opens upload/edit modal

Name Section:
- Display name: "Jennifer Chen" (H2, 24px, bold, #111827)
- Email: "jennifer@eva9.ai" (14px, #6B7280)
- Gap: 4px between lines

Action Buttons:
- [✏️ Edit Profile] - Primary, #3B82F6 bg
- [🔑 Change Password] - Secondary, outline
- [📊 View Settings] - Tertiary, icon only
- All 40px height, 180px width
- Margin-top: 16px

Header Actions:
- 🔔 Notifications: Bell icon with badge
- ⚙️ Settings: Gear icon
- 👤 User Menu: Avatar dropdown
- All 24px, right aligned
```

---

## Overview Cards

```
Overview Stats:
┌─┬──────────────────────────────────────────────┬┐
│ │ Total Learning: 45h 32m                      ││
│ │ Sessions: 127 | Mastery: 72% | Streak: 14d ││
└─┴──────────────────────────────────────────────┴┘

┌─┬──────────────────────────────────────────────┬┐
│ │ 🟢 Premium Plan                              ││
│ │ $12.99/mo | 4 sessions left | Renew: 5d     ││
└─┴──────────────────────────────────────────────┴┘
```

**Statistics Cards:**

```
Total Learning Card:
- Label: "Total Learning" (14px, #6B7280)
- Value: "45h 32m" (32px, bold, #111827)
- Icon: 📚, left aligned
- Padding: 16px
- Background: #F9FAFB
- Border-radius: 8px

Quick Stats Card:
- Sessions: 127 (16px, #374151)
- Mastery: 72% (16px, bold, #10B981)
- Streak: 14 days (16px, #F59E0B)
- Icons: 📊, 📈, 🔥
- Grid: 3 columns (responsive: stacked)

Subscription Card:
- Status: 🟢 Premium (green badge)
- Price: $12.99/mo (16px, bold)
- Sessions: 4 left (14px)
- Renewal: 5 days remaining (14px)
- Button: [Manage Plan] secondary style
```

---

## Learning Statistics

```
Weekly Activity Chart:
┌─────────────────────────────────────────────┬───┐
│ This Week                                  │   │
│ ┌────────────────────────────────────────┐ │   │
│ │ Mon ████████░░░░░░░░░░░░░░░░░░░░░   │ │   │
│ │ Tue ████████░░░░░░░░░░░░░░░░░░░░░   │ │   │
│ │ Wed ██████████████░░░░░░░░░░░░░░░   │ │   │
│ │ Thu ██████████████████░░░░░░░░░   │ │   │
│ │ Fri ██████████████████░░░░░░░░░   │ │   │
│ │ Sat ██████████████░░░░░░░░░░░░░   │ │   │
│ │ Sun ██████████████████░░░░░░░   │ │   │
│ └────────────────────────────────────────┘ │   │
│                                            │   │
│ Today: 45 min                              │   │
│ Avg: 38 min/day                            │   │
└─────────────────────────────────────────────┴───┘
```

**Chart Specifications:**

```
Weekly Activity:
- Type: Horizontal bar chart
- Height: 150px
- Each bar: Day label + progress bar
- Bar fill: #3B82F6, 75% opacity
- Bar bg: #E5E7EB
- Max: 60 minutes scale
- Label: Left aligned, 14px

Today Summary:
- "Today: 45 min" (16px, bold, #111827)
- "Avg: 38 min/day" (14px, #6B7280)
- Comparison: "+12% vs avg" (green, 14px)
- Margin-top: 8px

Legend:
- Minutes scale below chart
- Color gradient: Low (green) → High (red)
```

---

## Recent Learning Activity

```
Activity List:
┌─┬──────────────────────────────────────────────┬┐
│ ✅ Quiz: Atomic Structure                    ││
│    Score: 4/5 (80%) | 8 min                 ││
│    [📊 View Details]                         ││
├─┬──────────────────────────────────────────────┬┤
│ 📚 Lesson: Chemical Bonds                    ││
│    Completed (32 min) | Last: 1 day ago      ││
│    Topics: 3/3 mastered | Mastery: +2%       ││
├─┬──────────────────────────────────────────────┬┤
│ 🎯 Practice: VSEPR Theory                    ││
│    2/4 correct | 12 min | 50% success        ││
│    [🎯 Retry Practice] [📚 Review Topic]     ││
└─┬──────────────────────────────────────────────┴┘
```

**Activity Item:**

```
Quiz Activity:
- Icon: ✅ Green checkmark
- Title: "Quiz: Atomic Structure" (bold)
- Score: "4/5 (80%)" (green, bold)
- Duration: "8 min" (gray)
- Button: "View Details" link style

Lesson Activity:
- Icon: 📚 Blue book
- Title: "Lesson: Chemical Bonds" (bold)
- Completion: "32 min"
- Timestamp: "1 day ago"
- Mastery change: "+2%" (green)

Practice Activity:
- Icon: 🎯 Orange target
- Results: "2/4 correct, 50% success"
- Duration: "12 min"
- Actions: "Retry Practice" + "Review Topic"
- Both 40px height
```

---

## Achievements Section

```
Achievements Grid:
┌───┬───┬───┐
│🔥14│🏆45│⭐️50│
│Day│Top│Qs │
│ 👍│List│   │
├───┼───┼───┤
│🎯5 │📊2 │🔥3 │
│Streak│📊2│🔥3│
│   │   │   │
├───┼───┼───┤
│📚4│🎓3│💎2│
│Less│Cert│💎│
│   │   │   │
└───┴───┴───┘
```

**Achievement Cards:**

```
Streak Badge:
- Icon: 🔥 Fire
- Count: "14" (bold, large)
- Label: "Day Streak" (small)
- Color: Orange gradient
- Tooltip: "Current streak: 14 days"

Top Learner Badge:
- Icon: 🏆 Trophy
- Count: "45"
- Label: "Top List"
- Color: Gold gradient
- Tooltip: "In top 10% of learners"

Questions Mastered:
- Icon: ⭐️ Star
- Count: "50"
- Label: "Qs Mastered"
- Color: Blue gradient
- Tooltip: "50 questions answered correctly"

All Badges:
- Grid: 3 columns (responsive: 2, then 1)
- Size: 80px diameter
- Animated: Pulse on hover
- Click: Shows badge details modal
```

---

## Subscription Information

```
Subscription Details:
┌─┬──────────────────────────────────────────────┬┐
│ 🟢 Premium Plan                              ││
│ ───────────────────────────────────────────  ││
│ • $12.99 per month                          ││
│ • 4 sessions per month                      ││
│ • 4 sessions remaining                      ││
│ • Renewal date: April 14, 2026 (5 days left)││
│                                             ││
│ [📊 View Subscription Details]              ││
│ [💳 Change Payment Method]                  ││
│ [⬇️ Download Invoice]                       ││
└─┴──────────────────────────────────────────────┴┘
```

**Subscription Card:**

```
Status Badge:
- 🟢 Green circle with "Premium" text
- Rounded, green border
- Height: 24px

Plan Details:
- Price: $12.99/mo (16px, bold)
- Sessions: 4 total (14px)
- Remaining: 4 left (14px, green)
- Renewal: 5 days remaining (14px, amber)

Action Buttons:
- [📊 View Details] - Primary
- [💳 Change Payment] - Secondary
- [⬇️ Download Invoice] - Tertiary
- All 40px height
```

---

## Notification Settings

```
Notification Toggles:
┌───┬──────────────────────────────────────────────┐
│ [✓] 📧 Email Alerts                            │
│     Receive weekly summaries and progress      │
│                                              │
│ [✓] 💬 Daily Tips                              │
│     Get daily learning motivation and tips    │
│                                              │
│ [✓] 📊 Progress Updates                        │
│     Notifications when you reach milestones   │
│                                              │
│ [✓] 🔥 Streak Alerts                           │
│     Reminders to maintain learning streak     │
│                                              │
│ [✓] 📅 Weekly Summary                          │
│     Detailed weekly learning report           │
│                                              │
│ [✓] 🎯 Achievement Notifications               │
│     Celebrate when you earn badges            │
└───┴──────────────────────────────────────────────┘
```

**Toggle Specifications:**

```
Each Notification:
- Checkbox: 20px × 20px, checked/unchecked
- Icon: Email, lightbulb, chart, fire, calendar, trophy
- Title: Bold, 16px, #111827
- Description: Regular, 14px, #6B7280
- Toggle switch: Green when enabled
- Spacing: 16px between items

Behavior:
- Click: Toggles notification on/off
- Visual feedback: Green toggle when enabled
- Save automatically: No save button needed
- Confirmation: Brief toast message on change
```

---

## Edit Profile Modal

```
Edit Profile Modal:
┌───────────────────────────────────────────────┬──────────┐
│ ✏️ Edit Your Profile                     [❌]  │          │
├───────────────────────────────────────────────┴──────────┤
│                                                          │
│ Profile Picture:                                       │
│ ┌────────────────────────────┐                         │
│ │      [📷 Upload New]      │                         │
│ │                            │                         │
│ │      [Current Avatar]      │                         │
│ └────────────────────────────┘                         │
│                                                          │
│ Full Name:                                             │
│ [_Jennifer__________________________________]         │
│                                                          │
│ Email Address:                                         │
│ [_jennifer@eva9.ai__________________________]         │
│                                                          │
│ Display Name (optional):                               │
│ [_Jennifer C__________________________________]       │
│                                                          │
│ Bio (optional):                                        │
│ [_Motivated learner interested in science and learning │
│ _strategies. Love exploring AI-powered education.  _]  │
│ [_                                                     _]  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ [Cancel] [Save Changes]                                   │
└───────────────────────────────────────────────────────────┘
```

**Form Specifications:**

```
Modal Container:
- Width: 600px
- Background: #FFFFFF
- Border-radius: 12px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Max-height: 80vh, scrollable

Profile Picture Upload:
- Square area, 120px × 120px
- Default: Circular gradient with initials
- Upload button: Dashed border, blue
- Current avatar: Display in circle
- Click: Opens file picker

Form Fields:
- Label: Bold, 14px
- Input: 44px height, rounded
- Placeholder: Gray text
- Error state: Red border, error message
- Success: Green border briefly

Textarea:
- 3 rows, resizable
- Auto-expand to content
- Max 200 words limit
- Character counter: Bottom right

Buttons:
- [Cancel]: Secondary, outline
- [Save Changes]: Primary, green
- All 40px height, 160px width
```

---

## Change Password Modal

```
Change Password Modal:
┌───────────────────────────────────────────────┬──────────┐
│ 🔐 Change Password                       [❌]  │          │
├───────────────────────────────────────────────┴──────────┤
│                                                          │
│ Current Password:                                        │
│ [________________________] [👁️ Show]                   │
│                                                          │
│ New Password:                                            │
│ [________________________] [👁️ Show]                   │
│                                                          │
│ Confirm New Password:                                    │
│ [________________________] [👁️ Show]                   │
│                                                          │
│ Password Requirements:                                   │
│ ✓ At least 8 characters                                    │
│ ✗ Contains uppercase letter                                │
│ ✗ Contains number                                          │
│ ✗ Contains special character                             │
│                                                          │
│ [❌ Cancel] [Change Password]                             │
└───────────────────────────────────────────────────────────┘
```

**Password Form:**

```
Password Fields:
- Each field: Input + show/hide toggle
- Icons: 🔓 lock, 👁️ eye
- Real-time validation: Green checkmarks appear
- Password strength meter: Bar below fields

Strength Meter:
- Length: 100px
- Color: Gray → Red → Yellow → Green
- Labels: Weak, Fair, Good, Strong

Validation Rules:
- Length ≥ 8 characters (required)
- Uppercase letter (required)
- Number (required)
- Special character (required)
- All shown as checklist items
- Green ✓ when met, ✗ when not

Error Handling:
- Weak password: Warning icon
- Mismatch: Red border, error text
- Too weak: "Password too weak" message
```

---

## Settings Navigation

```
Settings Menu:
┌───────────────────────────────────────────────┐
│ ⚙️ Settings                                 │
│ ────────────────────────────────────────────  │
│                                               │
│ 👤 Profile & Account                        │
│ ├─ [✏️ Edit Profile]                        │
│ ├─ [🔑 Change Password]                     │
│ └─ [👤 View My Account]                     │
│                                               │
│ 📊 Learning Settings                        │
│ ├─ [🎯 Set Learning Goals]                  │
│ ├─ [⏰ Study Time Preferences]              │
│ ├─ [📚 Default Lesson Type]                 │
│ └─ [🎯 Mastery Level Target]                │
│                                               │
│ 🔔 Notifications                            │
│ ├─ [📧 Email Alerts]                        │
│ ├─ [📱 Push Notifications]                  │
│ └─ [📅 Reminders]                           │
│                                               │
│ 🔒 Privacy & Security                       │
│ ├─ [🔐 Account Security]                    │
│ ├─ [📥 Export My Data]                      │
│ └─ [🗑️ Delete Account]                      │
│                                               │
│ 🎨 Appearance                               │
│ ├─ [🌓 Theme Settings]                      │
│ ├─ [🎨 Color Scheme]                        │
│ └─ [📱 Font Size]                           │
└───────────────────────────────────────────────┘
```

**Menu Specifications:**

```
Menu Structure:
- Section headers: Bold, 18px, #111827
- Links: Blue, 14px, clickable
- Icons: Left aligned, 16px
- Arrow: Right side for nested menus
- Active: #DBEAFE bg, #1E40AF text

Link Items:
- Height: 48px
- Padding: 12px 16px
- Hover: #F9FAFB bg
- Icon: 16px, color-coded by section

Responsive:
- Desktop: Collapsible accordion
- Tablet: Expandable sections
- Mobile: Full-screen menu
```

---

## Responsive Behavior

### Desktop (>1024px)
```
Full profile layout:
- Sidebar: Left navigation
- Main: Profile content
- All sections visible
- Charts: Full size
```

### Tablet (768px - 1024px)
```
Adapted layout:
- Sidebar: Collapsible
- Charts: Smaller
- Modal: Centered, smaller
```

### Mobile (<768px)
```
Stacked layout:
- Sidebar: Bottom navigation
- Charts: Simplified
- All modals: Full-screen
- One section at a time
```

---

## Accessibility

```
Screen Reader Support:
- All buttons labeled
- Section headings announced
- Form field labels clear
- Error messages announced

Keyboard Navigation:
- Tab through all sections
- Arrow keys in accordions
- Enter/Space to activate
- Escape to close modals
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Next Review:** After component implementation

**Designer:** Eva2 AI Guardian  
**Approved By:** Jacky Chen (Master)
