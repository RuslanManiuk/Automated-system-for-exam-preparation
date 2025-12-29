import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Flame,
  BookOpen,
  Brain,
  Sparkles,
  Calendar
} from 'lucide-react';
import { UserStats } from '../types';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: 'indigo' | 'pink' | 'violet' | 'amber' | 'emerald' | 'sky';
}

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    icon: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400',
    text: 'text-pink-600 dark:text-pink-400',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    icon: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    icon: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400',
    text: 'text-sky-600 dark:text-sky-400',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, trend, color }) => {
  const colors = colorClasses[color];
  
  return (
    <div className={`${colors.bg} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] card-hover`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
          }`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${colors.text}`}>{subtitle}</p>
      )}
    </div>
  );
};

// Simple progress bar component
interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, color = 'bg-primary' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Weekly activity chart (simple bars)
interface ActivityDay {
  day: string;
  value: number;
}

const WeeklyActivity: React.FC<{ data: ActivityDay[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="flex items-end justify-between gap-2 h-24">
      {data.map((day, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
          <div className="relative w-full flex justify-center">
            <div 
              className="w-full max-w-[32px] bg-gradient-to-t from-primary to-primaryLight rounded-lg transition-all duration-300 hover:opacity-80"
              style={{ height: `${(day.value / maxValue) * 80}px`, minHeight: day.value > 0 ? '8px' : '4px' }}
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{day.day}</span>
        </div>
      ))}
    </div>
  );
};

interface StatsDashboardProps {
  stats: UserStats;
  quizResults?: { score: number; date: string }[];
  materialCount?: number;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ 
  stats, 
  quizResults = [],
  materialCount = 0 
}) => {
  // Calculate XP progress to next level
  const xpProgress = useMemo(() => {
    const levels = [
      { name: 'Студент', threshold: 0 },
      { name: 'Бакалавр', threshold: 500 },
      { name: 'Магістр', threshold: 1500 },
      { name: 'Професор', threshold: 3000 },
    ];
    
    const currentLevelIndex = levels.findIndex(l => l.name === stats.level);
    const currentThreshold = levels[currentLevelIndex]?.threshold || 0;
    const nextThreshold = levels[currentLevelIndex + 1]?.threshold || levels[currentLevelIndex]?.threshold + 1000;
    
    const xpInCurrentLevel = stats.xp - currentThreshold;
    const xpNeededForNext = nextThreshold - currentThreshold;
    
    return {
      current: xpInCurrentLevel,
      needed: xpNeededForNext,
      percentage: Math.round((xpInCurrentLevel / xpNeededForNext) * 100),
      nextLevel: levels[currentLevelIndex + 1]?.name || 'Максимум',
    };
  }, [stats]);

  // Generate weekly activity data
  const weeklyActivity = useMemo(() => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    const today = new Date().getDay();
    
    return days.map((day, idx) => ({
      day,
      // Simulated data - in real app, this would come from API
      value: Math.floor(Math.random() * 50) + (idx === (today === 0 ? 6 : today - 1) ? 30 : 0),
    }));
  }, []);

  // Calculate average quiz score
  const avgQuizScore = useMemo(() => {
    if (quizResults.length === 0) return 0;
    return Math.round(quizResults.reduce((acc, r) => acc + r.score, 0) / quizResults.length);
  }, [quizResults]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Досвід (XP)"
          value={stats.xp}
          subtitle={`${xpProgress.percentage}% до ${xpProgress.nextLevel}`}
          icon={<Sparkles className="w-5 h-5" />}
          color="indigo"
        />
        <StatsCard
          title="Рівень"
          value={stats.level}
          icon={<Award className="w-5 h-5" />}
          color="violet"
        />
        <StatsCard
          title="Серія днів"
          value={stats.streak}
          subtitle="днів поспіль"
          icon={<Flame className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Картки"
          value={stats.cardsLearned}
          subtitle="вивчено"
          icon={<Brain className="w-5 h-5" />}
          color="pink"
        />
        <StatsCard
          title="Тести"
          value={stats.testsPassed}
          subtitle="пройдено"
          icon={<Target className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Матеріали"
          value={materialCount}
          subtitle="завантажено"
          icon={<BookOpen className="w-5 h-5" />}
          color="sky"
        />
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XP Progress Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Прогрес рівня
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.level}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {xpProgress.current} / {xpProgress.needed} XP
              </span>
            </div>
            
            <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-full transition-all duration-1000"
                style={{ width: `${xpProgress.percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ще <span className="font-semibold text-primary">{xpProgress.needed - xpProgress.current} XP</span> до рівня "{xpProgress.nextLevel}"
            </p>
          </div>
        </div>

        {/* Weekly Activity Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Активність за тиждень
          </h3>
          
          <WeeklyActivity data={weeklyActivity} />
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
            Заробіть більше XP, вивчаючи кожен день!
          </p>
        </div>
      </div>

      {/* Achievements Preview */}
      {stats.achievements.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Досягнення ({stats.achievements.length})
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map((achievement, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-full border border-amber-200 dark:border-amber-700"
              >
                🏆 {achievement}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;
