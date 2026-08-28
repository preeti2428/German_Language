'use client';

/**
 * Synthesized sound effects. No audio files needed — every sound is generated
 * with the WebAudio API, so this adds 0 bytes to /public and works offline.
 */

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = 'jaiman.muted';

if (typeof window !== 'undefined') {
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    muted = false;
  }
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* storage blocked — mute still works for this page */
  }
  return muted;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

type ToneOpts = {
  freq: number;
  start?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
};

function tone({ freq, start = 0, dur = 0.12, type = 'sine', gain = 0.18, sweepTo }: ToneOpts) {
  const a = audio();
  if (!a || muted) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const vol = a.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur);

  // Quick attack, smooth exponential release — avoids the click of a hard stop.
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(vol);
  vol.connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(start = 0, dur = 0.18, gain = 0.06) {
  const a = audio();
  if (!a || muted) return;
  const frames = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, frames, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Fade the noise out over its lifetime so it reads as a "shhk", not a hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = a.createBufferSource();
  const vol = a.createGain();
  vol.gain.value = gain;
  src.buffer = buf;
  src.connect(vol);
  vol.connect(a.destination);
  src.start(a.currentTime + start);
}

/** Bright ascending third — the "that's right" chime. */
export function sfxCorrect() {
  tone({ freq: 660, dur: 0.1, type: 'triangle', gain: 0.16 });
  tone({ freq: 880, start: 0.07, dur: 0.16, type: 'triangle', gain: 0.14 });
}

/** Joyful winning chime for correct answers. */
export function sfxWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((f, i) => tone({ freq: f, start: i * 0.08, dur: 0.2, type: 'triangle', gain: 0.15 }));
  tone({ freq: 1046.5, start: 0.32, dur: 0.4, type: 'sine', gain: 0.12 });
}

/** Low descending buzz. Short, not punishing. */
export function sfxWrong() {
  tone({ freq: 200, dur: 0.18, type: 'sawtooth', gain: 0.1, sweepTo: 120 });
  noise(0, 0.12, 0.03);
}

/** Rises with the combo count so streaks audibly escalate. */
export function sfxCombo(level: number) {
  const base = 520 + Math.min(level, 8) * 70;
  tone({ freq: base, dur: 0.08, type: 'square', gain: 0.07 });
  tone({ freq: base * 1.5, start: 0.05, dur: 0.1, type: 'square', gain: 0.06 });
}

/** Glassy heart-break. Plays when a life is lost. */
export function sfxHeartLost() {
  tone({ freq: 420, dur: 0.28, type: 'sine', gain: 0.14, sweepTo: 90 });
  noise(0.02, 0.22, 0.05);
}

/** Four-note fanfare for lesson completion. */
export function sfxFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone({ freq: f, start: i * 0.11, dur: 0.3, type: 'triangle', gain: 0.15 }));
  tone({ freq: 1318.5, start: 0.46, dur: 0.5, type: 'sine', gain: 0.1 });
}

/** Sad two-note fall for running out of hearts. */
export function sfxFail() {
  tone({ freq: 392, dur: 0.3, type: 'triangle', gain: 0.14 });
  tone({ freq: 294, start: 0.22, dur: 0.5, type: 'triangle', gain: 0.12 });
}

/** Soft tick for tile selection. */
export function sfxTap() {
  tone({ freq: 720, dur: 0.05, type: 'sine', gain: 0.05 });
}
