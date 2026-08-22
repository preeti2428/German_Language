'use client';

import { useState } from 'react';
import { gradeText } from '@/lib/lesson/grade';
import type { ExerciseProps } from './types';
import AudioButton from './AudioButton';

/** Hear it, type it. The hardest listening format and the best for spelling. */
export default function Dictation({ ex, disabled, onAnswer }: ExerciseProps) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!text.trim() || submitted) return;
    setSubmitted(true);
    const { correct } = gradeText(text, ex.answer);
    onAnswer(correct, text);
  }

  return (
    <div className="w-full space-y-6">
      <AudioButton url={ex.audioUrl} text={ex.target || ex.answer} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled || submitted}
        rows={2}
        placeholder="Type what you hear…"
        aria-label="Type what you hear"
        className="w-full resize-none rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5 text-xl font-bold text-gray-900 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4361EE]"
      />
      {!submitted && (
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || disabled}
          className="duo-btn duo-btn-blue w-full py-4 text-sm"
        >
          Check
        </button>
      )}
    </div>
  );
}
