import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  updateModule,
  deleteModule,
  addLecture,
  addNote,
  addDPP,
} from '../controllers/module.controller';

const router = Router();

router.patch('/:id', protect, updateModule);
router.delete('/:id', protect, deleteModule);
router.post('/:id/lectures', protect, addLecture);
router.post('/:id/notes', protect, addNote);
router.post('/:id/dpp', protect, addDPP);

export default router;
