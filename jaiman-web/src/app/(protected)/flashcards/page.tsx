"use client";

import { useState } from "react";
import { Layers, ChevronRight, ChevronLeft, RotateCw, Check, X, Flame } from "lucide-react";
import { motion } from "framer-motion";

// Mock Data for Flashcards
const FLASHCARD_DECKS = [
  {
    id: 1,
    title: "A1 Core Verbs",
    cardCount: 25,
    mastered: 10,
    color: "#1CB0F6", // Blue
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
    color: "#FF9600", // Orange
    cards: [
      { id: 201, front: "Der Apfel", back: "The apple", example: "Der Apfel ist rot. (The apple is red.)" },
      { id: 202, front: "Das Brot", back: "The bread", example: "Ich esse Brot. (I eat bread.)" },
    ]
  }
];

export default function FlashcardsPage() {
  const [activeDeck, setActiveDeck] = useState<typeof FLASHCARD_DECKS[0] | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    if (activeDeck && currentCardIndex < activeDeck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (activeDeck && currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const closeDeck = () => {
    setActiveDeck(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  if (activeDeck) {
    const currentCard = activeDeck.cards[currentCardIndex];
    const progress = Math.round(((currentCardIndex + 1) / activeDeck.cards.length) * 100);

    return (
      <div className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={closeDeck}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-black uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={3} /> Back to Decks
          </button>
          <div className="flex items-center gap-4">
            <span className="font-black text-xl text-gray-800 uppercase tracking-widest">{activeDeck.title}</span>
            <span className="px-4 py-2 bg-gray-200 border-2 border-gray-300 text-gray-600 rounded-xl text-sm font-black shadow-sm">
              {currentCardIndex + 1} / {activeDeck.cards.length}
            </span>
          </div>
        </div>

        {/* Gamified Progress Bar */}
        <div className="w-full h-4 bg-gray-200 rounded-full mb-12 overflow-hidden border-2 border-gray-300 shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: activeDeck.color }}
          ></div>
        </div>

        {/* Flashcard Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-2xl mx-auto perspective-1000">
          
          {/* Card Container (Animated Flip) */}
          <div 
            onClick={handleFlip}
            className={`w-full h-96 relative preserve-3d cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isFlipped ? 'rotate-y-180 scale-105' : 'hover:scale-[1.02]'}`}
          >
            {/* Front Side */}
            <div className={`absolute inset-0 backface-hidden bg-white border-[4px] rounded-[3rem] flex flex-col items-center justify-center p-10 text-center transition-all duration-500 shadow-[0_12px_0_#e5e5e5] ${isFlipped ? 'border-transparent shadow-none' : 'border-gray-200'}`}>
              <span className="absolute top-8 left-8 text-gray-400 font-black tracking-widest uppercase text-sm bg-gray-100 px-4 py-1.5 rounded-xl border-2 border-gray-200">German</span>
              <RotateCw size={28} strokeWidth={2.5} className="absolute top-8 right-8 text-gray-400" />
              
              <h2 className="text-6xl font-black text-gray-800 drop-shadow-sm">{currentCard.front}</h2>
              <p className="mt-12 px-6 py-3 bg-gray-100 rounded-2xl text-gray-400 font-bold text-xs max-w-sm mx-auto uppercase tracking-widest border-2 border-gray-200">Tap anywhere to flip</p>
            </div>

            {/* Back Side */}
            <div 
              className="absolute inset-0 backface-hidden rotate-y-180 rounded-[3rem] border-[4px] shadow-[0_12px_0_rgba(0,0,0,0.2)] flex flex-col items-center justify-center p-10 text-center"
              style={{ backgroundColor: activeDeck.color, borderColor: 'rgba(255,255,255,0.5)' }}
            >
              <span className="absolute top-8 left-8 text-white bg-black/20 px-4 py-1.5 rounded-xl font-black tracking-widest uppercase text-sm border-2 border-white/30 shadow-sm">English</span>
              
              <h2 className="text-5xl font-black text-white mb-8 drop-shadow-md">{currentCard.back}</h2>
              
              <div className="bg-black/20 w-full p-6 rounded-3xl border-2 border-white/20 shadow-inner mt-4">
                <p className="text-white font-bold text-lg">"{currentCard.example}"</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-6 mt-16 w-full justify-between">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              disabled={currentCardIndex === 0}
              className="p-4 rounded-2xl bg-white border-2 border-gray-200 border-b-[4px] text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-all active:border-b-2 active:translate-y-[2px]"
            >
              <ChevronLeft size={28} strokeWidth={3} />
            </button>
            
            <div className="flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#FF4B4B] text-white font-black uppercase tracking-widest hover:brightness-110 transition-all border-b-[6px] border-[#D93838] active:border-b-0 active:translate-y-[6px]"
              >
                <X size={24} strokeWidth={3} /> Still Learning
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#58CC02] text-white font-black uppercase tracking-widest hover:brightness-110 transition-all border-b-[6px] border-[#46A302] active:border-b-0 active:translate-y-[6px]"
              >
                <Check size={24} strokeWidth={3} /> Got It
              </button>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              disabled={currentCardIndex === activeDeck.cards.length - 1}
              className="p-4 rounded-2xl bg-white border-2 border-gray-200 border-b-[4px] text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-all active:border-b-2 active:translate-y-[2px]"
            >
              <ChevronRight size={28} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 mb-2 uppercase tracking-wide">Flashcard Decks</h1>
          <p className="text-gray-500 font-bold text-lg">Review vocabulary to boost your streak and earn XP.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-orange-50 border-2 border-orange-200 border-b-[4px] px-5 py-3 rounded-2xl text-orange-600 font-black uppercase tracking-widest">
          <Flame size={24} strokeWidth={3} className="fill-orange-500 text-orange-600" />
          <span>+50 XP per Deck</span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {FLASHCARD_DECKS.map((deck) => {
          const progressPercent = Math.round((deck.mastered / deck.cardCount) * 100);
          
          return (
            <div 
              key={deck.id} 
              onClick={() => setActiveDeck(deck)}
              className="bg-white border-[3px] border-gray-200 rounded-[2.5rem] p-6 shadow-[0_8px_0_#e5e5e5] hover:-translate-y-1 hover:shadow-[0_12px_0_#e5e5e5] transition-all cursor-pointer group flex flex-col h-full relative"
            >
              <div className="flex justify-between items-start mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white border-b-[4px] shadow-sm"
                  style={{ backgroundColor: deck.color, borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <Layers size={32} strokeWidth={2.5} />
                </div>
                <div className="bg-gray-100 border-2 border-gray-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500">
                  {deck.cardCount} Cards
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-gray-800 mb-8 leading-tight">
                {deck.title}
              </h3>
              
              <div className="mt-auto">
                <div className="flex justify-between text-sm font-black uppercase tracking-widest text-gray-400 mb-3">
                  <span>Progress</span>
                  <span className={progressPercent === 100 ? "text-[#58CC02]" : "text-gray-800"} style={{ color: progressPercent > 0 && progressPercent < 100 ? deck.color : undefined }}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progressPercent}%`, 
                      backgroundColor: progressPercent === 100 ? "#58CC02" : deck.color 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
