'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { gradeText } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import { sfxTap } from '@/lib/sfx';
import type { ExerciseProps } from './types';

/**
 * Cloze exercise with an inline blank.
 *
 * The blank sits inside the sentence rather than under it, so the learner reads
 * the whole German sentence as one unit — which is the point of a cloze.
 * Tiles first (low friction, keyboard-free on mobile), with typing available for
 * anyone who wants the harder version.
 */
export default function FillBlank({ ex, disabled, onAnswer }: ExerciseProps) {
  const segments = ex.segments ?? ['', ''];
  const tiles = ex.tiles ?? [];
  const [filled, setFilled] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [typing, setTyping] = useState(tiles.length < 2);
  const [submitted, setSubmitted] = useState(false);

  const value = typing ? typed : filled ?? '';

  function submit(v: string) {
    if (!v.trim() || submitted) return;
    setSubmitted(true);
    const { correct } = gradeText(v, ex.answer);
    const full = segments[0] + v + (segments[1] ?? '');
    if (correct) void speakGerman(full);
    onAnswer(correct, v);
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-6 py-8 text-center">
        <p className="text-2xl font-black leading-relaxed text-gray-900">
          <span>{segments[0]}</span>
          {typing ? (
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(typed)}
              disabled={disabled || submitted}
              placeholder="?"
              aria-label="Fill in the blank"
              className="mx-2 w-36 border-b-4 border-[#4361EE] bg-transparent text-center font-black text-[#4361EE] outline-none placeholder:text-gray-300 focus:border-[#20BF6B]"
            />
          ) : (
            <span
              className={`mx-2 inline-block min-w-[7rem] border-b-4 px-3 pb-1 ${
                filled ? 'border-[#4361EE] text-[#4361EE]' : 'border-gray-300 text-gray-300'
              }`}
            >
              {filled ?? ' '}
            </span>
          )}
          <span>{segments[1] ?? ''}</span>
        </p>
      </div>

      {!typing && (
        <div className="flex flex-wrap justify-center gap-2">
          {tiles.map((t, i) => (
            <motion.button
              key={`${t}-${i}`}
              type="button"
              onClick={() => {
                if (disabled || submitted) return;
                sfxTap();
                setFilled(t);
              }}
              disabled={disabled || submitted}
              whileTap={{ scale: 0.94, y: 2 }}
              className={`rounded-xl border-2 border-b-4 px-4 py-2.5 text-lg font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30 ${
                filled === t
                  ? 'border-[#4361EE] bg-[#EEF2FF] text-[#4361EE]'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-[#4361EE]'
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      )}

      {!submitted && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => submit(value)}
            disabled={!value.trim() || disabled}
            className="duo-btn duo-btn-blue w-full py-4 text-sm"
          >
            Check
          </button>
          {tiles.length >= 2 && (
            <button
              type="button"
              onClick={() => setTyping((t) => !t)}
              className="mx-auto block text-xs font-bold text-gray-400 underline underline-offset-4 hover:text-[#4361EE]"
            >
              {typing ? 'Use the word bank' : 'Type it instead (harder)'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
