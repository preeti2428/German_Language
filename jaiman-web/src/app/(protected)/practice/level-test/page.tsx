'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Check, X, Trophy, RotateCcw,
  Target, Sparkles, Volume2, Lightbulb, ArrowRight, Award, CheckCircle2, XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Question {
  id: number;
  tier: string;
  skillType: string;
  question: string;
  questionEn?: string;
  options: string[];
  correct?: string;
  explanation?: string;
  points: number;
}

interface Result {
  score: number;
  maxScore: number;
  percentage: number;
  detectedLevel: string;
  breakdown: { id: number; correct: boolean; tier: string }[];
}

const TIER_COLORS: Record<string, string> = {
  A1: '#20BF6B',
  A2: '#4361EE',
  B1: '#FF9F43',
  B2: '#CE82FF',
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

export default function LevelTestPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [praiseIndex, setPraiseIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const loadTest = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/quiz/level-test');
      setQuestions(data.questions);
      setPhase('test');
      setCurrent(0);
      setAnswers({});
      setSelected(null);
      setHasAnswered(false);
      setStartTime(Date.now());
    } catch {
      alert('Failed to load test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[current];
  const isCorrect = selected && currentQ?.correct ? selected.trim() === currentQ.correct.trim() : false;

  const handleSelect = (option: string) => {
    if (hasAnswered) return; // lock after selecting
    setSelected(option);
    setHasAnswered(true);

    const correct = currentQ?.correct ? option.trim() === currentQ.correct.trim() : false;
    if (correct) {
      playWinningSound();
      setPraiseIndex(Math.floor(Math.random() * PRAISE_MESSAGES.length));
    } else {
      playWrongSound();
    }
  };

  const handleContinue = () => {
    if (!selected || !currentQ) return;

    const newAnswers = { ...answers, [currentQ.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    setHasAnswered(false);

    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      submitTest(newAnswers);
    }
  };

  const submitTest = async (finalAnswers: Record<number, string>) => {
    setLoading(true);
    try {
      const { data } = await api.post('/quiz/level-test/submit', { answers: finalAnswers });
      setResult(data);
      setPhase('result');
    } catch {
      alert('Failed to submit test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;
  const currentPraise = PRAISE_MESSAGES[praiseIndex];

  // ── Intro Screen ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6 relative">
        {/* Floating Top Left Back Button */}
        <button
          onClick={() => router.push('/practice')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#EAEAEA] text-[#1A1A2E] text-xs font-black shadow-sm hover:border-[#1A1A2E] hover:scale-105 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
          <span>Back to Practice</span>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_8px_40px_rgba(0,0,0,0.10)] text-center border-2 border-[#EAEAEA] relative"
        >
          {/* Card Top Left Back Arrow */}
          <button
            onClick={() => router.push('/practice')}
            className="absolute top-5 left-5 p-2 rounded-xl border border-[#EAEAEA] bg-white text-[#757575] hover:text-[#1A1A2E] hover:border-[#1A1A2E] transition-all flex items-center justify-center cursor-pointer"
            title="Back to Practice"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-[#EEF2FF] flex items-center justify-center text-4xl shadow-[0_4px_0_#3046B2]">
            🎯
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E] mb-2">German Level Placement Test</h1>
          <p className="text-xs md:text-sm text-[#757575] font-medium mb-6 leading-relaxed">
            30 bilingual questions (English & German) across <strong>A1 → B2</strong> with instant feedback & explanations.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Questions', value: '30' },
              { label: 'Language', value: 'DE / EN' },
              { label: 'Levels Tested', value: 'A1–B2' },
              { label: 'Feedback', value: 'Instant' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#F8F9FF] rounded-2xl p-3 border border-[#EAEAEA]">
                <p className="text-lg font-black text-[#4361EE]">{stat.value}</p>
                <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={loadTest}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#4361EE] text-white font-black text-sm shadow-[0_4px_0_#3046B2] hover:shadow-[0_2px_0_#3046B2] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Preparing Questions...' : 'Start Placement Test 🚀'}
          </button>

          <button
            onClick={() => router.push('/practice')}
            className="mt-4 text-xs font-bold text-[#9E9E9E] hover:text-[#1A1A2E] transition-colors block mx-auto cursor-pointer"
          >
            ← Back to Practice Hub
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Result Screen ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const levelColor = TIER_COLORS[result.detectedLevel] ?? '#757575';

    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4 md:p-6 relative">
        {/* Floating Top Left Back Button */}
        <button
          onClick={() => router.push('/practice')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#EAEAEA] text-[#1A1A2E] text-xs font-black shadow-sm hover:border-[#1A1A2E] hover:scale-105 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
          <span>Back to Practice</span>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_8px_40px_rgba(0,0,0,0.10)] text-center border-2 border-[#EAEAEA] relative"
        >
          {/* Card Top Left Back Arrow */}
          <button
            onClick={() => router.push('/practice')}
            className="absolute top-5 left-5 p-2 rounded-xl border border-[#EAEAEA] bg-white text-[#757575] hover:text-[#1A1A2E] hover:border-[#1A1A2E] transition-all flex items-center justify-center cursor-pointer"
            title="Back to Practice"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl shadow-[0_4px_0_rgba(0,0,0,0.12)]"
            style={{ background: levelColor + '22' }}
          >
            🏆
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-[#9E9E9E] mb-1">Your German Level</p>
          <h2 className="text-5xl font-black mb-1" style={{ color: levelColor }}>
            {result.detectedLevel}
          </h2>
          <p className="text-sm font-bold text-[#757575] mb-5">
            Score: {result.score}/{result.maxScore} ({result.percentage}%) · {timeTaken} min
          </p>

          {/* Score bar */}
          <div className="h-3 rounded-full bg-[#F0F0F0] overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.percentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: levelColor }}
            />
          </div>

          {/* Tier breakdown */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {['A1', 'A2', 'B1', 'B2'].map((tier) => {
              const tierQuestions = result.breakdown.filter((b) => b.tier === tier);
              const correct = tierQuestions.filter((b) => b.correct).length;
              const total = tierQuestions.length;
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
              return (
                <div key={tier} className="bg-[#F8F9FF] rounded-2xl p-2.5 text-center border border-[#EAEAEA]">
                  <p className="text-[10px] font-black uppercase" style={{ color: TIER_COLORS[tier] }}>
                    {tier}
                  </p>
                  <p className="text-base font-black text-[#1A1A2E]">
                    {correct}/{total}
                  </p>
                  <p className="text-[9px] font-bold text-[#9E9E9E]">{pct}%</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/practice/test-series')}
              className="w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] hover:shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:translate-y-[2px] transition-all cursor-pointer"
              style={{ background: levelColor }}
            >
              Practice {result.detectedLevel} Test Papers →
            </button>
            <button
              onClick={() => {
                setPhase('intro');
                setCurrent(0);
                setAnswers({});
                setResult(null);
                setHasAnswered(false);
                setSelected(null);
              }}
              className="w-full py-3 rounded-2xl bg-[#F5F6FA] font-black text-xs text-[#757575] hover:bg-[#EBEBEB] transition-all flex items-center justify-center gap-2 border border-[#EAEAEA] cursor-pointer"
            >
              <RotateCcw size={14} /> Retake Level Test
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Test Screen ───────────────────────────────────────────────────────────
  if (!currentQ) return null;
  const tierColor = TIER_COLORS[currentQ.tier] ?? '#757575';

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8 flex flex-col justify-between">
      {/* Progress Header */}
      <div className="max-w-xl mx-auto w-full mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={() => router.push('/practice')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EAEAEA] text-[#757575] hover:text-[#1A1A2E] text-xs font-bold transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#1A1A2E]">
              Question {current + 1} of {questions.length}
            </span>
          </div>

          <span
            className="px-2.5 py-1 rounded-xl text-xs font-black"
            style={{ background: tierColor + '20', color: tierColor, border: `1px solid ${tierColor}40` }}
          >
            {currentQ.tier} · {currentQ.points} pt{currentQ.points > 1 ? 's' : ''}
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#4361EE]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="max-w-xl mx-auto w-full bg-white rounded-3xl p-6 md:p-8 shadow-[0_6px_25px_rgba(0,0,0,0.06)] border-2 border-[#EAEAEA] flex-1 flex flex-col justify-between"
        >
          <div>
            {/* Tag / Category */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-lg"
                style={{ background: tierColor + '20', color: tierColor }}
              >
                {currentQ.skillType === 'vocab' ? '📖 Wortschatz (Vocabulary)' : '📐 Grammatik (Grammar)'}
              </span>
            </div>

            {/* Bilingual Question Block */}
            <div className="space-y-1.5 mb-6">
              {/* German Question */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-black uppercase text-[#E53935] px-1.5 py-0.5 rounded bg-[#FFF5F5] border border-[#FFCDD2] flex-shrink-0 mt-0.5">
                  🇩🇪 DE
                </span>
                <p className="text-base md:text-lg font-black text-[#1A1A2E] leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {/* English Helper Translation */}
              {currentQ.questionEn && (
                <div className="flex items-start gap-2 pl-0.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-[#4361EE] px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C5D0FF] flex-shrink-0 mt-0.5">
                    🇬🇧 EN
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-[#555] leading-snug">
                    {currentQ.questionEn}
                  </p>
                </div>
              )}
            </div>

            {/* Options Grid */}
            <div className="flex flex-col gap-3">
              {currentQ.options.map((option, idx) => {
                const isThisSelected = selected === option;
                const isThisCorrect = currentQ.correct ? option.trim() === currentQ.correct.trim() : false;

                let optionStyle = 'border-[#EAEAEA] bg-white text-[#1A1A2E] hover:border-[#4361EE] hover:bg-[#F8F9FF]';

                if (hasAnswered) {
                  if (isThisCorrect) {
                    // Correct answer glowing green
                    optionStyle = 'border-[#20BF6B] bg-[#E8FBF0] text-[#1E7E34] font-black ring-2 ring-[#20BF6B]/30';
                  } else if (isThisSelected && !isThisCorrect) {
                    // Selected wrong answer red
                    optionStyle = 'border-[#E53935] bg-[#FFF5F5] text-[#C62828] font-black';
                  } else {
                    optionStyle = 'border-[#EAEAEA] bg-gray-50 text-[#9E9E9E] opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-xs md:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{option}</span>

                    {hasAnswered && (
                      <span>
                        {isThisCorrect ? (
                          <CheckCircle2 size={18} className="text-[#20BF6B]" />
                        ) : isThisSelected ? (
                          <XCircle size={18} className="text-[#E53935]" />
                        ) : null}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback & Continue Action */}
          <div className="mt-6 pt-4 border-t border-[#F0F0F0] space-y-4">
            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Praise Banner */}
                {isCorrect ? (
                  <div className="p-3.5 rounded-2xl bg-[#E8FBF0] border-2 border-[#A5D6A7] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{currentPraise.emoji}</span>
                      <div>
                        <p className="text-xs md:text-sm font-black text-[#2E7D32]">
                          {currentPraise.grade} · {currentPraise.subtitle}
                        </p>
                        <p className="text-[11px] font-bold text-[#388E3C]">
                          +{currentQ.points} Point{currentQ.points > 1 ? 's' : ''} earned!
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
                        Correct answer: <strong>{currentQ.correct}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Explanation Box */}
                {currentQ.explanation && (
                  <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#EAEAEA] text-xs font-medium text-[#555] space-y-1">
                    <p className="font-bold text-[#1A1A2E] flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-[#FF9F43]" /> Explanation:
                    </p>
                    <p className="leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Bottom Button */}
            <button
              onClick={handleContinue}
              disabled={!hasAnswered || loading}
              className="w-full py-4 rounded-2xl bg-[#4361EE] text-white font-black text-sm shadow-[0_4px_0_#3046B2] hover:shadow-[0_2px_0_#3046B2] hover:translate-y-[2px] transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading
                ? 'Calculating Level...'
                : hasAnswered
                ? current + 1 < questions.length
                  ? 'Continue to Next Question →'
                  : 'Finish Placement Test 🎯'
                : 'Select an Option Above ☝️'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
