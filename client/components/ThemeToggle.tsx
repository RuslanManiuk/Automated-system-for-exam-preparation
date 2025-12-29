import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'icon',
  className = '' 
}) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 group ${className}`}
        aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
        title={actualTheme === 'light' ? 'Темний режим' : 'Світлий режим'}
      >
        <div className="relative w-5 h-5">
          <Sun className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${
            actualTheme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-0'
          }`} />
          <Moon className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-300 ${
            actualTheme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`} />
        </div>
      </button>
    );
  }

  // Dropdown variant
  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-all duration-200 ${
          theme === 'light' 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Світла тема"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Темна тема"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-all duration-200 ${
          theme === 'system' 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Системна тема"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ThemeToggle;
