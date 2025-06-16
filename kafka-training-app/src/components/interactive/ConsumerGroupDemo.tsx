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
    const newMessage: Message = {
      id: `msg-${messageIdCounter}`,
      partition,
      offset: partitions[partition]?.highWatermark || 0,
      timestamp: new Date(),
      processed: false,
      processingTime: 0
    };

    setMessageIdCounter(prev => prev + 1);
    setTotalMessages(prev => prev + 1);

    setPartitions(prev => prev.map(p => 
      p.id === partition
        ? {
            ...p,
            messages: [...p.messages.slice(-9), newMessage],
            highWatermark: p.highWatermark + 1
          }
        : p
    ));
  }, [messageIdCounter, partitionCount, partitions]);

  // Simulate message consumption
  const consumeMessages = useCallback(() => {
    setPartitions(prev => prev.map(partition => {
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

      const updatedMessages = partition.messages.map(msg => {
        if (!msg.processed && messagesToProcess > 0) {
          const processingTime = Date.now() - msg.timestamp.getTime();
          return { ...msg, processed: true, processingTime };
        }
        return msg;
      });

      return {
        ...partition,
        messages: updatedMessages,
        currentOffset: partition.currentOffset + messagesToProcess
      };
    }));

    // Update consumer metrics
    setConsumers(prev => prev.map(consumer => {
      const assignedPartitions = partitions.filter(p => p.assignedTo === consumer.id);
      const totalLag = assignedPartitions.reduce((sum, p) => 
        sum + (p.highWatermark - p.currentOffset), 0
      );
      const processedInThisRound = assignedPartitions.reduce((sum, p) => {
        const processed = p.messages.filter(m => m.processed).length;
        return sum + processed;
      }, 0);

      return {
        ...consumer,
        lag: totalLag,
        processedCount: consumer.processedCount + processedInThisRound,
        lastHeartbeat: new Date()
      };
    }));
  }, [consumers, partitions]);

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

  // Trigger rebalancing
  const triggerRebalance = useCallback(() => {
    setIsRebalancing(true);
    setRebalanceCount(prev => prev + 1);

    // Mark all consumers as rebalancing
    setConsumers(prev => prev.map(c => ({ ...c, status: 'rebalancing' as const })));

    setTimeout(() => {
      setConsumers(prev => {
        const updatedConsumers = prev.map(c => ({ ...c, status: 'active' as const }));
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
  const reset = () => {
    setIsRunning(false);
    setMessageIdCounter(0);
    setTotalMessages(0);
    setRebalanceCount(0);
    setPartitions(prev => prev.map(p => ({
      ...p,
      currentOffset: 0,
      highWatermark: 0,
      messages: [],
      assignedTo: undefined
    })));
    setConsumers(prev => prev.map(c => ({
      ...c,
      partitions: [],
      processedCount: 0,
      lag: 0,
      status: 'active' as const
    })));
  };

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

      {/* Load Balancing Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">Consumer Group Load Balancing</h4>
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
            <h5 className="font-medium text-gray-800 mb-2">Key Principles:</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Each partition consumed by only one consumer in the group</li>
              <li>• Partitions redistributed when consumers join/leave</li>
              <li>• Rebalancing temporarily pauses consumption</li>
              <li>• Aim for even distribution across consumers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerGroupDemo;