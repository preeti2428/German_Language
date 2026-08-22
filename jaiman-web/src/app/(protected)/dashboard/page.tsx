'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Award, BookOpen, Check, Flame, Landmark, ListChecks,
  MessageCircle, Mic, Play, Star, Trophy, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { readStreak, readTutorTurns, today } from '@/lib/streak';
import { speakGerman } from '@/lib/speech';

/**
 * Dashboard, rebuilt to the "Gamified App" design canvas and wired to real
 * data: the hero week strip and daily-goal ring read the local streak history,
 * quests track today's actual XP, and badges unlock from real stats. The old
 * dashboard was a dark theme with hardcoded numbers — this replaces it.
 */

const DAILY_GOAL = 50;

const WORDS_OF_DAY = [
  { de: 'die Sehnsucht', ipa: '/ˈzeːnˌzʊxt/', pos: 'Substantiv, feminin', en: 'a deep longing', ex: 'Ich habe Sehnsucht nach Hause.', exEn: 'I have a longing for home.' },
  { de: 'das Fernweh', ipa: '/ˈfɛʁnveː/', pos: 'Substantiv, neutrum', en: 'wanderlust', ex: 'Im Sommer habe ich Fernweh.', exEn: 'In summer I long to travel.' },
  { de: 'gemütlich', ipa: '/ɡəˈmyːtlɪç/', pos: 'Adjektiv', en: 'cosy, snug', ex: 'Das Café ist sehr gemütlich.', exEn: 'The café is very cosy.' },
  { de: 'der Feierabend', ipa: '/ˈfaɪ̯ɐˌʔaːbn̩t/', pos: 'Substantiv, maskulin', en: 'end of the workday', ex: 'Endlich Feierabend!', exEn: 'Finally, the workday is over!' },
  { de: 'doch', ipa: '/dɔx/', pos: 'Partikel', en: 'yes it is! (contradicting)', ex: 'Das stimmt nicht! — Doch!', exEn: "That's not true! — Yes it is!" },
  { de: 'die Geborgenheit', ipa: '/ɡəˈbɔʁɡn̩haɪ̯t/', pos: 'Substantiv, feminin', en: 'safe cosiness', ex: 'Zu Hause fühle ich Geborgenheit.', exEn: 'At home I feel safe and warm.' },
  { de: 'quatschen', ipa: '/ˈkvatʃn̩/', pos: 'Verb, umgangssprachlich', en: 'to chat, natter', ex: 'Wir quatschen den ganzen Abend.', exEn: 'We chat the whole evening.' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface ProgressData {
  totalXp: number;
  completedStages: unknown[];
  stageProgress?: { stageId: string; completedSessions: number[] }[];
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [wordFlipped, setWordFlipped] = useState(false);
  const [streakState, setStreakState] = useState(() => ({ current: 0, history: {} as Record<string, number> }));
  const [tutor, setTutor] = useState({ total: 0, today: 0 });

  useEffect(() => {
    refreshUser();
    const s = readStreak();
    setStreakState({ current: s.current, history: s.history });
    setTutor(readTutorTurns());
    api.get('/progress').then((r) => setProgress(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xpToday = streakState.history[today()] ?? 0;
  const goalPct = Math.min(1, xpToday / DAILY_GOAL);
  const ringOffset = 527.8 * (1 - goalPct);

  const sessionsDone = useMemo(
    () => progress?.stageProgress?.reduce((a, s) => a + s.completedSessions.length, 0) ?? 0,
    [progress]
  );
  const stagesDone = progress?.completedStages?.length ?? 0;
  const wordsSeen = sessionsDone * 8; // ~8 new/reviewed words per session

  // Last 7 days for the hero week strip, today last.
  const week = useMemo(() => {
    const out: { label: string; active: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = today(d);
      out.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
        active: (streakState.history[key] ?? 0) > 0,
        isToday: i === 0,
      });
    }
    return out;
  }, [streakState]);

  const word = WORDS_OF_DAY[new Date().getDate() % WORDS_OF_DAY.length];

  const quests = [
    { title: `Earn ${DAILY_GOAL} XP today`, now: Math.min(xpToday, DAILY_GOAL), max: DAILY_GOAL, color: '#4361EE', bg: '#EEF2FF', border: '#D6DEFF', icon: Zap },
    { title: 'Finish 2 sessions', now: Math.min(sessionsDone % 13, 2), max: 2, color: '#20BF6B', bg: '#E8FBF0', border: '#CBEFDC', icon: ListChecks },
    { title: 'Talk to Jai (AI Tutor)', now: Math.min(tutor.today, 1), max: 1, color: '#CE82FF', bg: '#F7EDFF', border: '#EBD6FA', icon: MessageCircle },
  ];

  const xp = user?.xp ?? 0;
  const badges = [
    { name: 'First Step', icon: Play, unlocked: sessionsDone >= 1, color: '#20BF6B', bg: '#E8FBF0', bd: '#CBEFDC' },
    { name: '3-Day Flame', icon: Flame, unlocked: streakState.current >= 3, color: '#FF9F43', bg: '#FFF4E6', bd: '#FFE2C4' },
    { name: '100 Club', icon: Zap, unlocked: xp >= 100, color: '#4361EE', bg: '#EEF2FF', bd: '#D6DEFF' },
    { name: 'City Boss', icon: Landmark, unlocked: stagesDone >= 1, color: '#CE82FF', bg: '#F7EDFF', bd: '#EBD6FA' },
    { name: 'Week Streak', icon: Trophy, unlocked: streakState.current >= 7, color: '#F7B731', bg: '#FDF6E4', bd: '#FDE9BC' },
    { name: 'Word Bank', icon: BookOpen, unlocked: wordsSeen >= 100, color: '#20BF6B', bg: '#E8FBF0', bd: '#CBEFDC' },
    { name: '500 Club', icon: Star, unlocked: xp >= 500, color: '#FF9F43', bg: '#FFF4E6', bd: '#FFE2C4' },
    { name: 'Speaker', icon: Mic, unlocked: tutor.total >= 10, color: '#FF4757', bg: '#FFF0F0', bd: '#FFD3D8' },
  ];
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto flex flex-col gap-6 w-full pb-20">
      {/* ── Hero + Daily Goal ─────────────────────────────────────── */}
      <div className="grid items-stretch gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#1B2A4A] p-9 text-white shadow-[0_20px_40px_rgba(27,42,74,0.25)]">
          <div className="pointer-events-none absolute -right-24 -top-36 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(67,97,238,0.55),transparent_68%)]" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(247,183,49,0.28),transparent_68%)]" />

          <div className="relative flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-[#20BF6B] shadow-[0_0_0_4px_rgba(32,191,107,0.25)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C7D3EA]">
                Germany Journey · A1
              </span>
            </div>

            <div>
              <h2 className="text-[clamp(30px,3.4vw,46px)] font-black leading-[1.05] tracking-[-0.035em]">
                {greeting()},<br />
                <span className="text-[#F7B731]">{user?.name?.split(' ')[0] ?? 'Learner'}</span>
              </h2>
              <p className="mt-3.5 max-w-[400px] text-base font-medium text-[#9FB0CD]">
                {stagesDone >= 8
                  ? 'All cities complete! Keep the streak alive with a review run.'
                  : `You're ${8 - stagesDone} ${8 - stagesDone === 1 ? 'stop' : 'stops'} from Berlin. Finish today's run to keep your ${streakState.current}-day streak alive.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => router.push('/learn')} className="duo-btn duo-btn-green relative overflow-hidden px-6 py-4 text-sm">
                <Play size={17} className="mr-2 fill-white" />
                Continue Journey
                <span className="pointer-events-none absolute inset-y-0 w-9 animate-[shine_3.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/tutor')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.06em] text-white transition-colors hover:bg-white/15"
              >
                Talk to Jai
              </button>
            </div>

            <div className="mt-1 flex gap-2">
              {week.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`flex aspect-square w-full max-w-[44px] items-center justify-center rounded-[14px] border-2 text-[13px] font-black ${
                      d.active
                        ? 'border-[#20BF6B] bg-[#20BF6B] text-white'
                        : d.isToday
                          ? 'border-dashed border-[#F7B731] bg-transparent text-[#F7B731]'
                          : 'border-[#2A3F6C] bg-[#16223E] text-[#4A5B7E]'
                    }`}
                  >
                    {d.active ? <Check size={16} strokeWidth={4} /> : d.isToday ? '?' : ''}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#7D8FAE]">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="duo-card flex flex-col items-center justify-center gap-4 p-8">
          <p className="self-start text-[10px] font-black uppercase tracking-[0.2em] text-[#9AA6B4]">Daily Goal</p>
          <div className="relative flex h-[200px] w-[200px] items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
              <circle cx="100" cy="100" r="84" fill="none" stroke="#EEF1F5" strokeWidth="18" />
              <motion.circle
                cx="100" cy="100" r="84" fill="none" stroke="#4361EE" strokeWidth="18" strokeLinecap="round"
                strokeDasharray="527.8"
                initial={{ strokeDashoffset: 527.8 }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </svg>
            <div className="text-center">
              <p className="text-[52px] font-black tracking-[-0.04em] text-[#1F2328] tabular-nums">{xpToday}</p>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9AA6B4]">of {DAILY_GOAL} XP</p>
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            {[
              { v: sessionsDone, label: 'Sessions', color: '#20BF6B' },
              { v: stagesDone, label: 'Cities', color: '#CE82FF' },
              { v: wordsSeen, label: 'Words', color: '#FF9F43' },
            ].map((s) => (
              <div key={s.label} className="flex-1 rounded-2xl bg-[#F6F8FA] px-2 py-3 text-center">
                <p className="text-[19px] font-black tabular-nums" style={{ color: s.color }}>{s.v}</p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#9AA6B4]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Quests + Word of the Day ──────────────────────────────── */}
      <div className="grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
        <section className="duo-card p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF]">
                <ListChecks size={19} className="text-[#4361EE]" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#1F2328]">Daily Quests</h3>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9AA6B4]">Resets at midnight</span>
          </div>

          <div className="flex flex-col gap-3.5">
            {quests.map((q) => {
              const done = q.now >= q.max;
              const Icon = q.icon;
              return (
                <div
                  key={q.title}
                  className="flex items-center gap-4 rounded-[22px] border-2 border-b-4 px-4 py-4"
                  style={{ borderColor: q.border, background: done ? q.bg : '#fff' }}
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border-2 bg-white" style={{ borderColor: q.border, color: q.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-[15px] font-black text-[#1F2328]">{q.title}</p>
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#E9EDF2]">
                        <div
                          className="relative h-full rounded-full transition-[width] duration-700"
                          style={{ width: `${(q.now / q.max) * 100}%`, background: q.color }}
                        >
                          <div className="absolute left-1 right-1 top-[2px] h-[3px] rounded-full bg-white/40" />
                        </div>
                      </div>
                      <span className="text-[11px] font-black tabular-nums text-[#8A94A2]">{q.now}/{q.max}</span>
                    </div>
                  </div>
                  {done && (
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white" style={{ background: q.color }}>
                      <Check size={16} strokeWidth={4} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section
          onClick={() => {
            setWordFlipped((f) => !f);
            if (!wordFlipped && word) void speakGerman(word.de);
          }}
          className="relative flex min-h-[250px] cursor-pointer flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#26408B] to-[#4361EE] p-7 text-white shadow-[0_14px_30px_rgba(38,64,139,0.28)]"
        >
          <div className="pointer-events-none absolute -right-12 -top-16 h-[220px] w-[220px] rounded-full bg-white/10" />
          <div className="relative flex items-center gap-2">
            <Star size={16} className="fill-[#F7B731] text-[#F7B731]" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C7D3EA]">Word of the Day</span>
            <span className="ml-auto text-[10px] font-extrabold text-[#9FB0CD]">tap to flip</span>
          </div>
          <div className="relative flex flex-1 flex-col items-center justify-center text-center">
            {word && !wordFlipped && (
              <div>
                <h3 className="text-[38px] font-black tracking-[-0.03em]">{word.de}</h3>
                <p className="mt-2 text-sm font-semibold text-[#9FB0CD]">{word.ipa} · {word.pos}</p>
              </div>
            )}
            {word && wordFlipped && (
              <div>
                <h3 className="text-[26px] font-black tracking-[-0.02em]">{word.en}</h3>
                <p className="mt-3.5 text-[15px] font-semibold italic text-[#DCE4F2]">„{word.ex}"</p>
                <p className="mt-1.5 text-[13px] font-semibold text-[#9FB0CD]">{word.exEn}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Badges ────────────────────────────────────────────────── */}
      <section className="duo-card p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7EDFF]">
              <Award size={19} className="text-[#CE82FF]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#1F2328]">Badges</h3>
          </div>
          <span className="text-[11px] font-black text-[#4361EE]">{unlockedCount} / {badges.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-3.5 sm:grid-cols-8">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.name} className="flex flex-col items-center gap-2" style={{ opacity: b.unlocked ? 1 : 0.35 }}>
                <div
                  className="flex aspect-square w-full items-center justify-center rounded-[20px] border-2 border-b-4 transition-transform hover:-translate-y-1"
                  style={{ background: b.unlocked ? b.bg : '#F4F6F8', borderColor: b.unlocked ? b.bd : '#E4E9EF', color: b.unlocked ? b.color : '#B4BDC8' }}
                >
                  <Icon size={24} />
                </div>
                <span className="text-center text-[9px] font-black uppercase tracking-[0.06em] text-[#8A94A2]">{b.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="px-1 text-center text-[11px] font-bold text-[#B4BDC8]">
        Tip: finishing any session records today on the week strip and fills the goal ring.
      </p>
    </div>
  );
}
