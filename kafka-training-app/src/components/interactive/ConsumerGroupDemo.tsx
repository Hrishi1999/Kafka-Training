import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Play, Pause, RotateCcw, Plus, Minus, AlertTriangle, Zap, BarChart3, Clock } from 'lucide-react';

interface Message {
  id: string;
  partition: number;
  offset: number;
  timestamp: Date;
  processed: boolean;
  processingTime: number;
}

interface Consumer {
  id: string;
  partitions: number[];
  status: 'active' | 'rebalancing' | 'failed';
  processedCount: number;
  lag: number;
  lastHeartbeat: Date;
  processingRate: number;
}

interface Partition {
  id: number;
  currentOffset: number;
  highWatermark: number;
  assignedTo?: string;
  messages: Message[];
}

interface ConsumerGroupDemoProps {
  topicName?: string;
  partitionCount?: number;
  initialConsumers?: number;
  showMetrics?: boolean;
  showRebalancing?: boolean;
  autoPlay?: boolean;
}

const ConsumerGroupDemo: React.FC<ConsumerGroupDemoProps> = ({
  topicName = 'payment-events',
  partitionCount = 6,
  initialConsumers = 3,
  showMetrics = true,
  showRebalancing = true,
  autoPlay = false
}) => {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [isRunning, setIsRunning] = useState(autoPlay);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [rebalanceCount, setRebalanceCount] = useState(0);

  // Partition assignment algorithm (range-based)
  const assignPartitions = useCallback((consumerList: Consumer[]) => {
    if (consumerList.length === 0) return;

    const activeConsumers = consumerList.filter(c => c.status === 'active');
    const partitionsPerConsumer = Math.floor(partitionCount / activeConsumers.length);
    const extraPartitions = partitionCount % activeConsumers.length;

    let partitionIndex = 0;
    const updatedConsumers = consumerList.map((consumer) => {
      if (consumer.status !== 'active') {
        return { ...consumer, partitions: [] };
      }

      const activeIndex = activeConsumers.findIndex(c => c.id === consumer.id);
      const numPartitions = partitionsPerConsumer + (activeIndex < extraPartitions ? 1 : 0);
      const assignedPartitions: number[] = [];

      for (let i = 0; i < numPartitions; i++) {
        if (partitionIndex < partitionCount) {
          assignedPartitions.push(partitionIndex);
          partitionIndex++;
        }
      }

      return { ...consumer, partitions: assignedPartitions };
    });

    setConsumers(updatedConsumers);

    // Update partition assignments
    setPartitions(prev => prev.map(partition => {
      const assignedConsumer = updatedConsumers.find(c => 
        c.partitions.includes(partition.id) && c.status === 'active'
      );
      return {
        ...partition,
        assignedTo: assignedConsumer?.id
      };
    }));
  }, [partitionCount]);

  // Initialize partitions
  useEffect(() => {
    const initialPartitions: Partition[] = Array.from({ length: partitionCount }, (_, i) => ({
      id: i,
      currentOffset: 0,
      highWatermark: 0,
      messages: []
    }));
    setPartitions(initialPartitions);
  }, [partitionCount]);

  // Initialize consumers
  useEffect(() => {
    const initConsumers: Consumer[] = Array.from({ length: initialConsumers }, (_, i) => ({
      id: `consumer-${i + 1}`,
      partitions: [],
      status: 'active',
      processedCount: 0,
      lag: 0,
      lastHeartbeat: new Date(),
      processingRate: 5 + Math.random() * 5 // 5-10 messages/sec
    }));
    setConsumers(initConsumers);
    
    // Trigger initial partition assignment
    setTimeout(() => {
      assignPartitions(initConsumers);
    }, 100);
  }, [initialConsumers, partitionCount, assignPartitions]);

  // Simulate message production
  const produceMessage = useCallback(() => {
    const partition = Math.floor(Math.random() * partitionCount);
    
    setPartitions(prev => {
      const currentPartition = prev[partition];
      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        partition,
        offset: currentPartition?.highWatermark || 0,
        timestamp: new Date(),
        processed: false,
        processingTime: 0
      };
      
      return prev.map(p => 
        p.id === partition
          ? {
              ...p,
              messages: [...p.messages.slice(-9), newMessage],
              highWatermark: p.highWatermark + 1
            }
          : p
      );
    });
    
    setMessageIdCounter(prev => prev + 1);
    setTotalMessages(prev => prev + 1);
  }, [partitionCount]);

  // Simulate message consumption
  const consumeMessages = useCallback(() => {
    // Stop consumption during rebalancing
    if (isRebalancing) return;
    
    let consumerMetrics = new Map<string, { lag: number, processed: number }>();
    
    setPartitions(prev => {
      const newPartitions = prev.map(partition => {
        if (!partition.assignedTo || partition.messages.length === 0) return partition;

        const consumer = consumers.find(c => c.id === partition.assignedTo);
        if (!consumer || consumer.status !== 'active') return partition;

        const unprocessedMessages = partition.messages.filter(m => !m.processed);
        if (unprocessedMessages.length === 0) return partition;

        // Process messages based on consumer rate
        const messagesToProcess = Math.min(
          Math.ceil(consumer.processingRate / 2), // Process every 500ms
          unprocessedMessages.length
        );

        let processedCount = 0;
        const updatedMessages = partition.messages.map(msg => {
          if (!msg.processed && processedCount < messagesToProcess) {
            processedCount++;
            const processingTime = Date.now() - msg.timestamp.getTime();
            return { ...msg, processed: true, processingTime };
          }
          return msg;
        });

        // Track metrics
        const currentMetrics = consumerMetrics.get(consumer.id) || { lag: 0, processed: 0 };
        consumerMetrics.set(consumer.id, {
          lag: currentMetrics.lag + (partition.highWatermark - partition.currentOffset - processedCount),
          processed: currentMetrics.processed + processedCount
        });

        return {
          ...partition,
          messages: updatedMessages,
          currentOffset: partition.currentOffset + processedCount
        };
      });
      
      // Update consumer metrics after we have all the data
      setConsumers(prevConsumers => prevConsumers.map(consumer => {
        const metrics = consumerMetrics.get(consumer.id);
        if (!metrics || consumer.status !== 'active') return consumer;
        
        return {
          ...consumer,
          lag: metrics.lag,
          processedCount: consumer.processedCount + metrics.processed,
          lastHeartbeat: new Date()
        };
      }));
      
      return newPartitions;
    });
  }, [consumers, isRebalancing]);

  // Auto-run simulation
  useEffect(() => {
    if (!isRunning) return;

    const messageInterval = setInterval(produceMessage, 800);
    const consumeInterval = setInterval(consumeMessages, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(consumeInterval);
    };
  }, [isRunning, produceMessage, consumeMessages]);

  // Trigger rebalancing with proper stop-the-world behavior
  const triggerRebalance = useCallback(() => {
    setIsRebalancing(true);
    setRebalanceCount(prev => prev + 1);

    // Phase 1: Stop all consumers and revoke partitions (STOP THE WORLD)
    setConsumers(prev => prev.map(c => ({ 
      ...c, 
      status: c.status === 'failed' ? 'failed' : 'rebalancing' as const,
      partitions: [] // Immediately revoke all partitions
    })));
    
    // Clear all partition assignments
    setPartitions(prev => prev.map(p => ({
      ...p,
      assignedTo: undefined
    })));

    // Phase 2: Rebalance after delay
    setTimeout(() => {
      setConsumers(prev => {
        const activeConsumers = prev.filter(c => c.status !== 'failed');
        const updatedConsumers = prev.map(c => 
          c.status === 'failed' ? c : { ...c, status: 'active' as const }
        );
        
        // Perform assignment
        assignPartitions(updatedConsumers);
        return updatedConsumers;
      });
      setIsRebalancing(false);
    }, 2000);
  }, [assignPartitions]);

  // Add consumer
  const addConsumer = () => {
    const newConsumer: Consumer = {
      id: `consumer-${consumers.length + 1}`,
      partitions: [],
      status: 'active',
      processedCount: 0,
      lag: 0,
      lastHeartbeat: new Date(),
      processingRate: 5 + Math.random() * 5
    };

    setConsumers(prev => [...prev, newConsumer]);
    setTimeout(triggerRebalance, 100);
  };

  // Remove consumer
  const removeConsumer = () => {
    if (consumers.length <= 1) return;

    setConsumers(prev => prev.slice(0, -1));
    setTimeout(triggerRebalance, 100);
  };

  // Simulate consumer failure
  const simulateFailure = (consumerId: string) => {
    setConsumers(prev => prev.map(c => 
      c.id === consumerId ? { ...c, status: 'failed' as const } : c
    ));
    setTimeout(triggerRebalance, 500);
  };

  // Reset simulation
  const reset = useCallback(() => {
    setIsRunning(false);
    setMessageIdCounter(0);
    setTotalMessages(0);
    setRebalanceCount(0);
    setIsRebalancing(false);
    
    // Reset partitions
    setPartitions(Array.from({ length: partitionCount }, (_, i) => ({
      id: i,
      currentOffset: 0,
      highWatermark: 0,
      messages: [],
      assignedTo: undefined
    })));
    
    // Reset consumers
    const resetConsumers: Consumer[] = Array.from({ length: initialConsumers }, (_, i) => ({
      id: `consumer-${i + 1}`,
      partitions: [],
      status: 'active',
      processedCount: 0,
      lag: 0,
      lastHeartbeat: new Date(),
      processingRate: 5 + Math.random() * 5
    }));
    
    setConsumers(resetConsumers);
    
    // Re-assign partitions after reset
    setTimeout(() => {
      assignPartitions(resetConsumers);
    }, 100);
  }, [partitionCount, initialConsumers, assignPartitions]);

  const getStatusColor = (status: Consumer['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'rebalancing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalLag = consumers.reduce((sum, c) => sum + c.lag, 0);
  const totalProcessed = consumers.reduce((sum, c) => sum + c.processedCount, 0);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-white ${
            isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isRunning ? 'Stop' : 'Start'}</span>
        </button>

        <button
          onClick={addConsumer}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Consumer</span>
        </button>

        <button
          onClick={removeConsumer}
          disabled={consumers.length <= 1}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Minus className="h-4 w-4" />
          <span>Remove Consumer</span>
        </button>

        {showRebalancing && (
          <button
            onClick={triggerRebalance}
            disabled={isRebalancing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <RotateCcw className={`h-4 w-4 ${isRebalancing ? 'animate-spin' : ''}`} />
            <span>Manual Rebalance</span>
          </button>
        )}

        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Rebalancing Alert */}
      {isRebalancing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-yellow-600 animate-spin" />
            <span className="font-semibold text-yellow-800">Rebalancing in Progress</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            All consumers have stopped processing. Partitions are being reassigned...
          </p>
        </motion.div>
      )}

      {/* Metrics Dashboard */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Messages</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalMessages}</p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Processed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalProcessed}</p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600">Total Lag</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{totalLag}</p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Rebalances</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{rebalanceCount}</p>
          </div>
        </div>
      )}

      {/* Consumer Group Status */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Consumer Group: payment-processors</span>
          </h4>
          {isRebalancing && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center space-x-1">
              <RotateCcw className="h-3 w-3 animate-spin" />
              <span>Rebalancing...</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consumers.map((consumer) => (
            <motion.div
              key={consumer.id}
              layout
              className={`p-4 rounded-lg border transition-all ${
                consumer.status === 'failed' ? 'bg-red-50 border-red-200' :
                consumer.status === 'rebalancing' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-800">{consumer.id}</h5>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(consumer.status)}`}>
                  {consumer.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Partitions:</span>
                  <span className="font-mono">
                    {consumer.partitions.length > 0 ? `[${consumer.partitions.join(', ')}]` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-mono">{consumer.processedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lag:</span>
                  <span className={`font-mono ${consumer.lag > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {consumer.lag}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-mono">{consumer.processingRate.toFixed(1)}/s</span>
                </div>
              </div>

              {consumer.status === 'active' && (
                <button
                  onClick={() => simulateFailure(consumer.id)}
                  className="w-full mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
                >
                  Simulate Failure
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Partition View */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-4">Topic: {topicName}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {partitions.map((partition) => (
            <motion.div
              key={partition.id}
              className={`p-3 rounded-lg border min-h-[120px] ${
                partition.assignedTo 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-800">P{partition.id}</h5>
                <span className="text-xs text-gray-500">
                  {partition.highWatermark - partition.currentOffset} lag
                </span>
              </div>

              {partition.assignedTo && (
                <div className="text-xs text-blue-600 mb-2">
                  → {partition.assignedTo}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Offset:</span>
                  <span>{partition.currentOffset}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>HWM:</span>
                  <span>{partition.highWatermark}</span>
                </div>
              </div>

              {/* Recent messages visualization */}
              <div className="mt-2 space-y-1">
                {partition.messages.slice(-3).map((message) => (
                  <div
                    key={message.id}
                    className={`h-1 rounded-full transition-all ${
                      message.processed ? 'bg-green-400' : 'bg-orange-400'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rebalancing Behavior Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">Kafka Consumer Group Rebalancing</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Current Distribution:</h5>
            <ul className="space-y-1 text-gray-600">
              {consumers.map(consumer => (
                <li key={consumer.id}>
                  <strong>{consumer.id}:</strong> {consumer.partitions.length} partitions
                  {consumer.partitions.length > 0 && ` [${consumer.partitions.join(', ')}]`}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Rebalancing Process:</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• All consumers stop processing (stop-the-world)</li>
              <li>• All partitions are revoked from consumers</li>
              <li>• Partitions are reassigned based on strategy</li>
              <li>• Consumers resume processing after assignment</li>
              <li>• Process takes ~2 seconds (configurable)</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-100 rounded text-sm">
          <strong className="text-blue-800">Current behavior:</strong>
          <ul className="mt-1 space-y-1 text-blue-700">
            <li>• Range assignment: Consecutive partitions assigned to each consumer</li>
            <li>• Triggers: Consumer join/leave/failure or manual rebalance</li>
            <li>• During rebalance: Message production continues, consumption pauses</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConsumerGroupDemo;