'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Clock, ChevronLeft, ChevronRight, Check, X,
  BookOpen, Video, ShieldCheck, Star, Sparkles, AlertCircle, PhoneCall
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const TOPICS = [
  '🗣️ Free German Conversation & Fluency',
  '✍️ Grammar Correction & Sentence Formation',
  '🎯 Goethe Exam Prep (A1 / A2 / B1 / B2)',
  '💼 German Job Interview & Resume Prep',
  '✈️ Relocation, University & Visa Speaking Prep',
  '📚 Vocabulary Building & Pronunciation',
  '🇩🇪 German Culture, Slang & Daily Life',
];

interface Booking {
  _id: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  topic?: string;
  price?: number;
  status: string;
  meetLink?: string;
  teacher: { name: string; avatar?: string };
}

interface TeacherInfo {
  _id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  rate: number;
  currency: string;
  durationMinutes: number;
  timeWindow: string;
  slots: string[];
  rating: number;
  totalSessions: number;
}

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function weekDays(anchor: Date) {
  const monday = new Date(anchor);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { user } = useAuth();
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [slots, setSlots] = useState<{ available: string[]; booked: string[] }>({ available: [], booked: [] });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]!);
  const [notes, setNotes] = useState('');
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load teacher information
  useEffect(() => {
    api.get('/bookings/teacher-info')
      .then((r) => setTeacher(r.data))
      .catch(() => {
        // Fallback default
        setTeacher({
          _id: 'default',
          name: 'Jai Sharma',
          avatar: '/teacher.png',
          title: 'Founder & Lead German Coach',
          bio: 'Goethe-Zertifikat C2 certified trainer. 5+ years experience mentoring 2000+ students.',
          rate: 1000,
          currency: 'INR',
          durationMinutes: 30,
          timeWindow: '9:00 AM – 6:00 PM IST',
          slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'],
          rating: 4.9,
          totalSessions: 640,
        });
      });
    fetchMyBookings();
  }, []);

  const fetchMyBookings = () => {
    api.get('/bookings/my').then((r) => setMyBookings(r.data)).catch(() => {});
  };

  // Fetch slots for selected date
  useEffect(() => {
    if (!selectedDate) return;
    setSlotLoading(true);
    setSelectedSlot(null);
    const teacherId = teacher?._id || 'default';
    api.get(`/bookings/slots?teacherId=${teacherId}&date=${selectedDate}`)
      .then((r) => setSlots(r.data))
      .catch(() => setSlots({ available: [], booked: [] }))
      .finally(() => setSlotLoading(false));
  }, [teacher, selectedDate]);

  const book = useCallback(async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/bookings', {
        teacherId: teacher?._id || 'default',
        date: selectedDate,
        timeSlot: selectedSlot,
        durationMinutes: 30,
        topic: selectedTopic,
        notes,
      });
      setSuccess(true);
      setSelectedSlot(null);
      setNotes('');
      fetchMyBookings();
      // Re-fetch slots
      const teacherId = teacher?._id || 'default';
      api.get(`/bookings/slots?teacherId=${teacherId}&date=${selectedDate}`).then((r) => setSlots(r.data));
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedSlot, teacher, selectedDate, selectedTopic, notes]);

  const cancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`, { reason: 'User requested cancellation' });
      fetchMyBookings();
      if (teacher && selectedDate) {
        api.get(`/bookings/slots?teacherId=${teacher._id}&date=${selectedDate}`).then((r) => setSlots(r.data));
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to cancel');
    }
  };

  const days = weekDays(anchor);

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8">
      {/* ══ HEADER & TEACHER PROFILE ══════════════════════════════════ */}
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <p className="text-[11px] font-black text-[#E53935] uppercase tracking-[0.2em]">SPEAK · 1-ON-1 COACHING</p>
          <h1 className="text-[28px] font-black text-[#1A1A2E] leading-tight mt-1 flex items-center gap-2.5">
            <CalendarDays className="text-[#E53935]" size={30} />
            Book a Live 1-on-1 Session with Jai
          </h1>
          <p className="text-[#9E9E9E] text-sm font-medium mt-1">
            Pick a convenient slot between 9:00 AM – 6:00 PM for personalized speaking coaching, Goethe exam prep, and interview drills.
          </p>
        </div>

        {/* Jai Profile & Pricing Card */}
        <div className="bg-white rounded-[1.75rem] border-2 border-[#EAEAEA] border-b-[5px] border-b-[#E53935] p-5 md:p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                <img
                  src={teacher?.avatar && teacher.avatar !== 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' ? teacher.avatar : '/teacher.png'}
                  alt="Jai Sharma"
                  className="w-full h-full rounded-2xl object-cover object-top border-2 border-[#E53935] shadow-sm bg-white"
                />
                <span className="absolute -bottom-1 -right-1 bg-[#43A047] text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                  ONLINE
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-[#1A1A2E]">{teacher?.name || 'Jai Sharma'}</h2>
                  <span className="bg-[#FFF3E0] text-[#E65100] text-[10px] font-black px-2.5 py-0.5 rounded-lg border border-[#FFE0B2]">
                    ⭐ {teacher?.rating || 4.9} ({teacher?.totalSessions || 640}+ Sessions)
                  </span>
                </div>
                <p className="text-xs font-bold text-[#E53935] mt-0.5">{teacher?.title || 'Founder & Lead German Coach'}</p>
                <p className="text-xs text-[#757575] font-medium mt-1 max-w-xl line-clamp-2">
                  {teacher?.bio || 'Goethe-Zertifikat C2 certified trainer. 5+ years experience mentoring students and professionals.'}
                </p>
              </div>
            </div>

            {/* Price Badge */}
            <div className="bg-[#F8F9FE] border-2 border-[#E0E7FF] rounded-2xl p-4 text-center md:min-w-[200px] flex-shrink-0">
              <span className="text-[10px] font-black text-[#5865F2] uppercase tracking-wider block">Session Fee</span>
              <div className="text-2xl md:text-3xl font-black text-[#1A1A2E] mt-0.5">
                ₹{teacher?.rate || 1000}
              </div>
              <span className="text-[11px] font-bold text-[#6B7280]">per 30-min live session</span>
              <div className="mt-2 text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded-md inline-block">
                🕒 Available 9:00 AM – 6:00 PM
              </div>
            </div>
          </div>
        </div>

        {/* ══ MAIN BOOKING GRID ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Calendar & Slots */}
          <div className="lg:col-span-2 space-y-6">

            {/* Date Navigator Card */}
            <div className="bg-white rounded-[1.5rem] border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setAnchor((prev) => addDays(prev, -7))}
                  className="w-9 h-9 rounded-xl border-2 border-[#EAEAEA] flex items-center justify-center hover:border-[#1A1A2E] transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-black text-[#1A1A2E]">
                  {days[0]?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {days[6]?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setAnchor((prev) => addDays(prev, 7))}
                  className="w-9 h-9 rounded-xl border-2 border-[#EAEAEA] flex items-center justify-center hover:border-[#1A1A2E] transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day selection row */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((d, i) => {
                  const ds = formatDate(d);
                  const isSelected = selectedDate === ds;
                  const isToday = formatDate(new Date()) === ds;
                  const isPast = ds < formatDate(new Date());

                  return (
                    <button
                      key={ds}
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(ds);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center py-3 rounded-2xl border-2 border-b-[4px] font-black text-xs transition-all ${
                        isSelected
                          ? 'bg-[#E53935] border-[#E53935] border-b-[#C62828] text-white shadow-[0_4px_12px_rgba(229,57,53,0.3)]'
                          : isToday
                          ? 'bg-[#FFF5F5] border-[#FFCDD2] border-b-[#E53935] text-[#E53935]'
                          : isPast
                          ? 'bg-[#F5F5F5] border-[#E0E0E0] text-[#BDBDBD] cursor-not-allowed opacity-50'
                          : 'bg-[#FAFAFA] border-[#EAEAEA] border-b-[#D8D8D8] text-[#757575] hover:border-[#E53935]'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80">{DAY_NAMES[i]}</span>
                      <span className="text-base font-black mt-0.5">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker (9:00 AM to 6:00 PM) */}
            <div className="bg-white rounded-[1.5rem] border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-[#1A1A2E] flex items-center gap-2">
                  <Clock size={16} className="text-[#E53935]" />
                  Available Time Slots ({selectedDate})
                </h3>
                <span className="text-xs font-bold text-[#9E9E9E]">9:00 AM – 6:00 PM IST</span>
              </div>

              {slotLoading ? (
                <div className="grid grid-cols-4 gap-2.5 animate-pulse">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="h-11 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              ) : (() => {
                const now = new Date();
                const todayStr = formatDate(now);
                const isToday = selectedDate === todayStr;
                const isPastDate = selectedDate < todayStr;
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                const allSlotTimes = teacher?.slots || [
                  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
                ];

                const isSlotPassed = (slot: string) => {
                  if (isPastDate) return true;
                  if (isToday) {
                    const [h, m] = slot.split(':').map(Number);
                    return h * 60 + m <= currentMinutes;
                  }
                  return false;
                };

                const availableCount = allSlotTimes.filter((s) => !slots.booked?.includes(s) && !isSlotPassed(s)).length;

                return (
                  <div>
                    {availableCount === 0 ? (
                      <div className="p-6 text-center bg-[#FFF8EE] rounded-2xl border-2 border-[#FFE0B2]">
                        <p className="text-sm font-black text-[#E65100]">
                          ⏰ All slots for today ({selectedDate}) have passed
                        </p>
                        <p className="text-xs font-medium text-[#757575] mt-1">
                          Please select tomorrow or any upcoming date from the calendar above to book your 1-on-1 session.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {allSlotTimes.map((slot) => {
                          const isBooked = slots.booked?.includes(slot);
                          const isPassed = isSlotPassed(slot);
                          const isChosen = selectedSlot === slot;
                          const isDisabled = isBooked || isPassed;

                          return (
                            <button
                              key={slot}
                              disabled={isDisabled}
                              onClick={() => setSelectedSlot(slot)}
                              title={isPassed ? 'Slot has already passed' : isBooked ? 'Slot already booked' : 'Available'}
                              className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black transition-all ${
                                isChosen
                                  ? 'bg-[#1A1A2E] border-[#1A1A2E] text-white shadow-md scale-105'
                                  : isPassed
                                  ? 'bg-[#F5F5F5] border-[#EAEAEA] text-[#BDBDBD] cursor-not-allowed line-through opacity-60'
                                  : isBooked
                                  ? 'bg-[#FFF5F5] border-[#FFCDD2] text-[#E53935] cursor-not-allowed line-through'
                                  : 'bg-white border-[#EAEAEA] text-[#1A1A2E] hover:border-[#E53935] hover:text-[#E53935]'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Session Details & Confirmation */}
            {selectedSlot && (
              <div className="bg-white rounded-[1.5rem] border-2 border-[#E53935] border-b-[5px] border-b-[#C62828] p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-[10px] font-black text-[#E53935] uppercase tracking-wider">Step 2: Confirm Details</span>
                    <h4 className="font-black text-[#1A1A2E] text-base">
                      Selected Slot: {selectedDate} at {selectedSlot} IST
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#9E9E9E]">Amount Payable</span>
                    <p className="text-xl font-black text-[#1A1A2E]">₹1,000</p>
                  </div>
                </div>

                {/* Topic Selection */}
                <div>
                  <label className="text-xs font-bold text-[#555] block mb-2">Select Coaching Focus Topic:</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-bold text-[#1A1A2E] focus:outline-none focus:border-[#E53935]"
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-[#555] block mb-2">Special Request or Questions for Jai (Optional):</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Need help with B1 Sprechen Teil 2, or practicing a mock visa interview..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-[#EAEAEA] text-xs font-medium text-[#1A1A2E] focus:outline-none focus:border-[#E53935] resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#FFE4E6] text-[#FF4757] border border-[#FCA5A5] text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  disabled={loading}
                  onClick={book}
                  className="w-full duo-btn duo-btn-red py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? 'Processing Booking...' : '💳 Pay & Confirm Booking (₹1,000)'}
                </button>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl bg-[#E8F5E9] border-2 border-[#A5D6A7] text-[#2E7D32] flex items-center gap-3">
                <Check size={20} className="text-[#43A047] flex-shrink-0" />
                <div>
                  <p className="font-black text-sm">🎉 Session Booked Successfully!</p>
                  <p className="text-xs font-medium text-[#388E3C] mt-0.5">
                    Your 1-on-1 session with Jai has been confirmed for {selectedDate}. Google Meet link generated in Upcoming Sessions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Upcoming Sessions & Info */}
          <div className="space-y-6">

            {/* Upcoming Sessions List */}
            <div className="bg-white rounded-[1.5rem] border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
              <h3 className="text-sm font-black text-[#1A1A2E] flex items-center gap-2 mb-4">
                <Video size={16} className="text-[#E53935]" />
                Upcoming Sessions ({myBookings.filter((b) => b.status !== 'cancelled').length})
              </h3>

              {myBookings.filter((b) => b.status !== 'cancelled').length === 0 ? (
                <div className="text-center py-8 text-[#BDBDBD]">
                  <CalendarDays size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">No upcoming sessions yet.</p>
                  <p className="text-[11px] font-medium mt-1">Pick a date and 9 AM – 6 PM slot to book with Jai.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.filter((b) => b.status !== 'cancelled').map((booking) => (
                    <div key={booking._id} className="p-3.5 rounded-xl border-2 border-[#EAEAEA] bg-[#FAFAFA]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-[#1A1A2E]">{booking.date} at {booking.timeSlot} IST</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                          Confirmed (₹1,000)
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#757575] line-clamp-1 mb-2">
                        {booking.topic || 'German Practice Session'}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#EAEAEA]">
                        {booking.meetLink ? (
                          <a
                            href={booking.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-1.5 rounded-lg bg-[#E53935] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-[#D32F2F] transition-all"
                          >
                            <Video size={13} /> Join Live Meet
                          </a>
                        ) : (
                          <span className="flex-1 text-center text-[10px] text-[#9E9E9E] font-bold">Meet link sent before call</span>
                        )}
                        <button
                          onClick={() => cancelBooking(booking._id)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#FFCDD2] text-[#E53935] text-xs font-bold hover:bg-[#FFF5F5]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-[1.5rem] border-2 border-[#EAEAEA] border-b-[4px] border-b-[#D8D8D8] p-5">
              <h4 className="text-xs font-black text-[#1A1A2E] uppercase tracking-wider mb-3">📖 How It Works</h4>
              <ul className="space-y-2.5 text-xs font-medium text-[#616161]">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFF5F5] text-[#E53935] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Select any date and time between <strong>9:00 AM – 6:00 PM IST</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFF5F5] text-[#E53935] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Choose your focus area (Goethe exam prep, conversation, or interview).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFF5F5] text-[#E53935] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Confirm ₹1,000 session fee for 30 minutes 1-on-1 personalized attention.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFF5F5] text-[#E53935] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <span>Join the Google Meet link directly from this page at the scheduled time!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
