# Changelog

All notable changes to PuffLess will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Project scaffolding: SwiftUI app entry point (`PuffLessApp.swift`), initial `ContentView`.
- Design document (`docs/DESIGN.md`) covering architecture, data model, quit method modules, notification system, HealthKit integration, widget design, revenue model, and full decision log.
- `.gitignore` for Swift/Xcode projects.
- Integrated antigravity-awesome-skills for AI-assisted development (`.cursor/skills/`).

### Decided
- Modular Quit Plan architecture: users pick quit methods, app assembles a layered plan.
- Five quit modules: Gradual Reduction, Behavioral/Trigger Tracking, Cold Turkey, NRT Tracking, Gamification.
- $2.99 one-time purchase, no ads, no subscriptions.
- SwiftData for local persistence with optional iCloud sync via CloudKit.
- HealthKit read-only integration (heart rate, sleep, steps).
- Home screen widgets via WidgetKit (small + medium).
- iOS 17+ target.
