import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Day1ToDay2EvolutionProps {
  day1Features: string[];
  day2Features: string[];
}

const Day1ToDay2Evolution: React.FC<Day1ToDay2EvolutionProps> = ({
  day1Features,
  day2Features,
}) => {
  const [currentView, setCurrentView] = useState<'day1' | 'evolution' | 'day2'>('day1');

  const handleNext = () => {
    if (currentView === 'day1') setCurrentView('evolution');
    else if (currentView === 'evolution') setCurrentView('day2');
  };

  const handlePrev = () => {
    if (currentView === 'day2') setCurrentView('evolution');
    else if (currentView === 'evolution') setCurrentView('day1');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Evolution from Day 1 to Day 2
        </h3>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => setCurrentView('day1')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'day1' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-blue-600 hover:bg-blue-50'
            }`}
          >
            Day 1
          </button>
          <button
            onClick={() => setCurrentView('evolution')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'evolution' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-purple-600 hover:bg-purple-50'
            }`}
          >
            Evolution
          </button>
          <button
            onClick={() => setCurrentView('day2')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'day2' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-green-600 hover:bg-green-50'
            }`}
          >
            Day 2
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'day1' && (
          <motion.div
            key="day1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-lg p-6 shadow-lg"
          >
            <h4 className="text-xl font-semibold text-blue-600 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">1</span>
              Day 1: Foundation
            </h4>
            <div className="grid gap-3">
              {day1Features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'evolution' && (
          <motion.div
            key="evolution"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 shadow-lg"
          >
            <h4 className="text-xl font-semibold text-purple-600 mb-6 text-center">
              🚀 Evolution Process
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-blue-600 mb-3">From Day 1:</h5>
                <div className="space-y-2">
                  {day1Features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <span className="w-4 h-4 text-blue-400 mr-2">→</span>
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-green-600 mb-3">To Day 2:</h5>
                <div className="space-y-2">
                  {day2Features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <span className="w-4 h-4 text-green-400 mr-2">✓</span>
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block text-purple-600 text-2xl"
              >
                ⚙️
              </motion.div>
              <p className="text-sm text-gray-600 mt-2">
                Transforming basic implementation into production-ready architecture
              </p>
            </div>
          </motion.div>
        )}

        {currentView === 'day2' && (
          <motion.div
            key="day2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-white rounded-lg p-6 shadow-lg"
          >
            <h4 className="text-xl font-semibold text-green-600 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mr-3">2</span>
              Day 2: Production Ready
            </h4>
            <div className="grid gap-3">
              {day2Features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-green-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
              <p className="text-sm text-gray-700 text-center">
                <strong>Result:</strong> Enterprise-grade event streaming system ready for production workloads
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentView === 'day1'}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentView === 'day2'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Day1ToDay2Evolution;