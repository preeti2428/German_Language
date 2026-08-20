"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Flame, Zap, Trophy, BookOpen,
  Play, Volume2, Star, TrendingUp, Clock,
  Video, Map, Layers, Award, Sparkles, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Mock Data ──────────────────────────────────────────────
const WORD_OF_THE_DAY = {
  word: "die Sehnsucht",
  pronunciation: "/ˈzeːnˌzʊxt/",
  translation: "The deep longing or yearning",
  example: "Ich habe Sehnsucht nach Hause.",
  exampleTranslation: "I have a longing for home.",
  partOfSpeech: "noun (feminine)",
};

const UPCOMING_CLASSES = [
  { topic: "German Articles: Der, Die, Das", level: "A1", instructor: "Jai", time: "7:00 PM" },
];

const QUICK_LINKS = [
  { name: "Reels", href: "/reels", icon: Video, color: "from-pink-500 to-rose-500" },
  { name: "Map", href: "/learn", icon: Map, color: "from-blue-500 to-cyan-500" },
  { name: "Cards", href: "/flashcards", icon: Layers, color: "from-emerald-400 to-teal-500" },
  { name: "Classes", href: "/classes", icon: Clock, color: "from-amber-400 to-orange-500" },
];

// ─── Animations ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  return "Guten Abend";
}

// ─── Glass Container Utility ─────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={`bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden ${className}`}>
      {children}
    </motion.div>
  );
}

// ─── Components ──────────────────────────────────────────────

function HeroSection({ name, xp = 0, streak = 0 }: { name: string; xp?: number; streak?: number }) {
  const goalXP = 500;
  const pct = Math.min(Math.round((xp / goalXP) * 100), 100);

  return (
    <GlassCard className="relative p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 bg-gradient-to-br from-white/60 to-white/20">
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-400/30 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex-1 relative z-10 w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            <span className="text-xs font-black text-gray-800 uppercase tracking-widest">{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
            <Sparkles size={16} className="text-indigo-500" />
            <span className="text-xs font-black text-gray-800 uppercase tracking-widest">{xp} Total XP</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-4">
          {getGreeting()}, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{name?.split(" ")[0]}</span>
        </h1>
        <p className="text-gray-600 font-medium text-lg max-w-md">Your German is improving every day. Keep up the fantastic work!</p>

        <div className="mt-8 max-w-md">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
            <span>Daily Goal</span>
            <span className="text-indigo-600">{pct}%</span>
          </div>
          <div className="h-4 bg-white/50 rounded-full overflow-hidden border border-white/50 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 relative"
            >
              <div className="absolute inset-0 bg-white/20" style={{ backgroundSize: "200% 100%", animation: "shimmer 2s infinite linear" }} />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-auto relative z-10 shrink-0">
        <Link href="/learn" className="group block bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
            <Play size={24} fill="currentColor" className="ml-1" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Continue Learning</p>
          <p className="text-xl font-black text-gray-900">A1 Core Verbs</p>
        </Link>
      </div>
    </GlassCard>
  );
}

function StatCards({ user }: { user: any }) {
  const stats = [
    { icon: <Flame size={24} className="text-orange-500 fill-orange-500" />, label: "Streak", value: user?.streak?.current ?? 0 },
    { icon: <Zap size={24} className="text-indigo-500 fill-indigo-500" />, label: "Total XP", value: user?.xp ?? 0 },
    { icon: <Video size={24} className="text-pink-500 fill-pink-500" />, label: "Reels", value: user?.reelsWatched ?? 0 },
    { icon: <Trophy size={24} className="text-amber-500 fill-amber-500" />, label: "Level", value: user?.level || "A1" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s, i) => (
        <GlassCard key={i} className="p-6 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-white/60 shadow-inner flex items-center justify-center mb-4">
            {s.icon}
          </div>
          <p className="text-4xl font-black text-gray-900 mb-1">{s.value}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s.label}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function QuickAccess() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {QUICK_LINKS.map((link) => (
        <GlassCard key={link.name} className="hover:-translate-y-2 transition-transform">
          <Link href={link.href} className="flex flex-col items-center justify-center p-8 gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white shadow-lg`}>
              <link.icon size={28} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-black text-gray-800 uppercase tracking-widest">{link.name}</span>
          </Link>
        </GlassCard>
      ))}
    </div>
  );
}

function WordAndClasses() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(WORD_OF_THE_DAY.word);
    utterance.lang = "de-DE";
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Word of the Day */}
      <GlassCard className="p-8 relative cursor-pointer min-h-[300px] flex flex-col bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
        <div onClick={() => setFlipped(!flipped)} className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-amber-400/20 rounded-lg"><Star size={16} className="text-amber-500 fill-amber-500" /></div>
            <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Word of the Day</span>
          </div>

          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div key="front" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col justify-center items-center text-center">
                <h2 className="text-5xl font-black text-gray-900 mb-3">{WORD_OF_THE_DAY.word}</h2>
                <p className="text-gray-500 font-bold mb-8">{WORD_OF_THE_DAY.pronunciation}</p>
                <button onClick={handleListen} className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform">
                  <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} strokeWidth={3} />
                </button>
              </motion.div>
            ) : (
              <motion.div key="back" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center">
                <div className="bg-white/60 p-6 rounded-2xl mb-4">
                  <p className="text-2xl font-black text-gray-900">{WORD_OF_THE_DAY.translation}</p>
                </div>
                <p className="text-gray-800 font-medium text-lg italic mb-2">"{WORD_OF_THE_DAY.example}"</p>
                <p className="text-gray-500 font-medium">{WORD_OF_THE_DAY.exampleTranslation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Upcoming Class */}
      <GlassCard className="p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Clock size={16} className="text-blue-600" /></div>
            <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Upcoming Class</span>
          </div>
          <Link href="/classes" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All</Link>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center bg-white/50 rounded-3xl p-8 border border-white">
          <span className="px-4 py-1 bg-rose-100 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-full mb-4 animate-pulse">
            Starts at {UPCOMING_CLASSES[0].time}
          </span>
          <h3 className="text-2xl font-black text-gray-900 mb-2">{UPCOMING_CLASSES[0].topic}</h3>
          <p className="text-gray-500 font-bold flex items-center gap-2">
            <Award size={16} /> with Instructor {UPCOMING_CLASSES[0].instructor}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshUser();
  }, []);

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center min-h-screen bg-[#F0F4F8]">
        <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F0F4F8]">
      {/* ── Background Abstract Shapes ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-300/40 blur-3xl animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-purple-300/40 to-pink-300/40 blur-3xl animate-[spin_15s_linear_infinite_reverse]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-emerald-200/40 to-cyan-300/40 blur-3xl animate-[spin_25s_linear_infinite]" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-[1200px] mx-auto p-6 md:p-10 space-y-8 pb-32">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
          <HeroSection name={user?.name || "Learner"} xp={user?.xp} streak={user?.streak?.current} />
          <StatCards user={user} />
          <QuickAccess />
          <WordAndClasses />
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
