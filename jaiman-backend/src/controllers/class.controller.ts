import { Response } from 'express';
import ClassModel from '../models/Class';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Live classes with real meeting links.
 *
 * Scheduling is admin/teacher-only. If the scheduler doesn't paste a Zoom or
 * Google Meet link, a Jitsi Meet room is generated automatically — Jitsi is
 * free, needs no account or API key, and a room exists the moment someone
 * opens its URL. Students enroll, and the frontend shows Join once the class
 * is about to start.
 */

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export const listClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = String(req.user?._id ?? '');
    // Live classes from the last 2 hours onward (so an in-progress class still shows).
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const live = await ClassModel.find({ type: 'live', scheduledAt: { $gte: cutoff } })
      .sort({ scheduledAt: 1 })
      .populate('teacher', 'name');
    const vods = await ClassModel.find({ type: 'vod' }).sort({ createdAt: -1 }).limit(24);

    res.json({
      live: live.map((c) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        level: c.level,
        scheduledAt: c.scheduledAt,
        duration: c.duration ?? 45,
        meetingUrl: c.meetingUrl,
        enrolled: c.participants.length,
        isEnrolled: c.participants.some((p) => String(p) === me),
        teacher: (c.teacher as unknown as { name?: string })?.name ?? 'Jai',
      })),
      vods,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, level, description, scheduledAt, duration, meetingUrl } = req.body ?? {};
    if (!title || !scheduledAt) {
      res.status(400).json({ message: 'A class needs at least a title and a date/time.' });
      return;
    }
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      res.status(400).json({ message: 'Invalid date/time.' });
      return;
    }

    // No link pasted → generate a Jitsi room unique to this class.
    const url =
      typeof meetingUrl === 'string' && meetingUrl.trim().startsWith('http')
        ? meetingUrl.trim()
        : `https://meet.jit.si/GermanJai-${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`;

    const classData: Record<string, any> = {
      teacher: req.user!._id,
      title: String(title).slice(0, 120),
      type: 'live',
      level: level || 'A1',
      scheduledAt: when,
      duration: Number(duration) || 45,
      meetingUrl: url,
      participants: [],
      tags: [],
    };
    if (description) {
      classData.description = String(description).slice(0, 500);
    }

    const created = await ClassModel.create(classData);

    res.status(201).json({ id: (created as any)._id, meetingUrl: url });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const toggleEnroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const c = await ClassModel.findById(req.params.id);
    if (!c) {
      res.status(404).json({ message: 'Class not found' });
      return;
    }
    const me = String(req.user!._id);
    const idx = c.participants.findIndex((p) => String(p) === me);
    if (idx >= 0) c.participants.splice(idx, 1);
    else c.participants.push(req.user!._id as never);
    await c.save();
    res.json({ enrolled: idx < 0, count: c.participants.length });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const c = await ClassModel.findByIdAndDelete(req.params.id);
    if (!c) {
      res.status(404).json({ message: 'Class not found' });
      return;
    }
    res.json({ message: 'Class deleted' });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};
