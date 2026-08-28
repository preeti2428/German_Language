'use client';

import api from '@/lib/api';

/**
 * German text-to-speech and speech recognition.
 *
 * Why this exists: the content references ~20 audio files (audio/koln_hallo.mp3
 * etc.) that were never recorded. Rather than block listening exercises on a
 * recording session, we try the real file first and fall back to the browser's
 * built-in German voice. Every listening exercise works today, and recorded
 * audio transparently takes over as you add the files.
 */

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices();
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  // Chrome populates the voice list asynchronously.
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function hasTts() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

function voiceFor(lang: string): SpeechSynthesisVoice | null {
  if (!voices.length) loadVoices();
  const prefix = lang.split('-')[0].toLowerCase();
  return (
    voices.find((v) => v.lang === lang && v.localService) ||
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  );
}

let currentAudio: HTMLAudioElement | null = null;

// After a server-TTS failure, skip it for a minute instead of paying the
// timeout on every phrase; the browser voice covers the gap.
let serverTtsDownUntil = 0;

export function cancelSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/**
 * Neural TTS from our own backend (Edge voices — identical for every user).
 * Returns false when unavailable so callers can fall back to the browser voice.
 */
async function playServerTts(text: string, lang: string, rate: number): Promise<boolean> {
  if (Date.now() < serverTtsDownUntil) return false;
  try {
    const res = await api.post(
      '/chat/tts',
      { text, lang, rate },
      { responseType: 'blob', timeout: 12000 }
    );
    const blob = res.data as Blob;
    if (!blob || blob.size < 200 || (blob.type && blob.type.includes('json'))) throw new Error('bad audio');
    const url = URL.createObjectURL(blob);
    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('playback'));
        audio.play().catch(reject);
      });
    } finally {
      URL.revokeObjectURL(url);
      currentAudio = null;
    }
    return true;
  } catch {
    serverTtsDownUntil = Date.now() + 60_000;
    return false;
  }
}

/**
 * Guess which voice a piece of text needs. Devanagari → Hindi; umlauts/ß or a
 * couple of common German function words → German; otherwise English (which
 * also reads Hinglish tolerably well).
 */
export function detectSpeechLang(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[äöüßÄÖÜ]/.test(text)) return 'de-DE';
  const germanWords = text.toLowerCase().match(/\b(ich|du|ist|und|nicht|das|der|die|wie|gut|danke|bitte|hallo|geht|dir|was|ein|eine)\b/g);
  if (germanWords && germanWords.length >= 2) return 'de-DE';
  return 'en-US';
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('soundEnabled');
  return val !== 'false';
}

/**
 * Speak text in the given language. `rate` below 1 gives a "slow" replay.
 * Tries the backend's neural voices first (same quality for every user, no
 * OS voices needed); the browser's speechSynthesis is only the fallback.
 */
export async function speakText(text: string, lang: string, rate = 1): Promise<void> {
  if (typeof window === 'undefined' || !text) return;
  if (!isSoundEnabled()) return;
  cancelSpeech();
  if (await playServerTts(text, lang, rate)) return;
  return new Promise((resolve) => {
    if (!hasTts()) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(lang);
    if (v) u.voice = v;
    u.lang = lang;
    u.rate = rate;
    u.pitch = 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Speak German text. Kept for the lesson components. */
export function speakGerman(text: string, rate = 1.05): Promise<void> {
  if (!isSoundEnabled()) return Promise.resolve();
  return speakText(text, 'de-DE', rate);
}

/**
 * Play a recorded clip if it exists, otherwise speak the text.
 * Returns which source actually played, so the UI can show a "synthesized"
 * hint rather than pretending a recording exists.
 */
export async function playAudioOrSpeak(
  url: string | undefined,
  fallbackText: string,
  rate = 1.05
): Promise<'file' | 'server' | 'tts' | 'none'> {
  if (!isSoundEnabled()) return 'none';
  if (url) {
    const src = url.startsWith('/') || url.startsWith('http') ? url : '/' + url;
    const ok = await new Promise<boolean>((resolve) => {
      const el = new Audio(src);
      el.oncanplaythrough = () => {
        el.play().then(() => resolve(true)).catch(() => resolve(false));
      };
      el.onerror = () => resolve(false);
      // Don't hang the UI on a slow or missing file.
      setTimeout(() => resolve(false), 1200);
      el.load();
    });
    if (ok) return 'file';
  }
  if (fallbackText) {
    if (await playServerTts(fallbackText, 'de', rate)) return 'server';
    if (hasTts()) {
      await speakGerman(fallbackText, rate);
      return 'tts';
    }
  }
  return 'none';
}

type RecognitionResult = { transcript: string; supported: boolean; error?: string };

type RecEvent = {
  results: ArrayLike<{ 0?: { transcript: string }; isFinal: boolean }>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

export function hasSpeechRecognition() {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/**
 * Listen for German speech.
 *
 * Hardened against the "mic flashes on for a second and dies" failure mode:
 *  1. Explicit getUserMedia first — the permission prompt actually appears, and
 *     a denial comes back as a clear 'not-allowed' instead of a silent stop.
 *  2. continuous + interim results — Chrome no longer cuts off after its own
 *     ~1s silence guess; WE decide when you're done (1.6s of quiet after speech,
 *     4s if you never start, hard cap at timeoutMs).
 *  3. The error code is returned so the UI can say what went wrong.
 */
export async function listenGerman(timeoutMs = 15000): Promise<RecognitionResult> {
  if (!hasSpeechRecognition()) return { transcript: '', supported: false };

  // Force the permission prompt and surface denial explicitly.
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    return { transcript: '', supported: true, error: 'not-allowed' };
  }

  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as new () => SpeechRecognitionLike;

  return new Promise((resolve) => {
    const rec = new Ctor();
    rec.lang = 'de-DE';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    let finalText = '';
    let interim = '';
    let errCode: string | undefined;
    let done = false;
    let silenceTimer: ReturnType<typeof setTimeout> | undefined;
    let overallTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (done) return;
      done = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      if (overallTimer) clearTimeout(overallTimer);
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      resolve({ transcript: (finalText || interim).trim(), supported: true, error: errCode });
    };

    const armSilence = (ms: number) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(finish, ms);
    };

    rec.onresult = (e) => {
      let f = '';
      let it = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r?.[0]?.transcript ?? '';
        if (r?.isFinal) f += t;
        else it += t;
      }
      finalText = f;
      interim = it;
      // You spoke — allow 2.5s of quiet before we consider you finished.
      armSilence(2500);
    };
    rec.onerror = (e) => {
      // 'no-speech' just means silence; not a real failure.
      if (e?.error && e.error !== 'no-speech') errCode = e.error;
      finish();
    };
    rec.onend = () => finish();

    try {
      rec.start();
    } catch {
      resolve({ transcript: '', supported: false });
      return;
    }
    armSilence(8000); // 8s generous grace to start talking
    overallTimer = setTimeout(finish, timeoutMs);
  });
}

/* ── Recorder fallback ─────────────────────────────────────────────────
 * Chrome's built-in recognition needs Google's speech servers, which are
 * unreachable in embedded Chromium browsers (no Google API keys), Brave,
 * and some networks — the classic 'network' error. This records raw audio
 * instead, for transcription by the backend (Groq Whisper). Works anywhere
 * MediaRecorder does, which is every modern browser.
 */

export interface Recorder {
  /** Stop early (e.g. the user tapped the mic again). */
  stop: () => void;
  /** Resolves with the recorded audio, or null if nothing was captured. */
  done: Promise<Blob | null>;
}

export async function startRecording(maxMs = 10000): Promise<Recorder | null> {
  if (
    typeof window === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === 'undefined'
  ) {
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    let resolveDone!: (b: Blob | null) => void;
    const done = new Promise<Blob | null>((r) => (resolveDone = r));
    let stopped = false;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      try {
        rec.stop();
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        resolveDone(null);
      }
    };

    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolveDone(chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null);
    };
    rec.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolveDone(null);
    };

    rec.start();
    const timer = setTimeout(finish, maxMs);
    return {
      stop: () => {
        clearTimeout(timer);
        finish();
      },
      done,
    };
  } catch {
    return null;
  }
}
