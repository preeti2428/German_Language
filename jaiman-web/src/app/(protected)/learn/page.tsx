'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BookMarked, BookOpen, Check, Cloud, Crown, Flame, Headphones, Landmark, Lock, Mic, PenLine, Play, Puzzle, ShieldCheck, Train, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { daysSinceActive, readStreak } from '@/lib/streak';
import { useAuth } from '@/context/AuthContext';

/**
 * The Deutschland Reise map, rebuilt to the "Gamified App" design canvas:
 * one winding dashed trail, pulse-ringed city nodes with label pills, a
 * "Next Stop" pill up top, and the bottom city panel with its color bar.
 * Data flow (stages + progress from the API) is unchanged.
 */

type NodeStatus = 'completed' | 'active' | 'locked' | 'boss';

interface SessionInfo {
  n: number;
  title: string;
  skill: string;
}

interface City {
  id: string;
  stageNumber: number;
  tier: string;
  name: string;
  nameDe: string;
  status: NodeStatus;
  emoji: string;
  color: string;
  bgColor: string;
  shadow: string;
  description: string;
  xp: number;
  x: number;
  y: number;
  completedSessions: number;
  completedList: number[];
  sessions: SessionInfo[];
  totalSessions: number;
  nextSession: number | 'boss';
}

/** How each skill type shows up in the session list. */
const SKILLS: Record<string, { icon: typeof BookOpen; color: string; bg: string; label: string }> = {
  vocab: { icon: BookOpen, color: '#4361EE', bg: '#EEF2FF', label: 'Vocabulary' },
  grammar: { icon: Puzzle, color: '#CE82FF', bg: '#F7EDFF', label: 'Grammar' },
  listening: { icon: Headphones, color: '#FF9F43', bg: '#FFF4E6', label: 'Listening' },
  speaking: { icon: Mic, color: '#FF4757', bg: '#FFF0F0', label: 'Speaking' },
  reading: { icon: BookMarked, color: '#20BF6B', bg: '#E8FBF0', label: 'Reading' },
  writing: { icon: PenLine, color: '#4CC9F0', bg: '#E8F8FE', label: 'Writing' },
};

const MAP_COORDINATES = [
  { x: 6, y: 76, color: '#CE82FF', bgColor: '#F7EDFF', shadow: '#A85FD6' },
  { x: 18, y: 56, color: '#FF9F43', bgColor: '#FFF4E6', shadow: '#D97F27' },
  { x: 32, y: 74, color: '#20BF6B', bgColor: '#E8FBF0', shadow: '#178B4E' },
  { x: 46, y: 50, color: '#4361EE', bgColor: '#EEF2FF', shadow: '#3046B2' },
  { x: 60, y: 72, color: '#FF6B6B', bgColor: '#FFF0F0', shadow: '#D14D4D' },
  { x: 72, y: 46, color: '#20BF6B', bgColor: '#E8FBF0', shadow: '#178B4E' },
  { x: 84, y: 65, color: '#4CC9F0', bgColor: '#E8F8FE', shadow: '#2FA3C9' },
  { x: 94, y: 32, color: '#FF4757', bgColor: '#FFF0F0', shadow: '#CC3946' },
];

/** One winding trail through every node, drawn from the node coordinates. */
function trailPath(cities: City[]): string {
  if (cities.length < 2) return '';
  let d = `M ${cities[0].x} ${cities[0].y}`;
  for (let i = 1; i < cities.length; i++) {
    const p = cities[i - 1];
    const c = cities[i];
    const mx = (p.x + c.x) / 2;
    d += ` Q ${mx} ${p.y} ${mx} ${(p.y + c.y) / 2} T ${c.x} ${c.y}`;
  }
  return d;
}

function DriftingClouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
      {[
        { top: '10%', size: 86, dur: 48, delay: 0 },
        { top: '38%', size: 120, dur: 66, delay: -14 },
        { top: '64%', size: 70, dur: 80, delay: -32 },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: c.top, animation: `drift ${c.dur}s linear infinite`, animationDelay: `${c.delay}s` }}
        >
          <Cloud size={c.size} className="fill-white text-white" />
        </div>
      ))}
    </div>
  );
}

function CityNode({ city, onClick }: { city: City; onClick: () => void }) {
  const locked = city.status === 'locked';
  const active = city.status === 'active' || city.status === 'boss';
  const done = city.status === 'completed';

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${city.x}%`, top: `${city.y}%` }}>
      <div className="relative flex flex-col items-center">
        {active && (
          <span
            className="pointer-events-none absolute -top-1 left-1/2 h-[72px] w-[72px] -translate-x-1/2 rounded-full border-[5px]"
            style={{ borderColor: city.color, animation: 'pulsering 1.9s ease-out infinite' }}
          />
        )}
        <button
          type="button"
          onClick={locked ? undefined : onClick}
          disabled={locked}
          className={`relative flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 text-[26px] transition-transform ${
            locked ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 active:translate-y-1'
          }`}
          style={{
            background: locked ? '#F0F2F5' : '#fff',
            borderColor: locked ? '#CBD3DC' : city.color,
            boxShadow: locked ? '0 6px 0 #C2CAD3' : `0 6px 0 ${city.shadow}`,
          }}
        >
          {locked ? (
            <Lock size={22} className="text-[#A8B2BE]" />
          ) : done ? (
            <Check size={26} strokeWidth={4} style={{ color: city.color }} />
          ) : city.status === 'boss' ? (
            <Crown size={26} style={{ color: city.color }} />
          ) : (
            <span>{city.emoji}</span>
          )}
          {!locked && !done && (
            <span
              className="absolute -right-3.5 -top-2.5 rounded-full px-2 py-[3px] text-[10px] font-black text-white shadow-md"
              style={{ background: city.color }}
            >
              +{city.xp}
            </span>
          )}
        </button>
        <div className="mt-3 whitespace-nowrap rounded-full bg-white/95 px-3.5 py-1.5 text-center shadow-[0_3px_8px_rgba(0,0,0,0.08)]">
          <p className={`text-[13px] font-black ${locked ? 'text-[#A8B2BE]' : 'text-[#1F2328]'}`}>{city.nameDe}</p>
          {active && (
            <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: city.color }}>
              Current stop
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CityPanel({
  city,
  isAdmin = false,
  onStart,
  onOpenSession,
  onClose,
}: {
  city: City;
  isAdmin?: boolean;
  onStart: () => void;
  onOpenSession: (n: number | 'boss') => void;
  onClose: () => void;
}) {
  const sessionLabel =
    city.status === 'completed'
      ? `All ${city.totalSessions} sessions complete`
      : city.nextSession === 'boss'
        ? 'Boss test unlocked!'
        : `Session ${city.completedSessions + 1} of ${city.totalSessions}`;
  const pct = city.status === 'completed' ? 100 : Math.round((city.completedSessions / city.totalSessions) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="absolute bottom-6 left-1/2 z-40 w-[min(92%,460px)] -translate-x-1/2 overflow-hidden rounded-[28px] border-2 border-[#EEF1F5] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
    >
      <div className="h-[7px] w-full" style={{ background: city.color }} />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 flex-none items-center justify-center rounded-[20px] border-2 text-3xl"
            style={{ background: city.bgColor, borderColor: city.color }}
          >
            {city.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: city.color }}>
              {city.name}, Germany
            </p>
            <h3 className="mt-0.5 text-[22px] font-black tracking-[-0.02em] text-[#1F2328]">{city.nameDe}</h3>
            <p className="truncate text-[13px] font-semibold text-[#8A94A2]">{city.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] border-2 border-b-4 border-[#E4E9EF] bg-white text-[#8A94A2] transition-colors hover:text-[#1F2328]"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="rounded-[18px] bg-[#F6F8FA] px-4 py-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-black text-[#1F2328]">{sessionLabel}</span>
            <span className="rounded-[9px] px-2 py-1 text-[11px] font-black" style={{ background: city.bgColor, color: city.color }}>
              +{city.xp} XP
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E1E6EC]">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: city.color }} />
          </div>
        </div>

        {/* The full syllabus: every session, its skill, and its state. */}
        <div className="hide-scrollbar -mx-1 flex max-h-[230px] flex-col gap-1.5 overflow-y-auto px-1">
          {city.sessions.map((ss) => {
            const skill = SKILLS[ss.skill] ?? SKILLS.vocab;
            const Icon = skill.icon;
            const done = city.completedList.includes(ss.n);
            const isCurrent = city.status !== 'completed' && city.nextSession === ss.n;
            const locked = !isAdmin && !done && !isCurrent && city.status !== 'completed';
            return (
              <button
                key={ss.n}
                type="button"
                disabled={locked}
                onClick={() => onOpenSession(ss.n)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition-colors ${
                  isCurrent || (isAdmin && !done)
                    ? 'border-current bg-white'
                    : done
                      ? 'border-transparent bg-[#F6F8FA] hover:border-[#E4E9EF]'
                      : 'border-transparent bg-[#F6F8FA] opacity-55'
                }`}
                style={isCurrent || (isAdmin && !done) ? { borderColor: city.color } : undefined}
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
                  style={{ background: skill.bg, color: skill.color }}
                >
                  <Icon size={17} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-black text-[#1F2328]">
                    {ss.n}. {ss.title}
                  </span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: skill.color }}>
                    {skill.label}
                  </span>
                </span>
                <span className="flex-none">
                  {done ? (
                    <Check size={16} strokeWidth={4} className="text-[#20BF6B]" />
                  ) : isCurrent || isAdmin ? (
                    <Play size={15} className="fill-current" style={{ color: city.color }} />
                  ) : (
                    <Lock size={14} className="text-[#B4BDC8]" />
                  )}
                </span>
              </button>
            );
          })}

          {/* Boss test row */}
          {(() => {
            const bossUnlocked = isAdmin || city.status === 'completed' || city.nextSession === 'boss';
            return (
              <button
                type="button"
                disabled={!bossUnlocked}
                onClick={() => onOpenSession('boss')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left ${
                  bossUnlocked && city.status !== 'completed'
                    ? 'border-[#F7B731] bg-[#FDF6E4]'
                    : city.status === 'completed'
                      ? 'border-transparent bg-[#F6F8FA] hover:border-[#E4E9EF]'
                      : 'border-transparent bg-[#F6F8FA] opacity-55'
                }`}
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#FDF6E4] text-[#F7B731]">
                  <Crown size={17} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-black text-[#1F2328]">{city.sessions.length + 1}. Boss Test</span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#F7B731]">
                    Beat it to unlock the next city
                  </span>
                </span>
                <span className="flex-none">
                  {city.status === 'completed' ? (
                    <Check size={16} strokeWidth={4} className="text-[#20BF6B]" />
                  ) : bossUnlocked ? (
                    <Play size={15} className="fill-[#F7B731] text-[#F7B731]" />
                  ) : (
                    <Lock size={14} className="text-[#B4BDC8]" />
                  )}
                </span>
              </button>
            );
          })()}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="rounded-[18px] py-4 text-center text-sm font-black uppercase tracking-[0.07em] text-white transition-transform active:translate-y-[5px]"
          style={{ background: city.color, boxShadow: `0 5px 0 ${city.shadow}` }}
        >
          {city.status === 'completed' ? 'Review City' : isAdmin ? 'Play Next Session (Admin Unlocked)' : 'Continue Journey'}
        </button>
      </div>
    </motion.div>
  );
}

export default function LearnPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [cities, setCities] = useState<City[]>([]);
  const [pendingCity, setPendingCity] = useState<City | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const local = readStreak();
    setStreak(local.current);
    setStreakAtRisk(daysSinceActive() === 1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stagesRes, progressRes] = await Promise.all([api.get('/stages/section/A1'), api.get('/progress')]);
        const stages = stagesRes.data;
        const progress = progressRes.data;

        let foundActive = false;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const mapped: City[] = stages.map((stage: any, index: number) => {
          const isCompleted = progress.completedStages.some((c: any) => c._id === stage._id || c === stage._id);
          const stageProg = progress.stageProgress?.find((sp: any) => sp.stageId === stage._id);
          const completedSessionsCount = stageProg ? stageProg.completedSessions.length : 0;
          const totalSessions = (stage.sessions?.length || 0) + (stage.bossTest?.length > 0 ? 1 : 0);

          let nextSession: number | 'boss' = completedSessionsCount + 1;
          if (nextSession > (stage.sessions?.length || 0)) nextSession = 'boss';

          let status: NodeStatus = 'locked';
          if (isCompleted) status = 'completed';
          else if (!foundActive) {
            status = nextSession === 'boss' ? 'boss' : 'active';
            foundActive = true;
          }

          const coords = MAP_COORDINATES[index % MAP_COORDINATES.length];
          const calcXp =
            stage.totalXp ||
            ((stage.sessions?.reduce(
              (a: any, s: any) => a + (s.exercises?.reduce((acc: any, ex: any) => acc + ex.points, 0) || 0),
              0
            ) || 0) +
              (stage.bossTest?.reduce((a: any, c: any) => a + c.points, 0) || 0));

          return {
            id: stage._id,
            stageNumber: stage.stageNumber,
            tier: stage.tier,
            name: stage.cityName,
            nameDe: stage.cityNameDe,
            status,
            emoji: stage.emoji,
            color: coords.color,
            bgColor: coords.bgColor,
            shadow: coords.shadow,
            description: stage.theme,
            xp: calcXp,
            x: coords.x,
            y: coords.y,
            completedSessions: completedSessionsCount,
            completedList: stageProg ? [...stageProg.completedSessions] : [],
            sessions: (stage.sessions ?? []).map((ss: any) => ({
              n: ss.sessionNumber,
              title: ss.title,
              skill: ss.skillType,
            })),
            totalSessions,
            nextSession,
          };
        });
        /* eslint-enable @typescript-eslint/no-explicit-any */

        setCities(mapped);
        setTotalXp(progress.totalXp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#E8ECEF]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#4361EE] border-t-transparent" />
      </div>
    );
  }

  const completedCount = cities.filter((c) => c.status === 'completed').length;
  const activeCity = cities.find((c) => c.status === 'active' || c.status === 'boss');
  const trail = trailPath(cities);

  return (
    <div className="min-h-full px-3 sm:px-5 pb-6 pt-4 w-full">
      {/* Header */}
      <header className="w-full flex items-center justify-between gap-4 px-2 pb-4 pt-1">
        <div>
          <p className="dj-crumb">Section 1 · A1</p>
          <h1 className="dj-title flex items-center gap-2">Germany Journey 🗺️</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="dj-chip border-[#CE82FF] text-[#9B51E0] bg-[#F7EDFF]" title="Admin Mode: All levels and sessions unlocked">
              <Crown size={18} className="fill-[#CE82FF] text-[#CE82FF]" />
              <span className="text-xs font-black uppercase">All Unlocked (Admin)</span>
            </div>
          )}
          <div className="dj-chip dj-chip-streak" title={streakAtRisk ? 'Practise today to keep your streak' : `${streak}-day streak`}>
            <Flame size={19} className={streak > 0 ? 'fill-[#FF9F43] text-[#FF9F43]' : 'text-gray-300'} />
            <span>{streak}</span>
          </div>
          <div className="dj-chip dj-chip-xp" title="Total XP">
            <Zap size={18} className="fill-[#4361EE] text-[#4361EE]" />
            <span>{totalXp}</span>
          </div>
          <div className="dj-chip dj-chip-muted">
            <Landmark size={17} />
            <span className="text-sm">{completedCount}/{cities.length}</span>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="relative w-full h-[calc(100vh-140px)] min-h-[560px] overflow-hidden rounded-[36px] border-2 border-b-[5px] border-[#e5e5e5] bg-gradient-to-br from-[#E2F0CB] via-[#F4F9F1] to-[#D4E8C1]">
        <DriftingClouds />

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          <path d={trail} fill="none" stroke="#B9C6A6" strokeWidth="1.6" strokeLinecap="round" />
          <path d={trail} fill="none" stroke="#fff" strokeWidth="0.7" strokeDasharray="2 3" strokeLinecap="round" />
        </svg>

        {cities.map((city) => (
          <CityNode key={city.id} city={city} onClick={() => setPendingCity(city)} />
        ))}

        {activeCity && !pendingCity && (
          <motion.button
            type="button"
            onClick={() => setPendingCity(activeCity)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border-2 border-[#EEF1F5] bg-white px-5 py-2.5 shadow-[0_6px_18px_rgba(0,0,0,0.1)]"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#EEF2FF]">
              <Train size={18} className="text-[#4361EE]" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9AA6B4]">Next Stop</p>
              <p className="text-sm font-black text-[#1F2328]">
                {activeCity.nameDe} · Stop {activeCity.stageNumber}
              </p>
            </div>
          </motion.button>
        )}

        <AnimatePresence>
          {pendingCity && (
            <CityPanel
              city={pendingCity}
              isAdmin={isAdmin}
              onStart={() =>
                router.push(
                  `/lesson/${pendingCity.tier}/${pendingCity.stageNumber}/${pendingCity.status === 'completed' ? 1 : pendingCity.nextSession}`
                )
              }
              onOpenSession={(n) => router.push(`/lesson/${pendingCity.tier}/${pendingCity.stageNumber}/${n}`)}
              onClose={() => setPendingCity(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
