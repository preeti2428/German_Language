'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Volume2, Loader, Check, X, RefreshCw,
  Sparkles, Award, Lightbulb, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ListeningExercise {
  stageId: string;
  theme: string;
  cityName: string;
  sessionTitle?: string;
  type: string;
  prompt: string;
  promptEn?: string;
  audioText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
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

export default function ListeningLabPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState(user?.level ?? 'A1');
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [praiseIndex, setPraiseIndex] = useState(0);
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tierStyle = TIER_COLORS[selectedTier] ?? TIER_COLORS.A1;

  const loadExercises = async (tier: string) => {
    setLoading(true);
    setAnswered({});
    setCurrent(0);
    setDone(false);
    setScore({ correct: 0, total: 0 });
    try {
      const { data } = await api.get(`/quiz/listening?tier=${tier}`);
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
      // Fallback: browser SpeechSynthesis
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'de-DE';
      utter.rate = 0.8;
      utter.onend = () => setIsPlayingAudio(false);
      speechSynthesis.speak(utter);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (answered[current] !== undefined) return;
    const ex = exercises[current];
    const isCorrect = option.trim().toLowerCase() === ex.correctAnswer?.trim().toLowerCase();
    setAnswered((prev) => ({ ...prev, [current]: option }));
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
  };

  const handleNext = () => {
    if (current + 1 >= exercises.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const ex = exercises[current];
  const userAnswer = answered[current];
  const isCurrentCorrect =
    userAnswer && ex?.correctAnswer
      ? userAnswer.trim().toLowerCase() === ex.correctAnswer.trim().toLowerCase()
      : false;
  const progress = exercises.length > 0 ? ((current + (userAnswer ? 1 : 0)) / exercises.length) * 100 : 0;
  const currentPraise = PRAISE_MESSAGES[praiseIndex];

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8">
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
              <h1 className="text-xl font-black text-[#1A1A2E]">🎧 Listening Lab</h1>
              <p className="text-xs text-[#9E9E9E] font-medium">Listen carefully to spoken German, then answer</p>
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
            <p className="text-sm font-bold text-[#9E9E9E]">Loading {selectedTier} listening exercises...</p>
          </div>
        )}

        {/* No exercises */}
        {!loading && exercises.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-2 border-[#EAEAEA]">
            <p className="text-4xl mb-3">🔇</p>
            <p className="text-sm font-bold text-[#757575]">No listening exercises found for {selectedTier}.</p>
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
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-1">Listening Lab Complete!</h2>
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
              <span className="text-[#20BF6B]">{score.correct} correct</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progress}%` }}
                style={{ background: tierStyle.color }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_6px_25px_rgba(0,0,0,0.06)] border-2 border-[#EAEAEA] space-y-6"
              >
                {/* Audio Player Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playAudio(ex.audioText ?? ex.prompt)}
                    disabled={audioLoading}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: tierStyle.color,
                      boxShadow: `0 3px 0 ${tierStyle.shadow}`,
                    }}
                  >
                    {audioLoading ? (
                      <Loader size={17} className="animate-spin" />
                    ) : (
                      <Volume2 size={17} className={isPlayingAudio ? 'animate-bounce' : ''} />
                    )}
                    <span>{isPlayingAudio ? 'Playing Audio 🔊...' : 'Play Audio 🔊'}</span>
                  </button>
                  <span className="text-xs font-bold text-[#9E9E9E]">Tap to hear the German pronunciation</span>
                </div>

                {/* Bilingual Question Block */}
                <div className="space-y-2 p-4 rounded-2xl bg-[#F8F9FA] border border-[#EAEAEA]">
                  {/* German Prompt */}
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-black uppercase text-[#E53935] px-1.5 py-0.5 rounded bg-[#FFF5F5] border border-[#FFCDD2] flex-shrink-0 mt-0.5">
                      🇩🇪 DE
                    </span>
                    <p className="text-sm md:text-base font-black text-[#1A1A2E] leading-snug">
                      {ex.prompt}
                    </p>
                  </div>

                  {/* English Helper Translation */}
                  {ex.promptEn && (
                    <div className="flex items-start gap-2 pt-1 border-t border-[#EAEAEA]/70">
                      <span className="text-[10px] font-black uppercase text-[#4361EE] px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C5D0FF] flex-shrink-0 mt-0.5">
                        🇬🇧 EN
                      </span>
                      <p className="text-xs md:text-sm font-semibold text-[#666] leading-snug">
                        {ex.promptEn}
                      </p>
                    </div>
                  )}
                </div>

                {/* Options Grid */}
                <div className="flex flex-col gap-3">
                  {(ex.options ?? []).map((option) => {
                    const isSelected = userAnswer === option;
                    const isCorrect = option.trim().toLowerCase() === ex.correctAnswer?.trim().toLowerCase();
                    const showResult = userAnswer !== undefined;

                    let style = 'border-[#EAEAEA] bg-white text-[#1A1A2E] hover:border-[#4361EE] hover:bg-[#F8F9FF]';
                    if (showResult) {
                      if (isCorrect) {
                        style = 'border-[#20BF6B] bg-[#E8FBF0] text-[#1E7E34] font-black ring-2 ring-[#20BF6B]/30';
                      } else if (isSelected && !isCorrect) {
                        style = 'border-[#E53935] bg-[#FFF5F5] text-[#C62828] font-black';
                      } else {
                        style = 'border-[#EAEAEA] bg-gray-50 text-[#9E9E9E] opacity-60';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={userAnswer !== undefined}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-xs md:text-sm font-bold transition-all flex items-center justify-between ${style}`}
                      >
                        <span>{option}</span>
                        {showResult && isCorrect && <CheckCircle2 size={18} className="text-[#20BF6B]" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={18} className="text-[#E53935]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback & Praise Cards */}
                {userAnswer !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-2"
                  >
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
                            Nicht ganz! (Not quite!)
                          </p>
                          <p className="text-[11px] font-bold text-[#D32F2F]">
                            Correct answer: <strong>{ex.correctAnswer}</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Explanation Box */}
                    {ex.explanation && (
                      <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#EAEAEA] text-xs font-medium text-[#555] space-y-1">
                        <p className="font-bold text-[#1A1A2E] flex items-center gap-1.5">
                          <Lightbulb size={13} className="text-[#FF9F43]" /> Explanation:
                        </p>
                        <p className="leading-relaxed">{ex.explanation}</p>
                      </div>
                    )}

                    {/* Next Button */}
                    <button
                      onClick={handleNext}
                      className="w-full py-4 rounded-2xl font-black text-sm text-white transition-all shadow-[0_3px_0_rgba(0,0,0,0.15)] hover:shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:translate-y-[2px] flex items-center justify-center gap-2"
                      style={{
                        background: tierStyle.color,
                        boxShadow: `0 3px 0 ${tierStyle.shadow}`,
                      }}
                    >
                      {current + 1 >= exercises.length ? 'See Results 🏅' : 'Continue to Next Audio →'}
                    </button>
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
