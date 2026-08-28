import { Request, Response } from 'express';

/**
 * Server-side neural text-to-speech.
 *
 * Primary: Google Gemini TTS (official API, free tier, auto-detects the
 * language — German, Hindi, English all covered by one voice). Needs
 * GEMINI_API_KEY in .env (free at https://aistudio.google.com/apikey).
 *
 * Fallback: Microsoft Edge neural voices via msedge-tts, used when no Gemini
 * key is set (or Gemini fails) and the package is installed.
 *
 * The frontend has one more fallback of its own (browser speechSynthesis),
 * so audio degrades gracefully instead of going silent.
 */

const MAX_TEXT = 600;

/**
 * Gemini TTS is disabled — the current API key returns 403 PERMISSION_DENIED.
 * msedge-tts is used directly as the primary engine.
 * To re-enable Gemini TTS in future, set GEMINI_TTS_ENABLED=true in .env.
 */

/** Lesson words repeat constantly — cache synthesized clips (FIFO, ~300 entries). */
const cache = new Map<string, { buf: Buffer; mime: string }>();
const CACHE_MAX = 300;

function cacheSet(key: string, buf: Buffer, mime: string) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, { buf, mime });
}

/** Gemini returns raw PCM (s16le, 24 kHz, mono); browsers need a WAV header. */
function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bytesPerSample = 2): Buffer {
  const blockAlign = channels * bytesPerSample;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bytesPerSample * 8, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// Gemini TTS disabled — see comment above.

const EDGE_VOICES: Record<string, string> = {
  de: 'de-DE-KatjaNeural',
  hi: 'hi-IN-SwaraNeural',
  en: 'en-IN-NeerjaNeural',
};

async function edgeSynthesize(text: string, lang: string, slow: boolean): Promise<Buffer | null> {
  try {
    // Optional dependency: only used when installed (npm i msedge-tts).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
    const tts = new MsEdgeTTS();
    await tts.setMetadata(EDGE_VOICES[lang] ?? EDGE_VOICES.de, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const raw: unknown = await Promise.resolve(slow ? tts.toStream(text, { rate: '-20%' }) : tts.toStream(text, { rate: '+8%' }));
    const stream = ((raw as { audioStream?: NodeJS.ReadableStream }).audioStream ?? raw) as NodeJS.ReadableStream;
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      setTimeout(() => reject(new Error('Edge TTS timeout')), 15000);
    });
  } catch (err) {
    console.error('Edge TTS unavailable:', (err as Error).message);
    return null;
  }
}

export const textToSpeech = async (req: Request, res: Response): Promise<void> => {
  try {
    const text = String(req.body?.text ?? '').slice(0, MAX_TEXT).trim();
    const lang = (String(req.body?.lang ?? 'de').split('-')[0] ?? 'de').toLowerCase();
    const rateNum = Number(req.body?.rate);
    const slow = Number.isFinite(rateNum) && rateNum > 0 && rateNum <= 0.75;

    if (!text) {
      res.status(400).json({ message: 'No text to speak.' });
      return;
    }

    const key = `${lang}|${slow ? 's' : 'n'}|${text}`;
    const hit = cache.get(key);
    if (hit) {
      res.setHeader('Content-Type', hit.mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(hit.buf);
      return;
    }

    // Go straight to msedge-tts (Gemini TTS key has PERMISSION_DENIED).
    const audio = await edgeSynthesize(text, lang, slow);
    const mime = 'audio/mpeg';

    if (!audio || !audio.length) {
      res.status(502).json({ message: 'Edge TTS unavailable. Check backend logs or internet connection.' });
      return;
    }

    cacheSet(key, audio, mime);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(audio);
  } catch (error) {
    console.error('textToSpeech failed:', (error as Error).message);
    res.status(502).json({ message: 'Speech synthesis unavailable.' });
  }
};
