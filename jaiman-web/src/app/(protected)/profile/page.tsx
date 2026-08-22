'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Flame, Landmark, Pencil, Trophy, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { readStreak } from '@/lib/streak';

/**
 * Profile, rebuilt to the design canvas: XP-ring avatar, real stat tiles,
 * the dark level-progress card, achievements with live progress bars, and
 * inline name editing (saved via the existing PUT /users/profile route).
 */

const LEVEL_XP = 100;

interface ProgressData {
  completedStages: unknown[];
  stageProgress?: { completedSessions: number[] }[];
}

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshUser();
    const s = readStreak();
    setStreak({ current: s.current, longest: s.longest });
    api.get('/progress').then((r) => setProgress(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xp = user?.xp ?? 0;
  const level = Math.floor(xp / LEVEL_XP) + 1;
  const intoLevel = xp % LEVEL_XP;
  const toNext = LEVEL_XP - intoLevel;
  const ringDash = 452 - (452 * intoLevel) / LEVEL_XP;

  const sessionsDone = useMemo(
    () => progress?.stageProgress?.reduce((a, s) => a + s.completedSessions.length, 0) ?? 0,
    [progress]
  );
  const stagesDone = progress?.completedStages?.length ?? 0;

  const stats = [
    { label: 'Day streak', value: streak.current, icon: Flame, color: '#FF9F43', bg: '#FFF4E6', bd: '#FFE2C4' },
    { label: 'Total XP', value: xp, icon: Zap, color: '#4361EE', bg: '#EEF2FF', bd: '#D6DEFF' },
    { label: 'Sessions', value: sessionsDone, icon: BookOpen, color: '#20BF6B', bg: '#E8FBF0', bd: '#CBEFDC' },
    { label: 'Cities done', value: stagesDone, icon: Landmark, color: '#CE82FF', bg: '#F7EDFF', bd: '#EBD6FA' },
  ];

  const achievements = [
    { name: 'First Steps', desc: 'Finish 5 sessions', now: sessionsDone, max: 5, color: '#20BF6B', bg: '#E8FBF0', bd: '#CBEFDC', icon: Check },
    { name: 'On Fire', desc: 'Reach a 7-day streak', now: streak.longest, max: 7, color: '#FF9F43', bg: '#FFF4E6', bd: '#FFE2C4', icon: Flame },
    { name: 'City Explorer', desc: 'Complete 3 cities', now: stagesDone, max: 3, color: '#4361EE', bg: '#EEF2FF', bd: '#D6DEFF', icon: Landmark },
    { name: 'XP Master', desc: 'Earn 1000 XP', now: xp, max: 1000, color: '#CE82FF', bg: '#F7EDFF', bd: '#EBD6FA', icon: Trophy },
  ];

  async function saveName() {
    const name = nameDraft.trim();
    if (!name || !token || saving) return;
    setSaving(true);
    try {
      await api.put('/users/profile', { name });
      await refreshUser();
      setEditingName(false);
    } catch {
      /* keep editing state so the user can retry */
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell crumb="Your Journey" title="Profile">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <section className="flex flex-col items-center rounded-[2rem] border-2 border-b-[5px] border-t-8 border-[#e5e5e5] border-t-[#4361EE] bg-white p-8 text-center">
            <div className="relative mb-4 flex h-[152px] w-[152px] items-center justify-center">
              <svg width="152" height="152" viewBox="0 0 152 152" className="absolute -rotate-90">
                <circle cx="76" cy="76" r="72" fill="none" stroke="#EEF1F5" strokeWidth="8" />
                <circle cx="76" cy="76" r="72" fill="none" stroke="#FF9F43" strokeWidth="8" strokeLinecap="round" strokeDasharray="452" strokeDashoffset={ringDash} />
              </svg>
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-[#D9A441] to-[#F7B731] text-[46px] font-black text-white shadow-[0_6px_16px_rgba(217,164,65,0.35)]">
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="absolute -bottom-1 rounded-xl border-[3px] border-white bg-[#FF9F43] px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-white">
                Level {level}
              </span>
            </div>

            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void saveName()}
                  autoFocus
                  className="w-44 rounded-xl border-2 border-[#D6DEFF] bg-white px-3 py-1.5 text-center text-xl font-black text-[#1F2328] outline-none focus:border-[#4361EE]"
                />
                <button type="button" onClick={() => void saveName()} disabled={saving} className="duo-btn duo-btn-green px-4 py-2 text-xs">
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(user?.name ?? '');
                  setEditingName(true);
                }}
                className="group flex items-center gap-2 text-[26px] font-black tracking-[-0.03em] text-[#1F2328]"
              >
                {user?.name ?? 'Learner'}
                <Pencil size={15} className="text-[#C3CBD4] transition-colors group-hover:text-[#4361EE]" />
              </button>
            )}
            <p className="mb-5 mt-1.5 text-xs font-extrabold text-[#A8B2BE]">
              Level {user?.level ?? 'A1'} · {toNext} XP to Level {level + 1}
            </p>

            <div className="grid w-full grid-cols-2 gap-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-[22px] border-2 border-b-4 px-3 py-4" style={{ background: s.bg, borderColor: s.bd }}>
                    <Icon size={20} style={{ color: s.color }} />
                    <span className="text-[22px] font-black tracking-[-0.02em] text-[#1F2328] tabular-nums">{s.value}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.11em] text-[#8A94A2]">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="duo-card p-7">
            <h3 className="mb-5 text-[13px] font-black uppercase tracking-[0.15em] text-[#1F2328]">Settings</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Learning', value: 'German 🇩🇪' },
                { label: 'Level', value: user?.level ?? 'A1' },
                { label: 'Email', value: user?.email ?? '—' },
              ].map((p) => (
                <div key={p.label} className="flex items-center justify-between rounded-[18px] border-2 border-[#EEF1F5] bg-[#F8FAFB] px-4 py-3.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.11em] text-[#A8B2BE]">{p.label}</span>
                  <span className="max-w-[60%] truncate text-sm font-black text-[#1F2328]">{p.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right column ────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#1B2A4A] p-8 text-white">
            <div className="pointer-events-none absolute -right-16 -top-24 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(247,183,49,0.32),transparent_68%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9FB0CD]">Progress to next level</p>
                <h3 className="mt-2 text-[32px] font-black tracking-[-0.03em]">Level {level} → {level + 1}</h3>
              </div>
              <div className="text-right">
                <p className="text-[34px] font-black tracking-[-0.03em] text-[#F7B731] tabular-nums">{toNext}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9FB0CD]">XP remaining</p>
              </div>
            </div>
            <div className="relative mt-5 h-4 overflow-hidden rounded-full bg-[#131F3A]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#20BF6B] to-[#F7B731] transition-[width] duration-700"
                style={{ width: `${(intoLevel / LEVEL_XP) * 100}%` }}
              />
            </div>
          </section>

          <section className="duo-card p-7">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[13px] font-black uppercase tracking-[0.15em] text-[#1F2328]">Achievements</h3>
              <span className="text-xs font-black text-[#4361EE]">
                {achievements.filter((a) => a.now >= a.max).length} / {achievements.length}
              </span>
            </div>
            <div className="flex flex-col gap-3.5">
              {achievements.map((a) => {
                const pct = Math.min(100, Math.round((a.now / a.max) * 100));
                const Icon = a.icon;
                return (
                  <div key={a.name} className="flex items-center gap-4 rounded-[24px] border-2 border-b-4 p-4" style={{ background: a.bg, borderColor: a.bd, opacity: pct > 0 ? 1 : 0.6 }}>
                    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: a.bd, color: a.color }}>
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-[#1F2328]">{a.name}</p>
                      <p className="mb-2 mt-0.5 text-xs font-bold text-[#8A94A2]">{a.desc}</p>
                      <div className="h-2 overflow-hidden rounded-full bg-white/75">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                    </div>
                    <span className="flex-none text-sm font-black tabular-nums" style={{ color: a.color }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
