'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Turtle, Volume2 } from 'lucide-react';
import { playAudioOrSpeak } from '@/lib/speech';

/**
 * The listen button.
 *
 * Tries the recorded clip named in the content and falls back to the browser's
 * German voice when that file doesn't exist — which is currently every clip
 * except hallo.mp3. That fallback is why listening exercises work at all today.
 * The turtle button replays at 60% speed, which is the single most requested
 * feature in every language app.
 */
export default function AudioButton({
  url,
  text,
  autoPlay = true,
  size = 'lg',
}: {
  url?: string;
  text: string;
  autoPlay?: boolean;
  size?: 'lg' | 'sm';
}) {
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState<'file' | 'server' | 'tts' | 'none' | null>(null);
  const played = useRef(false);

  async function play(rate = 0.92) {
    if (playing) return;
    setPlaying(true);
    const src = await playAudioOrSpeak(url, text, rate);
    setSource(src);
    setPlaying(false);
  }

  useEffect(() => {
    // Autoplay once per exercise. Browsers block audio before a user gesture,
    // which is fine — the button is right there and nothing breaks.
    if (autoPlay && !played.current) {
      played.current = true;
      void play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, text]);

  const dim = size === 'lg' ? 'h-24 w-24' : 'h-14 w-14';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => play()}
          whileTap={{ scale: 0.93 }}
          aria-label="Play audio"
          className={`${dim} flex items-center justify-center rounded-full border-b-4 border-[#3046B2] bg-[#4361EE] text-white shadow-lg transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/40`}
        >
          <Volume2 className={playing ? 'animate-pulse' : ''} size={size === 'lg' ? 38 : 22} />
        </motion.button>
        <motion.button
          type="button"
          onClick={() => play(0.55)}
          whileTap={{ scale: 0.93 }}
          aria-label="Play slowly"
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-b-4 border-gray-200 bg-white text-gray-400 transition-colors hover:border-[#4361EE] hover:text-[#4361EE] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4361EE]/30"
        >
          <Turtle size={22} />
        </motion.button>
      </div>
      {source === 'tts' && (
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Synthesized voice</p>
      )}
      {source === 'none' && (
        <p className="text-[10px] font-black uppercase tracking-widest text-[#FF9F43]">No audio available</p>
      )}
    </div>
  );
}
