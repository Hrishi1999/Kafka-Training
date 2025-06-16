import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Circle } from 'lucide-react';
import { Slide } from '../types/slides';

interface TableOfContentsProps {
  slides: Slide[];
  currentSlideIndex: number;
  visitedSlides: Set<number>;
  onSelectSlide: (index: number) => void;
  onClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  slides,
  currentSlideIndex,
  visitedSlides,
  onSelectSlide,
  onClose,
}) => {
  // Group slides by module
  const slidesByModule = slides.reduce((acc, slide, index) => {
    const module = slide.module;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push({ slide, index });
    return acc;
  }, {} as Record<number, { slide: Slide; index: number }[]>);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-30"
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed left-0 top-0 h-full w-80 bg-white z-40 shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Table of Contents</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-700"
            aria-label="Close table of contents"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {Object.entries(slidesByModule).map(([module, moduleSlides]) => (
            <div key={module}>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                Module {module}
              </h4>
              <div className="space-y-1">
                {moduleSlides.map(({ slide, index }) => {
                  const isVisited = visitedSlides.has(index);
                  const isCurrent = index === currentSlideIndex;

                  return (
                    <button
                      key={slide.id}
                      onClick={() => onSelectSlide(index)}
                      className={`
                        w-full text-left px-3 py-2 rounded transition-all
                        ${isCurrent 
                          ? 'bg-blue-500 text-white' 
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="mt-0.5">
                          {isVisited ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {index + 1}. {slide.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {slide.section}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
};