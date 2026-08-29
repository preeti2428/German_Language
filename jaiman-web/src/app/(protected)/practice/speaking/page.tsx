'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Volume2, Loader, RefreshCw,
  Award, Mic, Square, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { hasSpeechRecognition, listenGerman, startRecording } from '@/lib/speech';
import { gradeKeywords, normalizeText, tokenize } from '@/lib/lesson/grade';

interface SpeakingExercise {
  stageId: string;
  theme: string;
  cityName: string;
  prompt: string;      // The German sentence to speak
  promptEn?: string;   // English translation/instruction
  audioText?: string;
  points: number;
}

const TIER_OPTS = ['A1', 'A2', 'B1', 'B2'];
const TIER_COLORS: Record<string, { bg: string; color: string; shadow: string }> = {
  A1: { bg: '#E8FBF0', color: '#20BF6B', shadow: '#178B4E' },
  A2: { bg: '#EEF2FF', color: '#4361EE', shadow: '#3046B2' },
  B1: { bg: '#FFF4E6', color: '#FF9F43', shadow: '#D97F27' },
  B2: { bg: '#F7EDFF', color: '#CE82FF', shadow: '#A85FD6' },
};

const PRAISE_MESSAGES = [
  { grade: 'SUPER!', subtitle: 'Toll gemacht!', emoji: '🎉', color: '#20BF6B' },
  { grade: 'EXCELLENT!', subtitle: 'Ausgezeichnet!', emoji: '🌟', color: '#4361EE' },
  { grade: 'BRILLIANT!', subtitle: 'Hervorragend!', emoji: '🔥', color: '#FF9F43' },
  { grade: 'FANTASTIC!', subtitle: 'Sehr gut!', emoji: '✨', color: '#CE82FF' },
  { grade: 'PERFECT!', subtitle: 'Genau richtig!', emoji: '🏆', color: '#20BF6B' },
];

/** Synthesize a pleasant winning chime using Web Audio API */
function playWinningSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Joyful ascending arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.4);
    });
  } catch {
    // AudioContext blocked or not supported
  }
}

/** Synthesize a gentle soft tone on incorrect answers */
function playWrongSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // ignore
  }
}

export default function SpeakingLabPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supported = hasSpeechRecognition();
  const [selectedTier, setSelectedTier] = useState(user?.level ?? 'A1');
  const [exercises, setExercises] = useState<SpeakingExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const [recordState, setRecordState] = useState<'idle' | 'listening' | 'scoring' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [ratio, setRatio] = useState(0);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [praiseIndex, setPraiseIndex] = useState(0);
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<any>(null);

  const tierStyle = TIER_COLORS[selectedTier] ?? TIER_COLORS.A1;

  const loadExercises = async (tier: string) => {
    setLoading(true);
    setCurrent(0);
    setDone(false);
    setScore({ correct: 0, total: 0 });
    setRecordState('idle');
    try {
      const { data } = await api.get(`/quiz/speaking?tier=${tier}`);
      setExercises(data.exercises ?? []);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises(selectedTier);
  }, [selectedTier]);

  const playAudio = async (text: string) => {
    setAudioLoading(true);
    setIsPlayingAudio(true);
    try {
      const res = await api.post('/chat/tts', { text, lang: 'de', rate: 0.75 }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.play();
      }
    } catch {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'de-DE';
      utter.rate = 0.8;
      utter.onend = () => setIsPlayingAudio(false);
      speechSynthesis.speak(utter);
    } finally {
      setAudioLoading(false);
    }
  };

  const processTranscript = (transcript: string, ok: boolean) => {
    if (!ok) {
      setRecordState('idle');
      return;
    }
    
    const ex = exercises[current];
    const targetWords = tokenize(ex.prompt);

    setHeard(transcript);
    const scoreVal = targetWords.length ? gradeKeywords(transcript, targetWords) : transcript ? 1 : 0;
    setRatio(scoreVal);
    
    // 60% of the target words is a fair bar
    const isCorrect = scoreVal >= 0.6;
    
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));

    if (isCorrect) {
      playWinningSound();
      setPraiseIndex(Math.floor(Math.random() * PRAISE_MESSAGES.length));
    } else {
      playWrongSound();
    }
    
    setRecordState('done');
  };

  const toggleRecording = async () => {
    if (recordState === 'listening') {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      return;
    }
    if (recordState !== 'idle') return;

    setRecordState('listening');
    const recorder = await startRecording(10000);
    if (!recorder) {
      // Fallback if MediaRecorder isn't supported/fails
      const { transcript, supported: ok } = await listenGerman();
      setRecordState('scoring');
      processTranscript(transcript, ok);
      return;
    }

    recorderRef.current = recorder;
    const blob = await recorder.done;
    recorderRef.current = null;

    setRecordState('scoring');
    if (!blob) {
      processTranscript('', true);
      return;
    }

    try {
      const form = new FormData();
      form.append('audio', blob, 'audio.webm');
      const res = await api.post('/chat/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      processTranscript(res.data.text || '', true);
    } catch (err) {
      console.error('Transcription failed:', err);
      processTranscript('', true);
    }
  };

  const handleSelfReport = () => {
    setHeard('(self-reported)');
    setRatio(1);
    setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    playWinningSound();
    setPraiseIndex(Math.floor(Math.random() * PRAISE_MESSAGES.length));
    setRecordState('done');
  };

  const handlePrev = () => {
    if (current > 0) {
      setRecordState('idle');
      setHeard('');
      setRatio(0);
      setCurrent((c) => c - 1);
    }
  };

  const handleNextSkip = () => {
    if (current + 1 >= exercises.length) {
      setDone(true);
    } else {
      setRecordState('idle');
      setHeard('');
      setRatio(0);
      setCurrent((c) => c + 1);
    }
  };

  const handleRetry = () => {
    setRecordState('idle');
    setHeard('');
    setRatio(0);
  };

  const ex = exercises[current];
  const progress = exercises.length > 0 ? (current / exercises.length) * 100 : 0;
  const currentPraise = PRAISE_MESSAGES[praiseIndex];
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
  const isCurrentCorrect = ratio >= 0.6;

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8 pb-24">
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white border border-[#EAEAEA] text-[#757575] hover:text-[#1A1A2E] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-black text-[#1A1A2E]">🎙️ Speaking Lab</h1>
              <p className="text-xs text-[#9E9E9E] font-medium">Practice your pronunciation</p>
            </div>
          </div>

          <span
            className="px-3 py-1 rounded-xl text-xs font-black"
            style={{ background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.color}40` }}
          >
            {selectedTier}
          </span>
        </div>

        {/* Tier selector */}
        <div className="flex gap-2 mb-6">
          {TIER_OPTS.map((tier) => {
            const ts = TIER_COLORS[tier];
            const isActive = tier === selectedTier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className="px-4 py-2 rounded-xl text-xs font-black transition-all"
                style={
                  isActive
                    ? { background: ts.color, color: 'white', boxShadow: `0 3px 0 ${ts.shadow}` }
                    : { background: 'white', color: '#9E9E9E', border: '2px solid #EAEAEA' }
                }
              >
                {tier}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 flex flex-col items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-2 border-[#EAEAEA]">
            <Loader className="animate-spin" style={{ color: tierStyle.color }} size={28} />
            <p className="text-sm font-bold text-[#9E9E9E]">Loading {selectedTier} speaking exercises...</p>
          </div>
        )}

        {/* No exercises */}
        {!loading && exercises.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-2 border-[#EAEAEA]">
            <p className="text-4xl mb-3">🔇</p>
            <p className="text-sm font-bold text-[#757575]">No speaking exercises found for {selectedTier}.</p>
            <p className="text-xs text-[#BDBDBD] mt-1">Try selecting another CEFR level above.</p>
          </div>
        )}

        {/* Done screen */}
        {!loading && done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.10)] border-2 border-[#EAEAEA]"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl" style={{ background: tierStyle.bg }}>
              🏆
            </div>
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-1">Speaking Lab Complete!</h2>
            <p className="text-sm font-bold text-[#757575] mb-4">
              {score.correct} / {score.total} correct ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)
            </p>
            <div className="h-3 bg-[#F0F0F0] rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score.total > 0 ? (score.correct / score.total) * 100 : 0}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{ background: tierStyle.color }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => loadExercises(selectedTier)}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white transition-all flex items-center justify-center gap-1.5"
                style={{ background: tierStyle.color, boxShadow: `0 3px 0 ${tierStyle.shadow}` }}
              >
                <RefreshCw size={15} /> Practice Again
              </button>
              <button
                onClick={() => router.push('/practice')}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-[#F5F6FA] text-[#757575] hover:bg-[#EBEBEB] transition-all border border-[#EAEAEA]"
              >
                Practice Hub →
              </button>
            </div>
          </motion.div>
        )}

        {/* Exercise card */}
        {!loading && !done && ex && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs font-black text-[#9E9E9E]">
              <span>Exercise {current + 1} of {exercises.length}</span>
              <span className="text-[#D81B60]">{score.correct} correct</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progress}%` }}
                style={{ background: '#D81B60' }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_6px_25px_rgba(0,0,0,0.06)] border-2 border-[#EAEAEA] flex flex-col gap-6"
              >
                {/* Audio Player Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playAudio(ex.audioText ?? ex.prompt)}
                    disabled={audioLoading}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: '#D81B60',
                      boxShadow: `0 3px 0 #AD1457`,
                    }}
                  >
                    {audioLoading ? (
                      <Loader size={17} className="animate-spin" />
                    ) : (
                      <Volume2 size={17} className={isPlayingAudio ? 'animate-bounce' : ''} />
                    )}
                    <span>{isPlayingAudio ? 'Playing Audio 🔊...' : 'Listen to Native 🔊'}</span>
                  </button>
                  <span className="text-xs font-bold text-[#9E9E9E]">Listen first, then speak</span>
                </div>

                {/* Bilingual Question Block */}
                <div className="space-y-2 p-6 rounded-2xl bg-[#FCE4EC] border-2 border-[#F8BBD0] text-center">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#D81B60]">Say this aloud</p>
                  <p className="text-2xl md:text-3xl font-black text-[#880E4F] leading-snug">
                    {ex.prompt}
                  </p>
                  {ex.promptEn && (
                     <p className="text-xs md:text-sm font-semibold text-[#AD1457] mt-3">
                       {ex.promptEn}
                     </p>
                  )}
                </div>

                {/* Microphone / Recording Section */}
                {recordState !== 'done' ? (
                   <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-6">
                    <motion.button
                      type="button"
                      onClick={toggleRecording}
                      disabled={recordState !== 'idle' && recordState !== 'listening'}
                      whileTap={{ scale: 0.94 }}
                      className={`flex h-24 w-24 items-center justify-center rounded-full border-b-4 text-white shadow-lg transition-colors ${
                        recordState === 'listening'
                          ? 'animate-pulse border-[#AD1457] bg-[#D81B60]'
                          : 'border-[#1565C0] bg-[#1E88E5] hover:bg-[#1976D2]'
                      }`}
                    >
                      {recordState === 'listening' ? <Square size={32} className="fill-current" /> : <Mic size={38} />}
                    </motion.button>
                    <p className="text-sm font-bold text-[#757575]">
                      {recordState === 'listening' ? 'Listening... (Tap to stop)' : recordState === 'scoring' ? 'Scoring...' : 'Tap to speak'}
                    </p>

                    {!supported && (
                      <div className="mt-4 space-y-3 text-center">
                        <p className="max-w-xs text-xs font-bold text-[#FF9F43]">
                          This browser can't score speech automatically.
                        </p>
                        <button
                          type="button"
                          onClick={handleSelfReport}
                          className="px-5 py-2.5 rounded-xl border-2 border-[#1E88E5] text-[#1E88E5] text-xs font-bold hover:bg-[#E3F2FD] transition-colors"
                        >
                          I said it out loud
                        </button>
                      </div>
                    )}
                    
                    {/* Navigation Controls (when not done) */}
                    <div className="w-full flex justify-between mt-4 pt-4 border-t-2 border-dashed border-gray-100">
                      <button
                        onClick={handlePrev}
                        disabled={current === 0 || recordState !== 'idle'}
                        className={`text-sm font-bold ${current === 0 ? 'text-gray-300' : 'text-[#757575] hover:text-[#1A1A2E]'}`}
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={handleNextSkip}
                        disabled={recordState !== 'idle'}
                        className="text-sm font-bold text-[#757575] hover:text-[#1A1A2E]"
                      >
                        {current + 1 >= exercises.length ? 'Finish →' : 'Skip →'}
                      </button>
                    </div>

                  </motion.div>
                ) : (
                  <motion.div key="score" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 py-4">
                    <div className="flex justify-center gap-2 text-4xl mb-4">
                      {[1, 2, 3].map((s) => (
                        <motion.span
                          key={s}
                          initial={{ y: 14, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: s * 0.12 }}
                          className={s <= stars ? '' : 'opacity-20 grayscale'}
                        >
                          ⭐
                        </motion.span>
                      ))}
                    </div>
                    
                    <div className="text-center">
                       <p className="text-sm font-bold text-gray-500">
                        Heard: <span className={normalizeText(heard) ? 'text-gray-900 font-black' : 'text-gray-400'}>{heard || '(nothing clearly heard)'}</span>
                      </p>
                    </div>

                    {isCurrentCorrect ? (
                      <div className="p-3.5 rounded-2xl bg-[#E8FBF0] border-2 border-[#A5D6A7] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{currentPraise.emoji}</span>
                          <div>
                            <p className="text-xs md:text-sm font-black text-[#2E7D32]">
                              {currentPraise.grade} · {currentPraise.subtitle}
                            </p>
                            <p className="text-[11px] font-bold text-[#388E3C]">
                              +{ex.points || 5} Points earned!
                            </p>
                          </div>
                        </div>
                        <Award className="text-[#20BF6B]" size={24} />
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFCDD2] flex items-center gap-2.5">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="text-xs md:text-sm font-black text-[#C62828]">
                            Not quite right!
                          </p>
                          <p className="text-[11px] font-bold text-[#D32F2F]">
                            Try to match the native pronunciation more closely.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Next / Retry Buttons */}
                    <div className="flex flex-col gap-3 mt-4">
                      <button
                        onClick={handleNextSkip}
                        className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all shadow-[0_3px_0_rgba(0,0,0,0.15)] hover:translate-y-[1px] hover:shadow-[0_2px_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
                        style={{
                          background: '#D81B60',
                          boxShadow: `0 3px 0 #AD1457`,
                        }}
                      >
                        {current + 1 >= exercises.length ? 'See Results 🏅' : 'Continue to Next Sentence →'}
                      </button>

                      <button
                        onClick={handleRetry}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#F5F6FA] text-[#757575] border-2 border-[#EAEAEA] hover:bg-[#EBEBEB] transition-colors"
                      >
                        🎤 Speak Again
                      </button>
                    </div>

                    {/* Navigation Controls (when done) */}
                    <div className="w-full flex justify-between mt-2 pt-2 border-t-2 border-dashed border-gray-100">
                      <button
                        onClick={handlePrev}
                        disabled={current === 0}
                        className={`text-sm font-bold ${current === 0 ? 'text-gray-300' : 'text-[#757575] hover:text-[#1A1A2E]'}`}
                      >
                        ← Previous
                      </button>
                    </div>

                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
