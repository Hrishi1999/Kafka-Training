#!/usr/bin/env python3
"""
Partition Reporter - Lab 04
Utility to monitor message distribution across partitions
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
import signal

class PartitionReporter:
    def __init__(self):
        self.partition_counts = {}
        self.running = True
        
    def signal_handler(self, sig, frame):
        print('\nShutting down...')
        self.running = False
        
    def run(self):
        """
        TODO: Implement partition monitoring
        - Create consumer for 'payments-partitioned'
        - Track messages per partition
        - Display live statistics
        """
        signal.signal(signal.SIGINT, self.signal_handler)
        
        consumer_config = KafkaConfig.create_consumer_config(
            group_id='partition-reporter',
            auto_offset_reset='latest'
        )
        
        # Your implementation here
        
        print("\nFinal partition distribution:")
        for partition, count in sorted(self.partition_counts.items()):
            print(f"  Partition {partition}: {count} messages")

if __name__ == "__main__":
    reporter = PartitionReporter()
    reporter.run()