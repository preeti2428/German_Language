import { Router } from 'express';
import { listTests, getTest, submitTest, getResult, seedTestPapers } from '../controllers/test.controller';
import { protect, optionalProtect } from '../middleware/authMiddleware';

const router = Router();

// GET  /api/tests              → list all test papers (public/optional auth)
router.get('/', optionalProtect, listTests);

// POST /api/tests/seed         → seed sample & A1 practice papers
router.post('/seed', optionalProtect, seedTestPapers);

// GET  /api/tests/:id          → get full test (no answers)
router.get('/:id', optionalProtect, getTest);

// POST /api/tests/:id/submit   → grade + save result
router.post('/:id/submit', optionalProtect, submitTest);

// GET  /api/tests/result/:resultId  → get a saved result
router.get('/result/:resultId', optionalProtect, getResult);

export default router;

