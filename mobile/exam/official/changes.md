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

## 2026-06-08 13:00 - asimwe001

- Unified web, iOS, and Android colors through `app-theme.ts` and matching hex tokens in `global.css`.
- Replaced platform-specific iOS blue and Android blue button colors with the shared Lexi teal primary palette.
- Kept iOS HIG behavior for typography and touch targets while syncing visual design across platforms.

## 2026-06-08 15:20 - asimwe001

- Collapsed search field and submit into a single inline bar: leading search icon, full-width input, teal submit button on the right end — no stacked button below.

## 2026-06-08 15:00 - asimwe001

- Pinned search field and submit button in a fixed zone directly under the app header so they stay full-width and above scrolling results.
- Corrected hero card flow to large word, phonetic directly below, then speaker/accent row in the same card with tight vertical rhythm.
- Replaced play-bar pronunciation UI with compact speaker button and accent chips via `pronunciation-controls.tsx`.

## 2026-06-08 14:30 - asimwe001

- Implemented LookUp layout specs: compact app header, hero word card, grouped POS definition stacks, and wide-screen two-column results.
- Added `layout.ts`, `use-layout.ts`, `app-header`, `word-header-card`, `word-entries-list`, and `word-results` components.
- Hid pronunciation controls when audio is unavailable; compact play button and accent chips in the word header card.

## 2026-06-08 14:00 - asimwe001

- Reworked `design.md` UI specification using LookUp: English Dictionary App (App Store id872564448) as the visual benchmark.
- Documented search field placement, toolbar icon positions, word header card layout, definition grouping, drawer behavior, and cross-platform LookUp-aligned acceptance criteria.

## 2026-06-08 13:45 - asimwe001

- Fixed Android theme toggle crash by using shim-safe `SunMoon` and `Settings` icons with explicit JSX instead of dynamic Lucide imports.

## 2026-06-08 13:35 - asimwe001

- Fixed theme toggle crash by exporting `Monitor`, `Moon`, and `Sun` from the `lucide-react-native` shim.

## 2026-06-08 13:20 - asimwe001

- Added light, dark, and system appearance preference with persistence via AsyncStorage.
- Placed a header toolbar theme button (iOS action sheet / Android alert) and a drawer footer segmented control for discoverability on all platforms.
- Wired `ThemePreferenceProvider` and Uniwind `setTheme` so web, iOS, and Android stay in sync with the shared palette.

## 2026-06-08 12:45 - asimwe001

- Fixed Android/BlueStacks native rendering where Uniwind oklch backgrounds were transparent or missing.
- Added `themed-styles.ts` with explicit hex surface colors, Android elevation, and hairline borders.
- Made drawer history fully opaque with solid background and left-slide panel elevation.
- Applied native `style` backgrounds and text colors across cards, search, results, and feedback states.

## 2026-06-08 12:20 - asimwe001

- Changed search history drawer animation to slide in from the left instead of using the default bottom sheet slide.

## 2026-06-08 12:05 - asimwe001

- Reworked search feedback copy so users see clear titles, messages, and hints instead of technical “could not load result” wording.
- Parse Dictionary API 404 `title`, `message`, and `resolution` fields for not-found searches.
- Added `search-feedback.ts` and context-aware feedback icons for validation, not-found, network, and service states.

## 2026-06-08 12:57 - asimwe001

- Audited the actual style/component files against the LookUp design guardrails instead of relying on `design.md`.
- Upgraded shared web/iOS/Android theme tokens to a stronger dictionary UI palette with explicit native colors for Android.
- Added visible native surface depth, stronger search styling, a warmer word hero card, accent part-of-speech chips, and polished pronunciation controls.
- Fixed malformed example quote rendering and restyled examples as inset quote blocks.
- Removed the obsolete `pronunciation-button.tsx` file after confirming current code uses `pronunciation-controls.tsx`.
- Verified with `npm run lint` and `npx tsc --noEmit`.

## 2026-06-08 13:05 - asimwe001

- Replaced the platform Alert/ActionSheet appearance picker with a themed in-app `ThemePickerModal`.
- Made the header appearance button functional on web and iOS with visible `Automatic`, `Light`, and `Dark` choices.
- Styled the Android settings popup as a Lexi-themed modal with native-safe surfaces, touch targets, and selected-state feedback for BlueStacks.
- Updated the header button icon to reflect the active appearance mode (`Automatic`, `Light`, or `Dark`).
- Removed the obsolete `theme-picker.ts` utility.
- Verified with `npm run lint` and `npx tsc --noEmit`.

## 2026-06-08 13:10 - asimwe001

- Limited long dictionary results to a concise preview by default: first two meaning groups and first two definitions per group.
- Added a styled `Show all meanings` / `Show less` control so users can expand long words only when needed.
- Removed user-facing `Entry 1`, `Entry 2`, etc. labels from results and flattened API entries into readable meaning groups.
- Added subtle hidden-definition counts inside previewed meaning cards.
- Verified with `npm run lint` and `npx tsc --noEmit`.

## 2026-06-08 13:15 - asimwe001

- Upgraded search history from plain words to cached items with word, short meaning summary, full API entries, and search timestamp.
- Persisted search history through AsyncStorage so previous successful searches can be reopened without internet.
- Added offline fallback for manual searches when a cached word exists and the network request fails.
- Updated the history drawer to show each word, one subtle meaning preview, and relative time such as `3 sec ago`, `1 min ago`, or `2 days ago`.
- Verified with `npm run lint` and `npx tsc --noEmit`.

## 2026-06-08 13:20 - asimwe001

- Improved pronunciation audio labeling for words with multiple files under the same accent.
- Parsed accent tokens anywhere in pronunciation filenames, including patterns like `us-stressed`, `us-unstressed`, `uk`, and `gb`.
- Replaced fallback labels such as `Audio 3` with compact user-facing labels like `US 1`, `US 2`, `UK`, `AU`, or `ALT 1`.
- Kept longer stressed/unstressed details in accessibility labels instead of crowding the visible chips.
- Verified with `npm run lint` and `npx tsc --noEmit`.

## 2026-06-08 13:32 - asimwe001

- Added a bookmark button to the word hero card for saving the current word preview.
- Added persisted saved words through AsyncStorage with lightweight preview definitions for offline reading after app reloads.
- Added a separate `Saved words` section in the drawer, distinct from recent search history.
- Changed recent history back to lightweight summaries that re-run search on tap; saved words are the offline cache.
- Disabled saved-word pronunciation playback with a clear message asking the user to connect to the internet.
- Verified with `npm run lint` and `npx tsc --noEmit`.
