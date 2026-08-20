"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Search, Bell, Globe, User, Settings, ChevronRight, Flame, Zap, Trophy, Medal, Star } from "lucide-react";
import { motion } from "framer-motion";

// Circular Progress Ring for Avatar
function AvatarRing({ progress, level, children }: { progress: number, level: string, children: React.ReactNode }) {
  const radius = 64;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress / 100 * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32 mb-4 group">
      <svg height={radius * 2} width={radius * 2} className="absolute inset-0 rotate-[-90deg] drop-shadow-[0_0_15px_rgba(255,159,67,0.5)]">
        <circle
          stroke="#F0F3FF"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#FF9F43"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="w-[104px] h-[104px] rounded-full overflow-hidden relative flex justify-center z-10 border-4 border-white shadow-md group-hover:scale-105 transition-transform bg-gradient-to-br from-[#D9A441] to-[#F1C40F]">
        {children}
      </div>
      <div className="absolute -bottom-2 bg-[#FF9F43] text-white text-[10px] font-black px-3 py-1 rounded-xl border-2 border-white shadow-sm z-20 uppercase tracking-widest">
        {level}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth();
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [formData, setFormData] = useState({
    name: "",
    nativeLanguage: "English",
    learningLanguage: "German",
    level: "A1 (Beginner)",
    darkMode: false,
  });

  const [initialData, setInitialData] = useState(formData);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        const loadedData = {
          name: data.name || "Preeti",
          nativeLanguage: data.nativeLanguage || "English",
          learningLanguage: data.learningLanguage || "German",
          level: data.level === "A1" ? "A1 (Beginner)" : data.level || "A1 (Beginner)",
          darkMode: data.preferences?.darkMode || false,
        };
        
        setFormData(loadedData);
        setInitialData(loadedData);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [token]);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    
    try {
      // Map "A1 (Beginner)" back to "A1" for backend if needed
      const levelToSend = formData.level.split(" ")[0];
      
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          nativeLanguage: formData.nativeLanguage,
          learningLanguage: formData.learningLanguage,
          level: levelToSend,
          preferences: { darkMode: formData.darkMode }
        })
      });
      
      if (res.ok) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        setInitialData(formData);
        await refreshUser(); // Update the main context so top-left name updates if changed
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: "Failed to update profile", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#4361EE] animate-spin" />
      </div>
    );
  }

  const currentLevel = user?.level || "A1";
  const levelProgress = user?.xp ? Math.min(100, Math.round((user.xp % 1000) / 10)) : 0; // Fake progress for demo based on XP

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 relative z-10 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-[60%]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search lessons or phrases..." 
            className="w-full bg-white border-2 border-gray-200 text-gray-800 font-bold text-sm rounded-[1.25rem] pl-10 pr-4 py-3 focus:outline-none focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 transition-all shadow-[0_2px_0_#e2e8f0]"
          />
        </div>
        
        <div className="flex items-center gap-4 self-end md:self-auto">
          <button className="duo-card p-3 shadow-[0_3px_0_#e2e8f0] relative text-gray-400 hover:text-[#4361EE] transition-colors border-2 hover:border-[#E1E8FF] hover:bg-[#F0F3FF]">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF4757] rounded-full border-2 border-white"></span>
          </button>
          
          {/* Gamified Mini Level Progress */}
          <div className="duo-card shadow-[0_3px_0_#e2e8f0] p-2 flex items-center gap-3 pr-4 border-2">
            <div className="bg-[#4361EE]/10 text-[#4361EE] font-black text-xs px-2 py-1 rounded-lg border border-[#4361EE]/20">
              {currentLevel}
            </div>
            <div className="flex flex-col gap-1.5 w-24">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span>{currentLevel}: {levelProgress}%</span>
              </div>
              <div className="duo-progress-track h-1.5">
                <div className="duo-progress-fill bg-[#4361EE]" style={{ width: `${levelProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="duo-card p-8 flex flex-col items-center text-center border-t-[8px] border-t-[#4361EE]"
          >
            {/* Glowing Avatar Ring */}
            <AvatarRing progress={levelProgress} level={`Level ${currentLevel}`}>
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </AvatarRing>
            
            <h2 className="text-2xl font-black text-gray-900">{formData.name}</h2>
            <p className="text-gray-400 font-bold text-xs mt-1 mb-8">Joined August 2026</p>
            
            {/* Gamified Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:border-orange-200 hover:bg-orange-50 transition-colors">
                <Flame size={28} className="text-[#FF9F43] fill-[#FF9F43] mb-2" />
                <span className="text-xl font-black text-gray-900 leading-none">{user?.streak?.current ?? 0}</span>
                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Day Streak</span>
              </div>
              <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:border-blue-200 hover:bg-blue-50 transition-colors">
                <Zap size={28} className="text-[#4361EE] fill-[#4361EE] mb-2" />
                <span className="text-xl font-black text-gray-900 leading-none">{user?.xp ?? 0}</span>
                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Total XP</span>
              </div>
              <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:border-green-200 hover:bg-green-50 transition-colors">
                <Medal size={28} className="text-[#20BF6B] fill-[#20BF6B] mb-2" />
                <span className="text-xl font-black text-gray-900 leading-none">Emerald</span>
                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">League</span>
              </div>
              <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:border-purple-200 hover:bg-purple-50 transition-colors">
                <Trophy size={28} className="text-[#CE82FF] fill-[#CE82FF] mb-2" />
                <span className="text-xl font-black text-gray-900 leading-none">0</span>
                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Top 3 Finishes</span>
              </div>
            </div>

            <button className="duo-btn duo-btn-outline w-full text-xs">
              View Public Profile
            </button>
          </motion.div>

          {/* Achievements Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="duo-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Achievements</h3>
              <button className="text-[10px] text-[#4361EE] font-black uppercase tracking-widest hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center relative">
                  <Flame size={24} className="text-[#FF9F43] fill-[#FF9F43]" />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full border border-gray-200 w-5 h-5 flex items-center justify-center shadow-sm">
                    <Star size={10} className="text-[#F7B731] fill-[#F7B731]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-gray-900">Wildfire</h4>
                  <p className="text-[10px] font-bold text-gray-400">Reach a 14 day streak</p>
                  <div className="duo-progress-track h-2 mt-2">
                    <div className="duo-progress-fill bg-[#FF9F43] w-[50%]"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-60 grayscale hover:grayscale-0 transition-all cursor-help">
                <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <BookOpen size={24} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-gray-900">Scholar</h4>
                  <p className="text-[10px] font-bold text-gray-400">Learn 500 new words</p>
                  <div className="duo-progress-track h-2 mt-2">
                    <div className="duo-progress-fill bg-gray-300 w-[30%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Learning Preferences */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="duo-card p-8 border-t-[8px] border-t-[#20BF6B]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#20BF6B]">
                <Globe size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Learning Preferences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Native Language</label>
                <div className="relative">
                  <select 
                    value={formData.nativeLanguage}
                    onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-3 appearance-none shadow-[0_2px_0_#e2e8f0] focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronRight size={16} className="text-gray-400 rotate-90 stroke-[3px]" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Target Level</label>
                <div className="relative">
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-3 appearance-none shadow-[0_2px_0_#e2e8f0] focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="A1 (Beginner)">A1 (Beginner)</option>
                    <option value="A2 (Elementary)">A2 (Elementary)</option>
                    <option value="B1 (Intermediate)">B1 (Intermediate)</option>
                    <option value="B2 (Upper Intermediate)">B2 (Upper Intermediate)</option>
                    <option value="C1 (Advanced)">C1 (Advanced)</option>
                    <option value="C2 (Mastery)">C2 (Mastery)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronRight size={16} className="text-gray-400 rotate-90 stroke-[3px]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Personal Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="duo-card p-8 border-t-[8px] border-t-[#F7B731]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-[#F7B731]">
                <User size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Personal Info</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-3 shadow-[0_2px_0_#e2e8f0] focus:border-[#4361EE] focus:ring-4 focus:ring-[#4361EE]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Email</label>
                <input 
                  type="text" 
                  value={user?.email || "student@example.com"}
                  readOnly
                  className="w-full bg-gray-100 border-2 border-gray-200 text-gray-400 text-sm font-bold rounded-xl px-4 py-3 cursor-not-allowed shadow-[0_2px_0_#e2e8f0]"
                />
              </div>
            </div>
          </motion.div>

          {/* App Preferences */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="duo-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                <Settings size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">App Preferences</h3>
            </div>
            
            <div 
              className="flex items-center justify-between bg-white border-2 border-gray-100 hover:border-gray-200 transition-colors rounded-2xl px-5 py-4 cursor-pointer"
              onClick={() => setFormData({ ...formData, darkMode: !formData.darkMode })}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl grayscale">🌙</span>
                <span className="text-sm font-black text-gray-900">Dark Mode</span>
              </div>
              <div className={`w-14 h-8 rounded-full relative shadow-inner transition-colors ${formData.darkMode ? 'bg-[#4361EE]' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${formData.darkMode ? 'left-7' : 'left-1'}`}></div>
              </div>
            </div>
          </motion.div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="duo-btn duo-btn-blue w-full text-sm py-4"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}

          <button
            onClick={logout}
            className="duo-btn w-full bg-white text-[#FF4757] border-gray-200 hover:bg-[#FF4757]/5 text-sm py-4 active:border-b-0"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

import { BookOpen } from "lucide-react";
