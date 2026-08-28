import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSoundEnabled } from '@/lib/speech';

const MESSAGES = [
  "🎉 SUPER!",
  "🌟 EXCELLENT!",
  "🔥 BRILLIANT!",
  "✨ FANTASTIC!",
  "🏆 OUTSTANDING!",
  "🎯 SPOT ON!"
];

export function useCelebration() {
  const [celebration, setCelebration] = useState<{ id: number; message: string } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playWinningSound = useCallback(() => {
    if (!isSoundEnabled()) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Simple major arpeggio
      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = now + i * 0.1;
        osc.start(startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        osc.stop(startTime + 0.4);
      });
    } catch (error) {
      console.warn("Could not play celebration sound", error);
    }
  }, []);

  const triggerCelebration = useCallback(() => {
    const randomMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setCelebration({ id: Date.now(), message: randomMessage });
    playWinningSound();

    // Auto-hide after 2 seconds
    setTimeout(() => {
      setCelebration((prev) => prev?.id === Date.now() ? null : null); // Only clear if we don't have a new one
    }, 2000);
  }, [playWinningSound]);

  const CelebrationOverlay = () => (
    <AnimatePresence>
      {celebration && (
        <motion.div
          key={celebration.id}
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-[9999]"
        >
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl border-4 border-amber-400 dark:border-amber-500 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              {celebration.message}
            </h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { triggerCelebration, CelebrationOverlay };
}
