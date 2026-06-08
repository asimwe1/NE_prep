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

The actual React Native application is in:

```text
mobile/exam/official/dictionary-mobile-app/
```

Local model/agent instruction files such as `AGENTS.md`, `.agents/`, and `.claude/` are intentionally ignored and should not be committed.

## Technology Stack

- React Native with Expo.
- Expo Router for app routing.
- TypeScript for app source.
- Uniwind/Tailwind-style `className` styling.
- Axios for Dictionary API requests.
- Expo Audio for in-app pronunciation playback.
- Lucide React Native for icons.

## Main Runtime Flow

```text
User types word
  -> SearchBox calls HomeScreen search handler
  -> Input is trimmed and validated
  -> dictionary-api service calls Dictionary API with axios
  -> Response is validated as an array
  -> HomeScreen stores entries in state
  -> Successful word is added/promoted in history
  -> Result header, pronunciation controls, and meaning sections render
```

If an error happens:

```text
API 404 -> word-not-found message
No network/connection -> connectivity message
Malformed response -> unreadable-data message
Other API status -> generic service message
```

## External API

The app consumes:

```text
GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
```

The request is built in:

```text
src/services/dictionary-api.ts
```

Important service behavior:

- Uses axios, as required by the exam instructions.
- Encodes the searched word with `encodeURIComponent`.
- Throws typed errors for API status errors, network errors, and malformed responses.
- Returns typed `DictionaryEntry[]` data to the UI.

## Source Structure

```text
src/
  app/
    _layout.tsx
    index.tsx
  components/
    definition-card.tsx
    drawer-history.tsx
    empty-state.tsx
    error-state.tsx
    meaning-section.tsx
    pronunciation-button.tsx
    search-box.tsx
  services/
    dictionary-api.ts
  types/
    dictionary.ts
  utils/
    dictionary-format.ts
    history.ts
  global.css
  lucide-react-native.js
  lucide-react.js
  sf.css
```

## App Route Files

### `src/app/_layout.tsx`

Sets up the app shell:

- Imports global Uniwind styles.
- Applies React Navigation light/dark theme.
- Registers safe-area insets with Uniwind.
- Defines the single `index` route title.
- Adds the Expo status bar.

This file should stay focused on app-level providers and navigation setup.

### `src/app/index.tsx`

This is the main app screen and current state owner.

It manages:

- Search input value.
- Dictionary result entries.
- Loading state.
- Error state.
- Whether the user has searched.
- Selected pronunciation accent index.
- Search history drawer state.

It coordinates:

- Search validation.
- API calls through `searchWord`.
- History updates through `updateSearchHistory`.
- Error message selection.
- Rendering the search input, drawer, result header, audio controls, and meaning sections.

The selected pronunciation index lives here because the word header phonetic must change when a different accent is selected.

## Components

### `search-box.tsx`

Controlled search input and submit button.

Responsibilities:

- Display search text input.
- Trigger search on keyboard submit or button press.
- Disable input/button while loading.
- Keep search UI separate from API logic.

### `drawer-history.tsx`

Drawer-style history panel implemented with a React Native `Modal`.

Responsibilities:

- Show successful search history.
- Show an empty history state.
- Allow selecting a previous word.
- Close when tapping the overlay or close button.

This was implemented without adding a navigation drawer dependency to keep the exam app small and fast.

### `pronunciation-button.tsx`

In-app pronunciation player.

Responsibilities:

- Receive available pronunciation audio options.
- Display accent chips such as `US` or `AU`.
- Play selected audio once.
- Pause playback.
- Stop playback and reset to the beginning.
- Show loading/failure feedback.
- Hide interactive audio controls when no audio exists.

The component does not own the selected accent index by itself. Selection is lifted to `index.tsx` so the displayed phonetic text can match the selected accent.

### `meaning-section.tsx`

Groups definitions by part of speech.

Responsibilities:

- Render a part-of-speech label.
- Render all definition cards under that meaning group.

### `definition-card.tsx`

Displays one definition and its optional example.

Responsibilities:

- Number definitions.
- Render selectable definition text.
- Render example text when provided by the API.

### `empty-state.tsx` and `error-state.tsx`

Simple user feedback components.

Responsibilities:

- Explain what to do before searching.
- Explain failures without showing raw API data or stack traces.

## Services

### `dictionary-api.ts`

API boundary for the app.

Exports:

- `searchWord(word)`
- `DictionaryApiError`
- `DictionaryNetworkError`
- `DictionaryMalformedResponseError`

Why this exists:

- Keeps HTTP details out of UI components.
- Gives UI code simple typed errors to map into user-facing messages.
- Makes the axios requirement explicit and easy to audit.

## Types

### `dictionary.ts`

Defines Dictionary API response types:

- `DictionaryEntry`
- `DictionaryPhonetic`
- `DictionaryMeaning`
- `DictionaryDefinition`
- `DictionaryLicense`

The API has many optional fields. Types reflect that so UI code checks for missing data safely.

## Utilities

### `dictionary-format.ts`

Formatting and extraction helpers.

Key helpers:

- `getDisplayPhonetic(entry)`: chooses a visible phonetic string.
- `findPronunciationAudios(entry)`: extracts unique audio URLs and labels them.

Accent label logic:

- The Dictionary API audio filenames often end with country hints such as `-us.mp3` or `-au.mp3`.
- The helper extracts that suffix and displays it as `US`, `AU`, etc.
- If no suffix exists, it falls back to `Audio 1`, `Audio 2`, and so on.

### `history.ts`

Search history helper.

Behavior:

- Trims searched words.
- Normalizes for duplicate checks.
- Moves repeated words to the top.
- Keeps the history capped at 20 items.

## Styling Notes

The app uses Uniwind classes on React Native components.

Rules to preserve:

- Use complete class strings.
- Use `active:` states for `Pressable`.
- Avoid function-style `Pressable` styles.
- Keep UI readable and dense enough for a reference app.
- Do not create nested card-heavy layouts.

Theme tokens live in:

```text
src/global.css
```

## Icon Shims

The app uses local Lucide export shims:

```text
src/lucide-react-native.js
src/lucide-react.js
```

If a new Lucide icon is imported and Metro cannot resolve it, add the matching export to `src/lucide-react-native.js`.

## Change Tracking

Every meaningful implementation phase must be recorded in:

```text
mobile/exam/official/changes.md
```

Each entry should include:

- Date.
- Actor: `asimwe001`.
- Concrete files/features changed.

Only `asimwe001` should stage, commit, and push official exam changes.

## Verification Commands

Use these before committing code changes:

```bash
npx tsc --noEmit
npm run lint
```

The user may already have the app running locally. Do not restart or kill their dev server unless asked.

## Known Remaining Work

Based on `tasks.md`, remaining polish work may include:

- Cross-platform manual checks.
- Final UI polish.
- Optional synonyms and antonyms rendering.
- Optional source URL display.
- Final submission packaging if required.
