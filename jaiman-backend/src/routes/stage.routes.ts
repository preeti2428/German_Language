import express from 'express';
import { getStage, seedInitialStage, getStagesBySection, getSession } from '../controllers/stage.controller';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Protected route to get all stages for a section
router.get('/section/:tier', protect, getStagesBySection);

// Public route to get a specific stage (for onboarding)
router.get('/:tier/:number', getStage);

// Protected route to get a specific session
router.get('/:tier/:stageNumber/:sessionNumber', protect, getSession);

// Admin route to seed initial content
router.post('/seed', protect, admin, seedInitialStage);

export default router;
