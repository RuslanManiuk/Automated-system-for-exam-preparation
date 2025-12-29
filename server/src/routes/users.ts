import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { calculateLevel, updateStreak } from '../utils/helpers.js';

const router = express.Router();

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Помилка отримання даних користувача' });
  }
});

// Update user stats
router.patch('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { xpDelta, cardsLearned, testsPassed } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    // Update XP
    if (xpDelta) {
      user.stats.xp += xpDelta;
      user.stats.level = calculateLevel(user.stats.xp);
    }

    // Update cards learned
    if (cardsLearned) {
      user.stats.cardsLearned += cardsLearned;
    }

    // Update tests passed
    if (testsPassed) {
      user.stats.testsPassed += testsPassed;
    }

    // Update streak
    const streakUpdate = updateStreak(user.stats.lastActiveDate);
    if (streakUpdate.streak > 0) {
      user.stats.streak = streakUpdate.streak === 1 && user.stats.lastActiveDate 
        ? user.stats.streak + 1 
        : 1;
      user.stats.lastActiveDate = streakUpdate.lastActiveDate;
    }

    await user.save();

    res.json(user.stats);
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Помилка оновлення статистики' });
  }
});

// Add achievement
router.post('/achievements', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { achievement } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    if (!user.stats.achievements.includes(achievement)) {
      user.stats.achievements.push(achievement);
      await user.save();
    }

    res.json(user.stats);
  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({ error: 'Помилка додавання досягнення' });
  }
});

export default router;
