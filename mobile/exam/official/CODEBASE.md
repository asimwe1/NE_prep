# Dictionary Mobile App Codebase Guide

This guide explains the official LexiTech Dictionary Mobile Application codebase for future maintainers.

## Project Location

```text
mobile/exam/official/
  CODEBASE.md
  changes.md
  design.md
  tasks.md
  dictionary-mobile-app/
```

The React Native app lives in:

```text
mobile/exam/official/dictionary-mobile-app/
```

Local model/agent instruction files such as `AGENTS.md`, `.agents/`, and `.claude/` are intentionally ignored and should not be committed.

## Technology Stack

- React Native with Expo.
- Expo Router for routing.
- TypeScript for app source.
- Uniwind/Tailwind-style `className` styling plus native fallback styles.
- Axios for Dictionary API requests.
- Expo Audio for pronunciation playback.
- AsyncStorage for persisted theme preference, search history, and saved words.
- Lucide React Native for icons.

## External API

```text
GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
```

The API boundary is [dictionary-api.ts](dictionary-mobile-app/src/services/dictionary-api.ts).

Service behavior:

- Uses axios, as required by the exam.
- Trims and encodes searched words before request construction.
- Validates that responses are arrays before returning them to UI code.
- Throws typed errors for API status failures, network failures, and malformed data.

## Runtime Flow

```text
User submits word
  -> HomeScreen validates input
  -> searchWord() requests live Dictionary API data
  -> success: entries render, history summary is stored
  -> network failure: saved-word fallback is used only when the word was bookmarked
  -> other failure: friendly feedback card renders
```

For saved words:

```text
User taps saved word in drawer
  -> saved preview entries render immediately from AsyncStorage
  -> live API refresh starts in the background
  -> success: full live result replaces preview, audio and show-all are enabled
  -> failure: saved preview remains, audio asks the user to connect to internet
```

## Source Structure

```text
src/
  app/
    _layout.tsx
    index.tsx
  components/
    app-header.tsx
    app-text.tsx
    definition-card.tsx
    drawer-history.tsx
    empty-state.tsx
    error-state.tsx
    meaning-section.tsx
    pronunciation-controls.tsx
    search-box.tsx
    search-section.tsx
    theme-appearance-control.tsx
    theme-picker-modal.tsx
    theme-preference-provider.tsx
    theme-toggle-button.tsx
    word-entries-list.tsx
    word-header-card.tsx
    word-results.tsx
  services/
    dictionary-api.ts
  types/
    dictionary.ts
  utils/
    app-theme.ts
    decorative-icon-a11y.ts
    dictionary-format.ts
    history.ts
    ios-design.ts
    layout.ts
    saved-words.ts
    search-feedback.ts
    theme-preference.ts
    themed-styles.ts
    touch-target.ts
    use-layout.ts
    use-pronunciation-playback.ts
    use-theme-colors.ts
```

## Main Screen

[index.tsx](dictionary-mobile-app/src/app/index.tsx) owns the main state:

- Search query.
- Live or preview dictionary entries.
- Loading and feedback state.
- Selected pronunciation accent index.
- Recent search history.
- Saved words.
- Saved preview refresh status.
- Drawer visibility.

It coordinates API calls, offline saved-word fallback, history updates, saved-word updates, and result rendering.

## Rendering Components

- `SearchSection` and `SearchBox`: pinned search UI under the header.
- `WordResults`: switches between phone stack and wide two-column layout.
- `WordHeaderCard`: hero word card with word, phonetic, bookmark button, and pronunciation controls.
- `WordEntriesList`: shows a concise result preview by default and expands with `Show all meanings`.
- `MeaningSection`: groups definitions by part of speech.
- `DefinitionCard`: renders numbered definitions and optional inset examples.
- `DrawerHistory`: left drawer with saved words, recent search history, and appearance controls.
- `ThemePickerModal`: styled cross-platform appearance picker for auto/light/dark.

## Result Preview Rules

Long API responses are intentionally collapsed:

- Default result view shows the first two meaning groups.
- Each previewed group shows the first two definitions.
- `Show all meanings` appears only when full live data has hidden definitions/groups.
- Saved-word previews are lightweight and do not enable full expansion until live refresh succeeds.
- User-facing `Entry 1`, `Entry 2` labels are not shown.

## Audio Behavior

Pronunciation audio is optional.

- `dictionary-format.ts` extracts non-empty `phonetics[].audio` URLs only.
- If no audio URL exists, the speaker/play UI is hidden entirely.
- Multiple audio URLs are deduplicated and labeled compactly, such as `US`, `US 1`, `US 2`, `UK`, `AU`, or `ALT 1`.
- Longer distinctions such as stressed/unstressed are kept in accessibility labels.
- Playback is handled by `use-pronunciation-playback.ts` through Expo Audio.
- Audio plays once; users tap again to replay.
- Saved words do not store audio locally. Audio is disabled while a saved preview waits for live data or if the live refresh fails.

## Persistence

AsyncStorage is used for:

- Theme preference: `theme-preference.ts`.
- Recent search history: `history.ts`.
- Saved words: `saved-words.ts`.

Recent search history:

- Stores word, one short meaning summary, and timestamp.
- Tapping a history row re-runs the API request.
- Duplicate words move to the top.

Saved words:

- Store a lightweight preview of the main definitions.
- Persist across app reloads/restarts.
- Open offline when live requests fail.
- Are separate from search history because they intentionally occupy storage for offline reading.

## Styling Notes

Shared palette tokens live in [app-theme.ts](dictionary-mobile-app/src/utils/app-theme.ts) and are mirrored in [global.css](dictionary-mobile-app/src/global.css).

Native-safe styles live in [themed-styles.ts](dictionary-mobile-app/src/utils/themed-styles.ts). Keep these explicit styles because Android/BlueStacks cannot rely on every CSS token resolving correctly.

Layout constants live in [layout.ts](dictionary-mobile-app/src/utils/layout.ts).

## Icon Shims

Lucide icons are exported through:

```text
src/lucide-react-native.js
src/lucide-react.js
```

If Metro cannot resolve a new icon import, add that icon to `lucide-react-native.js`.

## Verification Commands

Run before committing code changes:

```bash
npx tsc --noEmit
npm run lint
```

The user may already have the Expo dev server running. Do not restart or kill it unless asked.

## Change Tracking

Every meaningful implementation phase must be recorded in:

```text
mobile/exam/official/changes.md
```

Entries use `YYYY-MM-DD HH:MM - asimwe001` and describe concrete changes.

Only `asimwe001` should stage, commit, and push official exam changes.
