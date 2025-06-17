import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Metric {
  name: string;
  value: string;
  threshold?: number;
  status: 'healthy' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  details?: string;
}

interface ResilienceMonitoringProps {
  metrics: Metric[];
  alerts: string[];
}

const ResilienceMonitoring: React.FC<ResilienceMonitoringProps> = ({
  metrics,
  alerts,
}) => {
  const [realTimeMetrics, setRealTimeMetrics] = useState(metrics);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics(prevMetrics => 
        prevMetrics.map(metric => {
          // Simulate real-time metric updates
          let newValue = metric.value;
          let newStatus = metric.status;
          
          if (metric.name === 'DLQ Messages') {
            const currentValue = parseInt(metric.value);
            const change = Math.floor(Math.random() * 6) - 2; // -2 to +3
            const newCount = Math.max(0, currentValue + change);
            newValue = newCount.toString();
            newStatus = newCount > 50 ? 'warning' : newCount > 100 ? 'critical' : 'healthy';
          } else if (metric.name === 'Retry Rate') {
            const currentValue = parseFloat(metric.value.replace('%', ''));
            const change = (Math.random() - 0.5) * 1; // ±0.5%
            const newRate = Math.max(0, Math.min(10, currentValue + change));
            newValue = `${newRate.toFixed(1)}%`;
            newStatus = newRate > 5 ? 'warning' : newRate > 8 ? 'critical' : 'healthy';
          } else if (metric.name === 'Processing Latency') {
            const currentValue = parseInt(metric.value.replace('ms', ''));
            const change = Math.floor(Math.random() * 20) - 5; // -5 to +15ms
            const newLatency = Math.max(10, currentValue + change);
            newValue = `${newLatency}ms`;
            newStatus = newLatency > 100 ? 'warning' : newLatency > 200 ? 'critical' : 'healthy';
          }
          
          return { ...metric, value: newValue, status: newStatus };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update system health based on individual metrics
    const criticalCount = realTimeMetrics.filter(m => m.status === 'critical').length;
    const warningCount = realTimeMetrics.filter(m => m.status === 'warning').length;
    
    if (criticalCount > 0) {
      setSystemHealth('critical');
    } else if (warningCount > 1) {
      setSystemHealth('degraded');
    } else {
      setSystemHealth('healthy');
    }

    // Simulate alerts
    const newAlerts = realTimeMetrics
      .filter(m => m.status !== 'healthy')
      .map(m => `${m.name}: ${m.value} (${m.status})`)
      .slice(0, 3);
    
    setActiveAlerts(newAlerts);
  }, [realTimeMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-100 rounded-lg">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Resilience Monitoring Dashboard
        </h3>
        <p className="text-gray-600">
          Real-time monitoring of error handling and system resilience
        </p>
      </div>

      {/* System Health Overview */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            System Health Overview
          </h4>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`px-4 py-2 rounded-full font-medium ${getSystemHealthColor(systemHealth)}`}
          >
            {systemHealth.toUpperCase()}
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {realTimeMetrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${getStatusColor(metric.status)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-sm">{metric.name}</h5>
                {metric.trend && (
                  <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                )}
              </div>
              
              <motion.div
                key={metric.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold mb-1"
              >
                {metric.value}
              </motion.div>
              
              {metric.details && (
                <div className="text-xs opacity-75">
                  {metric.details}
                </div>
              )}
              
              {metric.threshold && (
                <div className="text-xs mt-1 opacity-60">
                  Threshold: {metric.threshold}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          🚨 Active Alerts
        </h4>
        
        <AnimatePresence>
          {activeAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-center"
            >
              <div className="text-green-600 font-medium">
                ✅ No Active Alerts
              </div>
              <div className="text-sm text-green-500 mt-1">
                All systems operating within normal parameters
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert, index) => (
                <motion.div
                  key={alert}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-red-500 text-xl mr-3"
                  >
                    🚨
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-medium text-red-800">{alert}</div>
                  </div>
                  <div className="text-xs text-red-600">
                    {new Date().toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert Rules */}
      <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          📋 Alert Rules Configuration
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-orange-600 mb-3">Warning Thresholds</h5>
            <div className="space-y-2 text-sm">
              {alerts.filter(alert => alert.includes('>')).map((alert, index) => (
                <div key={index} className="flex items-center p-2 bg-yellow-50 rounded">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  {alert}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold text-red-600 mb-3">Critical Thresholds</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center p-2 bg-red-50 rounded">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                DLQ growth rate &gt; 50 messages/minute
              </div>
              <div className="flex items-center p-2 bg-red-50 rounded">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Processing latency &gt; 200ms for 5 minutes
              </div>
              <div className="flex items-center p-2 bg-red-50 rounded">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Retry rate &gt; 15% for 10 minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          🔌 Circuit Breaker Status
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-semibold text-green-600 mb-2">Fraud Service</h5>
            <div className="text-2xl font-bold text-green-600 mb-1">CLOSED</div>
            <div className="text-sm text-green-700">
              Success rate: 99.2%
            </div>
            <div className="text-xs text-green-600 mt-1">
              Last failure: 2 hours ago
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-semibold text-green-600 mb-2">Customer Service</h5>
            <div className="text-2xl font-bold text-green-600 mb-1">CLOSED</div>
            <div className="text-sm text-green-700">
              Success rate: 98.7%
            </div>
            <div className="text-xs text-green-600 mt-1">
              Last failure: 45 minutes ago
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-blue-600 mb-2">Fallback Mode</h5>
            <div className="text-2xl font-bold text-blue-600 mb-1">READY</div>
            <div className="text-sm text-blue-700">
              Degraded functionality available
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Manual review queue: 12 items
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h6 className="font-medium text-gray-800 mb-2">💡 Monitoring Best Practices</h6>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Set up automated alerts for DLQ growth and processing delays</li>
            <li>• Monitor circuit breaker state changes and failure patterns</li>
            <li>• Track retry success rates to optimize retry intervals</li>
            <li>• Implement health checks for external service dependencies</li>
            <li>• Use distributed tracing for end-to-end request visibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResilienceMonitoring;