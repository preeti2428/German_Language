import { Response } from 'express';
import Batch from '../models/Batch';
import ModuleModel from '../models/Module';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── Helpers ────────────────────────────────────────────────────────────────

const isStaff = (role?: string) => role === 'admin' || role === 'teacher';

// ─── GET /api/batches  — public catalog ─────────────────────────────────────

export const listBatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { level, free } = req.query;
    const filter: Record<string, any> = { isPublished: true };
    if (level) filter.level = level;
    if (free === 'true') filter.price = 0;
    if (free === 'false') filter.price = { $gt: 0 };

    const batches = await Batch.find(filter)
      .populate('teacher', 'name avatar')
      .populate('modules', 'title order')
      .sort({ createdAt: -1 });

    res.json(batches);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/batches/my  — enrolled batches for logged-in student ───────────

export const myBatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).populate({
      path: 'enrolledBatches',
      populate: [
        { path: 'teacher', select: 'name avatar' },
        { path: 'modules', select: 'title order' },
      ],
    });
    res.json(user?.enrolledBatches ?? []);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/batches/:id  — single batch detail ────────────────────────────

export const getBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('teacher', 'name avatar')
      .populate({
        path: 'modules',
        options: { sort: { order: 1 } },
      });

    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    // If not published, only the teacher/admin can see it
    if (!batch.isPublished) {
      const uid = String(req.user?._id ?? '');
      const tid = String(batch.teacher._id ?? batch.teacher);
      if (!req.user || (uid !== tid && req.user.role !== 'admin')) {
        res.status(403).json({ message: 'This batch is not published yet.' });
        return;
      }
    }

    const uid = String(req.user?._id ?? '');
    const isEnrolled = batch.enrolledStudents.some((s) => String(s) === uid);

    res.json({ ...batch.toObject(), isEnrolled });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/batches  — create (teacher/admin only) ───────────────────────

export const createBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, level, price, thumbnail, startDate, endDate, enrollmentDeadline, maxStudents, tags } = req.body ?? {};

    if (!title || !level) {
      res.status(400).json({ message: 'title and level are required.' });
      return;
    }

    const batch = await Batch.create({
      title: String(title).slice(0, 120),
      description: description ?? '',
      teacher: req.user!._id,
      level,
      price: Number(price) || 0,
      thumbnail,
      isPublished: false,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      enrollmentDeadline: enrollmentDeadline ? new Date(enrollmentDeadline) : undefined,
      maxStudents: maxStudents ? Number(maxStudents) : undefined,
      tags: Array.isArray(tags) ? tags : [],
      enrolledStudents: [],
      modules: [],
      announcements: [],
    });

    res.status(201).json(batch);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/batches/:id  — update (owner teacher or admin) ──────────────

export const updateBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const uid = String(req.user!._id);
    const tid = String(batch.teacher);
    if (uid !== tid && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not your batch.' }); return;
    }

    const allowed = ['title', 'description', 'level', 'price', 'thumbnail', 'isPublished', 'startDate', 'endDate', 'enrollmentDeadline', 'maxStudents', 'tags'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) (batch as any)[key] = req.body[key];
    });
    await batch.save();
    res.json(batch);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/batches/:id  — delete (owner or admin) ─────────────────────

export const deleteBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const uid = String(req.user!._id);
    const tid = String(batch.teacher);
    if (uid !== tid && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not your batch.' }); return;
    }

    await Batch.findByIdAndDelete(req.params.id);
    await ModuleModel.deleteMany({ batch: req.params.id });
    res.json({ message: 'Batch deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/batches/:id/enroll  — student enrolls in a batch ─────────────

export const enrollBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }
    if (!batch.isPublished) { res.status(400).json({ message: 'This batch is not open for enrollment.' }); return; }

    const uid = req.user!._id as mongoose.Types.ObjectId;
    const alreadyEnrolled = batch.enrolledStudents.some((s) => String(s) === String(uid));

    if (alreadyEnrolled) {
      res.json({ enrolled: true, message: 'Already enrolled.' });
      return;
    }

    batch.enrolledStudents.push(uid as never);
    await batch.save();

    // Also update User's enrolledBatches
    await User.findByIdAndUpdate(uid, { $addToSet: { enrolledBatches: batch._id } });

    res.json({ enrolled: true, count: batch.enrolledStudents.length, message: 'Enrolled successfully!' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/batches/:id/unenroll ─────────────────────────────────────────

export const unenrollBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const uid = String(req.user!._id);
    batch.enrolledStudents = batch.enrolledStudents.filter((s) => String(s) !== uid) as any;
    await batch.save();

    await User.findByIdAndUpdate(uid, { $pull: { enrolledBatches: batch._id } });
    res.json({ enrolled: false, count: batch.enrolledStudents.length });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/batches/:id/announce  — post announcement ────────────────────

export const postAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const uid = String(req.user!._id);
    const tid = String(batch.teacher);
    if (uid !== tid && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not your batch.' }); return;
    }

    const { title, body } = req.body;
    if (!title || !body) { res.status(400).json({ message: 'title and body are required.' }); return; }

    batch.announcements.push({ title, body, createdAt: new Date() });
    await batch.save();
    res.status(201).json(batch.announcements[batch.announcements.length - 1]);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/batches/:id/enroll-student  — admin manually enrolls student ──

export const adminEnrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStaff(req.user?.role)) {
      res.status(403).json({ message: 'Staff only.' }); return;
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const { studentId } = req.body;
    if (!studentId) { res.status(400).json({ message: 'studentId is required.' }); return; }

    if (!batch.enrolledStudents.some((s) => String(s) === String(studentId))) {
      batch.enrolledStudents.push(studentId as never);
      await batch.save();
      await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledBatches: batch._id } });
    }

    res.json({ enrolled: true, count: batch.enrolledStudents.length });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

import mongoose from 'mongoose';
