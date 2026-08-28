'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen, FileText, Headphones, PenLine, Target, ChevronRight, Sparkles, Mic } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const CARDS = [
  {
    id: 'level-test',
    icon: Target,
    emoji: '🎯',
    title: 'Level Test',
    subtitle: 'Find your German level',
    description: '30 adaptive questions across A1–B2. Takes ~10 minutes. Your level is saved to your profile.',
    color: '#4361EE',
    bg: '#EEF2FF',
    shadow: '#3046B2',
    href: '/practice/level-test',
    badge: 'Placement',
    badgeBg: '#EEF2FF',
    badgeColor: '#4361EE',
    time: '~10 min',
  },
  {
    id: 'listening',
    icon: Headphones,
    emoji: '🎧',
    title: 'Listening Lab',
    subtitle: 'Train your ear',
    description: 'Audio exercises from your current level. Listen and answer comprehension questions.',
    color: '#FF9F43',
    bg: '#FFF4E6',
    shadow: '#D97F27',
    href: '/practice/listening',
    badge: 'Audio',
    badgeBg: '#FFF4E6',
    badgeColor: '#FF9F43',
    time: '5–15 min',
  },
  {
    id: 'test-series',
    icon: FileText,
    emoji: '📋',
    title: 'Test Series',
    subtitle: 'Past paper practice',
    description: 'Full Goethe-style mock tests (A1/A2/B1). Timed sections: Hören, Lesen, Schreiben.',
    color: '#20BF6B',
    bg: '#E8FBF0',
    shadow: '#178B4E',
    href: '/practice/test-series',
    badge: 'Timed Exam',
    badgeBg: '#E8FBF0',
    badgeColor: '#20BF6B',
    time: '65–90 min',
  },
  {
    id: 'writing',
    icon: PenLine,
    emoji: '✍️',
    title: 'Writing Lab & AI Tutor',
    subtitle: 'Goethe Tasks & Text Check',
    description: 'Practice Goethe exam writing tasks (SMS, Email, Brief) or paste any German text for instant AI tutor feedback.',
    color: '#4CC9F0',
    bg: '#E8F8FE',
    shadow: '#2FA3C9',
    href: '/practice/writing',
    badge: 'AI Graded',
    badgeBg: '#E8F8FE',
    badgeColor: '#4CC9F0',
    time: 'Instant • 10–20 min',
  },
  {
    id: 'speaking',
    icon: Mic,
    emoji: '🎙️',
    title: 'Speaking Lab',
    subtitle: 'Pronunciation & Fluency',
    description: 'Listen to native audio and repeat the sentence. AI evaluates your pronunciation instantly.',
    color: '#D81B60',
    bg: '#FCE4EC',
    shadow: '#AD1457',
    href: '/practice/speaking',
    badge: 'AI Coach',
    badgeBg: '#FCE4EC',
    badgeColor: '#D81B60',
    time: '5–10 min',
  },
];

const LEVEL_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  A1: { bg: '#E8FBF0', color: '#20BF6B' },
  A2: { bg: '#EEF2FF', color: '#4361EE' },
  B1: { bg: '#FFF4E6', color: '#FF9F43' },
  B2: { bg: '#F7EDFF', color: '#CE82FF' },
  C1: { bg: '#FFF0F0', color: '#FF4757' },
  C2: { bg: '#FFF9E6', color: '#FFC107' },
};

export default function PracticeHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userLevel = user?.level ?? 'A1';
  const levelBadge = LEVEL_BADGE_COLORS[userLevel] ?? LEVEL_BADGE_COLORS.A1;

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#FF7043] flex items-center justify-center text-xl shadow-[0_3px_0_#C62828]">
            🏋️
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A2E]">Practice Center</h1>
            <p className="text-sm text-[#757575] font-medium">Your training ground — level up every day</p>
          </div>
        </div>

        {/* User level pill */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-bold text-[#9E9E9E]">Your level:</span>
          <span
            className="px-3 py-1 rounded-full text-xs font-black"
            style={{ background: levelBadge.bg, color: levelBadge.color }}
          >
            {userLevel}
          </span>
          <button
            onClick={() => router.push('/practice/level-test')}
            className="text-xs font-bold text-[#E53935] underline underline-offset-2 hover:no-underline transition-all"
          >
            Retest level
          </button>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(card.href)}
              className="text-left bg-white rounded-2xl p-5 border border-[#F0F0F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all duration-200 flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-[0_3px_0_rgba(0,0,0,0.1)]"
                  style={{ background: card.bg }}
                >
                  {card.emoji}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black"
                    style={{ background: card.badgeBg, color: card.badgeColor }}
                  >
                    {card.badge}
                  </span>
                  <span className="text-[10px] font-bold text-[#BDBDBD]">{card.time}</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-[15px] font-black text-[#1A1A2E]">{card.title}</p>
                <p className="text-[11px] font-bold" style={{ color: card.color }}>{card.subtitle}</p>
              </div>

              {/* Description */}
              <p className="text-[12px] text-[#757575] leading-relaxed font-medium flex-1">
                {card.description}
              </p>

              {/* CTA */}
              <div
                className="flex items-center justify-between mt-1 pt-3 border-t"
                style={{ borderColor: card.bg }}
              >
                <span className="text-[12px] font-black" style={{ color: card.color }}>
                  Start now
                </span>
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: card.bg }}
                >
                  <ChevronRight size={14} style={{ color: card.color }} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Quick stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-white rounded-2xl p-5 border border-[#F0F0F0] shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      >
        <p className="text-[11px] font-black text-[#BDBDBD] uppercase tracking-widest mb-3">💡 Practice Tips</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5">
            <span className="text-lg mt-0.5">🎯</span>
            <div>
              <p className="text-[12px] font-black text-[#1A1A2E]">Start with the Level Test</p>
              <p className="text-[11px] text-[#9E9E9E] font-medium">It takes 10 minutes and ensures you practice at the right level.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-lg mt-0.5">✍️</span>
            <div>
              <p className="text-[12px] font-black text-[#1A1A2E]">Goethe Writing = 3 points</p>
              <p className="text-[11px] text-[#9E9E9E] font-medium">Every writing task has 3 bullet points — address ALL of them for full marks.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-lg mt-0.5">🔗</span>
            <div>
              <p className="text-[12px] font-black text-[#1A1A2E]">Use connectors!</p>
              <p className="text-[11px] text-[#9E9E9E] font-medium">Examiners look for weil, obwohl, deshalb, trotzdem. Use them naturally.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
