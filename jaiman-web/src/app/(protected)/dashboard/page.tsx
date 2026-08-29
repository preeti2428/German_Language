'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Zap, Play, Check, MessageCircle, BookOpen,
  Star, Trophy, Lock, ChevronRight, Volume2, GraduationCap,
  Target, BarChart3, Pencil, CalendarDays, Bell, Clock, Crown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { readStreak, readTutorTurns, today } from '@/lib/streak';
import { speakGerman } from '@/lib/speech';
import { useDailyTimer } from '@/hooks/useDailyTimer';
import { calculateLevelInfo } from '@/lib/level';
import DailyQuizModal from '@/components/lesson/DailyQuizModal';

const DAILY_GOAL = 50;

const WORDS_OF_DAY = [
  { de: 'doch', ipa: '/dɔx/', en: 'yes it is! (contradicting)', ex: 'Das stimmt nicht! — Doch!', exEn: "That's not true! — Yes it is!" },
  { de: 'die Sehnsucht', ipa: '/ˈzeːnˌzʊxt/', en: 'a deep longing', ex: 'Ich habe Sehnsucht nach Hause.', exEn: 'I have a longing for home.' },
  { de: 'gemütlich', ipa: '/ɡəˈmyːtlɪç/', en: 'cosy, snug', ex: 'Das Café ist sehr gemütlich.', exEn: 'The café is very cosy.' },
  { de: 'das Fernweh', ipa: '/ˈfɛʁnveː/', en: 'wanderlust', ex: 'Im Sommer habe ich Fernweh.', exEn: 'In summer I long to travel.' },
  { de: 'der Feierabend', ipa: '/ˈfaɪ̯ɐˌʔaːbn̩t/', en: 'end of the workday', ex: 'Endlich Feierabend!', exEn: 'Finally, the workday is over!' },
  { de: 'quatschen', ipa: '/ˈkvatʃn̩/', en: 'to chat, natter', ex: 'Wir quatschen den ganzen Abend.', exEn: 'We chat the whole evening.' },
  { de: 'die Geborgenheit', ipa: '/ɡəˈbɔʁɡn̩haɪ̯t/', en: 'safe cosiness', ex: 'Zu Hause fühle ich Geborgenheit.', exEn: 'At home I feel safe and warm.' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  return 'Guten Abend';
}

interface ProgressData {
  totalXp: number;
  completedStages: any[];
  stageProgress?: { stageId: string; completedSessions: number[] }[];
}

interface StageData {
  _id: string;
  stageNumber: number;
  tier: string;
  theme: string;
  cityName: string;
  cityNameDe: string;
  emoji: string;
  sessions: { sessionNumber: number; title: string; skillType: string; exercises?: any[] }[];
  bossTest?: any[];
  totalXp?: number;
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [stages, setStages] = useState<StageData[]>([]);
  const [wordFlipped, setWordFlipped] = useState(false);
  const [streakState, setStreakState] = useState(() => ({ current: 0, history: {} as Record<string, number> }));
  const [tutor, setTutor] = useState({ total: 0, today: 0 });
  const [myBatches, setMyBatches] = useState<{ _id: string; title: string; level: string; modules: { title: string }[]; teacher: { name: string } }[]>([]);
  const [dailyUpdates, setDailyUpdates] = useState<{ _id: string; title: string; body: string; emoji: string; type: string; pinned: boolean; publishedAt: string }[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);

  useEffect(() => {
    refreshUser();
    const s = readStreak();
    setStreakState({ current: s.current, history: s.history });
    setTutor(readTutorTurns());

    Promise.all([
      api.get('/progress').catch(() => ({ data: null })),
      api.get('/stages/section/A1').catch(() => ({ data: [] })),
      api.get('/batches/my').catch(() => ({ data: [] })),
      api.get('/updates?limit=5').catch(() => ({ data: [] })),
    ]).then(([progRes, stagesRes, batchRes, updatesRes]) => {
      if (progRes.data) setProgress(progRes.data);
      if (stagesRes.data && Array.isArray(stagesRes.data)) setStages(stagesRes.data);
      if (batchRes.data && Array.isArray(batchRes.data)) setMyBatches(batchRes.data);
      if (updatesRes.data && Array.isArray(updatesRes.data)) setDailyUpdates(updatesRes.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute real user XP, streak, and level
  const xp = user?.xp ?? progress?.totalXp ?? 0;
  const streakCount = user?.streak?.current ?? streakState.current;
  const levelInfo = useMemo(() => calculateLevelInfo(xp, user?.level), [xp, user?.level]);

  // Real today's XP from activity history or local storage
  const todayStr = today();
  const serverTodayXp = user?.activityHistory?.find((a) => a.date === todayStr)?.xpEarned ?? 0;
  const xpToday = Math.max(serverTodayXp, streakState.history[todayStr] ?? 0);

  const goalPct = Math.min(1, xpToday / DAILY_GOAL);
  const CIRC = 2 * Math.PI * 54; // r=54
  const dashOffset = CIRC * (1 - goalPct);

  // Real total completed sessions & stages
  const sessionsDone = useMemo(
    () => progress?.stageProgress?.reduce((a, s) => a + s.completedSessions.length, 0) ?? 0,
    [progress]
  );
  const stagesDone = progress?.completedStages?.length ?? 0;

  // Compute Active Stage and Next Session dynamically
  const activeMission = useMemo(() => {
    if (!stages || stages.length === 0) {
      return {
        title: 'Café Conversation',
        sub: 'Order your first coffee in German.',
        city: 'Berlin',
        emoji: '🇩🇪',
        level: user?.level ?? 'A1',
        sessionNumber: 1,
        xp: 40,
        skillType: 'Vocabulary',
        isBoss: false,
      };
    }

    // Find first incomplete stage
    const activeStage = stages.find((st) => {
      const isDone = progress?.completedStages?.some((c: any) => (c._id || c) === st._id);
      return !isDone;
    }) || stages[0]!;

    const stageProg = progress?.stageProgress?.find((sp: any) => sp.stageId === activeStage._id);
    const completedCount = stageProg ? stageProg.completedSessions.length : 0;
    const totalSessions = activeStage.sessions?.length || 0;

    if (completedCount >= totalSessions) {
      return {
        title: `${activeStage.cityNameDe} Boss Challenge`,
        sub: `Test your skills to master ${activeStage.cityNameDe}!`,
        city: activeStage.cityNameDe || activeStage.cityName,
        emoji: activeStage.emoji || '👑',
        level: activeStage.tier || user?.level || 'A1',
        sessionNumber: totalSessions + 1,
        xp: 100,
        skillType: 'Boss Test',
        isBoss: true,
      };
    }

    const nextSession = activeStage.sessions[completedCount] || activeStage.sessions[0];
    return {
      title: nextSession?.title ? `${activeStage.cityNameDe}: ${nextSession.title}` : activeStage.theme,
      sub: `Continue ${activeStage.cityNameDe} journey with session ${completedCount + 1}`,
      city: activeStage.cityNameDe || activeStage.cityName,
      emoji: activeStage.emoji || '📍',
      level: activeStage.tier || user?.level || 'A1',
      sessionNumber: completedCount + 1,
      xp: nextSession?.exercises?.reduce((acc: number, ex: any) => acc + (ex.points || 10), 0) || 40,
      skillType: nextSession?.skillType || 'Vocabulary',
      isBoss: false,
    };
  }, [stages, progress, user?.level]);

  // Real German Journey Cities list derived from stages API
  const journeyCities = useMemo(() => {
    if (!stages || stages.length === 0) {
      return [
        { name: 'Berlin', emoji: '🏛️', done: stagesDone >= 1, current: stagesDone === 0 },
        { name: 'Hamburg', emoji: '🚢', done: stagesDone >= 2, current: stagesDone === 1 },
        { name: 'Munich', emoji: '🍺', done: stagesDone >= 3, current: stagesDone === 2 },
        { name: 'Cologne', emoji: '⛪', done: stagesDone >= 4, current: stagesDone === 3 },
        { name: 'Frankfurt', emoji: '🏦', done: stagesDone >= 5, current: stagesDone === 4 },
      ];
    }

    let foundCurrent = false;
    return stages.slice(0, 5).map((st) => {
      const isDone = progress?.completedStages?.some((c: any) => (c._id || c) === st._id) || false;
      let isCurrent = false;
      if (!isDone && !foundCurrent) {
        isCurrent = true;
        foundCurrent = true;
      }
      return {
        id: st._id,
        name: st.cityNameDe || st.cityName,
        emoji: st.emoji || '📍',
        done: isDone,
        current: isCurrent,
      };
    });
  }, [stages, progress, stagesDone]);

  // Real Daily Missions tracking based on actual activity
  const missions = useMemo(() => {
    // 1. Learn: Real daily XP or words practiced today
    const learnProgress = Math.min(5, Math.floor(xpToday / 10));
    const learnDone = xpToday >= 20;

    // 2. Speak: Real AI tutor turns today
    const speakProgress = Math.min(tutor.today, 2);
    const speakDone = tutor.today >= 2;

    // 3. Practice: Real lesson completed today (xpToday >= 30)
    const practiceProgress = xpToday >= 30 ? 1 : 0;
    const practiceDone = xpToday >= 30;

    return [
      {
        id: 'learn',
        emoji: '📖',
        label: 'Learn',
        sub: 'Learn 5 new words (Earn 20+ XP)',
        progress: learnProgress,
        total: 5,
        xp: 20,
        color: '#E53935',
        bg: '#FFF5F5',
        border: '#FFCDD2',
        done: learnDone,
      },
      {
        id: 'speak',
        emoji: '🎙️',
        label: 'Speak',
        sub: 'Talk to Jai (2 messages)',
        progress: speakProgress,
        total: 2,
        xp: 40,
        color: '#E53935',
        bg: '#FFF5F5',
        border: '#FFCDD2',
        done: speakDone,
      },
      {
        id: 'practice',
        emoji: '✏️',
        label: 'Practice',
        sub: 'Complete 1 lesson today',
        progress: practiceProgress,
        total: 1,
        xp: 30,
        color: '#FF9F43',
        bg: '#FFF8EE',
        border: '#FFE0B2',
        done: practiceDone,
      },
    ];
  }, [xpToday, tutor.today]);

  const doneMissions = missions.filter((m) => m.done).length;
  const word = WORDS_OF_DAY[new Date().getDate() % WORDS_OF_DAY.length];

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* ══════════════════════════════════════════════════════════════
          TOP HEADER — Greeting + Real User Stats
      ══════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-[#F0F0F0] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <h1 className="text-[22px] font-black text-[#1A1A2E]">
            {greeting()}, <span className="text-[#E53935]">{user?.name?.split(' ')[0] ?? 'Learner'}!</span> 👋
          </h1>
          <p className="text-sm font-medium text-[#9E9E9E] mt-0.5">Ready for your next German mission?</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Day Streak */}
          <div className="flex items-center gap-2 bg-white border border-[#FFE0B2] border-b-[3px] border-b-[#FF9F43] rounded-2xl px-4 py-2.5">
            <Flame size={18} className={streakCount > 0 ? 'fill-[#FF9F43] text-[#FF9F43]' : 'text-[#DDD]'} />
            <div>
              <p className="text-[13px] font-black text-[#1A1A2E] leading-none">{streakCount}</p>
              <p className="text-[9px] font-bold text-[#BDBDBD] uppercase tracking-wide">Day Streak</p>
            </div>
          </div>
          {/* Total XP */}
          <div className="flex items-center gap-2 bg-white border border-[#FFCDD2] border-b-[3px] border-b-[#E53935] rounded-2xl px-4 py-2.5">
            <Zap size={18} className="fill-[#E53935] text-[#E53935]" />
            <div>
              <p className="text-[13px] font-black text-[#1A1A2E] leading-none">{xp.toLocaleString()} XP</p>
              <p className="text-[9px] font-bold text-[#BDBDBD] uppercase tracking-wide">Total XP</p>
            </div>
          </div>
          {/* Questions Solved */}
          <div className="flex items-center gap-2 bg-white border border-[#C5CAE9] border-b-[3px] border-b-[#3F51B5] rounded-2xl px-4 py-2.5">
            <Target size={18} className="text-[#3F51B5]" />
            <div>
              <p className="text-[13px] font-black text-[#1A1A2E] leading-none">{(user?.totalQuestionsSolved || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-[#BDBDBD] uppercase tracking-wide">Questions</p>
            </div>
          </div>
          {/* Level */}
          <div className="flex items-center gap-2 bg-white border border-[#FFE082] border-b-[3px] border-b-[#FFC107] rounded-2xl px-4 py-2.5">
            <span className="text-lg">🏅</span>
            <div>
              <p className="text-[13px] font-black text-[#1A1A2E] leading-none">Level {levelInfo.level}</p>
              <p className="text-[9px] font-bold text-[#BDBDBD] uppercase tracking-wide">{levelInfo.tierLabel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          MAIN CONTENT — Two Columns
      ══════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-5 max-w-[1400px] mx-auto">
        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* --- GERMANY GUIDE BANNER (TOP) --- */}
          <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#1565C0] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                🇩🇪
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-[#1A1A2E] text-[15px]">GERMANY GUIDE & ROADMAP</h3>
                  <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#A5D6A7]">
                    STUDY & JOBS
                  </span>
                </div>
                <p className="text-[#757575] text-xs font-medium mt-0.5">
                  Complete roadmap for Public Universities, APS, Opportunity Card (Chancenkarte), and Visa checklists.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/germany-guide')}
              className="duo-btn duo-btn-red px-5 py-2.5 text-xs font-black flex items-center justify-center gap-2 self-start sm:self-auto flex-shrink-0"
            >
              Open Germany Guide <ChevronRight size={14} />
            </button>
          </div>

          {/* ── NEXT MISSION CARD (REAL USER STAGE & SESSION) ────────────────────────────── */}
          <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] overflow-hidden relative">
            <div className="p-5 sm:p-6 sm:pr-[260px] relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-[#FFF3CD] text-[#E6A800] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                <Star size={11} className="fill-[#FFC107] text-[#FFC107]" /> YOUR NEXT MISSION
              </div>
              <h2 className="text-[26px] font-black text-[#1A1A2E] leading-tight mb-1">
                {activeMission.title}
              </h2>
              <p className="text-[#9E9E9E] font-medium text-sm mb-4">
                {activeMission.sub}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#43A047] bg-[#E8F5E9] px-3 py-1.5 rounded-xl">
                  <BarChart3 size={12} /> {activeMission.level} Level
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#1565C0] bg-[#E3F2FD] px-3 py-1.5 rounded-xl">
                  <BookOpen size={12} /> {activeMission.skillType}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#E6A800] bg-[#FFF8E1] px-3 py-1.5 rounded-xl">
                  ⭐ +{activeMission.xp} XP
                </span>
              </div>

              <button
                onClick={() => router.push('/learn')}
                className="duo-btn duo-btn-red px-7 py-3.5 text-sm flex items-center gap-2 w-fit"
              >
                Continue Level <ChevronRight size={16} />
              </button>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#BDBDBD] flex items-center gap-1.5">
                  <BookOpen size={12} /> {sessionsDone} sessions completed so far
                </span>
              </div>
            </div>

            {/* Mascot / Illustration area */}
            <div className="hidden sm:flex absolute right-0 top-0 bottom-0 w-[240px] flex-col items-center justify-end overflow-hidden bg-gradient-to-l from-[#FFF8F8] to-transparent">
              <div
                className="text-[120px] leading-none mb-2 select-none"
                style={{ filter: 'drop-shadow(0 4px 16px rgba(229,57,53,0.15))' }}
              >
                {activeMission.isBoss ? '👑' : '🧑‍🎓'}
              </div>
              <div className="absolute bottom-4 right-4 bg-white border border-[#EAEAEA] border-b-[3px] border-b-[#D8D8D8] rounded-xl px-3 py-1.5 text-xs font-black text-[#E53935] flex items-center gap-1.5">
                📍 {activeMission.city} — Active Stop
              </div>
            </div>
          </div>

          {/* ── DAILY MISSIONS (REAL ACTIONS TRACKING) ─────────────────────────────────── */}
          <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#1A1A2E] text-[15px]">DAILY MISSIONS</h3>
                <p className="text-[#BDBDBD] text-xs font-medium mt-0.5">Complete your daily challenges and earn XP</p>
              </div>
              <span className="text-xs font-black text-[#E53935] bg-[#FFF5F5] border border-[#FFCDD2] px-3 py-1 rounded-full">
                {doneMissions}/{missions.length} Completed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className="rounded-[1.25rem] p-4 cursor-pointer hover:brightness-[0.97] transition-all"
                  style={{
                    background: m.bg,
                    border: `1.5px solid ${m.border}`,
                    borderBottomWidth: '4px',
                    borderBottomColor: m.color,
                  }}
                  onClick={() => router.push('/practice/level-test')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{m.emoji}</span>
                    {m.done && <Check size={16} className="text-[#43A047]" strokeWidth={3} />}
                  </div>
                  <p className="font-black text-[#1A1A2E] text-sm">{m.label}</p>
                  <p className="text-[11px] font-medium text-[#9E9E9E] mt-0.5 mb-3">{m.sub}</p>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-white/60 mb-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.progress / m.total) * 100)}%`, background: m.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#BDBDBD]">
                      {m.progress}/{m.total}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white" style={{ background: m.color }}>
                      +{m.xp} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── GERMAN JOURNEY (DYNAMIC STAGES FROM API) ─────────────────────────────────── */}
          <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#1A1A2E] text-[15px]">YOUR GERMAN JOURNEY</h3>
                <p className="text-[#BDBDBD] text-xs font-medium mt-0.5">Travel through German cities as you learn!</p>
              </div>
              <button
                onClick={() => router.push('/learn')}
                className="text-xs font-black text-[#E53935] hover:underline flex items-center gap-1"
              >
                View Full Journey <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex items-center gap-0 overflow-x-auto hide-scrollbar pb-2">
              {journeyCities.map((city, i) => (
                <div key={city.name} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => (city.done || city.current ? router.push('/learn') : undefined)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all border-2 border-b-[4px] mb-2 ${
                        city.current
                          ? 'bg-white border-[#E53935] border-b-[#C62828] shadow-[0_4px_16px_rgba(229,57,53,0.25)] scale-110'
                          : city.done
                          ? 'bg-[#E8F5E9] border-[#A5D6A7] border-b-[#43A047]'
                          : 'bg-[#F5F5F5] border-[#E0E0E0] border-b-[#BDBDBD] opacity-50'
                      }`}
                    >
                      {city.done && !city.current ? '✅' : city.current ? city.emoji : <Lock size={20} className="text-[#BDBDBD]" />}
                    </button>
                    <p className={`text-[11px] font-black ${city.current ? 'text-[#E53935]' : 'text-[#9E9E9E]'}`}>
                      {city.name}
                    </p>
                    <p className="text-[9px] font-medium text-[#BDBDBD]">
                      {city.current ? 'Current' : city.done ? 'Done' : 'Locked'}
                    </p>
                  </div>
                  {i < journeyCities.length - 1 && (
                    <div className="w-8 h-[2px] bg-[#F0F0F0] mx-1 flex-shrink-0">
                      <div
                        className={`h-full rounded-full ${city.done ? 'bg-[#E53935]' : 'bg-[#E0E0E0]'}`}
                        style={{ width: city.done ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* --- MY ENROLLED BATCHES --- */}
          {myBatches.length > 0 && (
            <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[#1A1A2E] text-[15px] flex items-center gap-2">
                  <GraduationCap size={18} className="text-[#E53935]" /> MY BATCHES
                </h3>
                <a href="/courses" className="text-xs font-black text-[#E53935] hover:underline flex items-center gap-1">
                  Browse all <ChevronRight size={12} />
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myBatches.slice(0, 4).map((b) => (
                  <a
                    key={b._id}
                    href={`/learn/batch/${b._id}`}
                    className="flex items-center gap-3 p-3 rounded-[1rem] bg-[#FFF5F5] border border-[#FFCDD2] border-b-[3px] border-b-[#E53935] hover:brightness-95 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                      {b.level}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#1A1A2E] text-xs truncate group-hover:text-[#E53935]">{b.title}</p>
                      <p className="text-[#BDBDBD] text-[10px] font-medium">{b.modules?.length ?? 0} modules</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="w-full xl:w-[300px] flex-shrink-0 flex flex-col gap-4">
          {/* TODAY'S GOAL */}
          <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-[#1A1A2E] text-[13px] uppercase tracking-wide">Today's Goal</p>
              <button
                onClick={() => router.push('/learn')}
                className="text-[11px] font-bold text-[#E53935] flex items-center gap-1 hover:underline"
              >
                <Pencil size={11} /> Learn
              </button>
            </div>

            {/* Ring */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-[120px] h-[120px]">
                <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#F5F5F5" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#E53935"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-black text-[#1A1A2E]">{xpToday}</p>
                  <p className="text-[10px] font-bold text-[#BDBDBD]">/ {DAILY_GOAL} XP</p>
                </div>
              </div>
              <p className="text-xs font-bold text-[#BDBDBD] mt-2">
                {xpToday >= DAILY_GOAL ? '🎉 Daily goal accomplished!' : 'Keep your streak alive! 🔥'}
              </p>
            </div>

            {/* Goal items */}
            <div className="space-y-2.5">
              {[
                { label: 'Learn 5 new words', xp: 20, done: xpToday >= 20 },
                { label: 'Talk to Jai for 2 min', xp: 40, done: tutor.today >= 2 },
                { label: 'Complete a lesson', xp: 30, done: xpToday >= 30 },
              ].map((g, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        g.done ? 'bg-[#43A047]' : 'border-2 border-[#E0E0E0]'
                      }`}
                    >
                      {g.done && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[12px] font-semibold ${g.done ? 'text-[#BDBDBD] line-through' : 'text-[#1A1A2E]'}`}>
                      {g.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-[#43A047]">+{g.xp} XP</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/learn')}
              className="mt-4 w-full text-center text-xs font-black text-[#E53935] hover:underline flex items-center justify-center gap-1"
            >
              Start Learning <ChevronRight size={12} />
            </button>
          </div>

          {/* 5-MIN DAILY PRACTICE / QUICK QUIZ WIDGET */}
          {(() => {
            const quizDoneToday = (user?.streak as any)?.dailyQuizCompletedDate === todayStr;
            const timePct = quizDoneToday ? 1 : 0;
            const goalMet = quizDoneToday;
            return (
              <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#43A047] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center justify-center w-7 h-7 rounded-xl ${goalMet ? 'bg-[#E8F5E9] text-[#43A047]' : 'bg-[#FFF5F5] text-[#E53935]'}`}>
                      <Zap size={15} className={goalMet ? 'fill-[#43A047]' : 'fill-[#E53935]'} />
                    </span>
                    <p className="font-black text-[#1A1A2E] text-[13px] uppercase tracking-wide">
                      Daily 5-Min Practice
                    </p>
                  </div>
                  {goalMet ? (
                    <span className="text-[10px] font-black text-white bg-[#43A047] px-2.5 py-0.5 rounded-full shadow-xs">
                      ✓ DONE!
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-[#E53935] bg-[#FFF5F5] border border-[#FFCDD2] px-2 py-0.5 rounded-full">
                      +30 XP
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#757575] font-medium mb-3">
                  {goalMet
                    ? '🎉 5-Min daily review completed for today (+30 XP earned). Practice questions anytime to keep your memory sharp!'
                    : 'Quick quiz with questions & words you’ve learned so far to keep your German fresh!'}
                </p>

                {/* Progress bar */}
                <div className="h-2.5 bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${timePct * 100}%`, background: goalMet ? '#43A047' : '#E53935' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-[#9E9E9E] mb-3">
                  <span>{goalMet ? '5m spent today' : '0m spent today'}</span>
                  <span>{goalMet ? '5m / 5m Goal Met 🎯' : '5 min remaining'}</span>
                </div>

                {/* Action button to open interactive quiz */}
                <button
                  onClick={() => setShowQuizModal(true)}
                  className={`w-full py-3 text-xs flex items-center justify-center gap-2 duo-btn ${
                    goalMet ? 'duo-btn-outline' : 'duo-btn-red'
                  }`}
                >
                  <Zap size={14} className={goalMet ? 'text-[#43A047]' : 'fill-white text-white'} />
                  {goalMet ? 'Practice Again (Quick Quiz)' : 'Start 5-Min Daily Quiz'}
                </button>
              </div>
            );
          })()}

          {/* DAILY UPDATES */}
          {dailyUpdates.length > 0 && (
            <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#FF9F43] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-[#FF9F43]" />
                <p className="font-black text-[#1A1A2E] text-[12px] uppercase tracking-wide">Updates</p>
                {user?.role === 'admin' && (
                  <a href="/admin/updates" className="ml-auto text-[10px] font-bold text-[#E53935] hover:underline">
                    Manage
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {dailyUpdates.slice(0, 3).map((u) => (
                  <div key={u._id} className="flex items-start gap-2.5 p-2.5 bg-[#F5F6FA] rounded-xl">
                    <span className="text-base flex-shrink-0">{u.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-black text-[#1A1A2E] text-[11px] leading-snug">{u.title}</p>
                      <p className="text-[10px] text-[#9E9E9E] font-medium mt-0.5 line-clamp-1">{u.body}</p>
                    </div>
                    {u.pinned && <span className="text-[9px] text-[#E53935] flex-shrink-0">📌</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOOK SESSION CTA */}
          <div
            className="rounded-[1.5rem] p-4 text-white relative overflow-hidden cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 60%, #42A5F5 100%)' }}
            onClick={() => router.push('/calendar')}
          >
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={15} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Book a Session</p>
            </div>
            <p className="font-black text-[15px] leading-snug mb-3">Practice with Jai 1-on-1 🎙️</p>
            <button className="text-xs font-black bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded-xl">
              View Calendar →
            </button>
            <div className="absolute -right-3 -bottom-3 text-[70px] opacity-10 select-none">📅</div>
          </div>

          {/* WORD OF THE DAY */}
          <div
            className="rounded-[1.5rem] p-5 text-white relative overflow-hidden cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #E53935 0%, #EF5350 60%, #FF7043 100%)' }}
            onClick={() => setWordFlipped(!wordFlipped)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Word of the Day</p>
              <span className="text-[10px] font-bold text-white/60 flex items-center gap-1">Tap to flip 🔄</span>
            </div>

            {!wordFlipped ? (
              <>
                <p className="text-[36px] font-black leading-none mb-1">{word.de}</p>
                <p className="text-white/70 text-sm font-medium">{word.ipa}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakGerman(word.de);
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <Volume2 size={14} />
                  </button>
                  <span className="text-white/60 text-xs font-medium italic">{word.en}</span>
                </div>
                <button className="mt-3 text-xs font-black text-white/80 hover:text-white flex items-center gap-1">
                  Practice this word <ChevronRight size={11} />
                </button>
              </>
            ) : (
              <>
                <p className="text-[15px] font-black mb-1 italic">"{word.ex}"</p>
                <p className="text-white/70 text-sm font-medium">{word.exEn}</p>
                <div className="mt-3 text-xs text-white/60 font-bold">Tap again to see word</div>
              </>
            )}

            {/* German flag decoration */}
            <div className="absolute -right-3 -bottom-3 text-[80px] opacity-20 select-none">🇩🇪</div>
          </div>

          {/* TALK TO JAI */}
          <div className="bg-white rounded-[1.5rem] border border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E53935] flex items-center justify-center text-2xl flex-shrink-0">
                🤖
              </div>
              <div>
                <p className="font-black text-[#1A1A2E] text-sm">Talk to Jai</p>
                <p className="text-[#9E9E9E] text-xs font-medium mt-0.5">Practice speaking German with Jai. He's here to help!</p>
              </div>
            </div>

            {tutor.today >= 1 && (
              <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold text-[#43A047]">
                <Check size={13} strokeWidth={3} /> Talked today • +15 XP earned
              </div>
            )}

            <button
              onClick={() => router.push('/tutor')}
              className="duo-btn duo-btn-yellow w-full py-3 text-[12px] flex items-center justify-center gap-2"
            >
              💬 Start Conversation
            </button>
          </div>

          {/* Tip */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF8E1] rounded-2xl border border-[#FFE082]">
            <span className="text-lg">💡</span>
            <p className="text-[11px] font-semibold text-[#E6A800]">
              Tip: Learn a little every day and see big results.
            </p>
            <span className="ml-auto text-base">🇩🇪</span>
          </div>
        </div>
      </div>

      {/* Interactive 5-Minute Daily Quiz Modal */}
      <DailyQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onComplete={() => {
          refreshUser();
          api.get('/progress').then((r) => setProgress(r.data)).catch(() => {});
        }}
      />
    </div>
  );
}
