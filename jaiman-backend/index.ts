import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './src/config/db';
import authRoutes from './src/routes/auth.routes';
import userRoutes from './src/routes/user.routes';
import reelRoutes from './src/routes/reel.routes';
import stageRoutes from './src/routes/stage.routes';
import progressRoutes from './src/routes/progress.routes';
import chatRoutes from './src/routes/chat.routes';
import classRoutes from './src/routes/class.routes';
import batchRoutes from './src/routes/batch.routes';
import moduleRoutes from './src/routes/module.routes';
import bookingRoutes from './src/routes/booking.routes';
import dailyUpdateRoutes from './src/routes/dailyUpdate.routes';
import quizRoutes from './src/routes/quiz.routes';
import testRoutes from './src/routes/test.routes';
import writingRoutes from './src/routes/writing.routes';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/updates', dailyUpdateRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/writing', writingRoutes);

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'jaiman-backend is running smoothly with TypeScript!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
