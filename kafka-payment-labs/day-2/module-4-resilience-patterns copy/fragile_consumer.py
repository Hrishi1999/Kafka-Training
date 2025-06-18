#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
import json
import time
import random


def create_consumer():
    """Create consumer with manual offset management"""
    config = KafkaConfig.create_consumer_config()
    config.update({
        'group.id': 'fragile-payment-processor',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    })
    return Consumer(config)


def process_payment(payment):
    """Fragile payment processing with random failures"""
    
    # Simulate random failures (30% chance)
    if random.random() < 0.3:
        failure_type = random.choice([
            'network_timeout',
            'invalid_customer', 
            'fraud_check_failed',
            'bank_api_down'
        ])
        raise Exception(f"Payment processing failed: {failure_type}")
    
    # Simulate processing time
    time.sleep(0.1)
    print(f"✅ Processed payment {payment['payment_id']}")
    return True


def fragile_consumer_loop():
    """THE WRONG WAY - Blocking retries"""
    print("=== FRAGILE CONSUMER DEMO ===")
    print("Demonstrating the blocking retry anti-pattern...")
    print("Watch how failed messages block the entire partition!")
    print("(Ctrl+C to stop)")
    
    consumer = create_consumer()
    consumer.subscribe(['payment_requests'])  # Using Day 1 JSON topic
    
    message_count = 0
    start_time = time.time()
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
                
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Error: {msg.error()}")
                    continue
                
            message_count += 1
            payment = json.loads(msg.value().decode('utf-8'))
            
            print(f"\n📦 Message #{message_count}: {payment['payment_id']}")
            
            # ANTI-PATTERN: Blocking retry loop
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    process_payment(payment)
                    consumer.commit()  # Only commit on success
                    break
                except Exception as e:
                    print(f"❌ Attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        print(f"💀 Message failed permanently: {payment['payment_id']}")
                        print(f"⚠️  BLOCKING: All subsequent messages are stuck!")
                        
                        # What do we do now? Skip? Stop?
                        consumer.commit()  # Commit to skip the poison pill
                        print(f"⏭️  Skipping poison pill...")
                    else:
                        retry_delay = 2 ** attempt
                        print(f"⏰ Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)  # Exponential backoff
                        
            # Show timing impact
            elapsed = time.time() - start_time
            print(f"📊 Processed {message_count} messages in {elapsed:.1f}s ({message_count/elapsed:.1f} msg/s)")
                        
    except KeyboardInterrupt:
        print(f"\n=== FRAGILE CONSUMER RESULTS ===")
        elapsed = time.time() - start_time
        print(f"Total messages processed: {message_count}")
        print(f"Total time: {elapsed:.1f} seconds")
        print(f"Average throughput: {message_count/elapsed:.1f} messages/second")
        print("\n🚨 PROBLEMS OBSERVED:")
        print("  - Failed messages block all subsequent messages")
        print("  - Retry delays affect overall throughput")
        print("  - Consumer lag grows during retry loops")
        print("  - Other consumers can't rebalance properly")
        print("  - Resource waste on blocking retries")
    finally:
        consumer.close()


if __name__ == "__main__":
    fragile_consumer_loop()