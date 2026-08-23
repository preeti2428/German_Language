import express from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';
import { forgotPassword, resetPassword } from '../controllers/password.controller';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

export default router;
