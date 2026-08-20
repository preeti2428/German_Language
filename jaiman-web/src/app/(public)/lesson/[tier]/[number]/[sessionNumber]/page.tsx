'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '@/lib/api';
import VocabCard from '@/components/lesson/VocabCard';
import GrammarBuilder from '@/components/lesson/GrammarBuilder';
import AudioMatch from '@/components/lesson/AudioMatch';
import VoiceRecorder from '@/components/lesson/VoiceRecorder';
import WritingTemplate from '@/components/lesson/WritingTemplate';
import BossTest from '@/components/lesson/BossTest';
import CastleBuilder from '@/components/games/CastleBuilder';
import SentenceAssembler from '@/components/games/SentenceAssembler';
import WordMatcher from '@/components/games/WordMatcher';

// Interfaces for our Lesson Data
interface Exercise {
  _id: string;
  type: 'vocab' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing' | 'boss_test';
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  audioUrl?: string;
  points: number;
}

interface SessionData {
  stageId: string;
  title: string;
  skillType?: string;
  sessionNumber?: number;
  exercises: Exercise[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { tier, number, sessionNumber } = params;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isBossTest, setIsBossTest] = useState(false);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    // Fetch session data from our backend
    const fetchSession = async () => {
      try {
        const res = await api.get(`/stages/${tier}/${number}/${sessionNumber}`);
        setSession(res.data);
      } catch (err) {
        console.error('Failed to load session', err);
        alert("Failed to load session. Did you run the seed endpoint?");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [tier, number, sessionNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Session not found</h1>
        <button onClick={() => router.push('/')} className="bg-indigo-600 px-6 py-2 rounded-lg">Go Home</button>
      </div>
    );
  }

  const allExercises = session.exercises;
  const currentExercise = allExercises[currentExerciseIndex];
  const isFinished = currentExerciseIndex >= allExercises.length;
  
  // Progress bar calculation
  const progress = (currentExerciseIndex / allExercises.length) * 100;

  const handleCompleteExercise = (pointsEarned: number) => {
    setXp(prev => prev + pointsEarned);
    setCurrentExerciseIndex(prev => prev + 1);
  };

  const finishLesson = async () => {
    try {
      if (session) {
        if (sessionNumber === 'boss') {
          await api.post(`/progress/stage/${session.stageId}/complete`, { xpEarned: xp });
        } else {
          await api.post(`/progress/stage/${session.stageId}/session/${sessionNumber}/complete`, { xpEarned: xp });
        }
      }
      // If successful, user is authenticated, go back to map
      router.push('/learn');
    } catch (error) {
      console.error("Failed to save progress", error);
      // If it fails (e.g., 401 Not Authorized), prompt account creation
      router.push('/auth/signup?reason=save_progress');
    }
  };
  const finishLessonWithGameXp = async (gameXp: number) => {
    try {
      if (session) {
        if (sessionNumber === 'boss') {
          await api.post(`/progress/stage/${session.stageId}/complete`, { xpEarned: gameXp });
        } else {
          await api.post(`/progress/stage/${session.stageId}/session/${sessionNumber}/complete`, { xpEarned: gameXp });
        }
      }
      router.push('/learn');
    } catch (error) {
      console.error("Failed to save progress", error);
      router.push('/auth/signup?reason=save_progress');
    }
  };

  // ─── FULL SESSION GAMIFIED UIs ──────────────────────────────
  if (session && sessionNumber !== 'boss') {
    // We use SentenceAssembler for grammar, and CastleBuilder for everything else
    if (session.skillType === 'grammar') {
      return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl h-full">
            <SentenceAssembler exercises={allExercises} onComplete={finishLessonWithGameXp} />
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl h-full">
            <CastleBuilder exercises={allExercises} onComplete={finishLessonWithGameXp} />
          </div>
        </div>
      );
    }
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px] pointer-events-none" />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="z-10 flex flex-col items-center text-center space-y-6"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">Lesson Complete!</h1>
          <p className="text-gray-400 text-xl">You earned <span className="text-green-400 font-bold">+{xp} XP</span></p>
          <button 
            onClick={finishLesson}
            className="mt-8 bg-green-500 hover:bg-green-600 text-black font-bold text-lg px-8 py-4 rounded-2xl w-full max-w-sm transition-all transform hover:scale-105"
          >
            Continue
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top Header & Progress */}
      <div className="w-full max-w-4xl mx-auto p-4 flex items-center space-x-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-white font-bold">{xp} XP</div>
      </div>

      {/* Exercise Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExerciseIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full flex flex-col items-center"
          >
            {/* We will build individual components for these later */}
            <div className="text-center mb-8">
              <span className="uppercase text-xs tracking-wider text-indigo-400 font-bold mb-2 block">
                {session.title} • {currentExercise.type}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {currentExercise.prompt}
              </h2>
            </div>

            <div className={`w-full max-w-md ${currentExercise.type !== 'boss_test' ? 'bg-gray-800/50 border border-gray-700 rounded-2xl p-8 shadow-xl backdrop-blur-sm' : ''} flex flex-col items-center space-y-6`}>
              {currentExercise.type === 'vocab' && (
                <VocabCard 
                  prompt={currentExercise.prompt} 
                  correctAnswer={currentExercise.correctAnswer || ''} 
                  options={currentExercise.options}
                  onCorrect={() => handleCompleteExercise(currentExercise.points)}
                />
              )}
              {currentExercise.type === 'grammar' && (
                <GrammarBuilder 
                  prompt={currentExercise.prompt} 
                  correctAnswer={currentExercise.correctAnswer || ''} 
                  options={currentExercise.options || []}
                  onCorrect={() => handleCompleteExercise(currentExercise.points)}
                />
              )}
              {currentExercise.type === 'listening' && (
                <AudioMatch 
                  prompt={currentExercise.prompt} 
                  audioUrl={currentExercise.audioUrl} 
                  correctAnswer={currentExercise.correctAnswer || ''} 
                  options={currentExercise.options}
                  onCorrect={() => handleCompleteExercise(currentExercise.points)}
                />
              )}
              {currentExercise.type === 'speaking' && (
                <VoiceRecorder 
                  prompt={currentExercise.prompt} 
                  onCorrect={() => handleCompleteExercise(currentExercise.points)}
                />
              )}
              {currentExercise.type === 'writing' && (
                <WritingTemplate 
                  prompt={currentExercise.prompt} 
                  correctAnswer={currentExercise.correctAnswer || ''}
                  onCorrect={() => handleCompleteExercise(currentExercise.points)}
                />
              )}
              {currentExercise.type === 'boss_test' && (
                <BossTest 
                  prompt={currentExercise.prompt} 
                  onCorrect={() => handleCompleteExercise(currentExercise.points)}
                />
              )}
              {/* Fallback for unbuilt types */}
              {currentExercise.type !== 'vocab' && currentExercise.type !== 'grammar' && currentExercise.type !== 'listening' && currentExercise.type !== 'speaking' && currentExercise.type !== 'writing' && currentExercise.type !== 'boss_test' && (
                <>
                  <p className="text-gray-400">Interactive {currentExercise.type} UI is under construction.</p>
                  <button 
                    onClick={() => handleCompleteExercise(currentExercise.points)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    Simulate Correct Answer
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
