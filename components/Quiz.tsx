import React, { useState, useEffect, useCallback } from "react";
import { QuizQuestion, QuizResult } from "../types";
import {
  Check,
  X,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import { generateQuiz } from "../services/grokService";
import { api } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useQuizShortcuts } from "../hooks/useKeyboardShortcuts";

interface QuizProps {
  content: string;
  materialId?: string;
  resumeQuizId?: string;
  onFinish: (result: QuizResult) => void;
  onBack: () => void;
}

export const Quiz: React.FC<QuizProps> = ({
  content,
  materialId,
  resumeQuizId,
  onFinish,
  onBack,
}) => {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isInputSubmitted, setIsInputSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | undefined>(
    resumeQuizId
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    resumeQuizId ? "medium" : null
  );

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);

      // Спроба відновити незавершений тест
      if (resumeQuizId && isAuthenticated) {
        try {
          const savedQuiz = await api.resumeQuiz(resumeQuizId);
          if (savedQuiz) {
            // Відновлення стану з збереженого тесту
            setCurrentQIndex(savedQuiz.currentQuestionIndex || 0);
            setUserAnswers(
              savedQuiz.answers?.reduce((acc: any, ans: any) => {
                acc[ans.questionId] = ans.userAnswer;
                return acc;
              }, {}) || {}
            );
            // Генеруємо питання знову (або зберігайте їх у БД)
            if (content && content.trim().length > 0) {
              try {
                const qs = await generateQuiz(content, "medium");
                setQuestions(qs);
              } catch (error) {
                console.error("Failed to generate quiz from resumed content:", error);
              }
            }
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to resume quiz:", error);
        }
      }

      // Якщо складність не вибрана, не генеруємо питання
      if (!selectedDifficulty) {
        setLoading(false);
        return;
      }

      // Перевір що контент не порожній
      if (!content || content.trim().length === 0) {
        console.error("Content is empty, cannot generate quiz");
        setLoading(false);
        return;
      }

      try {
        const qs = await generateQuiz(content, selectedDifficulty);
        setQuestions(qs);
      } catch (error) {
        console.error("Failed to generate quiz:", error);
      }
      setLoading(false);
    };
    loadQuiz();
  }, [content, resumeQuizId, isAuthenticated, selectedDifficulty]);

  useEffect(() => {
    setSelectedOption(null);
    setTextInput("");
    setIsInputSubmitted(false);
  }, [currentQIndex]);

  const handleMultipleChoice = useCallback((option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);

    const currentQ = questions[currentQIndex];
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: option }));

    if (option === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  }, [selectedOption, currentQIndex, questions]);

  const handleTextInputSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    const currentQ = questions[currentQIndex];
    setIsInputSubmitted(true);
    const normalizedInput = textInput.trim().toLowerCase();
    const normalizedCorrect = currentQ.correctAnswer.trim().toLowerCase();
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: textInput.trim() }));
    setSelectedOption(textInput.trim());
    if (normalizedInput === normalizedCorrect) setScore((prev) => prev + 1);
  }, [textInput, currentQIndex, questions]);

  const nextQuestion = async () => {
    const nextIndex = currentQIndex + 1;

    // Автозбереження прогресу
    if (isAuthenticated && materialId && nextIndex < questions.length) {
      try {
        const answersArray = Object.entries(userAnswers).map(
          ([qId, answer]) => {
            const question = questions.find((q) => q.id === qId);
            return {
              questionId: qId,
              question: question?.question || "",
              options: question?.options || [],
              userAnswer: answer,
              correctAnswer: question?.correctAnswer || "",
              isCorrect: answer === question?.correctAnswer,
            };
          }
        );

        const savedQuiz = await api.saveQuizProgress({
          quizId: currentQuizId,
          materialId,
          currentQuestionIndex: nextIndex,
          answers: answersArray,
        });

        if (!currentQuizId) {
          setCurrentQuizId(savedQuiz._id);
        }
      } catch (error) {
        console.error("Failed to save quiz progress:", error);
      }
    }

    if (nextIndex < questions.length) {
      setCurrentQIndex(nextIndex);
    } else {
      setIsReviewing(true);
    }
  };

  // Setup keyboard shortcuts
  const handleSelectAnswer = useCallback((index: number) => {
    if (!isReviewing && questions[currentQIndex]?.options?.[index]) {
      handleMultipleChoice(questions[currentQIndex].options[index]);
    }
  }, [currentQIndex, questions, isReviewing, handleMultipleChoice]);

  const handleEnterPress = useCallback(() => {
    // Check if we should submit or move to next based on current state
    if (isInputSubmitted) {
      // Already submitted, move to next
      void nextQuestion();
    } else if (selectedOption) {
      // Selected an option, mark it as submitted
      const currentQ = questions[currentQIndex];
      setIsInputSubmitted(true);
      setUserAnswers((prev) => ({ ...prev, [currentQ.id]: selectedOption }));
    }
  }, [selectedOption, isInputSubmitted, nextQuestion, currentQIndex, questions]);

  useQuizShortcuts(
    handleSelectAnswer,
    handleEnterPress,
    nextQuestion,
    !!selectedOption,
    isInputSubmitted,
    !loading && questions.length > 0 && !isReviewing
  );

  const completeQuiz = async () => {
    const result: QuizResult = {
      totalQuestions: questions.length,
      correctAnswers: score,
      scorePercentage: Math.round((score / questions.length) * 100),
      feedback:
        score > questions.length / 2
          ? "Хороший результат!"
          : "Варто повторити матеріал.",
      recommendations: ["Перегляньте глосарій", "Пройдіть флеш-картки"],
      userAnswers,
      questions,
    };

    // Зберегти завершений тест
    if (isAuthenticated && materialId) {
      try {
        await api.saveQuizResult({
          quizId: currentQuizId,
          materialId,
          ...result,
          answers: Object.entries(userAnswers).map(([qId, answer]) => {
            const question = questions.find((q) => q.id === qId);
            return {
              questionId: qId,
              question: question?.question || "",
              options: question?.options || [],
              userAnswer: answer,
              correctAnswer: question?.correctAnswer || "",
              isCorrect: answer === question?.correctAnswer,
            };
          }),
        });
      } catch (error) {
        console.error("Failed to save quiz result:", error);
      }
    }

    onFinish(result);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-slate-800 dark:text-white font-heading font-bold text-xl">
          AI генерує тест...
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
          Аналізуємо матеріал, формулюємо питання
        </p>
      </div>
    );
  }

  // Screen for difficulty selection
  if (!selectedDifficulty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <button
          onClick={onBack}
          className="mb-8 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold">
              ТЕСТУВАННЯ
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-slate-900 dark:text-white mb-4">
              Виберіть рівень складності
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Тест буде адаптуватися до вашого рівня знань. Кожен рівень різний за кількістю питань та складністю.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Easy */}
            <button
              onClick={() => setSelectedDifficulty("easy")}
              className="group relative overflow-hidden p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-500 dark:hover:border-green-500 hover:shadow-2xl transition-all duration-500 text-left h-full"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                🎯
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                Легкий
              </h3>
              
              {/* Subtitle */}
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                Для початківців
              </p>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Ідеально для того, щоб познайомитися з матеріалом та перевірити базові знання.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Питання</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">10</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Час (мін)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">15-20</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-green-500">✓</span> Основні поняття
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-green-500">✓</span> Проста мова
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-green-500">✓</span> Без подвохів
                </li>
              </ul>

              {/* Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-green-600 dark:text-green-400">Почати</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Medium */}
            <button
              onClick={() => setSelectedDifficulty("medium")}
              className="group relative overflow-hidden p-8 rounded-3xl border-2 border-primary/60 dark:border-primary/50 bg-white dark:bg-slate-800 hover:border-primary dark:hover:border-primary hover:shadow-2xl transition-all duration-500 text-left h-full scale-100 md:scale-105 ring-2 ring-primary/10 dark:ring-primary/5"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              
              {/* Best badge */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                РЕКОМЕНДУЄТЬСЯ
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                ⚡
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-primary dark:text-primary mb-2">
                Середній
              </h3>
              
              {/* Subtitle */}
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                Найбільш популярний
              </p>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Баланс між теорією та практикою. Тест для перевірки реальних знань.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Питання</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Час (мін)</p>
                  <p className="text-2xl font-bold text-primary">20-25</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-primary">✓</span> Глибші знання
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-primary">✓</span> Практичні приклади
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-primary">✓</span> Реальні сценарії
                </li>
              </ul>

              {/* Button */}
              <div className="flex items-center justify-between pt-4 border-t border-primary/20 dark:border-primary/10">
                <span className="font-bold text-primary">Почати</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Hard */}
            <button
              onClick={() => setSelectedDifficulty("hard")}
              className="group relative overflow-hidden p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-2xl transition-all duration-500 text-left h-full"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                🔥
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                Важкий
              </h3>
              
              {/* Subtitle */}
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                Для експертів
              </p>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Складні питання, глибокі знання. Тест для перевірки експертизи.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Питання</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">15</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Час (мін)</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">30-40</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-orange-500">✓</span> Глибокі знання
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-orange-500">✓</span> Критичне мислення
                </li>
                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-orange-500">✓</span> Нюанси та суперечності
                </li>
              </ul>

              {/* Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-orange-600 dark:text-orange-400">Почати</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              💡 <span className="font-semibold">Порада:</span> Виберіть рівень, який вам надасть найбільше користі. Можете пізніше спробувати інший рівень.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Не вдалося згенерувати тест. Спробуйте пізніше.
        </p>
        <button onClick={onBack} className="text-primary hover:underline">
          Назад
        </button>
      </div>
    );
  }

  if (isReviewing) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="glass rounded-3xl p-10 text-center mb-10 border border-white/50 dark:border-slate-700/50 shadow-xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/30 text-white">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-slate-800 dark:text-white mb-2">
            {percentage >= 80
              ? "Відмінний результат!"
              : percentage >= 50
              ? "Непогано!"
              : "Треба підучити"}
          </h2>
          <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary my-4">
            {score}/{questions.length}
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Правильних відповідей</p>
        </div>

        <div className="space-y-6 mb-10">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[q.id] || "";
            const isCorrect =
              userAnswer.toLowerCase().trim() ===
              q.correctAnswer.toLowerCase().trim();
            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border-l-4 shadow-sm bg-white dark:bg-slate-800 ${
                  isCorrect ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCorrect
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isCorrect ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white text-lg mb-2">
                      {q.question}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                      Ваша відповідь:{" "}
                      <span
                        className={
                          isCorrect
                            ? "text-green-600 dark:text-green-400 font-bold"
                            : "text-red-600 dark:text-red-400 font-bold line-through"
                        }
                      >
                        {userAnswer}
                      </span>
                    </p>
                    {!isCorrect && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 text-green-800 dark:text-green-300 text-sm">
                        <span className="font-bold">Правильно:</span>{" "}
                        {q.correctAnswer}
                      </div>
                    )}
                    <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={completeQuiz}
            className="px-10 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-900/20 dark:shadow-black/20 transition-transform hover:scale-105"
          >
            Завершити тест
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="font-bold text-slate-400 dark:text-slate-500 tabular-nums">
          {currentQIndex + 1}/{questions.length}
        </span>
        {/* Shortcuts hint */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="text-slate-400 dark:text-slate-500 hover:text-primary p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Гарячі клавіші"
        >
          <Keyboard className="w-5 h-5" />
        </button>
      </div>

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-primary" /> Гарячі клавіші
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start py-3 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <span className="text-slate-700 dark:text-slate-300 flex-1">Обрати варіант 1-4</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded font-mono text-sm font-bold text-primary border border-primary/20 dark:border-primary/30 ml-2 whitespace-nowrap">
                  1 2 3 4
                </span>
              </div>
              <div className="flex justify-between items-start py-3 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <span className="text-slate-700 dark:text-slate-300 flex-1">Підтвердити / Далі</span>
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded font-mono text-sm font-bold text-primary border border-primary/20 dark:border-primary/30 ml-2 whitespace-nowrap">
                  Enter ⏎
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              💡 Гарячі клавіші працюють тільки коли не вводиться текст у форме.
            </p>
            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 p-8 md:p-10 min-h-[400px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-secondary"></div>

        <div className="mb-8">
          <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            {currentQ.type === "multiple_choice"
              ? "Оберіть варіант"
              : currentQ.type === "true_false"
              ? "Так чи Ні"
              : "Заповніть пропуск"}
          </span>
          <p className="text-2xl md:text-3xl font-heading font-bold text-slate-900 dark:text-white leading-tight">
            {currentQ.question}
          </p>
        </div>

        <div className="space-y-3 flex-1">
          {(currentQ.type === "multiple_choice" ||
            currentQ.type === "true_false") &&
            currentQ.options?.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === currentQ.correctAnswer;

              let btnClass =
                "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group relative overflow-hidden ";

              if (selectedOption) {
                if (isSelected) {
                  btnClass += isCorrect
                    ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300";
                } else if (isCorrect) {
                  btnClass +=
                    "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300 opacity-60";
                } else {
                  // Невибрана та неправильна - зберігаємо видимість тексту!
                  btnClass += "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 opacity-50";
                }
              } else {
                btnClass +=
                  "border-slate-100 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:shadow-md";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleMultipleChoice(opt)}
                  disabled={!!selectedOption}
                  className={btnClass}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold">{idx + 1}</span>
                      <span className="font-bold text-lg">{opt}</span>
                    </div>
                    {selectedOption === opt &&
                      (isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ))}
                  </div>
                </button>
              );
            })}

          {currentQ.type === "fill_in_the_blank" && (
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isInputSubmitted}
                  placeholder="Впишіть відповідь..."
                  className={`w-full p-5 text-lg rounded-2xl border-2 outline-none transition-all font-medium
                            ${
                              isInputSubmitted
                                ? textInput.trim().toLowerCase() ===
                                  currentQ.correctAnswer.trim().toLowerCase()
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300"
                                  : "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10"
                            }
                          `}
                />
              </div>

              {!isInputSubmitted ? (
                <button
                  onClick={handleTextInputSubmit}
                  disabled={!textInput.trim()}
                  className="self-start px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Перевірити
                </button>
              ) : (
                textInput.trim().toLowerCase() !==
                  currentQ.correctAnswer.trim().toLowerCase() && (
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                      Правильна відповідь
                    </p>
                    <p className="text-lg font-bold">
                      {currentQ.correctAnswer}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Explanation / Footer */}
        {selectedOption && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-end">
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-105"
              >
                {currentQIndex === questions.length - 1 ? "Результат" : "Далі"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
