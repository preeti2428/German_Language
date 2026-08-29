import { Request, Response } from 'express';

/**
 * AI German tutor, powered by Groq's OpenAI-compatible API.
 *
 * The frontend sends the running conversation; this proxies it with a tutor
 * system prompt. The key stays server-side — the browser never sees it.
 * Get a free key at https://console.groq.com and put GROQ_API_KEY in .env.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
/**
 * Groq retires models on a schedule (llama-3.3-70b-versatile died 2026-08-16),
 * so we try a list in order and remember the first one that works. Set
 * GROQ_MODEL in .env to pin a specific model at the front of the line.
 */
const MODEL_CANDIDATES = [
  process.env.GROQ_MODEL,
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
].filter((m): m is string => !!m);

let workingModel: string | null = null;

const SYSTEM_PROMPT = `You are Jai, a friendly German tutor chatbot inside a language-learning app. The learner is a beginner (A1-A2).

LANGUAGE RULE — the most important rule: detect the language of the learner's MOST RECENT message and reply in THAT language.
- English in → English out.
- Hindi or Hinglish in → reply in Hinglish (Hindi in Latin script, the way people type on WhatsApp).
- German in → simple German a beginner can follow.
- Mixed language in → mirror their mix naturally.

You are still a German tutor in every language: whatever language you are chatting in, naturally teach a little German along the way — drop in one useful German word or phrase relevant to the topic and give its meaning in the learner's language. If the learner writes German with mistakes, gently show the corrected sentence first, then continue the conversation.

Style: keep replies SHORT (2-4 sentences), warm and conversational, like a friend texting. Ask one simple follow-up question to keep them talking. Stay on everyday topics. Plain text only — no markdown, no bullet lists, since replies may be read aloud.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatWithTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        message: 'Tutor is not configured. Add GROQ_API_KEY to the backend .env (free key at console.groq.com).',
      });
      return;
    }

    const incoming = (req.body?.messages ?? []) as ChatMessage[];
    // Keep only well-formed turns, cap history to protect the free tier.
    const history = incoming
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

    if (!history.length || history.at(-1)?.role !== 'user') {
      res.status(400).json({ message: 'Send messages ending with a user turn.' });
      return;
    }

    const models = workingModel ? [workingModel] : MODEL_CANDIDATES;
    let groqRes: globalThis.Response | null = null;
    let lastDetail = '';

    for (const model of models) {
      const attempt = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (attempt.ok) {
        workingModel = model;
        groqRes = attempt;
        break;
      }

      lastDetail = await attempt.text();
      console.error(`Groq error on ${model}:`, attempt.status, lastDetail.slice(0, 300));

      // 401/403 means the KEY is bad — no other model will save us.
      if (attempt.status === 401 || attempt.status === 403) {
        res.status(502).json({ message: 'Groq rejected the API key. Check GROQ_API_KEY in the backend .env and restart the backend.' });
        return;
      }
      // Anything else (retired model, bad request): try the next candidate.
    }

    if (!groqRes) {
      res.status(502).json({
        message: `The tutor is unavailable: every model failed. Last error: ${lastDetail.slice(0, 200) || 'no detail'}`,
      });
      return;
    }

    const data = (await groqRes.json()) as { choices?: { message?: { content?: string; reasoning?: string } }[] };
    let reply = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || '';
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!reply) {
      res.status(502).json({ message: 'The tutor gave an empty reply. Try again.' });
      return;
    }

    res.json({ reply });
  } catch (error) {
    console.error('chatWithTutor failed', error);
    res.status(500).json({ message: 'Tutor request failed.' });
  }
};

/**
 * Server-side speech-to-text via Groq Whisper — the fallback for browsers
 * where Chrome's own speech service is unreachable (embedded Chromium,
 * Brave, restrictive networks). Same free GROQ_API_KEY.
 */
export const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ message: 'Transcription is not configured (GROQ_API_KEY missing).' });
      return;
    }

    const file = (req as Request & { file?: { buffer: Buffer; mimetype: string } }).file;
    if (!file || !file.buffer?.length) {
      res.status(400).json({ message: 'No audio received.' });
      return;
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'audio/webm' }),
      'speech.webm'
    );
    form.append('model', 'whisper-large-v3-turbo');
    // Force German language detection for the speaking lab to prevent hallucinations
    // (like returning Russian for short utterances or background noise).
    form.append('language', 'de');
    form.append('temperature', '0');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      console.error('Groq transcription error', groqRes.status, detail.slice(0, 300));
      res.status(502).json({ message: 'Transcription failed. Try again.' });
      return;
    }

    const data = (await groqRes.json()) as { text?: string };
    res.json({ text: (data.text || '').trim() });
  } catch (error) {
    console.error('transcribeAudio failed', error);
    res.status(500).json({ message: 'Transcription request failed.' });
  }
};
