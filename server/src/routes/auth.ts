import express, { Request, Response } from "express";
import { body } from "express-validator";
import passport from "passport";
import { User } from "../models/User.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
} from "../utils/helpers.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Невірний email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Пароль повинен містити мінімум 6 символів"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Ім'я користувача обов'язкове"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Користувач з таким email вже існує" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        username,
        stats: {
          xp: 0,
          level: "Студент",
          streak: 0,
          achievements: [],
          cardsLearned: 0,
          testsPassed: 0,
        },
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id.toString());

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          stats: user.stats,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Помилка при реєстрації" });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Невірний email"),
    body("password").notEmpty().withMessage("Пароль обов'язковий"),
  ],
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Невірний email або пароль" });
      }

      // Check password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Невірний email або пароль" });
      }

      // Generate token
      const token = generateToken(user._id.toString());

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          stats: user.stats,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Помилка при вході" });
    }
  }
);

// Get Profile (protected route)
router.get("/profile", authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      stats: user.stats,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Помилка при отриманні профілю" });
  }
});

// Google OAuth - Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google OAuth - Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req: any, res: Response) => {
    try {
      const user = req.user;
      const token = generateToken(user._id.toString());

      // Redirect to frontend with token (use root path for static site)
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/?auth=callback&token=${token}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect("/?error=auth_failed");
    }
  }
);

export default router;
