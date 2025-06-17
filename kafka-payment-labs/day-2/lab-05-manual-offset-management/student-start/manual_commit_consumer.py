#!/usr/bin/env python3
"""
Manual Commit Consumer - Lab 05
Your task: Implement reliable message processing with manual commits
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

class ManualCommitConsumer:
    def __init__(self):
        self.running = True
        self.processed_count = 0
        
    def signal_handler(self, sig, frame):
        print('\nGracefully shutting down...')
        self.running = False
        
    def create_consumer(self):
        """
        TODO: Create consumer with manual commit
        - Use separate Kafka and Schema Registry configurations
        - Set enable.auto.commit=False
        - Set group.id='payment-processor-manual'
        - Set auto.offset.reset='earliest'
        
        Example pattern:
        consumer_config = KafkaConfig.create_avro_consumer_config(group_id='payment-processor-manual', enable_auto_commit=False)
        schema_registry_config = KafkaConfig.create_schema_registry_config()
        schema_registry_client = SchemaRegistryClient(schema_registry_config)
        return AvroConsumer(consumer_config, schema_registry=schema_registry_client)
        """
        pass
    
    def process_payment(self, message):
        """
        TODO: Process payment reliably
        - Extract payment data
        - Simulate processing (sleep 2 seconds)
        - Return True if successful
        - Handle any exceptions
        """
        pass
    
    def run(self, crash_after=None):
        """
        TODO: Main consumer loop with manual commits
        - Create consumer
        - Subscribe to 'payments-avro' topic
        - For each message:
          1. Process the payment
          2. Only commit if processing succeeds
          3. Handle commit errors
        - Allow crash simulation if crash_after is set
        """
        signal.signal(signal.SIGINT, self.signal_handler)
        print("Starting manual commit consumer")
        print("Press Ctrl+C for graceful shutdown")
        print("-" * 50)
        
        # Your implementation here

def main():
    """
    Test scenarios:
    1. Normal operation (no crash)
    2. Crash after N messages to test recovery
    """
    import sys
    
    # Optional: crash after N messages for testing
    crash_after = int(sys.argv[1]) if len(sys.argv) > 1 else None
    
    consumer = ManualCommitConsumer()
    consumer.run(crash_after=crash_after)

if __name__ == "__main__":
    main()