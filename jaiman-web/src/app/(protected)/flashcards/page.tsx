"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, ChevronRight, ChevronLeft, RotateCw, Check, X, Flame, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data for Flashcards
const FLASHCARD_DECKS = [
  {
    id: 1,
    title: "A1 Core Verbs",
    cardCount: 25,
    mastered: 10,
    color: "#4361EE", // Blue
    cards: [
      { id: 101, front: "Sein", back: "To be", example: "Ich bin müde. (I am tired.)" },
      { id: 102, front: "Haben", back: "To have", example: "Ich habe einen Hund. (I have a dog.)" },
      { id: 103, front: "Machen", back: "To make/do", example: "Was machst du? (What are you doing?)" },
    ]
  },
  {
    id: 2,
    title: "Food & Dining",
    cardCount: 40,
    mastered: 0,
    color: "#FF9F43", // Orange
    cards: [
      { id: 201, front: "Der Apfel", back: "The apple", example: "Der Apfel ist rot. (The apple is red.)" },
      { id: 202, front: "Das Brot", back: "The bread", example: "Ich esse Brot. (I eat bread.)" },
    ]
  },
  {
    id: 3,
    title: "Travel & Directions",
    cardCount: 30,
    mastered: 30,
    color: "#20BF6B", // Green
    cards: [
      { id: 301, front: "Der Bahnhof", back: "The train station", example: "Wo ist der Bahnhof? (Where is the train station?)" }
    ]
  }
];

// Circular Progress Ring
function MasteryRing({ progress, color }: { progress: number, color: string }) {
  const radius = 24;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress / 100 * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="#E2E8F0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute text-[10px] font-black" style={{ color }}>{progress}%</span>
    </div>
  );
}

export default function FlashcardsPage() {
  const [activeDeck, setActiveDeck] = useState<typeof FLASHCARD_DECKS[0] | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = useCallback(() => {
    if (activeDeck && currentCardIndex < activeDeck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
    }
  }, [activeDeck, currentCardIndex]);

  const handlePrev = useCallback(() => {
    if (activeDeck && currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
    }
  }, [activeDeck, currentCardIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!activeDeck) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeck, handleNext, handlePrev, handleFlip]);

  const closeDeck = () => {
    setActiveDeck(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  if (activeDeck) {
    const currentCard = activeDeck.cards[currentCardIndex];
    const progress = Math.round(((currentCardIndex + 1) / activeDeck.cards.length) * 100);

    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col pb-20">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={closeDeck}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 font-black uppercase tracking-widest text-xs transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={3} /> Back to Decks
          </button>
          <div className="flex items-center gap-4">
            <span className="font-black text-xl text-gray-900 tracking-tight">{activeDeck.title}</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-xl text-xs font-black">
              {currentCardIndex + 1} / {activeDeck.cards.length}
            </span>
          </div>
        </div>

        {/* Gamified Progress Track */}
        <div className="duo-progress-track h-3 mb-12 w-full max-w-2xl mx-auto">
          <div 
            className="duo-progress-fill transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: activeDeck.color }}
          ></div>
        </div>

        {/* Flashcard Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-2xl mx-auto perspective-[1200px]">
          
          {/* Card Container (Animated Flip) */}
          <div 
            onClick={handleFlip}
            className={`w-full h-96 relative preserve-3d cursor-pointer transition-all duration-500 ease-out ${isFlipped ? 'rotate-y-180 scale-[1.02]' : 'hover:scale-[1.02]'} group`}
          >
            {/* Front Side */}
            <div className={`absolute inset-0 backface-hidden bg-white rounded-[2rem] flex flex-col items-center justify-center p-10 text-center shadow-[0_8px_0_rgba(0,0,0,0.05)] border-2 border-gray-100 transition-all ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
              <span className="absolute top-6 left-6 text-gray-400 font-black tracking-widest uppercase text-[10px] bg-gray-100 px-3 py-1.5 rounded-xl">German</span>
              <RotateCw size={24} strokeWidth={2.5} className="absolute top-6 right-6 text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
              
              <h2 className="text-5xl font-black text-gray-900 mb-8">{currentCard.front}</h2>
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border-2 border-gray-100">
                <kbd className="px-1.5 py-0.5 bg-white border-b-2 border-gray-200 rounded">Space</kbd> to flip
              </div>
            </div>

            {/* Back Side */}
            <div 
              className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] shadow-[0_8px_0_rgba(0,0,0,0.1)] border-2 flex flex-col items-center justify-center p-10 text-center transition-all ${!isFlipped ? 'opacity-0' : 'opacity-100'}`}
              style={{ backgroundColor: activeDeck.color, borderColor: 'rgba(0,0,0,0.1)' }}
            >
              <span className="absolute top-6 left-6 text-white bg-black/10 px-3 py-1.5 rounded-xl font-black tracking-widest uppercase text-[10px] shadow-sm">English</span>
              
              <h2 className="text-4xl font-black text-white mb-8 drop-shadow-sm">{currentCard.back}</h2>
              
              <div className="bg-black/10 w-full p-6 rounded-2xl mt-4 shadow-inner border border-black/5">
                <p className="text-white/90 font-bold text-base">"{currentCard.example}"</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-12 w-full justify-center relative">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              disabled={currentCardIndex === 0}
              className="absolute left-0 duo-btn w-12 h-12 p-0 flex items-center justify-center bg-white border-gray-200 text-gray-500 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={24} strokeWidth={3} className="mr-0.5" />
            </button>
            
            <div className="flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="duo-btn duo-btn-outline text-[#FF4757] border-gray-200 hover:bg-[#FF4757]/5 gap-2 px-8"
              >
                <X size={20} strokeWidth={3} /> Review Later
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="duo-btn gap-2 px-8 bg-[#20BF6B] text-white border-[#178B4E] hover:bg-[#1CA85D] active:border-b-0 active:mt-[4px]"
              >
                <Check size={20} strokeWidth={3} /> Got It
              </button>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              disabled={currentCardIndex === activeDeck.cards.length - 1}
              className="absolute right-0 duo-btn w-12 h-12 p-0 flex items-center justify-center bg-white border-gray-200 text-gray-500 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={24} strokeWidth={3} className="ml-0.5" />
            </button>
          </div>
          
          <div className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
            Use <kbd className="px-1.5 py-0.5 bg-white border-b-2 border-gray-200 rounded mx-1">←</kbd> <kbd className="px-1.5 py-0.5 bg-white border-b-2 border-gray-200 rounded">→</kbd> to navigate
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-full pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Flashcard Decks</h1>
          <p className="text-gray-500 font-bold text-sm">Review vocabulary to boost your streak and earn XP.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-[#F0F3FF] border-2 border-[#E1E8FF] px-4 py-2 rounded-2xl text-[#4361EE] font-black text-xs uppercase tracking-widest">
            <Search size={16} strokeWidth={3} />
            <span>Search</span>
          </div>
          <div className="flex items-center gap-2 bg-white shadow-[0_3px_0_#e2e8f0] border-2 border-gray-100 px-4 py-2 rounded-2xl text-[#FF9F43] font-black text-xs uppercase tracking-widest">
            <Flame size={18} className="fill-[#FF9F43] text-[#FF9F43]" />
            <span>+50 XP Per Deck</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FLASHCARD_DECKS.map((deck) => {
          const progressPercent = Math.round((deck.mastered / deck.cardCount) * 100);
          const isMastered = progressPercent === 100;
          
          return (
            <motion.div 
              key={deck.id} 
              onClick={() => setActiveDeck(deck)}
              whileHover={{ y: -4 }}
              className="duo-card p-6 cursor-pointer group flex flex-col h-full relative"
              style={{
                borderTopWidth: '8px',
                borderTopColor: deck.color
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-[0_3px_0_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: deck.color }}
                >
                  <Layers size={24} strokeWidth={2.5} />
                </div>
                {/* Gamified Mastery Ring instead of text pill */}
                <MasteryRing progress={progressPercent} color={isMastered ? '#20BF6B' : deck.color} />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-6 leading-tight group-hover:text-[#4361EE] transition-colors">
                {deck.title}
              </h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between">
                 <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                   {deck.cardCount} Cards
                 </span>
                 {isMastered && (
                   <span className="text-[10px] font-black text-[#20BF6B] uppercase tracking-widest flex items-center gap-1">
                     <Check size={14} strokeWidth={4} /> Mastered
                   </span>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
