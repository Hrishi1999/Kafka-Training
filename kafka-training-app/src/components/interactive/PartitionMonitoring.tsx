import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, AlertTriangle } from 'lucide-react';

interface PartitionMetrics {
  partition: number;
  messages: number;
  size: string;
  leader: number;
  replicas: number[];
  isr: number[];
}

const PartitionMonitoring: React.FC = () => {
  const [partitions, setPartitions] = useState<PartitionMetrics[]>([]);

  useEffect(() => {
    const generatePartitions = () => {
      return Array.from({ length: 6 }, (_, i) => ({
        partition: i,
        messages: Math.floor(Math.random() * 10000),
        size: `${(Math.random() * 100).toFixed(1)}MB`,
        leader: Math.floor(Math.random() * 3) + 1,
        replicas: [1, 2, 3],
        isr: Math.random() > 0.2 ? [1, 2, 3] : [1, 2] // Occasionally simulate out-of-sync replica
      }));
    };

    setPartitions(generatePartitions());
    const interval = setInterval(() => setPartitions(generatePartitions()), 5000);
    return () => clearInterval(interval);
  }, []);

  const getHealthStatus = (partition: PartitionMetrics) => {
    if (partition.isr.length < partition.replicas.length) {
      return { status: 'warning', color: 'yellow', message: 'Replica out of sync' };
    }
    return { status: 'healthy', color: 'green', message: 'All replicas in sync' };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partitions.map((partition) => {
          const health = getHealthStatus(partition);
          return (
            <motion.div
              key={partition.partition}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border bg-white ${
                health.color === 'yellow' ? 'border-yellow-600/50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">Partition {partition.partition}</h4>
                {health.color === 'yellow' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Eye className="h-5 w-5 text-green-500" />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="text-gray-800">{partition.messages.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="text-gray-800">{partition.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leader:</span>
                  <span className="text-gray-800">Broker {partition.leader}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ISR:</span>
                  <span className={`text-${health.color}-400`}>
                    {partition.isr.length}/{partition.replicas.length}
                  </span>
                </div>
              </div>
              
              {health.color === 'yellow' && (
                <div className="mt-3 text-xs text-yellow-600 bg-yellow-900/20 p-2 rounded">
                  {health.message}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PartitionMonitoring;