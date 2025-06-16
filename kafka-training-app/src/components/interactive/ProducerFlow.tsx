import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Package, CheckCircle } from 'lucide-react';

interface ProducerFlowProps {
  showBatching?: boolean;
  showCompression?: boolean;
  showAcks?: boolean;
}

const ProducerFlow: React.FC<ProducerFlowProps> = ({
  showBatching = true,
  showCompression = true,
  showAcks = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const steps = [
    {
      id: 'produce',
      name: 'Producer API Call',
      description: 'Application sends message to producer',
      icon: Package,
      color: 'blue'
    },
    {
      id: 'batch',
      name: 'Batching',
      description: 'Messages are batched for efficiency',
      icon: Package,
      color: 'purple',
      visible: showBatching
    },
    {
      id: 'compress',
      name: 'Compression',
      description: 'Batch is compressed to reduce network usage',
      icon: Package,
      color: 'green',
      visible: showCompression
    },
    {
      id: 'send',
      name: 'Network Send',
      description: 'Compressed batch sent to broker',
      icon: ArrowRight,
      color: 'orange'
    },
    {
      id: 'ack',
      name: 'Acknowledgment',
      description: 'Broker confirms receipt based on acks setting',
      icon: CheckCircle,
      color: 'green',
      visible: showAcks
    }
  ].filter(step => step.visible !== false);

  const runFlow = () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsRunning(false);
            setCurrentStep(0);
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const ackSettings = [
    { value: '0', name: 'acks=0', description: 'Fire and forget - no acknowledgment' },
    { value: '1', name: 'acks=1', description: 'Leader acknowledgment only' },
    { value: 'all', name: 'acks=all', description: 'All in-sync replicas must acknowledge' }
  ];

  return (
    <div className="space-y-10">
      {/* Control Button */}
      <div className="flex justify-center">
        <button
          onClick={runFlow}
          disabled={isRunning}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${isRunning 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
            }
          `}
        >
          {isRunning ? 'Running...' : 'Run Producer Flow'}
        </button>
      </div>

      {/* Flow Visualization */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isPassed = currentStep > index;

            return (
              <React.Fragment key={step.id}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.1 : 1, 
                    opacity: 1 
                  }}
                  className={`
                    relative z-10 p-4 rounded-lg transition-all
                    ${isActive 
                      ? `bg-${step.color}-600 shadow-lg shadow-${step.color}-500/50` 
                      : isPassed
                      ? 'bg-gray-300'
                      : 'bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  <Icon className={`h-8 w-8 ${isActive || isPassed ? 'text-white' : 'text-gray-600'}`} />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 text-center">
                    <p className="text-sm font-semibold">{step.name}</p>
                  </div>
                </motion.div>

                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isPassed ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 h-1 bg-gray-600 origin-left"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Description */}
      <AnimatePresence mode="wait">
        {isRunning && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-16 p-4 bg-white rounded-lg border border-gray-200"
          >
            <h4 className="font-semibold text-blue-600 mb-2">
              {steps[currentStep].name}
            </h4>
            <p className="text-gray-800">{steps[currentStep].description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Details */}
      <div className="grid md:grid-cols-3 gap-4">
        {showBatching && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold text-purple-600 mb-2">Batching Config</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">batch.size</span>
                <span className="font-mono">16384</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">linger.ms</span>
                <span className="font-mono">10</span>
              </div>
            </div>
          </div>
        )}

        {showCompression && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold text-green-600 mb-2">Compression</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-mono">snappy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ratio</span>
                <span className="font-mono">~70%</span>
              </div>
            </div>
          </div>
        )}

        {showAcks && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold text-orange-400 mb-2">Acknowledgments</h4>
            <div className="space-y-2">
              {ackSettings.map((ack) => (
                <div key={ack.value} className="text-sm">
                  <div className="font-mono text-blue-600">{ack.name}</div>
                  <div className="text-xs text-gray-600">{ack.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducerFlow;