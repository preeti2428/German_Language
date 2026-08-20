'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface VocabCardProps {
  prompt: string;
  correctAnswer: string;
  options?: string[]; // If we want to make it multiple choice
  onCorrect: () => void;
}

export default function VocabCard({ prompt, correctAnswer, options, onCorrect }: VocabCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);

  // If no options provided, let's just make it a flashcard flip or simple input
  // For A1, multiple choice is best
  const displayOptions = options && options.length > 0 
    ? options 
    : [correctAnswer, 'FalscheAntwort1', 'FalscheAntwort2'].sort(() => Math.random() - 0.5);

  const handleSelect = (option: string) => {
    setSelected(option);
    if (option === correctAnswer) {
      setIsWrong(false);
      setTimeout(onCorrect, 1000); // Wait a bit to show green success state
    } else {
      setIsWrong(true);
      setTimeout(() => {
        setSelected(null);
        setIsWrong(false);
      }, 1000); // Reset after showing red
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayOptions.map((opt, idx) => {
          const isSelected = selected === opt;
          const isActuallyCorrect = isSelected && !isWrong;
          const isActuallyWrong = isSelected && isWrong;

          let bgColor = "bg-gray-800/50";
          let borderColor = "border-gray-700";

          if (isActuallyCorrect) {
            bgColor = "bg-green-500/20";
            borderColor = "border-green-500";
          } else if (isActuallyWrong) {
            bgColor = "bg-red-500/20";
            borderColor = "border-red-500";
          }

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !selected && handleSelect(opt)}
              className={`p-6 rounded-2xl border-2 text-xl font-medium text-white transition-all backdrop-blur-sm shadow-lg ${bgColor} ${borderColor} ${selected ? 'cursor-default' : 'hover:border-indigo-500 cursor-pointer'}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
