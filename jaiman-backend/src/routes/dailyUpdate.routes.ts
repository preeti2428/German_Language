import { Router, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  listUpdates,
  createUpdate,
  patchUpdate,
  deleteUpdate,
  adminStats,
} from '../controllers/dailyUpdate.controller';

const router = Router();

const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Admin only.' });
};

// ─── Public / learner ─────────────────────────────────────────────────────────
router.get('/', protect, listUpdates);

// ─── Admin stats ──────────────────────────────────────────────────────────────
router.get('/admin-stats', protect, adminOnly, adminStats);

// ─── Admin CRUD ───────────────────────────────────────────────────────────────
router.post('/', protect, adminOnly, createUpdate);
router.patch('/:id', protect, adminOnly, patchUpdate);
router.delete('/:id', protect, adminOnly, deleteUpdate);

export default router;
