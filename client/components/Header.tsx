import React, { useState } from "react";
import { UserStats } from "../types";
import {
  GraduationCap,
  Flame,
  BookOpen,
  ChevronDown,
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  stats: UserStats;
  goHome: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  userAvatar?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  goHome,
  isAuthenticated,
  userName,
  userAvatar,
  onLogin,
  onLogout,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const progressPercent = (stats.xp % 1000) / 10; // Assuming 1000 XP per level

  return (
    <header className="sticky top-4 z-50 px-4 mb-4">
      <div className="max-w-7xl mx-auto glass rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 px-4 py-3 flex items-center justify-between transition-all hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={goHome}
        >
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight">
            ExamNinja
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {/* Level & XP - Only show for authenticated users */}
          {isAuthenticated && (
            <>
              <div className="hidden sm:flex flex-col min-w-[140px]">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                  <span>{stats.level}</span>
                  <span>{stats.xp} XP</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            </>
          )}

          {/* Theme Toggle */}
          <ThemeToggle variant="icon" />

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* User Profile with Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full pr-3 pl-1 py-1 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Username (hidden on small screens) */}
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                {userName || "Гість"}
              </span>

              <ChevronDown
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Section */}
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={userName || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {userName || "Гість"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {stats.level} • {stats.xp} XP
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            Вивчено карток
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {stats.cardsLearned}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-accent" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            Пройдено тестів
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {stats.testsPassed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                    {isAuthenticated && onLogout ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Вийти з акаунта
                      </button>
                    ) : onLogin ? (
                      <button
                        onClick={() => {
                          onLogin();
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors font-medium"
                      >
                        <LogIn className="w-4 h-4" />
                        Увійти
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
