'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { gradeKeywords, normalizeText, tokenize } from '@/lib/lesson/grade';
import { hasSpeechRecognition, listenGerman } from '@/lib/speech';
import type { ExerciseProps } from './types';
import AudioButton from './AudioButton';

/**
 * Pronunciation practice with real speech recognition.
 *
 * The previous VoiceRecorder never touched the microphone — it ran a setTimeout
 * and awarded three stars unconditionally. That is worse than having no speaking
 * exercise, because it teaches the learner their pronunciation is fine when
 * nothing checked it. This uses the Web Speech API against a de-DE model and
 * scores on how many target words actually came back.
 *
 * Where recognition isn't available (Firefox, most of iOS), it says so and lets
 * the learner self-report rather than silently faking a score.
 */
export default function SpeakCard({ ex, disabled, onAnswer }: ExerciseProps) {
  const supported = hasSpeechRecognition();
  const [state, setState] = useState<'idle' | 'listening' | 'scoring' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [ratio, setRatio] = useState(0);

  const target = ex.target || ex.answer;
  const targetWords = tokenize(target);

  async function record() {
    if (disabled || state !== 'idle') return;
    setState('listening');
    const { transcript, supported: ok } = await listenGerman();
    setState('scoring');
    if (!ok) {
      setState('idle');
      return;
    }
    setHeard(transcript);
    const score = targetWords.length ? gradeKeywords(transcript, targetWords) : transcript ? 1 : 0;
    setRatio(score);
    setState('done');
    // 60% of the target words is a fair bar for a beginner speaking aloud.
    setTimeout(() => onAnswer(score >= 0.6, transcript || '(nothing heard)'), 900);
  }

  const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-6 py-7 text-center">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Say this aloud</p>
        <p className="text-3xl font-black leading-snug text-gray-900">{target}</p>
        <div className="mt-5 flex justify-center">
          <AudioButton url={ex.audioUrl} text={target} autoPlay={false} size="sm" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state === 'done' ? (
          <motion.div key="score" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3 text-center">
            <div className="flex justify-center gap-2 text-4xl">
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
            <p className="text-sm font-bold text-gray-500">
              Heard: <span className={normalizeText(heard) ? 'text-gray-900' : 'text-gray-300'}>{heard || 'nothing'}</span>
            </p>
          </motion.div>
        ) : (
          <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <motion.button
              type="button"
              onClick={record}
              disabled={disabled || state !== 'idle'}
              whileTap={{ scale: 0.94 }}
              aria-label="Record your voice"
              className={`flex h-24 w-24 items-center justify-center rounded-full border-b-4 text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/40 ${
                state === 'listening'
                  ? 'animate-pulse border-[#CC3946] bg-[#FF4757]'
                  : 'border-[#3046B2] bg-[#4361EE]'
              }`}
            >
              {state === 'listening' ? <Square size={32} className="fill-current" /> : <Mic size={38} />}
            </motion.button>
            <p className="text-sm font-bold text-gray-400">
              {state === 'listening' ? 'Listening…' : state === 'scoring' ? 'Scoring…' : 'Tap and speak'}
            </p>

            {!supported && (
              <div className="mt-2 space-y-2 text-center">
                <p className="max-w-xs text-xs font-bold text-[#FF9F43]">
                  This browser can&apos;t score speech. Chrome on desktop or Android can.
                </p>
                <button
                  type="button"
                  onClick={() => onAnswer(true, '(self-reported)')}
                  className="duo-btn duo-btn-outline px-5 py-2.5 text-xs"
                >
                  I said it out loud
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
