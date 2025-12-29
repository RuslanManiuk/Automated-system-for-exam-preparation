import React, { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
  Trophy,
  Calendar,
} from "lucide-react";
import { api } from "../services/apiClient";

interface QuizHistoryProps {
  materialId: string;
  onResumeQuiz: (quizId: string) => void;
  onStartNewQuiz: () => void;
}

interface SavedQuiz {
  _id: string;
  isCompleted: boolean;
  currentQuestionIndex?: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const QuizHistory: React.FC<QuizHistoryProps> = ({
  materialId,
  onResumeQuiz,
  onStartNewQuiz,
}) => {
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, [materialId]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const results = await api.getQuizResults(materialId);
      setQuizzes(results);
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inProgressQuizzes = quizzes.filter((q) => !q.isCompleted);
  const completedQuizzes = quizzes.filter((q) => q.isCompleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Незавершені тести */}
      {inProgressQuizzes.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Незавершені тести
          </h3>
          <div className="grid gap-4">
            {inProgressQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <PlayCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        В процесі
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                      Прогрес: {quiz.currentQuestionIndex} /{" "}
                      {quiz.totalQuestions || "?"} питань
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Розпочато: {formatDate(quiz.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => onResumeQuiz(quiz._id)}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2 group-hover:scale-105"
                  >
                    Продовжити
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Завершені тести */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-green-500" />
          Завершені тести
        </h3>

        {completedQuizzes.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Ви ще не пройшли жодного тесту по цій темі
            </p>
            <button
              onClick={onStartNewQuiz}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all inline-flex items-center gap-2"
            >
              Почати новий тест
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {completedQuizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                          {quiz.scorePercentage}%
                        </span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          quiz.scorePercentage >= 80
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : quiz.scorePercentage >= 60
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {quiz.scorePercentage >= 80
                          ? "Відмінно"
                          : quiz.scorePercentage >= 60
                          ? "Добре"
                          : "Потрібно попрацювати"}
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                      Правильних відповідей: {quiz.correctAnswers} з{" "}
                      {quiz.totalQuestions}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(quiz.completedAt || quiz.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={onStartNewQuiz}
              className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Пройти тест ще раз
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
