import express from 'express';
import { getUserProfile, updateUserProfile, watchReel } from '../controllers/user.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/reels/watch')
  .post(protect, watchReel);

export default router;
