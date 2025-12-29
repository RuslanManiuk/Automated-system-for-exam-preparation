// Application constants
export const APP_NAME = "ExamNinja";
export const APP_VERSION = "1.0.0";

// XP and Level thresholds
export const XP_THRESHOLDS = {
  STUDENT: 0,
  BACHELOR: 500,
  MASTER: 1500,
  PROFESSOR: 3000,
} as const;

export const XP_PER_LEVEL = 1000;

// XP rewards
export const XP_REWARDS = {
  MATERIAL_PROCESSED: 50,
  FLASHCARD_CORRECT: 10,
  QUIZ_COMPLETION: (score: number) => Math.round(score),
  STREAK_BONUS: (streak: number) => Math.min(streak * 5, 50),
} as const;

// Quiz configuration
export const QUIZ_CONFIG = {
  DEFAULT_QUESTION_COUNT: 10,
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 20,
  DIFFICULTIES: ["easy", "medium", "hard"] as const,
  DEFAULT_DIFFICULTY: "medium",
} as const;

// Flashcard configuration
export const FLASHCARD_CONFIG = {
  REVIEW_INTERVALS: {
    NEW: 0,
    LEARNING: 10 * 60 * 1000, // 10 minutes
    MASTERED: 24 * 60 * 60 * 1000, // 24 hours
  },
  STATUSES: ["new", "learning", "mastered"] as const,
} as const;

// File upload limits
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_EXTENSIONS: [".pdf", ".docx", ".pptx", ".txt", ".md"],
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
    "text/x-markdown",
  ],
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Animation durations (in ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  MATERIAL: "examninja_material",
  STATS: "examninja_stats",
  THEME: "examninja_theme",
  LANGUAGE: "examninja_language",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  UPLOAD: "/upload",
  DASHBOARD: "/dashboard",
  AUTH_CALLBACK: "/auth/callback",
} as const;

// Ukrainian translations for levels
export const LEVEL_NAMES = {
  STUDENT: "Студент",
  BACHELOR: "Бакалавр",
  MASTER: "Магістр",
  PROFESSOR: "Професор",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Помилка мережі. Перевірте підключення до інтернету.",
  AUTH_REQUIRED: "Необхідна авторизація. Будь ласка, увійдіть в систему.",
  INVALID_FILE: "Непідтримуваний формат файлу.",
  FILE_TOO_LARGE: "Файл занадто великий. Максимальний розмір: 50MB.",
  PROCESSING_ERROR: "Помилка обробки. Спробуйте ще раз.",
  SERVER_ERROR: "Помилка сервера. Спробуйте пізніше.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  MATERIAL_SAVED: "Матеріал успішно збережено!",
  QUIZ_COMPLETED: "Тест завершено!",
  PROFILE_UPDATED: "Профіль оновлено!",
} as const;
