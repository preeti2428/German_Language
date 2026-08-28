import { Router } from 'express';
import { getLevelTest, submitLevelTest, getListeningExercises, getSpeakingExercises } from '../controllers/quiz.controller';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// GET  /api/quiz/level-test       → 30 placement questions (public)
router.get('/level-test', getLevelTest);

// POST /api/quiz/level-test/submit → grade + optionally update user.level
router.post('/level-test/submit', protect, submitLevelTest);

// GET  /api/quiz/listening?tier=A1 → listening exercises for the lab
router.get('/listening', protect, getListeningExercises);

export default router;
