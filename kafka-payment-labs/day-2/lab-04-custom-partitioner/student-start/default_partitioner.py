#!/usr/bin/env python3
"""
Default Partitioner Analysis - Lab 04
Your task: Understand default partitioning behavior
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer
# Note: Using prefixed configuration instead of separate SchemaRegistryClient
import json
import uuid
import random
import time
from datetime import datetime

# Global variable to track partition assignments
partition_tracker = []

def load_avro_schema(schema_path):
    """Load Avro schema from file"""
    with open(schema_path, 'r') as f:
        return avro.loads(json.dumps(json.load(f)))

def delivery_report(err, msg):
    """Callback for message delivery status"""
    global partition_tracker
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        partition_tracker.append({
            'partition': msg.partition(),
            'offset': msg.offset(),
            'topic': msg.topic()
        })

def create_producer(schema, use_key=False):
    """
    TODO: Create producer configuration
    - Use separate Kafka and Schema Registry configurations
    - No custom partitioner (use default)
    
    Example pattern:
    producer_config = KafkaConfig.create_avro_producer_config()
    schema_registry_config = KafkaConfig.create_schema_registry_config()
    schema_registry_client = SchemaRegistryClient(schema_registry_config)
    return AvroProducer(producer_config, schema_registry=schema_registry_client, default_value_schema=schema)
    """
    pass

def generate_payment():
    """Generate payment with different customer types"""
    customer_type = random.choice(['VIP', 'REGULAR'])
    if customer_type == 'VIP':
        customer_id = f'CUST-1{random.randint(100, 199)}'
    else:
        customer_id = f'CUST-{random.randint(2000, 9999)}'
    
    return {
        'payment_id': str(uuid.uuid4()),
        'amount': round(random.uniform(10.00, 1000.00), 2),
        'currency': random.choice(['USD', 'EUR', 'GBP']),
        'customer_id': customer_id,
        'timestamp': int(datetime.now().timestamp())
    }

def send_without_key(producer, num_messages=20):
    """
    TODO: Send messages without key
    - Use producer.produce with topic and value only
    - Track which partition each message goes to
    """
    print("\n=== Sending WITHOUT key (round-robin) ===")
    partition_counts = {}
    
    # Your implementation here
    
    print("\nPartition distribution:", partition_counts)

def send_with_key(producer, num_messages=20):
    """
    TODO: Send messages with customer_id as key
    - Use producer.produce with key parameter
    - Track partition distribution
    - Track same customer → same partition
    """
    print("\n=== Sending WITH key (hash-based) ===")
    partition_counts = {}
    customer_partitions = {}
    
    # Your implementation here
    
    print("\nPartition distribution:", partition_counts)
    print("\nSample customer → partition mapping:")
    for customer, partition in list(customer_partitions.items())[:5]:
        print(f"  {customer} → Partition {partition}")

def main():
    """
    TODO: Main function to:
    1. Load schema
    2. Create producer
    3. Test without key (round-robin)
    4. Test with key (hash-based)
    5. Analyze results
    """
    print("Default Partitioner Analysis")
    
    # Your implementation here

if __name__ == "__main__":
    main()