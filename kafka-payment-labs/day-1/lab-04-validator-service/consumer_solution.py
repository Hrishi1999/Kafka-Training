#!/usr/bin/env python3
"""
Basic Kafka Consumer - Complete Solution
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
    
    consumer = None
    
    try:
        # Validate configuration
        KafkaConfig.validate_config()
        
        # Create consumer configuration
        config = KafkaConfig.create_consumer_config(
            group_id='payment-validator',
            auto_offset_reset='earliest'
        )
        
        # Create consumer instance
        consumer = Consumer(config)
        
        # Subscribe to the topic
        consumer.subscribe(['payment_requests'])
        
        print("🚀 Starting Payment Validator Consumer")
        print("=" * 50)
        print("Waiting for messages... (Press Ctrl+C to stop)")
        
        # Message counter
        message_count = 0
        error_count = 0
        
        # Poll loop
        while running:
            # Poll for messages
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                # No message within timeout
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
            else:
                # Process the message
                message_value = msg.value().decode('utf-8')
                
                # Show message metadata
                print(f"\n📨 Message #{message_count + 1}")
                print(f"   Topic: {msg.topic()}")
                print(f"   Partition: {msg.partition()}")
                print(f"   Offset: {msg.offset()}")
                
                # Process the payment
                if process_payment(message_value):
                    message_count += 1
                else:
                    error_count += 1
                
                print("-" * 40)
        
        # Graceful shutdown
        print(f"\n📊 Consumer Statistics:")
        print(f"   Messages Processed: {message_count}")
        print(f"   Errors: {error_count}")
        print(f"   Success Rate: {(message_count / (message_count + error_count) * 100):.1f}%")
        
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        # Always close the consumer
        if consumer:
            print("🔒 Closing consumer...")
            consumer.close()
            print("✅ Consumer closed successfully")


if __name__ == "__main__":
    main()