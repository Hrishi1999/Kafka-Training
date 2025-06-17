import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineEvent {
  time: number;
  event: string;
  offset?: number;
  status?: string;
}

interface AutoCommitFailureProps {
  scenario: string;
  timeline: TimelineEvent[];
  messageImpact: string;
}

const AutoCommitFailure: React.FC<AutoCommitFailureProps> = ({
  scenario,
  timeline,
  messageImpact,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTime < 12000) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 100;
          
          // Update current event based on timeline
          const eventIndex = timeline.findIndex(event => event.time > newTime);
          setCurrentEvent(eventIndex === -1 ? timeline.length : eventIndex);
          
          return newTime;
        });
      }, 100);
    } else if (currentTime >= 12000) {
      setIsPlaying(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTime, timeline]);

  const playScenario = () => {
    setCurrentTime(0);
    setCurrentEvent(0);
    setIsPlaying(true);
  };

  const resetScenario = () => {
    setCurrentTime(0);
    setCurrentEvent(0);
    setIsPlaying(false);
  };

  const getEventStatus = (index: number) => {
    if (index < currentEvent) return 'completed';
    if (index === currentEvent && isPlaying) return 'active';
    return 'pending';
  };

  const formatTime = (timeMs: number) => {
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-red-50 to-orange-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Auto-Commit Failure Demonstration
        </h3>
        <p className="text-gray-600">
          Watch how auto-commit can cause message loss during consumer crashes
        </p>
      </div>

      {/* Scenario Info */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-red-600">
            Scenario: {scenario}
          </h4>
          <div className="text-sm text-gray-600">
            Auto-commit interval: <span className="font-mono font-bold">5 seconds</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-600 mb-2">Consumer Config</h5>
            <div className="text-sm space-y-1">
              <div>enable.auto.commit = <span className="text-red-600 font-mono">true</span></div>
              <div>auto.commit.interval.ms = <span className="font-mono">5000</span></div>
              <div>Processing time = <span className="font-mono">7 seconds</span></div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-semibold text-yellow-600 mb-2">The Problem</h5>
            <div className="text-sm">
              Consumer crashes <strong>after</strong> auto-commit but <strong>before</strong> processing completes
            </div>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <h5 className="font-semibold text-red-600 mb-2">Impact</h5>
            <div className="text-sm font-semibold">
              {messageImpact}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={playScenario}
            disabled={isPlaying}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPlaying ? 'Playing...' : '▶️ Simulate Failure'}
          </button>
          <button
            onClick={resetScenario}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Timeline of Events
        </h4>

        {/* Time Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>0s</span>
            <span>Current: {formatTime(currentTime)}</span>
            <span>12s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentTime / 12000) * 100}%` }}
              className="h-3 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"
            />
          </div>
        </div>

        {/* Events */}
        <div className="space-y-4">
          {timeline.map((event, index) => {
            const status = getEventStatus(index);
            const isCurrentEvent = index === currentEvent - 1 && isPlaying;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: isCurrentEvent ? 1.02 : 1
                }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  status === 'completed' 
                    ? event.status === 'crashed' || event.status === 'lost'
                      ? 'border-red-500 bg-red-50'
                      : 'border-green-500 bg-green-50'
                    : status === 'active'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <span className="w-12 h-8 bg-gray-100 text-gray-600 rounded flex items-center justify-center text-sm font-mono mr-3">
                      {formatTime(event.time)}
                    </span>
                    {event.offset && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        offset: {event.offset}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{event.event}</div>
                    {event.status && (
                      <div className="text-sm text-gray-600">Status: {event.status}</div>
                    )}
                  </div>

                  <div className="ml-4">
                    {status === 'completed' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-2xl ${
                          event.status === 'crashed' || event.status === 'lost'
                            ? 'text-red-500'
                            : 'text-green-500'
                        }`}
                      >
                        {event.status === 'crashed' || event.status === 'lost' ? '💥' : '✓'}
                      </motion.div>
                    )}
                    {status === 'active' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Problem Analysis */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-red-600 mb-4">
            🚨 What Went Wrong?
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-red-50 rounded">
              <strong>T+5s:</strong> Auto-commit triggers, Kafka marks offset 1235 as processed
            </div>
            <div className="p-3 bg-red-50 rounded">
              <strong>T+7s:</strong> Consumer crashes before completing message 1234 processing
            </div>
            <div className="p-3 bg-red-50 rounded">
              <strong>T+10s:</strong> Consumer restarts, resumes from committed offset 1235
            </div>
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <strong>Result:</strong> Message 1234 is never processed - permanently lost!
            </div>
          </div>
        </div>

        {/* Solution */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-green-600 mb-4">
            ✅ Manual Commit Solution
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded">
              <strong>Config:</strong> enable.auto.commit = false
            </div>
            <div className="p-3 bg-green-50 rounded">
              <strong>Pattern:</strong> Process message → Commit offset
            </div>
            <div className="p-3 bg-green-50 rounded">
              <strong>Guarantee:</strong> Only commit after successful processing
            </div>
            <div className="p-3 bg-green-100 border border-green-300 rounded">
              <strong>Result:</strong> At-least-once delivery guarantee - no message loss!
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <strong>Trade-off:</strong> Possible duplicates during failure, but idempotent 
            processing can handle this safely.
          </div>
        </div>
      </div>

      {/* Final Impact Message */}
      <AnimatePresence>
        {currentTime >= 12000 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-red-100 border-2 border-red-300 rounded-lg text-center"
          >
            <div className="text-2xl mb-2">💸</div>
            <h4 className="text-xl font-bold text-red-800 mb-2">
              Mission Critical Data Lost!
            </h4>
            <p className="text-red-700">
              This scenario demonstrates why auto-commit is dangerous for financial systems. 
              In production, this would trigger incident response, customer complaints, and potential regulatory issues.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoCommitFailure;