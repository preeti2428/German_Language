'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Flame, Landmark, Pencil, Trophy, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { readStreak } from '@/lib/streak';
import Link from 'next/link';

/**
 * Profile, rebuilt to the design canvas: XP-ring avatar, real stat tiles,
 * the dark level-progress card, achievements with live progress bars, and
 * inline name editing (saved via the existing PUT /users/profile route).
 */

import { calculateLevelInfo } from '@/lib/level';

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
  const [accountType, setAccountType] = useState<'individual' | 'college' | 'university'>('individual');
  const [institutionName, setInstitutionName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    refreshUser();
    api.get('/users/profile').then((r) => {
      if (r.data) {
        setAccountType(r.data.accountType || 'individual');
        setInstitutionName(r.data.institutionName || '');
        if (r.data.streak) {
          setStreak({
            current: r.data.streak.current ?? 0,
            longest: r.data.streak.longest ?? 0,
          });
        }
      }
    }).catch(() => {
      const s = readStreak();
      setStreak({ current: s.current, longest: s.longest });
    });

    api.get('/progress').then((r) => setProgress(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xp = user?.xp ?? 0;
  const levelInfo = useMemo(() => calculateLevelInfo(xp, user?.level), [xp, user?.level]);
  const ringDash = 452 - (452 * levelInfo.progressPercent) / 100;

  const currentStreak = user?.streak?.current ?? streak.current ?? 0;
  const longestStreak = user?.streak?.longest ?? streak.longest ?? currentStreak;

  const sessionsDone = useMemo(
    () => progress?.stageProgress?.reduce((a, s) => a + (s.completedSessions?.length || 0), 0) ?? 0,
    [progress]
  );
  const stagesDone = progress?.completedStages?.length ?? 0;

  const stats = [
    { label: 'Day streak', value: currentStreak, icon: Flame, color: '#FF9F43', bg: '#FFF4E6', bd: '#FFE2C4' },
    { label: 'Total XP', value: xp, icon: Zap, color: '#4361EE', bg: '#EEF2FF', bd: '#D6DEFF' },
    { label: 'Sessions', value: sessionsDone, icon: BookOpen, color: '#20BF6B', bg: '#E8FBF0', bd: '#CBEFDC' },
    { label: 'Cities done', value: stagesDone, icon: Landmark, color: '#CE82FF', bg: '#F7EDFF', bd: '#EBD6FA' },
  ];

  const achievements = [
    { name: 'First Steps', desc: 'Finish 5 sessions', now: sessionsDone, max: 5, color: '#20BF6B', bg: '#E8FBF0', bd: '#CBEFDC', icon: Check },
    { name: 'On Fire', desc: 'Reach a 7-day streak', now: longestStreak, max: 7, color: '#FF9F43', bg: '#FFF4E6', bd: '#FFE2C4', icon: Flame },
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

  async function saveProfileSettings() {
    setSaving(true);
    try {
      await api.put('/users/profile', { accountType, institutionName: accountType !== 'individual' ? institutionName : undefined });
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  }

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const PRESET_AVATARS = [
    { label: 'Smart Owl', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SchlaueEule' },
    { label: 'Berlin Bear', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BerlinerBaer' },
    { label: 'Clever Fox', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Fuchs' },
    { label: 'Bavarian Lion', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bavaria' },
    { label: 'Scholar Hans', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hans' },
    { label: 'Learner Greta', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Greta' },
    { label: 'Lukas', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lukas' },
    { label: 'Mia', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia' },
    { label: 'Happy Emoji', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Deutsch' },
    { label: 'Wunderbar', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wunderbar' },
    { label: 'Cool Shades', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool' },
    { label: 'Rocket', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rakete' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size should be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveAvatar = async (avatarUrl?: string | null) => {
    const finalAvatar = avatarUrl !== undefined ? avatarUrl : avatarPreview;
    setSaving(true);
    try {
      await api.put('/users/profile', { avatar: finalAvatar || '' });
      await refreshUser();
      setShowAvatarModal(false);
      setAvatarPreview(null);
    } catch {
      alert('Failed to update avatar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell crumb="Your Journey" title="Profile">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <section className="flex flex-col items-center rounded-[2rem] border-2 border-b-[5px] border-t-8 border-[#e5e5e5] border-t-[#4361EE] bg-white p-8 text-center">
            {/* Avatar Ring & Photo Button */}
            <div className="relative mb-4 flex h-[152px] w-[152px] items-center justify-center">
              <svg width="152" height="152" viewBox="0 0 152 152" className="absolute -rotate-90">
                <circle cx="76" cy="76" r="72" fill="none" stroke="#EEF1F5" strokeWidth="8" />
                <circle cx="76" cy="76" r="72" fill="none" stroke="#FF9F43" strokeWidth="8" strokeLinecap="round" strokeDasharray="452" strokeDashoffset={ringDash} />
              </svg>
              
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="group relative flex h-[120px] w-[120px] items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-[#D9A441] to-[#F7B731] text-[46px] font-black text-white shadow-[0_6px_16px_rgba(217,164,65,0.35)] overflow-hidden transition-transform hover:scale-105"
                title="Change Photo or Avatar"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-full w-full object-cover object-top" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() ?? '?'
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-black">
                  <span>📷</span>
                  <span className="text-[9px] uppercase tracking-wider">Change</span>
                </div>
              </button>

              <span className="absolute -bottom-1 rounded-xl border-[3px] border-white bg-[#FF9F43] px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-white">
                Level {levelInfo.level}
              </span>
            </div>

            {/* Change Avatar Button */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="text-[11px] font-bold text-[#4361EE] hover:underline mb-2 -mt-2 flex items-center gap-1"
            >
              📷 Change Profile Picture / Avatar
            </button>

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
              Level {levelInfo.level} · {levelInfo.tierLabel} · {levelInfo.toNext} XP to Level {levelInfo.level + 1}
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

              {/* Account Type */}
              <div className="rounded-[18px] border-2 border-[#EEF1F5] bg-[#F8FAFB] px-4 py-4">
                <span className="text-[10px] font-black uppercase tracking-[0.11em] text-[#A8B2BE] block mb-2">Account Type</span>
                <div className="flex gap-2">
                  {(['individual', 'college', 'university'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAccountType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 capitalize transition-all ${
                        accountType === t
                          ? 'bg-[#E53935] border-[#C62828] text-white'
                          : 'bg-white border-[#EAEAEA] text-[#9E9E9E] hover:border-[#E53935]'
                      }`}
                    >
                      {t === 'individual' ? '🧑 Individual' : t === 'college' ? '🎓 College' : '🏛️ University'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Institution Name (if college/university) */}
              {accountType !== 'individual' && (
                <div className="rounded-[18px] border-2 border-[#EEF1F5] bg-[#F8FAFB] px-4 py-3.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.11em] text-[#A8B2BE] block mb-1.5">Institution Name</span>
                  <input
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder={`Enter your ${accountType} name`}
                    className="w-full text-sm font-bold text-[#1F2328] bg-transparent outline-none placeholder:text-[#BDBDBD]"
                  />
                </div>
              )}

              {profileSaved && (
                <div className="flex items-center gap-2 text-[#43A047] bg-[#E8F5E9] border border-[#A5D6A7] px-4 py-2.5 rounded-2xl text-xs font-bold">
                  <Check size={13} /> Settings saved!
                </div>
              )}

              <button
                onClick={saveProfileSettings}
                disabled={saving}
                className="duo-btn duo-btn-red py-2.5 text-xs w-full mt-1"
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>

              <Link href="/settings" className="w-full mt-2 block">
                <button className="duo-btn duo-btn-blue py-2.5 text-xs w-full flex items-center justify-center gap-2">
                  <span>⚙️</span> Full Account Settings
                </button>
              </Link>
            </div>
          </section>
        </div>

        {/* ── Right column ────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#1B2A4A] p-8 text-white">
            <div className="pointer-events-none absolute -right-16 -top-24 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(247,183,49,0.32),transparent_68%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9FB0CD]">German CEFR Level Progress</p>
                <h3 className="mt-2 text-[26px] md:text-[30px] font-black tracking-[-0.03em]">
                  {levelInfo.tierLabel} → {user?.level === 'A1' ? 'A2 Elementary' : user?.level === 'A2' ? 'B1 Intermediate' : 'Next Tier'}
                </h3>
                <p className="text-xs text-[#9FB0CD] font-bold mt-1">
                  Total Earned: <span className="text-white font-black">{xp.toLocaleString()} XP</span> · Level {levelInfo.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[34px] font-black tracking-[-0.03em] text-[#F7B731] tabular-nums">{levelInfo.toNext}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9FB0CD]">XP to Next Tier</p>
              </div>
            </div>
            <div className="relative mt-5 h-4 overflow-hidden rounded-full bg-[#131F3A]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#20BF6B] to-[#F7B731] transition-[width] duration-700"
                style={{ width: `${levelInfo.progressPercent}%` }}
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

      {/* --- AVATAR & PHOTO UPLOAD MODAL --- */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#1A1A2E] max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-[#1A1A2E] text-lg">Choose Photo or Avatar</h3>
                <p className="text-xs text-[#9E9E9E] font-medium">Upload your own photo or pick a German learning mascot</p>
              </div>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarPreview(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Custom Photo Upload Box */}
            <div className="bg-[#F5F6FA] border-2 border-dashed border-[#D6DEFF] rounded-2xl p-4 text-center">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#D6DEFF] flex items-center justify-center text-2xl shadow-sm">
                    📸
                  </div>
                  <p className="text-xs font-black text-[#4361EE]">Click to Upload Photo from Device</p>
                  <p className="text-[10px] text-[#9E9E9E] font-medium">PNG, JPG, WEBP up to 2MB</p>
                </div>
              </label>

              {avatarPreview && (
                <div className="mt-3 pt-3 border-t flex items-center justify-center gap-3">
                  <img src={avatarPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-[#4361EE] shadow" />
                  <button
                    onClick={() => saveAvatar(avatarPreview)}
                    disabled={saving}
                    className="duo-btn duo-btn-green px-4 py-2 text-xs font-black"
                  >
                    {saving ? 'Saving...' : 'Use This Photo'}
                  </button>
                </div>
              )}
            </div>

            {/* Mascot & Character Avatars */}
            <div>
              <p className="text-xs font-black text-[#1A1A2E] mb-2.5 uppercase tracking-wider">Or Pick a German Mascot</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-56 overflow-y-auto p-1">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.label}
                    onClick={() => saveAvatar(av.url)}
                    disabled={saving}
                    className="group flex flex-col items-center gap-1 p-2 rounded-2xl border-2 border-[#EAEAEA] hover:border-[#4361EE] hover:bg-[#EEF2FF] transition-all"
                  >
                    <img src={av.url} alt={av.label} className="w-11 h-11 rounded-full object-cover group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black text-[#555] truncate w-full text-center">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Remove / Reset to Initial */}
            {user?.avatar && (
              <div className="border-t pt-3 flex justify-between items-center">
                <button
                  onClick={() => saveAvatar('')}
                  disabled={saving}
                  className="text-xs font-bold text-[#E53935] hover:underline"
                >
                  Remove Custom Avatar (Use Initial)
                </button>
                <button
                  onClick={() => {
                    setShowAvatarModal(false);
                    setAvatarPreview(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#757575] hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
