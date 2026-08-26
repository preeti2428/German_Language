'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Plus, Trash2, Pin, PinOff, Check, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const TYPE_OPTIONS = ['announcement', 'tip', 'challenge', 'event'] as const;
const EMOJI_OPTIONS = ['📢', '💡', '🎯', '🎉', '📌', '🏆', '⚡', '🇩🇪', '📚', '🗣️'];

type UpdateType = typeof TYPE_OPTIONS[number];

interface DailyUpdate {
  _id: string;
  title: string;
  body: string;
  emoji: string;
  type: UpdateType;
  pinned: boolean;
  publishedAt: string;
  author?: { name: string };
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  announcement: { bg: '#FFF5F5', text: '#E53935', border: '#FFCDD2' },
  tip: { bg: '#FFF8E1', text: '#E6A800', border: '#FFE082' },
  challenge: { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
  event: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
};

export default function AdminUpdatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', emoji: '📢', type: 'announcement' as UpdateType, pinned: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/dashboard'); return; }
    fetchUpdates();
  }, [user]);

  const fetchUpdates = () => {
    api.get('/updates?limit=50').then((r) => setUpdates(r.data)).catch(() => {});
  };

  const save = async () => {
    if (!form.title || !form.body) return;
    setSaving(true);
    try {
      await api.post('/updates', form);
      setSaved(true);
      setShowForm(false);
      setForm({ title: '', body: '', emoji: '📢', type: 'announcement', pinned: false });
      fetchUpdates();
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this update?')) return;
    await api.delete(`/updates/${id}`);
    fetchUpdates();
  };

  const togglePin = async (u: DailyUpdate) => {
    await api.patch(`/updates/${u._id}`, { pinned: !u.pinned });
    fetchUpdates();
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      {/* Navigation & Back Bar */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#E53935] bg-[#FFF5F5] border-2 border-[#FFCDD2] px-3.5 py-2 rounded-xl hover:bg-[#FFEAEA] transition-all"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="dj-crumb">ADMIN · CONTENT</p>
          <h1 className="dj-title flex items-center gap-2">
            <Megaphone className="text-[#E53935]" size={26} />
            Daily Updates
          </h1>
          <p className="text-sm text-[#9E9E9E] mt-1">Create announcements, tips, and challenges for all learners.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="duo-btn duo-btn-red px-5 py-3 text-xs flex items-center gap-2"
        >
          <Plus size={15} /> New Update
        </button>
      </header>

      {saved && (
        <div className="mb-4 flex items-center gap-2 bg-[#E8F5E9] border border-[#A5D6A7] text-[#43A047] text-xs font-bold px-4 py-3 rounded-2xl">
          <Check size={14} /> Update published to all learners!
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="duo-card p-5 mb-5 animate-slide-up">
          <h2 className="font-black text-[#1A1A2E] text-sm mb-4">✍️ New Update</h2>

          {/* Emoji picker */}
          <div className="mb-3">
            <p className="text-xs font-black text-[#1A1A2E] mb-2">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-lg border-2 transition-all ${form.emoji === e ? 'border-[#E53935] bg-[#FFF5F5]' : 'border-[#EAEAEA] bg-white hover:border-[#E53935]'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="mb-3">
            <p className="text-xs font-black text-[#1A1A2E] mb-2">Type</p>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((t) => {
                const c = TYPE_COLORS[t]!;
                return (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 capitalize transition-all`}
                    style={form.type === t ? { background: c.bg, color: c.text, borderColor: c.border } : { background: 'white', color: '#9E9E9E', borderColor: '#EAEAEA' }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <input
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (e.g. New Module Released!)"
            className="w-full text-sm border border-[#EAEAEA] rounded-xl px-3 py-2.5 font-bold text-[#1A1A2E] outline-none focus:border-[#E53935] mb-3"
          />
          <textarea
            rows={3}
            value={form.body}
            onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Write your message here…"
            className="w-full text-sm border border-[#EAEAEA] rounded-xl px-3 py-2.5 font-medium text-[#1A1A2E] outline-none focus:border-[#E53935] resize-none mb-3"
          />

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm(f => ({ ...f, pinned: e.target.checked }))}
              className="w-4 h-4 accent-[#E53935]"
            />
            <span className="text-xs font-bold text-[#1A1A2E]">📌 Pin to top of dashboard</span>
          </label>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !form.title || !form.body} className="duo-btn duo-btn-red px-6 py-2.5 text-xs">
              {saving ? 'Publishing…' : '🚀 Publish'}
            </button>
            <button onClick={() => setShowForm(false)} className="duo-btn duo-btn-outline px-6 py-2.5 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Updates List */}
      <div className="flex flex-col gap-3">
        {updates.length === 0 && (
          <div className="text-center py-12 text-[#BDBDBD]">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium">No updates yet. Create one!</p>
          </div>
        )}
        {updates.map((u) => {
          const c = TYPE_COLORS[u.type] ?? TYPE_COLORS.announcement!;
          return (
            <div key={u._id} className="duo-card p-4 flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
              >
                {u.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full capitalize"
                    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                  >
                    {u.type}
                  </span>
                  {u.pinned && <span className="text-[9px] font-black text-[#E53935] bg-[#FFF5F5] px-2 py-0.5 rounded-full">📌 PINNED</span>}
                </div>
                <p className="font-black text-[#1A1A2E] text-sm">{u.title}</p>
                <p className="text-xs text-[#9E9E9E] mt-0.5 line-clamp-2">{u.body}</p>
                <p className="text-[10px] text-[#BDBDBD] mt-1">
                  {new Date(u.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {u.author && ` · by ${u.author.name}`}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePin(u)}
                  title={u.pinned ? 'Unpin' : 'Pin'}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#FFF5F5] transition-colors"
                >
                  {u.pinned ? <PinOff size={14} className="text-[#E53935]" /> : <Pin size={14} className="text-[#BDBDBD]" />}
                </button>
                <button
                  onClick={() => del(u._id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#FFF5F5] transition-colors"
                >
                  <Trash2 size={14} className="text-[#BDBDBD] hover:text-[#E53935]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
