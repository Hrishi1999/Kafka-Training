import React, { useState, useEffect } from 'react';
import { Database, Server, Cloud, ArrowRight, ArrowLeft, Settings, Activity } from 'lucide-react';

interface Connector {
  name: string;
  type: 'source' | 'sink';
  status: 'running' | 'paused' | 'failed';
  config: Record<string, string>;
  metrics: {
    records: number;
    rate: number;
  };
}

const KafkaConnectArchitecture: React.FC<{ 
  showSourceConnector?: boolean; 
  showSinkConnector?: boolean;
  animateDataFlow?: boolean;
}> = ({ 
  showSourceConnector = true, 
  showSinkConnector = true,
  animateDataFlow = true
}) => {
  const [dataFlowing, setDataFlowing] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [metrics, setMetrics] = useState({
    sourceRecords: 0,
    sinkRecords: 0,
    sourceRate: 0,
    sinkRate: 0
  });

  const sourceConnector: Connector = {
    name: "postgres-payment-source",
    type: "source",
    status: "running",
    config: {
      "connector.class": "JdbcSourceConnector",
      "connection.url": "jdbc:postgresql://postgres:5432/payments",
      "mode": "incrementing",
      "incrementing.column.name": "id",
      "poll.interval.ms": "1000"
    },
    metrics: {
      records: metrics.sourceRecords,
      rate: metrics.sourceRate
    }
  };

  const sinkConnector: Connector = {
    name: "http-payment-webhook",
    type: "sink",
    status: "running",
    config: {
      "connector.class": "HttpSinkConnector",
      "topics": "payment-notifications",
      "http.api.url": "https://api.merchant.com/webhooks",
      "batch.max.size": "10",
      "retry.backoff.ms": "1000"
    },
    metrics: {
      records: metrics.sinkRecords,
      rate: metrics.sinkRate
    }
  };

  useEffect(() => {
    if (dataFlowing && animateDataFlow) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          sourceRecords: prev.sourceRecords + Math.floor(Math.random() * 10),
          sinkRecords: prev.sinkRecords + Math.floor(Math.random() * 8),
          sourceRate: 5 + Math.random() * 10,
          sinkRate: 4 + Math.random() * 8
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [dataFlowing, animateDataFlow]);

  const toggleDataFlow = () => {
    setDataFlowing(!dataFlowing);
    if (!dataFlowing) {
      setMetrics({
        sourceRecords: 0,
        sinkRecords: 0,
        sourceRate: 0,
        sinkRate: 0
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Kafka Connect Architecture</h3>
        <p className="text-gray-600">No-code data integration at scale</p>
      </div>

      <div className="mb-6 flex justify-center">
        <button
          onClick={toggleDataFlow}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            dataFlowing 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {dataFlowing ? 'Stop Data Flow' : 'Start Data Flow'}
        </button>
      </div>

      <div className="relative">
        <div className="grid grid-cols-5 gap-4 items-center">
          {/* Source System */}
          {showSourceConnector && (
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold">PostgreSQL</h4>
              <p className="text-sm text-gray-600">Source Database</p>
            </div>
          )}

          {/* Source Connector */}
          {showSourceConnector && (
            <div 
              className={`bg-white rounded-lg shadow-lg p-4 cursor-pointer transition-all hover:shadow-xl ${
                selectedConnector?.name === sourceConnector.name ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedConnector(sourceConnector)}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">Source Connector</h5>
                <div className={`w-2 h-2 rounded-full ${
                  sourceConnector.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                } ${dataFlowing ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-xs text-gray-600 mb-2">JDBC Source</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Records:</span>
                  <span className="font-mono">{sourceConnector.metrics.records}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Rate:</span>
                  <span className="font-mono">{sourceConnector.metrics.rate.toFixed(1)}/s</span>
                </div>
              </div>
            </div>
          )}

          {/* Kafka */}
          <div className="text-center">
            <Cloud className="w-20 h-20 mx-auto mb-2 text-purple-500" />
            <h4 className="font-semibold">Apache Kafka</h4>
            <p className="text-sm text-gray-600">Event Streaming</p>
            {dataFlowing && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-purple-600">Topics:</p>
                <p className="text-xs font-mono bg-purple-50 rounded px-2 py-1">postgres-payments</p>
                <p className="text-xs font-mono bg-purple-50 rounded px-2 py-1">payment-notifications</p>
              </div>
            )}
          </div>

          {/* Sink Connector */}
          {showSinkConnector && (
            <div 
              className={`bg-white rounded-lg shadow-lg p-4 cursor-pointer transition-all hover:shadow-xl ${
                selectedConnector?.name === sinkConnector.name ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedConnector(sinkConnector)}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">Sink Connector</h5>
                <div className={`w-2 h-2 rounded-full ${
                  sinkConnector.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                } ${dataFlowing ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-xs text-gray-600 mb-2">HTTP Sink</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Records:</span>
                  <span className="font-mono">{sinkConnector.metrics.records}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Rate:</span>
                  <span className="font-mono">{sinkConnector.metrics.rate.toFixed(1)}/s</span>
                </div>
              </div>
            </div>
          )}

          {/* Target System */}
          {showSinkConnector && (
            <div className="text-center">
              <Server className="w-16 h-16 mx-auto mb-2 text-green-500" />
              <h4 className="font-semibold">HTTP API</h4>
              <p className="text-sm text-gray-600">Webhook Endpoint</p>
            </div>
          )}
        </div>

        {/* Data Flow Arrows */}
        {dataFlowing && animateDataFlow && (
          <>
            {showSourceConnector && (
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            )}
            {showSinkConnector && (
              <div className="absolute right-[20%] top-1/2 -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-green-400 animate-pulse" />
              </div>
            )}
          </>
        )}
      </div>

      {selectedConnector && (
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-lg">{selectedConnector.name}</h4>
            <Settings className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium capitalize">{selectedConnector.type} Connector</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium capitalize ${
                selectedConnector.status === 'running' ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedConnector.status}
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-4">
            <h5 className="font-medium mb-2">Configuration</h5>
            <div className="space-y-2">
              {Object.entries(selectedConnector.config).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Key Benefits</h4>
          <ul className="text-sm space-y-1 text-blue-700">
            <li>• No code required - configuration only</li>
            <li>• Automatic scaling and fault tolerance</li>
            <li>• Exactly-once delivery guarantees</li>
            <li>• 100+ pre-built connectors available</li>
          </ul>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Common Use Cases</h4>
          <ul className="text-sm space-y-1 text-green-700">
            <li>• Database CDC (Change Data Capture)</li>
            <li>• Data lake ingestion (S3, HDFS)</li>
            <li>• Real-time analytics (Elasticsearch)</li>
            <li>• Application integration (REST APIs)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KafkaConnectArchitecture;