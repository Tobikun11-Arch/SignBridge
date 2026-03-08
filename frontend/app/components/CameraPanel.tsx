'use client';

import { RefObject } from 'react';

interface CameraPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  error: string | null;
  permissionState: string;
  gestureLabel: string | null;
  confidence: number;
  onStart: () => void;
  onStop: () => void;
}

export default function CameraPanel({
  videoRef,
  canvasRef,
  isActive,
  error,
  permissionState,
  gestureLabel,
  confidence,
  onStart,
  onStop,
}: CameraPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Camera Feed</h2>
        <div className="flex gap-2">
          {!isActive ? (
            <button
              onClick={onStart}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={onStop}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700">
        {!isActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <svg className="mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Click &quot;Start Camera&quot; to begin</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="text-sm text-red-400">
              {permissionState === 'denied' ? 'Camera permission denied. Please allow camera access in browser settings.' : error}
            </span>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: 'scaleX(-1)', display: isActive ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {isActive && gestureLabel && (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium text-emerald-400">{gestureLabel}</span>
            <span className="ml-2 text-xs text-zinc-400">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
