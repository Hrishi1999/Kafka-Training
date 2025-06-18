#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from common.config import KafkaConfig
from confluent_kafka import Consumer, Producer, KafkaError
import json
import time
import random
from datetime import datetime


class DLQProducer:
    """Producer for sending failed messages to Dead Letter Queue"""
    
    def __init__(self):
        config = KafkaConfig.create_producer_config()
        self.producer = Producer(config)
        
    def delivery_report(self, err, msg):
        """Delivery report callback"""
        if err is not None:
            print(f"DLQ delivery failed: {err}")
        else:
            print(f"📨 DLQ message delivered: {msg.topic()}")
        
    def send_to_dlq(self, original_message, error, topic_name):
        """Send failed message to Dead Letter Queue with metadata"""
        
        # Create DLQ message with error context
        dlq_message = {
            'original_topic': original_message.topic(),
            'original_partition': original_message.partition(),
            'original_offset': original_message.offset(),
            'original_key': original_message.key().decode('utf-8') if original_message.key() else None,
            'original_value': original_message.value().decode('utf-8'),
            'error_reason': str(error),
            'error_timestamp': int(datetime.now().timestamp()),
            'failed_processing_attempts': 1
        }
        
        # Send to DLQ topic
        dlq_topic = f"{topic_name}-dlq"
        self.producer.produce(
            topic=dlq_topic,
            key=original_message.key(),
            value=json.dumps(dlq_message).encode('utf-8'),
            headers={
                'error-reason': str(error).encode('utf-8'),
                'error-timestamp': str(int(datetime.now().timestamp())).encode('utf-8'),
                'original-topic': original_message.topic().encode('utf-8')
            },
            on_delivery=self.delivery_report
        )
        self.producer.flush()
        print(f"📨 Sent to DLQ: {dlq_topic}")


def create_consumer():
    """Create consumer with manual offset management"""
    config = KafkaConfig.create_consumer_config()
    config.update({
        'group.id': 'dlq-payment-processor',
        'auto.offset.reset': 'earliest', 
        'enable.auto.commit': False
    })
    return Consumer(config)


def simulate_payment_processing(payment):
    """Simulate payment processing with various failure types"""
    
    # Simulate different failure scenarios
    failure_chance = random.random()
    
    if failure_chance < 0.05:  # 5% - Invalid customer
        raise ValueError("Invalid customer ID - permanent failure")
    elif failure_chance < 0.10:  # 5% - Insufficient funds  
        raise ValueError("Insufficient funds - business logic failure")
    elif failure_chance < 0.15:  # 5% - Network timeout
        raise ConnectionError("Network timeout - transient failure")
    elif failure_chance < 0.20:  # 5% - Service unavailable
        raise Exception("External service unavailable - transient failure")
    
    # Successful processing
    time.sleep(0.1)  # Simulate processing time
    return True


def process_payment_with_dlq():
    """Non-blocking consumer with DLQ pattern"""
    print("=== DLQ CONSUMER DEMO ===")
    print("Implementing Dead Letter Queue pattern...")
    print("Failed messages go to DLQ, processing continues!")
    print("(Ctrl+C to stop)")
    
    consumer = create_consumer()
    dlq_producer = DLQProducer()
    consumer.subscribe(['payment_requests'])  # Using Day 1 JSON topic
    
    message_count = 0
    success_count = 0
    failure_count = 0
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
                # Parse and process payment
                payment = json.loads(msg.value().decode('utf-8'))
                
                print(f"\n📦 Processing message #{message_count}: {payment['payment_id']}")
                
                # Attempt processing
                simulate_payment_processing(payment)
                
                # Process successfully
                success_count += 1
                print(f"✅ Payment processed successfully")
                
                # Commit immediately after success
                consumer.commit()
                
            except Exception as e:
                failure_count += 1
                print(f"❌ Processing failed: {e}")
                
                # Send to DLQ instead of retrying
                dlq_producer.send_to_dlq(msg, e, 'payment_requests')
                
                # Commit the offset to skip the poison pill
                consumer.commit()
                print(f"⏭️  Message sent to DLQ, continuing with next message")
                
            # Show real-time statistics
            elapsed = time.time() - start_time
            if message_count % 5 == 0:  # Every 5 messages
                throughput = message_count / elapsed if elapsed > 0 else 0
                print(f"\n📊 Stats: {success_count} success, {failure_count} failed, {throughput:.1f} msg/s")
                
    except KeyboardInterrupt:
        print(f"\n=== DLQ CONSUMER RESULTS ===")
        elapsed = time.time() - start_time
        throughput = message_count / elapsed if elapsed > 0 else 0
        
        print(f"Total messages: {message_count}")
        print(f"Successful: {success_count}")
        print(f"Failed (sent to DLQ): {failure_count}")
        print(f"Success rate: {(success_count/message_count)*100:.1f}%")
        print(f"Throughput: {throughput:.1f} messages/second")
        print(f"Processing time: {elapsed:.1f} seconds")
        
        print(f"\n✅ KEY BENEFITS:")
        print(f"  - No blocking: Failed messages don't stop processing")
        print(f"  - Fast recovery: Immediate continuation after failures")
        print(f"  - Error tracking: All failures captured in DLQ")
        print(f"  - Consistent throughput: No retry delays")
        
    finally:
        consumer.close()


if __name__ == "__main__":
    process_payment_with_dlq()