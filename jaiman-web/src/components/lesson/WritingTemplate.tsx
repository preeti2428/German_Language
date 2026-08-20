'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WritingTemplateProps {
  prompt: string;
  correctAnswer: string;
  onCorrect: () => void;
}

export default function WritingTemplate({ prompt, correctAnswer, onCorrect }: WritingTemplateProps) {
  const [input, setInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const checkAnswer = () => {
    setIsChecking(true);
    
    // Simple exact match (ignoring case and outer whitespace for robustness)
    if (input.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      setIsError(false);
      setIsSuccess(true);
      setTimeout(() => {
        onCorrect();
      }, 1500);
    } else {
      setIsError(true);
      setTimeout(() => {
        setIsChecking(false);
        setIsError(false);
      }, 1000); // Reset error state after shake animation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  // Splitting prompt by '___' to render the input box inline if needed
  // For A1, prompt might just be: "Fill in the blank: ___ bin aus Berlin"
  const parts = prompt.split('___');

  return (
    <div className="w-full flex flex-col space-y-8 items-center">
      
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-700 w-full shadow-lg">
        {parts.length > 1 ? (
          <p className="text-2xl font-bold text-white text-center leading-loose">
            {parts[0]}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSuccess || isChecking}
              className={`mx-2 bg-gray-900 border-b-2 text-center focus:outline-none transition-colors w-32 ${
                isSuccess 
                  ? 'border-green-500 text-green-400' 
                  : isError 
                    ? 'border-red-500 text-red-400' 
                    : 'border-indigo-500 text-white focus:border-indigo-400'
              }`}
            />
            {parts[1]}
          </p>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-xl font-medium text-gray-300 text-center">{prompt}</p>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSuccess || isChecking}
              placeholder="Type your answer..."
              className={`bg-gray-900 border-2 rounded-xl p-4 text-center text-xl font-bold focus:outline-none transition-all w-full max-w-sm mx-auto ${
                isSuccess 
                  ? 'border-green-500 text-green-400' 
                  : isError 
                    ? 'border-red-500 text-red-400' 
                    : 'border-gray-700 text-white focus:border-indigo-500'
              }`}
            />
          </div>
        )}
      </div>

      <motion.button
        animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        whileHover={!isSuccess && !isChecking ? { scale: 1.05 } : {}}
        whileTap={!isSuccess && !isChecking ? { scale: 0.95 } : {}}
        onClick={checkAnswer}
        disabled={isChecking || isSuccess || !input.trim()}
        className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
          isSuccess 
            ? 'bg-green-500 text-black' 
            : isError 
              ? 'bg-red-500 text-white' 
              : !input.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {isSuccess ? 'Perfect! ✍️' : isError ? 'Incorrect' : 'Check Answer'}
      </motion.button>

      {/* Show Answer / Hint button */}
      {!isSuccess && (
        <button 
          onClick={() => setInput(correctAnswer)}
          className="text-gray-400 hover:text-indigo-400 text-sm font-medium transition-colors mt-2"
        >
          Show Answer
        </button>
      )}
    </div>
  );
}
