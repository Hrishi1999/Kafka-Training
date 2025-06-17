#!/usr/bin/env python3
"""
Basic Kafka Consumer - Starter Code
Complete the TODOs to build your first consumer
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Consumer, KafkaError, KafkaException
from common.config import KafkaConfig
import json
import signal


# Global flag for graceful shutdown
running = True


def signal_handler(sig, frame):
    """Handle Ctrl+C for graceful shutdown"""
    global running
    print("\n⚠️  Shutting down gracefully...")
    running = False


def process_payment(message_value: str) -> bool:
    """
    Process a payment message
    
    Args:
        message_value: JSON string of the payment
        
    Returns:
        True if processing succeeded, False otherwise
    """
    try:
        # Parse the JSON message
        payment = json.loads(message_value)
        
        # Extract payment details
        payment_id = payment.get('payment_id', 'Unknown')
        amount = payment.get('amount', 0)
        customer_id = payment.get('customer_id', 'Unknown')
        currency = payment.get('currency', 'USD')
        
        # Print payment information
        print(f"💳 Processing Payment:")
        print(f"   ID: {payment_id}")
        print(f"   Customer: {customer_id}")
        print(f"   Amount: {currency} {amount:.2f}")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in message: {e}")
        return False
    except Exception as e:
        print(f"❌ Error processing payment: {e}")
        return False


def main():
    """Main consumer function"""
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Validate configuration
        KafkaConfig.validate_config()
        
        # Use KafkaConfig.create_consumer_config() with:
        # - group_id: 'payment-validator'
        # - auto_offset_reset: 'earliest'
        config = KafkaConfig.create_consumer_config(
            group_id='payment-validator',
            auto_offset_reset='earliest'
        )        
        # Create consumer instance
        consumer = Consumer(config)
        
        # Subscribe to 'payment_requests' topic
        # Hint: consumer.subscribe(['topic_name'])
        consumer.subscribe(['payment_requests'])
        
        print("🚀 Starting Payment Validator Consumer")
        print("=" * 50)
        print("Waiting for messages... (Press Ctrl+C to stop)")
        
        # Message counter
        message_count = 0
        error_count = 0        
        # While running is True:
        # 1. Poll for a message with timeout of 1.0 second
        # 2. If message is None, continue
        # 3. If message has an error, handle it
        # 4. Otherwise, process the message value
        # 5. Increment message_count
        
        while running:

            msg = consumer.poll(timeout=100)
            if msg is None:
                continue

            if msg.error():
                # Handle errors
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition - this is normal
                    print(f"📭 Reached end of partition {msg.partition()}")
                else:
                    # Real error
                    print(f"❌ Consumer error: {msg.error()}")
                    error_count += 1
                    # retryable -> retry topic
                    # else go to dlt topic
            else:
                message_value = msg.value().decode('utf-8')
                # Show message metadata
                print(f"\n📨 Message #{message_count + 1}")
                print(f"   Topic: {msg.topic()}")
                print(f"   Partition: {msg.partition()}")
                print(f"   Offset: {msg.offset()}")

                if process_payment(message_value):
                    message_count += 1
                else:
                    error_count += 1
                    # retry topic
                
                print("-" * 40)

        # TODO 5: Handle graceful shutdown
        # 1. Print the total messages processed
        # 2. Close the consumer
        
        # Your cleanup code here
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()