import { Router, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  listBatches,
  myBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  enrollBatch,
  unenrollBatch,
  postAnnouncement,
  adminEnrollStudent,
} from '../controllers/batch.controller';
import {
  listModules,
  createModule,
} from '../controllers/module.controller';
import { seedDefaultBatches } from '../controllers/seed.controller';

const router = Router();

/** Only teachers and admins can create/manage batches */
const staff = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) next();
  else res.status(403).json({ message: 'Only a teacher or admin can do that.' });
};

// ─── Seed (admin only) ───────────────────────────────────────────────────────
router.post('/seed', protect, staff, seedDefaultBatches);

// ─── Batch CRUD ───────────────────────────────────────────────────────────────
router.get('/', listBatches);                           // public catalog
router.get('/my', protect, myBatches);                  // enrolled batches (student)
router.get('/:id', getBatch);                           // batch detail (public but gated)
router.post('/', protect, staff, createBatch);          // create batch
router.patch('/:id', protect, staff, updateBatch);      // update batch
router.delete('/:id', protect, staff, deleteBatch);     // delete batch

// ─── Enrollment ───────────────────────────────────────────────────────────────
router.post('/:id/enroll', protect, enrollBatch);                   // student self-enroll
router.post('/:id/unenroll', protect, unenrollBatch);               // student unenroll
router.post('/:id/enroll-student', protect, staff, adminEnrollStudent); // admin manually enroll

// ─── Announcements ────────────────────────────────────────────────────────────
router.post('/:id/announce', protect, staff, postAnnouncement);

// ─── Modules under a batch ────────────────────────────────────────────────────
router.get('/:batchId/modules', protect, listModules);
router.post('/:batchId/modules', protect, staff, createModule);

export default router;
