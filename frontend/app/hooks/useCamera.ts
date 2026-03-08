'use client';

import {useRef, useState, useCallback, useEffect} from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    'prompt' | 'granted' | 'denied' | 'unknown'
  >('unknown');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: {ideal: 640},
          height: {ideal: 480},
          frameRate: {ideal: 30, max: 30}
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure playback starts (some browsers need an explicit play())
        await new Promise<void>(resolve => {
          const el = videoRef.current;
          if (!el) return resolve();
          if (el.readyState >= 1) return resolve();
          el.onloadedmetadata = () => resolve();
        });
        await videoRef.current.play().catch(() => {
          // Ignore; user gesture restrictions may apply in some browsers
        });
      }
      setIsActive(true);
      setPermissionState('granted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access failed';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setPermissionState('denied');
      }
      setError(msg);
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {videoRef, isActive, error, permissionState, startCamera, stopCamera};
}
