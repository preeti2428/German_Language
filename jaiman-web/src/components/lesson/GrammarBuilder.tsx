'use client';

import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';

interface GrammarBuilderProps {
  prompt: string;
  options: string[]; // ['heiße', 'ich', 'Anna']
  correctAnswer: string; // 'ich heiße Anna'
  onCorrect: () => void;
}

export default function GrammarBuilder({ prompt, options, correctAnswer, onCorrect }: GrammarBuilderProps) {
  const [items, setItems] = useState(options || []);
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const checkAnswer = () => {
    setIsChecking(true);
    const currentAnswer = items.join(' ');
    if (currentAnswer === correctAnswer) {
      setIsSuccess(true);
      setTimeout(() => {
        onCorrect();
      }, 1500);
    } else {
      setTimeout(() => {
        setIsChecking(false);
      }, 1000); // give some feedback
    }
  };

  return (
    <div className="w-full flex flex-col space-y-8 items-center">
      <Reorder.Group 
        axis="x" 
        values={items} 
        onReorder={setItems} 
        className="flex space-x-4 flex-wrap justify-center gap-y-4"
      >
        {items.map((item) => (
          <Reorder.Item 
            key={item} 
            value={item} 
            className="px-6 py-4 bg-gray-800/80 border border-indigo-500/50 rounded-xl cursor-grab active:cursor-grabbing text-xl font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.2)] backdrop-blur-md"
          >
            {item}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={checkAnswer}
        disabled={isChecking || isSuccess}
        className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
          isSuccess 
            ? 'bg-green-500 text-black' 
            : isChecking 
              ? 'bg-red-500 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {isSuccess ? 'Correct! 🌟' : isChecking ? 'Try Again' : 'Check Answer'}
      </motion.button>
    </div>
  );
}
