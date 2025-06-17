import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SchemaRegistryArchitectureProps {
  showComponents: string[];
  showFlow: boolean;
  showVersioning: boolean;
}

const SchemaRegistryArchitecture: React.FC<SchemaRegistryArchitectureProps> = ({
  showComponents,
  showFlow,
  showVersioning,
}) => {
  const [activeFlow, setActiveFlow] = useState<'register' | 'produce' | 'consume' | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<number>(1);

  const schemas = [
    {
      version: 1,
      name: "Payment v1",
      fields: ["payment_id", "customer_id", "amount", "currency"],
      compatible: "Initial version"
    },
    {
      version: 2,
      name: "Payment v2",
      fields: ["payment_id", "customer_id", "amount", "currency", "merchant_id"],
      compatible: "Backward compatible - added optional field"
    },
    {
      version: 3,
      name: "Payment v3",
      fields: ["payment_id", "customer_id", "amount", "currency", "merchant_id", "metadata"],
      compatible: "Backward compatible - added optional map field"
    }
  ];

  const flowSteps = {
    register: [
      { step: 1, description: "Developer defines Avro schema", component: "Developer" },
      { step: 2, description: "Schema registered in Schema Registry", component: "Registry" },
      { step: 3, description: "Compatibility check performed", component: "Registry" },
      { step: 4, description: "Schema ID assigned", component: "Registry" }
    ],
    produce: [
      { step: 1, description: "Producer serializes message with schema", component: "Producer" },
      { step: 2, description: "Schema Registry validates format", component: "Registry" },
      { step: 3, description: "Schema ID embedded in message", component: "Producer" },
      { step: 4, description: "Message sent to Kafka", component: "Producer" }
    ],
    consume: [
      { step: 1, description: "Consumer receives message with schema ID", component: "Consumer" },
      { step: 2, description: "Schema Registry lookup by ID", component: "Registry" },
      { step: 3, description: "Message deserialized using schema", component: "Consumer" },
      { step: 4, description: "Structured data available to application", component: "Consumer" }
    ]
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-blue-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Schema Registry Architecture
        </h3>
        <p className="text-gray-600">
          Centralized schema management for data governance and evolution
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Producer */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeFlow === 'produce' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <h4 className="font-semibold text-green-600 mb-3 flex items-center">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">P</span>
              Producer
            </h4>
            <div className="space-y-2 text-sm">
              <div>✓ Serializes with schema</div>
              <div>✓ Validates before send</div>
              <div>✓ Embeds schema ID</div>
            </div>
            {activeFlow === 'produce' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2 bg-green-100 rounded text-xs"
              >
                Active: Sending messages
              </motion.div>
            )}
          </motion.div>

          {/* Schema Registry */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeFlow ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <h4 className="font-semibold text-purple-600 mb-3 flex items-center">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">SR</span>
              Schema Registry
            </h4>
            <div className="space-y-2 text-sm">
              <div>🏪 Central schema store</div>
              <div>🔍 Compatibility checks</div>
              <div>🆔 Schema ID management</div>
              <div>📋 Version history</div>
            </div>
            {showVersioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-xs text-purple-600"
              >
                Current: {schemas.length} schema versions
              </motion.div>
            )}
          </motion.div>

          {/* Consumer */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeFlow === 'consume' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-2">C</span>
              Consumer
            </h4>
            <div className="space-y-2 text-sm">
              <div>🔍 Reads schema ID</div>
              <div>📥 Fetches schema</div>
              <div>🔄 Deserializes data</div>
            </div>
            {activeFlow === 'consume' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2 bg-blue-100 rounded text-xs"
              >
                Active: Processing messages
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Flow Arrows */}
        {showFlow && (
          <div className="mt-6 flex justify-between items-center">
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-green-500 text-2xl"
            >
              →
            </motion.div>
            <motion.div
              animate={{ x: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="text-blue-500 text-2xl"
            >
              ←
            </motion.div>
          </div>
        )}
      </div>

      {/* Flow Controls */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Interactive Flows
        </h4>
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(flowSteps).map(([flow, steps]) => (
            <button
              key={flow}
              onClick={() => setActiveFlow(activeFlow === flow ? null : flow as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeFlow === flow
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {flow.charAt(0).toUpperCase() + flow.slice(1)} Flow
            </button>
          ))}
        </div>

        <AnimatePresence>
          {activeFlow && (
            <motion.div
              key={activeFlow}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <h5 className="font-semibold text-gray-800 mb-3">
                {activeFlow.charAt(0).toUpperCase() + activeFlow.slice(1)} Flow Steps
              </h5>
              <div className="space-y-3">
                {flowSteps[activeFlow].map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex items-center p-3 bg-white rounded border"
                  >
                    <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {step.step}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{step.description}</div>
                      <div className="text-xs text-gray-500">Component: {step.component}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Schema Versioning */}
      {showVersioning && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Schema Evolution Example
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {schemas.map((schema) => (
              <button
                key={schema.version}
                onClick={() => setSelectedSchema(schema.version)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedSchema === schema.version
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                v{schema.version}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSchema}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex justify-between items-start mb-3">
                <h5 className="font-semibold text-purple-600">
                  {schemas[selectedSchema - 1].name}
                </h5>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {schemas[selectedSchema - 1].compatible}
                </span>
              </div>
              <div className="grid gap-2">
                <div className="font-medium text-sm text-gray-700">Fields:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {schemas[selectedSchema - 1].fields.map((field, index) => (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-2 rounded text-xs text-center ${
                        index < 4 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {field}
                      {index >= 4 && <div className="text-xs opacity-60">new in v{index === 4 ? '2' : '3'}</div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SchemaRegistryArchitecture;