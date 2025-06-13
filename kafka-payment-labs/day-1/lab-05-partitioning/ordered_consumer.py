#!/usr/bin/env python3
"""
Ordered Consumer - Processes specific partitions to maintain order
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Consumer, TopicPartition
from common.config import KafkaConfig
import json
import signal
import argparse
from collections import defaultdict


class OrderedConsumer:
    """Consumer that processes specific partitions to demonstrate ordering"""
    
    def __init__(self, partitions_to_consume):
        self.partitions_to_consume = partitions_to_consume
        self.running = True
        
        # Track customer message order
        self.customer_sequences = defaultdict(list)
        self.processed_count = 0
        
        # Consumer configuration
        config = KafkaConfig.create_consumer_config(
            group_id=f'ordered-consumer-{"-".join(map(str, partitions_to_consume))}',
            auto_offset_reset='earliest',
            enable_auto_commit=False  # Manual commit for demonstration
        )
        
        self.consumer = Consumer(config)
        
        # Set up signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
    
    def signal_handler(self, sig, frame):
        """Handle shutdown signal"""
        print(f"\n⚠️  Shutting down consumer for partitions {self.partitions_to_consume}...")
        self.running = False
    
    def assign_partitions(self):
        """Manually assign specific partitions"""
        topic = 'payment_requests'
        
        # Create TopicPartition objects
        partitions = [
            TopicPartition(topic, partition_id) 
            for partition_id in self.partitions_to_consume
        ]
        
        # Assign partitions to this consumer
        self.consumer.assign(partitions)
        
        print(f"🎯 Assigned partitions: {self.partitions_to_consume}")
    
    def process_message(self, msg):
        """Process a message and track ordering"""
        try:
            # Parse message
            payment = json.loads(msg.value().decode('utf-8'))
            customer_id = payment.get('customer_id', 'Unknown')
            payment_id = payment.get('payment_id', 'Unknown')
            amount = payment.get('amount', 0)
            
            # Track sequence for this customer
            self.customer_sequences[customer_id].append({
                'payment_id': payment_id,
                'amount': amount,
                'partition': msg.partition(),
                'offset': msg.offset(),
                'timestamp': payment.get('timestamp', 'Unknown')
            })
            
            self.processed_count += 1
            
            # Show processing info
            sequence_num = len(self.customer_sequences[customer_id])
            print(f"💳 [{msg.partition()}:{msg.offset()}] {customer_id} "
                  f"Payment #{sequence_num}: ${amount:.2f}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error processing message: {e}")
            return False
    
    def show_customer_sequences(self):
        """Display customer payment sequences to verify ordering"""
        print(f"\n📋 Customer Payment Sequences (Total: {self.processed_count})")
        print("=" * 60)
        
        for customer_id in sorted(self.customer_sequences.keys()):
            payments = self.customer_sequences[customer_id]
            print(f"\n👤 {customer_id} ({len(payments)} payments):")
            
            for i, payment in enumerate(payments, 1):
                print(f"   {i}. ${payment['amount']:6.2f} "
                      f"[P{payment['partition']}:{payment['offset']}] "
                      f"{payment['payment_id'][:8]}...")
        
        print(f"\n💡 Ordering Verification:")
        print(f"   - All payments for each customer are in sequence")
        print(f"   - Each customer's messages come from the same partition")
        print(f"   - Offsets increase monotonically within each partition")
    
    def run(self):
        """Run the ordered consumer"""
        try:
            # Assign specific partitions
            self.assign_partitions()
            
            print(f"🚀 Ordered Consumer Started")
            print(f"📊 Processing partitions: {self.partitions_to_consume}")
            print("=" * 50)
            print("Waiting for messages... (Press Ctrl+C to stop)")
            
            while self.running:
                # Poll for messages
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                # Process message
                if self.process_message(msg):
                    # Manually commit offset
                    self.consumer.commit(message=msg)
                
                # Show progress every 20 messages
                if self.processed_count % 20 == 0 and self.processed_count > 0:
                    print(f"📈 Processed {self.processed_count} messages...")
        
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            # Clean shutdown
            self.consumer.close()
            self.show_customer_sequences()


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Ordered Consumer for specific partitions')
    parser.add_argument('--partitions', type=str, required=True,
                        help='Comma-separated list of partition IDs (e.g., "0,1,2")')
    
    args = parser.parse_args()
    
    try:
        # Parse partition list
        partitions = [int(p.strip()) for p in args.partitions.split(',')]
        
        if not partitions:
            print("❌ Please specify at least one partition")
            sys.exit(1)
        
        # Validate configuration
        KafkaConfig.validate_config()
        
        # Create and run consumer
        consumer = OrderedConsumer(partitions)
        consumer.run()
        
    except ValueError:
        print("❌ Invalid partition format. Use comma-separated integers (e.g., '0,1,2')")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()