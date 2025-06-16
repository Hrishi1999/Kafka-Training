import React from 'react';
import ConsumerGroupCoordination from './ConsumerGroupCoordination';

const MultiConsumerDemo: React.FC = () => {
  const initialConsumers = [
    { id: 'payment-consumer-1', partitions: [0, 1] },
    { id: 'payment-consumer-2', partitions: [2, 3] },
    { id: 'payment-consumer-3', partitions: [4, 5] }
  ];

  return (
    <ConsumerGroupCoordination 
      consumers={initialConsumers}
      groupProtocol="cooperative-sticky"
      showRebalancing={true}
      showPartitionAssignment={true}
    />
  );
};

export default MultiConsumerDemo;