#!/usr/bin/env python3
"""
Batch Processing Consumer Solution - Lab 05
Implements batch processing with manual commits
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
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()

class BatchConsumer:
    def __init__(self, batch_size=5):
        self.batch_size = batch_size
        self.running = True
        self.current_batch = []
        self.processed_batches = 0
        self.processed_messages = 0
        
    def signal_handler(self, sig, frame):
        print('\nGracefully shutting down...')
        self.running = False
        
    def create_consumer(self):
        """Create consumer for batch processing"""
        # Separate Kafka and Schema Registry configurations
        consumer_config = KafkaConfig.create_avro_consumer_config(
            group_id='payment-processor-batch',
            enable_auto_commit=False
        )
        
        # Schema Registry configuration - SchemaRegistryClient uses different format
        schema_registry_config = {
            'url': os.getenv('SCHEMA_REGISTRY_URL'),
            'basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}"
        }
        schema_registry_client = SchemaRegistryClient(schema_registry_config)
        
        # Create Avro deserializer
        self.avro_deserializer = AvroDeserializer(schema_registry_client)
        
        # Add additional consumer settings
        consumer_config.update({
            'session.timeout.ms': 10000,
            'max.poll.interval.ms': 300000
        })
        
        return Consumer(consumer_config)
    
    def process_batch(self, messages):
        """Process a batch of messages"""
        print(f"\n{'='*60}")
        print(f"Processing batch of {len(messages)} messages")
        print("="*60)
        
        try:
            # Validate all messages first
            for i, msg in enumerate(messages):
                payment = self.avro_deserializer(msg.value(), SerializationContext(msg.topic(), MessageField.VALUE))
                print(f"{i+1}. Payment {payment['payment_id']}: "
                      f"${payment['amount']:.2f} {payment['currency']}")
                
                # Simulate validation failure (5% chance)
                import random
                if random.random() < 0.05:
                    raise Exception(f"Validation failed for payment {payment['payment_id']}")
            
            print("\n✓ All messages validated")
            print("🔄 Processing batch (simulating 3s batch operation)...")
            
            # Simulate batch processing (e.g., bulk database insert)
            time.sleep(3)
            
            # Simulate processing failure (10% chance)
            if random.random() < 0.1:
                raise Exception("Batch processing failed!")
            
            print("✅ Batch processed successfully!")
            self.processed_messages += len(messages)
            self.processed_batches += 1
            
            return True
            
        except Exception as e:
            print(f"\n❌ Batch processing failed: {e}")
            print("   All messages in batch will be reprocessed")
            return False
    
    def get_batch_offsets(self, messages):
        """Get the offsets to commit for a batch"""
        # Group by topic-partition
        offsets = defaultdict(lambda: {'topic': None, 'partition': None, 'offset': -1})
        
        for msg in messages:
            key = (msg.topic(), msg.partition())
            # We need to commit offset + 1 (next offset to read)
            if msg.offset() > offsets[key]['offset']:
                offsets[key] = {
                    'topic': msg.topic(),
                    'partition': msg.partition(),
                    'offset': msg.offset() + 1
                }
        
        # Convert to TopicPartition objects
        return [
            TopicPartition(
                topic=data['topic'],
                partition=data['partition'],
                offset=data['offset']
            )
            for data in offsets.values()
        ]
    
    def commit_batch(self, consumer, messages):
        """Commit offsets for a successfully processed batch"""
        try:
            offsets = self.get_batch_offsets(messages)
            consumer.commit(offsets=offsets, asynchronous=False)
            
            print("\n✓ Batch committed:")
            for tp in offsets:
                print(f"  - {tp.topic} [{tp.partition}] offset {tp.offset}")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Failed to commit batch: {e}")
            return False
    
    def process_partial_batch(self, consumer, messages):
        """Process a partial batch (e.g., on shutdown)"""
        if not messages:
            return
            
        print(f"\n⚠️  Processing partial batch of {len(messages)} messages")
        
        if self.process_batch(messages):
            self.commit_batch(consumer, messages)
    
    def run(self):
        """Batch processing loop"""
        signal.signal(signal.SIGINT, self.signal_handler)
        
        print(f"Starting batch consumer (batch_size={self.batch_size})")
        print("Press Ctrl+C for graceful shutdown")
        print("-" * 50)
        
        consumer = self.create_consumer()
        consumer.subscribe(['payment_requests'])
        
        try:
            while self.running:
                msg = consumer.poll(1.0)
                
                if msg is None:
                    # No message, check if we should process partial batch
                    if self.current_batch and not self.running:
                        self.process_partial_batch(consumer, self.current_batch)
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"Error: {msg.error()}")
                        break
                
                # Add to current batch
                self.current_batch.append(msg)
                print(f"Added message to batch ({len(self.current_batch)}/{self.batch_size})")
                
                # Process when batch is full
                if len(self.current_batch) >= self.batch_size:
                    if self.process_batch(self.current_batch):
                        # Commit only if batch succeeded
                        if self.commit_batch(consumer, self.current_batch):
                            print(f"✅ Batch {self.processed_batches} completed")
                        else:
                            print("⚠️  Batch processed but commit failed")
                    else:
                        print("⚠️  Batch failed - will retry these messages")
                    
                    # Clear batch
                    self.current_batch = []
            
            # Process any remaining messages
            if self.current_batch:
                self.process_partial_batch(consumer, self.current_batch)
                
        except KeyboardInterrupt:
            print(f"\nShutdown requested")
            
            # Process partial batch if exists
            if self.current_batch:
                print(f"Processing remaining {len(self.current_batch)} messages...")
                self.process_partial_batch(consumer, self.current_batch)
                
        finally:
            print(f"\nFinal statistics:")
            print(f"  - Batches processed: {self.processed_batches}")
            print(f"  - Messages processed: {self.processed_messages}")
            consumer.close()
            print("Consumer closed")

def main():
    print("\n" + "="*70)
    print("BATCH PROCESSING PATTERNS")
    print("="*70)
    
    print("\n1. BATCH BENEFITS:")
    print("   - Amortize processing overhead")
    print("   - Bulk operations (DB inserts, API calls)")
    print("   - Better throughput")
    
    print("\n2. BATCH CHALLENGES:")
    print("   - All-or-nothing processing")
    print("   - Larger reprocessing on failure")
    print("   - Memory usage for large batches")
    
    print("\n3. PRODUCTION CONSIDERATIONS:")
    print("   - Timeout handling for partial batches")
    print("   - Memory limits for batch size")
    print("   - Error isolation strategies")
    print("="*70)
    
    # Test with different batch sizes
    import sys
    batch_size = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    
    input(f"\nPress Enter to start with batch_size={batch_size}...")
    
    consumer = BatchConsumer(batch_size=batch_size)
    consumer.run()

if __name__ == "__main__":
    main()