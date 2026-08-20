import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      nativeLanguage: req.user.nativeLanguage,
      learningLanguage: req.user.learningLanguage,
      level: req.user.level,
      xp: req.user.xp,
      reelsWatched: req.user.reelsWatched,
      streak: req.user.streak,
      activityHistory: req.user.activityHistory || [],
      preferences: req.user.preferences,
      avatar: req.user.avatar,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.nativeLanguage !== undefined) user.nativeLanguage = req.body.nativeLanguage;
      if (req.body.learningLanguage !== undefined) user.learningLanguage = req.body.learningLanguage;
      if (req.body.level !== undefined) user.level = req.body.level;
      if (req.body.preferences !== undefined) {
        if (req.body.preferences.darkMode !== undefined) {
          user.preferences.darkMode = req.body.preferences.darkMode;
        }
        if (req.body.preferences.notifications !== undefined) {
          user.preferences.notifications = req.body.preferences.notifications;
        }
      }
      if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        nativeLanguage: updatedUser.nativeLanguage,
        learningLanguage: updatedUser.learningLanguage,
        level: updatedUser.level,
        xp: updatedUser.xp,
        reelsWatched: updatedUser.reelsWatched,
        streak: updatedUser.streak,
        activityHistory: updatedUser.activityHistory || [],
        preferences: updatedUser.preferences,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Increment reels watched
// @route   POST /api/users/reels/watch
// @access  Private
export const watchReel = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    const user = await User.findById(req.user._id);

    if (user) {
      user.reelsWatched = (user.reelsWatched || 0) + 1;
      user.xp = (user.xp || 0) + 10; // Give 10 XP for watching a reel
      
      // Update activity history
      const today = new Date().toISOString().split('T')[0] as string;
      const activityIndex = user.activityHistory ? user.activityHistory.findIndex(a => a.date === today) : -1;
      
      if (user.activityHistory && activityIndex > -1) {
        user.activityHistory![activityIndex]!.reelsWatched += 1;
        user.activityHistory![activityIndex]!.xpEarned += 10;
      } else if (user.activityHistory) {
        user.activityHistory.push({
          date: today,
          xpEarned: 10,
          reelsWatched: 1
        });
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        xp: updatedUser.xp,
        reelsWatched: updatedUser.reelsWatched,
        streak: updatedUser.streak,
        activityHistory: updatedUser.activityHistory,
        level: updatedUser.level,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
