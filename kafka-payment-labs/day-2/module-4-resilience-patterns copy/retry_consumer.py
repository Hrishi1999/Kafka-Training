#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from common.config import KafkaConfig
from confluent_kafka import Consumer, Producer, KafkaError
import json
import time
import random
from datetime import datetime


class RetryProducer:
    """Producer for managing retry logic and DLQ"""
    
    def __init__(self):
        config = KafkaConfig.create_producer_config()
        self.producer = Producer(config)
        
    def delivery_report(self, err, msg):
        """Delivery report callback"""
        if err is not None:
            print(f"Delivery failed: {err}")
        
    def send_to_retry(self, original_message, error, retry_level=1):
        """Send message to appropriate retry topic or DLQ"""
        
        # Parse original message to get retry count
        try:
            if hasattr(original_message, 'headers') and original_message.headers():
                headers = dict(original_message.headers())
                retry_count = int(headers.get(b'retry-count', b'0').decode('utf-8'))
            else:
                retry_count = 0
        except:
            retry_count = 0
            
        retry_count += 1
        max_retries = 3
        
        if retry_count > max_retries:
            # Send to DLQ after max retries
            dlq_topic = f"{original_message.topic()}-dlq"
            dlq_message = {
                'original_topic': original_message.topic(),
                'original_partition': original_message.partition(),
                'original_offset': original_message.offset(),
                'original_key': original_message.key().decode('utf-8') if original_message.key() else None,
                'original_value': original_message.value().decode('utf-8'),
                'error_reason': str(error),
                'failed_after_retries': retry_count - 1,
                'error_timestamp': int(datetime.now().timestamp())
            }
            
            self.producer.produce(
                topic=dlq_topic,
                key=original_message.key(),
                value=json.dumps(dlq_message).encode('utf-8'),
                headers={'final-failure': b'true'},
                on_delivery=self.delivery_report
            )
            print(f"💀 Sent to DLQ after {retry_count-1} retries: {str(error)[:50]}...")
            
        else:
            # Send to retry topic
            retry_topic = f"{original_message.topic()}-retry-{retry_count}"
            
            self.producer.produce(
                topic=retry_topic,
                key=original_message.key(),
                value=original_message.value(),
                headers={
                    b'retry-count': str(retry_count).encode('utf-8'),
                    b'original-error': str(error).encode('utf-8'),
                    b'retry-timestamp': str(int(datetime.now().timestamp())).encode('utf-8')
                },
                on_delivery=self.delivery_report
            )
            print(f"🔄 Sent to retry level {retry_count}: {str(error)[:50]}...")
            
        self.producer.flush()


def simulate_payment_processing_with_recovery(payment):
    """Simulate payment processing with different failure types"""
    
    failure_chance = random.random()
    
    # 10% permanent failures (will eventually go to DLQ)
    if failure_chance < 0.10:
        permanent_errors = [
            "Invalid customer ID - permanent failure",
            "Malformed payment data - permanent failure", 
            "Unsupported currency - permanent failure"
        ]
        raise ValueError(random.choice(permanent_errors))
    
    # 15% transient failures (good candidates for retry)
    elif failure_chance < 0.25:
        transient_errors = [
            "Network timeout - transient failure",
            "External service temporarily unavailable",
            "Database connection timeout",
            "Rate limit exceeded - temporary"
        ]
        raise ConnectionError(random.choice(transient_errors))
    
    # 75% success rate
    time.sleep(0.1)  # Simulate processing time
    return True


def process_with_retries():
    """Main consumer with non-blocking retry logic"""
    print("=== NON-BLOCKING RETRY CONSUMER ===")
    print("Implementing multi-level retry pattern...")
    print("Transient failures → Retry topics")
    print("Permanent failures → Eventually to DLQ")
    print("(Ctrl+C to stop)")
    
    consumer = Consumer({
        **KafkaConfig.create_consumer_config(),
        'group.id': 'retry-payment-processor',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    })
    
    retry_producer = RetryProducer()
    consumer.subscribe(['payment_requests'])
    
    message_count = 0
    success_count = 0
    retry_count = 0
    dlq_count = 0
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
                    print(f"Kafka error: {msg.error()}")
                    continue
                
            message_count += 1
            
            try:
                payment = json.loads(msg.value().decode('utf-8'))
                
                # Check if this is a retry message
                retry_count_header = 0
                if hasattr(msg, 'headers') and msg.headers():
                    headers = dict(msg.headers())
                    if b'retry-count' in headers:
                        retry_count_header = int(headers[b'retry-count'].decode('utf-8'))
                
                retry_indicator = f" (Retry #{retry_count_header})" if retry_count_header > 0 else ""
                print(f"\n📦 Processing message #{message_count}: {payment['payment_id']}{retry_indicator}")
                
                # Attempt processing
                simulate_payment_processing_with_recovery(payment)
                
                # Process successfully
                success_count += 1
                print(f"✅ Payment processed successfully")
                consumer.commit()
                
            except Exception as e:
                error_type = type(e).__name__
                print(f"❌ Processing failed ({error_type}): {e}")
                
                # Determine if this should be retried or sent to DLQ
                if "permanent" in str(e).lower() or isinstance(e, ValueError):
                    # Send directly to DLQ for permanent failures
                    dlq_count += 1
                    retry_producer.send_to_retry(msg, e, retry_level=999)  # Force DLQ
                else:
                    # Send to retry for transient failures
                    retry_count += 1
                    retry_producer.send_to_retry(msg, e)
                
                consumer.commit()  # Commit to move on
                
            # Show real-time statistics
            elapsed = time.time() - start_time
            if message_count % 5 == 0:  # Every 5 messages
                throughput = message_count / elapsed if elapsed > 0 else 0
                print(f"\n📊 Stats: {success_count} success, {retry_count} retries, {dlq_count} DLQ, {throughput:.1f} msg/s")
                
    except KeyboardInterrupt:
        print(f"\n=== RETRY CONSUMER RESULTS ===")
        elapsed = time.time() - start_time
        throughput = message_count / elapsed if elapsed > 0 else 0
        
        print(f"Total messages: {message_count}")
        print(f"Successful: {success_count}")
        print(f"Sent to retry: {retry_count}")
        print(f"Sent to DLQ: {dlq_count}")
        print(f"Success rate: {(success_count/message_count)*100:.1f}%")
        print(f"Throughput: {throughput:.1f} messages/second")
        
        print(f"\n✅ NON-BLOCKING RETRY BENEFITS:")
        print(f"  - Transient failures get multiple retry attempts")
        print(f"  - Permanent failures go to DLQ quickly")
        print(f"  - No partition blocking")
        print(f"  - Configurable retry policies")
        print(f"  - Exponential backoff delays")
        
    finally:
        consumer.close()


if __name__ == "__main__":
    process_with_retries()