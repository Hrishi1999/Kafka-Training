import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SlideViewer } from './components/SlideViewer';
import { SlideNavigation } from './components/SlideNavigation';
import { ProgressBar } from './components/ProgressBar';
import { TableOfContents } from './components/TableOfContents';
import { slidesData, getTotalSlides } from './data/slidesData';
import { Menu } from 'lucide-react';

function App() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));

  const totalSlides = getTotalSlides();
  const currentSlide = slidesData[currentSlideIndex];

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('kafkaTrainingProgress');
    if (savedProgress) {
      const { slideIndex, visited } = JSON.parse(savedProgress);
      setCurrentSlideIndex(slideIndex);
      setVisitedSlides(new Set(visited));
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('kafkaTrainingProgress', JSON.stringify({
      slideIndex: currentSlideIndex,
      visited: Array.from(visitedSlides)
    }));
  }, [currentSlideIndex, visitedSlides]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlideIndex(index);
      setVisitedSlides(prev => new Set([...Array.from(prev), index]));
      setShowToc(false);
    }
  }, [totalSlides]);

  const goToNextSlide = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, goToSlide]);

  const goToPreviousSlide = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousSlide();
      } else if (e.key === 'Escape') {
        setShowToc(false);
      } else if (e.key === 'm' && e.ctrlKey) {
        setShowToc(!showToc);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNextSlide, goToPreviousSlide, showToc]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/30 to-pink-100/30 animate-pulse-slow" />
      
      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowToc(!showToc)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Toggle table of contents"
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Kafka Training - Interactive Walkthrough</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Module {currentSlide.module} - {currentSlide.section}
              </span>
              <span className="text-sm text-gray-600">
                Slide {currentSlideIndex + 1} of {totalSlides}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <ProgressBar 
        current={currentSlideIndex + 1} 
        total={totalSlides}
        visited={visitedSlides.size}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <SlideViewer 
            key={currentSlide.id}
            slide={currentSlide} 
          />
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <SlideNavigation
        currentIndex={currentSlideIndex}
        totalSlides={totalSlides}
        onNext={goToNextSlide}
        onPrevious={goToPreviousSlide}
        onGoToSlide={goToSlide}
      />

      {/* Table of Contents Sidebar */}
      <AnimatePresence>
        {showToc && (
          <TableOfContents
            slides={slidesData}
            currentSlideIndex={currentSlideIndex}
            visitedSlides={visitedSlides}
            onSelectSlide={goToSlide}
            onClose={() => setShowToc(false)}
          />
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-600 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-sm space-y-1">
        <div>← → or Space: Navigate</div>
        <div>Ctrl+M: Menu</div>
        <div>Esc: Close menu</div>
      </div>
    </div>
  );
}

export default App;