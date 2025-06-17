#!/usr/bin/env python3
"""
Default Partitioner Analysis Solution - Lab 04
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer
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
    """Callback to track partition assignment"""
    global partition_tracker
    if err is not None:
        print(f'Delivery failed: {err}')
    else:
        partition_tracker.append({
            'partition': msg.partition(),
            'offset': msg.offset(),
            'topic': msg.topic()
        })

def create_producer(schema):
    """Create producer configuration"""
    # Use prefixed configuration approach that works
    producer_config = KafkaConfig.create_avro_producer_config()
    
    # Combine configurations with schema.registry. prefix
    config = {
        **producer_config,
        'schema.registry.url': os.getenv('SCHEMA_REGISTRY_URL'),
        'schema.registry.basic.auth.credentials.source': 'USER_INFO',
        'schema.registry.basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}",
        'on_delivery': delivery_report
    }
    
    # For keys, we'll use string schema
    key_schema = avro.loads('{"type": "string"}')
    
    return AvroProducer(
        config, 
        default_key_schema=key_schema,
        default_value_schema=schema
    )

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
    """Send messages without key"""
    global partition_tracker
    print("\n=== Sending WITHOUT key (round-robin) ===")
    
    # Clear the tracker
    partition_tracker = []
    
    for i in range(num_messages):
        payment = generate_payment()
        
        # Produce without key
        producer.produce(
            topic='payment_requests',
            value=payment
        )
        producer.poll(0)  # Trigger delivery callbacks
        
        time.sleep(0.1)
    
    producer.flush()
    
    # Analyze partition distribution from delivery callbacks
    partition_counts = {}
    for j, msg_info in enumerate(partition_tracker):
        partition = msg_info['partition']
        partition_counts[partition] = partition_counts.get(partition, 0) + 1
        print(f"Payment {j+1} → Partition {partition}")
    
    print("\nPartition distribution:", dict(sorted(partition_counts.items())))
    print("Notice: Round-robin distribution across all partitions")

def send_with_key(producer, num_messages=20):
    """Send messages with customer_id as key"""
    global partition_tracker
    print("\n=== Sending WITH key (hash-based) ===")
    
    # Clear the tracker and store customer info
    partition_tracker = []
    customer_payments = []
    
    for i in range(num_messages):
        payment = generate_payment()
        customer_id = payment['customer_id']
        customer_payments.append(customer_id)
        
        # Produce with customer_id as key
        producer.produce(
            topic='payment_requests',
            key=customer_id,
            value=payment
        )
        producer.poll(0)  # Trigger delivery callbacks
        time.sleep(0.1)
    
    producer.flush()
    
    # Analyze partition distribution from delivery callbacks
    partition_counts = {}
    customer_partitions = {}
    for j, msg_info in enumerate(partition_tracker):
        if j < len(customer_payments):
            partition = msg_info['partition']
            customer_id = customer_payments[j]
            partition_counts[partition] = partition_counts.get(partition, 0) + 1
            customer_partitions[customer_id] = partition
            print(f"Payment {j+1} ({customer_id}) → Partition {partition}")
    
    print("\nPartition distribution:", dict(sorted(partition_counts.items())))
    print("\nSample customer → partition mapping:")
    for customer, partition in list(customer_partitions.items())[:5]:
        print(f"  {customer} → Partition {partition}")
    
    print("\nNotice: Same customer ALWAYS goes to same partition (ordering guarantee!)")

def main():
    """Main function"""
    print("Default Partitioner Analysis")
    print("=" * 50)
    
    # Load schema
    schema = load_avro_schema('../schemas/payment.avsc')
    
    # Create producer
    producer = create_producer(schema)
    
    try:
        # Test without key (round-robin)
        send_without_key(producer, num_messages=18)  # 3 per partition for 6 partitions
        
        input("\nPress Enter to continue with key-based partitioning...")
        
        # Test with key (hash-based)
        send_with_key(producer, num_messages=20)
        
    except KeyboardInterrupt:
        print("\nInterrupted")
    finally:
        producer.flush()
        print("\nProducer closed")

if __name__ == "__main__":
    main()