# Lexi Dictionary

Cross-platform dictionary mobile app for the LexiTech Solution LTD mobile exam.

## Maintainer Guide

Read the full codebase guide before making larger changes:

```text
../CODEBASE.md
```

That file explains the architecture, state flow, API layer, audio logic, history drawer, styling rules, and change tracking expectations.

## Features

- Expo Router and React Native TypeScript setup.
- Uniwind styling copied from the existing Expo template.
- Axios-based Dictionary API service with typed response models.
- Search screen with empty, loading, error, and result states.
- Meaning sections grouped by part of speech.
- Example sentence rendering.
- In-app pronunciation playback with play, pause, and stop controls.
- Accent-labeled pronunciation options such as `US` and `AU` when the API audio filename provides a hint.
- Drawer-style search history.
- Duplicate history handling that moves repeated words to the latest position.

## API

```text
https://api.dictionaryapi.dev/api/v2/entries/en/<word>
```

## Run

Install dependencies first:

```bash
npm install
```

Start the app:

```bash
npm run start
```

Run platform targets:

```bash
npm run android
npm run ios
```

## Checks

Run these before committing code changes:

```bash
npx tsc --noEmit
npm run lint
```

## Exam Notes

The app source belongs in this directory:

```text
mobile/exam/official/dictionary-mobile-app/
```

Final packaged submission artifacts, if required, should go in:

```text
mobile/exam/submissions/
```

Every meaningful implementation phase must be documented in:

```text
../changes.md
```
