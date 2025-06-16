import React from 'react';
import { motion } from 'framer-motion';
import { TextSlideContent } from '../../types/slides';
import { CheckCircle } from 'lucide-react';

interface TextSlideProps {
  content: TextSlideContent;
}

export const TextSlide: React.FC<TextSlideProps> = ({ content }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {content.points.map((point, index) => (
          <motion.li
            key={index}
            variants={itemVariants}
            className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-lg text-gray-800">{point}</span>
          </motion.li>
        ))}
      </motion.ul>

      {content.image && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <img
            src={content.image}
            alt="Slide illustration"
            className="rounded-lg shadow-lg mx-auto"
          />
        </motion.div>
      )}
    </div>
  );
};