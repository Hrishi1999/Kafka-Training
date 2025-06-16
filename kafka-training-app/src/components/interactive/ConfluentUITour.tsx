import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const ConfluentUITour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Cluster Overview",
      content: "View your Kafka cluster health, throughput metrics, and partition distribution",
      image: "📊"
    },
    {
      title: "Topics Management", 
      content: "Create, configure, and monitor your Kafka topics with detailed partition views",
      image: "📝"
    },
    {
      title: "Schema Registry",
      content: "Manage Avro, JSON, and Protobuf schemas for your data serialization",
      image: "🗂️"
    },
    {
      title: "Connect Hub",
      content: "Browse and configure connectors to integrate with external systems",
      image: "🔌"
    }
  ];

  const nextStep = () => setCurrentStep((prev) => (prev + 1) % steps.length);
  const prevStep = () => setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confluent Cloud UI Tour</h3>
        <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-center mb-6"
      >
        <div className="text-6xl mb-4">{steps[currentStep].image}</div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">{steps[currentStep].title}</h4>
        <p className="text-gray-600">{steps[currentStep].content}</p>
      </motion.div>

      <div className="flex items-center justify-between">
        <button onClick={prevStep} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>
        
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button onClick={nextStep} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 text-center">
        <a
          href="https://confluent.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-300 text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open Confluent Cloud</span>
        </a>
      </div>
    </div>
  );
};

export default ConfluentUITour;