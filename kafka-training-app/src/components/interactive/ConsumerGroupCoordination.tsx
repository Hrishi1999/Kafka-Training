import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, RefreshCw, Play, Pause, AlertTriangle, Clock, Activity, Server, Settings, Eye, Zap } from 'lucide-react';

interface Consumer {
  id: string;
  partitions: number[];
  status: 'active' | 'joining' | 'leaving' | 'dead';
  lastHeartbeat: Date;
  lag: number;
  throughput: number;
  sessionTimeout: number;
  maxPollInterval: number;
  host: string;
  assignmentStrategy: string;
}

interface Partition {
  id: number;
  currentOffset: number;
  logEndOffset: number;
  lag: number;
  owner?: string;
}

interface GroupMetrics {
  totalLag: number;
  avgThroughput: number;
  totalRebalances: number;
  lastRebalanceTime: Date | null;
  partitionSkew: number;
}

interface RebalanceEvent {
  timestamp: Date;
  type: 'consumer_join' | 'consumer_leave' | 'partition_reassign' | 'coordinator_change';
  details: string;
  duration: number;
  partitionsAffected: number[];
}

interface ConsumerGroupCoordinationProps {
  showRebalancing?: boolean;
  showPartitionAssignment?: boolean;
  showMetrics?: boolean;
  showLiveData?: boolean;
  groupProtocol?: string;
  consumers: Omit<Consumer, 'status' | 'lastHeartbeat' | 'lag' | 'throughput' | 'sessionTimeout' | 'maxPollInterval' | 'host' | 'assignmentStrategy'>[];
}

const ConsumerGroupCoordination: React.FC<ConsumerGroupCoordinationProps> = ({
  showRebalancing = true,
  showPartitionAssignment = true,
  showMetrics = true,
  showLiveData = true,
  groupProtocol = "cooperative-sticky",
  consumers: initialConsumers
}) => {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceEvent[]>([]);
  const [groupMetrics, setGroupMetrics] = useState<GroupMetrics>({
    totalLag: 0,
    avgThroughput: 0,
    totalRebalances: 0,
    lastRebalanceTime: null,
    partitionSkew: 0
  });
  const [coordinator, setCoordinator] = useState({ brokerId: 1, host: 'broker-1.kafka.cluster' });
  const [selectedConsumer, setSelectedConsumer] = useState<string | null>(null);

  const simulateRebalanceStrategy = useCallback((protocol: string, activeConsumers: Consumer[]) => {
    const totalPartitions = 6;
    const consumerCount = activeConsumers.length;
    
    if (consumerCount === 0) {
      return activeConsumers;
    }
    
    // Initialize all consumers with empty partitions
    const newAssignment = activeConsumers.map(consumer => ({
      ...consumer,
      partitions: [] as number[]
    }));
    
    switch (protocol) {
      case 'range': {
        // Range assignor: assign consecutive partitions to consumers
        const partitionsPerConsumer = Math.floor(totalPartitions / consumerCount);
        const extraPartitions = totalPartitions % consumerCount;
        
        let currentPartition = 0;
        
        for (let consumerIndex = 0; consumerIndex < consumerCount; consumerIndex++) {
          const partitionsToAssign = partitionsPerConsumer + (consumerIndex < extraPartitions ? 1 : 0);
          
          for (let i = 0; i < partitionsToAssign; i++) {
            if (currentPartition < totalPartitions) {
              newAssignment[consumerIndex].partitions.push(currentPartition);
              currentPartition++;
            }
          }
        }
        break;
      }
      
      case 'round-robin': {
        // Round-robin assignor: distribute partitions cyclically
        for (let partition = 0; partition < totalPartitions; partition++) {
          const consumerIndex = partition % consumerCount;
          newAssignment[consumerIndex].partitions.push(partition);
        }
        break;
      }
      
      case 'cooperative-sticky': {
        // Cooperative sticky assignor: try to maintain existing assignments
        const existingAssignments = new Map<number, string>();
        
        // Record current assignments
        activeConsumers.forEach(consumer => {
          consumer.partitions.forEach(partition => {
            existingAssignments.set(partition, consumer.id);
          });
        });
        
        // First, assign partitions that were already assigned to existing consumers
        for (let partition = 0; partition < totalPartitions; partition++) {
          const previousOwner = existingAssignments.get(partition);
          const consumerStillExists = newAssignment.find(c => c.id === previousOwner);
          
          if (consumerStillExists && !consumerStillExists.partitions.includes(partition)) {
            consumerStillExists.partitions.push(partition);
          }
        }
        
        // Then assign unassigned partitions using round-robin
        const assignedPartitions = new Set<number>();
        newAssignment.forEach(consumer => {
          consumer.partitions.forEach(partition => assignedPartitions.add(partition));
        });
        
        const unassignedPartitions = Array.from({ length: totalPartitions }, (_, i) => i)
          .filter(partition => !assignedPartitions.has(partition));
        
        unassignedPartitions.forEach((partition, index) => {
          const consumerIndex = index % consumerCount;
          newAssignment[consumerIndex].partitions.push(partition);
        });
        
        // Sort partitions for consistency
        newAssignment.forEach(consumer => {
          consumer.partitions.sort((a, b) => a - b);
        });
        break;
      }
      
      default:
        return activeConsumers;
    }
    
    return newAssignment;
  }, []);

  // Initialize consumers with detailed metadata
  useEffect(() => {
    const enhancedConsumers: Consumer[] = initialConsumers.map((consumer, index) => ({
      ...consumer,
      status: 'active' as const,
      lastHeartbeat: new Date(),
      lag: Math.floor(Math.random() * 1000),
      throughput: 800 + Math.floor(Math.random() * 400),
      sessionTimeout: 30000,
      maxPollInterval: 300000,
      host: `consumer-host-${index + 1}.internal`,
      assignmentStrategy: groupProtocol,
      partitions: [] // Start with no partitions assigned
    }));

    // Use proper assignment strategy for initial assignment
    const properlyAssignedConsumers = simulateRebalanceStrategy(groupProtocol, enhancedConsumers);
    setConsumers(properlyAssignedConsumers);

    // Initialize partitions with proper ownership
    const initialPartitions: Partition[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      currentOffset: Math.floor(Math.random() * 10000),
      logEndOffset: Math.floor(Math.random() * 10000) + 10000,
      lag: Math.floor(Math.random() * 500),
      owner: properlyAssignedConsumers.find(c => c.partitions.includes(i))?.id
    }));
    setPartitions(initialPartitions);
  }, [initialConsumers, groupProtocol, simulateRebalanceStrategy]);

  // Live data simulation
  useEffect(() => {
    if (!showLiveData) return;

    const interval = setInterval(() => {
      setConsumers(prev => prev.map(consumer => ({
        ...consumer,
        lastHeartbeat: new Date(),
        lag: Math.max(0, consumer.lag + (Math.random() - 0.6) * 50),
        throughput: Math.max(0, consumer.throughput + (Math.random() - 0.5) * 100)
      })));

      setPartitions(prev => prev.map(partition => {
        const newLag = Math.max(0, partition.lag + (Math.random() - 0.7) * 20);
        return {
          ...partition,
          currentOffset: partition.currentOffset + Math.floor(Math.random() * 10),
          logEndOffset: partition.logEndOffset + Math.floor(Math.random() * 15),
          lag: newLag
        };
      }));

      setGroupMetrics(prev => ({
        ...prev,
        totalLag: partitions.reduce((sum, p) => sum + p.lag, 0),
        avgThroughput: consumers.reduce((sum, c) => sum + c.throughput, 0) / Math.max(consumers.length, 1)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [showLiveData, consumers.length, partitions]);

  // Validation function to ensure each partition is assigned to exactly one consumer
  const validatePartitionAssignment = useCallback((consumers: Consumer[]) => {
    const totalPartitions = 6;
    const assignedPartitions = new Set<number>();
    const duplicatePartitions = new Set<number>();
    
    consumers.forEach(consumer => {
      consumer.partitions.forEach(partition => {
        if (assignedPartitions.has(partition)) {
          duplicatePartitions.add(partition);
          console.error(`PARTITION ASSIGNMENT ERROR: Partition ${partition} assigned to multiple consumers!`);
        }
        assignedPartitions.add(partition);
      });
    });
    
    const unassignedPartitions = Array.from({ length: totalPartitions }, (_, i) => i)
      .filter(partition => !assignedPartitions.has(partition));
    
    if (duplicatePartitions.size > 0) {
      console.error('Duplicate partition assignments detected:', Array.from(duplicatePartitions));
    }
    
    if (unassignedPartitions.length > 0) {
      console.warn('Unassigned partitions:', unassignedPartitions);
    }
    
    return {
      isValid: duplicatePartitions.size === 0,
      duplicates: Array.from(duplicatePartitions),
      unassigned: unassignedPartitions
    };
  }, []);

  const triggerRebalance = useCallback((reason: string = 'Manual trigger') => {
    setIsRebalancing(true);
    
    const rebalanceEvent: RebalanceEvent = {
      timestamp: new Date(),
      type: 'partition_reassign',
      details: reason,
      duration: 0,
      partitionsAffected: []
    };

    // Simulate rebalance phases
    setTimeout(() => {
      // Only use active consumers for rebalancing
      const activeConsumers = consumers.filter(c => c.status === 'active');
      const newConsumers = simulateRebalanceStrategy(groupProtocol, activeConsumers);
      
      // Validate the assignment
      const validation = validatePartitionAssignment(newConsumers);
      if (!validation.isValid) {
        console.error('Invalid partition assignment after rebalance!', validation);
      }
      
      // Update all consumers, keeping non-active consumers without partitions
      const updatedConsumers = consumers.map(consumer => {
        if (consumer.status === 'active') {
          return newConsumers.find(c => c.id === consumer.id) || { ...consumer, partitions: [] };
        }
        return { ...consumer, partitions: [] }; // Non-active consumers get no partitions
      });
      
      setConsumers(updatedConsumers);
      
      // Update partition ownership based on new assignments
      setPartitions(prev => prev.map(partition => ({
        ...partition,
        owner: newConsumers.find(c => c.partitions.includes(partition.id))?.id || undefined
      })));

      const duration = 1500 + Math.random() * 1000;
      const completedEvent = {
        ...rebalanceEvent,
        duration,
        partitionsAffected: Array.from({ length: 6 }, (_, i) => i)
      };

      setRebalanceHistory(prev => [completedEvent, ...prev.slice(0, 9)]);
      setGroupMetrics(prev => ({
        ...prev,
        totalRebalances: prev.totalRebalances + 1,
        lastRebalanceTime: new Date()
      }));
      setIsRebalancing(false);
    }, 3000);
  }, [consumers, groupProtocol, simulateRebalanceStrategy, validatePartitionAssignment]);

  const addConsumer = () => {
    const newConsumer: Consumer = {
      id: `payment-consumer-${consumers.length + 1}`,
      partitions: [],
      status: 'joining',
      lastHeartbeat: new Date(),
      lag: 0,
      throughput: 0,
      sessionTimeout: 30000,
      maxPollInterval: 300000,
      host: `consumer-host-${consumers.length + 1}.internal`,
      assignmentStrategy: groupProtocol
    };
    
    setConsumers(prev => [...prev, newConsumer]);
    setTimeout(() => {
      setConsumers(prev => prev.map(c => 
        c.id === newConsumer.id ? { ...c, status: 'active' as const } : c
      ));
      triggerRebalance(`Consumer ${newConsumer.id} joined the group`);
    }, 1000);
  };

  const removeConsumer = () => {
    if (consumers.length <= 1) return;
    
    const leavingConsumer = consumers[consumers.length - 1];
    setConsumers(prev => prev.map(c => 
      c.id === leavingConsumer.id ? { ...c, status: 'leaving' as const } : c
    ));
    
    setTimeout(() => {
      setConsumers(prev => prev.filter(c => c.id !== leavingConsumer.id));
      triggerRebalance(`Consumer ${leavingConsumer.id} left the group`);
    }, 1000);
  };

  const simulateConsumerFailure = (consumerId: string) => {
    setConsumers(prev => prev.map(c => 
      c.id === consumerId ? { ...c, status: 'dead' as const } : c
    ));
    
    setTimeout(() => {
      setConsumers(prev => prev.filter(c => c.id !== consumerId));
      triggerRebalance(`Consumer ${consumerId} failed (session timeout)`);
    }, 2000);
  };

  const getStatusColor = (status: Consumer['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'joining': return 'text-blue-600 bg-blue-100';
      case 'leaving': return 'text-orange-600 bg-orange-100';
      case 'dead': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRebalanceTypeIcon = (type: RebalanceEvent['type']) => {
    switch (type) {
      case 'consumer_join': return <Users className="h-4 w-4 text-green-600" />;
      case 'consumer_leave': return <Users className="h-4 w-4 text-red-600" />;
      case 'partition_reassign': return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'coordinator_change': return <Server className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Consumer Group Operations</span>
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={addConsumer}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Add Consumer</span>
            </button>
            <button
              onClick={removeConsumer}
              disabled={consumers.length <= 1}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Remove Consumer</span>
            </button>
            <button
              onClick={() => triggerRebalance()}
              disabled={isRebalancing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRebalancing ? 'animate-spin' : ''}`} />
              <span>Manual Rebalance</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Group Coordinator</span>
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Broker ID:</span>
              <span className="font-mono">{coordinator.brokerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Host:</span>
              <span className="font-mono text-xs">{coordinator.host}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Protocol:</span>
              <span className="font-mono">{groupProtocol}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Group Metrics Dashboard */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Lag</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{groupMetrics.totalLag.toLocaleString()}</p>
          </motion.div>

          <motion.div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Avg Throughput</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{Math.round(groupMetrics.avgThroughput).toLocaleString()}/s</p>
          </motion.div>

          <motion.div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Rebalances</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{groupMetrics.totalRebalances}</p>
          </motion.div>

          <motion.div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600">Active Consumers</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{consumers.filter(c => c.status === 'active').length}</p>
          </motion.div>
        </div>
      )}

      {/* Consumer Status Overview */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Consumer Group Status</span>
          {isRebalancing && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center space-x-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Rebalancing</span>
            </span>
          )}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600">Consumer ID</th>
                <th className="text-left py-2 text-gray-600">Status</th>
                <th className="text-left py-2 text-gray-600">Host</th>
                <th className="text-left py-2 text-gray-600">Partitions</th>
                <th className="text-left py-2 text-gray-600">Lag</th>
                <th className="text-left py-2 text-gray-600">Throughput</th>
                <th className="text-left py-2 text-gray-600">Last Heartbeat</th>
                <th className="text-left py-2 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumers.map((consumer) => (
                <motion.tr
                  key={consumer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    selectedConsumer === consumer.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConsumer(
                    selectedConsumer === consumer.id ? null : consumer.id
                  )}
                >
                  <td className="py-3 font-mono text-sm">{consumer.id}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(consumer.status)}`}>
                      {consumer.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs text-gray-600">{consumer.host}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {consumer.partitions.map(partition => (
                        <span
                          key={partition}
                          className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          P{partition}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`font-mono ${consumer.lag > 1000 ? 'text-red-600' : 'text-green-600'}`}>
                      {consumer.lag.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 font-mono">{consumer.throughput.toLocaleString()}/s</td>
                  <td className="py-3 text-xs text-gray-500">
                    {Math.round((Date.now() - consumer.lastHeartbeat.getTime()) / 1000)}s ago
                  </td>
                  <td className="py-3">
                    {consumer.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          simulateConsumerFailure(consumer.id);
                        }}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition-colors"
                      >
                        Simulate Failure
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Consumer Details */}
      {selectedConsumer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          {(() => {
            const consumer = consumers.find(c => c.id === selectedConsumer);
            if (!consumer) return null;
            
            return (
              <div>
                <h5 className="font-semibold text-blue-800 mb-3">Consumer Details: {consumer.id}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Session Timeout:</span>
                    <p className="font-mono">{consumer.sessionTimeout}ms</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Poll Interval:</span>
                    <p className="font-mono">{consumer.maxPollInterval}ms</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Assignment Strategy:</span>
                    <p className="font-mono">{consumer.assignmentStrategy}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Partition Details View */}
      {showPartitionAssignment && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4">Partition Assignment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partitions.map((partition) => (
              <motion.div
                key={partition.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-800">Partition {partition.id}</h5>
                  <span className={`text-xs px-2 py-1 rounded ${
                    partition.lag > 500 ? 'bg-red-100 text-red-700' :
                    partition.lag > 200 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    Lag: {partition.lag}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="font-mono">{partition.owner || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Offset:</span>
                    <span className="font-mono">{partition.currentOffset.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Log End Offset:</span>
                    <span className="font-mono">{partition.logEndOffset.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Rebalance History */}
      {showRebalancing && rebalanceHistory.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Rebalance Event History</span>
          </h4>
          <div className="space-y-3">
            {rebalanceHistory.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  {getRebalanceTypeIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{event.details}</span>
                      <span className="text-xs text-gray-500">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                      <span>Duration: {event.duration.toFixed(0)}ms</span>
                      <span>Partitions: {event.partitionsAffected.length}</span>
                      <span className="capitalize">Type: {event.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Partition Assignment Validation */}
      {(() => {
        const activeConsumers = consumers.filter(c => c.status === 'active');
        const validation = validatePartitionAssignment(activeConsumers);
        
        return (
          <div className={`p-4 rounded-lg border ${
            validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
              validation.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validation.isValid ? (
                <>
                  <span className="text-green-600">✓</span>
                  <span>Partition Assignment: Valid</span>
                </>
              ) : (
                <>
                  <span className="text-red-600">✗</span>
                  <span>Partition Assignment: Invalid</span>
                </>
              )}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className={validation.isValid ? 'text-green-700' : 'text-red-700'}>
                  {validation.isValid 
                    ? 'Each partition is assigned to exactly one consumer.'
                    : 'Partition assignment violations detected!'
                  }
                </p>
                
                {validation.duplicates.length > 0 && (
                  <p className="text-red-700 mt-1">
                    Duplicate assignments: P{validation.duplicates.join(', P')}
                  </p>
                )}
                
                {validation.unassigned.length > 0 && (
                  <p className="text-orange-700 mt-1">
                    Unassigned partitions: P{validation.unassigned.join(', P')}
                  </p>
                )}
              </div>
              
              <div>
                <h5 className="font-medium mb-1">Current Assignment Summary:</h5>
                <div className="text-xs space-y-1">
                  {Array.from({ length: 6 }, (_, i) => {
                    const owner = activeConsumers.find(c => c.partitions.includes(i));
                    return (
                      <div key={i} className="flex justify-between">
                        <span>Partition {i}:</span>
                        <span className={owner ? 'text-green-700' : 'text-orange-700'}>
                          {owner?.id || 'Unassigned'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Consumer Group Protocol Explanation */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Assignment Strategy: {groupProtocol}</h4>
        <p className="text-sm text-blue-700">
          {groupProtocol === 'range' && 
            'Range assignor assigns consecutive partitions to consumers. Simple but can lead to uneven distribution.'}
          {groupProtocol === 'round-robin' && 
            'Round-robin assignor distributes partitions evenly across consumers in a cyclic manner.'}
          {groupProtocol === 'cooperative-sticky' && 
            'Cooperative sticky assignor minimizes partition movement during rebalancing while maintaining even distribution.'}
        </p>
        <div className="mt-3 text-xs text-blue-600">
          <strong>Key Principle:</strong> Each partition can only be consumed by one consumer instance within a consumer group at any given time.
        </div>
      </div>
    </div>
  );
};

export default ConsumerGroupCoordination;