#!/usr/bin/env python3
"""
JSON Producer - Lab 01
Your task: Implement a producer that sends payment messages as JSON
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Producer
import json
import time
import uuid
import random
from datetime import datetime

def create_producer():
    """
    TODO: Create and return a Producer instance
    - Use KafkaConfig.create_producer_config() for Confluent Cloud connection
    """
    pass

def generate_payment():
    """
    TODO: Generate a payment dictionary with the following fields:
    - payment_id: unique identifier (use uuid.uuid4())
    - amount: random amount between 10.00 and 1000.00
    - currency: randomly choose from ['USD', 'EUR', 'GBP']
    - customer_id: format as 'CUST-XXXX' where X is a digit
    - timestamp: current Unix timestamp (int)
    """
    pass

def send_payment(producer, payment):
    """
    TODO: Send payment to 'payment_requests' topic
    - Serialize payment to JSON bytes
    - Use producer.produce() method
    - Call producer.poll(0) to trigger callbacks
    - Print confirmation of sent message
    """
    pass

def main():
    """
    TODO: Main function to:
    1. Create producer
    2. Generate and send 5 payment messages
    3. Add small delay between messages
    4. Call producer.flush() to ensure delivery
    """
    print("Starting JSON producer...")
    
    # Your implementation here

if __name__ == "__main__":
    main()