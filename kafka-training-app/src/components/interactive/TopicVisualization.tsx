import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Package } from 'lucide-react';

interface TopicVisualizationProps {
  topicName: string;
  partitions: number;
  replicationFactor: number;
  showMessages?: boolean;
}

interface Message {
  id: string;
  key: string;
  value: string;
  partition: number;
  offset: number;
}

const TopicVisualization: React.FC<TopicVisualizationProps> = ({
  topicName,
  partitions,
  replicationFactor,
  showMessages = true
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProducing, setIsProducing] = useState(false);
  const [selectedPartition, setSelectedPartition] = useState<number | null>(null);

  const produceMessage = useCallback(() => {
    setIsProducing(true);
    const customerId = `CUST${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
    const amount = (Math.random() * 1000).toFixed(2);
    const partition = Math.abs(hashCode(customerId)) % partitions;
    
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      key: customerId,
      value: `{"customerId":"${customerId}","amount":${amount},"currency":"USD"}`,
      partition,
      offset: messages.filter(m => m.partition === partition).length
    };

    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => setIsProducing(false), 300);
  }, [messages, partitions]);

  // Simple hash function for demonstration
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  // Auto-produce messages for demo
  useEffect(() => {
    if (showMessages) {
      const interval = setInterval(() => {
        if (messages.length < 15) {
          produceMessage();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [messages.length, showMessages, produceMessage]);

  const getPartitionMessages = (partitionId: number) => {
    return messages.filter(m => m.partition === partitionId).slice(-5);
  };

  return (
    <div className="space-y-6">
      {/* Topic Header */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-xl font-bold text-blue-700 mb-2">{topicName}</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Partitions:</span>
            <span className="ml-2 font-semibold text-gray-900">{partitions}</span>
          </div>
          <div>
            <span className="text-gray-600">Replication Factor:</span>
            <span className="ml-2 font-semibold text-gray-900">{replicationFactor}</span>
          </div>
          <div>
            <span className="text-gray-600">Messages:</span>
            <span className="ml-2 font-semibold text-gray-900">{messages.length}</span>
          </div>
        </div>
      </div>

      {/* Producer Button */}
      {showMessages && (
        <div className="flex justify-center">
          <button
            onClick={produceMessage}
            disabled={isProducing}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2
              ${isProducing 
                ? 'bg-green-600 scale-95 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white'
              }
            `}
          >
            <Send className="h-5 w-5" />
            <span>Produce Message</span>
          </button>
        </div>
      )}

      {/* Partitions Grid */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: partitions }).map((_, partitionId) => (
          <motion.div
            key={partitionId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: partitionId * 0.1 }}
            onClick={() => setSelectedPartition(partitionId === selectedPartition ? null : partitionId)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all
              ${selectedPartition === partitionId
                ? 'bg-blue-100 border-blue-400 scale-105'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Partition {partitionId}</h4>
              <span className="text-xs text-gray-600">
                {getPartitionMessages(partitionId).length} msgs
              </span>
            </div>

            {/* Messages in partition */}
            <div className="space-y-2">
              <AnimatePresence>
                {getPartitionMessages(partitionId).map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-100 rounded p-2 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <Package className="h-3 w-3 text-blue-600" />
                      <span className="text-gray-600">Offset {msg.offset}</span>
                    </div>
                    <div className="mt-1 text-gray-700 truncate">
                      Key: {msg.key}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {getPartitionMessages(partitionId).length === 0 && (
                <div className="text-center text-gray-600 text-xs py-4">
                  No messages yet
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected partition details */}
      {selectedPartition !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <h4 className="font-semibold text-blue-700 mb-2">
            Partition {selectedPartition} Details
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              This partition contains messages with keys that hash to partition {selectedPartition}.
              Messages within a partition are strictly ordered.
            </p>
            <div className="bg-white rounded p-3 font-mono text-xs border border-gray-200 text-gray-800">
              partition = hash(key) % {partitions}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TopicVisualization;