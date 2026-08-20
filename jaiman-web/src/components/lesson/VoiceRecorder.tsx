'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Star } from 'lucide-react';

interface VoiceRecorderProps {
  prompt: string;
  onCorrect: () => void;
}

export default function VoiceRecorder({ prompt, onCorrect }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Note: For a real app, we would use the MediaRecorder API here
  // and send the audio blob to our backend for speech-to-text / pronunciation scoring.
  // For the MVP, we will simulate the recording and scoring process.

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate API call for pronunciation scoring
      setTimeout(() => {
        setIsProcessing(false);
        // Simulate a good score (3 stars)
        setScore(3);
        
        // Auto-advance after showing the score
        setTimeout(() => {
          onCorrect();
        }, 2500);
      }, 1500);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8">
      
      <div className="text-center p-6 bg-gray-800/80 border border-gray-700 rounded-2xl w-full">
        <p className="text-gray-400 mb-2 uppercase text-sm font-bold tracking-widest">Say this aloud:</p>
        <p className="text-2xl font-bold text-white">{prompt.replace('Say: ', '')}</p>
      </div>

      <AnimatePresence mode="wait">
        {!score && (
          <motion.div 
            key="recorder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecordToggle}
              disabled={isProcessing}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-pulse' 
                  : isProcessing
                    ? 'bg-gray-600'
                    : 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:bg-indigo-500'
              }`}
            >
              {isRecording ? (
                <Square className="w-10 h-10 text-white fill-current" />
              ) : isProcessing ? (
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </motion.button>
            
            <p className="text-gray-400 font-medium">
              {isRecording ? "Tap to stop" : isProcessing ? "Analyzing pronunciation..." : "Tap to record"}
            </p>
          </motion.div>
        )}

        {score && (
          <motion.div
            key="score"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="flex space-x-2">
              {[1, 2, 3].map((star) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: star * 0.2 }}
                >
                  <Star 
                    className={`w-12 h-12 ${star <= score ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-gray-600'}`} 
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-2xl font-bold text-green-400">Ausgezeichnet!</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
