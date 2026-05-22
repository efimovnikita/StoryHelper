# Objective
Migrate the back-translation feature (translating the user's Italian input to English) from Mistral LLM to the Google Translate API to improve reliability and speed.

# Key Files & Context
- `src/App.tsx`: Contains the UI for the Settings screen and the Game screen, as well as the main logic for processing user input.
- `src/services/mistralService.ts`: Currently handles the prompt for both grammar checking and translation.
- `src/services/googleTranslateService.ts`: New file to be created for handling Google Translate API requests.

# Implementation Steps

1. **Create Google Translate Service (`src/services/googleTranslateService.ts`)**
   - Implement a `translateText` function that retrieves the Google Translate API key from `localStorage`.
   - Make a `POST` request to `https://translation.googleapis.com/language/translate/v2` with the user's text, setting source language to Italian (`it`) and target language to English (`en`).
   - Handle API errors gracefully, returning an empty string if translation fails or the key is missing.

2. **Update Settings UI (`src/App.tsx`)**
   - Add a new state variable `googleApiKey` to `SetupScreen`.
   - Initialize the state from `localStorage.getItem('google_translate_api_key')`.
   - Add a new password input field for the "Google Translate API Key" below the existing Mistral API key input in the slide-out settings panel.
   - Update `localStorage` whenever the input changes.

3. **Update Application Logic (`src/App.tsx`)**
   - In the `GameScreen` component, import the new `translateText` function.
   - Modify the `processSentence` function to call `translateText` and `analyzeSentence` concurrently using `Promise.all`.
   - Assign the translated text from Google API to the `englishTranslation` property of the `SentenceAnalysis` result before passing it to `setPendingAnalysis`.

4. **Optimize Mistral Prompt (`src/services/mistralService.ts`)**
   - Remove the instruction to translate the sentence (e.g., "6. Provide an English translation...") from the system prompt in `analyzeSentence`.
   - Update the expected JSON structure and example output in the prompt to reflect that `englishTranslation` is no longer required from the LLM.

# Verification & Testing
- Enter an API key for Google Translate in the settings panel and verify it persists on page reload.
- Type an Italian sentence in the input box and press Enter.
- Verify that the grammar correction works as before and that the English translation appears correctly under the input text in italics.
- Ensure no errors occur if the Google Translate API key is left blank (the translation should simply be omitted, but the app shouldn't crash).