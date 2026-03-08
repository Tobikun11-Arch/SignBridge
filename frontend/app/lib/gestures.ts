import {GestureMapping} from './types';

export const GESTURE_MAP: GestureMapping[] = [
  {id: 'open_palm', label: 'Open Palm', tagalog: 'Kamusta'},
  {id: 'fist', label: 'Fist', tagalog: 'Oo'},
  {id: 'thumbs_up', label: 'Thumbs Up', tagalog: 'Salamat'},
  {id: 'peace', label: 'Peace Sign', tagalog: 'Paalam'},
  {id: 'pointing_up', label: 'Pointing Up', tagalog: 'Tulungan mo ako'}
];

interface Landmark {
  x: number;
  y: number;
  z: number;
}

function fingerExtended(
  landmarks: Landmark[],
  tip: number,
  mid: number,
  base: number
): boolean {
  // Use distance from base to tip vs base to mid — more rotation-invariant
  const distTipToBase = Math.hypot(
    landmarks[tip].x - landmarks[base].x,
    landmarks[tip].y - landmarks[base].y
  );
  const distMidToBase = Math.hypot(
    landmarks[mid].x - landmarks[base].x,
    landmarks[mid].y - landmarks[base].y
  );
  return distTipToBase > distMidToBase * 1.2;
}

function isThumbExtended(landmarks: Landmark[]): boolean {
  // Compare thumb tip distance to wrist vs thumb MCP
  const distTipToWrist = Math.hypot(
    landmarks[4].x - landmarks[0].x,
    landmarks[4].y - landmarks[0].y
  );
  const distMCPToWrist = Math.hypot(
    landmarks[2].x - landmarks[0].x,
    landmarks[2].y - landmarks[0].y
  );
  return distTipToWrist > distMCPToWrist * 1.3;
}

export function recognizeGesture(
  landmarks: Landmark[]
): {id: string; label: string; tagalog: string; confidence: number} | null {
  if (!landmarks || landmarks.length < 21) return null;

  const thumb = isThumbExtended(landmarks);
  const index = fingerExtended(landmarks, 8, 6, 5);
  const middle = fingerExtended(landmarks, 12, 10, 9);
  const ring = fingerExtended(landmarks, 16, 14, 13);
  const pinky = fingerExtended(landmarks, 20, 18, 17);

  // Open Palm: all fingers extended
  if (thumb && index && middle && ring && pinky) {
    return {...GESTURE_MAP[0], confidence: 0.9};
  }

  // Fist: no fingers extended
  if (!thumb && !index && !middle && !ring && !pinky) {
    return {...GESTURE_MAP[1], confidence: 0.85};
  }

  // Thumbs Up: only thumb extended
  if (thumb && !index && !middle && !ring && !pinky) {
    return {...GESTURE_MAP[2], confidence: 0.85};
  }

  // Peace Sign: index + middle extended, others closed
  if (!thumb && index && middle && !ring && !pinky) {
    return {...GESTURE_MAP[3], confidence: 0.8};
  }

  // Pointing Up: only index extended
  if (!thumb && index && !middle && !ring && !pinky) {
    return {...GESTURE_MAP[4], confidence: 0.8};
  }

  return null;
}
