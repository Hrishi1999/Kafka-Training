import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Topic {
  name: string;
  type: 'primary' | 'retry' | 'dlq';
  delay: string;
}

interface RetryTopicArchitectureProps {
  topics: Topic[];
  showFlow: boolean;
  showMetrics: boolean;
}

const RetryTopicArchitecture: React.FC<RetryTopicArchitectureProps> = ({
  topics,
  showFlow,
  showMetrics,
}) => {
  const [simulationActive, setSimulationActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<{
    id: string;
    topic: string;
    retryCount: number;
    error: string;
  } | null>(null);

  const simulateRetryFlow = async () => {
    setSimulationActive(true);
    
    const messageId = `msg-${Date.now()}`;
    
    // Start with main topic
    setCurrentMessage({
      id: messageId,
      topic: 'payments-main',
      retryCount: 0,
      error: 'External service timeout'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Move to retry-1
    setCurrentMessage({
      id: messageId,
      topic: 'payments-retry-1',
      retryCount: 1,
      error: 'External service timeout'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Move to retry-5
    setCurrentMessage({
      id: messageId,
      topic: 'payments-retry-5',
      retryCount: 2,
      error: 'External service timeout'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Move to retry-15
    setCurrentMessage({
      id: messageId,
      topic: 'payments-retry-15',
      retryCount: 3,
      error: 'External service timeout'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Finally to DLQ
    setCurrentMessage({
      id: messageId,
      topic: 'payments-dlq',
      retryCount: 4,
      error: 'Max retries exceeded'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentMessage(null);
    setSimulationActive(false);
  };

  const getTopicColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-blue-500';
      case 'retry': return 'bg-yellow-500';
      case 'dlq': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTopicIcon = (type: string) => {
    switch (type) {
      case 'primary': return '📊';
      case 'retry': return '🔄';
      case 'dlq': return '☠️';
      default: return '📋';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Retry Topic Architecture
        </h3>
        <p className="text-gray-600">
          Non-blocking retry system with exponential backoff
        </p>
      </div>

      {/* Topic Flow Diagram */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex flex-wrap justify-center items-center gap-6">
          {topics.map((topic, index) => (
            <React.Fragment key={topic.name}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  currentMessage?.topic === topic.name
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 ${getTopicColor(topic.type)} text-white rounded-full flex items-center justify-center text-xl mx-auto mb-2`}>
                    {getTopicIcon(topic.type)}
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">
                    {topic.name}
                  </h4>
                  <div className="text-xs text-gray-600 mb-2">
                    Delay: {topic.delay}
                  </div>
                  {topic.type === 'retry' && (
                    <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      Auto-retry
                    </div>
                  )}
                  {topic.type === 'dlq' && (
                    <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Manual review
                    </div>
                  )}
                </div>

                {/* Current Message Indicator */}
                <AnimatePresence>
                  {currentMessage?.topic === topic.name && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      1
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Arrow */}
              {index < topics.length - 1 && (
                <motion.div
                  animate={
                    showFlow && simulationActive
                      ? { x: [0, 5, 0] }
                      : {}
                  }
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-gray-400 text-2xl"
                >
                  →
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={simulateRetryFlow}
            disabled={simulationActive}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {simulationActive ? 'Simulating...' : '▶️ Simulate Retry Flow'}
          </button>
        </div>
      </div>

      {/* Current Message Status */}
      <AnimatePresence>
        {currentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg p-6 shadow-lg mb-6"
          >
            <h4 className="text-lg font-semibold text-purple-600 mb-4">
              📨 Message Tracking
            </h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-sm text-blue-600">Message ID</div>
                <div className="font-mono text-sm">{currentMessage.id}</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="text-sm text-yellow-600">Current Topic</div>
                <div className="font-medium text-sm">{currentMessage.topic}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <div className="text-sm text-orange-600">Retry Count</div>
                <div className="font-bold text-lg">{currentMessage.retryCount}</div>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <div className="text-sm text-red-600">Error</div>
                <div className="text-xs">{currentMessage.error}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Dashboard */}
      {showMetrics && (
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Retry System Metrics
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">97.8%</div>
              <div className="text-sm text-green-700">Success Rate</div>
              <div className="text-xs text-green-600">First attempt</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">1.9%</div>
              <div className="text-sm text-yellow-700">Retry Rate</div>
              <div className="text-xs text-yellow-600">Resolved on retry</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">0.3%</div>
              <div className="text-sm text-red-700">DLQ Rate</div>
              <div className="text-xs text-red-600">Manual review needed</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12ms</div>
              <div className="text-sm text-blue-700">Avg Latency</div>
              <div className="text-xs text-blue-600">Including retries</div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Details */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          ⚙️ System Configuration
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-purple-600 mb-3">Retry Strategy</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Retry 1 (Transient errors):</span>
                <span className="font-mono">1 minute delay</span>
              </div>
              <div className="flex justify-between">
                <span>Retry 2 (Service issues):</span>
                <span className="font-mono">5 minute delay</span>
              </div>
              <div className="flex justify-between">
                <span>Retry 3 (Extended outage):</span>
                <span className="font-mono">15 minute delay</span>
              </div>
              <div className="flex justify-between">
                <span>Final destination:</span>
                <span className="font-mono">DLQ for manual review</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold text-green-600 mb-3">Benefits</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Non-blocking: Healthy messages process normally
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Intelligent: Exponential backoff prevents thundering herd
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Observable: Full message tracing and metrics
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Recoverable: DLQ allows manual intervention
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h6 className="font-medium text-blue-800 mb-2">💡 Implementation Notes</h6>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use message headers to track retry count and original topic</li>
            <li>• Implement scheduled processing using timestamp headers</li>
            <li>• Separate consumer groups for each retry topic</li>
            <li>• Monitor DLQ growth rate for operational alerts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RetryTopicArchitecture;