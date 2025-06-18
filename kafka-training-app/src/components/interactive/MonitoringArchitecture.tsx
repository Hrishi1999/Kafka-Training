import React, { useState, useEffect } from 'react';
import { Server, Database, BarChart, Activity, ArrowRight } from 'lucide-react';

interface MetricFlow {
  source: string;
  destination: string;
  metrics: string[];
  active: boolean;
}

const MonitoringArchitecture: React.FC<{ 
  components?: string[]; 
  showMetricsFlow?: boolean 
}> = ({ 
  components = ["Producer", "Consumer", "Prometheus", "Grafana"],
  showMetricsFlow = true 
}) => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [metricFlows, setMetricFlows] = useState<MetricFlow[]>([]);

  const componentDetails = {
    Producer: {
      icon: Server,
      color: 'blue',
      metrics: ['Request Rate', 'Response Time', 'Batch Size', 'Delivery Failures'],
      description: 'FastAPI service exposing Prometheus metrics'
    },
    Consumer: {
      icon: Server,
      color: 'green',
      metrics: ['Processing Rate', 'Consumer Lag', 'Rebalances', 'End-to-End Latency'],
      description: 'Python consumer with custom metrics'
    },
    Prometheus: {
      icon: Database,
      color: 'purple',
      metrics: ['Scrape Interval: 15s', 'Retention: 15 days', 'Alert Rules: 10+'],
      description: 'Time-series database for metrics'
    },
    Grafana: {
      icon: BarChart,
      color: 'orange',
      metrics: ['Payment Dashboard', 'System Health', 'Business KPIs'],
      description: 'Visualization and alerting'
    }
  };

  useEffect(() => {
    if (showMetricsFlow) {
      const flows: MetricFlow[] = [
        {
          source: 'Producer',
          destination: 'Prometheus',
          metrics: ['HTTP metrics', 'Kafka producer metrics'],
          active: true
        },
        {
          source: 'Consumer',
          destination: 'Prometheus',
          metrics: ['Processing metrics', 'Consumer lag'],
          active: true
        },
        {
          source: 'Prometheus',
          destination: 'Grafana',
          metrics: ['Time-series data', 'Alert status'],
          active: true
        }
      ];
      setMetricFlows(flows);
    }
  }, [showMetricsFlow]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Kafka Monitoring Architecture</h3>
        <p className="text-gray-600">Click components to see their metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {components.map((component) => {
          const details = componentDetails[component as keyof typeof componentDetails];
          const Icon = details.icon;
          
          return (
            <div
              key={component}
              className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                activeComponent === component ? 'ring-4 ring-' + details.color + '-500' : ''
              }`}
              onClick={() => setActiveComponent(component)}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg">{component}</h4>
                <Icon className={
                  details.color === 'blue' ? 'w-8 h-8 text-blue-500' :
                  details.color === 'green' ? 'w-8 h-8 text-green-500' :
                  details.color === 'purple' ? 'w-8 h-8 text-purple-500' :
                  details.color === 'orange' ? 'w-8 h-8 text-orange-500' :
                  'w-8 h-8 text-gray-500'
                } />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{details.description}</p>
              
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Key Metrics:</h5>
                {details.metrics.slice(0, 3).map((metric, idx) => (
                  <div key={idx} className="flex items-center text-sm">
                    <Activity className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">{metric}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showMetricsFlow && (
        <div className="mt-8">
          <h4 className="font-semibold text-lg mb-4 text-center">Metrics Flow</h4>
          <div className="flex justify-center items-center space-x-4">
            <div className="bg-blue-100 rounded-lg p-4 text-center">
              <Server className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Producer</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="bg-purple-100 rounded-lg p-4 text-center">
              <Database className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">Prometheus</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="bg-orange-100 rounded-lg p-4 text-center">
              <BarChart className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-medium">Grafana</p>
            </div>
          </div>
          <div className="flex justify-center items-center space-x-4 mt-4">
            <div className="bg-green-100 rounded-lg p-4 text-center">
              <Server className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Consumer</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 transform -rotate-45 relative -top-8" />
          </div>
        </div>
      )}

      {activeComponent && (
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4">{activeComponent} Metrics Details</h4>
          <div className="grid grid-cols-2 gap-4">
            {componentDetails[activeComponent as keyof typeof componentDetails].metrics.map((metric, idx) => (
              <div key={idx} className="bg-white rounded p-3">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm">{metric}</span>
                </div>
              </div>
            ))}
          </div>
          
          {activeComponent === 'Prometheus' && (
            <div className="mt-4 p-4 bg-purple-50 rounded">
              <p className="text-sm text-purple-800">
                <strong>Scrape Configuration:</strong> Prometheus automatically discovers and scrapes 
                metrics from /metrics endpoints every 15 seconds. All metrics are stored with 
                millisecond precision timestamps.
              </p>
            </div>
          )}
          
          {activeComponent === 'Grafana' && (
            <div className="mt-4 p-4 bg-orange-50 rounded">
              <p className="text-sm text-orange-800">
                <strong>Dashboard Features:</strong> Real-time updates, custom alerts, 
                drill-down capabilities, and export functionality for reports.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoringArchitecture;