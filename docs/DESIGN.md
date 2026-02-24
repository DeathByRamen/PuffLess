# PuffLess -- Design Document

## Understanding Summary

- **What:** PuffLess is a SwiftUI iOS app that provides a comprehensive, multi-method toolkit for quitting vaping/nicotine.
- **Why:** Most quit-vaping apps offer only one approach. PuffLess lets users combine methods (gradual reduction, behavioral/habit replacement, cold turkey, NRT tracking, gamification) based on what works for them.
- **Who:** Anyone who vapes and wants to reduce or quit -- broad demographic, approachable design.
- **Data:** Local-first with optional iCloud sync via SwiftData + CloudKit.
- **Monetization:** $2.99 one-time purchase. No ads, no subscriptions, no IAP.
- **Key integrations:** Apple HealthKit (read-only), configurable push notifications, home screen widgets.
- **Platform:** iOS 17+, SwiftUI, Swift 5.9+.

## Assumptions

- **A1:** v1 targets iPhone only (no iPad/Watch optimization).
- **A2:** iCloud sync via SwiftData's built-in CloudKit integration (no custom backend).
- **A3:** No social/community features in v1.
- **A4:** No medical advice or FDA-regulated claims -- the app is a self-tracking tool.
- **A5:** Widgets are a high-value feature for quick logging and goal visibility.
- **A6:** No Apple Watch companion app in v1.

## Non-Goals (v1)

- No telehealth/doctor integration.
- No prescription tracking (Chantix, etc.).
- No social sharing or community features.
- No Android version.

---

## Architecture: Modular Quit Plan

The user picks a primary quit method during onboarding, and the app assembles a personalized plan from modular components. Methods aren't siloed -- they layer together.

Example:

```
User selects: "Gradual Reduction" (primary)
App auto-suggests: + Behavioral triggers tracking
                   + Gamification streaks
User optionally adds: + NRT tracking
```

Each module is independently buildable, testable, and can be added later without refactoring.

---

## Navigation & App Structure

### Tab Bar (4 tabs)

| Tab | Purpose |
|---|---|
| **Today** | Daily dashboard -- quick-log puffs, see today's goal, craving button, motivational card |
| **Progress** | Charts, streaks, health milestones, money saved, HealthKit correlations |
| **Plan** | Active quit plan -- modules enabled, schedule, NRT log, behavioral triggers |
| **Settings** | Profile, notification preferences, iCloud sync toggle, export data |

### Onboarding Flow (first launch)

1. Welcome screen -- "How do you vape?" (disposable, pod system, mod, other)
2. Current usage -- estimated puffs/day, nicotine strength (mg)
3. Pick your method -- present quit methods as cards, user selects primary + optional add-ons
4. Set a target -- "When do you want to be nicotine-free?" (30/60/90 days or custom)
5. App generates a personalized plan with weekly milestones

---

## Quit Method Modules

### Gradual Reduction (core)

- App calculates a step-down schedule based on starting puffs/day and target quit date.
- Weekly puff goal decreases (e.g., 20 > 17 > 14 > 11 > 8 > 5 > 2 > 0).
- Option to also step down nicotine strength (e.g., 50mg > 35mg > 20mg > 0mg).
- Daily goal shown prominently on the Today tab.

### Behavioral / Trigger Tracking (core)

- When logging a craving, the user tags the trigger (stress, boredom, social, etc.).
- Over time, the app surfaces patterns: "80% of your cravings happen when you're bored at work."
- Suggests alternative actions based on trigger type (breathing exercise for stress, walk for boredom, fidget toy for habit).
- Small library of 2-minute exercises (box breathing, 5-4-3-2-1 grounding, cold water on wrists).

### Cold Turkey Mode (core)

- User picks a quit date, app counts down to it.
- After quit date: tracks hours/days since last puff.
- Withdrawal timeline: "Day 3 -- nicotine is leaving your body. Irritability peaks now but fades soon."
- Health recovery milestones on a visual timeline (20 min: heart rate drops, 48 hrs: taste returns, 1 month: lung function improves).

### NRT Tracking (core)

- Simple log: what NRT product, what dosage, when.
- Helps users see their total nicotine intake (vape + NRT combined) declining over time.
- Optional step-down schedule for NRT itself.

### Gamification (core)

- Daily streaks, milestone badges (first day under goal, first puff-free day, 7-day streak, $100 saved).
- Detailed achievement system, weekly challenges.
- Progress sharing cards (personalized shareable images with stats for social media).

---

## Notification & Encouragement System

### Daily (scheduled, user-configurable)

- Morning check-in: "Good morning. Yesterday you hit your goal -- 12 puffs, down from 15. Keep it going."
- Evening log reminder (only if they haven't logged today): "How did today go? Tap to log."

### Smart Nudges (context-aware)

- **Craving pattern nudges:** If the user consistently logs cravings at 3pm, the app sends a preemptive nudge at 2:45pm: "Afternoon craving incoming? Try a 2-minute breathing exercise instead."
- **Milestone celebrations:** Triggered when the user hits a streak, passes a health milestone, or saves a money threshold. "You just saved $50 by vaping less. That's a nice dinner."
- **Gentle re-engagement:** If the user hasn't opened the app in 2-3 days: "No pressure. Just checking in. Your streak is still alive."

### Anti-Annoyance Rules

- Max 2 push notifications per day (hard cap).
- No notifications between 10pm-8am (or user-defined quiet hours).
- If the user dismisses 3 notifications in a row without opening, reduce frequency automatically.
- User can set their preference: "Encourage me often" / "Just the essentials" / "Only milestones."
- Tone: warm, brief, non-judgmental. Never guilt-tripping.

---

## Data Model

### UserProfile

- Vape device type, starting nicotine level (mg), starting puffs/day.
- Quit method(s) selected, target quit date.
- Notification preferences.

### DailyLog (one per day)

- Date, puff count, nicotine strength used.
- Goal for the day (auto-generated from plan), whether goal was met.
- Mood rating (1-5), notes (optional free text).

### Craving (many per day)

- Timestamp, intensity (1-5).
- Trigger tag (stress, social, boredom, habit, after meal, other).
- Action taken: vaped / resisted / used NRT / did breathing exercise / other.
- Duration (how long the craving lasted).

### NRTEntry (optional)

- Date, type (patch, gum, lozenge, other), dosage.

### Milestone

- Type: health (lung function, circulation, taste/smell), financial (money saved), streak (days under goal, puff-free days).
- Date unlocked, whether user was notified.

### QuitPlan

- Method(s) active, start date, target end date.
- Weekly targets (array of puff goals that step down over time).
- Current week number.

### Persistence

All data stored locally using **SwiftData** (iOS 17+). iCloud sync handled via SwiftData's built-in CloudKit integration. No custom backend required.

---

## HealthKit Integration

### Reads (with user permission)

| Data Point | Purpose |
|---|---|
| Resting heart rate | Show recovery: "Your resting heart rate dropped 4bpm since you started reducing" |
| Sleep duration & quality | Correlate: "You vape less on days you sleep 7+ hours" |
| Step count / activity | Correlate: "Active days = 40% fewer cravings for you" |

### Writes

None. PuffLess is read-only for HealthKit.

### Behavior

- Progress tab shows a "Health Insights" card with correlations after 7+ days of data.
- Simple, non-medical language: trends and patterns, never diagnoses.
- If user denies HealthKit permission, the card simply doesn't appear.

---

## iOS Widget (WidgetKit)

### Small Widget (2x2)

- Today's puff count vs goal (e.g., "4 / 12").
- Streak counter ("Day 14").
- Tap opens directly to the quick-log screen.

### Medium Widget (4x2)

- Same as small, plus a mini 7-day bar chart of puffs.
- Current money saved.

Data shared between app and widget via App Groups.

---

## Revenue Model

| Item | Price |
|---|---|
| PuffLess (full app) | $2.99 one-time |

No ads. No subscriptions. No IAP. No ad SDK. Marketing angle: "Costs less than one pod. Helps you quit all of them."

---

## Testing Strategy

| Layer | Approach |
|---|---|
| Data model | Unit tests on QuitPlan generation (given X puffs/day and Y target date, verify step-down schedule) |
| Craving patterns | Unit tests on trigger analysis logic (given N cravings with tags, verify correct pattern output) |
| Notifications | Manual testing on device (push notifications can't be simulated in previews) |
| HealthKit | Manual testing on physical device (HealthKit unavailable in simulator) |
| UI | SwiftUI previews for all views, plus snapshot tests for key screens |

---

## Decision Log

| # | Decision | Alternatives Considered | Why Chosen |
|---|---|---|---|
| D1 | Modular Quit Plan architecture | Linear pre-built programs; fully open toolkit | Balances personalization with guidance; maps to SwiftUI composable design; easy to extend |
| D2 | All quit methods available | Subset of methods | User wants comprehensive toolkit; modular architecture makes this manageable |
| D3 | $2.99 one-time purchase, no ads | Freemium; ad-supported; rewarded ads | Cleanest UX for health app; simplest codebase; no ad SDK bloat |
| D4 | Local-first with optional iCloud sync | Local only; custom backend | No server costs; Apple handles sync; SwiftData has built-in CloudKit support |
| D5 | Tab-based navigation (4 tabs) | Single-page scroll; sidebar | iOS standard for 4-5 sections; familiar and fast |
| D6 | Smart nudges + scheduled check-ins, max 2/day | Aggressive notifications; no notifications | Supportive without annoying; adapts to user behavior |
| D7 | HealthKit read-only | Read + write; no HealthKit | Enables correlations; read-only avoids complexity; graceful fallback if denied |
| D8 | Home screen widget (small + medium) | No widget; Live Activities | Keeps daily goal visible; high engagement driver |
| D9 | SwiftData for persistence | Core Data; SQLite; Realm | Apple's modern framework; native SwiftUI integration; built-in CloudKit sync |
| D10 | iOS 17+ only | Supporting iOS 16 | SwiftData requires iOS 17; avoids legacy workarounds |
