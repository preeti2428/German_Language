import { Router } from 'express';
import { listWritingTasks, getWritingTask, checkWriting, seedWritingTasks } from '../controllers/writing.controller';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// GET  /api/writing/tasks              → list all writing tasks (filtered by ?level=A1)
router.get('/tasks', protect, listWritingTasks);

// POST /api/writing/tasks/seed         → seed writing tasks
router.post('/tasks/seed', protect, seedWritingTasks);

// GET  /api/writing/tasks/:id          → get single task (no model answer)
router.get('/tasks/:id', protect, getWritingTask);

// POST /api/writing/check              → AI writing check
router.post('/check', protect, checkWriting);

export default router;
