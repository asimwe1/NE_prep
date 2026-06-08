# Dictionary Mobile App Exam Tasks

Use this checklist with `design.md`.

## Core Tasks

- [x] Create a React Native/Expo scaffold in `mobile/exam/official/dictionary-mobile-app/`.
- [x] Keep local agent files ignored from Git.
- [x] Add tracked planning docs for the exam.
- [ ] Complete cross-platform compatibility checks.
- [ ] Complete API integration.
- [ ] Complete user-friendly experience polish.

## Activity 1: Word Search and API Integration

- [x] Design a search screen with a text input field and a search button/icon.
- [x] Validate user input so the search field is not empty.
- [x] Capture the entered word when the user submits the search.
- [x] Construct the API request to `https://api.dictionaryapi.dev/api/v2/entries/en`.
- [x] Display a loading indicator while the API request is in progress.
- [x] Receive and parse the JSON response from the API.
- [x] Store fetched word data temporarily for display and navigation.
- [ ] Confirm axios is installed and used for all API requests.

## Activity 2: Display Word Details

- [x] Extract the main word, phonetics, meanings, and definitions from the API response.
- [x] Display the searched word prominently at the top of the screen.
- [x] Show phonetic spelling when available.
- [x] Display each part of speech, such as noun, verb, or adjective.
- [x] List definitions under their respective parts of speech.
- [x] Display example sentences when provided by the API.
- [x] Ensure the layout supports multiple meanings and long definitions.
- [x] Apply consistent styling and spacing for readability.

## Activity 3: Audio Pronunciation Feature

- [x] Check whether an audio pronunciation URL exists in the API response.
- [x] Display a pronunciation/speaker control when audio exists.
- [x] Load the audio file from the provided URL inside the app.
- [x] Play the audio when the user taps the pronunciation icon.
- [x] Handle cases where multiple audio pronunciations are provided.
- [x] Disable or hide the audio button if no pronunciation is provided.
- [x] Manage audio playback state: play, pause, and stop.

## Activity 4: Drawer Navigation and Search History

- [ ] Implement a drawer navigator in the application layout.
- [ ] Create a search history data structure to store previously searched words.
- [ ] Add each successfully searched word to the history list.
- [ ] Display the list of searched words in the drawer menu.
- [ ] Allow the user to tap a word from the drawer.
- [ ] Trigger a new API request when a history item is selected.
- [ ] Refresh the word details screen with the selected word data.
- [ ] Prevent duplicate entries; move repeated words to the top instead.

## Activity 5: Error Handling and User Feedback

- [x] Detect when the API returns a word-not-found response.
- [x] Display a clear user-friendly word-not-found message.
- [x] Handle network/API request issues.
- [x] Show an error message when the API request fails.
- [x] Hide loading indicators when an error occurs.
- [x] Prevent the app from crashing due to malformed or missing response fields.
- [x] Display empty-state messages when no data is available.
- [ ] Add explicit offline/connectivity feedback if the platform exposes it.

## Instructions

- [x] Read the tasks and update `design.md` with data flow and architecture.
- [x] Outline the API endpoint and application pages.
- [x] Build the Android/iOS application using React Native.
- [x] Validate input where applicable.
- [x] Handle errors and validations with relevant user-facing messages.
- [ ] Use axios for all API interactions.
- [ ] Test mobile application flows using the Expo CLI package.

## Next Implementation Phase

- [x] Replace temporary pronunciation URL opening with in-app audio playback.
- [ ] Add drawer navigation and search history.
- [ ] Improve result rendering for synonyms, antonyms, and multiple audio sources.
- [ ] Add final UX polish after feature completion.
