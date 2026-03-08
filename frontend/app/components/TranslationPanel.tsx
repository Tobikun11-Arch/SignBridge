'use client';

import { useState, useRef, useCallback } from 'react';
import { translateText } from '../lib/api';
import { TranslateResponse, EventLogEntry } from '../lib/types';

interface TranslationPanelProps {
  sourceText: string;
  targetLang: 'en' | 'tl';
  onTargetLangChange: (lang: 'en' | 'tl') => void;
  onEventLog: (entry: EventLogEntry) => void;
}

export default function TranslationPanel({
  sourceText,
  targetLang,
  onTargetLangChange,
  onEventLog,
}: TranslationPanelProps) {
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
      onEventLog({ timestamp: Date.now(), type: 'interrupt', message: 'Previous translation cancelled' });
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    onEventLog({ timestamp: Date.now(), type: 'translate_start', message: `Translating: "${sourceText}" → ${targetLang.toUpperCase()}` });

    try {
      const res = await translateText(
        { sourceText, sourceLang: 'tl', targetLang, mode: 'text' },
        controller.signal
      );
      setResult(res);
      onEventLog({ timestamp: Date.now(), type: 'translate_done', message: `Result: "${res.translatedText}" [${res.debug.source}]` });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Translation failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, targetLang, onEventLog]);

  const handleBargeIn = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
      onEventLog({ timestamp: Date.now(), type: 'interrupt', message: 'Barge-in: translation interrupted' });
    }
  }, [onEventLog]);

  const handleSpeak = useCallback(() => {
    if (!result?.translatedText) return;
    const utterance = new SpeechSynthesisUtterance(result.translatedText);
    utterance.lang = targetLang === 'en' ? 'en-US' : 'fil-PH';
    utterance.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    onEventLog({ timestamp: Date.now(), type: 'tts', message: `Speaking: "${result.translatedText}"` });
  }, [result, targetLang, onEventLog]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Translation Output</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Output:</label>
          <select
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value as 'en' | 'tl')}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none"
          >
            <option value="en">English</option>
            <option value="tl">Tagalog</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {isLoading ? 'Translating...' : 'Translate'}
        </button>
        <button
          onClick={handleBargeIn}
          disabled={!isLoading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-40"
        >
          Barge-in
        </button>
        <button
          onClick={handleSpeak}
          disabled={!result?.translatedText}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
        >
          Speak
        </button>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!error && !result && !isLoading && (
          <p className="text-sm italic text-zinc-500">Translation will appear here...</p>
        )}
        {isLoading && <p className="text-sm text-zinc-400 animate-pulse">Translating...</p>}
        {result && !isLoading && (
          <div className="flex flex-col gap-2">
            <p className="text-lg text-zinc-100">{result.translatedText}</p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{result.latencyMs}ms</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono">
                source: {result.debug.source}
              </span>
              {result.debug.matchType && (
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono">
                  match: {result.debug.matchType}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
