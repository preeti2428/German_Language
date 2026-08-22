'use client';

import { useState } from 'react';
import { gradeKeywords, tokenize } from '@/lib/lesson/grade';
import { speakGerman } from '@/lib/speech';
import type { ExerciseProps } from './types';

/**
 * Open-ended writing (open_response, guided_paragraph, sentence_construction,
 * roleplay).
 *
 * There is no single right answer, so grading is soft: the content ships a hint
 * like "Ich heiße... Ich wohne in..." and we check how many of those structures
 * the learner actually used. Anything above half counts. The hint doubles as
 * tappable scaffolding — beginners freeze at an empty box, and a starter phrase
 * they can insert is the difference between writing something and skipping.
 */
export default function FreeWrite({ ex, disabled, onAnswer }: ExerciseProps) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const scaffolds = (ex.hint || '')
    .split(/\.{3}|…/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const minWords = 3;
  const words = tokenize(text).length;

  function submit() {
    if (words < minWords || submitted) return;
    setSubmitted(true);
    const score = scaffolds.length ? gradeKeywords(text, scaffolds) : 1;
    // Effort counts here — the goal is production, not precision.
    const correct = scaffolds.length ? score >= 0.5 : words >= minWords;
    void speakGerman(text);
    onAnswer(correct, text);
  }

  return (
    <div className="w-full space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled || submitted}
        rows={4}
        placeholder="Write your answer in German…"
        aria-label="Your answer in German"
        className="w-full resize-none rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5 text-lg font-bold leading-relaxed text-gray-900 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4361EE]"
      />

      {!!scaffolds.length && !submitted && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Try using</p>
          <div className="flex flex-wrap gap-2">
            {scaffolds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setText((t) => (t ? `${t.trim()} ${s} ` : `${s} `))}
                disabled={disabled}
                className="rounded-full border-2 border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-600 transition-colors hover:border-[#4361EE] hover:text-[#4361EE]"
              >
                {s}…
              </button>
            ))}
          </div>
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={submit}
          disabled={words < minWords || disabled}
          className="duo-btn duo-btn-blue w-full py-4 text-sm"
        >
          {words < minWords ? `Write at least ${minWords} words` : 'Submit'}
        </button>
      )}
    </div>
  );
}
