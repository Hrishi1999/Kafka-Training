#!/usr/bin/env python3
"""
Basic Kafka Producer - Starter Code
Complete the TODOs to build your first producer
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
    # TODO 2: Implement the delivery callback
    # - If err is not None, print an error message
    # - If successful, print the topic, partition, and offset
    pass  # Remove this when you implement


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
        
        # TODO 1: Create producer configuration using KafkaConfig
        # Hint: Use KafkaConfig.create_producer_config()
        config = {}  # Replace with actual configuration
        
        # Create producer instance
        producer = Producer(config)
        
        print("🚀 Starting Kafka Producer")
        print("=" * 50)
        
        # Configuration for our messages
        topic = 'payment_requests'
        num_messages = 10
        
        # TODO 3: Send messages to Kafka
        # For each message:
        # 1. Create a payment message using create_payment_message()
        # 2. Convert to JSON string
        # 3. Call producer.produce() with:
        #    - topic name
        #    - value (JSON string encoded as bytes)
        #    - callback function
        # 4. Call producer.poll(0) to trigger callbacks
        
        for i in range(num_messages):
            # Your code here
            pass
        
        print(f"\n📤 Initiated sending {num_messages} messages")
        
        # TODO 4: Ensure all messages are sent
        # Hint: Use producer.flush() with a timeout
        # This blocks until all messages are delivered
        
        # Print final statistics
        print("\n📊 Producer Statistics:")
        print("-" * 50)
        # The stats are returned as a JSON string
        stats = producer.poll(0)  # Get any remaining callbacks
        
        print("\n✅ Producer completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()