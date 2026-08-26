import { Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// Available time slots from 9:00 AM to 6:00 PM
const ALL_SLOTS = [
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00'
];

// Helper to get or create Jai profile
const findOrCreateTeacher = async () => {
  let teacher = await User.findOne({ name: { $regex: /jai/i } });
  if (!teacher) {
    teacher = await User.findOne({ email: 'jai@germanlanguage.com' });
  }
  if (!teacher) {
    teacher = await User.create({
      name: 'Jai Sharma',
      email: 'jai@germanlanguage.com',
      password: 'password123',
      role: 'teacher',
      avatar: '/teacher.png',
    });
  }
  return teacher;
};

// ─── GET /api/bookings/teacher-info ──────────────────────────────────────────
export const getTeacherProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacher = await findOrCreateTeacher();
    res.json({
      _id: teacher._id,
      name: teacher.name || 'Jai Sharma',
      avatar: teacher.avatar || '/teacher.png',
      title: 'Founder & Lead German Coach',
      bio: 'Goethe-Zertifikat C2 certified trainer. 5+ years experience training 2,000+ students and working professionals.',
      rate: 1000,
      currency: 'INR',
      durationMinutes: 30,
      timeWindow: '9:00 AM – 6:00 PM IST',
      slots: ALL_SLOTS,
      rating: 4.9,
      totalSessions: 640,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/bookings/slots?teacherId=...&date=YYYY-MM-DD ───────────────────
export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { teacherId, date } = req.query;
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    if (!teacherId || teacherId === 'default' || teacherId === 'undefined') {
      const teacher = await findOrCreateTeacher();
      teacherId = String(teacher._id);
    }

    // Get booked slots for this teacher on this date
    const booked = await Booking.find({
      teacher: teacherId as string,
      date: date as string,
      status: { $ne: 'cancelled' },
    }).select('timeSlot');

    const now = new Date();
    // Use IST timezone or local server time
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isPastSlot = (slot: string) => {
      if (date! < todayStr) return true;
      if (date === todayStr) {
        const [h, m] = slot.split(':').map(Number);
        return (h * 60 + m) <= currentMinutes;
      }
      return false;
    };

    const bookedSlots = new Set(booked.map((b) => b.timeSlot));
    const passedSlots = ALL_SLOTS.filter(isPastSlot);
    const available = ALL_SLOTS.filter((s) => !bookedSlots.has(s) && !isPastSlot(s));

    res.json({
      date,
      teacherId,
      available,
      booked: [...bookedSlots],
      passed: passedSlots,
      rate: 1000,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/bookings/my ────────────────────────────────────────────────────
export const myBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ student: req.user!._id })
      .populate('teacher', 'name avatar')
      .sort({ date: -1, timeSlot: 1 });
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/bookings/teacher ───────────────────────────────────────────────
export const teacherBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ teacher: req.user!._id })
      .populate('student', 'name avatar email')
      .sort({ date: 1, timeSlot: 1 });
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/bookings/all (admin) ───────────────────────────────────────────
export const allBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, status } = req.query;
    const filter: Record<string, any> = {};
    if (date) filter.date = date;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('student', 'name email avatar')
      .populate('teacher', 'name avatar')
      .sort({ date: -1, timeSlot: 1 });
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/bookings ──────────────────────────────────────────────────────
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let { teacherId, date, timeSlot, durationMinutes, topic, notes } = req.body;

    if (!date || !timeSlot) {
      res.status(400).json({ message: 'date and timeSlot are required.' });
      return;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (date < todayStr) {
      res.status(400).json({ message: 'Cannot book a session on a past date.' });
      return;
    }

    if (date === todayStr) {
      const [h, m] = timeSlot.split(':').map(Number);
      if (h * 60 + m <= currentMinutes) {
        res.status(400).json({ message: 'This time slot has already passed for today. Please select a future time slot.' });
        return;
      }
    }

    if (!teacherId || teacherId === 'default' || teacherId === 'undefined') {
      const defaultTeacher = await findOrCreateTeacher();
      teacherId = defaultTeacher._id;
    }

    // Check teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      res.status(404).json({ message: 'Teacher not found.' });
      return;
    }

    // Check slot is available
    const conflict = await Booking.findOne({ teacher: teacherId, date, timeSlot, status: { $ne: 'cancelled' } });
    if (conflict) {
      res.status(409).json({ message: 'This time slot is already booked. Please pick another slot.' });
      return;
    }

    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randStr = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const meetLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;

    const booking = await Booking.create({
      student: req.user!._id,
      teacher: teacherId,
      date,
      timeSlot,
      durationMinutes: durationMinutes || 30,
      topic: topic || 'Free German Conversation',
      notes: notes || '',
      price: 1000,
      paymentStatus: 'paid',
      status: 'confirmed',
      meetLink,
    });

    const populated = await booking.populate('teacher', 'name avatar');
    res.status(201).json(populated);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ message: 'This time slot is already booked.' });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
};

// ─── PATCH /api/bookings/:id/cancel ─────────────────────────────────────────
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404).json({ message: 'Booking not found.' }); return; }

    const uid = String(req.user!._id);
    const isOwner = String(booking.student) === uid || String(booking.teacher) === uid;
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to cancel this booking.' }); return;
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user!._id as any;
    booking.cancelReason = req.body.reason || '';
    await booking.save();
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/bookings/:id/status (admin/teacher) ─────────────────────────
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, meetLink } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) { res.status(404).json({ message: 'Booking not found.' }); return; }

    const uid = String(req.user!._id);
    const isTeacher = String(booking.teacher) === uid;
    const isAdmin = req.user!.role === 'admin';
    if (!isTeacher && !isAdmin) {
      res.status(403).json({ message: 'Not authorized.' }); return;
    }

    if (status) booking.status = status;
    if (meetLink) booking.meetLink = meetLink;
    await booking.save();
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
