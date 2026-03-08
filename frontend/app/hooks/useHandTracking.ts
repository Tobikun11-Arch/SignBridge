'use client';

import {RefObject, useRef, useState, useCallback, useEffect} from 'react';
import {recognizeGesture} from '../lib/gestures';
import type {Hands} from '@mediapipe/hands';

interface HandTrackingResult {
  gestureId: string | null;
  gestureLabel: string | null;
  tagalog: string | null;
  confidence: number;
  landmarks: {x: number; y: number; z: number}[] | null;
}

const HOLD_FRAMES = 8;
const COOLDOWN_MS = 1500;

type MediaPipeResults = {
  multiHandLandmarks?: {x: number; y: number; z: number}[][];
};

interface UseHandTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  onGestureConfirmed?: (gesture: {id: string; tagalog: string}) => void;
  onDebug?: (message: string) => void;
}

export function useHandTracking({
  videoRef,
  isActive,
  onGestureConfirmed,
  onDebug
}: UseHandTrackingOptions) {
  const [result, setResult] = useState<HandTrackingResult>({
    gestureId: null,
    gestureLabel: null,
    tagalog: null,
    confidence: 0,
    landmarks: null
  });

  const handsRef = useRef<Hands>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const frameCountRef = useRef(0);
  const lastGestureRef = useRef<string | null>(null);
  const lastConfirmTimeRef = useRef(0);
  const inFlightSendRef = useRef(false);
  const lastDebugRef = useRef(0);
  const framesSentRef = useRef(0);
  const resultsRef = useRef(0);
  const lastSendErrorRef = useRef<string | null>(null);

  const debug = useCallback(
    (message: string, throttleMs = 500) => {
      if (!onDebug) return;
      const now = Date.now();
      if (now - lastDebugRef.current < throttleMs) return;
      lastDebugRef.current = now;
      onDebug(message);
    },
    [onDebug]
  );

  const onResults = useCallback(
    (results: MediaPipeResults) => {
      resultsRef.current += 1;
      const video = videoRef.current;
      if (canvasRef.current && video) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 480;
          canvasRef.current.width = w;
          canvasRef.current.height = h;
          ctx.clearRect(0, 0, w, h);

          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
          ) {
            const landmarks = results.multiHandLandmarks[0];

            debug(
              `hands: results=${resultsRef.current} framesSent=${framesSentRef.current} detected=1 lastErr=${lastSendErrorRef.current ?? 'none'}`,
              750
            );

            // draw landmarks
            ctx.strokeStyle = '#00FF88';
            ctx.lineWidth = 2;
            const connections = [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 4],
              [0, 5],
              [5, 6],
              [6, 7],
              [7, 8],
              [0, 9],
              [9, 10],
              [10, 11],
              [11, 12],
              [0, 13],
              [13, 14],
              [14, 15],
              [15, 16],
              [0, 17],
              [17, 18],
              [18, 19],
              [19, 20],
              [5, 9],
              [9, 13],
              [13, 17]
            ];

            for (const [a, b] of connections) {
              ctx.beginPath();
              ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
              ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
              ctx.stroke();
            }

            ctx.fillStyle = '#FF4444';
            for (const lm of landmarks) {
              ctx.beginPath();
              ctx.arc(lm.x * w, lm.y * h, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            const gesture = recognizeGesture(landmarks);
            if (gesture) {
              debug(
                `gesture: ${gesture.id} (${gesture.tagalog}) conf=${gesture.confidence}`,
                750
              );
              if (gesture.id === lastGestureRef.current) {
                frameCountRef.current++;
              } else {
                frameCountRef.current = 1;
                lastGestureRef.current = gesture.id;
              }

              setResult({
                gestureId: gesture.id,
                gestureLabel: gesture.label,
                tagalog: gesture.tagalog,
                confidence: gesture.confidence,
                landmarks
              });

              const now = Date.now();
              if (
                frameCountRef.current >= HOLD_FRAMES &&
                now - lastConfirmTimeRef.current > COOLDOWN_MS
              ) {
                lastConfirmTimeRef.current = now;
                onGestureConfirmed?.({
                  id: gesture.id,
                  tagalog: gesture.tagalog
                });
              }
            } else {
              frameCountRef.current = 0;
              lastGestureRef.current = null;
              setResult(prev => ({
                ...prev,
                gestureId: null,
                gestureLabel: null,
                tagalog: null,
                confidence: 0,
                landmarks
              }));
            }
          } else {
            debug(
              `hands: results=${resultsRef.current} framesSent=${framesSentRef.current} detected=0 lastErr=${lastSendErrorRef.current ?? 'none'}`,
              750
            );
            setResult({
              gestureId: null,
              gestureLabel: null,
              tagalog: null,
              confidence: 0,
              landmarks: null
            });
            frameCountRef.current = 0;
            lastGestureRef.current = null;
          }
        }
      }
    },
    [videoRef, onGestureConfirmed, debug]
  );

  useEffect(() => {
    if (!isActive) return;

    onDebug?.('hands: init start');
    let cancelled = false;

    async function init() {
      const {Hands} = await import('@mediapipe/hands');
      if (cancelled) return;

      onDebug?.('hands: mediapipe loaded');

      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        selfieMode: false
      });

      onDebug?.('hands: options set, starting loop');
      hands.onResults(onResults);
      handsRef.current = hands;

      const tick = async () => {
        if (cancelled) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2 && !inFlightSendRef.current) {
          try {
            inFlightSendRef.current = true;
            framesSentRef.current += 1;

            // Reuse a single offscreen canvas to avoid allocations.
            const w = video.videoWidth || 640;
            const h = video.videoHeight || 480;
            if (!offscreenRef.current)
              offscreenRef.current = document.createElement('canvas');
            const off = offscreenRef.current;
            if (off.width !== w) off.width = w;
            if (off.height !== h) off.height = h;
            const offCtx = off.getContext('2d');
            if (offCtx) offCtx.drawImage(video, 0, 0, w, h);

            await handsRef?.current?.send({image: off});
            lastSendErrorRef.current = null;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            lastSendErrorRef.current = msg;
            onDebug?.(`hands: send error: ${msg}`);
          } finally {
            inFlightSendRef.current = false;
          }
        }

        // requestAnimationFrame gives lower latency than setTimeout(33)
        requestAnimationFrame(() => {
          if (!cancelled) void tick();
        });
      };

      void tick();
    }

    init();

    return () => {
      cancelled = true;
      onDebug?.('hands: cleanup');
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [isActive, videoRef, onResults, onDebug, debug]);

  return {result, canvasRef};
}
