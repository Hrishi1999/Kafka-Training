#!/usr/bin/env python3
"""
Basic Kafka Producer - Complete Solution
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Producer
from common.config import KafkaConfig
import json
import time


def delivery_callback(err, msg):
    """
    Callback function called once for each message produced.
    
    Args:
        err: Error if produce failed, None if successful
        msg: Message object containing topic, partition, offset, etc.
    """
    if err is not None:
        print(f"❌ Message delivery failed: {err}")
    else:
        # Decode the message value to show what was sent
        value = json.loads(msg.value().decode('utf-8'))
        print(f"✅ Message delivered to {msg.topic()} "
              f"[partition {msg.partition()}] at offset {msg.offset()}")
        print(f"   Payment ID: {value['payment_id']}, Amount: ${value['amount']}")


def create_payment_message(payment_id: int) -> dict:
    """Create a sample payment message"""
    return {
        'payment_id': f'PAY{payment_id:04d}',
        'amount': 100.00 + (payment_id * 10),
        'currency': 'USD',
        'customer_id': f'CUST{(payment_id % 10):03d}',
        'timestamp': int(time.time() * 1000)
    }


def main():
    """Main producer function"""
    try:
        # Validate configuration
        KafkaConfig.validate_config()
        
        # Create producer configuration
        config = KafkaConfig.create_producer_config()
        
        # Create producer instance
        producer = Producer(config)

        config['batch.size'] = 65536           # 64KB batches
        config['linger.ms'] = 10               # Wait 10ms for more records
        config['compression.type'] = 'snappy'   # Snappy compression
        config['buffer.memory'] = 67108864     # 64MB buffer
        
        print("🚀 Starting Kafka Producer")
        print("=" * 50)
        
        # Configuration for our messages
        topic = 'payment_requests'
        num_messages = 10
        
        # Send messages to Kafka
        for i in range(num_messages):
            # Create payment message
            payment = create_payment_message(i)
            
            # Convert to JSON
            message_value = json.dumps(payment)
            
            # Send to Kafka
            producer.produce(
                topic=topic,
                value=message_value.encode('utf-8'),
                callback=delivery_callback
            )
            
            # Trigger callbacks for previously sent messages
            producer.poll(0)
            
            # Small delay to see messages being sent
            time.sleep(0.1)
        
        print(f"\n📤 Initiated sending {num_messages} messages")
        
        # Wait for all messages to be delivered
        print("\n⏳ Waiting for message delivery...")
        producer.flush(timeout=10)
        
        print("\n✅ All messages delivered successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()