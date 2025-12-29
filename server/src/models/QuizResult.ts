import mongoose, { Schema, Document } from "mongoose";

interface IQuizAnswer {
  questionId: string;
  question: string;
  options: string[];
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
}

export interface IQuizResult extends Document {
  userId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  feedback: string;
  answers: IQuizAnswer[];

  // Поля для незавершених тестів
  isCompleted: boolean;
  currentQuestionIndex: number;

  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizResultSchema = new Schema<IQuizResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
      index: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    scorePercentage: {
      type: Number,
      required: true,
    },
    feedback: {
      type: String,
      default: "",
    },
    answers: [
      {
        questionId: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        userAnswer: { type: Schema.Types.Mixed },
        correctAnswer: { type: Schema.Types.Mixed, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for analytics
quizResultSchema.index({ userId: 1, completedAt: -1 });

export const QuizResult = mongoose.model<IQuizResult>(
  "QuizResult",
  quizResultSchema
);
