import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { createOrder, verifyPayment } from '../controllers/payment.controller';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

export default router;
