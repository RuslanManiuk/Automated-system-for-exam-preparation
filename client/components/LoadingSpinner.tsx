import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && (
        <p className="text-sm text-slate-500 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular' 
}) => {
  const baseClasses = 'animate-pulse bg-slate-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

// Card skeleton for flashcards, quiz results, etc.
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100">
    <Skeleton className="h-6 w-3/4 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3 mb-4" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
    {/* Main content area */}
    <div className="md:col-span-2 lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-100">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    
    {/* Sidebar */}
    <div className="space-y-6">
      <div className="bg-slate-100 rounded-3xl p-6">
        <Skeleton className="h-8 w-8 mb-4" />
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="bg-white rounded-3xl p-6 border border-slate-100">
        <Skeleton className="h-8 w-8 mb-4" />
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
