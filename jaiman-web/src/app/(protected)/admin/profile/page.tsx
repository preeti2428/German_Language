'use client';

import { useEffect, useState } from 'react';
import {
  Users, BookOpen, CalendarCheck, BarChart3, TrendingUp,
  Settings, Megaphone, GraduationCap, ChevronRight, Shield
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateLevelInfo } from '@/lib/level';

interface Stats {
  totalUsers: number;
  totalBatches: number;
  totalBookings: number;
  pendingBookings: number;
  recentUsers: { _id: string; name: string; email: string; role: string; createdAt: string; avatar?: string }[];
  roleBreakdown: { _id: string; count: number }[];
  levelBreakdown: { _id: string; count: number }[];
}

const ROLE_COLORS: Record<string, string> = {
  learner: '#E53935',
  teacher: '#1565C0',
  admin: '#6A1B9A',
  creator: '#43A047',
};

const QUICK_LINKS = [
  { label: 'Manage Batches', desc: 'Create batches, edit prices & curriculum', href: '/admin/batches', icon: GraduationCap, color: '#E53935', bg: '#FFF5F5', border: '#FFCDD2' },
  { label: '1-on-1 Sessions & Meet', desc: 'Review booking requests & set Google Meet links', href: '/admin/sessions', icon: CalendarCheck, color: '#1565C0', bg: '#E3F2FD', border: '#90CAF9' },
  { label: 'Daily Updates', desc: 'Post daily tips, challenges & notices', href: '/admin/updates', icon: Megaphone, color: '#FF9F43', bg: '#FFF8EE', border: '#FFE0B2' },
  { label: 'Platform Settings', desc: 'Manage your profile & preferences', href: '/settings', icon: Settings, color: '#6A1B9A', bg: '#F3E5F5', border: '#CE93D8' },
];

export default function AdminProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/dashboard'); return; }
    api.get('/updates/admin-stats')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const xp = user.xp ?? 0;
  const levelInfo = calculateLevelInfo(xp, user?.level);

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="dj-crumb">ADMIN · ME</p>
        <h1 className="dj-title">Admin Profile</h1>
      </div>

      <div className="flex gap-5 flex-wrap xl:flex-nowrap">
        {/* LEFT — Profile card + quick links */}
        <div className="w-full xl:w-[300px] flex-shrink-0 flex flex-col gap-4">
          {/* Admin Identity */}
          <div className="duo-card p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6A1B9A] to-[#9C27B0] flex items-center justify-center font-black text-white text-3xl mx-auto shadow-[0_4px_16px_rgba(106,27,154,0.35)]">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#E53935] flex items-center justify-center shadow-md">
                <Shield size={13} className="text-white" />
              </div>
            </div>

            <h2 className="font-black text-[#1A1A2E] text-lg">{user.name}</h2>
            <p className="text-xs text-[#9E9E9E] font-medium mt-0.5">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#F3E5F5] text-[#6A1B9A] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#CE93D8]">
              <Shield size={10} /> Super Admin
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="bg-[#F5F6FA] rounded-xl p-3">
                <p className="text-[9px] font-black text-[#BDBDBD] uppercase tracking-wider">Level</p>
                <p className="font-black text-[#1A1A2E] text-sm">{levelInfo.level}</p>
              </div>
              <div className="bg-[#F5F6FA] rounded-xl p-3">
                <p className="text-[9px] font-black text-[#BDBDBD] uppercase tracking-wider">Total XP</p>
                <p className="font-black text-[#E53935] text-sm">{xp.toLocaleString()} XP</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="duo-card p-5">
            <h3 className="font-black text-[#1A1A2E] text-xs uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((ql) => {
                const Icon = ql.icon;
                return (
                  <Link
                    key={ql.href}
                    href={ql.href}
                    className="flex items-center gap-3 p-3.5 rounded-2xl hover:brightness-95 transition-all group border"
                    style={{ background: ql.bg, borderColor: ql.border }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ background: ql.color }}
                    >
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-[#1A1A2E] text-xs block leading-tight">{ql.label}</span>
                      <span className="text-[10px] text-[#757575] font-medium block truncate mt-0.5">{ql.desc}</span>
                    </div>
                    <ChevronRight size={15} className="text-[#BDBDBD] group-hover:text-[#E53935] transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Stats */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* KPI Cards */}
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[#BDBDBD]">Loading stats…</div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#E53935', bg: '#FFF5F5', border: '#FFCDD2' },
                  { label: 'Total Batches', value: stats.totalBatches, icon: '📚', color: '#1565C0', bg: '#E3F2FD', border: '#90CAF9' },
                  { label: 'Total Bookings', value: stats.totalBookings, icon: '📅', color: '#43A047', bg: '#E8F5E9', border: '#A5D6A7' },
                  { label: 'Pending Sessions', value: stats.pendingBookings, icon: '⏳', color: '#FF9F43', bg: '#FFF8EE', border: '#FFE0B2' },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-[1.25rem] p-4 border border-b-[4px]"
                    style={{ background: k.bg, borderColor: k.border, borderBottomColor: k.color }}
                  >
                    <div className="text-2xl mb-2">{k.icon}</div>
                    <p className="font-black text-[#1A1A2E] text-xl">{k.value}</p>
                    <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Role Breakdown */}
              <div className="duo-card p-5">
                <h3 className="font-black text-[#1A1A2E] text-sm mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#E53935]" /> User Role Breakdown
                </h3>
                <div className="flex flex-col gap-3">
                  {stats.roleBreakdown.sort((a, b) => b.count - a.count).map((r) => {
                    const color = ROLE_COLORS[r._id] ?? '#9E9E9E';
                    const pct = Math.round((r.count / stats.totalUsers) * 100);
                    return (
                      <div key={r._id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black capitalize" style={{ color }}>{r._id}</span>
                          <span className="text-xs font-bold text-[#9E9E9E]">{r.count} users ({pct}%)</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Level Breakdown */}
              <div className="duo-card p-5">
                <h3 className="font-black text-[#1A1A2E] text-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#E53935]" /> Learner Level Distribution
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {['A1','A2','B1','B2','C1','C2'].map((lvl) => {
                    const found = stats.levelBreakdown.find(l => l._id === lvl);
                    const count = found?.count ?? 0;
                    const max = Math.max(...stats.levelBreakdown.map(l => l.count), 1);
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={lvl} className="flex flex-col items-center">
                        <div className="w-full bg-[#F0F0F0] rounded-xl overflow-hidden h-20 flex items-end">
                          <div
                            className="w-full rounded-xl transition-all duration-700"
                            style={{ height: `${Math.max(pct, 5)}%`, background: '#E53935' }}
                          />
                        </div>
                        <p className="text-[10px] font-black text-[#1A1A2E] mt-1">{lvl}</p>
                        <p className="text-[10px] font-bold text-[#BDBDBD]">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Users */}
              <div className="duo-card p-5">
                <h3 className="font-black text-[#1A1A2E] text-sm mb-4 flex items-center gap-2">
                  <Users size={16} className="text-[#E53935]" /> Recently Joined
                </h3>
                <div className="flex flex-col gap-2">
                  {stats.recentUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-3 bg-[#F5F6FA] rounded-2xl">
                      <div className="w-9 h-9 rounded-full bg-[#FFC107] flex items-center justify-center font-black text-[#1A1A2E] text-sm flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[#1A1A2E] text-xs truncate">{u.name}</p>
                        <p className="text-[10px] text-[#BDBDBD] truncate">{u.email}</p>
                      </div>
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full capitalize text-white flex-shrink-0"
                        style={{ background: ROLE_COLORS[u.role] ?? '#9E9E9E' }}
                      >
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
