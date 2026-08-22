'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { normalizeText } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import type { ExerciseProps } from './types';

/**
 * Tap the word that's wrong.
 *
 * The content stores these as "Galti dhoondo: 'Ich bist Preeti.'" with the answer
 * "bist → bin" — which the old renderer showed as a text box, expecting the
 * learner to literally type an arrow. Parsing it into tappable words turns a
 * broken question into the best kind of grammar drill: find the error yourself.
 */
export default function ErrorSpot({ ex, disabled, onAnswer }: ExerciseProps) {
  const words = ex.words ?? [];
  const fix = ex.fix;
  const [picked, setPicked] = useState<number | null>(null);

  const isTarget = (w: string) => !!fix && normalizeText(w) === normalizeText(fix.wrong);

  function tap(i: number) {
    if (disabled || picked !== null) return;
    setPicked(i);
    const correct = isTarget(words[i]);
    if (fix) {
      const fixed = words.map((w) => (isTarget(w) ? fix.right : w)).join(' ');
      void speakGerman(fixed);
    }
    onAnswer(correct, words[i]);
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {words.map((w, i) => {
            const chosen = picked === i;
            const target = isTarget(w);
            let cls = 'border-transparent bg-gray-50 text-gray-900 hover:border-[#4361EE] hover:bg-[#EEF2FF]';
            if (picked !== null) {
              if (target) cls = 'border-[#20BF6B] bg-[#E8FBF0] text-[#20BF6B]';
              else if (chosen) cls = 'border-[#FF4757] bg-[#FFF0F0] text-[#b91c1c]';
              else cls = 'border-transparent bg-gray-50 text-gray-400';
            }
            return (
              <motion.button
                key={`${w}-${i}`}
                type="button"
                onClick={() => tap(i)}
                disabled={disabled || picked !== null}
                whileTap={picked === null ? { scale: 0.94 } : undefined}
                className={`rounded-xl border-2 px-3 py-2 text-2xl font-black transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30 ${cls}`}
              >
                {w}
              </motion.button>
            );
          })}
        </div>

        {picked !== null && fix && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center text-lg font-bold text-gray-500"
          >
            <span className="text-[#FF4757] line-through">{fix.wrong}</span>
            <span className="mx-3 text-gray-300">→</span>
            <span className="text-[#20BF6B]">{fix.right}</span>
          </motion.p>
        )}
      </div>
    </div>
  );
}
