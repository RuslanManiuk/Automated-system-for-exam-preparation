export enum UserLevel {
  STUDENT = "Студент",
  BACHELOR = "Бакалавр",
  MASTER = "Магістр",
  PROFESSOR = "Професор",
}

export interface UserStats {
  xp: number;
  level: UserLevel;
  streak: number;
  achievements: string[];
  cardsLearned: number;
  testsPassed: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status: "new" | "learning" | "mastered";
  nextReview?: number; // timestamp
}

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_in_the_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  feedback: string;
  recommendations: string[];
  // Added for review mode
  userAnswers?: Record<string, string>;
  questions?: QuizQuestion[];
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  originalContent: string;
  summary: string;
  glossary: { term: string; definition: string }[];
  keyFacts: string[];
  mindMap: MindMapNode;
  flashcards: Flashcard[];
  createdAt: number;
  file?: {
    originalName?: string;
    mime?: string;
    size?: number;
    path?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  synced?: boolean; // indicates if message was persisted to backend
}

export type ViewMode = "home" | "upload" | "dashboard";
export type DashboardTab =
  | "overview"
  | "stats"
  | "materials"
  | "flashcards"
  | "quiz"
  | "quiz-history"
  | "mindmap"
  | "glossary"
  | "chat";
