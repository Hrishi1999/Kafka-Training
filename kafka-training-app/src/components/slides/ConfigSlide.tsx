import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigSlideContent, ConfigItem } from '../../types/slides';
import { Info, AlertCircle } from 'lucide-react';

interface ConfigSlideProps {
  content: ConfigSlideContent;
}

export const ConfigSlide: React.FC<ConfigSlideProps> = ({ content }) => {
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getImportanceIcon = (importance?: string) => {
    switch (importance) {
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {content.configs.map((config, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all
              ${getImportanceColor(config.importance)}
              hover:shadow-lg hover:scale-[1.02]
            `}
            onClick={() => setSelectedConfig(config)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <code className="text-sm font-mono text-blue-600">{config.key}</code>
                <div className="mt-1 text-sm font-mono text-gray-700">{config.value}</div>
                <p className="mt-2 text-sm text-gray-600">{config.description}</p>
              </div>
              <div className="ml-3">
                {getImportanceIcon(config.importance)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedConfig && selectedConfig.details && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">
                  Detailed Explanation: {selectedConfig.key}
                </h4>
                <p className="text-gray-700">{selectedConfig.details}</p>
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <code className="text-sm text-gray-800">
                    {selectedConfig.key}={selectedConfig.value}
                  </code>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};