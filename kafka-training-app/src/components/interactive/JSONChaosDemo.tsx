import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Scenario {
  name: string;
  producer: string;
  consumer: string;
  error: string;
}

interface JSONChaosDemoProps {
  scenarios: Scenario[];
}

const JSONChaosDemo: React.FC<JSONChaosDemoProps> = ({ scenarios }) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showError, setShowError] = useState(false);

  const playScenario = async () => {
    setIsPlaying(true);
    setShowError(false);
    
    // Simulate producer sending data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate consumer processing and failing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowError(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsPlaying(false);
  };

  const scenario = scenarios[currentScenario];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-red-50 to-orange-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          JSON Schema Chaos Demonstration
        </h3>
        <p className="text-gray-600">
          Watch how JSON's lack of validation causes runtime failures
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="flex justify-center space-x-2 mb-6">
        {scenarios.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentScenario(index);
              setShowError(false);
              setIsPlaying(false);
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentScenario === index
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-600 hover:bg-red-50'
            }`}
          >
            {scenarios[index].name}
          </button>
        ))}
      </div>

      {/* Current Scenario Display */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h4 className="text-xl font-semibold text-red-600 mb-4">
          Scenario: {scenario.name}
        </h4>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Producer Side */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold text-green-600 mb-3 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Producer (Sends)
            </h5>
            <div className="bg-gray-100 rounded p-3 font-mono text-sm">
              <motion.div
                animate={isPlaying ? { opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
              >
                {scenario.producer}
              </motion.div>
            </div>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-green-600"
              >
                ✓ Message sent successfully
              </motion.div>
            )}
          </div>

          {/* Consumer Side */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-600 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Consumer (Processes)
            </h5>
            <div className="bg-gray-100 rounded p-3 font-mono text-sm">
              <motion.div
                animate={isPlaying && !showError ? { opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.5, repeat: isPlaying && !showError ? Infinity : 0 }}
              >
                {scenario.consumer}
              </motion.div>
            </div>
            <AnimatePresence>
              {showError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700"
                >
                  <div className="font-semibold">💥 Runtime Error:</div>
                  <div className="font-mono text-xs mt-1">{scenario.error}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Play Button */}
        <div className="text-center mt-6">
          <button
            onClick={playScenario}
            disabled={isPlaying}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPlaying ? (
              <span className="flex items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Running Scenario...
              </span>
            ) : (
              '▶️ Run Scenario'
            )}
          </button>
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Why This Fails
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <h5 className="font-semibold text-red-600 mb-2">No Validation</h5>
            <p className="text-sm text-gray-600">
              JSON allows any structure. Bad data reaches consumers at runtime.
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h5 className="font-semibold text-orange-600 mb-2">Late Detection</h5>
            <p className="text-sm text-gray-600">
              Errors discovered during processing, not at produce time.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-semibold text-yellow-600 mb-2">Silent Failures</h5>
            <p className="text-sm text-gray-600">
              Missing fields might be ignored, causing silent data corruption.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="font-semibold text-green-600 mb-2">
            🛡️ The Avro Solution
          </h5>
          <p className="text-sm text-gray-700">
            Schema Registry + Avro catches these errors at <strong>produce time</strong>, 
            preventing bad data from ever reaching consumers. No more 3AM phone calls!
          </p>
        </div>
      </div>
    </div>
  );
};

export default JSONChaosDemo;