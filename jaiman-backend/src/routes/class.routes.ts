import { Router, Response, NextFunction } from 'express';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { createClass, deleteClass, listClasses, toggleEnroll } from '../controllers/class.controller';

const router = Router();

/** Scheduling and deleting classes is for staff only. */
const staff = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) next();
  else res.status(403).json({ message: 'Only an admin or teacher can do that.' });
};

router.get('/', protect, listClasses);
router.post('/', protect, staff, createClass);
router.post('/:id/enroll', protect, toggleEnroll);
router.delete('/:id', protect, staff, deleteClass);

export default router;
