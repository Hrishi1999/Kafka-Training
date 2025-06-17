import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FastAPIArchitectureProps {
  showComponents: string[];
  showFlow: boolean;
  showScaling: boolean;
}

const FastAPIArchitecture: React.FC<FastAPIArchitectureProps> = ({
  showComponents,
  showFlow,
  showScaling,
}) => {
  const [activeRequest, setActiveRequest] = useState<number | null>(null);
  const [scalingMode, setScalingMode] = useState<'single' | 'scaled'>('single');

  const handleSendRequest = () => {
    const requestId = Date.now();
    setActiveRequest(requestId);
    
    setTimeout(() => {
      setActiveRequest(null);
    }, 3000);
  };

  const architectureSteps = [
    { id: 1, name: "HTTP Request", component: "FastAPI", description: "POST /payments" },
    { id: 2, name: "Validation", component: "Pydantic", description: "Schema validation" },
    { id: 3, name: "Serialization", component: "Avro", description: "Schema Registry lookup" },
    { id: 4, name: "Produce", component: "Kafka", description: "Message to topic" },
    { id: 5, name: "Response", component: "FastAPI", description: "202 Accepted" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          FastAPI + Kafka Integration Architecture
        </h3>
        <p className="text-gray-600">
          Production-ready REST API with event streaming
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          {/* Client */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 text-center"
          >
            <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              📱
            </div>
            <h4 className="font-semibold text-blue-600 mb-2">Client App</h4>
            <div className="text-sm text-gray-600">
              Mobile/Web Application
            </div>
          </motion.div>

          {/* FastAPI */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeRequest 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              🚀
            </div>
            <h4 className="font-semibold text-green-600 mb-2">FastAPI</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✓ REST Endpoints</div>
              <div>✓ Pydantic Validation</div>
              <div>✓ Async Processing</div>
            </div>
            {activeRequest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-2 bg-green-100 rounded text-xs"
              >
                Processing request...
              </motion.div>
            )}
          </motion.div>

          {/* Schema Registry */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50"
          >
            <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              📋
            </div>
            <h4 className="font-semibold text-purple-600 mb-2">Schema Registry</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>🔍 Schema Validation</div>
              <div>🆔 ID Management</div>
              <div>📐 Avro Serialization</div>
            </div>
          </motion.div>

          {/* Kafka */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50"
          >
            <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
              📊
            </div>
            <h4 className="font-semibold text-orange-600 mb-2">Kafka</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📤 Event Streaming</div>
              <div>⚡ High Throughput</div>
              <div>🔄 Reliable Delivery</div>
            </div>
          </motion.div>
        </div>

        {/* Flow Animation */}
        {showFlow && activeRequest && (
          <div className="mt-6">
            <div className="flex justify-between items-center">
              {[0, 1, 2, 3].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.5 }}
                  className="text-2xl"
                >
                  →
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Request Flow Simulation */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Request Flow Simulation
          </h4>
          <button
            onClick={handleSendRequest}
            disabled={!!activeRequest}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {activeRequest ? 'Processing...' : '📤 Send Payment Request'}
          </button>
        </div>

        <div className="space-y-3">
          {architectureSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: activeRequest && Date.now() - activeRequest > index * 500 ? 1 : 0.3,
                scale: activeRequest && Date.now() - activeRequest > index * 500 ? 1.02 : 1
              }}
              className={`p-3 rounded-lg border transition-colors ${
                activeRequest && Date.now() - activeRequest > index * 500
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {step.id}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{step.name}</div>
                  <div className="text-xs text-gray-500">{step.component}: {step.description}</div>
                </div>
                {activeRequest && Date.now() - activeRequest > index * 500 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-green-500 text-xl"
                  >
                    ✓
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeRequest && Date.now() - activeRequest > 2500 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg"
            >
              <div className="flex items-center">
                <span className="text-green-600 text-xl mr-3">🎉</span>
                <div>
                  <div className="font-medium text-green-800">Payment Submitted Successfully!</div>
                  <div className="text-sm text-green-600">Status: 202 Accepted • Payment ID: {activeRequest}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scaling Comparison */}
      {showScaling && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Scaling Patterns
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setScalingMode('single')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  scalingMode === 'single'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Anti-Pattern
              </button>
              <button
                onClick={() => setScalingMode('scaled')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  scalingMode === 'scaled'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Best Practice
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {scalingMode === 'single' && (
              <motion.div
                key="single"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <h5 className="font-semibold text-red-600 mb-3">
                  ❌ Producer Per Request (Anti-Pattern)
                </h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium text-red-800 mb-2">Problems:</h6>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Expensive connection setup per request</li>
                      <li>• TCP handshake overhead</li>
                      <li>• Resource exhaustion under load</li>
                      <li>• Poor batching efficiency</li>
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-medium text-red-800 mb-2">Performance:</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Throughput:</span>
                        <span className="font-mono text-red-600">~450 RPS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-mono text-red-600">~220ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Errors:</span>
                        <span className="font-mono text-red-600">2.3%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {scalingMode === 'scaled' && (
              <motion.div
                key="scaled"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <h5 className="font-semibold text-green-600 mb-3">
                  ✅ Shared Producer Instance (Best Practice)
                </h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium text-green-800 mb-2">Benefits:</h6>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Single connection, shared across requests</li>
                      <li>• Efficient batching and compression</li>
                      <li>• Thread-safe concurrent access</li>
                      <li>• Proper resource management</li>
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-medium text-green-800 mb-2">Performance:</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Throughput:</span>
                        <span className="font-mono text-green-600">~8,500 RPS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-mono text-green-600">~12ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Errors:</span>
                        <span className="font-mono text-green-600">0.01%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h6 className="font-medium text-blue-800 mb-2">💡 Implementation Tip</h6>
            <p className="text-sm text-blue-700">
              Use FastAPI's lifespan events to initialize a single producer instance at startup 
              and share it across all requests. This pattern scales to thousands of concurrent requests.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FastAPIArchitecture;