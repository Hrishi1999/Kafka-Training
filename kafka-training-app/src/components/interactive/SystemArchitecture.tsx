import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Cloud, Shield } from 'lucide-react';

interface SystemArchitectureProps {
  showAnimation?: boolean;
}

const SystemArchitecture: React.FC<SystemArchitectureProps> = ({ showAnimation = true }) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const components = [
    {
      id: 'gateway',
      name: 'Payment Gateway',
      icon: Shield,
      description: 'REST API endpoint that receives payment requests and validates them before sending to Kafka',
      position: { x: 100, y: 200 },
      color: 'blue'
    },
    {
      id: 'kafka',
      name: 'Kafka Cluster',
      icon: Server,
      description: 'Distributed event streaming platform handling payment events with high throughput',
      position: { x: 400, y: 200 },
      color: 'purple'
    },
    {
      id: 'validator',
      name: 'Payment Validator',
      icon: Database,
      description: 'Consumer service that validates payments against business rules and fraud checks',
      position: { x: 700, y: 100 },
      color: 'green'
    },
    {
      id: 'processor',
      name: 'Payment Processor',
      icon: Cloud,
      description: 'Processes validated payments and integrates with external payment providers',
      position: { x: 700, y: 300 },
      color: 'orange'
    }
  ];

  const connections = [
    { from: 'gateway', to: 'kafka', label: 'payment_requests' },
    { from: 'kafka', to: 'validator', label: 'consume' },
    { from: 'kafka', to: 'processor', label: 'consume' }
  ];

  return (
    <div className="relative h-[500px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {/* Draw connections */}
        {connections.map((conn, index) => {
          const fromComp = components.find(c => c.id === conn.from);
          const toComp = components.find(c => c.id === conn.to);
          if (!fromComp || !toComp) return null;

          return (
            <g key={index}>
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: index * 0.3 }}
                x1={fromComp.position.x + 60}
                y1={fromComp.position.y + 30}
                x2={toComp.position.x}
                y2={toComp.position.y + 30}
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text
                x={(fromComp.position.x + toComp.position.x) / 2 + 30}
                y={(fromComp.position.y + toComp.position.y) / 2 + 30}
                fill="#6b7280"
                fontSize="12"
                textAnchor="middle"
              >
                {conn.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Draw components */}
      {components.map((comp, index) => {
        const Icon = comp.icon;
        const isSelected = selectedComponent === comp.id;

        return (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{
              position: 'absolute',
              left: comp.position.x,
              top: comp.position.y,
            }}
            className={`
              p-4 rounded-lg cursor-pointer transition-all
              ${isSelected 
                ? 'bg-white shadow-xl scale-110 z-10 border-2 border-blue-400' 
                : 'bg-white/90 hover:bg-white border border-gray-200'
              }
            `}
            onClick={() => setSelectedComponent(comp.id === selectedComponent ? null : comp.id)}
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon className={`h-8 w-8 text-${comp.color}-500`} />
              <span className="text-sm font-semibold text-gray-900">{comp.name}</span>
            </div>
          </motion.div>
        );
      })}

      {/* Component details */}
      {selectedComponent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 p-4 bg-white rounded-lg border border-gray-300 shadow-lg"
        >
          <h4 className="font-semibold text-blue-700 mb-2">
            {components.find(c => c.id === selectedComponent)?.name}
          </h4>
          <p className="text-sm text-gray-700">
            {components.find(c => c.id === selectedComponent)?.description}
          </p>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 text-xs text-gray-600">
        Click components for details
      </div>
    </div>
  );
};

export default SystemArchitecture;