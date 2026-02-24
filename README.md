# PuffLess

A React Native (Expo) app to help you gradually reduce and quit vaping by tracking your usage, setting reduction goals, and monitoring your progress over time.

## Features

- **Modular quit plan** -- choose your methods (gradual reduction, trigger tracking, cold turkey, NRT, gamification) and the app builds a personalized step-down schedule
- **Daily puff tracking** with goals and progress visualization
- **Craving logger** with trigger identification and coping suggestions
- **Progress dashboard** with 7-day charts, craving pattern analysis, health milestones, and money saved
- **NRT tracking** for patches, gum, lozenges alongside vape reduction
- **Smart notifications** with anti-annoyance rules (max 2/day, quiet hours, auto-throttle)
- **Data export** to CSV

## Requirements

- Node.js 18+
- Expo CLI
- iOS or Android device/emulator (or Expo Go app)

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` to open in web browser.

## Project Structure

```
src/
  models/       -- TypeScript types for all data models
  services/     -- Storage (AsyncStorage), plan generator, notifications
  hooks/        -- useAppData hook for global state
  screens/      -- Onboarding, Today, Progress, Plan, Settings
  components/   -- Reusable UI (Slider, QuickLogModal, CravingLogModal)
  constants/    -- Theme colors, spacing, static data
```

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- AsyncStorage for local persistence
- React Navigation (bottom tabs)

## Design Document

See [docs/DESIGN.md](docs/DESIGN.md) for the full architecture, data model, and decision log.
