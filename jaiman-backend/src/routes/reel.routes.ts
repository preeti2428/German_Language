import express from 'express';
import { uploadReel, getReels } from '../controllers/reel.controller';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../config/cloudinary';

const router = express.Router();

// Route to get all reels
router.get('/', protect, getReels);

// Route to upload a new reel (expects a file named 'video')
router.post('/upload', protect, upload.single('video'), uploadReel);

export default router;
