import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Network, Database } from 'lucide-react';

interface Metric {
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

const RealTimeMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([
    { name: 'Messages/sec', value: 0, unit: '', icon: <Activity className="h-5 w-5" />, color: 'blue' },
    { name: 'CPU Usage', value: 0, unit: '%', icon: <Cpu className="h-5 w-5" />, color: 'green' },
    { name: 'Network I/O', value: 0, unit: 'MB/s', icon: <Network className="h-5 w-5" />, color: 'purple' },
    { name: 'Disk Usage', value: 0, unit: 'GB', icon: <Database className="h-5 w-5" />, color: 'yellow' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.random() * 100
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.name}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className={`flex items-center space-x-2 mb-2 text-${metric.color}-600`}>
            {metric.icon}
            <span className="text-sm">{metric.name}</span>
          </div>
          <p className={`text-2xl font-bold text-${metric.color}-600`}>
            {metric.value.toFixed(1)}{metric.unit}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default RealTimeMetrics;