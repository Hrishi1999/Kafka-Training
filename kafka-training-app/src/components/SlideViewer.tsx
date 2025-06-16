import React from 'react';
import { motion } from 'framer-motion';
import { Slide } from '../types/slides';
import { TitleSlide } from './slides/TitleSlide';
import { TextSlide } from './slides/TextSlide';
import { CodeSlide } from './slides/CodeSlide';
import { InteractiveSlide } from './slides/InteractiveSlide';
import { LabSlide } from './slides/LabSlide';
import { ConfigSlide } from './slides/ConfigSlide';

interface SlideViewerProps {
  slide: Slide;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ slide }) => {
  const renderSlide = () => {
    switch (slide.content.type) {
      case 'title':
        return <TitleSlide content={slide.content} />;
      case 'text':
        return <TextSlide content={slide.content} />;
      case 'code':
        return <CodeSlide content={slide.content} />;
      case 'interactive':
        return <InteractiveSlide content={slide.content} />;
      case 'lab':
        return <LabSlide content={slide.content} />;
      case 'config':
        return <ConfigSlide content={slide.content} />;
      default:
        return <div>Unknown slide type</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-[600px] flex flex-col"
    >
      <h2 className="text-3xl font-bold mb-6 text-blue-600">{slide.title}</h2>
      <div className="flex-1">
        {renderSlide()}
      </div>
      {slide.notes && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Notes:</h4>
          <p className="text-sm text-gray-700">{slide.notes}</p>
        </div>
      )}
    </motion.div>
  );
};