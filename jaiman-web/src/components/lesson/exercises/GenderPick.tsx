'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { normalizeText } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import type { ExerciseProps } from './types';

/**
 * der / die / das.
 *
 * German gender is pure memorisation, and colour is the strongest memory hook
 * available — so each article gets a fixed colour that never changes across the
 * app. After a few sessions "blue" and "der" become the same thought.
 */
const TONES: Record<string, { base: string; on: string; label: string }> = {
  der: { base: 'border-[#4361EE]/30 text-[#4361EE] hover:bg-[#EEF2FF]', on: 'border-[#4361EE] bg-[#4361EE] text-white', label: 'masculine' },
  die: { base: 'border-[#FF4757]/30 text-[#FF4757] hover:bg-[#FFF0F0]', on: 'border-[#FF4757] bg-[#FF4757] text-white', label: 'feminine' },
  das: { base: 'border-[#20BF6B]/30 text-[#20BF6B] hover:bg-[#E8FBF0]', on: 'border-[#20BF6B] bg-[#20BF6B] text-white', label: 'neuter' },
};

export default function GenderPick({ ex, disabled, onAnswer }: ExerciseProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const choices = ex.choices ?? ['der', 'die', 'das'];

  function choose(c: string) {
    if (disabled || picked) return;
    setPicked(c);
    const correct = normalizeText(c) === normalizeText(ex.answer);
    if (ex.target) void speakGerman(`${ex.answer} ${ex.target}`);
    onAnswer(correct, c);
  }

  return (
    <div className="w-full space-y-6">
      {ex.target && (
        <button
          type="button"
          onClick={() => void speakGerman(ex.target)}
          className="mx-auto flex items-center gap-3 rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-8 py-5 text-3xl font-black text-gray-900 transition-colors hover:border-gray-300"
        >
          {ex.target}
          <Volume2 size={22} className="text-gray-300" />
        </button>
      )}
      <div className="grid grid-cols-3 gap-3">
        {choices.map((c) => {
          const key = c.toLowerCase();
          const t = TONES[key] ?? TONES.das;
          const chosen = picked === c;
          const right = normalizeText(c) === normalizeText(ex.answer);
          let cls = `bg-white ${t.base}`;
          if (picked) {
            if (right) cls = TONES[key]?.on ?? t.on;
            else if (chosen) cls = 'border-[#FF4757] bg-[#FFF0F0] text-[#b91c1c] line-through';
            else cls = 'border-gray-200 bg-white text-gray-300';
          }
          return (
            <motion.button
              key={c}
              type="button"
              onClick={() => choose(c)}
              disabled={disabled || !!picked}
              whileTap={!picked ? { scale: 0.95, y: 2 } : undefined}
              className={`rounded-2xl border-2 border-b-4 px-2 py-6 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30 ${cls}`}
            >
              <span className="block text-2xl font-black">{c}</span>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-widest opacity-60">{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
