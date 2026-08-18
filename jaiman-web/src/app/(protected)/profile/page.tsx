"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User, Settings, Globe, Moon, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [formData, setFormData] = useState({
    name: "",
    nativeLanguage: "English",
    learningLanguage: "German",
    level: "A1",
    preferences: { darkMode: false, notifications: { email: true, push: false } }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setFormData({
          name: res.data.name || "",
          nativeLanguage: res.data.nativeLanguage || "English",
          learningLanguage: res.data.learningLanguage || "German",
          level: res.data.level || "A1",
          preferences: res.data.preferences || { darkMode: false, notifications: { email: true, push: false } }
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (key: string) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [key]: !formData.preferences[key as keyof typeof formData.preferences]
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await api.put("/users/profile", formData);
      setMessage({ text: "Profile updated successfully!", type: "success" });
      const token = localStorage.getItem("token");
      if (token) login(res.data, token);
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.message || "Failed to update profile", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 font-black uppercase tracking-widest animate-pulse">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-800 mb-2 uppercase tracking-wide">Your Profile</h1>
        <p className="text-gray-500 font-bold text-lg">Manage your learning journey and preferences.</p>
      </div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl mb-8 border-2 font-bold ${
            message.type === "success" 
              ? "bg-[#58CC02]/10 border-[#58CC02]/30 text-[#58CC02]" 
              : "bg-[#FF4B4B]/10 border-[#FF4B4B]/30 text-[#FF4B4B]"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Avatar */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-[3px] border-gray-200 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-[0_8px_0_#e5e5e5]"
          >
            <div className="w-32 h-32 rounded-[2rem] bg-[#1CB0F6] flex items-center justify-center text-white font-black text-5xl mb-6 shadow-inner border-[4px] border-[#1899D6] rotate-3">
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-black text-gray-800">{formData.name}</h2>
            <p className="text-gray-400 font-bold mt-1 mb-8">{user?.email}</p>
            
            <div className="w-full flex justify-between text-sm bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
              <div className="flex flex-col items-center gap-1">
                <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Level</span>
                <span className="text-[#CE82FF] font-black text-xl">{formData.level}</span>
              </div>
              <div className="w-0.5 h-10 bg-gray-200"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Streak</span>
                <span className="text-[#FF9600] font-black text-xl flex items-center gap-1">
                  <Flame size={18} className="fill-[#FF9600]" /> {user?.streak?.current || 0}
                </span>
              </div>
              <div className="w-0.5 h-10 bg-gray-200"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">XP</span>
                <span className="text-[#1CB0F6] font-black text-xl flex items-center gap-1">
                  <Zap size={18} className="fill-[#1CB0F6]" /> {user?.xp || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-2">
          <motion.form 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit} 
            className="bg-white border-[3px] border-gray-200 rounded-[2.5rem] p-8 space-y-10 shadow-[0_8px_0_#e5e5e5]"
          >
            
            {/* Learning Settings */}
            <div>
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 uppercase tracking-wide">
                <div className="p-2 bg-[#1CB0F6]/10 rounded-xl text-[#1CB0F6]">
                  <Globe size={24} strokeWidth={2.5} />
                </div>
                Learning Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Native Language</label>
                  <select 
                    name="nativeLanguage"
                    value={formData.nativeLanguage}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-[3px] border-gray-200 rounded-2xl px-5 py-4 text-gray-800 font-bold focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-colors cursor-pointer appearance-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Target Level</label>
                  <select 
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-[3px] border-gray-200 rounded-2xl px-5 py-4 text-gray-800 font-bold focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-colors cursor-pointer appearance-none"
                  >
                    <option value="A1">A1 (Beginner)</option>
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper Intermediate)</option>
                    <option value="C1">C1 (Advanced)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="w-full h-[3px] bg-gray-100 rounded-full"></div>

            {/* Personal Info */}
            <div>
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 uppercase tracking-wide">
                <div className="p-2 bg-[#FF9600]/10 rounded-xl text-[#FF9600]">
                  <User size={24} strokeWidth={2.5} />
                </div>
                Personal Info
              </h3>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Display Name</label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border-[3px] border-gray-200 rounded-2xl px-5 py-4 text-gray-800 font-bold focus:outline-none focus:border-[#FF9600] focus:bg-white transition-colors"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className="w-full h-[3px] bg-gray-100 rounded-full"></div>

            {/* App Preferences */}
            <div>
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 uppercase tracking-wide">
                <div className="p-2 bg-gray-200 rounded-xl text-gray-500">
                  <Settings size={24} strokeWidth={2.5} />
                </div>
                App Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-50 border-[3px] border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <Moon size={24} strokeWidth={2.5} className="text-gray-400" />
                    <span className="text-gray-800 font-bold">Dark Mode</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle("darkMode")}
                    className={`w-16 h-8 rounded-full transition-colors relative border-[3px] ${formData.preferences.darkMode ? 'bg-[#58CC02] border-[#46A302]' : 'bg-gray-200 border-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${formData.preferences.darkMode ? 'translate-x-7' : ''}`}></span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-5 bg-[#1CB0F6] hover:bg-[#1899D6] rounded-2xl text-white font-black uppercase tracking-widest transition-all border-b-[6px] border-[#1899D6] active:border-b-0 active:translate-y-[6px] disabled:opacity-50"
              >
                {isLoading ? "Saving changes..." : "Save Changes"}
              </button>
            </div>
          </motion.form>
        </div>

      </div>
    </div>
  );
}
