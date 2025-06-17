#!/usr/bin/env python3
"""
Auto-Commit Consumer - Lab 05
Your task: Prove that auto-commit can lose messages
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
from confluent_kafka.avro import AvroConsumer
from confluent_kafka.schema_registry import SchemaRegistryClient
import time
import signal

class AutoCommitConsumer:
    def __init__(self):
        self.running = True
        self.processed_count = 0
        
    def create_consumer(self):
        """
        TODO: Create consumer with auto-commit enabled
        - Use separate Kafka and Schema Registry configurations
        - Set enable.auto.commit=True
        - Set auto.commit.interval.ms=5000 (5 seconds)
        - Set group.id='payment-processor-auto'
        - Set auto.offset.reset='earliest'
        
        Example pattern:
        consumer_config = KafkaConfig.create_avro_consumer_config(group_id='payment-processor-auto', enable_auto_commit=True)
        schema_registry_config = KafkaConfig.create_schema_registry_config()
        schema_registry_client = SchemaRegistryClient(schema_registry_config)
        return AvroConsumer(consumer_config, schema_registry=schema_registry_client)
        """
        pass
    
    def simulate_processing(self, message, sleep_time=2):
        """
        TODO: Simulate payment processing
        - Print payment details
        - Sleep for specified time (simulating work)
        - Crash after processing with sys.exit(1)
        """
        pass
    
    def run(self, sleep_time=2):
        """
        TODO: Main consumer loop
        - Create consumer
        - Subscribe to 'payment_requests' topic
        - Poll for messages
        - For each message, simulate processing
        - Handle errors appropriately
        """
        print(f"Starting auto-commit consumer (sleep={sleep_time}s)")
        print("This will crash after processing first message...")
        print("-" * 50)
        
        # Your implementation here

def main():
    """
    Run two experiments:
    1. With 2-second sleep (less than auto-commit interval)
    2. With 7-second sleep (more than auto-commit interval)
    """
    import sys
    
    # Get sleep time from command line or default
    sleep_time = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    
    consumer = AutoCommitConsumer()
    consumer.run(sleep_time=sleep_time)

if __name__ == "__main__":
    main()