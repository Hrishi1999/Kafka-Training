import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LabSlideContent } from '../../types/slides';
import { CheckCircle, Circle, Lightbulb, Target, AlertCircle } from 'lucide-react';

interface LabSlideProps {
  content: LabSlideContent;
}

export const LabSlide: React.FC<LabSlideProps> = ({ content }) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [showHints, setShowHints] = useState(false);

  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTasks(newCompleted);
  };

  const tasks = content.tasks || content.steps || [];
  const progress = tasks.length > 0 ? (completedTasks.size / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1 bg-purple-100 border border-purple-300 rounded-full">
            <span className="text-sm font-semibold text-purple-700">
              Lab {content.labNumber}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">{content.title}</h3>
        </div>
        <div className="text-sm text-gray-600">
          {completedTasks.size} / {tasks.length} completed
          {content.estimatedTime && (
            <div className="text-xs text-gray-500 mt-1">
              Estimated time: {content.estimatedTime}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span className="text-gray-900">Tasks</span>
        </h4>
        {tasks.map((task, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all
              ${completedTasks.has(index)
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => toggleTask(index)}
          >
            <div className="flex items-start space-x-3">
              {completedTasks.has(index) ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <span className={completedTasks.has(index) ? 'line-through text-gray-500' : 'text-gray-800'}>
                {task}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expected Outcomes */}
      {content.expectedOutcome && content.expectedOutcome.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-900">Expected Outcomes</span>
          </h4>
          <div className="space-y-2">
            {content.expectedOutcome.map((outcome, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <span className="text-sm text-green-800">{outcome}</span>
            </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Hints */}
      {content.hints && content.hints.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <Lightbulb className="h-5 w-5" />
            <span className="font-semibold">
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </span>
          </button>
          
          {showHints && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              {content.hints.map((hint, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2"
                >
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-yellow-800">{hint}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};