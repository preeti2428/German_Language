import { Request, Response } from 'express';
import UserProgress from '../models/UserProgress';
import Stage from '../models/Stage';
import User from '../models/User';

// @desc    Get user progress
// @route   GET /api/progress
// @access  Private
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id; // Assuming authMiddleware attaches user
    
    let progress = await UserProgress.findOne({ userId }).populate('completedStages unlockedStages');
    
    if (!progress) {
      // Create initial progress if it doesn't exist
      progress = await UserProgress.create({
        userId,
        currentTier: 'A1',
        completedStages: [],
        unlockedStages: [],
        totalXp: 0
      });
    }

    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete a stage and award XP
// @route   POST /api/progress/stage/:stageId/complete
// @access  Private
export const completeStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { stageId } = req.params;
    const { xpEarned } = req.body;

    const stage = await Stage.findById(stageId);
    if (!stage) {
      res.status(404).json({ message: 'Stage not found' });
      return;
    }

    let progress = await UserProgress.findOne({ userId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        currentTier: 'A1',
        completedStages: [],
        unlockedStages: [],
        stageProgress: [],
        totalXp: 0
      });
    }

    // Add stage to completed if not already there
    if (!progress.completedStages.includes(stageId as any)) {
      progress.completedStages.push(stageId as any);
      progress.totalXp += Number(xpEarned) || 0;
      
      // Update User global XP for leaderboard
      await User.findByIdAndUpdate(userId, { $inc: { xp: Number(xpEarned) || 0 } });
      
      await progress.save();
    }

    res.json({ message: 'Stage boss completed successfully', progress });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete a session within a stage and award XP
// @route   POST /api/progress/stage/:stageId/session/:sessionNumber/complete
// @access  Private
export const completeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { stageId, sessionNumber } = req.params;
    const { xpEarned } = req.body;

    const stage = await Stage.findById(stageId);
    if (!stage) {
      res.status(404).json({ message: 'Stage not found' });
      return;
    }

    let progress = await UserProgress.findOne({ userId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        currentTier: 'A1',
        completedStages: [],
        unlockedStages: [],
        stageProgress: [],
        totalXp: 0
      });
    }

    // Find or create stageProgress entry
    let stageProg = progress.stageProgress.find(sp => sp.stageId.toString() === stageId);
    if (!stageProg) {
      progress.stageProgress.push({ stageId: stageId as any, completedSessions: [] });
      stageProg = progress.stageProgress[progress.stageProgress.length - 1];
    }

    // Add session to completed if not already there
    if (!stageProg.completedSessions.includes(Number(sessionNumber))) {
      stageProg.completedSessions.push(Number(sessionNumber));
      progress.totalXp += Number(xpEarned) || 0;
      
      // Update User global XP for leaderboard
      await User.findByIdAndUpdate(userId, { $inc: { xp: Number(xpEarned) || 0 } });
      
      await progress.save();
    }

    res.json({ message: 'Session completed successfully', progress });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
