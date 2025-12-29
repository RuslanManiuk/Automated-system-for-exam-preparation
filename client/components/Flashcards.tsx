import React, { useState, useEffect, useCallback } from "react";
import { Flashcard } from "../types";
import {
  ArrowLeft,
  RotateCw,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  Keyboard,
} from "lucide-react";
import { useFlashcardShortcuts } from "../hooks/useKeyboardShortcuts";

interface FlashcardsProps {
  cards: Flashcard[];
  onComplete: (score: number) => void;
  onBack: () => void;
  onUpdateCard: (
    id: string,
    status: "new" | "learning" | "mastered",
    nextReview: number
  ) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  cards,
  onComplete,
  onBack,
  onUpdateCard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstToDo = cards.findIndex((c) => c.status !== "mastered");
    return firstToDo >= 0 ? firstToDo : 0;
  });

  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionMastered, setSessionMastered] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => setIsFlipped(!isFlipped), [isFlipped]);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, cards.length]);

  // Keyboard shortcuts
  useFlashcardShortcuts(
    currentIndex,
    cards.length,
    handlePrev,
    handleNext,
    handleFlip,
    undefined,
    !completed
  );

  const handleResponse = (known: boolean) => {
    const newStatus = known ? "mastered" : "learning";
    const nextReview = known
      ? Date.now() + 24 * 60 * 60 * 1000
      : Date.now() + 10 * 60 * 1000;
    onUpdateCard(currentCard.id, newStatus, nextReview);
    if (known) setSessionMastered((prev) => prev + 1);
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
    } else {
      setCompleted(true);
      onComplete(known ? sessionMastered + 1 : sessionMastered);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100 dark:shadow-green-900/20">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-heading font-bold text-slate-800 dark:text-white mb-2">
          Чудова робота!
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          Ти вивчив{" "}
          <span className="font-bold text-slate-900 dark:text-white">{sessionMastered}</span>{" "}
          нових карток.
        </p>
        <button
          onClick={onBack}
          className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl transition-all hover:scale-105"
        >
          Повернутися до меню
        </button>
      </div>
    );
  }

  const masteredTotal = cards.filter((c) => c.status === "mastered").length;

  return (
    <div className="max-w-3xl mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="text-slate-500 dark:text-slate-400 hover:text-primary flex items-center gap-2 transition-colors font-medium bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <div className="flex items-center gap-4">
          {/* Shortcuts hint */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="text-slate-400 dark:text-slate-500 hover:text-primary p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Гарячі клавіші"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Прогрес
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800 dark:text-white">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500">/ {cards.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5" /> Гарячі клавіші
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Перевернути картку</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-800 dark:text-white">Space</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Попередня картка</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-800 dark:text-white">←</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 dark:text-slate-400">Наступна картка</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-800 dark:text-white">→</span>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}

      <div className="w-full mb-10">
        <div
          className="relative w-full h-[400px] cursor-pointer"
          onClick={handleFlip}
          style={{ perspective: "1500px" }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-10 text-center overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {currentCard.status === "mastered" && (
                <div className="absolute top-6 right-6 text-green-600 dark:text-green-400 flex items-center gap-1 text-xs font-bold uppercase tracking-wide bg-green-100/50 dark:bg-green-900/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <CheckCircle className="w-3 h-3" /> Вивчено
                </div>
              )}

              <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mb-6 relative z-10">
                Питання
              </span>
              <p className="text-3xl md:text-4xl font-heading font-bold text-slate-800 dark:text-white leading-tight relative z-10 drop-shadow-sm">
                {currentCard.question}
              </p>

              <div className="absolute bottom-8 text-sm text-primary/60 font-medium flex items-center gap-2 animate-pulse">
                <RotateCw className="w-4 h-4" /> Натисніть, щоб перевернути
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 w-full h-full bg-slate-900 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-10 text-center text-white border border-slate-700"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-6 relative z-10">
                Відповідь
              </span>
              <p className="text-2xl leading-relaxed font-medium relative z-10">
                {currentCard.answer}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleResponse(false);
          }}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-105 active:scale-95 border border-red-100 dark:border-red-800 shadow-sm"
        >
          <XCircle className="w-5 h-5" />
          Ще вчу
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleResponse(true);
          }}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:scale-105 active:scale-95 border border-green-100 dark:border-green-800 shadow-sm"
        >
          <CheckCircle className="w-5 h-5" />
          Знаю
        </button>
      </div>
    </div>
  );
};