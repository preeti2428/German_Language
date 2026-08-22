"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Flame, Loader2 } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRef } from "react";
import { useAuth } from "@/context/AuthContext";

// Helper to assign colors to reels dynamically
const REEL_COLORS = [
  { bgGradient: "bg-gradient-to-br from-[#4361EE] to-[#3046B2]", dotColor: "#4361EE" },
  { bgGradient: "bg-gradient-to-br from-[#F7B731] to-[#D99C2A]", dotColor: "#F7B731" },
  { bgGradient: "bg-gradient-to-br from-[#20BF6B] to-[#178B4E]", dotColor: "#20BF6B" },
  { bgGradient: "bg-gradient-to-br from-[#8E44AD] to-[#9B59B6]", dotColor: "#9B59B6" },
  { bgGradient: "bg-gradient-to-br from-[#FF9F43] to-[#FF7B00]", dotColor: "#FF9F43" },
];

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fetch reels from Backend API
  useEffect(() => {
    const fetchReels = async () => {
      try {
        const token = localStorage.getItem("token"); // Optional: if auth required to view
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/reels`, {
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Failed to fetch reels");
        const data = await res.json();
        
        // Map backend data to UI format adding colors
        const formattedReels = data.map((reel: any, idx: number) => ({
          ...reel,
          id: reel._id,
          // Extract title/subtitle if needed, or use as is
          german: reel.title,
          english: reel.description,
          bgGradient: REEL_COLORS[idx % REEL_COLORS.length].bgGradient,
          dotColor: REEL_COLORS[idx % REEL_COLORS.length].dotColor,
        }));
        
        setReels(formattedReels);
      } catch (err: any) {
        console.error(err);
        setError("Could not load reels.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReels();
  }, []);

  const { token, refreshUser } = useAuth();

  // Track when a user watches a reel (stays on it for 5 seconds)
  useEffect(() => {
    if (reels.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/users/reels/watch`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          // Call refreshUser so that if they go back to dashboard, it shows updated count
          refreshUser();
        }
      } catch (err) {
        console.error("Error logging reel watch:", err);
      }
    }, 5000); // 5 seconds of watching

    return () => clearTimeout(timer);
  }, [currentIndex, reels.length, token, refreshUser]);

  const paginate = useCallback((newDirection: number) => {
    let nextIndex = currentIndex + newDirection;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= reels.length) nextIndex = reels.length - 1;
    setCurrentIndex(nextIndex);
    setIsPlaying(true); // Reset play state when changing reel
  }, [currentIndex, reels.length]);

  const isScrolling = useRef(false);

  // Wheel / Trackpad scroll support with debounce
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isScrolling.current || reels.length === 0) return;
      if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
        isScrolling.current = true;
        if (e.deltaY > 0 || e.deltaX > 0) {
          paginate(1);
        } else {
          paginate(-1);
        }
        setTimeout(() => {
          isScrolling.current = false;
        }, 400);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [paginate, reels.length]);

  // Keyboard support (Up/Down and Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        paginate(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        paginate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginate]);

  const swipeConfidenceThreshold = 6000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipeY = swipePower(offset.y, velocity.y);
    const swipeX = swipePower(offset.x, velocity.x);

    if (swipeY < -swipeConfidenceThreshold || swipeX < -swipeConfidenceThreshold || offset.y < -60 || offset.x < -60) {
      paginate(1);
    } else if (swipeY > swipeConfidenceThreshold || swipeX > swipeConfidenceThreshold || offset.y > 60 || offset.x > 60) {
      paginate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#20BF6B] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-gray-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="duo-btn duo-btn-blue px-6 py-2">Retry</button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🎥</div>
        <h2 className="text-2xl font-black text-gray-800">No Reels Yet!</h2>
        <p className="text-gray-500 font-bold mb-6">Upload some reels from the admin panel.</p>
        <a href="/admin/upload" className="duo-btn duo-btn-green px-6 py-3">Go to Uploads</a>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-transparent overflow-hidden relative flex flex-col items-center justify-center pb-8">
      {/* Top XP Pill */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_4px_0_#e2e8f0] border-2 border-gray-100 flex items-center gap-2"
        >
          <Flame size={20} className="text-[#FF9F43] fill-[#FF9F43]" />
          <span className="text-sm font-black text-[#FF9F43]">+20 XP Earned</span>
          <span className="text-xs font-black text-gray-400 ml-1">({currentIndex + 1} / {reels.length})</span>
        </motion.div>
      </div>

      {/* Vertical TikTok Feed Container */}
      <div className="relative w-full h-[calc(100vh-60px)] min-h-[660px] max-w-xl mx-auto flex items-center justify-center z-10 perspective-[1200px]">
        <AnimatePresence initial={false} custom={currentIndex}>
          {reels.map((reel, index) => {
            const offset = index - currentIndex;
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= 1; // Render current, 1 above, 1 below

            if (!isVisible) return null;

            // Calculate vertical transforms
            const scale = isActive ? 1 : 0.9;
            const yOffset = offset * 105; // percentage offset
            const zIndex = 10 - Math.abs(offset);
            const opacity = isActive ? 1 : 0.35;
            const blur = isActive ? "blur(0px)" : "blur(3px)";

            return (
              <motion.div
                key={reel.id}
                initial={false}
                animate={{
                  y: `${yOffset}%`,
                  scale: scale,
                  opacity: opacity,
                  zIndex: zIndex,
                  filter: blur,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className={`absolute inset-x-0 mx-auto flex flex-col items-center justify-center ${isActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                style={{ width: 'min(94vw, 470px)', height: 'min(86vh, 760px)' }}
                drag={isActive ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.25}
                onDragEnd={isActive ? handleDragEnd : undefined}
                onClick={() => !isActive && setCurrentIndex(index)}
              >
                {/* Reel Card Frame */}
                <div 
                  className={`relative w-full h-full rounded-[2.5rem] overflow-hidden transition-all duration-300 ${isActive ? 'border-[4px] border-white shadow-[0_16px_36px_rgba(0,0,0,0.18)] bg-black' : 'shadow-lg border-2 border-white/20 ' + reel.bgGradient}`}
                >
                  {isActive && reel.videoUrl ? (
                    <div 
                      className="absolute inset-0 w-full h-full cursor-pointer z-0" 
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      <ReelVideo 
                        src={reel.videoUrl} 
                        isMuted={isMuted} 
                        isPlaying={isPlaying} 
                      />
                    </div>
                  ) : (
                    <div className={`absolute inset-0 ${reel.bgGradient}`}></div>
                  )}
                  
                  {/* Overlay shadow for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 pointer-events-none"></div>
                  
                  {/* Reel Content */}
                  <div className="relative z-10 h-full p-6 flex flex-col justify-between text-white pointer-events-none">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm">
                        Level {reel.level || 'A1'}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        className="bg-black/40 backdrop-blur-md p-2.5 rounded-full hover:bg-black/60 transition-colors pointer-events-auto shadow-md"
                      >
                        {isMuted ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
                      </button>
                    </div>

                    {/* Play/Pause indicator */}
                    <AnimatePresence>
                      {!isPlaying && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute inset-0 m-auto w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center pointer-events-none shadow-xl"
                        >
                          <Play size={36} className="text-white fill-white ml-1.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom Caption & Subtitles */}
                    <div className="flex-1 flex flex-col items-start justify-end text-left space-y-2 pointer-events-none pb-3">
                      <div className="bg-orange-500/90 backdrop-blur-sm px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-sm inline-block">
                        {reel.tags?.length ? `#${reel.tags[0]}` : 'German Reel'}
                      </div>
                      <h2 className="text-2xl font-black leading-tight drop-shadow-md text-white">
                        {reel.german}
                      </h2>
                      {reel.english && (
                        <p className="text-sm font-bold text-white/90 drop-shadow-sm">
                          "{reel.english}"
                        </p>
                      )}
                    </div>

                    {/* Footer: Gamified Action */}
                    <div className="w-full pointer-events-auto">
                      <button className="duo-btn w-full bg-[#20BF6B] text-white border-[#178B4E] py-3 text-xs flex items-center justify-center gap-2 hover:bg-[#1ca65d] active:border-b-0 shadow-[0_4px_0_#178B4E]">
                        <Play size={16} className="fill-white" /> Practice It
                      </button>
                    </div>

                  </div>

                  {/* Right Side Floating Social Actions */}
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="absolute right-3 bottom-24 flex flex-col items-center space-y-3 z-20 pointer-events-auto"
                    >
                      <ActionBtn icon={<Heart size={20} className="fill-[#FF4757] text-[#FF4757]" />} label={reel.likes || 0} />
                      <ActionBtn icon={<MessageCircle size={20} className="text-gray-700" />} label={reel.views || 0} />
                      <ActionBtn icon={<Share2 size={20} className="text-gray-700" />} label="Share" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Floating Desktop Up/Down Buttons */}
        <div className="hidden md:flex flex-col items-center gap-3 absolute right-[-70px] top-1/2 -translate-y-1/2 z-30">
          <button 
            type="button"
            onClick={() => paginate(-1)} 
            disabled={currentIndex === 0}
            className="w-12 h-12 rounded-full bg-white border-2 border-b-4 border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 active:translate-y-1 disabled:opacity-30 disabled:pointer-events-none transition-all text-gray-700 font-bold"
            title="Previous Reel (Up Arrow / Scroll Up)"
          >
            ↑
          </button>
          <div className="flex flex-col items-center gap-1.5 py-1">
            {reels.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'h-5 bg-[#20BF6B]' : 'h-2 bg-gray-300'}`}
              />
            ))}
          </div>
          <button 
            type="button"
            onClick={() => paginate(1)} 
            disabled={currentIndex === reels.length - 1}
            className="w-12 h-12 rounded-full bg-white border-2 border-b-4 border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 active:translate-y-1 disabled:opacity-30 disabled:pointer-events-none transition-all text-gray-700 font-bold"
            title="Next Reel (Down Arrow / Scroll Down)"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 pointer-events-none">
        <span className="text-xs font-black text-gray-400 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <kbd className="bg-gray-100 px-2 py-0.5 rounded border-b-2 border-gray-200">Scroll Up / Down ↕</kbd>
          <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border-b-2 border-gray-200">Swipe ↕</kbd>
          <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border-b-2 border-gray-200">↑↓ Arrows</kbd>
        </span>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label }: { icon: React.ReactNode, label: string | number }) {
  return (
    <button className="group flex flex-col items-center transition-all hover:-translate-y-1 active:translate-y-0" onPointerDown={(e) => e.stopPropagation()}>
      <div className="w-12 h-12 bg-white rounded-[1.25rem] flex items-center justify-center shadow-[0_4px_0_#e2e8f0] border-2 border-gray-100 group-hover:bg-gray-50 group-active:shadow-none group-active:border-t-[6px] transition-all">
        {icon}
      </div>
      <span className="text-[10px] font-black text-gray-500 mt-2 bg-white px-2 py-0.5 rounded-md shadow-sm border border-gray-100">{label}</span>
    </button>
  );
}

// Sub-component to handle video playback programmatically
function ReelVideo({ src, isMuted, isPlaying }: { src: string, isMuted: boolean, isPlaying: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        // Need to catch promise to prevent uncaught exceptions if browser blocks autoplay
        videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, src]);

  return (
    <video 
      ref={videoRef}
      src={src} 
      className="w-full h-full object-cover" 
      autoPlay 
      loop 
      muted={isMuted}
      playsInline
    />
  );
}
