import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Users, Zap, BarChart } from 'lucide-react';

interface Message {
  id: string;
  key: string;
  value: string;
  partition: number;
  color: string;
}

interface PartitioningDemoProps {
  showLoadDistribution?: boolean;
  showOrdering?: boolean;
  interactive?: boolean;
  scenarios?: string[];
}

const PartitioningDemo: React.FC<PartitioningDemoProps> = ({
  showLoadDistribution = true,
  showOrdering = true,
  interactive = true,
  scenarios = ["Round-robin distribution", "Key-based hashing", "Custom VIP partitioner"]
}) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partitionCounts, setPartitionCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [isProducing, setIsProducing] = useState(false);

  const customers = ['CUST_001', 'CUST_002', 'VIP_CUSTOMER_001', 'CUST_003', 'PREMIUM_CUSTOMER_002'];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const getPartition = (key: string, scenario: number): number => {
    switch (scenario) {
      case 0: // Round-robin
        return messages.length % 6;
      case 1: // Key-based hashing
        return hashString(key) % 6;
      case 2: // VIP partitioner
        if (key.startsWith('VIP_') || key.startsWith('PREMIUM_')) {
          return hashString(key) % 2; // VIP partitions 0, 1
        }
        return 2 + (hashString(key) % 4); // Regular partitions 2-5
      default:
        return 0;
    }
  };

  const produceMessage = () => {
    setIsProducing(true);
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const partition = getPartition(customer, currentScenario);
    const messageId = Math.random().toString(36).substr(2, 9);

    const newMessage: Message = {
      id: messageId,
      key: customer,
      value: `Payment from ${customer}`,
      partition,
      color: colors[partition]
    };

    setMessages(prev => [...prev.slice(-19), newMessage]);
    setPartitionCounts(prev => {
      const updated = [...prev];
      updated[partition]++;
      return updated;
    });

    setTimeout(() => setIsProducing(false), 300);
  };

  const clearMessages = () => {
    setMessages([]);
    setPartitionCounts([0, 0, 0, 0, 0, 0]);
  };

  useEffect(() => {
    clearMessages();
  }, [currentScenario]);

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((scenario, index) => (
          <button
            key={index}
            onClick={() => setCurrentScenario(index)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentScenario === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }
            `}
          >
            {scenario}
          </button>
        ))}
      </div>

      {/* Current Strategy Info */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          {currentScenario === 0 && <BarChart className="h-5 w-5 text-blue-500" />}
          {currentScenario === 1 && <Hash className="h-5 w-5 text-green-500" />}
          {currentScenario === 2 && <Zap className="h-5 w-5 text-purple-500" />}
          <h4 className="font-semibold text-gray-800">{scenarios[currentScenario]}</h4>
        </div>
        <p className="text-sm text-gray-600">
          {currentScenario === 0 && "Messages distributed evenly across all partitions regardless of key"}
          {currentScenario === 1 && "Messages with same key always go to the same partition"}
          {currentScenario === 2 && "VIP customers get dedicated partitions (0-1), regular customers use partitions 2-5"}
        </p>
      </div>

      {/* Controls */}
      {interactive && (
        <div className="flex space-x-4">
          <button
            onClick={produceMessage}
            disabled={isProducing}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all
              ${isProducing
                ? 'bg-green-600 scale-95'
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
              }
            `}
          >
            Produce Message
          </button>
          <button
            onClick={clearMessages}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors text-gray-800"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Partition Visualization */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, partitionId) => (
          <motion.div
            key={partitionId}
            className={`
              p-4 rounded-lg border min-h-[120px] transition-all
              ${partitionId < 2 && currentScenario === 2
                ? 'bg-purple-900/20 border-purple-600/50'
                : 'bg-white border-gray-200/50'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-800">P{partitionId}</h5>
              {partitionId < 2 && currentScenario === 2 && (
                <span className="text-xs text-purple-600 font-medium">VIP</span>
              )}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              {partitionCounts[partitionId]} messages
            </div>
            
            {/* Messages in partition */}
            <div className="space-y-1">
              {messages
                .filter(msg => msg.partition === partitionId)
                .slice(-3)
                .map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-1 rounded text-xs"
                    style={{ backgroundColor: `${msg.color}20`, borderColor: `${msg.color}50` }}
                  >
                    {msg.key}
                  </motion.div>
                ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load Distribution Chart */}
      {showLoadDistribution && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Load Distribution</h4>
          <div className="space-y-2">
            {partitionCounts.map((count, index) => {
              const maxCount = Math.max(...partitionCounts, 1);
              const percentage = (count / maxCount) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm w-8">P{index}</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full transition-all duration-500 ${
                        index < 2 && currentScenario === 2 ? 'bg-purple-500' : 'bg-blue-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartitioningDemo;