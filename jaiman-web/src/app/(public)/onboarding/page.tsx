'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<string | null>(null);

  const nextStep = () => setStep(prev => prev + 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Why are you learning German?
            </h1>
            <p className="text-gray-400 text-lg">This helps us personalize your journey.</p>
            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
              {['Travel ✈️', 'Career & Work 💼', 'Exams (Goethe/TestDaF) 📝', 'Heritage & Family 🏠', 'Just for fun 🎮'].map((option) => (
                <button
                  key={option}
                  onClick={() => { setGoal(option); nextStep(); }}
                  className="w-full text-left px-6 py-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-indigo-600 hover:border-indigo-500 transition-all text-white font-medium text-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Placement Test
            </h1>
            <p className="text-gray-400 text-lg">How much German do you already know?</p>
            <div className="w-full max-w-md space-y-4">
              <button
                onClick={nextStep}
                className="w-full text-left px-6 py-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-indigo-600 hover:border-indigo-500 transition-all text-white font-medium text-lg"
              >
                I'm a complete beginner (Start at A1)
              </button>
              <button
                onClick={nextStep}
                className="w-full text-left px-6 py-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-indigo-600 hover:border-indigo-500 transition-all text-white font-medium text-lg"
              >
                I know some German (Take quick test)
              </button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Daily Goal
            </h1>
            <p className="text-gray-400 text-lg">Consistency is key. Pick a goal to build your streak.</p>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {[5, 10, 20].map((mins) => (
                <Link
                  key={mins}
                  href="/lesson/A1/1/1"
                  className="flex flex-col items-center justify-center p-6 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-indigo-600 hover:border-indigo-500 transition-all group"
                >
                  <span className="text-3xl font-bold text-white mb-2">{mins}</span>
                  <span className="text-sm text-gray-300 group-hover:text-white">mins/day</span>
                </Link>
              ))}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}
