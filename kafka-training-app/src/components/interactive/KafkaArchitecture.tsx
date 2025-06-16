import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Users, Zap, Clock } from 'lucide-react';

interface ClusterInfo {
  region: string;
  throughput: number;
  storage: number;
  networkUtilization: number;
}

interface TopicDetail {
  name: string;
  partitions: number;
  replicationFactor: number;
  retentionMs: number;
  cleanupPolicy: 'delete' | 'compact';
  minISR: number;
  compressionType: string;
  messageCount: number;
  sizeBytes: number;
}

interface PartitionDetail {
  topicName: string;
  partitionId: number;
  leader: number;
  replicas: number[];
  isr: number[];
  highWaterMark: number;
  logStartOffset: number;
  logEndOffset: number;
  preferredReplica: number;
}

interface KafkaArchitectureProps {
  showClusterInfo?: boolean;
  showTopics?: boolean;
  showPartitions?: boolean;
  showProducers?: boolean;
  showConsumers?: boolean;
  showConfluentServices?: boolean;
  animated?: boolean;
}

const KafkaArchitecture: React.FC<KafkaArchitectureProps> = ({
  showClusterInfo = true,
  showTopics = true,
  showPartitions = true,
  showProducers = true,
  showConsumers = true,
  showConfluentServices = true,
  animated = true
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedPartition, setSelectedPartition] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [topics, setTopics] = useState<TopicDetail[]>([]);
  const [partitions, setPartitions] = useState<PartitionDetail[]>([]);

  // Initialize Confluent Cloud cluster data
  useEffect(() => {
    const clusterData: ClusterInfo = {
      region: 'us-west-2',
      throughput: 125000, // messages/sec
      storage: 2.4, // TB
      networkUtilization: 45 // percentage
    };
    setClusterInfo(clusterData);

    const initialTopics: TopicDetail[] = [
      {
        name: 'payment-requests',
        partitions: 6,
        replicationFactor: 3,
        retentionMs: 604800000, // 7 days
        cleanupPolicy: 'delete',
        minISR: 2,
        compressionType: 'lz4',
        messageCount: 2450000,
        sizeBytes: 1024 * 1024 * 512 // 512MB
      },
      {
        name: 'payment-events',
        partitions: 6,
        replicationFactor: 3,
        retentionMs: 2592000000, // 30 days
        cleanupPolicy: 'delete',
        minISR: 2,
        compressionType: 'snappy',
        messageCount: 5200000,
        sizeBytes: 1024 * 1024 * 1024 // 1GB
      },
      {
        name: 'user-activity',
        partitions: 12,
        replicationFactor: 3,
        retentionMs: 86400000, // 1 day
        cleanupPolicy: 'delete',
        minISR: 2,
        compressionType: 'gzip',
        messageCount: 12500000,
        sizeBytes: 1024 * 1024 * 256 // 256MB
      }
    ];
    setTopics(initialTopics);

    // Generate partition details for Confluent Cloud
    const allPartitions: PartitionDetail[] = [];
    initialTopics.forEach(topic => {
      for (let i = 0; i < topic.partitions; i++) {
        const leader = i % 3;
        const replicas = [leader, (leader + 1) % 3, (leader + 2) % 3];
        const isr = Math.random() > 0.05 ? replicas : replicas.slice(0, 2); // 95% chance all replicas in sync (managed service)
        
        allPartitions.push({
          topicName: topic.name,
          partitionId: i,
          leader,
          replicas,
          isr,
          highWaterMark: Math.floor(Math.random() * 100000) + 50000,
          logStartOffset: 0,
          logEndOffset: Math.floor(Math.random() * 100000) + 50000,
          preferredReplica: leader
        });
      }
    });
    setPartitions(allPartitions);
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatRetention = (ms: number) => {
    const days = ms / (1000 * 60 * 60 * 24);
    return days >= 1 ? `${Math.round(days)}d` : `${Math.round(ms / (1000 * 60 * 60))}h`;
  };

  const formatThroughput = (throughput: number) => {
    if (throughput >= 1000000) return `${(throughput / 1000000).toFixed(1)}M`;
    if (throughput >= 1000) return `${(throughput / 1000).toFixed(1)}K`;
    return throughput.toString();
  };

  const getPartitionHealth = (partition: PartitionDetail) => {
    const isHealthy = partition.isr.length === partition.replicas.length;
    const isPreferredLeader = partition.leader === partition.preferredReplica;
    
    if (!isHealthy) return { color: 'red', status: 'Unhealthy', message: 'ISR < Replicas' };
    if (!isPreferredLeader) return { color: 'orange', status: 'Suboptimal', message: 'Not preferred leader' };
    return { color: 'green', status: 'Healthy', message: 'All replicas in sync' };
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">Confluent Cloud Architecture</h3>
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'detailed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Detailed View
          </button>
        </div>
      </div>

      {/* Confluent Cloud Cluster Info */}
      {showClusterInfo && clusterInfo && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold mb-4 text-blue-800 flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Managed Kafka Cluster</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-3 bg-white rounded border border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Region</div>
              <div className="font-semibold text-gray-800">{clusterInfo.region}</div>
            </div>
            <div className="p-3 bg-white rounded border border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Throughput</div>
              <div className="font-semibold text-gray-800">{formatThroughput(clusterInfo.throughput)}/sec</div>
            </div>
            <div className="p-3 bg-white rounded border border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Storage</div>
              <div className="font-semibold text-gray-800">{clusterInfo.storage} TB</div>
            </div>
            <div className="p-3 bg-white rounded border border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Network Usage</div>
              <div className="font-semibold text-gray-800">{clusterInfo.networkUtilization}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Confluent Services */}
      {showConfluentServices && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h5 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Schema Registry</span>
            </h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Schemas:</span>
                <span className="font-mono">24</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h5 className="font-semibold text-purple-800 mb-2 flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>ksqlDB</span>
            </h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Queries:</span>
                <span className="font-mono">8</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h5 className="font-semibold text-orange-800 mb-2 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Kafka Connect</span>
            </h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connectors:</span>
                <span className="font-mono">12</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Stream Governance</span>
            </h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Data Lineage:</span>
                <span className="text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Quality:</span>
                <span className="text-green-600 font-medium">Monitored</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Producers and Consumers */}
      {(showProducers || showConsumers) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Producers */}
          {showProducers && (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold mb-4 text-blue-800 flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Producers</span>
              </h4>
              <div className="space-y-3">
                {['payment-service', 'user-service', 'analytics-service'].map((producer, index) => (
                  <div key={producer} className="flex items-center space-x-3 p-3 bg-white rounded border">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{producer}</p>
                      <p className="text-xs text-gray-600">
                        {1200 + index * 300} msgs/sec • {(Math.random() * 10 + 1).toFixed(1)}ms latency
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consumers */}
          {showConsumers && (
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-lg font-semibold mb-4 text-green-800 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Consumer Groups</span>
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'payment-processors', consumers: 3, lag: 24 },
                  { name: 'analytics-consumers', consumers: 2, lag: 156 },
                  { name: 'audit-consumers', consumers: 1, lag: 0 }
                ].map((group) => (
                  <div key={group.name} className="flex items-center space-x-3 p-3 bg-white rounded border">
                    <div className={`w-3 h-3 rounded-full ${
                      group.lag > 100 ? 'bg-red-500' : group.lag > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{group.name}</p>
                      <p className="text-xs text-gray-600">
                        {group.consumers} consumers • Lag: {group.lag} msgs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Topics Section */}
      {showTopics && (
        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Topics</span>
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {topics.map((topic, topicIndex) => (
              <motion.div
                key={topic.name}
                initial={animated ? { opacity: 0, x: -20 } : {}}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: topicIndex * 0.1 }}
                onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTopic === topic.name
                    ? 'bg-blue-50 border-blue-400 scale-105'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-blue-700">{topic.name}</h5>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {topic.partitions}P
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Replication:</span>
                    <span className="font-mono">{topic.replicationFactor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retention:</span>
                    <span className="font-mono">{formatRetention(topic.retentionMs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-mono">{formatBytes(topic.sizeBytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messages:</span>
                    <span className="font-mono">{topic.messageCount.toLocaleString()}</span>
                  </div>
                  {viewMode === 'detailed' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min ISR:</span>
                        <span className="font-mono">{topic.minISR}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compression:</span>
                        <span className="font-mono">{topic.compressionType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cleanup:</span>
                        <span className="font-mono">{topic.cleanupPolicy}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Partition Grid */}
                {showPartitions && selectedTopic === topic.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <h6 className="font-medium text-gray-700 mb-2">Partitions</h6>
                    <div className="grid grid-cols-3 gap-2">
                      {partitions
                        .filter(p => p.topicName === topic.name)
                        .map((partition) => {
                          const health = getPartitionHealth(partition);
                          return (
                            <div
                              key={`${partition.topicName}-${partition.partitionId}`}
                              className={`p-2 rounded border cursor-pointer transition-all hover:scale-105 ${
                                health.color === 'green' ? 'bg-green-50 border-green-200' :
                                health.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                                'bg-red-50 border-red-200'
                              }`}
                              title={health.message}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPartition(`${partition.topicName}-${partition.partitionId}`);
                              }}
                            >
                              <div className="text-xs">
                                <div className="font-semibold">P{partition.partitionId}</div>
                                <div className="text-gray-600">L: {partition.leader}</div>
                                <div className="flex space-x-1 mt-1">
                                  {partition.replicas.map((replica) => (
                                    <div
                                      key={replica}
                                      className={`w-2 h-2 rounded-full ${
                                        replica === partition.leader ? 'bg-green-500' :
                                        partition.isr.includes(replica) ? 'bg-blue-500' : 'bg-red-500'
                                      }`}
                                      title={`Replica ${replica} ${
                                        replica === partition.leader ? '(Leader)' :
                                        partition.isr.includes(replica) ? '(ISR)' : '(Out of Sync)'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Partition Details Modal */}
      <AnimatePresence>
        {selectedPartition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedPartition(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const partition = partitions.find(p => 
                  `${p.topicName}-${p.partitionId}` === selectedPartition
                );
                if (!partition) return null;

                const health = getPartitionHealth(partition);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Partition Details</h3>
                      <button
                        onClick={() => setSelectedPartition(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Topic:</span>
                        <span className="font-mono">{partition.topicName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Partition ID:</span>
                        <span className="font-mono">{partition.partitionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Leader:</span>
                        <span className="font-mono">Replica {partition.leader}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Replicas:</span>
                        <span className="font-mono">[{partition.replicas.join(', ')}]</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ISR:</span>
                        <span className="font-mono">[{partition.isr.join(', ')}]</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">High Water Mark:</span>
                        <span className="font-mono">{partition.highWaterMark.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Log End Offset:</span>
                        <span className="font-mono">{partition.logEndOffset.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Health:</span>
                        <span className={`font-medium text-${health.color}-600`}>
                          {health.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-3">Legend</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Healthy Partition / Service Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Replica In-Sync</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Performance Issue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span>Warning / Attention Required</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-3">Confluent Cloud Benefits</h5>
          <div className="space-y-1 text-sm text-gray-600">
            <div>• <strong>Fully Managed:</strong> No infrastructure to manage</div>
            <div>• <strong>Auto-scaling:</strong> Elastic capacity on demand</div>
            <div>• <strong></strong> Enterprise-grade reliability</div>
            <div>• <strong>Global:</strong> Available in 60+ cloud regions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KafkaArchitecture;