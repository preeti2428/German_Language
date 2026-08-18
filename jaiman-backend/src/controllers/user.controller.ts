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
      streak: req.user.streak,
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
      if (req.body.preferences !== undefined) user.preferences = { ...user.preferences, ...req.body.preferences };
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
        streak: updatedUser.streak,
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
