'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Send, Volume2, VolumeX } from 'lucide-react';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { recordTutorTurn } from '@/lib/streak';
import { cancelSpeech, detectSpeechLang, hasSpeechRecognition, listenGerman, speakText, startRecording, type Recorder } from '@/lib/speech';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const OPENERS = [
  'Hallo! Ich bin Jai 🦉 Talk to me in any language — English, Hindi, ya German — and I will reply in the same language while teaching you German along the way. So… wie heißt du? (What is your name?)',
];

const SUGGESTIONS = [
  'Hi Jai! Teach me some German',
  'Mujhe German sikhao!',
  'Hallo! Wie geht es dir?',
  'Mera naam … hai',
];

/**
 * The AI tutor: free-form German conversation by text or voice.
 *
 * Voice loop: tap the mic → Web Speech API transcribes your German → the reply
 * comes back from the backend (Groq) → it is read aloud with German TTS.
 * Everything degrades gracefully: no mic support falls back to typing, no TTS
 * falls back to reading.
 */
export default function TutorPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'hi', role: 'assistant', content: OPENERS[0] },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  // Once Chrome's own recognition fails with 'network' (embedded browsers,
  // Brave, blocked networks), remember it and go straight to the recorder.
  const [useRecorder, setUseRecorder] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => cancelSpeech(), []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || busy) return;
      setError(null);
      setInput('');
      const mine: Msg = { id: `u${Date.now()}`, role: 'user', content: clean };
      const history = [...messages, mine];
      setMessages(history);
      setBusy(true);
      try {
        const res = await api.post('/chat', {
          messages: history.map(({ role, content }) => ({ role, content })),
        });
        const reply: string = res.data.reply;
        recordTutorTurn();
        setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', content: reply }]);
        if (speakReplies) {
          // Strip bracketed translations, then speak in the reply's own language.
          const spoken = reply.replace(/\([^)]*\)/g, '').trim() || reply;
          void speakText(spoken, detectSpeechLang(spoken));
        }
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not reach the tutor. Is the backend running?';
        setError(msg);
        setMessages((m) => m.slice(0, -1));
        setInput(clean);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, speakReplies]
  );

  /** Record with MediaRecorder and transcribe on the backend (Groq Whisper). */
  async function recordAndTranscribe() {
    setError(null);
    const rec = await startRecording(12000);
    if (!rec) {
      setError('Microphone is blocked or unavailable. Allow the mic in your browser settings and reload.');
      return;
    }
    recorderRef.current = rec;
    setRecording(true);
    const blob = await rec.done;
    setRecording(false);
    recorderRef.current = null;
    if (!blob || blob.size < 2000) {
      setError("I didn't capture any audio — tap the mic, speak, then tap again to stop.");
      return;
    }
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append('audio', blob, 'speech.webm');
      const res = await api.post('/chat/transcribe', form);
      const text: string = (res.data?.text || '').trim();
      if (!text) {
        setError("I couldn't make out any words — try speaking a bit louder.");
        return;
      }
      void send(text);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Transcription failed. Is the backend running?';
      setError(msg);
    } finally {
      setTranscribing(false);
    }
  }

  async function talk() {
    if (busy || transcribing) return;
    // Second tap while recording = stop and transcribe.
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (listening) return;
    cancelSpeech();
    setError(null);

    if (useRecorder || !hasSpeechRecognition()) {
      void recordAndTranscribe();
      return;
    }

    setListening(true);
    const { transcript, supported, error: recError } = await listenGerman(15000);
    setListening(false);
    if (!supported) {
      void recordAndTranscribe();
      return;
    }
    if (recError === 'not-allowed' || recError === 'service-not-allowed') {
      setError('Microphone is blocked. Click the lock icon in the address bar → Site settings → Microphone → Allow, then reload this page.');
      return;
    }
    if (recError === 'network') {
      // Chrome's speech servers are unreachable here — switch to our own
      // Whisper pipeline permanently for this session and start recording now.
      setUseRecorder(true);
      void recordAndTranscribe();
      return;
    }
    if (!transcript) {
      setError("I didn't hear anything. Tap the mic and speak clearly into your microphone.");
      return;
    }
    void send(transcript);
  }

  const showSuggestions = messages.length <= 1 && !busy;

  const turns = messages.filter((m) => m.role === 'user').length;

  return (
    <PageShell crumb="AI Tutor" title="Chat with Jai 🦉">
    <div className="flex h-[calc(100vh-165px)] min-h-[520px] w-full flex-col overflow-hidden rounded-[36px] border-2 border-b-[5px] border-[#e5e5e5] bg-white">
      {/* In-card header, per the design canvas */}
      <div className="flex flex-none items-center justify-between gap-4 border-b-2 border-[#EEF1F5] px-7 py-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#D6DEFF] bg-[#EEF2FF] text-2xl">
            🦉
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#20BF6B]" />
          </div>
          <div>
            <p className="text-[17px] font-black text-[#1F2328]">Jai · AI Tutor</p>
            <p className="mt-0.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#20BF6B]">
              Online · replies instantly
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-[14px] border-2 border-b-4 border-[#FFE2C4] bg-[#FFF4E6] px-3.5 py-2 sm:flex">
            <span className="text-[11px] font-black uppercase tracking-[0.06em] text-[#FF9F43]">Turns: {turns}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              cancelSpeech();
              setSpeakReplies((v) => !v);
            }}
            className={`flex items-center gap-2 rounded-[14px] border-2 border-b-4 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.06em] transition-colors ${
              speakReplies ? 'border-[#D6DEFF] bg-[#EEF2FF] text-[#4361EE]' : 'border-[#E4E9EF] bg-[#F8FAFB] text-[#A8B2BE]'
            }`}
          >
            {speakReplies ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {speakReplies ? 'Voice on' : 'Voice off'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-5 py-3.5 text-[15px] font-semibold leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-[26px_8px_26px_26px] border-2 border-[#3046B2] bg-[#4361EE] text-white'
                    : 'rounded-[8px_26px_26px_26px] border-2 border-[#E4E9EF] bg-[#F6F8FA] text-[#1F2328]'
                }`}
              >
                {m.content}
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => {
                      const spoken = m.content.replace(/\([^)]*\)/g, '').trim() || m.content;
                      void speakText(spoken, detectSpeechLang(spoken));
                    }}
                    aria-label="Read aloud"
                    className="ml-2 inline-flex align-middle text-gray-300 transition-colors hover:text-[#4361EE]"
                  >
                    <Volume2 size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-1.5 rounded-3xl rounded-tl-md border-2 border-gray-100 bg-gray-50 px-5 py-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-gray-300"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:border-[#4361EE] hover:text-[#4361EE]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-2xl border-2 border-[#FF9F43]/40 bg-[#FFF4E6] px-4 py-3 text-sm font-bold text-[#b45309]">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="flex items-center gap-3 border-t-2 border-gray-100 px-6 py-4">
        <button
          type="button"
          onClick={talk}
          disabled={busy || transcribing}
          title={recording ? 'Tap to stop' : 'Speak German'}
          aria-label={recording ? 'Stop recording' : 'Speak'}
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-b-4 text-white transition-colors disabled:opacity-40 ${
            listening || recording ? 'animate-pulse border-[#CC3946] bg-[#FF4757]' : 'border-[#178B4E] bg-[#20BF6B]'
          }`}
        >
          <Mic size={20} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void send(input)}
          disabled={busy}
          placeholder={recording ? 'Recording… tap the mic again to stop' : transcribing ? 'Transcribing…' : listening ? 'Listening… sprich Deutsch!' : 'Type in any language…'}
          className="h-[52px] flex-1 rounded-[18px] border-2 border-[#E4E9EF] bg-[#F8FAFB] px-5 text-[15px] font-bold text-[#1F2328] outline-none transition-colors placeholder:text-[#B4BDC8] focus:border-[#4361EE] focus:bg-white"
        />
        <button
          type="button"
          onClick={() => void send(input)}
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full border-b-4 border-[#3046B2] bg-[#4361EE] text-white transition-transform active:translate-y-1 disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
    </PageShell>
  );
}
