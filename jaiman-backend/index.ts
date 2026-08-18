import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './src/config/db';
import authRoutes from './src/routes/auth.routes';
import userRoutes from './src/routes/user.routes';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'jaiman-backend is running smoothly with TypeScript!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
