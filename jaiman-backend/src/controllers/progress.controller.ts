import { Request, Response } from 'express';
import UserProgress from '../models/UserProgress';
import Stage from '../models/Stage';
import User from '../models/User';

/** Local calendar date as YYYY-MM-DD. */
function dayString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * The one place XP, streak, and daily activity are recorded.
 *
 * The User schema always had streak.current/longest and activityHistory —
 * nothing ever wrote to them, so every device showed a different streak from
 * localStorage. Now every completed session updates the account itself:
 * streak extends on consecutive days, resets after a gap, and today's XP
 * accumulates in activityHistory (which the dashboard's week strip and daily
 * goal ring read after login).
 */
async function recordDailyActivity(userId: string, xpEarned: number): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const today = dayString(now);
  const lastStr = user.streak?.lastActiveDate ? dayString(new Date(user.streak.lastActiveDate)) : null;

  if (lastStr !== today) {
    const yesterday = dayString(new Date(now.getTime() - 86400000));
    user.streak.current = lastStr === yesterday ? (user.streak.current || 0) + 1 : 1;
    user.streak.longest = Math.max(user.streak.longest || 0, user.streak.current);
    user.streak.lastActiveDate = now;
  }

  const entry = user.activityHistory.find((a) => a.date === today);
  if (entry) entry.xpEarned += xpEarned;
  else user.activityHistory.push({ date: today, xpEarned, reelsWatched: 0 });
  if (user.activityHistory.length > 90) {
    user.activityHistory = user.activityHistory.slice(-90);
  }

  user.xp = (user.xp || 0) + xpEarned;
  await user.save();
}


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

      // XP + streak + daily activity, recorded on the account itself
      await recordDailyActivity(String(userId), Number(xpEarned) || 0);

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
    if (stageProg && !stageProg.completedSessions.includes(Number(sessionNumber))) {
      stageProg.completedSessions.push(Number(sessionNumber));
      progress.totalXp += Number(xpEarned) || 0;

      // XP + streak + daily activity, recorded on the account itself
      await recordDailyActivity(String(userId), Number(xpEarned) || 0);

      await progress.save();
    }

    res.json({ message: 'Session completed successfully', progress });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate a 5-minute daily quiz from all questions and vocab learned so far
// @route   GET /api/progress/daily-quiz
// @access  Private
export const getDailyQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const progress = await UserProgress.findOne({ userId });
    
    // Get all stages the user has interacted with, plus stage 1 & 2 as baseline
    const stages = await Stage.find({ tier: 'A1' }).sort({ stageNumber: 1 });
    
    if (!stages || stages.length === 0) {
      res.status(404).json({ message: 'No stages available' });
      return;
    }

    // Collect all learned or active vocabulary
    const allVocab: { word: string; translation: string; gender?: string; cityName?: string }[] = [];
    const allExercises: any[] = [];

    stages.forEach((st) => {
      if (st.vocabSet && Array.isArray(st.vocabSet)) {
        st.vocabSet.forEach((v) => {
          if (v.word && v.translation) {
            allVocab.push({
              word: v.word,
              translation: v.translation,
              gender: v.gender,
              cityName: st.cityNameDe || st.cityName,
            });
          }
        });
      }

      if (st.sessions && Array.isArray(st.sessions)) {
        st.sessions.forEach((s) => {
          if (s.exercises && Array.isArray(s.exercises)) {
            s.exercises.forEach((ex) => {
              if (ex.prompt && ex.correctAnswer && Array.isArray(ex.options) && ex.options.length >= 2) {
                allExercises.push({
                  type: ex.type || 'multiple_choice',
                  prompt: ex.prompt,
                  options: ex.options,
                  correctAnswer: ex.correctAnswer,
                  points: ex.points || 10,
                  context: `${st.cityNameDe} · ${s.title}`,
                });
              }
            });
          }
        });
      }
    });

    const quizQuestions: any[] = [];

    // 1. Generate vocab meaning questions
    if (allVocab.length >= 4) {
      const shuffledVocab = [...allVocab].sort(() => Math.random() - 0.5);
      
      shuffledVocab.slice(0, 4).forEach((v, idx) => {
        // Find 3 incorrect translations
        const otherTranslations = allVocab
          .filter((ov) => ov.translation !== v.translation)
          .map((ov) => ov.translation)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        if (otherTranslations.length >= 3) {
          const options = [v.translation, ...otherTranslations].sort(() => Math.random() - 0.5);
          quizQuestions.push({
            id: `q-vocab-de-${idx}`,
            type: 'translate_de_en',
            prompt: `Was bedeutet "${v.word}" auf Englisch?`,
            targetWord: v.word,
            options,
            correctAnswer: v.translation,
            points: 10,
            tip: `From ${v.cityName}`,
          });
        }

        // Gender question if der/die/das
        if (v.gender && ['der', 'die', 'das'].includes(v.gender)) {
          quizQuestions.push({
            id: `q-gender-${idx}`,
            type: 'gender',
            prompt: `Welcher Artikel gehört zu "${v.word}"?`,
            targetWord: v.word,
            options: ['der', 'die', 'das'],
            correctAnswer: v.gender,
            points: 10,
            tip: `Gender in German (${v.translation})`,
          });
        }
      });
    }

    // 2. Add real session exercises if available
    if (allExercises.length > 0) {
      const shuffledEx = [...allExercises].sort(() => Math.random() - 0.5);
      shuffledEx.slice(0, 3).forEach((ex, idx) => {
        quizQuestions.push({
          id: `q-ex-${idx}`,
          type: ex.type,
          prompt: ex.prompt,
          options: ex.options,
          correctAnswer: ex.correctAnswer,
          points: ex.points || 10,
          tip: ex.context,
        });
      });
    }

    // Return all questions generated for continuous 5-minute practice
    const finalQuestions = quizQuestions.sort(() => Math.random() - 0.5);

    res.json({
      questions: finalQuestions,
      totalCount: finalQuestions.length,
      durationSeconds: 300, // 5 minutes
      xpReward: 40,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record completion of 5-minute daily quiz & award XP/time
// @route   POST /api/progress/daily-quiz/complete
// @access  Private
export const completeDailyQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { xpEarned = 40, timeSpent = 300 } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const secondsCompleted = Number(timeSpent) || 300;
    const isGoalMet = secondsCompleted >= 300;

    if (isGoalMet) {
      user.streak.dailyQuizCompletedDate = today;
      user.streak.dailyTimeSpent = 300;
    } else {
      user.streak.dailyTimeSpent = Math.min(300, (user.streak.dailyTimeSpent || 0) + secondsCompleted);
    }
    user.streak.lastActiveDate = new Date();

    // Award XP
    await recordDailyActivity(String(userId), Number(xpEarned) || 40);

    res.json({
      success: true,
      message: '5-Minute Daily Practice completed!',
      xpEarned: Number(xpEarned) || 40,
      dailyTimeSpent: user.streak.dailyTimeSpent,
      dailyQuizCompletedDate: user.streak.dailyQuizCompletedDate,
      goalMet: isGoalMet,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

