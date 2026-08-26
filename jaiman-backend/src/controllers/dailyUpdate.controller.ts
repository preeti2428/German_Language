import { Response } from 'express';
import DailyUpdate from '../models/DailyUpdate';
import User from '../models/User';
import Batch from '../models/Batch';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── GET /api/updates  — public list (newest first, pinned first) ─────────────
export const listUpdates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 10;
    const updates = await DailyUpdate.find()
      .populate('author', 'name avatar')
      .sort({ pinned: -1, publishedAt: -1 })
      .limit(limit);
    res.json(updates);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/updates  — admin creates update ────────────────────────────────
export const createUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, body, emoji, type, pinned } = req.body;
    if (!title || !body) {
      res.status(400).json({ message: 'title and body are required.' }); return;
    }
    const update = await DailyUpdate.create({
      title,
      body,
      emoji: emoji || '📢',
      type: type || 'announcement',
      author: req.user!._id,
      pinned: pinned ?? false,
    });
    const populated = await update.populate('author', 'name avatar');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/updates/:id ───────────────────────────────────────────────────
export const patchUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const update = await DailyUpdate.findById(req.params.id);
    if (!update) { res.status(404).json({ message: 'Update not found.' }); return; }

    const allowed = ['title', 'body', 'emoji', 'type', 'pinned'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) (update as any)[k] = req.body[k]; });
    await update.save();
    res.json(update);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/updates/:id ──────────────────────────────────────────────────
export const deleteUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await DailyUpdate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/updates/admin-stats  — system overview for admin dashboard ─────
export const adminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalBatches, totalBookings, pendingBookings, recentUsers] = await Promise.all([
      User.countDocuments(),
      Batch.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar'),
    ]);

    const roleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const levelBreakdown = await User.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      totalBatches,
      totalBookings,
      pendingBookings,
      recentUsers,
      roleBreakdown,
      levelBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
