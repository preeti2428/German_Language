'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Flame, Heart, Volume2, VolumeX, X } from 'lucide-react';
import { normalizeSession, type Exercise, type RawExercise } from '@/lib/lesson/normalize';
import { isMuted, sfxCombo, sfxCorrect, sfxWin, sfxFail, sfxFanfare, sfxHeartLost, sfxWrong, toggleMute } from '@/lib/sfx';
import { cancelSpeech } from '@/lib/speech';
import ExerciseRenderer from './ExerciseRenderer';

const MAX_HEARTS = 5;
const PERFECT_BONUS = 20;

export interface LessonSummary {
  xp: number;
  correct: number;
  total: number;
  bestCombo: number;
  perfect: boolean;
  failed: boolean;
}

type Feedback = { correct: boolean; given: string; expected: string; message?: string } | null;

const CELEBRATIONS = [
  "🎉 SUPER!",
  "🌟 EXCELLENT!",
  "🔥 BRILLIANT!",
  "✨ FANTASTIC!",
  "🏆 OUTSTANDING!",
  "🎯 SPOT ON!"
];

/**
 * The lesson shell: hearts, combo, XP, progress, feedback, and the review queue.
 *
 * The three mechanics that were missing and matter most:
 *  1. Hearts — a wrong answer costs something, so attention has a price.
 *  2. Requeue — a missed exercise comes back at the end of the lesson, which is
 *     what actually makes the content stick.
 *  3. Auto-advance on correct — you only stop to read when you got it wrong.
 *     This is most of what makes Duolingo feel fast.
 */
export default function LessonRunner({
  exercises,
  title,
  onExit,
  onFinish,
}: {
  exercises: RawExercise[];
  title: string;
  onExit: () => void;
  onFinish: (summary: LessonSummary) => void;
}) {
  const initial = useMemo(() => normalizeSession(exercises), [exercises]);

  const [queue, setQueue] = useState<Exercise[]>(initial);
  const [pos, setPos] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<'run' | 'done' | 'failed'>('run');
  const [heartPulse, setHeartPulse] = useState(false);

  const requeued = useRef<Set<string>>(new Set());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The last answer's setState hasn't flushed when finish() runs from a timeout,
  // so the summary reads these refs instead of stale closure values.
  const xpRef = useRef(0);
  const correctRef = useRef(0);
  const bestComboRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);

  useEffect(() => setMuted(isMuted()), []);
  useEffect(() => {
    setQueue(initial);
    setPos(0);
    requeued.current = new Set();
    xpRef.current = 0;
    correctRef.current = 0;
    bestComboRef.current = 0;
    heartsRef.current = MAX_HEARTS;
  }, [initial]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      cancelSpeech();
    },
    []
  );

  const current = queue[pos];

  // Reading exercises pack "passage\n\nquestion" into one prompt (the Question
  // schema has one text column). Split so the passage gets its own reading box.
  let passage: string | null = null;
  let questionText = current?.prompt ?? '';
  if (current && current.prompt.includes('\n\n')) {
    const parts = current.prompt.split('\n\n');
    questionText = parts.pop() ?? '';
    passage = parts.join('\n\n');
  }

  const answered = initial.length ? Math.min(pos, initial.length) : 0;
  const progress = initial.length ? (answered / initial.length) * 100 : 0;

  const finish = useCallback(
    (failed: boolean) => {
      const perfect = !failed && correctRef.current === initial.length && heartsRef.current === MAX_HEARTS;
      const total = xpRef.current + (perfect ? PERFECT_BONUS : 0);
      if (failed) sfxFail();
      else sfxFanfare();
      xpRef.current = total;
      setXp(total);
      setPhase(failed ? 'failed' : 'done');
      onFinish({
        xp: total,
        correct: correctRef.current,
        total: initial.length,
        bestCombo: bestComboRef.current,
        perfect,
        failed,
      });
    },
    [initial.length, onFinish]
  );

  const next = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setFeedback(null);
    const n = pos + 1;
    if (n >= queue.length) finish(false);
    else setPos(n);
  }, [finish, pos, queue.length]);

  function handleAnswer(correct: boolean, given: string) {
    if (feedback || !current) return;

    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
      setBestCombo(bestComboRef.current);
      correctRef.current += 1;
      setCorrectCount(correctRef.current);

      // Combo bonus: the reward for a streak has to be visible or it isn't a streak.
      const bonus = nextCombo >= 5 ? 5 : nextCombo >= 3 ? 2 : 0;
      xpRef.current += current.xp + bonus;
      setXp(xpRef.current);

      if (nextCombo >= 3) sfxCombo(nextCombo);
      else sfxWin();

      const randomMessage = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
      setFeedback({ correct: true, given, expected: current.answer, message: randomMessage });
      advanceTimer.current = setTimeout(next, 850);
    } else {
      setCombo(0);
      const left = heartsRef.current - 1;
      heartsRef.current = left;
      setHearts(left);
      setHeartPulse(true);
      setTimeout(() => setHeartPulse(false), 500);
      sfxWrong();
      setTimeout(sfxHeartLost, 120);

      // Missed exercises come back once, at the end.
      if (!requeued.current.has(current.id)) {
        requeued.current.add(current.id);
        setQueue((q) => [...q, current]);
      }

      setFeedback({ correct: false, given, expected: current.answer });
      if (left <= 0) setTimeout(() => finish(true), 1100);
    }
  }

  // ── End screens ─────────────────────────────────────────────────────
  if (phase !== 'run') {
    const failed = phase === 'failed';
    const accuracy = initial.length ? Math.round((correctCount / initial.length) * 100) : 0;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8ECEF] p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="w-full max-w-md rounded-3xl border-2 border-b-[6px] border-gray-200 bg-white p-8 text-center"
        >
          <div className="mb-4 text-6xl">{failed ? '💔' : correctCount === initial.length ? '🏆' : '🎉'}</div>
          <h2 className="text-3xl font-black text-gray-900">
            {failed ? 'Out of hearts' : correctCount === initial.length ? 'Perfect lesson!' : 'Lesson complete!'}
          </h2>
          <p className="mt-2 font-bold text-gray-400">
            {failed ? 'Review the words and try again — nothing is lost.' : title}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            {[
              { label: 'XP', value: `+${xp}`, tone: 'text-[#FF9F43] border-[#FF9F43]' },
              { label: 'Accuracy', value: `${accuracy}%`, tone: 'text-[#4361EE] border-[#4361EE]' },
              { label: 'Best combo', value: `${bestCombo}×`, tone: 'text-[#20BF6B] border-[#20BF6B]' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border-2 border-b-[5px] bg-white px-2 py-4 ${s.tone}`}>
                <p className="text-2xl font-black tabular-nums">{s.value}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <button type="button" onClick={onExit} className="duo-btn duo-btn-green mt-8 w-full py-4 text-sm">
            Continue
          </button>
        </motion.div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E8ECEF]">
        <p className="font-bold text-gray-400">No exercises in this session yet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#E8ECEF]">
      {/* ── Header: quit, progress, combo, hearts ────────────────────── */}
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3.5 px-4 pt-5">
        <button
          type="button"
          onClick={onExit}
          aria-label="Quit lesson"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] border-2 border-b-4 border-[#E4E9EF] bg-white text-[#8A94A2] transition-colors hover:text-[#1F2328]"
        >
          <X size={18} strokeWidth={3} />
        </button>

        <div className="h-[18px] flex-1 overflow-hidden rounded-full bg-[#DDE3E9] shadow-[inset_0_2px_3px_rgba(0,0,0,0.08)]">
          <motion.div
            className="relative h-full rounded-full bg-[#20BF6B]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div className="absolute left-1.5 right-1.5 top-[3px] h-1 rounded-full bg-white/40" />
          </motion.div>
        </div>

        <motion.div animate={heartPulse ? { scale: [1, 1.25, 1] } : {}} className="flex flex-none gap-1">
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <Heart
              key={i}
              size={19}
              className={i < hearts ? 'fill-[#FF4757] text-[#FF4757]' : 'fill-[#D8DEE5] text-[#D8DEE5]'}
            />
          ))}
        </motion.div>

        <button
          type="button"
          onClick={() => setMuted(toggleMute())}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          className="flex-none text-[#B4BDC8] transition-colors hover:text-[#8A94A2]"
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </header>

      {/* Combo pill row, per the design canvas */}
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-4">
        <div
          className={`flex items-center gap-2 rounded-full border-2 px-3.5 py-2 transition-colors ${
            combo >= 3 ? 'border-[#FFE2C4] bg-[#FFF4E6]' : 'border-[#E4E9EF] bg-white'
          }`}
        >
          <Flame size={15} className={combo >= 3 ? 'fill-[#FF9F43] text-[#FF9F43]' : 'text-[#C3CBD4]'} />
          <span
            className={`text-[12px] font-black uppercase tracking-[0.1em] ${combo >= 3 ? 'text-[#FF9F43]' : 'text-[#A8B2BE]'}`}
          >
            {combo >= 2 ? `${combo}x combo` : 'Combo'}
          </span>
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9AA6B4]">{title}</span>
      </div>

      {/* ── Exercise ─────────────────────────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.id}-${pos}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.22 }}
            className="space-y-7"
          >
            <div className="duo-card p-7 sm:p-9">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9AA6B4]">
                {current.rawType.replace(/_/g, ' ')}
                {requeued.current.has(current.id) && pos >= initial.length && ' · review'}
              </p>
              {passage && (
                <div className="mb-4 max-h-52 overflow-y-auto rounded-2xl border-2 border-gray-200 bg-white p-5">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Read</p>
                  <p className="text-base font-bold leading-relaxed text-gray-800">{passage}</p>
                </div>
              )}
              <h2 className="text-2xl font-black leading-snug text-gray-900 text-balance sm:text-3xl">
                {questionText}
              </h2>
              {current.hint && current.kind !== 'free_write' && (
                <p className="mt-2 text-sm font-bold text-gray-400">{current.hint}</p>
              )}

              <div className="mt-7">
                <ExerciseRenderer ex={current} disabled={!!feedback} onAnswer={handleAnswer} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Feedback footer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.footer
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="pointer-events-none px-4 pb-5"
          >
            <div
              className={`pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-4 rounded-[26px] border-2 border-b-[5px] px-5 py-4 ${
                feedback.correct ? 'border-[#BFE8CF] bg-[#E8FBF0]' : 'border-[#F6C6CC] bg-[#FFF0F0]'
              }`}
            >
              <div
                className={`flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full text-white ${
                  feedback.correct ? 'bg-[#20BF6B]' : 'bg-[#FF4757]'
                }`}
              >
                {feedback.correct ? <Check size={26} strokeWidth={4} /> : <X size={26} strokeWidth={4} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-black ${feedback.correct ? 'text-[#178B4E]' : 'text-[#CC3946]'}`}>
                  {feedback.correct ? (feedback.message || 'Correct!') : 'Not quite'}
                </p>
                {!feedback.correct && feedback.expected && (
                  <p className="truncate text-sm font-semibold text-[#6B7684]">
                    Answer: <span className="font-black text-[#1F2328]">{feedback.expected}</span> · you&apos;ll see this again
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={next}
                className={`duo-btn flex-none px-7 py-3.5 text-sm ${feedback.correct ? 'duo-btn-green' : 'duo-btn-danger'}`}
              >
                Continue
              </button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
