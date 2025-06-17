#!/usr/bin/env python3
"""
Auto-Commit Consumer Solution - Lab 05
Demonstrates how auto-commit can lose messages
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError, TopicPartition
from confluent_kafka.avro import AvroConsumer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.avro.serializer import SerializerError
import time
from datetime import datetime

class AutoCommitConsumer:
    def __init__(self):
        self.running = True
        self.processed_count = 0
        self.consumer = None
        
    def create_consumer(self):
        """Create consumer with auto-commit enabled"""
        print("Creating consumer...")
        
        # Get consumer configuration
        consumer_config = KafkaConfig.create_consumer_config(
            group_id='payment-processor-auto',
            enable_auto_commit=True
        )
        
        # Schema Registry configuration - use the method from KafkaConfig
        schema_registry_config = KafkaConfig.create_schema_registry_config()
        
        print(f"Schema Registry URL: {schema_registry_config.get('url')}")
        
        try:
            schema_registry_client = SchemaRegistryClient(schema_registry_config)
            print("Schema Registry client created successfully")
        except Exception as e:
            print(f"Failed to create Schema Registry client: {e}")
            sys.exit(1)
        
        # Add additional consumer settings
        consumer_config.update({
            'auto.commit.interval.ms': 5000,  # 5 seconds
            'session.timeout.ms': 10000,
            'max.poll.interval.ms': 300000
        })
        
        try:
            consumer = AvroConsumer(
                consumer_config,
                schema_registry_client=schema_registry_client
            )
            print("Avro consumer created successfully")
            return consumer
        except Exception as e:
            print(f"Failed to create Avro consumer: {e}")
            sys.exit(1)
    
    def get_committed_offset(self, topic, partition):
        """Safely get the committed offset for a topic partition"""
        try:
            topic_partition = TopicPartition(topic, partition)
            committed = self.consumer.committed([topic_partition], timeout=5.0)
            if committed and len(committed) > 0:
                return committed[0].offset
            return None
        except Exception as e:
            print(f"Error getting committed offset: {e}")
            return None
    
    def simulate_processing(self, message, sleep_time=2):
        """Simulate payment processing and crash"""
        print("\n--- Starting message processing ---")
        
        try:
            payment = message.value()
            partition = message.partition()
            offset = message.offset()
            topic = message.topic()
            
            print(f"\n{'='*60}")
            print(f"Received payment from topic '{topic}', partition {partition}, offset {offset}")
            
            if payment is None:
                print("ERROR: Message value is None")
                sys.exit(1)
            
            print(f"Payment ID: {payment.get('payment_id', 'N/A')}")
            print(f"Amount: ${payment.get('amount', 0.0):.2f} {payment.get('currency', 'N/A')}")
            print(f"Customer: {payment.get('customer_id', 'N/A')}")
            
            timestamp_val = payment.get('timestamp')
            if timestamp_val:
                print(f"Timestamp: {datetime.fromtimestamp(timestamp_val)}")
            
            # Check committed offset before processing
            print(f"\nChecking committed offset BEFORE processing...")
            committed_before = self.get_committed_offset(topic, partition)
            print(f"Current committed offset: {committed_before}")
            print(f"Message offset: {offset}")
            print(f"Auto-commit interval: 5 seconds")
            
            print(f"\n🔄 Processing payment (simulating {sleep_time}s of work)...")
            
            # Simulate processing time
            for i in range(sleep_time):
                print(f"   Processing... {i+1}/{sleep_time}s")
                time.sleep(1)
            
            print(f"\n✅ Payment processed successfully!")
            self.processed_count += 1
            
            # Check committed offset after processing
            print(f"\nChecking committed offset AFTER processing...")
            committed_after = self.get_committed_offset(topic, partition)
            
            print(f"\n💥 CRASHING after processing!")
            print(f"Total processed before crash: {self.processed_count}")
            
            # Check if auto-commit happened during processing
            if committed_after is not None and committed_before != committed_after:
                print(f"\n⚠️  AUTO-COMMIT HAPPENED during processing!")
                print(f"   Previous committed offset: {committed_before}")
                print(f"   New committed offset: {committed_after}")
            else:
                print(f"\nℹ️  No auto-commit detected during processing")
                print(f"   Committed offset: {committed_after}")
            
        except Exception as e:
            print(f"ERROR in simulate_processing: {e}")
            import traceback
            traceback.print_exc()
        finally:
            print("--- Forcing crash now ---")
            sys.exit(1)
    
    def run(self, sleep_time=2):
        """Main consumer loop"""
        print(f"Starting auto-commit consumer (sleep={sleep_time}s)")
        print("This will crash after processing first message...")
        print("-" * 50)
        
        self.consumer = self.create_consumer()
        self.consumer.subscribe(['payment_requests'])
        print("Subscribed to 'payment_requests' topic")
        
        try:
            poll_count = 0
            while self.running:
                poll_count += 1
                print(f"\nPolling for messages... (attempt {poll_count})")
                
                msg = self.consumer.poll(1.0)
                
                if msg is None:
                    if poll_count % 5 == 0:
                        print("No messages available, continuing to poll...")
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print(f"Reached end of partition: {msg.topic()}[{msg.partition()}]")
                        continue
                    else:
                        print(f"Consumer error: {msg.error()}")
                        break
                
                print(f"Message received! Processing...")
                # Process and crash - this should exit the program
                self.simulate_processing(msg, sleep_time)
                
                # This line should never be reached if simulate_processing works correctly
                print("WARNING: simulate_processing did not exit as expected!")
                break
                
        except KeyboardInterrupt:
            print("\nInterrupted by user")
        except Exception as e:
            print(f"Unexpected error in main loop: {e}")
            import traceback
            traceback.print_exc()
        finally:
            print("Closing consumer...")
            if self.consumer:
                self.consumer.close()

def main():
    """
    Run two experiments:
    1. With 2-second sleep (less than auto-commit interval)
    2. With 7-second sleep (more than auto-commit interval)
    """
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