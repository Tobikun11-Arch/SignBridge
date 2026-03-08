// Phrase tables for mock translation (Phase A)
// TL = Tagalog, EN = English

const tlToEn: Record<string, string> = {
  'kamusta ka?': 'How are you?',
  'kamusta': 'Hello',
  'salamat': 'Thank you',
  'oo': 'Yes',
  'hindi': 'No',
  'magandang umaga': 'Good morning',
  'magandang hapon': 'Good afternoon',
  'magandang gabi': 'Good evening',
  'paalam': 'Goodbye',
  'tulungan mo ako': 'Help me',
  'ano pangalan mo?': 'What is your name?',
  'mahal kita': 'I love you',
  'pasensya na': 'I\'m sorry',
  'opo': 'Yes (polite)',
  'saan ka pupunta?': 'Where are you going?',
  'gutom ako': 'I\'m hungry',
  'uhaw ako': 'I\'m thirsty',
  'masaya ako': 'I\'m happy',
  'malungkot ako': 'I\'m sad',
  'ingat ka': 'Take care',
};

// Build reverse table EN→TL
const enToTl: Record<string, string> = {};
for (const [tl, en] of Object.entries(tlToEn)) {
  enToTl[en.toLowerCase()] = tl.charAt(0).toUpperCase() + tl.slice(1);
}

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
    matchType: 'exact' | 'fallback';
  };
}

export function mockTranslate(req: TranslateRequest): TranslateResponse {
  const start = Date.now();
  const input = req.sourceText.trim().toLowerCase();
  let translatedText: string;
  let matchType: 'exact' | 'fallback' = 'fallback';

  if (req.sourceLang === 'tl' && req.targetLang === 'en') {
    if (tlToEn[input]) {
      translatedText = tlToEn[input];
      matchType = 'exact';
    } else {
      translatedText = `[Mock EN] ${req.sourceText}`;
    }
  } else if (req.sourceLang === 'en' && req.targetLang === 'tl') {
    if (enToTl[input]) {
      translatedText = enToTl[input];
      matchType = 'exact';
    } else {
      translatedText = `[Mock TL] ${req.sourceText}`;
    }
  } else {
    translatedText = req.sourceText;
  }

  return {
    translatedText,
    latencyMs: Date.now() - start,
    debug: {
      source: 'mock',
      matchType,
    },
  };
}
