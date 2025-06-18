import React, { useState, useEffect } from 'react';
import { BarChart3, LineChart, Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardPanel {
  title: string;
  type: 'line' | 'bar' | 'stat' | 'gauge';
  value?: number;
  trend?: number;
  status?: 'good' | 'warning' | 'critical';
}

const GrafanaDashboardDemo: React.FC<{ 
  dashboards?: string[]; 
  showRealTimeData?: boolean 
}> = ({ 
  dashboards = ["Payment Overview", "System Health", "Business Metrics"],
  showRealTimeData = true 
}) => {
  const [activeDashboard, setActiveDashboard] = useState(dashboards[0]);
  const [metrics, setMetrics] = useState<Record<string, number>>({
    paymentsPerSecond: 45,
    errorRate: 0.02,
    avgLatency: 125,
    consumerLag: 234,
    cpuUsage: 65,
    memoryUsage: 72,
    totalRevenue: 125430,
    successRate: 98.5
  });

  useEffect(() => {
    if (showRealTimeData) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          paymentsPerSecond: Math.max(30, prev.paymentsPerSecond + (Math.random() - 0.5) * 10),
          errorRate: Math.max(0, Math.min(0.1, prev.errorRate + (Math.random() - 0.5) * 0.01)),
          avgLatency: Math.max(50, prev.avgLatency + (Math.random() - 0.5) * 20),
          consumerLag: Math.max(0, prev.consumerLag + (Math.random() - 0.5) * 50),
          cpuUsage: Math.max(20, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 5)),
          memoryUsage: Math.max(40, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 3)),
          totalRevenue: prev.totalRevenue + Math.random() * 1000,
          successRate: Math.max(95, Math.min(100, prev.successRate + (Math.random() - 0.5) * 0.5))
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [showRealTimeData]);

  const dashboardPanels: Record<string, DashboardPanel[]> = {
    "Payment Overview": [
      {
        title: "Payments/sec",
        type: "stat",
        value: metrics.paymentsPerSecond,
        trend: 5.2,
        status: "good"
      },
      {
        title: "Error Rate",
        type: "stat",
        value: metrics.errorRate * 100,
        trend: -2.1,
        status: metrics.errorRate > 0.05 ? "warning" : "good"
      },
      {
        title: "Avg Latency",
        type: "gauge",
        value: metrics.avgLatency,
        status: metrics.avgLatency > 200 ? "critical" : metrics.avgLatency > 150 ? "warning" : "good"
      },
      {
        title: "Consumer Lag",
        type: "gauge",
        value: metrics.consumerLag,
        status: metrics.consumerLag > 1000 ? "critical" : metrics.consumerLag > 500 ? "warning" : "good"
      }
    ],
    "System Health": [
      {
        title: "CPU Usage",
        type: "gauge",
        value: metrics.cpuUsage,
        status: metrics.cpuUsage > 80 ? "critical" : metrics.cpuUsage > 70 ? "warning" : "good"
      },
      {
        title: "Memory Usage",
        type: "gauge",
        value: metrics.memoryUsage,
        status: metrics.memoryUsage > 80 ? "critical" : metrics.memoryUsage > 70 ? "warning" : "good"
      },
      {
        title: "Active Connections",
        type: "stat",
        value: 234,
        trend: 12,
        status: "good"
      },
      {
        title: "Uptime",
        type: "stat",
        value: 99.99,
        status: "good"
      }
    ],
    "Business Metrics": [
      {
        title: "Total Revenue",
        type: "stat",
        value: metrics.totalRevenue,
        trend: 8.5,
        status: "good"
      },
      {
        title: "Success Rate",
        type: "stat",
        value: metrics.successRate,
        trend: 0.5,
        status: metrics.successRate < 98 ? "warning" : "good"
      },
      {
        title: "Avg Transaction",
        type: "stat",
        value: 156.78,
        trend: 3.2,
        status: "good"
      },
      {
        title: "Merchants Active",
        type: "stat",
        value: 1234,
        trend: 45,
        status: "good"
      }
    ]
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderPanel = (panel: DashboardPanel) => {
    switch (panel.type) {
      case 'stat':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">{panel.title}</h4>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">
                {typeof panel.value === 'number' ? 
                  panel.title.includes('Revenue') ? `$${panel.value.toFixed(0)}` :
                  panel.title.includes('Rate') ? `${panel.value.toFixed(2)}%` :
                  panel.value.toFixed(0)
                : panel.value}
              </p>
              {panel.trend && (
                <div className={`flex items-center text-sm ${panel.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${panel.trend < 0 ? 'transform rotate-180' : ''}`} />
                  {Math.abs(panel.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <div className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(panel.status)}`}>
              {panel.status === 'good' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
               panel.status === 'warning' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
               <AlertTriangle className="w-3 h-3 mr-1" />}
              {panel.status?.toUpperCase()}
            </div>
          </div>
        );
      
      case 'gauge':
        const percentage = Math.min(100, (panel.value || 0));
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-4">{panel.title}</h4>
            <div className="relative h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold">{panel.value?.toFixed(0)}</p>
                  <p className="text-sm text-gray-500">
                    {panel.title.includes('Latency') ? 'ms' : 
                     panel.title.includes('Lag') ? 'messages' : '%'}
                  </p>
                </div>
              </div>
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={panel.status === 'critical' ? '#dc2626' : panel.status === 'warning' ? '#f59e0b' : '#10b981'}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${percentage * 3.52} 352`}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold mb-2">Grafana Dashboard Demo</h3>
        <p className="text-gray-600">
          {showRealTimeData ? "Real-time metrics simulation" : "Static dashboard view"}
        </p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {dashboards.map((dashboard) => (
          <button
            key={dashboard}
            onClick={() => setActiveDashboard(dashboard)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDashboard === dashboard 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {dashboard}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {dashboardPanels[activeDashboard]?.map((panel, idx) => (
          <div key={idx}>
            {renderPanel(panel)}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900">Dashboard Features</p>
            <p className="text-sm text-blue-700 mt-1">
              • Click and drag to zoom • Double-click to reset • Set custom alerts on any metric • Export data as CSV
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrafanaDashboardDemo;