"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, BookOpen, Volume2 } from "lucide-react";
import { Exercise } from "./CastleBuilder"; // Import the Exercise interface

export default function SentenceAssembler({ exercises = [], onComplete }: { exercises?: Exercise[], onComplete: (xpEarned: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);

  const hasExercises = exercises && exercises.length > 0;
  const currentLevel = hasExercises ? exercises[currentIndex] : null;

  useEffect(() => {
    if (currentLevel) {
      const correctStr = (currentLevel.correctAnswer || currentLevel.correct_answer || "").toString().trim();
      const words = correctStr.split(/\s+/).filter((w: string) => w.length > 0);
      
      // Shuffle the words
      const shuffled = [...words];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledWords(shuffled);
    }
  }, [currentLevel]);

  const availableWords = shuffledWords.filter((w: string, index: number) => {
    // We need to handle duplicate words correctly by tracking indices instead of just string values,
    // but for simplicity, we'll just filter out the first occurrence of the selected word.
    // A better approach is to map shuffledWords to objects with IDs.
    return true;
  });

  // Better approach for duplicates:
  const [availableItems, setAvailableItems] = useState<{id: string, word: string}[]>([]);
  
  useEffect(() => {
    if (currentLevel) {
      const correctStr = (currentLevel.correctAnswer || currentLevel.correct_answer || "").toString().trim();
      const words = correctStr.split(/\s+/).filter((w: string) => w.length > 0);
      
      const items = words.map((w: string, i: number) => ({ id: `word-${i}`, word: w }));
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      setAvailableItems(items);
    }
  }, [currentLevel]);

  const [selectedItems, setSelectedItems] = useState<{id: string, word: string}[]>([]);

  function handleWordClick(item: {id: string, word: string}) {
    if (isCorrect !== null) return;
    setSelectedItems([...selectedItems, item]);
    setAvailableItems(availableItems.filter(i => i.id !== item.id));
  }

  function handleRemoveWord(item: {id: string, word: string}) {
    if (isCorrect !== null) return;
    setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    setAvailableItems([...availableItems, item]);
  }

  function checkAnswer() {
    const selectedText = selectedItems.map(i => i.word).join(" ");
    const correctText = (currentLevel?.correctAnswer || currentLevel?.correct_answer || "").toString().trim();
    
    // Ignore punctuation differences ideally, but strict match for now
    const isMatch = selectedText === correctText;
    setIsCorrect(isMatch);
    if (isMatch) {
      const points = currentLevel?.points || currentLevel?.xp_value || 10;
      setXp((prev) => prev + points);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= (exercises?.length || 0)) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedItems([]);
      setIsCorrect(null);
    }
  }

  function handleRetry() {
    // Move all back to available
    setAvailableItems([...availableItems, ...selectedItems]);
    setSelectedItems([]);
    setIsCorrect(null);
  }

  if (!hasExercises) {
    return <div className="text-white">No exercises found for this session!</div>;
  }

  if (finished) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F9FF] to-[#EEF2FF] rounded-3xl p-8">
        <div className="text-5xl mb-4">🧩🎉</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Lesson Complete!</h2>
        <p className="text-gray-500 font-bold mb-6">You earned <span className="text-[#20BF6B] font-black">{xp} XP</span>!</p>
        <button
          onClick={() => onComplete(xp)}
          className="duo-btn duo-btn-green px-6 py-3"
        >
          Continue to Map ✨
        </button>
      </div>
    );
  }

  const promptText = currentLevel?.prompt || currentLevel?.question_text || "Translate this sentence";

  return (
    <div className="w-full h-full min-h-[70vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#FF9F43] font-black">
          <BookOpen size={24} />
          <span>Sentence Assembler</span>
        </div>
        <div className="font-black text-gray-400">
          {currentIndex + 1} / {exercises.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Write this in German</h2>
        
        {/* Prompt */}
        <div className="flex items-center gap-4 mb-10 w-full">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=DuolingoMascot" alt="Mascot" className="w-24 h-24 drop-shadow-md hidden md:block" />
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 relative shadow-sm w-full">
            <div className="absolute top-1/2 -left-[10px] -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-gray-200 rotate-45 hidden md:block"></div>
            <div className="flex items-center gap-3">
              {(currentLevel?.audioUrl || currentLevel?.audio_url) && (
                <button className="text-[#4361EE] hover:bg-[#4361EE]/10 p-2 rounded-full transition-colors">
                  <Volume2 size={24} />
                </button>
              )}
              <p className="text-xl font-medium text-gray-700">{promptText}</p>
            </div>
          </div>
        </div>

        {/* Assembly Area */}
        <div className="w-full min-h-[80px] border-b-[3px] border-gray-200 mb-10 flex flex-wrap gap-2 pb-2">
          <AnimatePresence>
            {selectedItems.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => handleRemoveWord(item)}
                className="duo-card px-4 py-2 text-lg font-bold text-gray-800 border-2 border-gray-200 shadow-[0_4px_0_#CBD5E0] hover:bg-gray-50 active:shadow-none active:translate-y-[4px] transition-all cursor-pointer"
              >
                {item.word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Word Bank */}
        <div className="w-full flex flex-wrap justify-center gap-3 min-h-[120px]">
          {availableItems.map((item) => (
            <motion.button
              key={item.id}
              layout
              onClick={() => handleWordClick(item)}
              className="duo-card px-4 py-3 text-lg font-bold text-gray-800 border-2 border-gray-200 shadow-[0_4px_0_#CBD5E0] hover:bg-gray-50 active:shadow-none active:translate-y-[4px] transition-all cursor-pointer"
            >
              {item.word}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer / Feedback */}
      <div className={`p-6 border-t-2 ${isCorrect === true ? 'bg-[#E8FBF0] border-[#20BF6B]' : isCorrect === false ? 'bg-[#FFF0F0] border-[#FF4757]' : 'bg-gray-50 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            {isCorrect === true && (
              <div className="flex items-center gap-4 text-[#20BF6B]">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Check size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-black text-xl">Excellent!</h3>
                </div>
              </div>
            )}
            {isCorrect === false && (
              <div className="flex items-center gap-4 text-[#FF4757]">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <X size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-black text-xl">Correct solution:</h3>
                  <p className="font-bold opacity-80 text-sm">{currentLevel?.correctAnswer || currentLevel?.correct_answer}</p>
                </div>
              </div>
            )}
          </div>
          
          {isCorrect === null ? (
            <button
              onClick={checkAnswer}
              disabled={selectedItems.length === 0}
              className="duo-btn duo-btn-blue px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check
            </button>
          ) : (
            <button
              onClick={isCorrect ? handleNext : handleRetry}
              className={`duo-btn px-10 py-3 flex items-center gap-2 ${isCorrect ? 'duo-btn-green' : 'duo-btn-danger'}`}
            >
              {isCorrect ? 'Continue' : 'Got it'} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
