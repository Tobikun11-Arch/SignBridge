export interface TranslateRequest {
  sourceText: string;
  sourceLang: 'tl' | 'en';
  targetLang: 'tl' | 'en';
  mode: 'text';
  sessionId?: string;
}

export interface TranslateResponse {
  translatedText: string;
  latencyMs: number;
  debug: {
    source: 'mock' | 'gemini';
    model?: string;
    matchType?: 'exact' | 'fallback';
  };
}

export interface GestureMapping {
  id: string;
  label: string;
  tagalog: string;
}

export interface EventLogEntry {
  timestamp: number;
  type: 'gesture' | 'translate_start' | 'translate_done' | 'interrupt' | 'tts' | 'input';
  message: string;
}
