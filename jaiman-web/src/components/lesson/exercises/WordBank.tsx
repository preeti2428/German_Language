'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { gradeText } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import { sfxTap } from '@/lib/sfx';
import type { ExerciseProps } from './types';

/**
 * Tap-the-tiles sentence building — the signature Duolingo exercise, and the one
 * that makes word order learnable without punishing typing.
 *
 * Covers sentence_build (tiles parsed out of "[heiße / ich / Preeti]"), translate,
 * and the old `grammar` type. It replaces the drag-to-reorder GrammarBuilder,
 * which required a mouse and had no touch story at all.
 */
export default function WordBank({ ex, disabled, onAnswer }: ExerciseProps) {
  const tiles = ex.tiles ?? [];
  const [built, setBuilt] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const used = new Set(built);
  const sentence = built.map((i) => tiles[i]).join(' ');

  function place(i: number) {
    if (disabled || submitted || used.has(i)) return;
    sfxTap();
    setBuilt((b) => [...b, i]);
  }

  function remove(pos: number) {
    if (disabled || submitted) return;
    sfxTap();
    setBuilt((b) => b.filter((_, idx) => idx !== pos));
  }

  function check() {
    if (!built.length || submitted) return;
    setSubmitted(true);
    const { correct } = gradeText(sentence, ex.answer);
    if (correct) void speakGerman(ex.answer);
    onAnswer(correct, sentence);
  }

  return (
    <div className="w-full space-y-6">
      {/* Build area — dashed rules read as "something goes here". */}
      <div className="min-h-[104px] rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 p-4">
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {built.map((i, pos) => (
              <motion.button
                key={`${i}-${pos}`}
                type="button"
                layout
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                onClick={() => remove(pos)}
                disabled={disabled || submitted}
                className="rounded-xl border-2 border-b-4 border-[#4361EE]/30 bg-[#EEF2FF] px-4 py-2.5 text-lg font-bold text-[#4361EE] transition-colors hover:border-[#4361EE]/60 disabled:opacity-70"
              >
                {tiles[i]}
              </motion.button>
            ))}
          </AnimatePresence>
          {!built.length && (
            <p className="px-2 py-3 text-sm font-bold text-gray-300">Tap the words below to build the sentence</p>
          )}
        </div>
      </div>

      {/* Tile tray. Used tiles keep their slot as a ghost so the tray never reflows. */}
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((t, i) =>
          used.has(i) ? (
            <div
              key={`ghost-${i}`}
              aria-hidden
              className="rounded-xl border-2 border-b-4 border-transparent bg-gray-100 px-4 py-2.5 text-lg font-bold text-transparent"
            >
              {t}
            </div>
          ) : (
            <motion.button
              key={`tile-${i}`}
              type="button"
              onClick={() => place(i)}
              disabled={disabled || submitted}
              whileTap={{ scale: 0.94, y: 2 }}
              className="rounded-xl border-2 border-b-4 border-gray-200 bg-white px-4 py-2.5 text-lg font-bold text-gray-800 transition-colors hover:border-[#4361EE] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30"
            >
              {t}
            </motion.button>
          )
        )}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={check}
          disabled={!built.length || disabled}
          className="duo-btn duo-btn-blue w-full py-4 text-sm"
        >
          Check
        </button>
      )}
    </div>
  );
}
