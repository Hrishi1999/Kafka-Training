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
        # TODO 4: Process the payment message
        # 1. Parse the JSON message
        # 2. Extract payment details (payment_id, amount, customer_id)
        # 3. Print the payment information
        # 4. Return True if successful
        
        # Your code here
        pass
        
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
        
        # TODO 1: Create consumer configuration
        # Use KafkaConfig.create_consumer_config() with:
        # - group_id: 'payment-validator'
        # - auto_offset_reset: 'earliest'
        config = {}  # Replace with actual configuration
        
        # Create consumer instance
        consumer = Consumer(config)
        
        # TODO 2: Subscribe to the topic
        # Subscribe to 'payment_requests' topic
        # Hint: consumer.subscribe(['topic_name'])
        
        print("🚀 Starting Payment Validator Consumer")
        print("=" * 50)
        print("Waiting for messages... (Press Ctrl+C to stop)")
        
        # Message counter
        message_count = 0
        
        # TODO 3: Implement the poll loop
        # While running is True:
        # 1. Poll for a message with timeout of 1.0 second
        # 2. If message is None, continue
        # 3. If message has an error, handle it
        # 4. Otherwise, process the message value
        # 5. Increment message_count
        
        while running:
            # Your code here
            pass
        
        # TODO 5: Handle graceful shutdown
        # 1. Print the total messages processed
        # 2. Close the consumer
        
        # Your cleanup code here
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()