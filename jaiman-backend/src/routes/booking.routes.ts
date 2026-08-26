import { Router, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  getAvailableSlots,
  getTeacherProfile,
  myBookings,
  teacherBookings,
  allBookings,
  createBooking,
  cancelBooking,
  updateBookingStatus,
} from '../controllers/booking.controller';

const router = Router();

const staffOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) next();
  else res.status(403).json({ message: 'Staff only.' });
};

const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Admin only.' });
};

// ─── Teacher profile & pricing info ──────────────────────────────────────────
router.get('/teacher-info', getTeacherProfile);

// ─── Slot availability (public query) ────────────────────────────────────────
router.get('/slots', getAvailableSlots);

// ─── Student bookings ─────────────────────────────────────────────────────────
router.get('/my', protect, myBookings);

// ─── Teacher view ─────────────────────────────────────────────────────────────
router.get('/teacher', protect, staffOrAdmin, teacherBookings);

// ─── Admin/Teacher view (all) ──────────────────────────────────────────────────
router.get('/all', protect, staffOrAdmin, allBookings);

// ─── Create booking (student) ─────────────────────────────────────────────────
router.post('/', protect, createBooking);

// ─── Cancel booking ───────────────────────────────────────────────────────────
router.patch('/:id/cancel', protect, cancelBooking);

// ─── Teacher/admin update status ──────────────────────────────────────────────
router.patch('/:id/status', protect, staffOrAdmin, updateBookingStatus);

export default router;
