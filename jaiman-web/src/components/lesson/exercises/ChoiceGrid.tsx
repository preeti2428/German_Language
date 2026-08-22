'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { normalizeText } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import { sfxTap } from '@/lib/sfx';
import type { ExerciseProps } from './types';

const GERMAN = /[äöüßA-ZÄÖÜ]/;

/**
 * Multiple choice. Covers mcq, reverse_mcq, comprehension_mcq, vocab_in_context
 * and flashcard_recall.
 *
 * Two things the old grid didn't do: it speaks any option that looks German when
 * you pick it (free pronunciation exposure on every tap), and it keeps the chosen
 * wrong answer visible next to the right one instead of clearing the selection.
 */
export default function ChoiceGrid({ ex, disabled, onAnswer }: ExerciseProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const choices = ex.choices ?? [];
  const isCorrect = (c: string) => normalizeText(c) === normalizeText(ex.answer);

  function choose(c: string) {
    if (disabled || picked) return;
    sfxTap();
    setPicked(c);
    if (GERMAN.test(c) && c.split(' ').length <= 6) void speakGerman(c);
    onAnswer(isCorrect(c), c);
  }

  const wide = choices.some((c) => c.length > 22) || choices.length === 2;

  return (
    <div className={`grid gap-3 w-full ${wide ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {choices.map((c, i) => {
        const chosen = picked === c;
        const right = isCorrect(c);
        let tone = 'border-gray-200 bg-white hover:border-[#4361EE] hover:bg-[#F5F7FF]';
        if (picked) {
          if (right) tone = 'border-[#20BF6B] bg-[#E8FBF0] text-[#15803d]';
          else if (chosen) tone = 'border-[#FF4757] bg-[#FFF0F0] text-[#b91c1c]';
          else tone = 'border-gray-200 bg-white opacity-45';
        }
        return (
          <motion.button
            key={`${c}-${i}`}
            type="button"
            onClick={() => choose(c)}
            disabled={disabled || !!picked}
            whileTap={!picked ? { scale: 0.97, y: 2 } : undefined}
            className={`relative rounded-2xl border-2 border-b-4 px-5 py-4 text-left text-lg font-bold text-gray-800 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30 ${tone}`}
          >
            <span className="mr-8">{c}</span>
            {GERMAN.test(c) && (
              <Volume2
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                aria-hidden
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
