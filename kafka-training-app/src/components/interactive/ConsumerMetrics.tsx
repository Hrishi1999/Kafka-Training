import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Clock, TrendingDown, TrendingUp, Activity, AlertCircle } from 'lucide-react';

interface ConsumerMetric {
  timestamp: number;
  lag: number;
  throughput: number;
  commitRate: number;
  heartbeatLatency: number;
  rebalanceCount: number;
  errorRate: number;
}

interface ConsumerGroup {
  groupId: string;
  topic: string;
  partitions: number;
  consumers: number;
  state: 'Stable' | 'PreparingRebalance' | 'CompletingRebalance';
}

interface ConsumerMetricsProps {
  groupId?: string;
  showLagChart?: boolean;
  showHealthStatus?: boolean;
  alertThresholds?: boolean;
}

const ConsumerMetrics: React.FC<ConsumerMetricsProps> = ({
  groupId = 'payment-processors',
  showLagChart = true,
  showHealthStatus = true,
  alertThresholds = true
}) => {
  const [metrics, setMetrics] = useState<ConsumerMetric[]>([]);
  const [consumerGroup, setConsumerGroup] = useState<ConsumerGroup>({
    groupId,
    topic: 'payment-events',
    partitions: 6,
    consumers: 3,
    state: 'Stable'
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  const generateMetric = (): ConsumerMetric => {
    const baseMetric = metrics[metrics.length - 1] || {
      lag: 100,
      throughput: 5000,
      commitRate: 1000,
      heartbeatLatency: 3,
      rebalanceCount: 0,
      errorRate: 0.1
    };

    // Simulate realistic variations
    return {
      timestamp: Date.now(),
      lag: Math.max(0, baseMetric.lag + (Math.random() - 0.5) * 50),
      throughput: Math.max(0, baseMetric.throughput + (Math.random() - 0.5) * 1000),
      commitRate: Math.max(0, baseMetric.commitRate + (Math.random() - 0.5) * 200),
      heartbeatLatency: Math.max(1, baseMetric.heartbeatLatency + (Math.random() - 0.5) * 2),
      rebalanceCount: Math.random() < 0.05 ? baseMetric.rebalanceCount + 1 : baseMetric.rebalanceCount,
      errorRate: Math.max(0, Math.min(5, baseMetric.errorRate + (Math.random() - 0.5) * 0.2))
    };
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setMetrics([]);

    const interval = setInterval(() => {
      const metric = generateMetric();
      setMetrics(prev => [...prev.slice(-29), metric]);

      // Simulate occasional rebalancing
      if (metric.rebalanceCount > (metrics[metrics.length - 1]?.rebalanceCount || 0)) {
        setConsumerGroup(prev => ({ ...prev, state: 'PreparingRebalance' }));
        setTimeout(() => {
          setConsumerGroup(prev => ({ ...prev, state: 'CompletingRebalance' }));
          setTimeout(() => {
            setConsumerGroup(prev => ({ ...prev, state: 'Stable' }));
          }, 2000);
        }, 1000);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsMonitoring(false);
    }, 30000);

    return () => clearInterval(interval);
  };

  const latestMetric = metrics[metrics.length - 1];

  const getHealthStatus = () => {
    if (!latestMetric) return { status: 'unknown', color: 'gray' };
    
    const { lag, errorRate, heartbeatLatency } = latestMetric;
    
    if (lag > 1000 || errorRate > 2 || heartbeatLatency > 10) {
      return { status: 'critical', color: 'red' };
    } else if (lag > 500 || errorRate > 1 || heartbeatLatency > 5) {
      return { status: 'warning', color: 'yellow' };
    } else {
      return { status: 'healthy', color: 'green' };
    }
  };

  const health = getHealthStatus();

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Stable':
        return 'text-green-600';
      case 'PreparingRebalance':
        return 'text-yellow-600';
      case 'CompletingRebalance':
        return 'text-orange-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-800">Consumer Group: {consumerGroup.groupId}</h3>
          <p className="text-sm text-gray-500">
            Topic: {consumerGroup.topic} • {consumerGroup.consumers} consumers
          </p>
        </div>
        <button
          onClick={startMonitoring}
          disabled={isMonitoring}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            isMonitoring ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>{isMonitoring ? 'Monitoring...' : 'Start Monitoring'}</span>
        </button>
      </div>

      {/* Health Status */}
      {showHealthStatus && latestMetric && (
        <div className={`p-4 rounded-lg border ${
          health.color === 'green' ? 'bg-green-900/20 border-green-600/50' :
          health.color === 'yellow' ? 'bg-yellow-900/20 border-yellow-600/50' :
          health.color === 'red' ? 'bg-red-900/20 border-red-600/50' :
          'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {health.color === 'red' && <AlertCircle className="h-6 w-6 text-red-500" />}
            {health.color === 'yellow' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
            {health.color === 'green' && <Eye className="h-6 w-6 text-green-500" />}
            <div>
              <h4 className={`font-semibold text-${health.color}-400`}>
                Consumer Group Health: {health.status.toUpperCase()}
              </h4>
              <p className="text-sm text-gray-600">
                State: <span className={getStateColor(consumerGroup.state)}>{consumerGroup.state}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {latestMetric && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`p-4 rounded-lg border ${
              latestMetric.lag > 500 ? 'bg-red-900/20 border-red-600/50' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Consumer Lag</span>
            </div>
            <p className={`text-2xl font-bold ${latestMetric.lag > 500 ? 'text-red-600' : 'text-blue-600'}`}>
              {Math.round(latestMetric.lag).toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Throughput</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(latestMetric.throughput).toLocaleString()}/s
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Heartbeat</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {latestMetric.heartbeatLatency.toFixed(1)}ms
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`p-4 rounded-lg border ${
              latestMetric.errorRate > 1 ? 'bg-red-900/20 border-red-600/50' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Error Rate</span>
            </div>
            <p className={`text-2xl font-bold ${latestMetric.errorRate > 1 ? 'text-red-600' : 'text-gray-600'}`}>
              {latestMetric.errorRate.toFixed(2)}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Lag Chart */}
      {showLagChart && metrics.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Consumer Lag Over Time</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Lag</span>
              <span className={latestMetric?.lag > 500 ? 'text-red-600' : 'text-blue-600'}>
                {Math.round(latestMetric?.lag || 0)} messages
              </span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((latestMetric?.lag || 0) / 2000) * 100, 100)}%` }}
                className={`h-full ${latestMetric?.lag > 500 ? 'bg-red-500' : 'bg-blue-500'}`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>1K</span>
              <span>2K+ messages</span>
            </div>
          </div>
        </div>
      )}

      {/* Alert Thresholds */}
      {alertThresholds && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Alert Thresholds</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-red-900/20 border border-red-600/50 rounded">
              <h5 className="font-medium text-red-600 mb-1">Critical</h5>
              <ul className="text-gray-800 space-y-1">
                <li>• Lag &gt; 1000 messages</li>
                <li>• Error rate &gt; 2%</li>
                <li>• Heartbeat &gt; 10ms</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/50 rounded">
              <h5 className="font-medium text-yellow-600 mb-1">Warning</h5>
              <ul className="text-gray-800 space-y-1">
                <li>• Lag &gt; 500 messages</li>
                <li>• Error rate &gt; 1%</li>
                <li>• Heartbeat &gt; 5ms</li>
              </ul>
            </div>
            <div className="p-3 bg-green-900/20 border border-green-600/50 rounded">
              <h5 className="font-medium text-green-600 mb-1">Healthy</h5>
              <ul className="text-gray-800 space-y-1">
                <li>• Lag &lt; 500 messages</li>
                <li>• Error rate &lt; 1%</li>
                <li>• Heartbeat &lt; 5ms</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerMetrics;