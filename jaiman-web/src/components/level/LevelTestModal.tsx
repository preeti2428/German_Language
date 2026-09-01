'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Sparkles, Volume2, Lightbulb, Award, CheckCircle2,
  XCircle, Zap, Clock, ChevronRight, RotateCcw, Trophy, Check, X
} from 'lucide-react';
import api from '@/lib/api';
import { speakGerman } from '@/lib/speech';
import { recordActivity } from '@/lib/streak';
import { useAuth } from '@/context/AuthContext';

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
  xpEarned?: number;
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

function playSound(type: 'correct' | 'wrong') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.35);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(190, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.23);
    }
  } catch {
    // Ignore audio restrictions
  }
}

export default function LevelTestModal() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'placement' | 'check'>('placement'); // 'placement' = 30Q (first time), 'check' = 10Q (returning)
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [praiseIndex, setPraiseIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  // Check on mount or when user updates whether modal should pop up
  useEffect(() => {
    if (!user) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const sessionDismissedKey = `jaiman.level_modal_dismissed_${user.id || (user as any)._id}_${todayStr}`;
    const wasDismissedToday = sessionStorage.getItem(sessionDismissedKey);

    // Condition 1: First time user (has NOT completed initial 30-question placement test)
    if (!user.hasCompletedPlacementTest) {
      setMode('placement');
      setIsOpen(true);
      return;
    }

    // Condition 2: Returning user (already completed placement test)
    // Show 10-question daily level check if not completed today and not dismissed in this session
    if (user.lastLevelCheckDate !== todayStr && !wasDismissedToday) {
      setMode('check');
      setIsOpen(true);
    }
  }, [user]);

  const loadQuestions = async (selectedMode: 'placement' | 'check') => {
    setLoading(true);
    try {
      const endpoint = selectedMode === 'placement' ? '/quiz/level-test?mode=placement' : '/quiz/level-test?mode=check&count=10';
      const { data } = await api.get(endpoint);
      setQuestions(data.questions || []);
      setPhase('test');
      setCurrent(0);
      setAnswers({});
      setSelected(null);
      setHasAnswered(false);
    } catch (err) {
      console.error('Failed to load level test:', err);
      alert('Unable to load test questions. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[current];
  const isCorrect = selected && currentQ?.correct ? selected.trim() === currentQ.correct.trim() : false;

  const handleSelect = (option: string) => {
    if (hasAnswered) return;
    setSelected(option);
    setHasAnswered(true);

    const correct = currentQ?.correct ? option.trim() === currentQ.correct.trim() : false;
    if (correct) {
      playSound('correct');
      setPraiseIndex(Math.floor(Math.random() * PRAISE_MESSAGES.length));
    } else {
      playSound('wrong');
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
      const questionIds = questions.map((q) => q.id);
      const { data } = await api.post('/quiz/level-test/submit', {
        answers: finalAnswers,
        questionIds,
        mode,
      });

      setResult(data);
      setPhase('result');
      if (data.xpEarned) {
        recordActivity(data.xpEarned);
      }
      await refreshUser();
    } catch (err) {
      console.error('Failed to submit test:', err);
      alert('Failed to save test result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndClose = () => {
    if (user) {
      const todayStr = new Date().toISOString().split('T')[0];
      sessionStorage.setItem(`jaiman.level_modal_dismissed_${user.id || (user as any)._id}_${todayStr}`, 'true');
    }
    setIsOpen(false);
    setPhase('intro');
  };

  const handleCloseModal = () => {
    if (user) {
      const todayStr = new Date().toISOString().split('T')[0];
      sessionStorage.setItem(`jaiman.level_modal_dismissed_${user.id || (user as any)._id}_${todayStr}`, 'true');
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] border-2 border-b-[6px] border-[#EAEAEA] border-b-[#4361EE] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#F0F0F0] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-base shadow-[0_2px_0_#3046B2]">
              🎯
            </div>
            <div>
              <p className="text-xs font-black text-[#1A1A2E]">
                Level Test
              </p>
              <p className="text-[10px] font-bold text-[#757575]">
                {mode === 'placement' ? '30 Questions · A1 to B2' : '10 Quick Practice Questions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
              style={{
                background: mode === 'placement' ? '#FFF5F5' : '#E8FBF0',
                color: mode === 'placement' ? '#E53935' : '#20BF6B',
                border: `1px solid ${mode === 'placement' ? '#FFCDD2' : '#A5D6A7'}`,
              }}
            >
              {mode === 'placement' ? 'Placement Test' : 'Quick Check'}
            </span>

            {/* Persistent Close / Cross button */}
            <button
              onClick={handleCloseModal}
              className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#FFCDD2] hover:text-[#E53935] flex items-center justify-center text-[#9E9E9E] transition-all cursor-pointer shadow-xs"
              title="Close Test"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar (during test phase) */}
        {phase === 'test' && (
          <div className="w-full h-2 bg-[#F0F0F0] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#4361EE] to-[#20BF6B]"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* ── PHASE 1: INTRO ── */}
          {phase === 'intro' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center flex flex-col items-center py-2"
            >
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-4xl shadow-[0_4px_0_rgba(0,0,0,0.1)]"
                style={{ background: mode === 'placement' ? '#EEF2FF' : '#E8FBF0' }}
              >
                {mode === 'placement' ? '🎯' : '⚡'}
              </div>

              <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">
                {mode === 'placement' ? 'Find Your German Level!' : 'Daily 10-Question Checkup!'}
              </h2>

              <p className="text-xs md:text-sm text-[#757575] font-medium leading-relaxed mb-6 max-w-sm">
                {mode === 'placement'
                  ? 'Welcome! Complete this 30-question diagnostic test to assess your German level (A1–B2) and personalize your Germany Journey roadmap before exploring.'
                  : 'Welcome back! Test your memory with 10 adaptive questions to maintain your level, warm up your German, and earn bonus XP!'}
              </p>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <div className="bg-[#F8F9FF] rounded-2xl p-3.5 border border-[#EAEAEA]">
                  <p className="text-xl font-black text-[#4361EE]">{totalQCount} Questions</p>
                  <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wide">
                    {mode === 'placement' ? 'Comprehensive' : 'Quick Check'}
                  </p>
                </div>
                <div className="bg-[#F8F9FF] rounded-2xl p-3.5 border border-[#EAEAEA]">
                  <p className="text-xl font-black text-[#20BF6B]">
                    {mode === 'placement' ? 'A1 → B2' : '+25 XP'}
                  </p>
                  <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wide">
                    {mode === 'placement' ? 'Levels Evaluated' : 'Daily Reward'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => loadQuestions(mode)}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#4361EE] text-white font-black text-sm shadow-[0_4px_0_#3046B2] hover:shadow-[0_2px_0_#3046B2] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Preparing Questions...' : mode === 'placement' ? 'Start 30-Question Level Test 🚀' : 'Start 10-Question Level Test ⚡'}
              </button>

              <button
                onClick={handleCloseModal}
                className="mt-3 text-xs font-bold text-[#9E9E9E] hover:text-[#1A1A2E] transition-colors cursor-pointer"
              >
                Skip for now & Explore Platform →
              </button>
            </motion.div>
          )}

          {/* ── PHASE 2: TEST IN PROGRESS ── */}
          {phase === 'test' && currentQ && (
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                {/* Question Info Bar */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-[#1A1A2E]">
                    Question {current + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-black"
                      style={{ background: tierColor + '20', color: tierColor, border: `1px solid ${tierColor}40` }}
                    >
                      {currentQ.tier}
                    </span>
                    <button
                      onClick={() => speakGerman(currentQ.question)}
                      className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#EEF2FF] text-[#4361EE] transition-colors"
                      title="Pronounce question"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Bilingual Question Display */}
                <div className="space-y-1.5 mb-5 bg-[#FBFBFF] p-4 rounded-2xl border border-[#EAEAEA]">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-black uppercase text-[#E53935] px-1.5 py-0.5 rounded bg-[#FFF5F5] border border-[#FFCDD2] flex-shrink-0 mt-0.5">
                      🇩🇪 DE
                    </span>
                    <p className="text-base md:text-lg font-black text-[#1A1A2E] leading-snug">
                      {currentQ.question}
                    </p>
                  </div>

                  {currentQ.questionEn && (
                    <div className="flex items-start gap-2 pl-0.5 pt-1">
                      <span className="text-[10px] font-black uppercase text-[#4361EE] px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C5D0FF] flex-shrink-0 mt-0.5">
                        🇬🇧 EN
                      </span>
                      <p className="text-xs font-semibold text-[#555] leading-snug">
                        {currentQ.questionEn}
                      </p>
                    </div>
                  )}
                </div>

                {/* Options Grid */}
                <div className="flex flex-col gap-2.5 mb-4">
                  {currentQ.options.map((option, idx) => {
                    const isThisSelected = selected === option;
                    const isThisCorrect = currentQ.correct ? option.trim() === currentQ.correct.trim() : false;

                    let optionStyle = 'border-[#EAEAEA] bg-white text-[#1A1A2E] hover:border-[#4361EE] hover:bg-[#F8F9FF]';

                    if (hasAnswered) {
                      if (isThisCorrect) {
                        optionStyle = 'border-[#20BF6B] bg-[#E8FBF0] text-[#1E7E34] font-black ring-2 ring-[#20BF6B]/30';
                      } else if (isThisSelected && !isThisCorrect) {
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

                {/* Feedback / Praise */}
                {hasAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2.5 mb-4"
                  >
                    {isCorrect ? (
                      <div className="p-3 rounded-xl bg-[#E8FBF0] border border-[#A5D6A7] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{currentPraise.emoji}</span>
                          <div>
                            <p className="text-xs font-black text-[#2E7D32]">
                              {currentPraise.grade} · {currentPraise.subtitle}
                            </p>
                            <p className="text-[10px] font-bold text-[#388E3C]">Correct Answer!</p>
                          </div>
                        </div>
                        <Award className="text-[#20BF6B]" size={20} />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FFCDD2] flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className="text-xs font-black text-[#C62828]">Not quite!</p>
                          <p className="text-[11px] font-bold text-[#D32F2F]">
                            Correct: <strong>{currentQ.correct}</strong>
                          </p>
                        </div>
                      </div>
                    )}

                    {currentQ.explanation && (
                      <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#EAEAEA] text-[11px] font-medium text-[#555] space-y-0.5">
                        <p className="font-bold text-[#1A1A2E] flex items-center gap-1">
                          <Lightbulb size={12} className="text-[#FF9F43]" /> Explanation:
                        </p>
                        <p className="leading-relaxed">{currentQ.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!hasAnswered || loading}
                  className="w-full py-3.5 rounded-2xl bg-[#4361EE] text-white font-black text-xs md:text-sm shadow-[0_4px_0_#3046B2] hover:shadow-[0_2px_0_#3046B2] hover:translate-y-[2px] transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading
                    ? 'Processing Result...'
                    : hasAnswered
                    ? current + 1 < questions.length
                      ? 'Next Question →'
                      : 'Complete Test & View Level 🎯'
                    : 'Select an Option Above ☝️'}
                </button>
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── PHASE 3: RESULT SCREEN ── */}
          {phase === 'result' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center flex flex-col items-center py-2"
            >
              <div
                className="w-20 h-20 mx-auto mb-3 rounded-3xl flex items-center justify-center text-4xl shadow-[0_4px_0_rgba(0,0,0,0.1)]"
                style={{ background: (TIER_COLORS[result.detectedLevel] || '#4361EE') + '22' }}
              >
                🏆
              </div>

              <p className="text-[11px] font-black uppercase tracking-widest text-[#9E9E9E] mb-0.5">
                {mode === 'placement' ? 'Your Placement Level' : 'Level Verified'}
              </p>
              <h2
                className="text-5xl font-black mb-1"
                style={{ color: TIER_COLORS[result.detectedLevel] || '#4361EE' }}
              >
                {result.detectedLevel}
              </h2>
              <p className="text-xs font-bold text-[#757575] mb-5">
                Score: {result.score}/{result.maxScore} ({result.percentage}%) · +{result.xpEarned || (mode === 'placement' ? 50 : 25)} XP Earned! 🔥
              </p>

              {/* Progress Bar */}
              <div className="h-2.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden mb-5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.percentage}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: TIER_COLORS[result.detectedLevel] || '#4361EE' }}
                />
              </div>

              {/* Level Breakdown */}
              <div className="grid grid-cols-4 gap-2 w-full mb-6">
                {['A1', 'A2', 'B1', 'B2'].map((tier) => {
                  const tierQs = result.breakdown.filter((b) => b.tier === tier);
                  const correct = tierQs.filter((b) => b.correct).length;
                  const total = tierQs.length;
                  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                  return (
                    <div key={tier} className="bg-[#F8F9FF] rounded-2xl p-2 text-center border border-[#EAEAEA]">
                      <p className="text-[10px] font-black uppercase" style={{ color: TIER_COLORS[tier] }}>
                        {tier}
                      </p>
                      <p className="text-sm font-black text-[#1A1A2E]">
                        {correct}/{total}
                      </p>
                      <p className="text-[9px] font-bold text-[#9E9E9E]">{pct}%</p>
                    </div>
                  );
                })}
              </div>

              {/* Finish & Explore Button */}
              <button
                onClick={handleFinishAndClose}
                className="w-full py-4 rounded-2xl font-black text-sm text-white shadow-[0_4px_0_rgba(0,0,0,0.15)] hover:shadow-[0_2px_0_rgba(0,0,0,0.15)] hover:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ background: TIER_COLORS[result.detectedLevel] || '#4361EE' }}
              >
                <span>🎉 Level Saved! Explore Platform</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
