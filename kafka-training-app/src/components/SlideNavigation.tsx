import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface SlideNavigationProps {
  currentIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrevious: () => void;
  onGoToSlide: (index: number) => void;
}

export const SlideNavigation: React.FC<SlideNavigationProps> = ({
  currentIndex,
  totalSlides,
  onNext,
  onPrevious,
  onGoToSlide,
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex items-center space-x-4 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-700"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => onGoToSlide(0)}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all text-gray-700"
          aria-label="Go to first slide"
        >
          <Home className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2">
          <input
            type="number"
            min={1}
            max={totalSlides}
            value={currentIndex + 1}
            onChange={(e) => {
              const slideNumber = parseInt(e.target.value) - 1;
              if (!isNaN(slideNumber) && slideNumber >= 0 && slideNumber < totalSlides) {
                onGoToSlide(slideNumber);
              }
            }}
            className="w-16 px-2 py-1 text-center bg-gray-50 rounded border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-900"
          />
          <span className="text-gray-600">/ {totalSlides}</span>
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalSlides - 1}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-700"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};