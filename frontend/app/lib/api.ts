import { TranslateRequest, TranslateResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function translateText(
  req: TranslateRequest,
  signal?: AbortSignal
): Promise<TranslateResponse> {
  const res = await fetch(`${API_URL}/api/agent/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Translation failed: ${res.status}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<{ status: string; mode: string }> {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}
