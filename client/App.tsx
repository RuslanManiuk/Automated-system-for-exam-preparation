import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FileUpload } from "./components/FileUpload";
import { Flashcards } from "./components/Flashcards";
import { Quiz } from "./components/Quiz";
import { QuizHistory } from "./components/QuizHistory";
import { MindMap } from "./components/MindMap";
import { Glossary } from "./components/Glossary";
import { Chat } from "./components/Chat";
import { AuthModal } from "./components/AuthModal";
import { AuthCallback } from "./components/AuthCallback";
import { StatsDashboard } from "./components/StatsDashboard";
import { MaterialsList } from "./components/MaterialsList";
import {
  FlashcardPreview,
  QuizPreview,
  MindMapPreview,
  ChatPreview,
} from "./components/FeaturePreviews";
import { useAuth } from "./context/AuthContext";
import {
  StudyMaterial,
  UserStats,
  UserLevel,
  ViewMode,
  DashboardTab,
  QuizResult,
} from "./types";

// Helper function to convert string level to UserLevel enum
const stringToUserLevel = (level: string | undefined): UserLevel => {
  switch (level) {
    case "Бакалавр":
    case UserLevel.BACHELOR:
      return UserLevel.BACHELOR;
    case "Магістр":
    case UserLevel.MASTER:
      return UserLevel.MASTER;
    case "Професор":
    case UserLevel.PROFESSOR:
      return UserLevel.PROFESSOR;
    default:
      return UserLevel.STUDENT;
  }
};
import {
  BookOpen,
  Brain,
  List,
  Sparkles,
  ChevronRight,
  FileText,
  MessageCircle,
  LayoutDashboard,
  ArrowLeft,
  Clock,
  LogIn,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { api } from "./services/apiClient";

const App: React.FC = () => {
  const {
    user,
    isAuthenticated,
    logout,
    loading: authLoading,
    updateUserStats,
  } = useAuth();

  // -- State --
  const [view, setView] = useState<ViewMode>("home");

  // Handle OAuth callback via query params
  const urlParams = new URLSearchParams(window.location.search);
  const isAuthCallback = urlParams.get("auth") === "callback";

  // Early return for auth callback (after all hooks)
  if (isAuthCallback) {
    return <AuthCallback />;
  }
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [resumeQuizId, setResumeQuizId] = useState<string | undefined>(
    undefined
  );
  const [userStats, setUserStats] = useState<UserStats>({
    xp: user?.stats?.xp || 120,
    level: stringToUserLevel(user?.stats?.level),
    streak: user?.stats?.streak || 0,
    achievements: user?.stats?.achievements || [],
    cardsLearned: user?.stats?.cardsLearned || 0,
    testsPassed: user?.stats?.testsPassed || 0,
  });

  // Sync user stats from context
  useEffect(() => {
    if (user) {
      setUserStats({
        xp: user.stats.xp,
        level: stringToUserLevel(user.stats.level),
        streak: user.stats.streak,
        achievements: user.stats.achievements,
        cardsLearned: user.stats.cardsLearned,
        testsPassed: user.stats.testsPassed,
      });
    }
  }, [user]);

  // -- Persistence --
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        // Load user data from API
        loadUserData();
      } else {
        // Show auth modal or try localStorage for guest mode
        try {
          const savedMaterial = localStorage.getItem("examninja_material");
          if (savedMaterial) {
            const parsed = JSON.parse(savedMaterial);
            if (parsed && parsed.id) {
              setMaterial(parsed);
              setView("dashboard");
            }
          }

          const savedStats = localStorage.getItem("examninja_stats");
          if (savedStats) {
            setUserStats(JSON.parse(savedStats));
          }
        } catch (e) {
          console.error("Error loading from local storage", e);
        }
      }
    }
  }, [isAuthenticated, authLoading]);

  const loadUserData = async () => {
    try {
      const userData = await api.getUser();
      setUserStats({
        xp: userData.stats.xp,
        level: stringToUserLevel(userData.stats.level),
        streak: userData.stats.streak,
        achievements: userData.stats.achievements,
        cardsLearned: userData.stats.cardsLearned,
        testsPassed: userData.stats.testsPassed,
      });

      // Load latest material
      const materials = await api.getMaterials();
      if (materials && materials.length > 0) {
        const latest = materials[0];
        setMaterial({
          ...latest,
          id: latest._id,
          createdAt: new Date(latest.createdAt).getTime(),
        });
        setView("dashboard");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    if (material && !isAuthenticated) {
      localStorage.setItem("examninja_material", JSON.stringify(material));
    }
  }, [material, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("examninja_stats", JSON.stringify(userStats));
    }
  }, [userStats, isAuthenticated]);

  // -- Handlers --
  const handleMaterialProcessed = async (
    newMaterial: StudyMaterial,
    file?: File
  ) => {
    setMaterial(newMaterial);
    setView("dashboard");
    setActiveTab("overview");
    addXP(50);

    // Save to backend if authenticated
    if (isAuthenticated) {
      try {
        // If there is a file, attach it for multipart upload
        const payload = file ? { ...newMaterial, file } : newMaterial;
        const saved = await api.createMaterial(payload);
        setMaterial({
          ...saved,
          id: saved._id,
          createdAt: new Date(saved.createdAt).getTime(),
        });
      } catch (error) {
        console.error("Error saving material:", error);
      }
    }
  };

  const addXP = async (amount: number) => {
    setUserStats((prev) => {
      const newXP = prev.xp + amount;
      let newLevel = prev.level;
      if (newXP > 500) newLevel = UserLevel.BACHELOR;
      if (newXP > 1500) newLevel = UserLevel.MASTER;
      if (newXP > 3000) newLevel = UserLevel.PROFESSOR;

      const updatedStats = { ...prev, xp: newXP, level: newLevel };

      // Update context
      if (isAuthenticated && updateUserStats) {
        updateUserStats({ xp: newXP, level: newLevel });
      }

      return updatedStats;
    });

    // Update on backend if authenticated
    if (isAuthenticated) {
      try {
        await api.updateStats({ xpDelta: amount });
      } catch (error) {
        console.error("Error updating stats:", error);
      }
    }
  };

  const handleFlashcardComplete = async (score: number) => {
    addXP(score * 10);
    setUserStats((prev) => ({
      ...prev,
      cardsLearned: prev.cardsLearned + score,
    }));

    if (isAuthenticated) {
      try {
        await api.updateStats({ cardsLearned: score });
      } catch (error) {
        console.error("Error updating card stats:", error);
      }
    }

    setActiveTab("overview");
  };

  const handleCardUpdate = async (
    id: string,
    status: "new" | "learning" | "mastered",
    nextReview: number
  ) => {
    if (!material) return;
    const updatedCards = material.flashcards.map((c) =>
      c.id === id ? { ...c, status, nextReview } : c
    );
    setMaterial({ ...material, flashcards: updatedCards });

    // Update on backend if authenticated
    if (isAuthenticated && material.id) {
      try {
        await api.updateFlashcard(material.id, id, status, nextReview);
      } catch (error) {
        console.error("Error updating flashcard:", error);
      }
    }
  };

  const handleQuizFinish = async (result: QuizResult) => {
    addXP(result.scorePercentage);
    setUserStats((prev) => ({ ...prev, testsPassed: prev.testsPassed + 1 }));

    if (isAuthenticated && material) {
      try {
        await api.saveQuizResult({
          materialId: material.id,
          ...result,
        });
        await api.updateStats({ testsPassed: 1 });
      } catch (error) {
        console.error("Error saving quiz result:", error);
      }
    }

    setActiveTab("overview");
  };

  const handleLogout = () => {
    logout();
    setMaterial(null);
    setView("home");
  };

  // -- Renderers --

  const renderHero = () => (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 pt-20 text-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
      <div
        className="absolute bottom-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mb-8 animate-bounce-slow">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Штучний інтелект для навчання
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-heading font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
          Вчись{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
            розумніше
          </span>
          <br />
          не важче.
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Завантаж свій конспект — отримай структуру, тести, ментальні карти та
          картки за лічені секунди. Твій особистий AI-репетитор вже тут.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() =>
              isAuthenticated ? setView("upload") : setShowAuthModal(true)
            }
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl focus:outline-none hover:bg-slate-800 dark:hover:bg-slate-100 hover:scale-105 shadow-xl shadow-slate-900/30 dark:shadow-white/20"
          >
            Почати безкоштовно
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 dark:text-white transition-all duration-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none hover:border-primary hover:text-primary hover:scale-105 shadow-lg"
            >
              <LogIn className="mr-2 w-5 h-5" />
              Увійти
            </button>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-7xl mx-auto space-y-24 px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4 text-slate-900 dark:text-white">
            Всі інструменти для навчання в одному місці
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Завантажуй конспекти і отримуй повний набір інтерактивних матеріалів
            за секунди
          </p>

          {/* Feature 1: Flashcards */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 lg:order-1">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl w-fit mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Інтерактивні картки
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Вивчай матеріал за допомогою карток з плавною 3D анімацією.
                Натисни на картку, щоб перевернути її та побачити відповідь.
                Система автоматично генерує питання та відповіді з твого
                конспекту.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>3D анімація перевороту карток</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Автоматична генерація з конспекту</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Зручна навігація між картками</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 lg:order-2">
              <FlashcardPreview />
            </div>
          </div>

          {/* Feature 2: Quiz */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 lg:order-2">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl w-fit mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Розумні тести
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Перевір свої знання за допомогою автоматично згенерованих
                тестів. AI створює питання різної складності на основі твого
                матеріалу з миттєвою перевіркою відповідей.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Різні типи питань (одна/кілька відповідей)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Миттєва перевірка з поясненнями</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Детальна статистика результатів</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 lg:order-1">
              <QuizPreview />
            </div>
          </div>

          {/* Feature 3: Mind Map */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 lg:order-1">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl w-fit mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Ментальні карти
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Візуалізуй зв'язки між темами та концепціями у вигляді
                інтерактивної ментальної карти. Бач всю картину матеріалу на
                одній діаграмі з можливістю масштабування та навігації.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Автоматична побудова зв'язків між темами</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Інтерактивна навігація та масштабування</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Експорт у різні формати</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 lg:order-2">
              <MindMapPreview />
            </div>
          </div>

          {/* Feature 4: Chat */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 lg:order-2">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-xl w-fit mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                AI-асистент
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Постав будь-яке питання по матеріалу та отримай детальну
                відповідь від AI. Асистент знає весь контекст твого конспекту і
                може пояснити складні теми простою мовою.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Розуміє контекст твого матеріалу</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Детальні пояснення складних тем</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                  <span>Історія всіх розмов зберігається</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 lg:order-1">
              <ChatPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardNavigation = () => {
    const tabs: { id: DashboardTab; label: string; icon: React.FC<any> }[] = [
      { id: "overview", label: "Огляд", icon: LayoutDashboard },
      { id: "materials", label: "Матеріали", icon: FolderOpen },
      { id: "stats", label: "Статистика", icon: BarChart3 },
      { id: "flashcards", label: "Картки", icon: Sparkles },
      { id: "quiz-history", label: "Тести", icon: BookOpen },
      { id: "mindmap", label: "Карта", icon: Brain },
      { id: "glossary", label: "Глосарій", icon: List },
      { id: "chat", label: "Чат", icon: MessageCircle },
    ];

    return (
      <div className="sticky top-24 z-40 flex justify-center mb-8">
        <div className="glass p-1.5 rounded-2xl flex overflow-x-auto no-scrollbar shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-white/50 dark:border-slate-700/50 max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-300 text-sm
                    ${
                      isActive
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                        : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                    }
                `}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-indigo-300 dark:text-indigo-600" : ""
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!material) return null;

    switch (activeTab) {
      case "stats":
        return <StatsDashboard stats={userStats} materialCount={1} />;
      case "materials":
        return (
          <MaterialsList
            currentMaterialId={material?.id}
            onSelectMaterial={(selectedMaterial) => {
              setMaterial(selectedMaterial);
              setActiveTab("overview");
            }}
            onBack={() => setView("upload")}
          />
        );
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Summary Card - Wide */}
            <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-slate-800 dark:text-white">
                  Стислий зміст
                </h3>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-slate-600 dark:text-slate-300 text-lg">
                {material.summary}
              </div>
            </div>

            {/* Stats / Quick Actions Column */}
            <div className="md:col-span-1 lg:col-span-1 space-y-6">
              {/* Action: Quiz */}
              <div
                onClick={() => setActiveTab("quiz-history")}
                className="group bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30 relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                <BookOpen className="w-8 h-8 mb-4 relative z-10" />
                <h3 className="text-xl font-bold font-heading relative z-10">
                  Тести
                </h3>
                <p className="text-sm opacity-90 relative z-10 mb-2">
                  Перевір свої знання
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80">
                  <span>Переглянути тести</span>{" "}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>

              {/* Action: Flashcards */}
              <div
                onClick={() => setActiveTab("flashcards")}
                className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl text-secondary">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-500 dark:text-slate-400">
                    {material.flashcards.length} карток
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Флеш-картки
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Тренуй пам'ять за допомогою інтервальних повторень.
                </p>
              </div>

              {/* Action: Mind Map */}
              <div
                onClick={() => setActiveTab("mindmap")}
                className="group bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                    <Brain className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Ментальна карта
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Візуалізуй зв'язки між темами.
                </p>
              </div>

              {/* Info: Created At */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center text-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-medium">
                  Створено {new Date(material.createdAt).toLocaleDateString()}
                </span>
                {material.file && (
                  <button
                    onClick={async () => {
                      try {
                        const blob = await api.downloadMaterialFile(
                          material.id
                        );
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download =
                          material.file?.originalName || "material-file";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (e) {
                        console.error("Failed to download file", e);
                      }
                    }}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-xs font-medium hover:bg-slate-100"
                  >
                    Завантажити оригінал
                  </button>
                )}
              </div>
            </div>

            {/* Key Facts - Full Width */}
            <div className="md:col-span-3 lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-white mb-6">
                Ключові факти
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {material.keyFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl font-bold text-slate-200 dark:text-slate-600 font-heading leading-none">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {fact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "flashcards":
        return (
          <Flashcards
            key={material.id}
            cards={material.flashcards}
            onComplete={handleFlashcardComplete}
            onBack={() => setActiveTab("overview")}
            onUpdateCard={handleCardUpdate}
          />
        );
      case "quiz":
        return (
          <Quiz
            content={material.originalContent}
            materialId={material.id}
            resumeQuizId={resumeQuizId}
            onFinish={handleQuizFinish}
            onBack={() => {
              setActiveTab("quiz-history");
              setResumeQuizId(undefined);
            }}
          />
        );
      case "quiz-history":
        return (
          <QuizHistory
            materialId={material.id}
            onResumeQuiz={(quizId) => {
              setResumeQuizId(quizId);
              setActiveTab("quiz");
            }}
            onStartNewQuiz={() => {
              setResumeQuizId(undefined);
              setActiveTab("quiz");
            }}
          />
        );
      case "mindmap":
        return <MindMap data={material.mindMap} />;
      case "glossary":
        return <Glossary items={material.glossary} />;
      case "chat":
        return (
          <Chat context={material.originalContent || ""} chatId={material.id} />
        );
      default:
        return null;
    }
  };

  const renderDashboard = () => {
    if (!material) return null;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-[calc(100vh-4rem)] pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <button
              onClick={() => setView("upload")}
              className="text-slate-400 dark:text-slate-500 hover:text-primary text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Завантажити інший файл
            </button>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 dark:text-white truncate max-w-2xl tracking-tight">
              {material.title}
            </h2>
            {material.file && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Файл: {material.file.originalName}
              </div>
            )}
          </div>
          {/* Actions can go here */}
        </div>

        {renderDashboardNavigation()}
        {renderTabContent()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900 font-sans selection:bg-primary/20 selection:text-primary flex flex-col transition-colors duration-300">
      <Header
        stats={userStats}
        goHome={() => setView("home")}
        isAuthenticated={isAuthenticated}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        userName={user?.username}
        userAvatar={user?.avatar}
      />

      <main className="relative z-0 flex-1">
        {view === "home" && renderHero()}
        {view === "upload" && (
          <FileUpload onProcessingComplete={handleMaterialProcessed} />
        )}
        {view === "dashboard" && renderDashboard()}
      </main>

      <Footer />

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default App;
