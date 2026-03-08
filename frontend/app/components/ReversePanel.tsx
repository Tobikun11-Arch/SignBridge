'use client';

import { useState, useRef, useCallback } from 'react';
import { translateText } from '../lib/api';
import { TranslateResponse, EventLogEntry } from '../lib/types';

interface ReversePanelProps {
  onEventLog: (entry: EventLogEntry) => void;
}

export default function ReversePanel({ onEventLog }: ReversePanelProps) {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    onEventLog({ timestamp: Date.now(), type: 'input', message: `Reverse: "${inputText}" → Tagalog` });

    try {
      const res = await translateText(
        { sourceText: inputText, sourceLang: 'en', targetLang: 'tl', mode: 'text' },
        controller.signal
      );
      setResult(res);
      onEventLog({ timestamp: Date.now(), type: 'translate_done', message: `Tagalog caption: "${res.translatedText}" [${res.debug.source}]` });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Translation failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, onEventLog]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-100">Hearing User Input (English → Tagalog)</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
          placeholder='Type English text, e.g. "How are you?"'
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
        />
        <button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {isLoading ? '...' : 'Translate'}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!error && !result && !isLoading && (
          <p className="text-sm italic text-zinc-500">Tagalog caption will appear here...</p>
        )}
        {isLoading && <p className="text-sm text-zinc-400 animate-pulse">Translating...</p>}
        {result && !isLoading && (
          <div className="flex flex-col gap-2">
            <p className="text-lg text-zinc-100">{result.translatedText}</p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{result.latencyMs}ms</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono">source: {result.debug.source}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
