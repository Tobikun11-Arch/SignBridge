'use client';

import {useState, useCallback, useEffect} from 'react';
import {useCamera} from './hooks/useCamera';
import {useHandTracking} from './hooks/useHandTracking';
import CameraPanel from './components/CameraPanel';
import TagalogBuffer from './components/TagalogBuffer';
import TranslationPanel from './components/TranslationPanel';
import ReversePanel from './components/ReversePanel';
import EventLog from './components/EventLog';
import {EventLogEntry} from './lib/types';
import {checkHealth} from './lib/api';

export default function Home() {
  const {videoRef, isActive, error, permissionState, startCamera, stopCamera} =
    useCamera();
  const [tokens, setTokens] = useState<string[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  const addEvent = useCallback((entry: EventLogEntry) => {
    setEventLog(prev => [...prev, entry]);
  }, []);

  const handleGestureConfirmed = useCallback(
    (gesture: {id: string; tagalog: string}) => {
      setTokens(prev => [...prev, gesture.tagalog]);
      addEvent({
        timestamp: Date.now(),
        type: 'gesture',
        message: `Confirmed: "${gesture.tagalog}" (${gesture.id})`
      });
    },
    [addEvent]
  );

  const handleHandDebug = useCallback(
    (message: string) => {
      addEvent({timestamp: Date.now(), type: 'input', message});
    },
    [addEvent]
  );

  const {result: handResult, canvasRef} = useHandTracking({
    videoRef,
    isActive,
    onGestureConfirmed: handleGestureConfirmed,
    onDebug: handleHandDebug
  });

  const [targetLang, setTargetLang] = useState<'en' | 'tl'>('en');
  const [backendMode, setBackendMode] = useState<string | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then(h => setBackendMode(h.mode))
      .catch(() => setBackendMode('offline'));
  }, []);

  const handleRemoveToken = (index: number) => {
    setTokens(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditToken = (index: number, newValue: string) => {
    setTokens(prev => prev.map((t, i) => (i === index ? newValue : t)));
  };

  const handleClearTokens = () => setTokens([]);
  const handleUndoLast = () => setTokens(prev => prev.slice(0, -1));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">Sign</span>Bridge
            </h1>
            <p className="text-xs text-zinc-500">
              FSL ↔ Tagalog/English Translator
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                backendMode === 'mock'
                  ? 'bg-amber-900/50 text-amber-300'
                  : backendMode === 'gemini'
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'bg-red-900/50 text-red-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  backendMode === 'mock'
                    ? 'bg-amber-400'
                    : backendMode === 'gemini'
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                }`}
              />
              {backendMode === 'mock'
                ? 'Mock Mode'
                : backendMode === 'gemini'
                  ? 'Gemini Live'
                  : backendMode === 'offline'
                    ? 'Backend Offline'
                    : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Camera + Gesture Detection */}
          <div className="flex flex-col gap-6">
            <CameraPanel
              videoRef={videoRef}
              canvasRef={canvasRef}
              isActive={isActive}
              error={error}
              permissionState={permissionState}
              gestureLabel={handResult.gestureLabel}
              confidence={handResult.confidence}
              onStart={startCamera}
              onStop={stopCamera}
            />

            <TagalogBuffer
              tokens={tokens}
              onRemoveToken={handleRemoveToken}
              onEditToken={handleEditToken}
              onClear={handleClearTokens}
              onUndoLast={handleUndoLast}
            />
          </div>

          {/* Right Column: Translation + Reverse + Log */}
          <div className="flex flex-col gap-6">
            <TranslationPanel
              sourceText={tokens.join(' ')}
              targetLang={targetLang}
              onTargetLangChange={setTargetLang}
              onEventLog={addEvent}
            />

            <ReversePanel onEventLog={addEvent} />

            <EventLog entries={eventLog} onClear={() => setEventLog([])} />
          </div>
        </div>
      </main>
    </div>
  );
}
