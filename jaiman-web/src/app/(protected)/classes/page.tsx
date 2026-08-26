'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, BookOpen, Clock, ExternalLink, PlayCircle, Plus,
  Trash2, Video, X, CheckCircle, GraduationCap, ArrowRight,
  Sparkles, Lock, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Batch {
  _id: string;
  title: string;
  description?: string;
  level: string;
  price: number;
  thumbnail?: string;
  teacher?: { name: string; avatar?: string };
  modules?: { title: string; order: number }[];
  startDate?: string;
  createdAt: string;
}

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

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string }> = {
  A1: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7', darkBg: '#43A047' },
  A2: { bg: '#E0F2F1', text: '#00695C', border: '#80CBC4', darkBg: '#00897B' },
  B1: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', darkBg: '#1565C0' },
  B2: { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8', darkBg: '#6A1B9A' },
  C1: { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A', darkBg: '#E53935' },
  C2: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', darkBg: '#E65100' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();

  if (sameDay) return `Today · ${time}`;
  if (tomorrow) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${time}`;
}

export default function MyBatchesAndClassesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [myBatches, setMyBatches] = useState<Batch[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling modal state for staff
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    level: 'A1',
    date: '',
    time: '',
    duration: '45',
    meetingUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch user's purchased / enrolled batches
      const batchRes = await api.get('/batches/my');
      setMyBatches(batchRes.data ?? []);

      // 2. Fetch live classes
      const classRes = await api.get('/classes');
      setClasses(classRes.data?.live ?? []);
    } catch (err) {
      console.error('Failed to load batches or classes', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Schedule new class (Admin/Teacher only)
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.date || !form.time) {
      setFormError('Title, date, and time are required.');
      return;
    }
    setSaving(true);
    try {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      const randStr = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      const autoMeet = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;

      await api.post('/classes', {
        title: form.title.trim(),
        level: form.level,
        scheduledAt: new Date(`${form.date}T${form.time}`).toISOString(),
        duration: Number(form.duration) || 45,
        meetingUrl: form.meetingUrl.trim() || autoMeet,
      });

      setShowScheduleModal(false);
      setForm({ title: '', level: 'A1', date: '', time: '', duration: '45', meetingUrl: '' });
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Could not schedule live class.');
    } finally {
      setSaving(false);
    }
  };

  const deleteLiveClass = async (id: string) => {
    if (!confirm('Are you sure you want to remove this live class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  // Filter live classes to show only those belonging to user's enrolled batch levels (staff sees all)
  const enrolledLevels = new Set(myBatches.map((b) => b.level));
  const relevantClasses = isAdmin
    ? classes
    : classes.filter((c) => enrolledLevels.has(c.level));

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* ══ HEADER ══════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-[#E53935] uppercase tracking-[0.2em]">MY DASHBOARD</p>
            <h1 className="text-[28px] font-black text-[#1A1A2E] leading-tight flex items-center gap-2.5 mt-1">
              <GraduationCap className="text-[#E53935]" size={32} />
              My Purchased Batches & Live Classes
            </h1>
            <p className="text-[#9E9E9E] text-sm font-medium mt-1">
              Access your enrolled batch curriculum, lecture recordings, and upcoming live interactive sessions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isAdmin && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="duo-btn duo-btn-red px-4 py-2.5 text-xs flex items-center gap-2"
              >
                <Plus size={15} /> Schedule Live Class
              </button>
            )}
            <Link
              href="/courses"
              className="px-4 py-2.5 rounded-2xl border-2 border-[#EAEAEA] bg-white hover:border-[#1A1A2E] text-xs font-black text-[#1A1A2E] transition-all flex items-center gap-1.5"
            >
              Browse All Batches
            </Link>
          </div>
        </div>

        {/* ══ SECTION 1: PURCHASED BATCHES ════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
              <BookOpen size={20} className="text-[#E53935]" />
              My Enrolled Batches ({myBatches.length})
            </h2>
            <span className="text-xs font-bold text-[#9E9E9E]">
              {myBatches.length > 0 ? 'Full Access Active' : 'No Active Enrollment'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-white rounded-3xl border border-gray-200" />
              ))}
            </div>
          ) : myBatches.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFCDD2] flex items-center justify-center text-3xl mx-auto mb-3">
                🎓
              </div>
              <h3 className="text-base font-black text-[#1A1A2E]">You haven't enrolled in any batch yet</h3>
              <p className="text-xs text-[#757575] font-medium max-w-md mx-auto mt-1 mb-5">
                Join our structured German batches (A1 starting 2 weeks free trial, A2, B1) to get full curriculum access, DPP notes, and live batch classes.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 duo-btn duo-btn-red px-6 py-3 text-xs font-black"
              >
                Explore Batches & Free Trial <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myBatches.map((batch) => {
                const theme = LEVEL_COLORS[batch.level] || LEVEL_COLORS.A1;
                return (
                  <div
                    key={batch._id}
                    className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[5px] border-b-[#D8D8D8] p-5 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border"
                          style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                        >
                          {batch.level} BATCH
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[10px] font-black px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Enrolled
                        </span>
                      </div>

                      <h3 className="font-black text-[#1A1A2E] text-base leading-tight mb-1.5">
                        {batch.title}
                      </h3>
                      <p className="text-xs text-[#757575] font-medium line-clamp-2 mb-4">
                        {batch.description || 'Comprehensive German language training curriculum.'}
                      </p>

                      <div className="flex items-center gap-3 text-xs font-bold text-[#9E9E9E] mb-4">
                        <span>📚 {batch.modules?.length ?? 0} Modules</span>
                        <span>•</span>
                        <span>Instructor: {batch.teacher?.name || 'Jai'}</span>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${batch._id}`}
                      className="w-full duo-btn duo-btn-red py-2.5 text-xs font-black flex items-center justify-center gap-1.5 mt-2"
                    >
                      <PlayCircle size={15} /> Enter Batch Curriculum
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ SECTION 2: UPCOMING LIVE CLASSES FOR ENROLLED BATCHES ═══ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[#1A1A2E] flex items-center gap-2">
              <Video size={20} className="text-[#E53935]" />
              Upcoming Live Classes for My Batches ({relevantClasses.length})
            </h2>
            <span className="text-xs font-bold text-[#9E9E9E]">Live Interactive Sessions</span>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200" />
              ))}
            </div>
          ) : relevantClasses.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-8 text-center text-[#BDBDBD]">
              <Calendar size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-black text-[#1A1A2E]">No upcoming live classes scheduled right now</p>
              <p className="text-xs font-medium mt-1">
                When instructor Jai schedules a live class for your batch level, it will appear here with a Google Meet link.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {relevantClasses.map((cls) => {
                const theme = LEVEL_COLORS[cls.level] || LEVEL_COLORS.A1;
                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                        style={{ background: theme.darkBg }}
                      >
                        {cls.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-[#1A1A2E] text-sm md:text-base">{cls.title}</h3>
                          <span className="bg-[#FFF5F5] text-[#E53935] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FFCDD2]">
                            LIVE
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs font-bold text-[#757575]">
                          <span className="flex items-center gap-1 text-[#E53935]">
                            <Clock size={13} /> {formatWhen(cls.scheduledAt)} ({cls.duration} min)
                          </span>
                          <span>•</span>
                          <span>Teacher: {cls.teacher}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {cls.meetingUrl ? (
                        <a
                          href={cls.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="duo-btn duo-btn-red px-4 py-2 text-xs font-black flex items-center gap-1.5"
                        >
                          <Video size={14} /> Join Google Meet
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-[#9E9E9E] px-3 py-2 bg-gray-100 rounded-xl">
                          Link opens before class
                        </span>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => deleteLiveClass(cls.id)}
                          className="p-2 rounded-xl text-[#9E9E9E] hover:text-[#E53935] hover:bg-[#FFF5F5] transition-all"
                          title="Delete class"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ══ SCHEDULE LIVE CLASS MODAL (Admin/Teacher) ═══════════════ */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#1A1A2E] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-[#1A1A2E] text-lg flex items-center gap-2">
                <Video className="text-[#E53935]" size={20} />
                Schedule Batch Live Class
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-[#555] block mb-1">Class Title:</label>
                <input
                  type="text"
                  placeholder="e.g. A1 Live Speaking Drill & Doubt Session"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#555] block mb-1">Batch Level:</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl} Batch</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#555] block mb-1">Duration (mins):</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#555] block mb-1">Date:</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#555] block mb-1">Time:</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#555] block mb-1">Google Meet Link (Optional, auto-generated if empty):</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={form.meetingUrl}
                  onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-semibold focus:outline-none focus:border-[#E53935]"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-[#FFE4E6] text-[#FF4757] border border-[#FCA5A5] text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full duo-btn duo-btn-red py-3 text-xs font-black mt-2"
              >
                {saving ? 'Scheduling Class...' : 'Publish Live Class'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
