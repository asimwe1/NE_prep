# Lexi Dictionary

Cross-platform dictionary mobile app for the LexiTech Solution LTD mobile exam.

## Maintainer Guide

Read the full codebase guide before making larger changes:

```text
../CODEBASE.md
```

## Features

- Expo Router and React Native TypeScript setup.
- Axios-based Dictionary API service.
- Search screen with empty, loading, not-found, network, and malformed-response states.
- LookUp-inspired UI with a pinned search bar, word hero card, grouped definitions, and left drawer.
- Concise default result previews with `Show all meanings` for long API responses.
- Meaning sections grouped by part of speech.
- Numbered definitions and inset example sentences.
- Pronunciation playback with compact accent chips such as `US`, `US 1`, `US 2`, `UK`, and `AU`.
- Audio controls are hidden when the API does not provide a non-empty audio URL.
- Search history with word, short meaning, and relative timestamp.
- Saved words with bookmark support and persisted offline preview definitions.
- Saved-word live refresh: preview opens immediately, full API result and audio enable only after the request succeeds.
- Styled light/dark/system appearance picker for web, iOS, and Android.

## API

```text
https://api.dictionaryapi.dev/api/v2/entries/en/<word>
```

## Run

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm run start
```

Run platform targets:

```bash
npm run android
npm run ios
npm run web
```

## Checks

Run these before committing code changes:

```bash
npx tsc --noEmit
npm run lint
```

## Exam Notes

The app source belongs in:

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
