#!/usr/bin/env python3
"""
Manual Commit Consumer Solution - Lab 05
Implements reliable message processing with manual commits
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError, TopicPartition
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.serialization import SerializationContext, MessageField
from confluent_kafka.schema_registry.avro import AvroDeserializer
import time
import signal
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class ManualCommitConsumer:
    def __init__(self):
        self.running = True
        self.processed_count = 0
        self.consumer = None
        
    def signal_handler(self, sig, frame):
        print('\nGracefully shutting down...')
        self.running = False
        
    def create_consumer(self):
        """Create consumer with manual commit"""
        consumer_config = KafkaConfig.create_consumer_config()
        consumer_config.update({
            'group.id': 'payment-processor-manual',
            'enable.auto.commit': False,  # Manual commit
            'session.timeout.ms': 10000,
            'max.poll.interval.ms': 300000,
            'auto.offset.reset': 'earliest'
        })
        
        # Create Schema Registry client
        schema_registry_config = {
            'url': os.getenv('SCHEMA_REGISTRY_URL'),
            'basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}"
        }
        schema_registry_client = SchemaRegistryClient(schema_registry_config)
        
        # Create Avro deserializer
        self.avro_deserializer = AvroDeserializer(schema_registry_client)
        
        return Consumer(consumer_config)
    
    def process_payment(self, message):
        """Process payment reliably"""
        try:
            # Deserialize Avro message
            payment = self.avro_deserializer(message.value(), SerializationContext(message.topic(), MessageField.VALUE))
            partition = message.partition()
            offset = message.offset()
            
            print(f"\n{'='*60}")
            print(f"Received payment from partition {partition}, offset {offset}")
            print(f"Payment ID: {payment['payment_id']}")
            print(f"Amount: ${payment['amount']:.2f} {payment['currency']}")
            print(f"Customer: {payment['customer_id']}")
            print(f"Timestamp: {datetime.fromtimestamp(payment['timestamp'])}")
            
            # Check committed offset
            topic_partition = [TopicPartition(message.topic(), partition)]
            committed = self.consumer.committed(topic_partition)[0]
            print(f"\nCurrent committed offset: {committed.offset if committed else 'None'}")
            print(f"Message offset: {offset}")
            
            print(f"\n🔄 Processing payment (2s simulated work)...")
            
            # Simulate processing
            time.sleep(2)
            
            # Simulate potential processing errors (10% chance)
            import random
            if random.random() < 0.1:
                raise Exception("Simulated processing error!")
            
            print(f"✅ Payment processed successfully!")
            self.processed_count += 1
            
            return True
            
        except Exception as e:
            print(f"❌ Error processing payment: {e}")
            return False
    
    def commit_message(self, message):
        """Commit a specific message offset"""
        try:
            # Commit the next offset (current + 1)
            self.consumer.commit(asynchronous=False)
            print(f"✓ Committed offset {message.offset() + 1}")
            return True
        except Exception as e:
            print(f"❌ Failed to commit: {e}")
            return False
    
    def run(self, crash_after=None):
        """Main consumer loop with manual commits"""
        signal.signal(signal.SIGINT, self.signal_handler)
        print("Starting manual commit consumer")
        print("Press Ctrl+C for graceful shutdown")
        print("-" * 50)
        
        self.consumer = self.create_consumer()
        self.consumer.subscribe(['payment_requests'])
        
        messages_consumed = 0
        
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
                
                messages_consumed += 1
                
                # Simulate crash for testing
                if crash_after and messages_consumed == crash_after:
                    print(f"\n💥 SIMULATING CRASH after {crash_after} messages!")
                    print(f"Processed count: {self.processed_count}")
                    print("Note: Uncommitted messages will be reprocessed on restart")
                    sys.exit(1)
                
                # Process the payment
                success = self.process_payment(msg)
                
                if success:
                    # Commit ONLY after successful processing
                    if self.commit_message(msg):
                        print("✅ Message committed - guaranteed processed")
                    else:
                        print("⚠️  Commit failed - message may be reprocessed")
                        # In production, you might want to retry or alert
                else:
                    print("⚠️  Processing failed - not committing")
                    print("    Message will be reprocessed on next run")
                    # Optionally, you could implement retry logic here
                
        except KeyboardInterrupt:
            print(f"\nShutdown requested")
            print(f"Total successfully processed: {self.processed_count}")
        finally:
            print("Closing consumer...")
            self.consumer.close()
            print("Consumer closed")

def demonstrate_scenarios():
    """Show different scenarios with manual commit"""
    print("\n" + "="*70)
    print("MANUAL COMMIT SCENARIOS")
    print("="*70)
    
    print("\n1. AT-LEAST-ONCE PROCESSING (Recommended for payments):")
    print("   - Process message")
    print("   - Commit AFTER successful processing")
    print("   - If crash between process and commit: Message reprocessed")
    print("   - Guarantee: Never lose a payment")
    
    print("\n2. AT-MOST-ONCE PROCESSING (Not recommended for payments):")
    print("   - Commit BEFORE processing")
    print("   - If crash during processing: Message lost")
    print("   - Use only for non-critical data")
    
    print("\n3. EXACTLY-ONCE (Requires transactions):")
    print("   - Process + Commit in transaction")
    print("   - OR: Duplicate detection with at-least-once")
    print("   - Best for financial systems")
    
    print("\n" + "="*70)

def main():
    """Test scenarios"""
    import sys
    
    # Show scenarios
    demonstrate_scenarios()
    
    print("\nStarting consumer...")
    print("Try these tests:")
    print("1. Normal operation: Let it run")
    print("2. Test crash: Run with argument '3' to crash after 3 messages")
    print("3. Kill with Ctrl+C to test graceful shutdown")
    
    # Optional: crash after N messages for testing
    crash_after = int(sys.argv[1]) if len(sys.argv) > 1 else None
    
    if crash_after:
        print(f"\n⚠️  Will crash after {crash_after} messages for testing")
    
    input("\nPress Enter to start...")
    
    consumer = ManualCommitConsumer()
    consumer.run(crash_after=crash_after)

if __name__ == "__main__":
    main()