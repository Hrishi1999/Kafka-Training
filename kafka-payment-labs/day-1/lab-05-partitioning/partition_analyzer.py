#!/usr/bin/env python3
"""
Partition Analyzer - Shows how messages without keys are distributed
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Producer, Consumer
from common.config import KafkaConfig
import json
import time
import uuid
from datetime import datetime


class PartitionAnalyzer:
    """Analyzes partition distribution for different message types"""
    
    def __init__(self):
        # Producer for sending test messages
        producer_config = KafkaConfig.create_producer_config()
        self.producer = Producer(producer_config)
        
        # Consumer for reading messages
        consumer_config = KafkaConfig.create_consumer_config(
            group_id='partition-analyzer',
            auto_offset_reset='earliest'
        )
        self.consumer = Consumer(consumer_config)
        
        self.topic = 'payment_requests'
        
        # Track partition distribution
        self.partition_stats = {
            'no_key': {},
            'with_key': {}
        }
    
    def delivery_callback(self, message_type):
        """Create a callback function for tracking deliveries"""
        def callback(err, msg):
            if err is not None:
                print(f"❌ Delivery failed: {err}")
            else:
                partition = msg.partition()
                self.partition_stats[message_type][partition] = \
                    self.partition_stats[message_type].get(partition, 0) + 1
                print(f"📨 {message_type}: Message → Partition {partition}")
        return callback
    
    def send_messages_without_keys(self, count=20):
        """Send messages without keys (round-robin distribution)"""
        print(f"\n🎯 Sending {count} messages WITHOUT keys (round-robin)")
        print("-" * 50)
        
        for i in range(count):
            payment = {
                'payment_id': str(uuid.uuid4()),
                'customer_id': f'CUST{i % 5:04d}',  # Rotating customers
                'amount': 100.0 + i,
                'currency': 'USD',
                'timestamp': datetime.utcnow().isoformat(),
                'message_number': i
            }
            
            # Send WITHOUT key
            self.producer.produce(
                topic=self.topic,
                value=json.dumps(payment).encode('utf-8'),
                callback=self.delivery_callback('no_key')
            )
            
            self.producer.poll(0)
            time.sleep(0.1)
        
        self.producer.flush()
    
    def send_messages_with_keys(self, count=20):
        """Send messages with customer ID keys"""
        print(f"\n🔑 Sending {count} messages WITH keys (hash-based)")
        print("-" * 50)
        
        for i in range(count):
            customer_id = f'CUST{i % 5:04d}'  # Same customers as before
            
            payment = {
                'payment_id': str(uuid.uuid4()),
                'customer_id': customer_id,
                'amount': 200.0 + i,
                'currency': 'USD',
                'timestamp': datetime.utcnow().isoformat(),
                'message_number': i
            }
            
            # Send WITH customer ID as key
            self.producer.produce(
                topic=self.topic,
                key=customer_id.encode('utf-8'),
                value=json.dumps(payment).encode('utf-8'),
                callback=self.delivery_callback('with_key')
            )
            
            self.producer.poll(0)
            time.sleep(0.1)
        
        self.producer.flush()
    
    def analyze_distribution(self):
        """Analyze and display partition distribution"""
        print("\n📊 Partition Distribution Analysis")
        print("=" * 60)
        
        # Messages without keys
        no_key_total = sum(self.partition_stats['no_key'].values())
        if no_key_total > 0:
            print(f"\n🎲 Messages WITHOUT Keys ({no_key_total} total):")
            print("   Expected: Even distribution (round-robin)")
            
            for partition in sorted(self.partition_stats['no_key'].keys()):
                count = self.partition_stats['no_key'][partition]
                percentage = (count / no_key_total) * 100
                bar = '█' * int(percentage / 3)
                print(f"   Partition {partition}: {bar} {count} ({percentage:.1f}%)")
        
        # Messages with keys
        with_key_total = sum(self.partition_stats['with_key'].values())
        if with_key_total > 0:
            print(f"\n🔑 Messages WITH Keys ({with_key_total} total):")
            print("   Expected: Hash-based distribution")
            
            for partition in sorted(self.partition_stats['with_key'].keys()):
                count = self.partition_stats['with_key'][partition]
                percentage = (count / with_key_total) * 100
                bar = '█' * int(percentage / 3)
                print(f"   Partition {partition}: {bar} {count} ({percentage:.1f}%)")
        
        self.compare_strategies()
    
    def compare_strategies(self):
        """Compare the two partitioning strategies"""
        print("\n🔍 Strategy Comparison")
        print("=" * 60)
        
        print("📈 Round-Robin (No Keys):")
        print("   ✅ Pros: Even load distribution")
        print("   ❌ Cons: No ordering guarantees")
        print("   🎯 Use case: High throughput, order not important")
        
        print("\n🔑 Hash-Based (With Keys):")
        print("   ✅ Pros: Ordering within key, related data grouped")
        print("   ❌ Cons: Potential hot partitions")
        print("   🎯 Use case: Ordered processing per entity")
        
        # Calculate distribution evenness
        def calculate_evenness(stats):
            if not stats:
                return 0
            total = sum(stats.values())
            expected_per_partition = total / len(stats)
            variance = sum((count - expected_per_partition) ** 2 for count in stats.values())
            return 100 - (variance / total)  # Simple evenness metric
        
        no_key_evenness = calculate_evenness(self.partition_stats['no_key'])
        with_key_evenness = calculate_evenness(self.partition_stats['with_key'])
        
        print(f"\n📊 Distribution Evenness:")
        print(f"   Round-Robin: {no_key_evenness:.1f}%")
        print(f"   Hash-Based:  {with_key_evenness:.1f}%")
    
    def run_analysis(self):
        """Run the complete partition analysis"""
        print("🔬 Kafka Partition Distribution Analysis")
        print("=" * 60)
        print("This tool demonstrates how Kafka assigns messages to partitions")
        print("with and without message keys.")
        
        # Send test messages
        self.send_messages_without_keys(20)
        time.sleep(1)
        self.send_messages_with_keys(20)
        time.sleep(2)
        
        # Analyze results
        self.analyze_distribution()
        
        print("\n💡 Key Insights:")
        print("1. Without keys: Messages distributed evenly (round-robin)")
        print("2. With keys: Same key always goes to same partition")
        print("3. Key choice affects load balancing")
        print("4. Use keys when ordering is important")


def main():
    """Main function"""
    try:
        KafkaConfig.validate_config()
        
        analyzer = PartitionAnalyzer()
        analyzer.run_analysis()
        
        print("\n🎯 Next Steps:")
        print("1. Run keyed_producer.py to see customer-based partitioning")
        print("2. Try custom_partitioner.py for advanced strategies")
        print("3. Monitor partition distribution in production")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()