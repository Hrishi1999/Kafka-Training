import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  critical: boolean;
}

interface MetricsDashboardProps {
  metrics: Metric[];
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`
            p-4 rounded-lg border transition-all hover:scale-105
            ${metric.critical 
              ? 'bg-red-50 border-red-300' 
              : 'bg-white border-gray-200'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">{metric.name}</h4>
            {getTrendIcon(metric.trend)}
          </div>
          <div className={`text-2xl font-bold ${getTrendColor(metric.trend)}`}>
            {metric.value}
          </div>
          {metric.critical && (
            <div className="mt-2 text-xs text-red-600">
              ⚠️ Requires attention
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default MetricsDashboard;