'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play } from 'lucide-react';

interface AudioMatchProps {
  prompt: string;
  audioUrl?: string;
  options?: string[];
  correctAnswer: string;
  onCorrect: () => void;
}

export default function AudioMatch({ prompt, audioUrl, options, correctAnswer, onCorrect }: AudioMatchProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const displayOptions = options && options.length > 0 
    ? options 
    : [correctAnswer, 'Guten Tag', 'Auf Wiedersehen'].sort(() => Math.random() - 0.5);

  const playAudio = () => {
    if (audioRef.current) {
      setIsPlaying(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error("Audio playback failed (missing file?):", e);
          // Fallback simulation
          setTimeout(() => setIsPlaying(false), 1500);
        });
      }
      audioRef.current.onended = () => setIsPlaying(false);
    } else {
      // Mock playback for development if no audio URL is provided
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 1500);
    }
  };

  const handleSelect = (option: string) => {
    setSelected(option);
    if (option === correctAnswer) {
      setIsWrong(false);
      setTimeout(onCorrect, 1000);
    } else {
      setIsWrong(true);
      setTimeout(() => {
        setSelected(null);
        setIsWrong(false);
      }, 1000);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-8 items-center">
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={playAudio}
        className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all hover:bg-indigo-500"
      >
        {isPlaying ? (
          <Volume2 className="w-10 h-10 text-white animate-pulse" />
        ) : (
          <Play className="w-10 h-10 text-white ml-2" />
        )}
      </motion.button>
      
      <p className="text-gray-400 font-medium">Listen and choose the matching phrase</p>

      <div className="grid grid-cols-1 gap-4 w-full mt-4">
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
              className={`w-full py-4 px-6 rounded-xl border-2 text-lg font-medium text-white transition-all backdrop-blur-sm ${bgColor} ${borderColor} ${selected ? 'cursor-default' : 'hover:border-indigo-500 cursor-pointer'}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
