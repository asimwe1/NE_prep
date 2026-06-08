# Changes

This file tracks project changes made during the official mobile exam build.

## 2026-06-08 - asimwe001

- Created the official Dictionary Mobile App scaffold under `mobile/exam/official/dictionary-mobile-app/`.
- Added Expo/React Native/TypeScript project structure based on the existing mobile Expo template.
- Added typed Dictionary API service, search screen, result rendering components, and pronunciation control scaffold.
- Added tracked exam planning docs: `design.md`, `tasks.md`, and `changes.md`.
- Added mobile `.gitignore` rules so local `AGENTS.md`, `.agents/`, and `.claude/` files are not tracked.
- Confirmed the app is running locally on port `8082` per user report.

## 2026-06-08 - asimwe001

- Completed Activity 3 pronunciation audio requirements.
- Added `expo-audio` for in-app pronunciation playback.
- Replaced external audio URL opening with play, pause, stop, loading, and reset behavior.
- Added support for multiple pronunciation audio URLs with a next-audio control.
- Updated `tasks.md` to mark Activity 3 audio requirements complete.

## 2026-06-08 - asimwe001

- Improved pronunciation audio selection to show accent labels such as `AU` and `US`.
- Derived accent labels from Dictionary API pronunciation audio filenames.
- Replaced generic next-audio selection with selectable accent chips.
- Preserved selected-accent playback controls for play, pause, and stop.

## 2026-06-08 - asimwe001

- Fixed pronunciation playback so audio plays once and waits for another user press instead of looping.
- Lifted selected pronunciation accent state to the search screen.
- Updated the displayed phonetic text to match the selected accent when the API provides accent-specific phonetics.
