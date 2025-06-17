#!/usr/bin/env python3
"""
JSON Consumer - Lab 01
Your task: Implement a consumer that reads payment messages as JSON
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
import json

def create_consumer():
    """
    TODO: Create and return a Consumer instance
    - Use KafkaConfig.create_consumer_config() for Confluent Cloud connection
    - Subscribe to 'payment_requests' topic
    - Set group_id to 'payment-processor'
    - Set auto_offset_reset to 'earliest'
    """
    pass

def process_payment(payment):
    """
    TODO: Process and display payment information
    - Extract all fields safely (handle missing fields)
    - Format and print payment details
    - Return True if successful, False if error
    """
    pass

def main():
    """
    TODO: Main function to:
    1. Create consumer
    2. Continuously poll for messages using consumer.poll()
    3. Check for errors with msg.error()
    4. Deserialize JSON from msg.value()
    5. Process each payment
    6. Handle JSON parsing errors gracefully
    7. Allow graceful shutdown with Ctrl+C
    """
    print("Starting JSON consumer...")
    print("Press Ctrl+C to stop")
    
    # Your implementation here

if __name__ == "__main__":
    main()