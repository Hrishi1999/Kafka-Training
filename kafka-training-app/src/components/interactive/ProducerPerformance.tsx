import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, TrendingUp, TrendingDown, Zap, Settings, Activity, Play, Pause, RotateCcw } from 'lucide-react';

interface PerformanceMetric {
  timestamp: number;
  throughput: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  batchSize: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface ProducerConfig {
  batchSize: number;
  lingerMs: number;
  compressionType: string;
  acks: string;
  maxInFlight: number;
  bufferMemory: number;
  retries: number;
  requestTimeoutMs: number;
  enableIdempotence: boolean;
}

interface ProducerPerformanceProps {
  showRealTime?: boolean;
  showConfigs?: boolean;
  showOptimizations?: boolean;
}

const ProducerPerformance: React.FC<ProducerPerformanceProps> = ({
  showRealTime = true,
  showConfigs = true,
  showOptimizations = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<ProducerConfig>({
    batchSize: 16384,
    lingerMs: 0,
    compressionType: 'none',
    acks: '1',
    maxInFlight: 5,
    bufferMemory: 33554432,
    retries: 2147483647,
    requestTimeoutMs: 30000,
    enableIdempotence: true
  });

  // Performance scenarios
  const scenarios = {
    baseline: { 
      batchSize: 16384, lingerMs: 0, compressionType: 'none', acks: '1', maxInFlight: 5,
      bufferMemory: 33554432, retries: 2147483647, requestTimeoutMs: 30000, enableIdempotence: true
    },
    throughput: { 
      batchSize: 65536, lingerMs: 20, compressionType: 'lz4', acks: '1', maxInFlight: 5,
      bufferMemory: 67108864, retries: 2147483647, requestTimeoutMs: 30000, enableIdempotence: true
    },
    reliability: { 
      batchSize: 16384, lingerMs: 0, compressionType: 'none', acks: 'all', maxInFlight: 1,
      bufferMemory: 33554432, retries: 2147483647, requestTimeoutMs: 30000, enableIdempotence: true
    },
    latency: { 
      batchSize: 1, lingerMs: 0, compressionType: 'none', acks: '1', maxInFlight: 1,
      bufferMemory: 33554432, retries: 0, requestTimeoutMs: 5000, enableIdempotence: false
    }
  };

  const generateMetric = useCallback((config: ProducerConfig): PerformanceMetric => {
    // Simulate performance based on configuration
    const baselinePerf = {
      throughput: 10000,
      latencyP50: 5,
      latencyP95: 15,
      latencyP99: 25,
      errorRate: 0.1,
      cpuUsage: 25,
      memoryUsage: 512
    };

    let throughputMultiplier = 1;
    let latencyMultiplier = 1;
    let errorMultiplier = 1;
    let cpuMultiplier = 1;
    let memoryMultiplier = 1;

    // Batch size impact
    const batchSizeLog = Math.log(config.batchSize / 1024) / Math.log(16);
    throughputMultiplier *= Math.max(0.5, Math.min(2.5, batchSizeLog));
    latencyMultiplier *= config.batchSize > 32768 ? 1.2 + (config.batchSize / 100000) : 1;
    cpuMultiplier *= 1 + (config.batchSize / 1000000);

    // Linger time impact
    if (config.lingerMs > 0) {
      throughputMultiplier *= 1.2 + (config.lingerMs / 100);
      latencyMultiplier *= 1 + (config.lingerMs / 50);
    }

    // Compression impact
    if (config.compressionType !== 'none') {
      const compressionBoost = config.compressionType === 'lz4' ? 1.3 : 
                              config.compressionType === 'snappy' ? 1.25 : 1.15;
      throughputMultiplier *= compressionBoost;
      latencyMultiplier *= 1.1;
      cpuMultiplier *= 1.4;
    }

    // Acks impact
    if (config.acks === 'all') {
      throughputMultiplier *= 0.7;
      latencyMultiplier *= 1.6;
      errorMultiplier *= 0.05;
    } else if (config.acks === '0') {
      throughputMultiplier *= 1.4;
      latencyMultiplier *= 0.8;
      errorMultiplier *= 3;
    }

    // Max in flight impact
    throughputMultiplier *= Math.min(config.maxInFlight / 3, 2);
    if (config.maxInFlight > 5) {
      latencyMultiplier *= 1 + ((config.maxInFlight - 5) / 20);
    }

    // Buffer memory impact
    memoryMultiplier *= config.bufferMemory / 33554432;
    if (config.bufferMemory < 16777216) {
      throughputMultiplier *= 0.8; // Reduced throughput with small buffer
    }

    // Idempotence impact
    if (config.enableIdempotence) {
      latencyMultiplier *= 1.1;
      throughputMultiplier *= 0.95;
      errorMultiplier *= 0.1;
    }

    // Add some randomness
    const randomFactor = 0.85 + Math.random() * 0.3;

    return {
      timestamp: Date.now(),
      throughput: Math.round(baselinePerf.throughput * throughputMultiplier * randomFactor),
      latencyP50: Math.round(baselinePerf.latencyP50 * latencyMultiplier * randomFactor),
      latencyP95: Math.round(baselinePerf.latencyP95 * latencyMultiplier * randomFactor),
      latencyP99: Math.round(baselinePerf.latencyP99 * latencyMultiplier * randomFactor),
      batchSize: config.batchSize,
      errorRate: Math.max(0, baselinePerf.errorRate * errorMultiplier * randomFactor),
      cpuUsage: Math.min(100, Math.round(baselinePerf.cpuUsage * cpuMultiplier * randomFactor)),
      memoryUsage: Math.round(baselinePerf.memoryUsage * memoryMultiplier)
    };
  }, []);

  const startBenchmark = useCallback(() => {
    setIsRunning(true);
    setMetrics([]);
  }, []);

  const stopBenchmark = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics([]);
    setIsRunning(false);
  }, []);

  const applyScenario = (scenarioKey: keyof typeof scenarios) => {
    setConfig(scenarios[scenarioKey]);
    setMetrics([]);
  };

  const updateConfig = (key: keyof ProducerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Effect for running benchmark
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const metric = generateMetric(config);
      setMetrics(prev => [...prev.slice(-29), metric]);
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, config, generateMetric]);

  const latestMetric = metrics[metrics.length - 1];
  const previousMetric = metrics[metrics.length - 2];

  const getTrendIcon = (current: number, previous: number) => {
    if (!previous) return null;
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={isRunning ? stopBenchmark : startBenchmark}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-white ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={resetMetrics}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors flex items-center space-x-2 text-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              showSettings ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Scenario Presets */}
        {showOptimizations && (
          <div className="flex space-x-2">
            {Object.entries(scenarios).map(([key, _]) => (
              <button
                key={key}
                onClick={() => applyScenario(key as keyof typeof scenarios)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Configuration Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <h4 className="font-semibold text-purple-600 mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Producer Configuration</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Batch Size */}
              <div>
                <label className="block text-sm text-gray-800 mb-2">
                  Batch Size: {config.batchSize.toLocaleString()} bytes
                </label>
                <input
                  type="range"
                  min="1024"
                  max="131072"
                  step="1024"
                  value={config.batchSize}
                  onChange={(e) => updateConfig('batchSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1KB</span>
                  <span>128KB</span>
                </div>
              </div>

              {/* Linger MS */}
              <div>
                <label className="block text-sm text-gray-800 mb-2">
                  Linger MS: {config.lingerMs}ms
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={config.lingerMs}
                  onChange={(e) => updateConfig('lingerMs', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0ms</span>
                  <span>100ms</span>
                </div>
              </div>

              {/* Compression */}
              <div>
                <label className="block text-sm text-gray-800 mb-2">Compression Type</label>
                <select
                  value={config.compressionType}
                  onChange={(e) => updateConfig('compressionType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded text-gray-900"
                >
                  <option value="none">None</option>
                  <option value="gzip">GZIP</option>
                  <option value="snappy">Snappy</option>
                  <option value="lz4">LZ4</option>
                  <option value="zstd">ZSTD</option>
                </select>
              </div>

              {/* Acknowledgments */}
              <div>
                <label className="block text-sm text-gray-800 mb-2">Acknowledgments</label>
                <select
                  value={config.acks}
                  onChange={(e) => updateConfig('acks', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded text-gray-900"
                >
                  <option value="0">0 (None)</option>
                  <option value="1">1 (Leader)</option>
                  <option value="all">All (ISR)</option>
                </select>
              </div>

              {/* Max In Flight */}
              <div>
                <label className="block text-sm text-gray-800 mb-2">
                  Max In Flight: {config.maxInFlight}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={config.maxInFlight}
                  onChange={(e) => updateConfig('maxInFlight', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Buffer Memory */}
              <div>
                <label className="block text-sm text-gray-800 mb-2">
                  Buffer Memory: {formatBytes(config.bufferMemory)}
                </label>
                <input
                  type="range"
                  min="16777216"
                  max="134217728"
                  step="16777216"
                  value={config.bufferMemory}
                  onChange={(e) => updateConfig('bufferMemory', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Enable Idempotence */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="idempotence"
                  checked={config.enableIdempotence}
                  onChange={(e) => updateConfig('enableIdempotence', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 rounded"
                />
                <label htmlFor="idempotence" className="text-sm text-gray-800">
                  Enable Idempotence
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Current Metrics */}
      {latestMetric && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Throughput</span>
              </div>
              {getTrendIcon(latestMetric.throughput, previousMetric?.throughput)}
            </div>
            <p className="text-xl font-bold text-blue-600">
              {latestMetric.throughput.toLocaleString()}/s
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Latency P50</span>
              </div>
              {getTrendIcon(previousMetric?.latencyP50, latestMetric.latencyP50)}
            </div>
            <p className="text-xl font-bold text-green-600">
              {latestMetric.latencyP50}ms
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-gray-600">Latency P99</span>
              </div>
              {getTrendIcon(previousMetric?.latencyP99, latestMetric.latencyP99)}
            </div>
            <p className="text-xl font-bold text-yellow-600">
              {latestMetric.latencyP99}ms
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <BarChart className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">Error Rate</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {latestMetric.errorRate.toFixed(3)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">CPU Usage</span>
            </div>
            <p className="text-xl font-bold text-purple-600">
              {latestMetric.cpuUsage}%
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-2">
              <BarChart className="h-5 w-5 text-indigo-400" />
              <span className="text-sm text-gray-600">Memory</span>
            </div>
            <p className="text-xl font-bold text-indigo-400">
              {latestMetric.memoryUsage}MB
            </p>
          </motion.div>
        </div>
      )}

      {/* Enhanced Performance Charts */}
      {showRealTime && metrics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Throughput Chart */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">Throughput Over Time</h4>
            <div className="relative h-32">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="throughputGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                {metrics.length > 1 && (
                  <>
                    <path
                      d={metrics.map((metric, index) => {
                        const x = (index / (metrics.length - 1)) * 100;
                        const y = 100 - (metric.throughput / Math.max(...metrics.map(m => m.throughput))) * 80;
                        return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                      }).join(' ')}
                      stroke="#3B82F6"
                      strokeWidth="2"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={metrics.map((metric, index) => {
                        const x = (index / (metrics.length - 1)) * 100;
                        const y = 100 - (metric.throughput / Math.max(...metrics.map(m => m.throughput))) * 80;
                        return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                      }).join(' ') + ' L 100% 100% L 0% 100% Z'}
                      fill="url(#throughputGradient)"
                    />
                  </>
                )}
              </svg>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0</span>
              <span>{latestMetric?.throughput.toLocaleString()}/s</span>
            </div>
          </div>

          {/* Latency Chart */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">Latency Over Time</h4>
            <div className="relative h-32">
              <svg className="w-full h-full">
                <defs>
                  <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#EAB308', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: '#EAB308', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                {metrics.length > 1 && (
                  <>
                    <path
                      d={metrics.map((metric, index) => {
                        const x = (index / (metrics.length - 1)) * 100;
                        const y = 100 - (metric.latencyP99 / Math.max(...metrics.map(m => m.latencyP99))) * 80;
                        return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                      }).join(' ')}
                      stroke="#EAB308"
                      strokeWidth="2"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={metrics.map((metric, index) => {
                        const x = (index / (metrics.length - 1)) * 100;
                        const y = 100 - (metric.latencyP99 / Math.max(...metrics.map(m => m.latencyP99))) * 80;
                        return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                      }).join(' ') + ' L 100% 100% L 0% 100% Z'}
                      fill="url(#latencyGradient)"
                    />
                  </>
                )}
              </svg>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0ms</span>
              <span>{latestMetric?.latencyP99}ms P99</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance Impact Analysis */}
      {latestMetric && (
        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-600/50">
          <h4 className="font-semibold text-blue-600 mb-3">Performance Impact Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="text-gray-800 font-medium mb-2">Current Configuration Impact:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Batch Size: {config.batchSize >= 32768 ? '🟢 High throughput' : config.batchSize >= 16384 ? '🟡 Balanced' : '🔴 Low throughput'}</li>
                <li>• Linger Time: {config.lingerMs > 10 ? '🟢 Batching optimized' : '🟡 Immediate send'}</li>
                <li>• Compression: {config.compressionType !== 'none' ? '🟢 Network efficient' : '🟡 No compression'}</li>
                <li>• Acknowledgments: {config.acks === 'all' ? '🟢 Highly reliable' : config.acks === '1' ? '🟡 Balanced' : '🔴 Fast but risky'}</li>
              </ul>
            </div>
            <div>
              <h5 className="text-gray-800 font-medium mb-2">Optimization Suggestions:</h5>
              <ul className="text-gray-600 space-y-1">
                {latestMetric.throughput < 15000 && <li>• Consider increasing batch size for higher throughput</li>}
                {latestMetric.latencyP99 > 50 && <li>• Reduce batch size or linger time for lower latency</li>}
                {latestMetric.errorRate > 1 && <li>• Enable idempotence and increase retries</li>}
                {latestMetric.cpuUsage > 80 && <li>• Consider reducing compression or batch size</li>}
                {config.compressionType === 'none' && <li>• Enable LZ4 compression for better network efficiency</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProducerPerformance;