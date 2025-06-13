#!/usr/bin/env python3
"""
Keyed Producer - Demonstrates partition assignment based on keys
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Producer
from common.config import KafkaConfig
import json
import time
import uuid
from datetime import datetime
import argparse
import random


class KeyedPaymentProducer:
    """Producer that uses customer IDs as keys for partitioning"""
    
    def __init__(self):
        config = KafkaConfig.create_producer_config()
        self.producer = Producer(config)
        self.topic = 'payment_requests'
        
        # Track partition distribution
        self.partition_counts = {}
        self.customer_partitions = {}
    
    def delivery_callback(self, err, msg):
        """Track delivery and partition assignment"""
        if err is not None:
            print(f"❌ Delivery failed: {err}")
        else:
            partition = msg.partition()
            key = msg.key().decode('utf-8') if msg.key() else 'NO_KEY'
            
            # Track partition counts
            self.partition_counts[partition] = self.partition_counts.get(partition, 0) + 1
            
            # Track customer-partition mapping
            if key != 'NO_KEY':
                if key not in self.customer_partitions:
                    self.customer_partitions[key] = partition
                    print(f"🔑 Customer {key} → Partition {partition}")
    
    def create_payment(self, customer_id: str, amount: float) -> dict:
        """Create a payment message"""
        return {
            'payment_id': str(uuid.uuid4()),
            'customer_id': customer_id,
            'amount': amount,
            'currency': 'USD',
            'payment_method': random.choice(['credit_card', 'debit_card', 'bank_transfer']),
            'merchant_id': f"MERCH{random.randint(1, 10):03d}",
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': {
                'source': 'keyed_producer',
                'version': '1.0'
            }
        }
    
    def send_customer_payments(self, customer_id: str, num_payments: int):
        """Send multiple payments for a specific customer"""
        print(f"\n💳 Sending {num_payments} payments for {customer_id}")
        
        for i in range(num_payments):
            # Random amount between $10 and $500
            amount = round(random.uniform(10.00, 500.00), 2)
            
            # Create payment
            payment = self.create_payment(customer_id, amount)
            
            # Send with customer ID as key
            self.producer.produce(
                topic=self.topic,
                key=customer_id.encode('utf-8'),  # Key determines partition
                value=json.dumps(payment).encode('utf-8'),
                callback=self.delivery_callback
            )
            
            # Trigger callbacks
            self.producer.poll(0)
            
            # Small delay
            time.sleep(0.1)
    
    def demonstrate_partitioning(self):
        """Show how keys affect partition assignment"""
        print("🎯 Demonstrating Key-Based Partitioning")
        print("=" * 60)
        
        # Create a set of customers
        customers = [f"CUST{i:04d}" for i in range(10)]
        
        # Send multiple payments per customer
        for customer in customers:
            self.send_customer_payments(customer, 5)
        
        # Flush remaining messages
        print("\n⏳ Flushing messages...")
        self.producer.flush()
        
        # Show partition distribution
        self.show_statistics()
    
    def continuous_mode(self):
        """Continuously send keyed messages"""
        print("🔄 Continuous Mode - Sending keyed messages")
        print("Press Ctrl+C to stop")
        print("=" * 60)
        
        customers = [f"CUST{i:04d}" for i in range(20)]
        message_count = 0
        
        try:
            while True:
                # Pick random customer
                customer = random.choice(customers)
                amount = round(random.uniform(10.00, 1000.00), 2)
                
                # Create and send payment
                payment = self.create_payment(customer, amount)
                
                self.producer.produce(
                    topic=self.topic,
                    key=customer.encode('utf-8'),
                    value=json.dumps(payment).encode('utf-8'),
                    callback=self.delivery_callback
                )
                
                message_count += 1
                
                # Show progress
                if message_count % 50 == 0:
                    print(f"📊 Sent {message_count} messages...")
                    self.show_partition_balance()
                
                # Trigger callbacks and pace sending
                self.producer.poll(0)
                time.sleep(0.05)  # 20 messages/second
                
        except KeyboardInterrupt:
            print("\n⚠️  Stopping...")
            self.producer.flush()
            self.show_statistics()
    
    def show_partition_balance(self):
        """Show current partition distribution"""
        total = sum(self.partition_counts.values())
        if total > 0:
            print("📊 Partition Distribution:")
            for partition in sorted(self.partition_counts.keys()):
                count = self.partition_counts[partition]
                percentage = (count / total) * 100
                bar = '█' * int(percentage / 2)
                print(f"   P{partition}: {bar} {count} ({percentage:.1f}%)")
    
    def show_statistics(self):
        """Display partitioning statistics"""
        print("\n📈 Partitioning Statistics")
        print("=" * 60)
        
        # Partition distribution
        print("\n🎯 Messages per Partition:")
        total_messages = sum(self.partition_counts.values())
        
        for partition in sorted(self.partition_counts.keys()):
            count = self.partition_counts[partition]
            percentage = (count / total_messages) * 100
            print(f"   Partition {partition}: {count} messages ({percentage:.1f}%)")
        
        # Customer-partition mapping
        print(f"\n🔑 Customer-Partition Mappings ({len(self.customer_partitions)} customers):")
        
        # Group customers by partition
        partition_customers = {}
        for customer, partition in self.customer_partitions.items():
            if partition not in partition_customers:
                partition_customers[partition] = []
            partition_customers[partition].append(customer)
        
        # Show first few customers per partition
        for partition in sorted(partition_customers.keys()):
            customers = partition_customers[partition]
            sample = ', '.join(customers[:5])
            more = f" (+{len(customers)-5} more)" if len(customers) > 5 else ""
            print(f"   Partition {partition}: {sample}{more}")
        
        print("\n💡 Key Insights:")
        print("   - Each customer always goes to the same partition")
        print("   - Distribution depends on key hash")
        print("   - Order preserved per customer")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Keyed Kafka Producer')
    parser.add_argument('--continuous', action='store_true',
                        help='Run in continuous mode')
    
    args = parser.parse_args()
    
    try:
        KafkaConfig.validate_config()
        
        producer = KeyedPaymentProducer()
        
        if args.continuous:
            producer.continuous_mode()
        else:
            producer.demonstrate_partitioning()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()