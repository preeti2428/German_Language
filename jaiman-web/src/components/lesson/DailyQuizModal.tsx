'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Volume2, Sparkles, Trophy, Zap, Clock, ChevronRight, RotateCcw, Flame } from 'lucide-react';
import api from '@/lib/api';
import { speakGerman } from '@/lib/speech';
import { recordActivity } from '@/lib/streak';
import { useAuth } from '@/context/AuthContext';

const TOTAL_QUIZ_SECONDS = 300; // 5 Minutes = 300 Seconds

interface Question {
  id: string;
  type: string;
  prompt: string;
  targetWord?: string;
  options: string[];
  correctAnswer: string;
  points?: number;
  tip?: string;
}

interface DailyQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function DailyQuizModal({ isOpen, onClose, onComplete }: DailyQuizModalProps) {
  const { refreshUser } = useAuth();
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Real 5-minute timer state
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_QUIZ_SECONDS);
  const [comboStreak, setComboStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and fetch questions on open
  useEffect(() => {
    if (isOpen) {
      startQuizSession();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // 5-Minute countdown timer loop
  useEffect(() => {
    if (isOpen && !loading && !isFinished) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishQuiz(TOTAL_QUIZ_SECONDS);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, loading, isFinished]);

  const startQuizSession = async () => {
    setLoading(true);
    setSecondsLeft(TOTAL_QUIZ_SECONDS);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setComboStreak(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setEarnedXp(0);
    setIsFinished(false);

    try {
      const res = await api.get('/progress/daily-quiz');
      if (res.data?.questions && res.data.questions.length > 0) {
        setQuestionPool(res.data.questions);
      } else {
        setQuestionPool(FALLBACK_QUESTIONS);
      }
    } catch {
      setQuestionPool(FALLBACK_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const finishQuiz = async (timeSpentSecs: number) => {
    setIsFinished(true);
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalXp = Math.max(30, correctCount * 5 + 20);

    try {
      await api.post('/progress/daily-quiz/complete', {
        score: correctCount,
        totalQuestions: totalAnswered,
        timeSpent: timeSpentSecs,
        xpEarned: finalXp,
        questionsSolved: correctCount,
      });
      recordActivity(finalXp);
      await refreshUser();
      if (onComplete) onComplete();
    } catch {
      recordActivity(finalXp);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questionPool[currentIndex % (questionPool.length || 1)];

  // Time calculations
  const timeElapsed = TOTAL_QUIZ_SECONDS - secondsLeft;
  const timeProgressPct = Math.min(100, (timeElapsed / TOTAL_QUIZ_SECONDS) * 100);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSelect = (option: string) => {
    if (isAnswerChecked) return;
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!selectedOption || !currentQ) return;
    const correct = selectedOption.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setIsAnswerChecked(true);
    setTotalAnswered((t) => t + 1);

    if (correct) {
      setCorrectCount((c) => c + 1);
      setComboStreak((s) => s + 1);
      setEarnedXp((x) => x + (currentQ.points || 10));
    } else {
      setComboStreak(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setIsAnswerChecked(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-[2rem] border-2 border-b-[6px] border-[#EAEAEA] border-b-[#C62828] shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#F0F0F0] bg-white">
          <div className="flex items-center gap-3">
            {/* Live 5-Min Timer Pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-black text-xs transition-all ${
              secondsLeft <= 60
                ? 'bg-[#FFF5F5] border-[#FFCDD2] text-[#E53935] animate-pulse'
                : 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
            }`}>
              <Clock size={14} />
              <span>{formattedTime}</span>
            </div>

            {/* Streak & XP pill */}
            {comboStreak > 1 && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-black text-white bg-[#FF9F43] rounded-full shadow-xs">
                <Flame size={13} className="fill-white" /> {comboStreak}x
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#E53935] bg-[#FFF5F5] border border-[#FFCDD2] px-2.5 py-1 rounded-full">
              +{earnedXp} XP
            </span>
            <button
              onClick={() => {
                if (totalAnswered > 0 && !isFinished) {
                  if (confirm('Finish this 5-minute practice session and save your XP?')) {
                    finishQuiz(timeElapsed);
                  }
                } else {
                  onClose();
                }
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#FFCDD2] hover:text-[#E53935] text-[#9E9E9E] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 5-Minute Time Progress Bar */}
        {!isFinished && (
          <div className="w-full h-2.5 bg-[#F0F0F0] overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#43A047] via-[#FF9F43] to-[#E53935] transition-all duration-1000"
              style={{ width: `${timeProgressPct}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-black text-[#1A1A2E]">Preparing your 5-Minute Practice…</p>
              <p className="text-xs text-[#9E9E9E] mt-1">Pulling real questions & words from your journey</p>
            </div>
          ) : isFinished ? (
            /* Celebration Completion View */
            <div className="flex flex-col items-center py-6 text-center animate-slide-up">
              <div className="relative mb-4">
                <div className="flex items-center justify-center text-6xl w-24 h-24 rounded-3xl bg-[#E8F5E9] border-2 border-b-[5px] border-[#A5D6A7] border-b-[#43A047] shadow-lg">
                  ⏱️
                </div>
                <span className="absolute -bottom-2 -right-2 flex items-center justify-center w-9 h-9 rounded-full bg-[#FFC107] text-[#1A1A2E] shadow-md">
                  <Trophy size={18} />
                </span>
              </div>

              <h2 className="text-2xl font-black text-[#1A1A2E] mb-1">5-Minute Practice Complete!</h2>
              <p className="text-sm font-medium text-[#757575] mb-6">
                You practiced actively for 5 full minutes and strengthened your German memory! 🔥
              </p>

              {/* Stats pill grid */}
              <div className="grid grid-cols-3 gap-3 w-full mb-6">
                <div className="p-3 bg-[#FFF5F5] rounded-2xl border border-[#FFCDD2] border-b-[3px] border-b-[#E53935]">
                  <p className="text-[10px] font-black uppercase text-[#E53935]">XP Earned</p>
                  <p className="text-xl font-black text-[#1A1A2E] mt-0.5">+{Math.max(30, earnedXp)} XP</p>
                </div>
                <div className="p-3 bg-[#E8F5E9] rounded-2xl border border-[#A5D6A7] border-b-[3px] border-b-[#43A047]">
                  <p className="text-[10px] font-black uppercase text-[#43A047]">Solved</p>
                  <p className="text-xl font-black text-[#1A1A2E] mt-0.5">
                    {correctCount}/{totalAnswered}
                  </p>
                </div>
                <div className="p-3 bg-[#FFF8EE] rounded-2xl border border-[#FFE0B2] border-b-[3px] border-b-[#FF9F43]">
                  <p className="text-[10px] font-black uppercase text-[#FF9F43]">Time Practiced</p>
                  <p className="text-xl font-black text-[#1A1A2E] mt-0.5">5:00 ✓</p>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={startQuizSession}
                  className="duo-btn duo-btn-outline flex-1 py-3 text-xs flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} /> Practice Another 5 Min
                </button>
                <button
                  onClick={onClose}
                  className="duo-btn duo-btn-green flex-1 py-3 text-xs flex items-center justify-center gap-2"
                >
                  Done <ChevronRight size={15} />
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question View */
            <div className="flex flex-col">
              {/* Question Header */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1565C0] bg-[#E3F2FD] rounded-full">
                    {currentQ.tip || `Question #${totalAnswered + 1}`}
                  </span>
                  <span className="text-[11px] font-bold text-[#9E9E9E]">
                    {correctCount} correct so far
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[#1A1A2E] leading-snug">
                    {currentQ.prompt}
                  </h3>
                  {currentQ.targetWord && (
                    <button
                      onClick={() => speakGerman(currentQ.targetWord!)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF5F5] hover:bg-[#FFCDD2] text-[#E53935] transition-colors flex-shrink-0"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5 mb-6">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  let cardStyle = 'bg-white border-[#EAEAEA] text-[#1A1A2E] hover:border-[#E53935]';

                  if (isAnswerChecked) {
                    if (opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()) {
                      cardStyle = 'bg-[#E8F5E9] border-[#43A047] text-[#2E7D32] border-b-[#2E7D32] shadow-md';
                    } else if (isSelected) {
                      cardStyle = 'bg-[#FFEBEE] border-[#E53935] text-[#C62828] border-b-[#C62828]';
                    } else {
                      cardStyle = 'bg-[#FAFAFA] border-[#EAEAEA] text-[#BDBDBD] opacity-60';
                    }
                  } else if (isSelected) {
                    cardStyle = 'bg-[#FFF5F5] border-[#E53935] border-b-[#C62828] text-[#E53935] shadow-sm';
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswerChecked}
                      onClick={() => handleSelect(opt)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 border-b-[4px] font-bold text-sm text-left transition-all ${cardStyle}`}
                    >
                      <span className="flex-1">{opt}</span>
                      {isAnswerChecked && opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() && (
                        <Check size={18} className="text-[#43A047]" strokeWidth={3} />
                      )}
                      {isAnswerChecked && isSelected && opt.trim().toLowerCase() !== currentQ.correctAnswer.trim().toLowerCase() && (
                        <X size={18} className="text-[#E53935]" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Banner */}
              {isAnswerChecked && (
                <div
                  className={`p-4 rounded-2xl mb-4 flex items-center justify-between ${
                    isCorrect ? 'bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32]' : 'bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-black flex items-center gap-1.5">
                      {isCorrect ? '🎉 Ausgezeichnet! Correct!' : '❌ Not quite!'}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs font-medium mt-0.5">
                        Correct answer: <span className="font-bold underline">{currentQ.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                  {isCorrect && (
                    <span className="text-xs font-black text-[#2E7D32]">+{currentQ.points || 10} XP</span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isAnswerChecked ? (
                  <button
                    disabled={!selectedOption}
                    onClick={handleCheck}
                    className="duo-btn duo-btn-red py-3.5 text-sm flex-1"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="duo-btn duo-btn-green py-3.5 text-sm flex-1 flex items-center justify-center gap-2"
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                )}

                {/* Finish & Save XP button */}
                {totalAnswered >= 3 && (
                  <button
                    onClick={() => finishQuiz(timeElapsed)}
                    disabled={submitting}
                    className="duo-btn duo-btn-outline px-4 py-3.5 text-xs text-[#757575] hover:text-[#1A1A2E]"
                    title="Finish early and save progress"
                  >
                    Finish Session
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'fb-1',
    type: 'translate_de_en',
    prompt: 'Was bedeutet "Guten Morgen" auf Englisch?',
    targetWord: 'Guten Morgen',
    options: ['Good morning', 'Good evening', 'Goodbye', 'Good night'],
    correctAnswer: 'Good morning',
    tip: 'Greetings · Berlin',
    points: 10,
  },
  {
    id: 'fb-2',
    type: 'gender',
    prompt: 'Welcher Artikel gehört zu "Kaffee"?',
    targetWord: 'Kaffee',
    options: ['der', 'die', 'das'],
    correctAnswer: 'der',
    tip: 'Café Vocabulary',
    points: 10,
  },
  {
    id: 'fb-3',
    type: 'translate_de_en',
    prompt: 'Was bedeutet "Danke schön" auf Englisch?',
    targetWord: 'Danke schön',
    options: ['Thank you very much', 'You are welcome', 'Excuse me', 'Please'],
    correctAnswer: 'Thank you very much',
    tip: 'Polite German Phrases',
    points: 10,
  },
  {
    id: 'fb-4',
    type: 'gender',
    prompt: 'Welcher Artikel gehört zu "Wasser"?',
    targetWord: 'Wasser',
    options: ['der', 'die', 'das'],
    correctAnswer: 'das',
    tip: 'Food & Drinks',
    points: 10,
  },
  {
    id: 'fb-5',
    type: 'translate_de_en',
    prompt: 'Was bedeutet "Auf Wiedersehen" auf Englisch?',
    targetWord: 'Auf Wiedersehen',
    options: ['Goodbye (formal)', 'See you tomorrow', 'Hello', 'Good luck'],
    correctAnswer: 'Goodbye (formal)',
    tip: 'Farewell Phrases',
    points: 10,
  },
  {
    id: 'fb-6',
    type: 'translate_de_en',
    prompt: 'Was bedeutet "Entschuldigung" auf Englisch?',
    targetWord: 'Entschuldigung',
    options: ['Excuse me / Sorry', 'Please', 'Thank you', 'Welcome'],
    correctAnswer: 'Excuse me / Sorry',
    tip: 'Politeness · A1',
    points: 10,
  },
  {
    id: 'fb-7',
    type: 'gender',
    prompt: 'Welcher Artikel gehört zu "Reisepass"?',
    targetWord: 'Reisepass',
    options: ['der', 'die', 'das'],
    correctAnswer: 'der',
    tip: 'Travel German',
    points: 10,
  },
  {
    id: 'fb-8',
    type: 'gender',
    prompt: 'Welcher Artikel gehört zu "Stadt"?',
    targetWord: 'Stadt',
    options: ['der', 'die', 'das'],
    correctAnswer: 'die',
    tip: 'City & Places',
    points: 10,
  },
];
