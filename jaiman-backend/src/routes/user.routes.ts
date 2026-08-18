import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
