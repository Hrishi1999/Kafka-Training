import React, { Suspense, lazy } from 'react';
import { InteractiveSlideContent } from '../../types/slides';
import { Loader2 } from 'lucide-react';

interface InteractiveSlideProps {
  content: InteractiveSlideContent;
}

// Dynamically import interactive components
const componentMap: Record<string, React.LazyExoticComponent<React.FC<any>>> = {
  // Day 1 Components
  SystemArchitecture: lazy(() => import('../interactive/SystemArchitecture')),
  ConfluentCloudDemo: lazy(() => import('../interactive/ConfluentCloudDemo')),
  ProjectStructure: lazy(() => import('../interactive/ProjectStructure')),
  InfrastructureStatus: lazy(() => import('../interactive/InfrastructureStatus')),
  KafkaArchitecture: lazy(() => import('../interactive/KafkaArchitecture')),
  TopicVisualization: lazy(() => import('../interactive/TopicVisualization')),
  ConsumerGroupDemo: lazy(() => import('../interactive/ConsumerGroupDemo')),
  ConfluentUITour: lazy(() => import('../interactive/ConfluentUITour')),
  MetricsDashboard: lazy(() => import('../interactive/MetricsDashboard')),
  RealTimeMetrics: lazy(() => import('../interactive/RealTimeMetrics')),
  ProducerFlow: lazy(() => import('../interactive/ProducerFlow')),
  ProducerPerformance: lazy(() => import('../interactive/ProducerPerformance')),
  ProducerMetrics: lazy(() => import('../interactive/ProducerMetrics')),
  PaymentGatewayTester: lazy(() => import('../interactive/PaymentGatewayTester')),
  ConsumerGroupCoordination: lazy(() => import('../interactive/ConsumerGroupCoordination')),
  ConsumerMetrics: lazy(() => import('../interactive/ConsumerMetrics')),
  MultiConsumerDemo: lazy(() => import('../interactive/MultiConsumerDemo')),
  PartitioningDemo: lazy(() => import('../interactive/PartitioningDemo')),
  OrderingDemo: lazy(() => import('../interactive/OrderingDemo')),
  PartitionMonitoring: lazy(() => import('../interactive/PartitionMonitoring')),
  PartitionTestResults: lazy(() => import('../interactive/PartitionTestResults')),
  
  // Day 2 Components
  Day1ToDay2Evolution: lazy(() => import('../interactive/Day1ToDay2Evolution')),
  JSONChaosDemo: lazy(() => import('../interactive/JSONChaosDemo')),
  SchemaRegistryArchitecture: lazy(() => import('../interactive/SchemaRegistryArchitecture')),
  FastAPIArchitecture: lazy(() => import('../interactive/FastAPIArchitecture')),
  FastAPILoadTest: lazy(() => import('../interactive/FastAPILoadTest')),
  AutoCommitFailure: lazy(() => import('../interactive/AutoCommitFailure')),
  BlockingAntiPattern: lazy(() => import('../interactive/BlockingAntiPattern')),
  RetryTopicArchitecture: lazy(() => import('../interactive/RetryTopicArchitecture')),
  ResilienceMonitoring: lazy(() => import('../interactive/ResilienceMonitoring')),
  
  // Day 3 Components
  ACLSecurityArchitecture: lazy(() => import('../interactive/ACLSecurityArchitecture')),
  TransactionProblemDemo: lazy(() => import('../interactive/TransactionProblemDemo')),
  TransactionCoordinatorFlow: lazy(() => import('../interactive/TransactionCoordinatorFlow')),
  MonitoringArchitecture: lazy(() => import('../interactive/MonitoringArchitecture')),
  GrafanaDashboardDemo: lazy(() => import('../interactive/GrafanaDashboardDemo')),
  SchemaEvolutionDemo: lazy(() => import('../interactive/SchemaEvolutionDemo')),
  KafkaConnectArchitecture: lazy(() => import('../interactive/KafkaConnectArchitecture')),
  FinalArchitectureOverview: lazy(() => import('../interactive/FinalArchitectureOverview')),
};

export const InteractiveSlide: React.FC<InteractiveSlideProps> = ({ content }) => {
  const Component = componentMap[content.component];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Interactive component "{content.component}" not found</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <Component {...(content.props || {})} />
    </Suspense>
  );
};