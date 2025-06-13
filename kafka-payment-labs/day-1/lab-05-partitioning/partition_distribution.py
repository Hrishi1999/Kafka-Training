#!/usr/bin/env python3
"""
Partition Distribution Analyzer - Shows how keyed messages are distributed across partitions
"""

import sys
import os
import signal

# Add parent directory to path before imports
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from dotenv import load_dotenv
from confluent_kafka import Consumer, TopicPartition
from confluent_kafka.admin import AdminClient
from common.config import KafkaConfig
import json
from collections import defaultdict
import time
import argparse

# Load .env file from the kafka-payment-labs directory
env_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(env_path)


class PartitionDistributionAnalyzer:
    """Analyzes how messages with specific keys are distributed across partitions"""
    
    def __init__(self):
        # Consumer for reading messages
        consumer_config = KafkaConfig.create_consumer_config(
            group_id='partition-distribution-analyzer',
            auto_offset_reset='earliest'
        )
        self.consumer = Consumer(consumer_config)
        
        # Admin client for metadata - use the same config as consumer
        admin_config = {
            'bootstrap.servers': os.getenv('BOOTSTRAP_SERVERS'),
            'security.protocol': os.getenv('SECURITY_PROTOCOL', 'SASL_SSL'),
            'sasl.mechanism': os.getenv('SASL_MECHANISM', 'PLAIN'),
            'sasl.username': os.getenv('SASL_USERNAME'),
            'sasl.password': os.getenv('SASL_PASSWORD'),
        }
        self.admin = AdminClient(admin_config)
        
        self.topic = 'payment_requests'
        
        # Track distribution
        self.customer_partitions = defaultdict(set)
        self.partition_messages = defaultdict(list)
        self.partition_counts = defaultdict(int)
        self.key_counts = defaultdict(int)
        
        # Flag for graceful shutdown
        self.running = True
    
    def get_topic_metadata(self):
        """Get topic metadata including partition count"""
        metadata = self.admin.list_topics(topic=self.topic)
        topic_metadata = metadata.topics[self.topic]
        return len(topic_metadata.partitions)
    
    def stop(self):
        """Stop the analyzer gracefully"""
        self.running = False
    
    def analyze_messages(self, max_messages=1000):
        """Read messages and analyze their distribution"""
        # Subscribe to topic
        self.consumer.subscribe([self.topic])
        
        print(f"🔍 Analyzing message distribution in '{self.topic}' topic...")
        print(f"📊 Reading up to {max_messages} messages...")
        print(f"⏸️  Press Ctrl+C to stop early\n")
        
        messages_read = 0
        start_time = time.time()
        
        try:
            while messages_read < max_messages and self.running:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    # Check if we've been waiting too long
                    if time.time() - start_time > 10:
                        print(f"⏱️  Timeout reached. Analyzed {messages_read} messages.")
                        break
                    continue
                
                if msg.error():
                    print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                # Extract key and partition info
                key = msg.key().decode('utf-8') if msg.key() else 'NO_KEY'
                partition = msg.partition()
                
                # Parse message
                try:
                    value = json.loads(msg.value().decode('utf-8'))
                    customer_id = value.get('customer_id', 'Unknown')
                except:
                    customer_id = 'Unknown'
                
                # Track distribution
                self.customer_partitions[customer_id].add(partition)
                self.partition_messages[partition].append({
                    'key': key,
                    'customer_id': customer_id,
                    'offset': msg.offset()
                })
                self.partition_counts[partition] += 1
                self.key_counts[key] += 1
                
                messages_read += 1
                
                # Progress indicator
                if messages_read % 100 == 0:
                    print(f"📈 Processed {messages_read} messages...")
                
        except KeyboardInterrupt:
            print(f"\n⚠️  Interrupted. Analyzed {messages_read} messages.")
        finally:
            self.consumer.close()
    
    def display_results(self):
        """Display the distribution analysis results"""
        print("\n" + "=" * 70)
        print("📊 PARTITION DISTRIBUTION ANALYSIS")
        print("=" * 70)
        
        # Get partition count
        num_partitions = self.get_topic_metadata()
        print(f"\n📋 Topic Info:")
        print(f"   Topic: {self.topic}")
        print(f"   Partitions: {num_partitions}")
        print(f"   Total messages analyzed: {sum(self.partition_counts.values())}")
        
        # Partition distribution
        print(f"\n🎯 Messages per Partition:")
        total_messages = sum(self.partition_counts.values())
        
        for partition in range(num_partitions):
            count = self.partition_counts.get(partition, 0)
            percentage = (count / total_messages * 100) if total_messages > 0 else 0
            bar = '█' * int(percentage / 2)
            print(f"   Partition {partition}: {bar} {count} ({percentage:.1f}%)")
        
        # Customer-Partition mapping
        print(f"\n🔑 Customer Distribution:")
        print(f"   Total unique customers: {len(self.customer_partitions)}")
        
        # Check if customers stick to single partitions
        single_partition_customers = sum(1 for partitions in self.customer_partitions.values() 
                                       if len(partitions) == 1)
        print(f"   Customers in single partition: {single_partition_customers} "
              f"({single_partition_customers/len(self.customer_partitions)*100:.1f}%)")
        
        # Show sample customer mappings
        print("\n📍 Sample Customer-Partition Mappings:")
        for i, (customer, partitions) in enumerate(self.customer_partitions.items()):
            if i >= 10:  # Show first 10
                print(f"   ... and {len(self.customer_partitions) - 10} more customers")
                break
            partitions_str = ', '.join(map(str, sorted(partitions)))
            print(f"   {customer} → Partition(s): {partitions_str}")
        
        # Key distribution
        print(f"\n🗝️  Key Distribution (Top 10):")
        sorted_keys = sorted(self.key_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        for key, count in sorted_keys:
            print(f"   {key}: {count} messages")
        
        # Partition balance analysis
        self.analyze_balance()
    
    def analyze_balance(self):
        """Analyze partition balance and hot spots"""
        print("\n⚖️  Partition Balance Analysis:")
        
        if not self.partition_counts:
            print("   No data to analyze")
            return
        
        counts = list(self.partition_counts.values())
        avg_messages = sum(counts) / len(counts)
        max_messages = max(counts)
        min_messages = min(counts)
        
        print(f"   Average messages per partition: {avg_messages:.1f}")
        print(f"   Max messages in a partition: {max_messages}")
        print(f"   Min messages in a partition: {min_messages}")
        print(f"   Imbalance ratio: {max_messages/min_messages:.2f}x")
        
        # Identify hot partitions
        hot_threshold = avg_messages * 1.5
        hot_partitions = [p for p, count in self.partition_counts.items() 
                         if count > hot_threshold]
        
        if hot_partitions:
            print(f"\n🔥 Hot Partitions (>{hot_threshold:.0f} messages):")
            for partition in hot_partitions:
                count = self.partition_counts[partition]
                print(f"   Partition {partition}: {count} messages "
                      f"({count/avg_messages:.1f}x average)")
        else:
            print("\n✅ No hot partitions detected - good balance!")
        
        # Show insights
        print("\n💡 Key Insights:")
        print("   1. Messages with the same key always go to the same partition")
        print("   2. Distribution depends on key hash and number of partitions")
        print("   3. Poor key selection can lead to hot partitions")
        print("   4. Monitor partition balance in production")


# Global analyzer instance for signal handling
analyzer = None


def signal_handler(signum, frame):
    """Handle interrupt signals gracefully"""
    global analyzer
    if analyzer:
        analyzer.stop()
    sys.exit(0)


def main():
    """Main function"""
    global analyzer
    
    parser = argparse.ArgumentParser(description='Analyze Kafka partition distribution')
    parser.add_argument('--messages', type=int, default=500,
                        help='Maximum number of messages to analyze (default: 500)')
    
    args = parser.parse_args()
    
    # Setup signal handler
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        KafkaConfig.validate_config()
        
        analyzer = PartitionDistributionAnalyzer()
        analyzer.analyze_messages(max_messages=args.messages)
        analyzer.display_results()
        
        print("\n🎯 Next Steps:")
        print("   1. Try different key strategies with keyed_producer.py")
        print("   2. Run custom_partitioner.py for advanced partitioning")
        print("   3. Monitor partition balance in your production systems")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Analysis interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"💡 Tip: Make sure your .env file exists at: {env_path}")
        print(f"   You can copy the example: cp {os.path.join(os.path.dirname(__file__), '../../.env.example')} {env_path}")
        sys.exit(1)


if __name__ == "__main__":
    main()