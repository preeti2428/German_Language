import { Response } from 'express';
import ModuleModel from '../models/Module';
import Batch from '../models/Batch';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── Helper: check if user owns the batch ────────────────────────────────────

const canManageBatch = async (batchId: string, userId: string, role: string): Promise<boolean> => {
  const batch = await Batch.findById(batchId);
  if (!batch) return false;
  return String(batch.teacher) === userId || role === 'admin';
};

// ─── GET /api/batches/:batchId/modules ───────────────────────────────────────

export const listModules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId);
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const uid = String(req.user?._id ?? '');
    const isEnrolled = batch.enrolledStudents.some((s) => String(s) === uid);
    const isOwner = String(batch.teacher) === uid || req.user?.role === 'admin';

    const modules = await ModuleModel.find({ batch: String(batchId) }).sort({ order: 1 });

    // Non-enrolled users only get free lectures, notes hidden, DPP hidden
    if (!isEnrolled && !isOwner) {
      const filtered = modules.map((m) => ({
        _id: m._id,
        title: m.title,
        order: m.order,
        lectures: m.lectures.filter((l) => l.isFree),
        notes: [],
        dpp: [],
      }));
      res.json(filtered);
      return;
    }

    res.json(modules);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/batches/:batchId/modules ─────────────────────────────────────

export const createModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batchId = req.params.batchId as string;
    const ok = await canManageBatch(batchId, String(req.user!._id), req.user!.role);
    if (!ok) { res.status(403).json({ message: 'Not authorised.' }); return; }

    const { title, order } = req.body;
    if (!title) { res.status(400).json({ message: 'title is required.' }); return; }

    const mod = await ModuleModel.create({
      batch: batchId,
      title,
      order: Number(order) || 0,
      lectures: [],
      notes: [],
      dpp: [],
    });

    // Push module ref into batch
    await Batch.findByIdAndUpdate(batchId, { $push: { modules: (mod as any)._id } });

    res.status(201).json(mod);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PATCH /api/modules/:id ──────────────────────────────────────────────────

export const updateModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await ModuleModel.findById(req.params.id);
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return; }

    const ok = await canManageBatch(String(mod.batch), String(req.user!._id), req.user!.role);
    if (!ok) { res.status(403).json({ message: 'Not authorised.' }); return; }

    const allowed = ['title', 'order', 'lectures', 'notes', 'dpp'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) (mod as any)[k] = req.body[k]; });
    await mod.save();
    res.json(mod);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/modules/:id ─────────────────────────────────────────────────

export const deleteModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await ModuleModel.findById(req.params.id);
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return; }

    const ok = await canManageBatch(String(mod.batch), String(req.user!._id), req.user!.role);
    if (!ok) { res.status(403).json({ message: 'Not authorised.' }); return; }

    await Batch.findByIdAndUpdate(mod.batch, { $pull: { modules: mod._id } });
    await ModuleModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Module deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/modules/:id/lectures ──────────────────────────────────────────

export const addLecture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await ModuleModel.findById(req.params.id);
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return; }

    const ok = await canManageBatch(String(mod.batch), String(req.user!._id), req.user!.role);
    if (!ok) { res.status(403).json({ message: 'Not authorised.' }); return; }

    const { title, videoUrl, duration, isFree, order } = req.body;
    if (!title || !videoUrl) { res.status(400).json({ message: 'title and videoUrl required.' }); return; }

    mod.lectures.push({ title, videoUrl, duration: Number(duration) || undefined, isFree: !!isFree, order: Number(order) || mod.lectures.length });
    await mod.save();
    res.status(201).json(mod.lectures[mod.lectures.length - 1]);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/modules/:id/notes ─────────────────────────────────────────────

export const addNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await ModuleModel.findById(req.params.id);
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return; }

    const ok = await canManageBatch(String(mod.batch), String(req.user!._id), req.user!.role);
    if (!ok) { res.status(403).json({ message: 'Not authorised.' }); return; }

    const { title, fileUrl, content } = req.body;
    if (!title) { res.status(400).json({ message: 'title required.' }); return; }

    mod.notes.push({ title, fileUrl, content });
    await mod.save();
    res.status(201).json(mod.notes[mod.notes.length - 1]);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/modules/:id/dpp ───────────────────────────────────────────────

export const addDPP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mod = await ModuleModel.findById(req.params.id);
    if (!mod) { res.status(404).json({ message: 'Module not found' }); return; }

    const ok = await canManageBatch(String(mod.batch), String(req.user!._id), req.user!.role);
    if (!ok) { res.status(403).json({ message: 'Not authorised.' }); return; }

    const { question, options, correctAnswer, explanation } = req.body;
    if (!question || !correctAnswer) { res.status(400).json({ message: 'question and correctAnswer required.' }); return; }

    mod.dpp.push({ question, options: options ?? [], correctAnswer, explanation });
    await mod.save();
    res.status(201).json(mod.dpp[mod.dpp.length - 1]);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
