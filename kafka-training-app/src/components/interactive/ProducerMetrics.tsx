import React from 'react';
import MetricsDashboard from './MetricsDashboard';

const ProducerMetrics: React.FC = () => {
  const producerMetrics = [
    { name: 'Record Send Rate', value: '15.2K/sec', trend: 'up' as const, critical: false },
    { name: 'Batch Size Avg', value: '32KB', trend: 'stable' as const, critical: false },
    { name: 'Request Latency', value: '4.2ms', trend: 'down' as const, critical: false },
    { name: 'Buffer Available', value: '89%', trend: 'up' as const, critical: false },
    { name: 'Error Rate', value: '0.02%', trend: 'stable' as const, critical: false },
    { name: 'Retry Rate', value: '0.1%', trend: 'down' as const, critical: false }
  ];

  return <MetricsDashboard metrics={producerMetrics} />;
};

export default ProducerMetrics;