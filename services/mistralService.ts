import { Mistral } from "@mistralai/mistralai";
import { StoryConfig, EvaluationResult, WordPair, SentenceAnalysis } from "../types";

// Cache the client instance to avoid recreating it unnecessarily
let cachedClient: Mistral | null = null;
let cachedKey: string = "";
const HISTORY_KEY = 'mistral_word_history';

const getMistralClient = () => {
  // Prioritize Local Storage, then fallback to env vars
  const apiKey = localStorage.getItem('mistral_api_key') || process.env.MISTRAL_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    throw new Error("API Key is missing. Please click the settings icon and enter your Mistral API Key.");
  }

  // Return cached client if key hasn't changed
  if (cachedClient && cachedKey === apiKey) {
    return cachedClient;
  }

  // Create new client
  cachedClient = new Mistral({ apiKey });
  cachedKey = apiKey;
  return cachedClient;
};

const getGlobalWordHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addToGlobalWordHistory = (word: string) => {
  try {
    const history = getGlobalWordHistory();
    if (!history.includes(word)) {
      history.push(word);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error("Failed to update word history", e);
  }
};

const MODEL_NAME = 'mistral-medium-latest';

/**
 * Generates a SINGLE logical next word based on the story context.
 */
export const generateNextWord = async (
  theme: string, 
  storyContext: string, 
  excludedWords: string[],
  mode: 'thematic' | 'random' = 'thematic'
): Promise<WordPair> => {
  
  const mistral = getMistralClient();
  const globalHistory = getGlobalWordHistory();
  // Combine current session excluded words with global history
  // Using Set to ensure uniqueness
  const allExcludedWords = Array.from(new Set([...excludedWords, ...globalHistory]));

  let prompt = "";

  // Helper to ensure JSON format is explicitly requested for Mistral
  const jsonInstruction = `
    Return JSON format.
    Expected structure:
    {
      "italian": "string",
      "english": "string",
      "collocations": ["string", "string", "string", "string", "string"]
    }
  `;

  if (mode === 'random') {
    prompt = `
      You are an Italian language teacher designed to improve lateral thinking.
      
      Task:
      Generate a COMPLETELY RANDOM Italian word (noun, verb, or adjective).
      
      Constraints:
      1. The word must be completely UNRELATED to the previous words: ${JSON.stringify(allExcludedWords)}.
      2. Do NOT look at any story context. Randomness is key.
      3. The goal is to force the student to build conceptual links between unrelated concepts.
      
      Requirements:
      1. Return exactly ONE word object.
      2. 'italian': The word in Italian (if it is a noun, MUST include the definite article, e.g. "il gatto", "la casa").
      3. 'english': English translation.
      4. 'collocations': 5 common short phrases (2-3 words) using this word.
      
      ${jsonInstruction}
    `;
  } else {
    prompt = `
      You are a creative Italian language teacher assisting a student in writing a story.
      
      Context:
      - Topic: "${theme}"
      - The story so far: "${storyContext || "(The story has just started)"}"
      - Do NOT use these words (already used or previously learned): ${JSON.stringify(allExcludedWords)}
      
      Task:
      Suggest the NEXT logical Italian word (noun, verb, or adjective) that the student should use to continue this specific story.
      The word should fit the narrative flow naturally but move the plot forward.
      
      Requirements:
      1. Return exactly ONE word object.
      2. 'italian': The word in Italian (if it is a noun, MUST include the definite article, e.g. "il gatto", "la casa").
      3. 'english': English translation.
      4. 'collocations': 5 common short phrases (2-3 words) using this word.
      
      ${jsonInstruction}
    `;
  }

  try {
    const response = await mistral.chat.complete({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
      temperature: mode === 'random' ? 1.0 : 0.7,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error("Empty or invalid response from Mistral");
    
    const result = JSON.parse(content) as WordPair;
    
    // Save the new word to global history
    if (result && result.italian) {
      addToGlobalWordHistory(result.italian);
    }

    return result;
  } catch (error) {
    console.error("Error generating next word:", error);
    throw error; // Re-throw to handle in UI
  }
};

/**
 * Analyzes a single sentence for grammar and vocabulary.
 * Returns the sentence segmented into correct parts (grey) and corrected parts (orange).
 */
export const analyzeSentence = async (sentence: string): Promise<SentenceAnalysis> => {
  const mistral = getMistralClient();
  
  // Helper to ensure JSON format is explicitly requested for Mistral
  const jsonInstruction = `
    Return JSON format.
    Expected structure:
    {
      "original": "string",
      "segments": [
        { "text": "string", "isCorrection": boolean }
      ]
    }
  `;

  const prompt = `
  You are an Italian language corrector. Analyze this sentence: "${sentence}".

  Your task:
  1. If the sentence is grammatically correct and uses vocabulary naturally, return it as a single segment with isCorrection: false.
  2. If there are errors (grammar, spelling, or unnatural word choice), return the CORRECTED version of the sentence, broken into segments.
  3. Mark the segments that were CHANGED or CORRECTED as 'isCorrection: true'. 
  4. Mark the segments that remain the SAME as 'isCorrection: false'.
  5. IGNORE punctuation differences. Do not mark a segment as a correction if only punctuation changed.

  Example Input: "Io andare a casa."
  Example Output: 
  {
    "original": "Io andare a casa.",
    "segments": [
      { "text": "Io ", "isCorrection": false },
      { "text": "vado", "isCorrection": true },
      { "text": " a casa.", "isCorrection": false }
    ]
  }

  ${jsonInstruction}
  `;
  try {
    const response = await mistral.chat.complete({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
      temperature: 0.1, // Low temperature for grammar analysis
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error("Empty or invalid analysis response");

    return JSON.parse(content) as SentenceAnalysis;
  } catch (error) {
    console.error("Error analyzing sentence:", error);
    // Fallback if AI fails: return original as valid
    return {
      original: sentence,
      englishTranslation: "",
      segments: [{ text: sentence, isCorrection: false }]
    };
  }
};

/**
 * Evaluates the user's Italian story.
 * Feedback is provided in English.
 */
export const evaluateStory = async (story: string, presentedWords: string[]): Promise<EvaluationResult> => {
  const mistral = getMistralClient();
  
  // Helper to ensure JSON format is explicitly requested for Mistral
  const jsonInstruction = `
    Return JSON format.
    Expected structure:
    {
      "score": number (0-100),
      "usedWords": ["string"] (List of strings ONLY),
      "missingWords": ["string"] (List of strings ONLY),
      "logicalConsistency": "string",
      "grammarFeedback": "string",
      "creativityComment": "string"
    }
  `;

  const prompt = `
    You are an expert Italian language teacher for English speakers. Analyze the student's story.
    
    Context:
    - The student was given the following Italian words to include: ${JSON.stringify(presentedWords)}.
    - The Student's Italian Story: "${story}"

    Tasks:
    1. Check if the provided words were used (account for conjugations/declensions).
    2. Analyze logical consistency and flow.
    3. Analyze grammar and vocabulary usage.
    4. Provide ALL feedback in ENGLISH.
    5. Score from 0 to 100.
    6. Return usedWords and missingWords as simple ARRAYS OF STRINGS. Do NOT return objects with usage details.

    ${jsonInstruction}
  `;

  try {
    const response = await mistral.chat.complete({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error("Empty or invalid evaluation response");

    const result = JSON.parse(content);

    // Sanitize function to handle cases where LLM returns objects instead of strings
    const sanitizeStringArray = (arr: any[]): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          // Flatten object to string if LLM returns { word: "...", usage: "..." }
          return item.word || item.text || item.italian || JSON.stringify(item);
        }
        return String(item);
      });
    };

    if (result.usedWords) {
        result.usedWords = sanitizeStringArray(result.usedWords);
    }
    if (result.missingWords) {
        result.missingWords = sanitizeStringArray(result.missingWords);
    }

    return result as EvaluationResult;
  } catch (error) {
    console.error("Error evaluating story:", error);
    throw error;
  }
};