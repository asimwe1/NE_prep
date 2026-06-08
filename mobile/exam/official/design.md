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

## Visual Design Reference: LookUp

Primary UI reference:

```text
LookUp: English Dictionary App (Squircle Apps LLP)
https://apps.apple.com/us/app/lookup-english-dictionary-app/id872564448
```

LookUp is the visual and interaction benchmark for this exam app. The goal is not to clone every LookUp feature (illustrations, collections, quizzes, Oxford licensing, widgets, and Smart Search are out of exam scope), but to match its **layout discipline**, **icon placement**, **search prominence**, and **definition readability** on phone-sized screens first, then scale cleanly to larger widths on web, iOS, and Android.

### LookUp Design Principles To Adopt

- **Search-first, zero friction:** Opening the app should immediately present a usable dictionary search experience. No marketing splash, no sign-up gate, no long onboarding.
- **Content over chrome:** UI decoration stays minimal. Typography, spacing, and hierarchy carry the design.
- **Card-led reading flow:** Word metadata and meanings read as distinct, scannable surfaces — similar to tapping a LookUp word card for pronunciations, origins, and definitions.
- **Aesthetic clarity:** Clean, modern, Editor's Choice–level polish — colorful structure without cartoon styling or heavy skeuomorphism.
- **Readable line length:** Long definitions must stay comfortable to read; avoid edge-to-edge text blocks on wide screens.
- **Platform-native behavior, shared brand:** iOS follows HIG grouped surfaces and toolbar patterns; Android follows Material navigation and elevation; web follows the same information hierarchy. Colors and spacing stay consistent across platforms.
- **Accessible by default:** Support light/dark/system appearance, sufficient contrast, large text scaling, and reduced-motion-friendly transitions where animations exist.

### Out Of Exam Scope (Do Not Implement For LookUp Parity)

- Illustrated Word of the Day posters and artwork
- Personal collections, favorites/hearts, flashcards, quizzes, and spaced repetition
- Oxford / proprietary dictionary licensing
- Smart Search, voice lookup, camera/Visual Intelligence scan, widgets, and SharePlay
- Translations, thesaurus tabs, etymology maps, and Wikipedia deep links

## Application Pages and Surfaces

### Search/Home Screen

Primary user-facing screen. This is the first screen after launch.

LookUp-aligned layout (phone / default):

```text
+--------------------------------------------------+
| [App title]              [appearance] [history]  |  <- compact chrome, trailing toolbar actions
+--------------------------------------------------+
| [ search field ........................ ]        |  <- dominant, top of scroll content
| [ Search button / submit affordance ]            |
+--------------------------------------------------+
| (loading | empty | error | results)              |
+--------------------------------------------------+
```

Responsibilities:

- Keep search input and submit control above the fold on common phone heights.
- Validate search input before fetching.
- Trigger API request from keyboard submit and explicit search button.
- Show loading, empty, error, and result states in the same vertical reading column.
- Do not push results behind tabs or secondary navigation.

LookUp-aligned search field rules:

- Place the search field at the **top of the main scroll content**, directly under the screen header — not hidden in a bottom bar or overflow menu.
- Use a single full-width field with a leading search icon inside the field (muted), mirroring LookUp's obvious "look up any word, instantly" entry point.
- Placeholder text must read as a dictionary prompt (for example: `Search an English word`), not generic app marketing copy.
- Return key / enter submits the search (`returnKeyType="search"` on native).
- Do not fetch on every keystroke; fetch on explicit submit only.
- The submit button sits **immediately below** the field as a full-width primary action (exam requirement), styled as the strongest color on screen.

### Word Details Area

Part of the home screen scroll content, rendered below search once a valid result exists.

LookUp-aligned word header (hero card):

```text
+--------------------------------------------------+
|  hello                              (large title) |
|  /həˈloʊ/                           (phonetic)    |
|  [ speaker / play ] [ accent chips if multiple ]  |
+--------------------------------------------------+
```

Placement rules:

- Display the searched **word as the largest text on screen** (`largeTitle` / hero scale).
- Place **phonetic text directly under the word**, smaller and muted — never separated into a distant footer.
- Group pronunciation controls **in the same header card** as the word and phonetic string.
- Show speaker/play affordance only when audio exists; hide the control entirely when unavailable (do not show a disabled ghost button).
- If multiple pronunciations exist, show compact selectable chips or a small control row **beside or below** the primary play control — not in the app toolbar.
- Wrap word + phonetic + pronunciation in one rounded grouped card with comfortable padding (LookUp "tap a card" presentation).

LookUp-aligned definitions area:

```text
+--------------------------------------------------+
|  noun                                             |  <- part-of-speech label
|  +----------------------------------------------+ |
|  | 1. used as a greeting or to begin a phone... | |
|  |    "Hello, how are you?"                     | |  <- example, indented/muted
|  +----------------------------------------------+ |
|  | 2. ...                                       | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
|  verb                                             |
|  ...                                              |
+--------------------------------------------------+
```

Placement rules:

- Render **every** meaning group from the API, each in its own section.
- Part-of-speech labels sit above their definitions as compact uppercase or semibold subheads (LookUp grammar grouping).
- Each definition is its own inner card or inset row with a **numbered index** for scanability.
- Example sentences appear **under** the definition they belong to, indented or quoted, with muted color — never the same weight as the definition text.
- Maintain vertical rhythm: more space **between** POS sections than **within** a single definition block.
- For words with multiple top-level entries (for example `run`), show a subtle `Entry 2` divider before the next entry stack.
- Results must remain fully scrollable; never clip long definitions.

Wide-screen adaptation (web / tablet, LookUp iPad pattern simplified):

- Below ~600–700px width: single column (phone stack).
- Above that width: optional two-region layout inside the scroll area — **left column** for word header + pronunciation, **right column** for meanings — while keeping one continuous page (no route change).

### Drawer Navigation

Required for search history. Maps to LookUp's sidebar / collections access pattern, simplified to recent searches only.

LookUp-aligned drawer rules:

- Slide in from the **left** (sidebar metaphor on iPhone; true sidebar region on wide layouts).
- Header: title `Search history`, short subtitle, and a trailing **close** icon button.
- Body: scrollable list of tappable word rows (grouped list style).
- Footer: **Appearance** control (`Auto`, `Light`, `Dark`) pinned to the bottom with a top separator — settings-like placement LookUp uses for personalization, adapted for exam theme switching.
- Duplicate history entries move to the top; tapping an item closes the drawer and refetches that word.
- Do not use a bottom sheet for history; LookUp reserves bottom presentation for pickers on small phones, not primary library navigation.

### Screen Chrome And Icon Placement

Header toolbar (all platforms):

| Position | Element | LookUp rationale |
|----------|---------|------------------|
| Leading | App title + one-line subtitle | Establishes context without a logo-heavy splash |
| Trailing | Appearance control | Secondary personalization, not competing with search |
| Trailing (rightmost) | History control | Recents/collections access — LookUp sidebar entry point |

Icon rules:

- Toolbar icons live in **circular or squircle grouped buttons** with minimum 44×44 pt touch targets.
- Use outline icons only; no text labels on toolbar icons (accessibility labels required).
- Do not place search, history, or appearance icons inside the word result card.
- Search icon belongs **inside** the text field at leading position.
- Pronunciation icon belongs in the **word header card** only.
- State icons (empty, error, loading) appear in the **content area**, centered in their own card — not in the toolbar.

### Feedback States (LookUp Tone)

- **Initial empty:** Calm instructional card below search — invite first lookup, no illustration required.
- **Loading:** Centered spinner inside a content card with short copy (`Searching dictionary...`).
- **Not found:** Friendly title + explanation + hint to check spelling; use API `title` / `message` when present.
- **Network error:** Clear recovery tone; never show raw HTTP or stack traces.
- Errors and empty states use the same card width and horizontal padding as results for visual continuity.

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

Pronunciation audio is optional. LookUp exposes audio from the word card; this app follows the same placement.

Rules:

- Check `phonetics[]` for available `audio` URLs.
- If multiple audio URLs exist, default to the first valid clip but keep UI ready to switch accents.
- Place play/pause/speaker controls in the **word header card**, adjacent to phonetic text — not in the navigation bar.
- Use a speaker or play glyph that toggles to pause while audio is active.
- Hide pronunciation controls completely when no audio exists.
- Track playback state: idle, loading, playing, paused, and error.
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

### Typography (LookUp-style hierarchy)

| Role | Treatment |
|------|-----------|
| Word title | Largest bold headline |
| Phonetic | Body or subhead, muted |
| Part of speech | Footnote/subhead, semibold, uppercase tracking |
| Definition | Body, primary foreground |
| Example | Subhead or footnote, muted, quoted |
| Toolbar / chrome | Title2 for screen title, subhead for subtitle |

- Prefer system fonts (SF Pro on iOS, Roboto/default on Android, system sans on web).
- Support dynamic type / font scaling without breaking card layouts.
- Maximum readable line length for definition paragraphs: target ~60–75 characters on wide screens.

### Spacing And Surfaces

- Screen horizontal padding: **20px** on phone; may increase to **24–32px** on tablet/web.
- Card corner radius: **10–12px** grouped style.
- Vertical gap between major sections (search → results → meanings): **16px**.
- Inner card padding: **16–20px**.
- Use grouped background + elevated white/dark cards (iOS grouped table aesthetic; Material elevated cards on Android).
- One shared Lexi brand palette across web, iOS, and Android; appearance toggle supports light, dark, and system.

### Motion

- Drawer: slide from left (~280ms), dimmed backdrop — sidebar metaphor, not bottom sheet.
- Press states: opacity ~0.8 on buttons and list rows.
- Respect reduced motion: avoid decorative motion when user prefers reduced motion.

### Cross-Platform Checklist

- **iOS:** Safe areas, grouped backgrounds, trailing toolbar icons, action sheet for appearance quick pick.
- **Android:** Same hierarchy as iOS; opaque drawer surface, hairline borders, modest elevation on cards and drawer.
- **Web:** Same column structure as mobile; verify keyboard submit, focus ring, and `aria-hidden` on decorative icons.

### UI Acceptance (LookUp Benchmark)

- Search field and submit are the visual focus before any result exists.
- Word header reads as a single hero card: word → phonetic → pronunciation.
- Definitions are numbered, grouped by part of speech, with examples visually subordinate.
- Toolbar icons (appearance, history) are trailing only; search icon is inside the field.
- Drawer history slides from the left with appearance control in the footer.
- Light and dark modes both preserve contrast and hierarchy.
- `hello`, `run`, and invalid searches all look intentional — not like debug output.

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

The exam app is acceptable when:

- React Native/Expo app exists in the official exam directory.
- API service is typed and uses axios.
- Search, loading, error, and result rendering work against live API data.
- UI follows the LookUp-aligned layout rules in this document (search placement, word header card, definition grouping, toolbar icon placement, left drawer history).
- Drawer history, pronunciation audio, theme appearance, and friendly error handling behave as specified.
- App runs on Android and iOS (and web when tested), with consistent brand styling across platforms.
- `changes.md` records meaningful implementation phases by `asimwe001`.
