#!/usr/bin/env python3
"""
Custom Partitioner Implementation - Lab 04
Your task: Implement a custom partitioner for VIP customer routing
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
import hashlib

def load_avro_schema(schema_path):
    """Load Avro schema from file"""
    with open(schema_path, 'r') as f:
        return avro.loads(json.dumps(json.load(f)))

def delivery_report(err, msg):
    """Callback for message delivery status"""
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        print(f'Message delivered to partition {msg.partition()}')

def vip_partitioner(key, all_partitions, available_partitions):
    """
    TODO: Implement custom partitioner
    Rules:
    - VIP customers (CUST-1XXX) go to partition 0
    - Regular customers use hash-based distribution
    - Handle None key gracefully
    
    Args:
        key: Message key (bytes or None)
        all_partitions: List of all partition IDs
        available_partitions: List of available partition IDs
    
    Returns:
        Partition number (int)
    """
    pass

def create_producer_with_custom_partitioner(schema):
    """
    TODO: Create producer configuration
    NOTE: Cannot pass custom partitioner function to AvroProducer config.
    Instead, manually calculate partition using vip_partitioner() and pass to produce() call.
    
    Example pattern:
    producer_config = KafkaConfig.create_avro_producer_config()
    config = {
        **producer_config,
        'schema.registry.url': os.getenv('SCHEMA_REGISTRY_URL'),
        'schema.registry.basic.auth.credentials.source': 'USER_INFO',
        'schema.registry.basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}",
        'on_delivery': delivery_report
    }
    key_schema = avro.loads('{"type": "string"}')
    return AvroProducer(config, default_key_schema=key_schema, default_value_schema=schema)
    """
    pass

def generate_payment(force_vip=False):
    """Generate payment with VIP bias if requested"""
    if force_vip or random.random() < 0.3:  # 30% VIP
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

def test_custom_partitioner(producer, num_messages=50):
    """
    TODO: Test your custom partitioner
    - Send mix of VIP and regular customers
    - Track partition distribution
    - Verify VIPs go to partition 0
    """
    print("\n=== Testing Custom Partitioner ===")
    partition_counts = {}
    vip_partition_counts = {}
    
    # Your implementation here
    
    print("\nOverall partition distribution:", partition_counts)
    print("VIP customer partition distribution:", vip_partition_counts)

def simulate_hot_partition(producer):
    """
    TODO: Simulate hot partition problem
    - Send 90% VIP, 10% regular customers
    - Observe partition 0 overload
    - Discuss implications
    """
    print("\n=== Simulating Hot Partition ===")
    
    # Your implementation here

def main():
    """
    TODO: Main function to:
    1. Load schema
    2. Create producer with custom partitioner
    3. Test balanced load
    4. Test hot partition scenario
    5. Analyze results
    """
    print("Custom Partitioner Implementation")
    
    # Your implementation here

if __name__ == "__main__":
    main()