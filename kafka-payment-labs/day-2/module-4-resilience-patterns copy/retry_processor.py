#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from common.config import KafkaConfig
from confluent_kafka import Consumer, Producer, KafkaError
import time
import threading
import json
from datetime import datetime


def create_retry_processor(retry_level, delay_seconds):
    """Create a processor for a specific retry level"""
    
    def process_retry_topic():
        config = KafkaConfig.create_consumer_config()
        config.update({
            'group.id': f'retry-processor-{retry_level}',
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        })
        
        consumer = Consumer(config)
        
        producer_config = KafkaConfig.create_producer_config()
        producer = Producer(producer_config)
        
        retry_topic = f'payment_requests-retry-{retry_level}'
        consumer.subscribe([retry_topic])
        
        print(f"🔄 Started retry processor for level {retry_level} (delay: {delay_seconds}s)")
        
        messages_processed = 0
        
        try:
            while True:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"Retry processor {retry_level} error: {msg.error()}")
                        continue
                        
                messages_processed += 1
                
                # Extract retry metadata
                headers = {}
                if hasattr(msg, 'headers') and msg.headers():
                    headers = dict(msg.headers())
                
                retry_count = headers.get(b'retry-count', b'0').decode('utf-8')
                original_error = headers.get(b'original-error', b'unknown').decode('utf-8')
                retry_timestamp = headers.get(b'retry-timestamp', b'0').decode('utf-8')
                
                print(f"⏰ Level {retry_level} - Processing retry #{retry_count} (waiting {delay_seconds}s)")
                print(f"   Original error: {original_error[:60]}...")
                
                # Wait for backoff period
                time.sleep(delay_seconds)
                
                # Send back to main topic for retry
                producer.produce(
                    topic='payment_requests',
                    key=msg.key(),
                    value=msg.value(),
                    headers=msg.headers()
                )
                producer.flush()
                
                consumer.commit()
                print(f"🔁 Retried message from level {retry_level} back to main topic")
                
                # Show processor statistics
                if messages_processed % 5 == 0:
                    print(f"📊 Retry processor {retry_level}: {messages_processed} messages processed")
                
        except KeyboardInterrupt:
            print(f"\n🛑 Retry processor {retry_level} stopping... ({messages_processed} messages processed)")
        except Exception as e:
            print(f"❌ Retry processor {retry_level} error: {e}")
        finally:
            consumer.close()
    
    return process_retry_topic


def create_dlq_monitor():
    """Monitor DLQ messages for analysis"""
    
    def monitor_dlq():
        config = KafkaConfig.create_consumer_config()
        config.update({
            'group.id': 'dlq-monitor',
            'auto.offset.reset': 'latest'  # Only new DLQ messages
        })
        
        consumer = Consumer(config)
        consumer.subscribe(['payment_requests-dlq'])
        
        print(f"👁️  DLQ Monitor started - watching for failed messages...")
        
        dlq_count = 0
        
        try:
            while True:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        continue
                        
                dlq_count += 1
                
                try:
                    dlq_data = json.loads(msg.value().decode('utf-8'))
                    error_reason = dlq_data.get('error_reason', 'Unknown')
                    failed_retries = dlq_data.get('failed_after_retries', 0)
                    
                    print(f"💀 DLQ Alert #{dlq_count}: {error_reason[:60]}")
                    print(f"   Failed after {failed_retries} retry attempts")
                    print(f"   Topic: {dlq_data.get('original_topic', 'unknown')}")
                    
                except Exception as e:
                    print(f"⚠️  Error parsing DLQ message: {e}")
                
        except KeyboardInterrupt:
            print(f"\n👁️  DLQ Monitor stopping... ({dlq_count} DLQ messages observed)")
        finally:
            consumer.close()
    
    return monitor_dlq


def main():
    """Run all retry processors and DLQ monitor in parallel"""
    print("🚀 STARTING RETRY PROCESSING SYSTEM")
    print("=" * 50)
    print("This system implements non-blocking retry with exponential backoff:")
    print("- Level 1: 5 second delay")
    print("- Level 2: 15 second delay") 
    print("- Level 3: 60 second delay")
    print("- Failed after 3 retries → DLQ")
    print("- DLQ monitor for real-time alerts")
    print()
    
    # Create retry processors with exponential backoff
    processors = [
        (1, 5),   # Level 1: 5 second delay
        (2, 15),  # Level 2: 15 second delay  
        (3, 60),  # Level 3: 60 second delay
    ]
    
    threads = []
    
    # Start retry processors
    for level, delay in processors:
        processor_func = create_retry_processor(level, delay)
        thread = threading.Thread(target=processor_func, name=f"RetryProcessor-{level}")
        thread.daemon = True
        thread.start()
        threads.append(thread)
    
    # Start DLQ monitor
    dlq_monitor_func = create_dlq_monitor()
    dlq_thread = threading.Thread(target=dlq_monitor_func, name="DLQMonitor")
    dlq_thread.daemon = True
    dlq_thread.start()
    threads.append(dlq_thread)
    
    print(f"✅ All {len(threads)} threads started successfully!")
    print(f"💡 Now run: python retry_consumer.py in another terminal")
    print(f"🔄 Watch messages flow through the retry system")
    print(f"💀 Monitor DLQ for permanently failed messages")
    print(f"\nPress Ctrl+C to stop all processors...")
    
    try:
        # Keep main thread alive and show status
        start_time = time.time()
        while True:
            time.sleep(30)  # Status update every 30 seconds
            elapsed = time.time() - start_time
            alive_threads = sum(1 for t in threads if t.is_alive())
            print(f"🔄 Retry system running for {elapsed/60:.1f} minutes - {alive_threads}/{len(threads)} processors active")
            
    except KeyboardInterrupt:
        print(f"\n🛑 Shutting down retry processing system...")
        print(f"   Waiting for threads to finish...")
        
        # Give threads a moment to clean up
        time.sleep(2)
        
        print(f"✅ Retry processing system stopped")
        print(f"\n📊 SYSTEM STATISTICS:")
        print(f"   - Runtime: {(time.time() - start_time)/60:.1f} minutes")
        print(f"   - Processors: {len(processors)} retry levels + 1 DLQ monitor")
        print(f"   - Pattern: Non-blocking retry with exponential backoff")


if __name__ == "__main__":
    main()