#!/usr/bin/env python3
"""
Custom Partitioner Implementation Solution - Lab 04
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
    Custom partitioner for VIP customer routing
    
    Rules:
    - VIP customers (CUST-1XXX) go to partition 0
    - Regular customers use hash-based distribution
    - Handle None key gracefully
    """
    # Use available_partitions to be resilient to partition availability
    partitions = available_partitions if available_partitions else all_partitions
    
    # Handle null key - random partition
    if key is None:
        return random.choice(partitions)
    
    # Decode key if it's bytes
    if isinstance(key, bytes):
        key_str = key.decode('utf-8')
    else:
        key_str = str(key)
    
    # Check if VIP customer
    if key_str.startswith('CUST-1') and len(key_str) == 9:
        # VIP goes to partition 0 if available
        if 0 in partitions:
            return 0
        else:
            # Fallback if partition 0 not available
            print(f"Warning: Partition 0 not available for VIP {key_str}")
            return partitions[0]
    
    # Regular customers - hash-based distribution
    # Use only non-zero partitions to avoid VIP partition
    non_vip_partitions = [p for p in partitions if p != 0]
    if not non_vip_partitions:
        non_vip_partitions = partitions  # Fallback if only partition 0 exists
    
    # Hash the key for consistent routing
    hash_value = int(hashlib.md5(key_str.encode()).hexdigest(), 16)
    return non_vip_partitions[hash_value % len(non_vip_partitions)]

def create_producer_with_custom_partitioner(schema):
    """Create producer with custom partitioner"""
    # Get base producer config
    producer_config = KafkaConfig.create_avro_producer_config()
    
    # Add prefixed Schema Registry configuration (no custom partitioner in config)
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
    """Test custom partitioner"""
    print("\n=== Testing Custom Partitioner ===")
    partition_counts = {}
    vip_partition_counts = {}
    regular_partition_counts = {}
    
    vip_count = 0
    regular_count = 0
    
    for i in range(num_messages):
        payment = generate_payment()
        customer_id = payment['customer_id']
        is_vip = customer_id.startswith('CUST-1')
        
        # Calculate partition using our VIP logic
        partition = vip_partitioner(customer_id.encode('utf-8'), list(range(6)), None)  # 6 partitions
        
        # Produce with customer_id as key and explicit partition
        producer.produce(
            topic='payment_requests',
            key=customer_id,
            value=payment,
            partition=partition
        )
        producer.poll(0)  # Trigger delivery callbacks
        
        # Track overall distribution
        partition_counts[partition] = partition_counts.get(partition, 0) + 1
        
        # Track VIP vs regular distribution
        if is_vip:
            vip_count += 1
            vip_partition_counts[partition] = vip_partition_counts.get(partition, 0) + 1
            print(f"VIP Payment {customer_id} → Partition {partition}")
        else:
            regular_count += 1
            regular_partition_counts[partition] = regular_partition_counts.get(partition, 0) + 1
            print(f"Regular Payment {customer_id} → Partition {partition}")
        
        time.sleep(0.05)
    
    producer.flush()
    
    print(f"\nTotal messages: {num_messages} (VIP: {vip_count}, Regular: {regular_count})")
    print("\nOverall partition distribution:", dict(sorted(partition_counts.items())))
    print("VIP customer partition distribution:", dict(sorted(vip_partition_counts.items())))
    print("Regular customer partition distribution:", dict(sorted(regular_partition_counts.items())))
    
    # Verify VIP routing
    if 0 in vip_partition_counts and vip_partition_counts.get(0, 0) == vip_count:
        print("\n✓ SUCCESS: All VIP customers routed to partition 0")
    else:
        print("\n✗ ERROR: VIP customers not properly routed to partition 0")

def simulate_hot_partition(producer):
    """Simulate hot partition problem"""
    print("\n=== Simulating Hot Partition (90% VIP traffic) ===")
    
    partition_counts = {}
    total_vip = 0
    
    for i in range(100):
        # 90% chance of VIP
        is_vip = random.random() < 0.9
        payment = generate_payment(force_vip=is_vip)
        customer_id = payment['customer_id']
        
        if customer_id.startswith('CUST-1'):
            total_vip += 1
        
        # Calculate partition using our VIP logic
        partition = vip_partitioner(customer_id.encode('utf-8'), list(range(6)), None)  # 6 partitions
        
        # Produce with explicit partition
        producer.produce(
            topic='payment_requests',
            key=customer_id,
            value=payment,
            partition=partition
        )
        producer.poll(0)  # Trigger delivery callbacks
        
        # Track partition
        partition_counts[partition] = partition_counts.get(partition, 0) + 1
        
        if (i + 1) % 20 == 0:
            print(f"Sent {i + 1} messages...")
    
    producer.flush()
    
    print(f"\nTotal VIP customers: {total_vip}/100")
    print("Partition distribution:", dict(sorted(partition_counts.items())))
    
    # Calculate load imbalance
    max_load = max(partition_counts.values())
    avg_load = sum(partition_counts.values()) / len(partition_counts)
    imbalance = (max_load / avg_load - 1) * 100
    
    print(f"\nLoad imbalance: {imbalance:.1f}% (partition 0 has {max_load} messages)")
    print("\n⚠️  WARNING: Partition 0 is a HOT PARTITION!")
    print("This causes:")
    print("- Uneven load distribution")
    print("- Consumer lag on partition 0")
    print("- Potential throughput bottleneck")
    print("- Inefficient resource utilization")

def suggest_better_strategies():
    """Suggest better partitioning strategies"""
    print("\n=== Better Partitioning Strategies ===")
    print("\n1. Avoid Business Logic in Partitioner:")
    print("   - Use customer_id as key for ordering")
    print("   - Let default hash partitioner distribute evenly")
    print("\n2. If VIP Priority Needed:")
    print("   - Use separate topics (payments-vip, payments-regular)")
    print("   - Different consumer groups with different SLAs")
    print("\n3. For Geographic Distribution:")
    print("   - Partition by region, not customer type")
    print("   - Ensures even distribution if regions are balanced")
    print("\n4. Time-based Partitioning:")
    print("   - Only for time-series data")
    print("   - Careful with time skew")

def main():
    """Main function"""
    print("Custom Partitioner Implementation")
    print("=" * 50)
    
    # Load schema
    schema = load_avro_schema('../schemas/payment.avsc')
    
    # Create producer with custom partitioner
    producer = create_producer_with_custom_partitioner(schema)
    
    try:
        # Test balanced load
        test_custom_partitioner(producer, num_messages=50)
        
        input("\nPress Enter to simulate hot partition problem...")
        
        # Test hot partition scenario
        simulate_hot_partition(producer)
        
        # Suggest better strategies
        suggest_better_strategies()
        
    except KeyboardInterrupt:
        print("\nInterrupted")
    finally:
        producer.flush()
        print("\nProducer closed")

if __name__ == "__main__":
    main()