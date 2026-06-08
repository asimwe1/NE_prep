# Dictionary Mobile Application Design

## Project Context

LexiTech Solution LTD is building a cross-platform Dictionary Mobile Application for Android and iOS. The app must help users search English words, read meanings, see examples, and listen to pronunciation audio where the API provides it.

The official project lives at:

```text
mobile/exam/official/dictionary-mobile-app/
```

The app must be built with React Native and tested through the Expo CLI workflow.

## Core Requirements

- Search English words.
- Validate input before calling the API.
- Fetch dictionary data with axios.
- Show loading feedback while a request is in progress.
- Display the searched word, phonetics, parts of speech, definitions, and examples.
- Support multiple meanings and long definitions.
- Play pronunciation audio when available.
- Add successful searches to drawer-based search history.
- Handle not-found, malformed response, and network errors gracefully.

## API Endpoint

External API:

```text
GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
```

Examples:

```text
GET https://api.dictionaryapi.dev/api/v2/entries/en/hello
GET https://api.dictionaryapi.dev/api/v2/entries/en/run
```

Implementation rules:

- Use axios for API calls.
- Trim the word before requesting.
- Reject empty input before requesting.
- Use `encodeURIComponent(word)` in the URL path.
- Treat non-2xx responses as errors.
- Convert API errors into friendly user messages.

## Application Pages and Surfaces

### Search/Home Screen

Primary user-facing screen.

Responsibilities:

- Render search input and search button/icon.
- Validate search input.
- Trigger API request.
- Show loading state.
- Render word details.
- Render empty and error states.

### Word Details Area

This can be part of the home screen for a simple exam implementation.

Responsibilities:

- Display the main word prominently.
- Display phonetic spelling when available.
- Display pronunciation icon/button when audio exists.
- Display all meanings grouped by part of speech.
- Display all definitions and examples.

### Drawer Navigation

Required for search history.

Responsibilities:

- Show previously searched words.
- Allow tapping a history item.
- Move duplicate history entries to the top instead of adding duplicates.
- Trigger a fresh API request for a selected history item.

## Recommended Architecture

```text
dictionary-mobile-app/
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
```

Architecture rules:

- Route files stay in `src/app`.
- API calls stay in `src/services`.
- API response types stay in `src/types`.
- Reusable UI stays in `src/components`.
- Formatting and history helpers stay in `src/utils`.
- Avoid hard-coded dictionary results.

## Data Flow Diagram

```text
User
  |
  v
Search Input
  |
  v
Input Validation
  |-- invalid/empty --> Friendly validation message
  |
  v
Dictionary API Service (axios)
  |
  v
GET /api/v2/entries/en/{word}
  |
  +-- success --> Parse JSON --> Store temporary result state --> Render word details
  |
  +-- success --> Update search history --> Render drawer history
  |
  +-- not found/network/error --> Friendly error state
```

## State Model

The main app state should track:

- `query`: current search input.
- `entries`: fetched dictionary entries.
- `isLoading`: API request in progress.
- `error`: friendly error message.
- `hasSearched`: controls initial empty state.
- `history`: successfully searched words.
- `audioState`: pronunciation playback state, such as idle, loading, playing, paused, or failed.

## API Response Handling

Successful response shape:

- `word`
- `phonetic`
- `phonetics[]`
- `meanings[]`
- `meanings[].partOfSpeech`
- `meanings[].definitions[]`
- `meanings[].definitions[].definition`
- `meanings[].definitions[].example`

The app must safely handle missing optional fields.

## Audio Design

Pronunciation audio is optional.

Rules:

- Check `phonetics[]` for available `audio` URLs.
- If multiple audio URLs exist, use the first valid one for the initial scaffold and keep the structure ready for selecting alternatives.
- Show a speaker icon near the word or phonetics.
- Hide or disable audio controls when no audio exists.
- Track playback state: play, pause, stop, loading, and error.
- Never crash if audio loading fails.

## Search History Design

Search history stores successfully searched words only.

Rules:

- Add a word after a successful API response.
- Normalize words for duplicate checks.
- If a searched word already exists, move it to the top.
- Drawer history item tap triggers a new API request.
- Refresh the detail screen with the selected word.

## Error Handling

Required user-facing cases:

- Empty input.
- Word not found.
- Network unavailable.
- API request failure.
- Malformed or unexpected response.
- Audio unavailable or playback failure.

Never display raw JSON or raw stack traces to users.

## UI/UX Direction

- Clean, modern reference-app layout.
- Search-first first screen, not a marketing page.
- Strong readable typography.
- Good spacing for long definitions.
- Compact part-of-speech labels.
- Clear loading and empty states.
- Comfortable touch targets.
- Drawer history should be simple and fast to scan.

## Verification Checklist

- `hello`: definitions and possible pronunciation.
- `run`: multiple meanings.
- `book` or `light`: examples when available.
- `asdfghjkl`: not-found message.
- Empty input: validation without API call.
- Whitespace input: trimmed before request.
- Network/API failure: friendly error without crash.
- History item tap: refetches and refreshes results.

## Acceptance Criteria

The scaffold phase is acceptable when:

- React Native/Expo app exists in the official exam directory.
- API service is typed and uses axios.
- Search, loading, error, and result rendering are scaffolded.
- Planning docs describe drawer/history, audio, API, architecture, and data flow.
- `changes.md` records the scaffold work by `asimwe001`.
