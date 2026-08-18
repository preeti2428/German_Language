"use client";

import { useState } from "react";
import { Video, Calendar, Clock, PlayCircle, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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
    isEnrolled: true,
    color: "#CE82FF", // Purple
  },
  {
    id: 2,
    title: "Ordering Food Like a Local",
    instructor: "Jai Man",
    date: "Friday, 10:00 AM EST",
    level: "A1",
    duration: "30 min",
    enrolled: 56,
    isEnrolled: false,
    color: "#FF9600", // Orange
  }
];

const VOD_LIBRARY = [
  {
    id: 101,
    title: "Der, Die, Das - The Ultimate Guide",
    level: "A1",
    duration: "15 min",
    views: "12k",
    color: "#1CB0F6", // Blue
  },
  {
    id: 102,
    title: "Perfect Pronunciation: The 'R' Sound",
    level: "All Levels",
    duration: "8 min",
    views: "45k",
    color: "#FF4B4B", // Red
  },
  {
    id: 103,
    title: "Navigating Berlin Hbf",
    level: "A2",
    duration: "20 min",
    views: "8k",
    color: "#00CD9C", // Teal
  }
];

export default function ClassesPage() {
  const [activeTab, setActiveTab] = useState("live");

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 mb-2 uppercase tracking-wide">Classes & Workshops</h1>
          <p className="text-gray-500 font-bold text-lg">Join live sessions or watch recordings on-demand.</p>
        </div>
        
        {/* Chunky Gamified Tab Switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-2 w-max border-b-4 border-gray-200">
          <button 
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === "live" 
                ? "bg-white text-[#1CB0F6] border-2 border-gray-200 shadow-sm" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Calendar size={20} strokeWidth={3} /> Live Classes
          </button>
          <button 
            onClick={() => setActiveTab("vod")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === "vod" 
                ? "bg-white text-[#FF9600] border-2 border-gray-200 shadow-sm" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <PlayCircle size={20} strokeWidth={3} /> Video Library
          </button>
        </div>
      </div>

      {activeTab === "live" ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {UPCOMING_LIVE_CLASSES.map((cls) => (
              <div 
                key={cls.id} 
                className="bg-white border-[3px] border-gray-200 rounded-[2.5rem] p-6 shadow-[0_8px_0_#e5e5e5] flex flex-col h-full relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-[0_12px_0_#e5e5e5]"
              >
                <div className="flex justify-between items-start mb-6">
                  <span 
                    className="px-4 py-1.5 rounded-xl text-white font-black uppercase tracking-widest text-xs"
                    style={{ backgroundColor: cls.color, borderBottom: `4px solid ${cls.color}90` }}
                  >
                    Level {cls.level}
                  </span>
                  {cls.isEnrolled && (
                    <span className="flex items-center gap-1 text-[#58CC02] font-black text-sm bg-[#58CC02]/10 px-3 py-1.5 rounded-xl border-2 border-[#58CC02]/20">
                      <CheckCircle2 size={16} strokeWidth={3} /> Enrolled
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-black text-gray-800 mb-6 leading-tight">
                  {cls.title}
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar size={20} className="text-gray-700" strokeWidth={2.5} />
                    </div>
                    {cls.date}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock size={20} className="text-gray-700" strokeWidth={2.5} />
                    </div>
                    {cls.duration}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Users size={20} className="text-gray-700" strokeWidth={2.5} />
                    </div>
                    {cls.enrolled} students
                  </div>
                </div>

                <div className="mt-auto">
                  {cls.isEnrolled ? (
                    <button className="w-full py-4 font-black uppercase tracking-wider text-gray-500 border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors flex items-center justify-center gap-2 border-b-[4px] active:border-b-2 active:translate-y-[2px]">
                      <Video size={20} strokeWidth={3} /> Join Meeting
                    </button>
                  ) : (
                    <button 
                      className="w-full py-4 font-black uppercase tracking-widest text-white rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#58CC02", borderBottom: "6px solid #46A302" }}
                    >
                      Enroll for Free
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VOD_LIBRARY.map((video) => (
              <div 
                key={video.id} 
                className="bg-white border-[3px] border-gray-200 rounded-[2.5rem] overflow-hidden shadow-[0_8px_0_#e5e5e5] hover:-translate-y-1 hover:shadow-[0_12px_0_#e5e5e5] transition-all cursor-pointer group flex flex-col"
              >
                {/* Gamified Thumbnail Placeholder */}
                <div 
                  className="w-full h-48 relative flex items-center justify-center border-b-[3px] border-gray-200"
                  style={{ backgroundColor: `${video.color}20` }}
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"
                    style={{ backgroundColor: video.color }}
                  >
                    <PlayCircle size={32} className="text-white translate-x-1" strokeWidth={2.5} />
                  </div>
                  <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs font-black px-3 py-1.5 rounded-xl border-2 border-gray-700">
                    {video.duration}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <span 
                    className="text-xs font-black uppercase tracking-widest mb-3 block"
                    style={{ color: video.color }}
                  >
                    Level {video.level}
                  </span>
                  <h3 className="text-xl font-black text-gray-800 mb-4 leading-tight">
                    {video.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between text-gray-500 font-bold text-sm bg-gray-50 p-3 rounded-xl border-2 border-gray-100">
                    <span>{video.views} views</span>
                    <span>Teacher Jai</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
