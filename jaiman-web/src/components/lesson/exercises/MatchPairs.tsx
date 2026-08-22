'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { seededShuffle } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import { sfxCorrect, sfxTap, sfxWrong } from '@/lib/sfx';
import type { ExerciseProps } from './types';

/**
 * Tap-to-pair matching.
 *
 * This is the exercise that was most broken: `matching` questions store their
 * options as an object ({ "Guten Morgen": "Good morning", ... }), so the old
 * `Array.isArray(options)` check failed and the whole thing rendered as an empty
 * text box with no correct answer to grade against. Now it's a real puzzle.
 */
export default function MatchPairs({ ex, disabled, onAnswer }: ExerciseProps) {
  const pairs = useMemo(() => ex.pairs ?? [], [ex.pairs]);
  const left = useMemo(() => seededShuffle(pairs.map((p) => p.left), ex.id + 'L'), [pairs, ex.id]);
  const right = useMemo(() => seededShuffle(pairs.map((p) => p.right), ex.id + 'R'), [pairs, ex.id]);

  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);

  const partnerOf = (l: string) => pairs.find((p) => p.left === l)?.right;

  function tapLeft(l: string) {
    if (disabled || matched.has(l)) return;
    sfxTap();
    void speakGerman(l);
    setSelected(selected === l ? null : l);
  }

  function tapRight(r: string) {
    if (disabled || matched.has(r)) return;
    if (!selected) {
      sfxTap();
      return;
    }
    if (partnerOf(selected) === r) {
      sfxCorrect();
      const next = new Set(matched);
      next.add(selected);
      next.add(r);
      setMatched(next);
      setSelected(null);
      if (next.size >= pairs.length * 2) {
        // Finished. A clean sweep counts as correct; any miss costs the point.
        setTimeout(() => onAnswer(misses === 0, `${pairs.length - misses}/${pairs.length}`), 320);
      }
    } else {
      sfxWrong();
      setMisses((m) => m + 1);
      setWrongPair([selected, r]);
      setTimeout(() => {
        setWrongPair([]);
        setSelected(null);
      }, 420);
    }
  }

  function cell(text: string, side: 'l' | 'r') {
    const done = matched.has(text);
    const active = selected === text;
    const bad = wrongPair.includes(text);

    let cls = 'border-gray-200 bg-white text-gray-800 hover:border-[#4361EE]';
    if (done) cls = 'border-[#20BF6B] bg-[#E8FBF0] text-[#20BF6B] opacity-60 cursor-default';
    else if (bad) cls = 'border-[#FF4757] bg-[#FFF0F0] text-[#b91c1c]';
    else if (active) cls = 'border-[#4361EE] bg-[#EEF2FF] text-[#4361EE]';

    return (
      <motion.button
        key={side + text}
        type="button"
        disabled={disabled || done}
        onClick={() => (side === 'l' ? tapLeft(text) : tapRight(text))}
        animate={bad ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.32 }}
        whileTap={!done ? { scale: 0.97 } : undefined}
        className={`w-full rounded-2xl border-2 border-b-4 px-4 py-4 text-base font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30 ${cls}`}
      >
        {text}
      </motion.button>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Deutsch</p>
          {left.map((l) => cell(l, 'l'))}
        </div>
        <div className="space-y-3">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">English</p>
          {right.map((r) => cell(r, 'r'))}
        </div>
      </div>
      {misses > 0 && !disabled && (
        <p className="text-center text-xs font-bold text-[#FF4757]">
          {misses} wrong {misses === 1 ? 'try' : 'tries'} so far
        </p>
      )}
    </div>
  );
}
