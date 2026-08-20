"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy } from "lucide-react";

const WORD_PAIRS = [
  { id: 1, de: "Apfel", en: "Apple" },
  { id: 2, de: "Brot", en: "Bread" },
  { id: 3, de: "Milch", en: "Milk" },
  { id: 4, de: "Wasser", en: "Water" },
  { id: 5, de: "Kaffee", en: "Coffee" },
  { id: 6, de: "Tee", en: "Tea" },
];

export default function WordMatcher({ onComplete }: { onComplete: (xpEarned: number) => void }) {
  const [items, setItems] = useState<{ id: string; text: string; pairId: number; type: "de" | "en"; status: "idle" | "selected" | "matched" | "error" }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // Initialize shuffled game board
    const boardItems = WORD_PAIRS.flatMap(pair => [
      { id: `de-${pair.id}`, text: pair.de, pairId: pair.id, type: "de" as const, status: "idle" as const },
      { id: `en-${pair.id}`, text: pair.en, pairId: pair.id, type: "en" as const, status: "idle" as const }
    ]);
    
    // Simple Fisher-Yates shuffle
    for (let i = boardItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [boardItems[i], boardItems[j]] = [boardItems[j], boardItems[i]];
    }
    
    setItems(boardItems);
  }, []);

  function handleItemClick(id: string) {
    const itemIndex = items.findIndex(i => i.id === id);
    const item = items[itemIndex];

    if (item.status === "matched" || item.status === "error") return;
    
    if (selectedIds.includes(id)) {
      // Deselect
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: "idle" } : i));
      return;
    }

    if (selectedIds.length === 0) {
      // First selection
      setSelectedIds([id]);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: "selected" } : i));
    } else if (selectedIds.length === 1) {
      // Second selection
      const firstSelectedId = selectedIds[0];
      const firstItem = items.find(i => i.id === firstSelectedId)!;
      
      setSelectedIds([firstSelectedId, id]);
      
      if (firstItem.pairId === item.pairId) {
        // Match!
        setItems(prev => prev.map(i => (i.id === id || i.id === firstSelectedId) ? { ...i, status: "matched" } : i));
        setXp(prev => prev + 20);
        setSelectedIds([]);
        
        // Check if finished
        setTimeout(() => {
          setItems(currentItems => {
            if (currentItems.every(i => i.status === "matched")) {
              setFinished(true);
            }
            return currentItems;
          });
        }, 500);

      } else {
        // Mismatch!
        setItems(prev => prev.map(i => (i.id === id || i.id === firstSelectedId) ? { ...i, status: "error" } : i));
        setTimeout(() => {
          setItems(prev => prev.map(i => (i.id === id || i.id === firstSelectedId) ? { ...i, status: "idle" } : i));
          setSelectedIds([]);
        }, 800);
      }
    }
  }

  if (finished) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F9FF] to-[#EEF2FF] rounded-3xl p-8">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Perfect Match!</h2>
        <p className="text-gray-500 font-bold mb-6">You earned <span className="text-[#FF9F43] font-black">{xp} XP</span>!</p>
        <button
          onClick={() => onComplete(xp)}
          className="duo-btn duo-btn-blue px-6 py-3"
        >
          Continue to Map ✨
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[70vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl p-6 md:p-10">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-[#CE82FF] uppercase tracking-widest mb-1">⚔️ Word Matcher</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Tap the matching pairs</h1>
        </div>
        <div className="flex items-center gap-2 duo-card px-4 py-2 border-b-[3px] border-[#d4aa70]">
          <Zap size={16} className="text-[#FF9F43] fill-[#FF9F43]" />
          <span className="font-black text-gray-800 text-sm">{xp} XP</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto w-full">
        <AnimatePresence>
          {items.map((item) => {
            
            let bgClass = "bg-white border-2 border-gray-200 text-gray-700 shadow-[0_4px_0_#CBD5E0]";
            
            if (item.status === "selected") {
              bgClass = "bg-[#F0F3FF] border-2 border-[#4361EE] text-[#4361EE] shadow-none translate-y-[4px]";
            } else if (item.status === "matched") {
              bgClass = "bg-[#E8FBF0] border-2 border-[#20BF6B] text-[#20BF6B] shadow-none opacity-50 scale-95 pointer-events-none";
            } else if (item.status === "error") {
              bgClass = "bg-[#FFF0F0] border-2 border-[#FF4757] text-[#FF4757] shadow-none";
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                whileTap={item.status === "idle" ? { scale: 0.95, y: 4, boxShadow: "none" } : {}}
                animate={item.status === "error" ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.2 }}
                className={`duo-card flex items-center justify-center p-4 min-h-[80px] rounded-2xl text-lg font-black transition-colors ${bgClass}`}
              >
                {item.text}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
