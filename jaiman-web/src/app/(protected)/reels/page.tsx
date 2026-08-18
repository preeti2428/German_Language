"use client";

import { useState, useRef } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Mock data for the reels
const MOCK_REELS = [
  {
    id: 1,
    title: "Ordering Coffee in Berlin ☕",
    german: "Ich hätte gerne einen Kaffee, bitte.",
    english: "I would like a coffee, please.",
    level: "A1",
    likes: 1205,
    comments: 45,
    bgColor: "#FF4B4B", // Red
  },
  {
    id: 2,
    title: "Train Station Basics 🚂",
    german: "Wo ist der Bahnhof?",
    english: "Where is the train station?",
    level: "A1",
    likes: 892,
    comments: 12,
    bgColor: "#FF9600", // Orange
  },
  {
    id: 3,
    title: "Casual Greeting 👋",
    german: "Wie geht's dir heute?",
    english: "How are you doing today?",
    level: "A2",
    likes: 2341,
    comments: 89,
    bgColor: "#CE82FF", // Purple
  }
];

export default function ReelsPage() {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight } = e.currentTarget;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== currentReelIndex && index >= 0 && index < MOCK_REELS.length) {
      setCurrentReelIndex(index);
    }
  };

  return (
    <div 
      className="h-full w-full bg-[#111315] overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative"
      onScroll={handleScroll}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Subtle dark pattern background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>

      {MOCK_REELS.map((reel, index) => {
        const isActive = index === currentReelIndex;
        
        return (
          <div 
            key={reel.id} 
            className="h-full w-full snap-start snap-always relative flex items-center justify-center py-6 px-4 z-10"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ 
                scale: isActive ? 1 : 0.85, 
                opacity: isActive ? 1 : 0.4,
                y: isActive ? 0 : 20 
              }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-full max-w-md h-[95%] rounded-[3rem] overflow-hidden flex flex-col justify-between"
              style={{ 
                backgroundColor: reel.bgColor,
                border: '8px solid white',
                boxShadow: '10px 10px 0px rgba(0,0,0,0.1)'
              }}
            >
              
              {/* Header */}
              <div className="flex justify-between items-center p-6 z-20">
                <div className="bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border-2 border-white/50 text-white font-black tracking-widest uppercase text-xs shadow-sm">
                  Level {reel.level}
                </div>
                <button className="bg-white/30 backdrop-blur-md p-3 rounded-full border-2 border-white/50 text-white hover:bg-white hover:text-black transition-all active:scale-90">
                  <Volume2 size={24} strokeWidth={3} />
                </button>
              </div>

              {/* Center Content (The Lesson) */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center z-20">
                <motion.div 
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: isActive ? 1 : 0.8, rotate: isActive ? 0 : -5 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="bg-white text-black p-8 rounded-[2.5rem] border-b-[8px] border-black/10 shadow-2xl relative w-full"
                >
                  {/* Decorative speech bubble tail */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rotate-45 border-r-[8px] border-b-[8px] border-black/10"></div>
                  
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Listen & Repeat</h3>
                  <p className="text-4xl font-black text-gray-800 mb-6 leading-tight">
                    {reel.german}
                  </p>
                  
                  <div className="h-1 w-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
                  
                  <p className="text-xl font-bold text-gray-500">
                    "{reel.english}"
                  </p>
                </motion.div>
              </div>

              {/* Bottom Actions & Title */}
              <div className="p-6 z-20 flex justify-between items-end">
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border-2 border-white/20 text-white max-w-[70%] shadow-lg">
                  <p className="font-black text-lg leading-tight drop-shadow-sm">{reel.title}</p>
                </div>

                {/* Vertical Action Buttons */}
                <div className="flex flex-col items-center space-y-4">
                  <ActionBtn icon={<Heart size={24} className={isActive && index === 0 ? "fill-red-500 text-red-500" : ""} />} label={reel.likes} color="text-red-500" />
                  <ActionBtn icon={<MessageCircle size={24} />} label={reel.comments} color="text-blue-500" />
                  <ActionBtn icon={<Bookmark size={24} />} label="Save" color="text-green-500" />
                  <ActionBtn icon={<Share2 size={24} />} label="Share" color="text-yellow-500" />
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// Helper component for chunky gamified buttons
function ActionBtn({ icon, label, color }: { icon: React.ReactNode, label: string | number, color: string }) {
  return (
    <button className={`group flex flex-col items-center text-white transition-all active:scale-90 ${color}`}>
      <div className="p-4 bg-white rounded-full shadow-[0_5px_0_rgba(0,0,0,0.1)] group-hover:-translate-y-1 group-active:translate-y-1 group-active:shadow-none transition-all text-gray-800 group-hover:text-current">
        {icon}
      </div>
      <span className="text-xs font-black mt-2 drop-shadow-md bg-black/40 px-2 py-1 rounded-full">{label}</span>
    </button>
  );
}
