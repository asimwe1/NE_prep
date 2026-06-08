# Changes

This file tracks project changes made during the official mobile exam build.

Use **`YYYY-MM-DD HH:MM`** (local time) on every entry so multiple phases on the same day stay distinguishable. Date-only headings are not used here.

## 2026-06-08 09:55 - asimwe001

- Created the official Dictionary Mobile App scaffold under `mobile/exam/official/dictionary-mobile-app/`.
- Added Expo/React Native/TypeScript project structure based on the existing mobile Expo template.
- Added typed Dictionary API service, search screen, result rendering components, and pronunciation control scaffold.
- Added tracked exam planning docs: `design.md`, `tasks.md`, and `changes.md`.
- Added mobile `.gitignore` rules so local `AGENTS.md`, `.agents/`, and `.claude/` files are not tracked.
- Confirmed the app is running locally on port `8082` per user report.

## 2026-06-08 10:04 - asimwe001

- Completed Activity 3 pronunciation audio requirements.
- Added `expo-audio` for in-app pronunciation playback.
- Replaced external audio URL opening with play, pause, stop, loading, and reset behavior.
- Added support for multiple pronunciation audio URLs with a next-audio control.
- Updated `tasks.md` to mark Activity 3 audio requirements complete.

## 2026-06-08 10:07 - asimwe001

- Improved pronunciation audio selection to show accent labels such as `AU` and `US`.
- Derived accent labels from Dictionary API pronunciation audio filenames.
- Replaced generic next-audio selection with selectable accent chips.
- Preserved selected-accent playback controls for play, pause, and stop.

## 2026-06-08 10:12 - asimwe001

- Fixed pronunciation playback so audio plays once and waits for another user press instead of looping.
- Lifted selected pronunciation accent state to the search screen.
- Updated the displayed phonetic text to match the selected accent when the API provides accent-specific phonetics.

## 2026-06-08 10:18 - asimwe001

- Completed Activity 4 drawer navigation and search history requirements.
- Added a drawer-style history panel with successful search entries.
- Added duplicate history handling so repeated words move to the latest position.
- Added tap-to-search behavior from history items.
- Improved Activity 5 error handling with explicit network and malformed-response messages.
- Updated `tasks.md` to mark API integration, drawer history, axios usage, and offline feedback items complete.

## 2026-06-08 10:27 - asimwe001

- Added tracked `CODEBASE.md` maintainer guide.
- Documented the application structure, state flow, API layer, audio logic, history drawer behavior, styling rules, and verification commands.
- Documented change-tracking expectations for future implementation phases.

## 2026-06-08 11:12 - asimwe001

- Polished the single-screen UI for a cleaner iOS-friendly layout with safe-area header and history access.
- Applied Apple Human Interface Guidelines: iOS semantic light/dark tokens, `AppText` typography, 44pt touch targets, and VoiceOver labels.
- Fixed Android emulator layout where search UI was missing below the header (`ScrollView` + explicit `flex: 1`).
- Hardened cross-platform UI reliability: moved iOS tokens and theme hook under `src/utils/`, rgb fallbacks for native color props, and removed fragile `@/constants` / `@/hooks` Metro import paths.
- Committed and pushed as `asimwe001` on `master`.

## 2026-06-08 11:35 - asimwe001

- Fixed web console errors for decorative Lucide icons passing React Native-only accessibility props to the DOM.
- Added `getDecorativeIconA11yProps()` to use `aria-hidden` on web and native accessibility props on iOS/Android.
