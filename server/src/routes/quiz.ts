import express from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { QuizResult } from "../models/QuizResult.js";

const router = express.Router();

// Save quiz result (завершений тест)
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { quizId, ...quizData } = req.body;

    let quizResult;
    if (quizId) {
      // Оновити існуючий тест як завершений
      quizResult = await QuizResult.findOneAndUpdate(
        { _id: quizId, userId: req.userId },
        {
          ...quizData,
          userId: req.userId,
          isCompleted: true,
          completedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Створити новий завершений тест
      quizResult = new QuizResult({
        ...quizData,
        userId: req.userId,
        isCompleted: true,
        completedAt: new Date(),
      });
      await quizResult.save();
    }

    res.status(201).json(quizResult);
  } catch (error) {
    console.error("Save quiz result error:", error);
    res.status(500).json({ error: "Помилка збереження результату тесту" });
  }
});

// Get quiz results for a material
router.get(
  "/material/:materialId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const results = await QuizResult.find({
        userId: req.userId,
        materialId: req.params.materialId,
      }).sort({ updatedAt: -1 });

      res.json(results);
    } catch (error) {
      console.error("Get quiz results error:", error);
      res.status(500).json({ error: "Помилка отримання результатів тестів" });
    }
  }
);

// Save quiz progress (для незавершених тестів)
router.post("/save-progress", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { quizId, currentQuestionIndex, answers, materialId } = req.body;

    let quiz;
    if (quizId) {
      // Оновити існуючий тест
      quiz = await QuizResult.findOneAndUpdate(
        { _id: quizId, userId: req.userId },
        {
          currentQuestionIndex,
          answers,
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else {
      // Створити новий незавершений тест
      quiz = new QuizResult({
        userId: req.userId,
        materialId,
        currentQuestionIndex,
        answers,
        isCompleted: false,
        totalQuestions: 0,
        correctAnswers: 0,
        scorePercentage: 0,
      });
      await quiz.save();
    }

    res.json(quiz);
  } catch (error) {
    console.error("Save quiz progress error:", error);
    res.status(500).json({ error: "Помилка збереження прогресу тесту" });
  }
});

// Resume quiz (продовжити тест)
router.get("/:quizId/resume", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const quiz = await QuizResult.findOne({
      _id: req.params.quizId,
      userId: req.userId,
      isCompleted: false,
    });

    if (!quiz) {
      return res
        .status(404)
        .json({ error: "Тест не знайдено або вже завершено" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Resume quiz error:", error);
    res.status(500).json({ error: "Помилка відновлення тесту" });
  }
});

// Get all quiz results for user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const results = await QuizResult.find({ userId: req.userId })
      .sort({ completedAt: -1 })
      .limit(20);

    res.json(results);
  } catch (error) {
    console.error("Get all quiz results error:", error);
    res.status(500).json({ error: "Помилка отримання результатів" });
  }
});

// Get quiz statistics
router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const results = await QuizResult.find({ userId: req.userId });

    const stats = {
      totalQuizzes: results.length,
      averageScore:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.scorePercentage, 0) /
            results.length
          : 0,
      totalQuestions: results.reduce((sum, r) => sum + r.totalQuestions, 0),
      totalCorrect: results.reduce((sum, r) => sum + r.correctAnswers, 0),
    };

    res.json(stats);
  } catch (error) {
    console.error("Get quiz stats error:", error);
    res.status(500).json({ error: "Помилка отримання статистики" });
  }
});

export default router;
