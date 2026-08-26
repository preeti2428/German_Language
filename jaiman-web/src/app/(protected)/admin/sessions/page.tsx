'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Video, Clock, Check, X, Edit2, Link as LinkIcon,
  ArrowLeft, Users, DollarSign, AlertCircle, CheckCircle, ExternalLink, RefreshCw, Filter
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  _id: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  topic?: string;
  notes?: string;
  price?: number;
  paymentStatus?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meetLink?: string;
  createdAt: string;
  student: { _id: string; name: string; email: string; avatar?: string };
  teacher: { _id: string; name: string; avatar?: string };
}

export default function AdminSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingMeetId, setEditingMeetId] = useState<string | null>(null);
  const [customMeetLink, setCustomMeetLink] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isStaff = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    if (!isStaff) {
      router.replace('/dashboard');
      return;
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/all');
      setBookings(res.data);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to fetch session requests');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const updateStatus = async (id: string, status: string, meetLink?: string) => {
    setActionLoading(true);
    try {
      const body: Record<string, any> = { status };
      if (meetLink !== undefined) body.meetLink = meetLink;
      const res = await api.patch(`/bookings/${id}/status`, body);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...res.data } : b)));
      showToast('success', `Session status updated to ${status}!`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const saveCustomMeetLink = async (id: string) => {
    if (!customMeetLink.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/bookings/${id}/status`, { meetLink: customMeetLink.trim() });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, meetLink: res.data.meetLink } : b)));
      setEditingMeetId(null);
      setCustomMeetLink('');
      showToast('success', 'Google Meet link updated successfully!');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update meet link');
    } finally {
      setActionLoading(false);
    }
  };

  const generateGoogleMeetLink = async (id: string) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randStr = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const newMeet = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
    await updateStatus(id, 'confirmed', newMeet);
  };

  const filtered = bookings.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const totalRevenue = bookings.filter((b) => b.status !== 'cancelled').length * 1000;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6 md:p-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-black border-2 transition-all ${
          toast.type === 'success' ? 'bg-[#D1FAE5] text-[#059669] border-[#6EE7B7]' : 'bg-[#FFE4E6] text-[#FF4757] border-[#FCA5A5]'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

      {/* Navigation & Back Bar */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#E53935] bg-[#FFF5F5] border-2 border-[#FFCDD2] px-3.5 py-2 rounded-xl hover:bg-[#FFEAEA] transition-all"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#555] bg-white border-2 border-[#EAEAEA] px-3.5 py-2 rounded-xl hover:bg-[#FAFAFA] transition-all"
        >
          Manage Batches
        </Link>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#5865F2] bg-[#EEF2FF] border-2 border-[#C7D2FE] px-3.5 py-2 rounded-xl hover:bg-[#E0E7FF] transition-all"
        >
          Student Booking View
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black text-[#E53935] uppercase tracking-[0.2em]">ADMIN PANEL · SESSIONS</p>
          <h1 className="text-[28px] font-black text-[#1A1A2E] leading-tight flex items-center gap-2.5 mt-1">
            <CalendarDays className="text-[#E53935]" size={30} />
            1-on-1 Booking Requests & Google Meet Management
          </h1>
          <p className="text-[#9E9E9E] text-sm font-medium mt-1">
            Review student session requests, assign or update Google Meet links, and track ₹1,000 session payments.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="duo-btn duo-btn-red px-4 py-2.5 text-xs flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Requests
        </button>
      </div>

      {/* ══ STATS ROW ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#E53935] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF5F5] flex items-center justify-center text-[#E53935]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[#1A1A2E]">{bookings.length}</p>
              <p className="text-[11px] font-bold text-[#9E9E9E]">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#43A047] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#43A047]">
              <Video size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[#1A1A2E]">{confirmedCount}</p>
              <p className="text-[11px] font-bold text-[#9E9E9E]">Confirmed Live</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#1565C0] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] flex items-center justify-center text-[#1565C0]">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[#1A1A2E]">{completedCount}</p>
              <p className="text-[11px] font-bold text-[#9E9E9E]">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#FFC107] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8E1] flex items-center justify-center text-[#F57F17]">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-[#1A1A2E]">₹{totalRevenue.toLocaleString('en-IN')}</p>
              <p className="text-[11px] font-bold text-[#9E9E9E]">Total Fee Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FILTER TABS ══════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter size={14} className="text-[#9E9E9E]" />
        <span className="text-xs font-bold text-[#9E9E9E]">Status:</span>
        {[
          { key: 'all', label: `All (${bookings.length})` },
          { key: 'confirmed', label: `Confirmed (${confirmedCount})` },
          { key: 'completed', label: `Completed (${completedCount})` },
          { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${
              filterStatus === tab.key
                ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                : 'bg-white text-[#757575] border-[#EAEAEA] hover:border-[#1A1A2E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ SESSIONS LIST ════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-[#EAEAEA] p-12 text-center text-[#BDBDBD]">
          <CalendarDays size={50} className="mx-auto mb-3 opacity-30" />
          <p className="text-base font-black text-[#1A1A2E]">No session bookings found</p>
          <p className="text-xs font-medium mt-1">When students book a 1-on-1 session with Jai, their requests appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-2xl border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5 hover:border-[#E53935] transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Student Info & Slot */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFCDD2] flex items-center justify-center font-black text-lg text-[#E53935] flex-shrink-0">
                    {booking.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-black text-[#1A1A2E] text-base">{booking.student?.name || 'Student'}</h3>
                      <span className="text-xs text-[#757575] font-semibold">({booking.student?.email})</span>
                      <span className="bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        ₹1,000 Paid (30m)
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                        booking.status === 'completed' ? 'bg-[#E3F2FD] text-[#1565C0]' :
                        'bg-[#FAFAFA] text-[#9E9E9E]'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-[#555]">
                      <span className="flex items-center gap-1 text-[#E53935]">
                        <CalendarDays size={13} /> {booking.date}
                      </span>
                      <span className="flex items-center gap-1 text-[#1565C0]">
                        <Clock size={13} /> {booking.timeSlot} IST ({booking.durationMinutes || 30} mins)
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#1A1A2E] mt-2">
                      Topic: <span className="text-[#E53935] font-black">{booking.topic || 'German Practice'}</span>
                    </p>

                    {booking.notes && (
                      <p className="text-xs text-[#616161] font-medium bg-[#FAFAFA] border border-[#EAEAEA] p-2 rounded-xl mt-2 max-w-2xl">
                        💬 <strong>Student Notes:</strong> {booking.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Google Meet Link & Controls */}
                <div className="flex flex-col items-start lg:items-end gap-2.5 bg-[#F9FAFB] p-3.5 rounded-2xl border border-[#E5E7EB] min-w-[300px]">
                  <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Session Meet Link</span>

                  {/* Editable or clickable link */}
                  {editingMeetId === booking._id ? (
                    <div className="w-full space-y-2">
                      <input
                        type="url"
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={customMeetLink}
                        onChange={(e) => setCustomMeetLink(e.target.value)}
                        className="w-full text-xs font-bold p-2 rounded-xl border-2 border-[#E53935] focus:outline-none"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingMeetId(null)}
                          className="px-2.5 py-1 text-xs font-bold text-[#757575] hover:bg-gray-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveCustomMeetLink(booking._id)}
                          className="px-3 py-1 text-xs font-black bg-[#43A047] text-white rounded-lg hover:bg-[#388E3C]"
                        >
                          Save Link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full justify-between lg:justify-end">
                      {booking.meetLink ? (
                        <a
                          href={booking.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-[#1565C0] hover:underline"
                        >
                          <Video size={13} className="text-[#E53935]" /> {booking.meetLink} <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-xs text-[#9E9E9E] font-bold">No meet link set</span>
                      )}

                      <button
                        onClick={() => {
                          setEditingMeetId(booking._id);
                          setCustomMeetLink(booking.meetLink || '');
                        }}
                        className="p-1.5 rounded-lg text-[#555] hover:bg-gray-200 text-xs flex items-center gap-1"
                        title="Edit Meet Link"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  )}

                  {/* Actions buttons row */}
                  <div className="flex items-center gap-2 flex-wrap w-full justify-end mt-1">
                    {booking.meetLink && (
                      <a
                        href={booking.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="duo-btn duo-btn-red px-3 py-1.5 text-xs font-black flex items-center gap-1"
                      >
                        <Video size={13} /> Join Meet as Jai
                      </a>
                    )}

                    {!booking.meetLink && (
                      <button
                        onClick={() => generateGoogleMeetLink(booking._id)}
                        className="px-3 py-1.5 rounded-xl border-2 border-[#5865F2] text-[#5865F2] hover:bg-[#EEF2FF] text-xs font-black flex items-center gap-1"
                      >
                        <LinkIcon size={12} /> Auto Google Meet
                      </button>
                    )}

                    {booking.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(booking._id, 'completed')}
                        className="px-3 py-1.5 rounded-xl border-2 border-[#43A047] text-[#43A047] hover:bg-[#E8F5E9] text-xs font-black flex items-center gap-1"
                      >
                        <Check size={13} /> Completed
                      </button>
                    )}

                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(booking._id, 'cancelled')}
                        className="px-3 py-1.5 rounded-xl border-2 border-[#E0E0E0] text-[#9E9E9E] hover:border-[#FFCDD2] hover:text-[#E53935] text-xs font-black"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
