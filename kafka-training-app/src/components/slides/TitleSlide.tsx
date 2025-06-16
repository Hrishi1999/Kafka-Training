import React from 'react';
import { motion } from 'framer-motion';
import { TitleSlideContent } from '../../types/slides';

interface TitleSlideProps {
  content: TitleSlideContent;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({ content }) => {
  return (
    <div className="h-full h-[600px] flex items-center justify-center text-center relative">
      {content.backgroundAnimation && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          {content.mainTitle}
        </motion.h1>
        
        {content.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-700 mb-8"
          >
            {content.subtitle}
          </motion.p>
        )}
        
        {content.instructor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-lg max-w-md mx-auto"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructor</h3>
            <p className="text-xl font-bold text-blue-600 mb-1">{content.instructor.name}</p>
            <p className="text-gray-600">{content.instructor.role}</p>
            <p className="text-gray-600">{content.instructor.company}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};