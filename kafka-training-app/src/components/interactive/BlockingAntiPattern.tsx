import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Scenario {
  partition: number;
  blockedMessage: string;
  backlogCount: number;
  impact: string;
  timeBlocked: string;
}

interface BlockingAntiPatternProps {
  scenario: Scenario;
  showImpact: boolean;
}

const BlockingAntiPattern: React.FC<BlockingAntiPatternProps> = ({
  scenario,
  showImpact,
}) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState(0);
  const [blockedTime, setBlockedTime] = useState(0);
  const [processingMessage, setProcessingMessage] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked) {
      interval = setInterval(() => {
        setBlockedTime(prev => prev + 1);
        setQueuedMessages(prev => Math.min(prev + Math.floor(Math.random() * 3) + 1, scenario.backlogCount));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, scenario.backlogCount]);

  const simulateBlocking = () => {
    setIsBlocked(true);
    setBlockedTime(0);
    setQueuedMessages(0);
    setProcessingMessage(1);
  };

  const resolveBlocking = () => {
    setIsBlocked(false);
    setBlockedTime(0);
    setQueuedMessages(0);
    setProcessingMessage(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Generate message queue for visualization
  const messageQueue = Array.from({ length: Math.min(queuedMessages, 10) }, (_, i) => ({
    id: i + 2,
    type: i === 0 ? 'blocked' : 'valid',
    description: i === 0 ? scenario.blockedMessage : `Valid payment ${i + 1}`,
  }));

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-red-50 to-yellow-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          The Blocking Anti-Pattern
        </h3>
        <p className="text-gray-600">
          How one bad message can bring down an entire partition
        </p>
      </div>

      {/* Partition Visualization */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Partition {scenario.partition} - Consumer Processing
          </h4>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isBlocked 
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isBlocked ? `🔴 BLOCKED` : '🟢 Processing'}
            </div>
            {isBlocked && (
              <div className="text-sm text-gray-600">
                Blocked for: <span className="font-mono font-bold">{formatTime(blockedTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Consumer Processing Area */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-600 mb-3">Consumer Process</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm">Current Message:</span>
                <span className="font-mono text-sm">
                  {processingMessage ? `Message #${processingMessage}` : 'Idle'}
                </span>
              </div>
              
              {isBlocked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-100 border border-red-300 rounded"
                >
                  <div className="text-sm text-red-700">
                    <strong>💥 Processing Error:</strong>
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {scenario.blockedMessage}
                  </div>
                  <div className="text-xs text-red-500 mt-2">
                    Consumer is retrying indefinitely...
                  </div>
                </motion.div>
              )}

              <div className="text-xs text-gray-600">
                <strong>Pattern:</strong> Blocking retries on same message
              </div>
            </div>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold text-orange-600 mb-3">Message Queue</h5>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messageQueue.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No messages in queue
                </div>
              ) : (
                messageQueue.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-2 rounded text-xs ${
                      message.type === 'blocked'
                        ? 'bg-red-100 border border-red-300 text-red-700'
                        : 'bg-yellow-100 border border-yellow-300 text-yellow-700'
                    }`}
                  >
                    <div className="font-medium">Message #{message.id}</div>
                    <div className="truncate">{message.description}</div>
                  </motion.div>
                ))
              )}
            </div>
            
            {queuedMessages > 10 && (
              <div className="text-xs text-gray-500 text-center mt-2">
                ... and {queuedMessages - 10} more messages
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={simulateBlocking}
            disabled={isBlocked}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBlocked ? 'Simulating...' : '🚫 Trigger Blocking'}
          </button>
          <button
            onClick={resolveBlocking}
            disabled={!isBlocked}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔧 Resolve Block
          </button>
        </div>
      </div>

      {/* Impact Metrics */}
      {showImpact && isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-lg mb-6"
        >
          <h4 className="text-lg font-semibold text-red-600 mb-4">
            🚨 Real-Time Impact
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="p-4 bg-red-50 rounded-lg border border-red-200"
            >
              <div className="text-2xl font-bold text-red-600">
                {queuedMessages.toLocaleString()}
              </div>
              <div className="text-sm text-red-700">Messages Blocked</div>
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              className="p-4 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div className="text-2xl font-bold text-orange-600">
                {formatTime(blockedTime)}
              </div>
              <div className="text-sm text-orange-700">Time Blocked</div>
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
            >
              <div className="text-2xl font-bold text-yellow-600">
                $0
              </div>
              <div className="text-sm text-yellow-700">Revenue Generated</div>
            </motion.div>
          </div>
          
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="font-semibold text-red-800">{scenario.impact}</div>
            <div className="text-sm text-red-600 mt-1">
              All valid payments are waiting behind the poison pill message.
            </div>
          </div>
        </motion.div>
      )}

      {/* Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Problem Analysis */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-red-600 mb-4">
            ❌ Why This Pattern Fails
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-red-50 rounded">
              <strong>Single Point of Failure:</strong> One bad message blocks entire partition
            </div>
            <div className="p-3 bg-red-50 rounded">
              <strong>Cascading Effect:</strong> All subsequent messages queued indefinitely
            </div>
            <div className="p-3 bg-red-50 rounded">
              <strong>Resource Waste:</strong> Consumer CPU spinning on retries
            </div>
            <div className="p-3 bg-red-50 rounded">
              <strong>Business Impact:</strong> Valid transactions cannot be processed
            </div>
          </div>
        </div>

        {/* Solution Preview */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-green-600 mb-4">
            ✅ Dead Letter Queue Solution
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded">
              <strong>Isolation:</strong> Failed messages moved to separate topic
            </div>
            <div className="p-3 bg-green-50 rounded">
              <strong>Continuation:</strong> Partition processing continues normally
            </div>
            <div className="p-3 bg-green-50 rounded">
              <strong>Retry Logic:</strong> Intelligent retry with exponential backoff
            </div>
            <div className="p-3 bg-green-50 rounded">
              <strong>Monitoring:</strong> Failed messages tracked for manual review
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <strong>Result:</strong> Resilient system that handles poison pills gracefully 
            while maintaining high throughput for valid messages.
          </div>
        </div>
      </div>

      {/* Recovery Message */}
      <AnimatePresence>
        {!isBlocked && queuedMessages > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center"
          >
            <div className="text-green-800">
              <strong>🎉 Partition Recovered!</strong>
            </div>
            <div className="text-sm text-green-600 mt-1">
              Processing resumed for all queued messages. Implementing DLQ would have prevented this outage entirely.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockingAntiPattern;