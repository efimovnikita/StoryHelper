export enum GameState {
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  EVALUATING = 'EVALUATING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR'
}

export interface StoryConfig {
  theme: string;
  mode: 'thematic' | 'random';
}

export interface WordPair {
  italian: string;
  english: string;
  collocations: string[];
}

export interface TextSegment {
  text: string;
  isCorrection: boolean;
}

export interface SentenceAnalysis {
  original: string;
  segments: TextSegment[];
  englishTranslation?: string;
}

export interface EvaluationResult {
  score: number; // 0-100
  usedWords: string[]; // Words from the session found in text
  missingWords: string[]; // Words presented but not found
  logicalConsistency: string; // Feedback in English
  grammarFeedback: string; // Feedback in English
  creativityComment: string; // Feedback in English
}

export interface WordItem {
  id: string;
  text: string;
  used: boolean;
}