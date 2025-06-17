import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Scenario {
  name: string;
  vus: number;
  rps: number;
  latency: string;
  errors: string;
}

interface FastAPILoadTestProps {
  scenarios: Scenario[];
  showMetrics: boolean;
}

const FastAPILoadTest: React.FC<FastAPILoadTestProps> = ({
  scenarios,
  showMetrics,
}) => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState({
    requests: 0,
    responses: 0,
    errors: 0,
    latency: 0,
  });
  const [testDuration, setTestDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTestDuration(prev => prev + 1);
        
        const scenario = scenarios[selectedScenario];
        const errorRate = parseFloat(scenario.errors.replace('%', '')) / 100;
        const baseRps = scenario.rps;
        
        // Simulate realistic metrics
        setCurrentMetrics(prev => ({
          requests: prev.requests + baseRps + Math.floor(Math.random() * 20 - 10),
          responses: prev.responses + Math.floor(baseRps * (1 - errorRate)),
          errors: prev.errors + Math.floor(baseRps * errorRate),
          latency: parseInt(scenario.latency) + Math.floor(Math.random() * 10 - 5),
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, selectedScenario, scenarios]);

  const startTest = () => {
    setIsRunning(true);
    setCurrentMetrics({ requests: 0, responses: 0, errors: 0, latency: 0 });
    setTestDuration(0);
  };

  const stopTest = () => {
    setIsRunning(false);
  };

  const resetTest = () => {
    setIsRunning(false);
    setCurrentMetrics({ requests: 0, responses: 0, errors: 0, latency: 0 });
    setTestDuration(0);
  };

  const currentScenario = scenarios[selectedScenario];
  const successRate = currentMetrics.requests > 0 
    ? ((currentMetrics.responses / currentMetrics.requests) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-red-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          FastAPI Load Testing Dashboard
        </h3>
        <p className="text-gray-600">
          Compare performance patterns: Single vs Shared Producer
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Test Scenarios
        </h4>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setSelectedScenario(index);
                resetTest();
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedScenario === index
                  ? index === 1
                    ? 'border-red-500 bg-red-50'
                    : 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <h5 className={`font-semibold mb-3 ${
                index === 1 ? 'text-red-600' : 'text-green-600'
              }`}>
                {index === 1 ? '❌' : '✅'} {scenario.name}
              </h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Virtual Users:</span>
                  <div className="font-bold">{scenario.vus}</div>
                </div>
                <div>
                  <span className="text-gray-600">Target RPS:</span>
                  <div className="font-bold">{scenario.rps.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Expected Latency:</span>
                  <div className="font-bold">{scenario.latency}</div>
                </div>
                <div>
                  <span className="text-gray-600">Error Rate:</span>
                  <div className="font-bold">{scenario.errors}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Test Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={startTest}
            disabled={isRunning}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running...' : '▶️ Start Load Test'}
          </button>
          <button
            onClick={stopTest}
            disabled={!isRunning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ⏹️ Stop Test
          </button>
          <button
            onClick={resetTest}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Live Metrics */}
      {showMetrics && (
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Live Metrics
            </h4>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Duration: <span className="font-mono font-bold">{testDuration}s</span>
              </div>
              {isRunning && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-3 h-3 bg-green-500 rounded-full"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
              className="p-4 bg-blue-50 rounded-lg"
            >
              <div className="text-sm text-blue-600 mb-1">Total Requests</div>
              <div className="text-2xl font-bold text-blue-800">
                {currentMetrics.requests.toLocaleString()}
              </div>
            </motion.div>

            <motion.div
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: isRunning ? Infinity : 0, delay: 0.2 }}
              className="p-4 bg-green-50 rounded-lg"
            >
              <div className="text-sm text-green-600 mb-1">Successful</div>
              <div className="text-2xl font-bold text-green-800">
                {currentMetrics.responses.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">
                {successRate}% success rate
              </div>
            </motion.div>

            <motion.div
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: isRunning ? Infinity : 0, delay: 0.4 }}
              className="p-4 bg-red-50 rounded-lg"
            >
              <div className="text-sm text-red-600 mb-1">Errors</div>
              <div className="text-2xl font-bold text-red-800">
                {currentMetrics.errors.toLocaleString()}
              </div>
            </motion.div>

            <motion.div
              animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: isRunning ? Infinity : 0, delay: 0.6 }}
              className="p-4 bg-purple-50 rounded-lg"
            >
              <div className="text-sm text-purple-600 mb-1">Avg Latency</div>
              <div className="text-2xl font-bold text-purple-800">
                {currentMetrics.latency}ms
              </div>
            </motion.div>
          </div>

          {/* Progress Visualization */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{testDuration > 0 ? `${Math.min(testDuration, 60)}/60s` : '0/60s'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((testDuration / 60) * 100, 100)}%` }}
                className={`h-2 rounded-full ${
                  selectedScenario === 0 ? 'bg-red-500' : 'bg-green-500'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Analysis */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Performance Analysis
        </h4>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedScenario}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg ${
              selectedScenario === 0 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}
          >
            <h5 className={`font-semibold mb-3 ${
              selectedScenario === 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {currentScenario.name} Analysis
            </h5>
            
            {selectedScenario === 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-red-700">
                  <strong>Problem:</strong> Creating a new Kafka producer for each HTTP request
                </div>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• TCP connection overhead (3-way handshake)</li>
                  <li>• Producer configuration and initialization</li>
                  <li>• No connection pooling or reuse</li>
                  <li>• Resource exhaustion under load</li>
                  <li>• Poor batching efficiency</li>
                </ul>
                <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-800">
                  <strong>Impact:</strong> 19x slower throughput, 18x higher latency, 230x more errors
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-green-700">
                  <strong>Solution:</strong> Single shared producer instance with proper lifecycle management
                </div>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• Single TCP connection shared across requests</li>
                  <li>• Thread-safe concurrent access</li>
                  <li>• Efficient message batching</li>
                  <li>• Optimal resource utilization</li>
                  <li>• Built-in retries and error handling</li>
                </ul>
                <div className="mt-3 p-3 bg-green-100 rounded text-sm text-green-800">
                  <strong>Result:</strong> Production-ready performance handling thousands of requests per second
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h6 className="font-medium text-blue-800 mb-2">💡 Key Takeaway</h6>
          <p className="text-sm text-blue-700">
            Producer lifecycle management is critical for performance. Use FastAPI's lifespan events 
            to initialize producers at startup and share them across requests. This single change 
            can improve throughput by 10-20x while reducing errors and latency.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FastAPILoadTest;