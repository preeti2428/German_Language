'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, ExternalLink, PlayCircle, Plus, Trash2, Video, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import PageShell from '@/components/layout/PageShell';

/**
 * Live classes, for real: classes come from the database, admins/teachers
 * schedule them from the "Schedule Class" modal (a Jitsi meeting room is
 * generated automatically unless a Zoom/Meet link is pasted), students
 * enroll, and Join lights up 10 minutes before start.
 */

const COLORS = [
  { color: '#20BF6B', bg: '#E8FBF0', shadow: '#178B4E' },
  { color: '#FF9F43', bg: '#FFF4E6', shadow: '#D97F27' },
  { color: '#4361EE', bg: '#EEF2FF', shadow: '#3046B2' },
  { color: '#CE82FF', bg: '#F7EDFF', shadow: '#A85FD6' },
];

const VOD_LIBRARY = [
  { id: 101, title: 'Der, Die, Das — The Ultimate Guide', level: 'A1', duration: '15 min', views: '12k views', color: '#4361EE', tint: '#EEF2FF' },
  { id: 102, title: 'Introduce Yourself in 5 Minutes', level: 'A1', duration: '8 min', views: '9.4k views', color: '#20BF6B', tint: '#E8FBF0' },
  { id: 103, title: 'Numbers, Money & Shopping', level: 'A1', duration: '18 min', views: '6.1k views', color: '#FF9F43', tint: '#FFF4E6' },
  { id: 104, title: 'Pronunciation: ü, ö and ß', level: 'A1–A2', duration: '12 min', views: '15k views', color: '#CE82FF', tint: '#F7EDFF' },
];

interface LiveClass {
  id: string;
  title: string;
  description?: string;
  level: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  enrolled: number;
  isEnrolled: boolean;
  teacher: string;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((d.setHours(0, 0, 0, 0), new Date(iso).getTime() - now.getTime()) / 86400000);
  const time = new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = new Date(iso).toDateString() === now.toDateString();
  const tomorrow = new Date(now.getTime() + 86400000).toDateString() === new Date(iso).toDateString();
  if (sameDay) return `Today · ${time}`;
  if (tomorrow) return `Tomorrow · ${time}`;
  if (days < 7) return `${new Date(iso).toLocaleDateString([], { weekday: 'long' })} · ${time}`;
  return `${new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${time}`;
}

/** Join opens 10 minutes early and stays open through the class. */
function joinState(c: LiveClass): 'early' | 'open' | 'over' {
  const start = new Date(c.scheduledAt).getTime();
  const now = Date.now();
  if (now < start - 10 * 60 * 1000) return 'early';
  if (now > start + c.duration * 60 * 1000) return 'over';
  return 'open';
}

export default function ClassesPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'teacher';
  const [tab, setTab] = useState<'live' | 'vod'>('live');
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', level: 'A1', date: '', time: '', duration: '45', meetingUrl: '' });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.live ?? []);
    } catch {
      /* not logged in or backend down — empty state shows */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleEnroll(c: LiveClass) {
    try {
      const res = await api.post(`/classes/${c.id}/enroll`);
      setClasses((list) =>
        list.map((x) => (x.id === c.id ? { ...x, isEnrolled: res.data.enrolled, enrolled: res.data.count } : x))
      );
    } catch {
      /* enroll needs login; AuthGuard already ensures it */
    }
  }

  async function remove(c: LiveClass) {
    try {
      await api.delete(`/classes/${c.id}`);
      setClasses((list) => list.filter((x) => x.id !== c.id));
    } catch {
      /* staff only */
    }
  }

  async function schedule() {
    setFormError(null);
    if (!form.title.trim() || !form.date || !form.time) {
      setFormError('Title, date and time are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/classes', {
        title: form.title.trim(),
        level: form.level,
        scheduledAt: new Date(`${form.date}T${form.time}`).toISOString(),
        duration: Number(form.duration) || 45,
        meetingUrl: form.meetingUrl.trim() || undefined,
      });
      setShowForm(false);
      setForm({ title: '', level: 'A1', date: '', time: '', duration: '45', meetingUrl: '' });
      await load();
    } catch (e: unknown) {
      setFormError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not schedule the class.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell crumb="Learn Together" title="Classes 🎓">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <p className="max-w-[460px] text-base font-semibold text-[#8A94A2]">
          Live sessions with Jai, or watch the recordings any time.
        </p>
        <div className="flex items-center gap-3">
          {isStaff && (
            <button type="button" onClick={() => setShowForm(true)} className="duo-btn duo-btn-blue px-5 py-3 text-xs">
              <Plus size={15} className="mr-1.5" /> Schedule Class
            </button>
          )}
          <div className="flex gap-1.5 rounded-[22px] border-2 border-[#D2DAE1] bg-[#DFE5EA] p-1.5">
            {(
              [
                { key: 'live', label: 'Live Classes', icon: Calendar },
                { key: 'vod', label: 'Library', icon: PlayCircle },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-black transition-all ${
                    active ? 'bg-white text-[#1F2328] shadow-[0_3px_0_#C4CDD5]' : 'text-[#7A8694]'
                  }`}
                >
                  <Icon size={17} strokeWidth={2.6} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === 'live' ? (
        loading ? (
          <div className="flex justify-center py-24">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#4361EE] border-t-transparent" />
          </div>
        ) : !classes.length ? (
          <div className="duo-card flex flex-col items-center gap-3 p-14 text-center">
            <span className="text-5xl">📅</span>
            <p className="text-lg font-black text-[#1F2328]">No classes scheduled yet</p>
            <p className="max-w-sm text-sm font-semibold text-[#8A94A2]">
              {isStaff ? 'Use "Schedule Class" to put the first one on the calendar.' : 'Check back soon — Jai will announce the next live session here.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c, i) => {
              const tone = COLORS[i % COLORS.length];
              const state = joinState(c);
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-4 rounded-[30px] border-2 border-b-[5px] border-[#e5e5e5] bg-white p-6 transition-transform hover:-translate-y-1"
                  style={{ borderTop: `8px solid ${tone.color}` }}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="rounded-[10px] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white" style={{ background: tone.color }}>
                      {c.level}
                    </span>
                    <div className="flex items-center gap-2">
                      {state === 'open' && (
                        <span className="flex items-center gap-1.5 rounded-[10px] border-2 border-[#FFD3D8] bg-[#FFF0F0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#FF4757]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF4757]" /> Live now
                        </span>
                      )}
                      {c.isEnrolled && state !== 'open' && (
                        <span className="flex items-center gap-1.5 rounded-[10px] border-2 border-[#CBEFDC] bg-[#E8FBF0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#20BF6B]">
                          <CheckCircle2 size={12} /> Enrolled
                        </span>
                      )}
                      {isStaff && (
                        <button type="button" onClick={() => void remove(c)} aria-label="Delete class" className="text-[#C3CBD4] transition-colors hover:text-[#FF4757]">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-[21px] font-black leading-[1.25] tracking-[-0.02em] text-[#1F2328]">{c.title}</h3>
                  {c.description && <p className="-mt-1 text-[13px] font-semibold text-[#8A94A2]">{c.description}</p>}

                  <div className="mt-auto flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 text-[13px] font-extrabold text-[#6B7684]">
                      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px]" style={{ background: tone.bg, color: tone.color }}>
                        <Calendar size={16} strokeWidth={2.4} />
                      </span>
                      {formatWhen(c.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] font-extrabold text-[#6B7684]">
                      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-[#F4F6F8] text-[#8A94A2]">
                        <Clock size={16} strokeWidth={2.4} />
                      </span>
                      {c.duration} min · {c.enrolled} enrolled · {c.teacher}
                    </div>
                  </div>

                  {state === 'open' && (c.isEnrolled || isStaff) ? (
                    <a
                      href={c.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF4757] py-3.5 text-center text-xs font-black uppercase tracking-[0.08em] text-white shadow-[0_4px_0_#CC3946] transition-transform active:translate-y-1 active:shadow-none"
                    >
                      <ExternalLink size={15} /> Join Class
                    </a>
                  ) : state === 'over' ? (
                    <div className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] py-3.5 text-center text-xs font-black uppercase tracking-[0.08em] text-[#A8B2BE]">
                      Class ended
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void toggleEnroll(c)}
                      className={`rounded-2xl py-3.5 text-center text-xs font-black uppercase tracking-[0.08em] transition-transform active:translate-y-1 active:shadow-none ${
                        c.isEnrolled ? 'border-2 border-[#E4E9EF] bg-white text-[#8A94A2] shadow-[0_4px_0_#E2E7EC]' : 'text-white'
                      }`}
                      style={c.isEnrolled ? undefined : { background: tone.color, boxShadow: `0 4px 0 ${tone.shadow}` }}
                    >
                      {c.isEnrolled ? 'Cancel my seat' : 'Reserve a seat'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VOD_LIBRARY.map((v) => (
            <div key={v.id} className="cursor-pointer overflow-hidden rounded-[30px] border-2 border-b-[5px] border-[#e5e5e5] bg-white transition-transform hover:-translate-y-1">
              <div className="relative flex h-[180px] items-center justify-center overflow-hidden border-b-4 border-[#EEF1F5]" style={{ background: v.tint }}>
                <svg className="absolute inset-0 h-full w-full opacity-35">
                  <defs>
                    <pattern id={`stripes-${v.id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                      <rect width="7" height="14" fill={v.color} opacity="0.22" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#stripes-${v.id})`} />
                </svg>
                <div className="relative flex h-[62px] w-[62px] items-center justify-center rounded-[20px]" style={{ background: v.color, boxShadow: '0 6px 0 rgba(0,0,0,0.18)' }}>
                  <Video size={26} className="fill-white text-white" />
                </div>
                <span className="absolute bottom-3 right-3 rounded-[10px] border-2 border-[#E4E9EF] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#1F2328]">
                  {v.duration}
                </span>
              </div>
              <div className="p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: v.color }}>{v.level}</p>
                <h3 className="mb-4 text-[19px] font-black leading-[1.3] tracking-[-0.02em] text-[#1F2328]">{v.title}</h3>
                <div className="flex items-center justify-between rounded-[14px] bg-[#F6F8FA] px-3.5 py-2.5 text-xs font-extrabold text-[#8A94A2]">
                  <span>{v.views}</span>
                  <span>Teacher Jai</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Schedule Class modal (staff only) ─────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A4A]/50 p-4 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[28px] border-2 border-b-[6px] border-[#e5e5e5] bg-white p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-[-0.02em] text-[#1F2328]">Schedule a class</h3>
                <button type="button" onClick={() => setShowForm(false)} aria-label="Close" className="text-[#C3CBD4] hover:text-[#1F2328]">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Class title, e.g. Mastering the Dative Case"
                  className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] px-4 py-3 text-[15px] font-bold text-[#1F2328] outline-none focus:border-[#4361EE]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] px-4 py-3 text-[15px] font-bold text-[#1F2328] outline-none focus:border-[#4361EE]"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'All levels'].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] px-4 py-3 text-[15px] font-bold text-[#1F2328] outline-none focus:border-[#4361EE]"
                  >
                    {['30', '45', '60', '90'].map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] px-4 py-3 text-[15px] font-bold text-[#1F2328] outline-none focus:border-[#4361EE]"
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] px-4 py-3 text-[15px] font-bold text-[#1F2328] outline-none focus:border-[#4361EE]"
                  />
                </div>
                <input
                  value={form.meetingUrl}
                  onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                  placeholder="Zoom/Meet link (optional — leave empty to auto-create)"
                  className="rounded-2xl border-2 border-[#E4E9EF] bg-[#F8FAFB] px-4 py-3 text-[14px] font-bold text-[#1F2328] outline-none focus:border-[#4361EE]"
                />
                <p className="-mt-1 text-[11px] font-bold text-[#A8B2BE]">
                  Empty link = a free Jitsi Meet room is created automatically. Paste a Zoom or Google Meet link to use that instead.
                </p>

                {formError && (
                  <p className="rounded-xl border-2 border-[#FFD3D8] bg-[#FFF0F0] px-3 py-2 text-[13px] font-bold text-[#CC3946]">{formError}</p>
                )}

                <button type="button" onClick={() => void schedule()} disabled={saving} className="duo-btn duo-btn-green mt-1 w-full py-4 text-sm">
                  {saving ? 'Scheduling…' : 'Schedule & create meeting link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
