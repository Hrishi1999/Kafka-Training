#!/usr/bin/env python3
"""
Auto-Commit Consumer Solution - Lab 05
Demonstrates how auto-commit can lose messages
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
from confluent_kafka.avro import AvroConsumer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.avro.serializer import SerializerError
import time
import signal
from datetime import datetime

class AutoCommitConsumer:
    def __init__(self):
        self.running = True
        self.processed_count = 0
        
    def create_consumer(self):
        """Create consumer with auto-commit enabled"""
        # Separate Kafka and Schema Registry configurations
        consumer_config = KafkaConfig.create_avro_consumer_config(
            group_id='payment-processor-auto',
            enable_auto_commit=True
        )
        
        # Schema Registry configuration with correct auth format
        schema_registry_config = {
            'url': os.getenv('SCHEMA_REGISTRY_URL'),
            'basic.auth.credentials.source': 'USER_INFO',
            'basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}"
        }
        schema_registry_client = SchemaRegistryClient(schema_registry_config)
        
        # Add additional consumer settings
        consumer_config.update({
            'auto.commit.interval.ms': 5000,  # 5 seconds
            'session.timeout.ms': 10000,
            'max.poll.interval.ms': 300000
        })
        
        return AvroConsumer(
            consumer_config,
            schema_registry=schema_registry_client
        )
    
    def simulate_processing(self, message, sleep_time=2):
        """Simulate payment processing and crash"""
        payment = message.value()
        partition = message.partition()
        offset = message.offset()
        
        print(f"\n{'='*60}")
        print(f"Received payment from partition {partition}, offset {offset}")
        print(f"Payment ID: {payment['payment_id']}")
        print(f"Amount: ${payment['amount']:.2f} {payment['currency']}")
        print(f"Customer: {payment['customer_id']}")
        print(f"Timestamp: {datetime.fromtimestamp(payment['timestamp'])}")
        
        # Check committed offset before processing
        topic_partition = [(message.topic(), partition)]
        committed = self.consumer.committed(topic_partition)[0]
        print(f"\nCurrent committed offset: {committed.offset if committed else 'None'}")
        print(f"Message offset: {offset}")
        print(f"Auto-commit interval: 5 seconds")
        
        print(f"\n🔄 Processing payment (simulating {sleep_time}s of work)...")
        
        # Simulate processing time
        for i in range(sleep_time):
            print(f"   Processing... {i+1}/{sleep_time}s")
            time.sleep(1)
        
        print(f"\n✅ Payment processed successfully!")
        self.processed_count += 1
        
        # Now crash!
        print(f"\n💥 CRASHING after processing!")
        print(f"Total processed before crash: {self.processed_count}")
        
        # Check if auto-commit happened during sleep
        committed_after = self.consumer.committed(topic_partition)[0]
        if committed_after and committed.offset != committed_after.offset:
            print(f"\n⚠️  AUTO-COMMIT HAPPENED during processing!")
            print(f"New committed offset: {committed_after.offset}")
        
        sys.exit(1)
    
    def run(self, sleep_time=2):
        """Main consumer loop"""
        print(f"Starting auto-commit consumer (sleep={sleep_time}s)")
        print("This will crash after processing first message...")
        print("-" * 50)
        
        self.consumer = self.create_consumer()
        self.consumer.subscribe(['payment_requests'])
        
        try:
            while self.running:
                msg = self.consumer.poll(1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"Error: {msg.error()}")
                        break
                
                # Process and crash
                self.simulate_processing(msg, sleep_time)
                
        except KeyboardInterrupt:
            print("\nInterrupted")
        finally:
            self.consumer.close()

def main():
    """
    Run two experiments:
    1. With 2-second sleep (less than auto-commit interval)
    2. With 7-second sleep (more than auto-commit interval)
    """
    import sys
    
    # Get sleep time from command line or default
    sleep_time = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    
    if sleep_time < 5:
        print("\n" + "🚨 " * 20)
        print("EXPERIMENT 1: Short processing time (< auto-commit interval)")
        print("Expected: Message will be LOST after crash!")
        print("Why: Crash happens before auto-commit")
        print("🚨 " * 20 + "\n")
    else:
        print("\n" + "✅ " * 20)
        print("EXPERIMENT 2: Long processing time (> auto-commit interval)")
        print("Expected: Message will NOT be lost after crash!")
        print("Why: Auto-commit happens during processing")
        print("✅ " * 20 + "\n")
    
    input("Press Enter to start...")
    
    consumer = AutoCommitConsumer()
    consumer.run(sleep_time=sleep_time)

if __name__ == "__main__":
    main()