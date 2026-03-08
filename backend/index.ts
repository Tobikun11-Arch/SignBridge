import dotenv from 'dotenv';
import cors from 'cors';
import express, {Request, Response} from 'express';
import {mockTranslate, TranslateRequest} from './mockTranslator';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const geminiKey = process.env.GEMINI_API_KEY || 'mock_key';
const isMock = geminiKey === 'mock_key';

const corsOptions = {
  origin: [frontendUrl],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Health ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({status: 'ok', mode: isMock ? 'mock' : 'gemini'});
});

// --- Translate ---
app.post('/api/agent/translate', async (req: Request, res: Response) => {
  const body: TranslateRequest = req.body;

  if (!body.sourceText || !body.sourceLang || !body.targetLang) {
    res
      .status(400)
      .json({
        error: 'Missing required fields: sourceText, sourceLang, targetLang'
      });
    return;
  }

  if (isMock) {
    // Phase A: mock translation
    const result = mockTranslate(body);
    res.json(result);
    return;
  }

  // Phase B: real Gemini translation (placeholder)
  // TODO: replace with actual Gemini API call
  const start = Date.now();
  res.json({
    translatedText: `[Gemini placeholder] ${body.sourceText}`,
    latencyMs: Date.now() - start,
    debug: {source: 'gemini', model: 'gemini-live-placeholder'}
  });
});

app.listen(port, () => {
  console.log(
    `SignBridge backend running on port ${port} [mode: ${isMock ? 'mock' : 'gemini'}]`
  );
});
