import express from 'express';
import {
  getProgress,
  completeStage,
  completeSession,
  getDailyQuiz,
  completeDailyQuiz,
} from '../controllers/progress.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Apply auth middleware to all progress routes
router.use(protect);

router.get('/', getProgress);
router.get('/daily-quiz', getDailyQuiz);
router.post('/daily-quiz/complete', completeDailyQuiz);
router.post('/stage/:stageId/complete', completeStage);
router.post('/stage/:stageId/session/:sessionNumber/complete', completeSession);

export default router;
