import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  visited: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, visited }) => {
  const progress = (current / total) * 100;
  const visitedProgress = (visited / total) * 100;

  return (
    <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Visited slides progress */}
          <div
            className="absolute inset-y-0 left-0 bg-green-500/30 transition-all duration-300"
            style={{ width: `${visitedProgress}%` }}
          />
          {/* Current progress */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          {/* Progress indicator */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-lg transition-all duration-300"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-600">
          <span>{visited} slides visited</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>
    </div>
  );
};