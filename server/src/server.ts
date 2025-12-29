import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database.js";
import { configurePassport } from "./config/passport.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import materialRoutes from "./routes/materials.js";
import chatRoutes from "./routes/chat.js";
import quizRoutes from "./routes/quiz.js";
import openrouterRoutes from "./routes/openrouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;

/** Simple in-memory rate limiter middleware */
const rateLimiter = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Забагато запитів. Спробуйте пізніше.",
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count++;
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000);

app.use(rateLimiter);
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "https://examninja-frontend.onrender.com"
        : [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
          ],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.use(cookieParser());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
configurePassport();

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/openrouter", openrouterRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: {
        message: err.message || "Внутрішня помилка сервера",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
  }
);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не знайдено" });
});

/** Starts Express server and connects to MongoDB */
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущено на порті ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Не вдалося запустити сервер:", error);
    process.exit(1);
  }
};

startServer();

export default app;
