"use client";

import { useState } from "react";
import { Video, Calendar, Clock, PlayCircle, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data for Classes
const UPCOMING_LIVE_CLASSES = [
  {
    id: 1,
    title: "Mastering the Dative Case",
    instructor: "Jai Man",
    date: "Tomorrow, 6:00 PM EST",
    level: "A2",
    duration: "45 min",
    enrolled: 24,
    seatsLeft: 0,
    isEnrolled: true,
    color: "#20BF6B", // Duolingo Green
  },
  {
    id: 2,
    title: "Ordering Food Like a Local",
    instructor: "Jai Man",
    date: "Friday, 10:00 AM EST",
    level: "A1",
    duration: "30 min",
    enrolled: 56,
    seatsLeft: 4,
    isEnrolled: false,
    color: "#FF9F43", // Orange
  },
  {
    id: 3,
    title: "Understanding German Culture",
    instructor: "Jai Man",
    date: "Sunday, 2:00 PM EST",
    level: "All Levels",
    duration: "60 min",
    enrolled: 12,
    seatsLeft: 18,
    isEnrolled: false,
    color: "#4361EE", // Blue
  }
];

const VOD_LIBRARY = [
  {
    id: 101,
    title: "Der, Die, Das - The Ultimate Guide",
    level: "A1",
    duration: "15 min",
    views: "12k",
    color: "#4361EE", // Blue
  },
  {
    id: 102,
    title: "Perfect Pronunciation: The 'R' Sound",
    level: "All Levels",
    duration: "8 min",
    views: "45k",
    color: "#FF4757", // Red
  },
  {
    id: 103,
    title: "Navigating Berlin Hbf",
    level: "A2",
    duration: "20 min",
    views: "8k",
    color: "#20BF6B", // Green
  }
];

export default function ClassesPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-full pb-20">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Classes & Workshops</h1>
          <p className="text-gray-500 font-bold text-lg">Join live sessions or watch recordings on-demand.</p>
        </div>
        
        {/* Gamified Tab Switcher */}
        <div className="flex bg-gray-100 rounded-[1.25rem] p-1.5 w-max border-2 border-gray-200">
          <button 
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeTab === "live" 
                ? "bg-white text-[#4361EE] shadow-[0_3px_0_#e2e8f0]" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            }`}
          >
            <Calendar size={20} strokeWidth={3} /> Live Classes
          </button>
          <button 
            onClick={() => setActiveTab("vod")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeTab === "vod" 
                ? "bg-white text-[#FF9F43] shadow-[0_3px_0_#e2e8f0]" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            }`}
          >
            <PlayCircle size={20} strokeWidth={3} /> Video Library
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "live" ? (
          <motion.div 
            key="live"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {UPCOMING_LIVE_CLASSES.map((cls) => (
              <motion.div 
                key={cls.id} 
                onHoverStart={() => setHoveredCardId(cls.id)}
                onHoverEnd={() => setHoveredCardId(null)}
                className="duo-card flex flex-col h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group"
                style={{
                  borderTopWidth: '8px',
                  borderTopColor: cls.color
                }}
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span 
                      className="px-3 py-1 rounded-xl text-white font-black uppercase tracking-widest text-[10px]"
                      style={{ backgroundColor: cls.color, borderBottom: `2px solid rgba(0,0,0,0.2)` }}
                    >
                      Level {cls.level}
                    </span>
                    {cls.isEnrolled && (
                      <span className="flex items-center gap-1 text-[#20BF6B] font-black text-xs bg-[#20BF6B]/10 px-3 py-1 rounded-xl border-2 border-[#20BF6B]/20">
                        <CheckCircle2 size={14} strokeWidth={3} /> Enrolled
                      </span>
                    )}
                    {!cls.isEnrolled && cls.seatsLeft > 0 && cls.seatsLeft <= 5 && (
                      <span className="flex items-center gap-1 text-[#FF4757] font-black text-xs bg-[#FF4757]/10 px-3 py-1 rounded-xl border-2 border-[#FF4757]/20 animate-pulse">
                        <AlertCircle size={14} strokeWidth={3} /> {cls.seatsLeft} seats left
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-900 mb-6 leading-tight group-hover:text-[#4361EE] transition-colors">
                    {cls.title}
                  </h3>
                  
                  <div className="space-y-4 mb-8 mt-auto">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                      <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-[#4361EE]/10 group-hover:text-[#4361EE] transition-colors">
                        <Calendar size={18} strokeWidth={2.5} />
                      </div>
                      {cls.date}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                      <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-[#FF9F43]/10 group-hover:text-[#FF9F43] transition-colors">
                        <Clock size={18} strokeWidth={2.5} />
                      </div>
                      {cls.duration}
                    </div>
                    <motion.div 
                      animate={{ 
                        height: hoveredCardId === cls.id ? 'auto' : 0, 
                        opacity: hoveredCardId === cls.id ? 1 : 0,
                        marginTop: hoveredCardId === cls.id ? 16 : 0
                      }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                        <div className="p-2 bg-gray-100 rounded-xl">
                          <Users size={18} strokeWidth={2.5} />
                        </div>
                        {cls.enrolled} students enrolled
                      </div>
                    </motion.div>
                  </div>

                  <div className="mt-auto">
                    {cls.isEnrolled ? (
                      <button className="duo-btn duo-btn-outline w-full gap-2">
                        <Video size={18} strokeWidth={3} /> Join Meeting
                      </button>
                    ) : (
                      <button 
                        className="duo-btn w-full gap-2 bg-[#20BF6B] border-[#178B4E] text-white hover:bg-[#1CA85D] active:border-b-0 active:mt-[4px]"
                      >
                        Enroll for Free
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="vod"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {VOD_LIBRARY.map((video) => (
              <div 
                key={video.id} 
                className="duo-card overflow-hidden hover:-translate-y-2 group flex flex-col cursor-pointer transition-all duration-300"
              >
                {/* Gamified Thumbnail Placeholder */}
                <div 
                  className="w-full h-48 relative flex items-center justify-center border-b-[4px] border-gray-100 overflow-hidden"
                  style={{ backgroundColor: `${video.color}15` }}
                >
                  {/* Decorative background circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full mix-blend-multiply opacity-40 blur-3xl group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: video.color }}></div>

                  <div 
                    className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-[0_6px_0_rgba(0,0,0,0.2)] group-hover:scale-110 group-active:scale-95 group-active:translate-y-1 group-active:shadow-none transition-all z-10"
                    style={{ backgroundColor: video.color }}
                  >
                    <PlayCircle size={32} className="text-white ml-1" strokeWidth={2.5} />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 border-gray-200 shadow-sm z-10">
                    {video.duration}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <span 
                    className="text-[10px] font-black uppercase tracking-widest mb-3 block"
                    style={{ color: video.color }}
                  >
                    Level {video.level}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mb-4 leading-tight group-hover:text-[#4361EE] transition-colors">
                    {video.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between text-gray-500 font-bold text-xs bg-gray-50 p-3 rounded-xl border-2 border-gray-100">
                    <span>{video.views} views</span>
                    <span>Teacher Jai</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
