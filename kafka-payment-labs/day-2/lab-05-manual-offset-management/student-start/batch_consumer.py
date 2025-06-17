#!/usr/bin/env python3
"""
Batch Processing Consumer - Lab 05
Your task: Implement batch processing with manual commits
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError, TopicPartition
from confluent_kafka.avro import AvroConsumer
from confluent_kafka.schema_registry import SchemaRegistryClient
import time
import signal

class BatchConsumer:
    def __init__(self, batch_size=5):
        self.batch_size = batch_size
        self.running = True
        self.current_batch = []
        
    def create_consumer(self):
        """
        TODO: Create consumer for batch processing
        - Use separate Kafka and Schema Registry configurations
        - Manual commit enabled
        - Store offset after processing
        
        Example pattern:
        consumer_config = KafkaConfig.create_avro_consumer_config(group_id='payment-processor-batch', enable_auto_commit=False)
        schema_registry_config = KafkaConfig.create_schema_registry_config()
        schema_registry_client = SchemaRegistryClient(schema_registry_config)
        return AvroConsumer(consumer_config, schema_registry=schema_registry_client)
        """
        pass
    
    def process_batch(self, messages):
        """
        TODO: Process a batch of messages
        - Validate all messages
        - Simulate batch processing
        - Return True only if ALL succeed
        - Consider: what if one message fails?
        """
        pass
    
    def get_batch_offsets(self, messages):
        """
        TODO: Get the offsets to commit for a batch
        - Need to commit the NEXT offset after the batch
        - Group by topic-partition
        - Return list of TopicPartition objects
        """
        pass
    
    def run(self):
        """
        TODO: Batch processing loop
        - Accumulate messages until batch_size
        - Process entire batch
        - Commit only if batch succeeds
        - Handle partial batches on shutdown
        """
        print(f"Starting batch consumer (batch_size={self.batch_size})")
        print("-" * 50)
        
        # Your implementation here

def main():
    # Test with different batch sizes
    import sys
    batch_size = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    
    consumer = BatchConsumer(batch_size=batch_size)
    consumer.run()

if __name__ == "__main__":
    main()