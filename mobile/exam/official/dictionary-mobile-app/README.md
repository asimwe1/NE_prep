# Lexi Dictionary

Cross-platform dictionary mobile app scaffold for the LexiTech Solution LTD mobile exam.

## Features Included

- Expo Router and React Native TypeScript setup.
- Uniwind styling copied from the existing Expo template.
- Dictionary API service with typed response models.
- Search screen with empty, loading, error, and result states.
- Meaning sections grouped by part of speech.
- Example sentence rendering.
- Pronunciation button for entries with audio URLs.

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

## Exam Notes

The app source belongs in this directory:

```text
mobile/exam/official/dictionary-mobile-app/
```

Final packaged submission artifacts, if required, should go in:

```text
mobile/exam/submissions/
```
