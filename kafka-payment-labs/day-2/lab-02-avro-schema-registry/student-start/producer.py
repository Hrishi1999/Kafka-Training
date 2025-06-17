#!/usr/bin/env python3
"""
Avro Producer - Lab 02
Your task: Implement a producer using Avro serialization and Schema Registry
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer
import json
import uuid
import random
import time
from datetime import datetime

def load_avro_schema(schema_path):
    """
    TODO: Load and return Avro schema from file
    - Open the schema file
    - Parse it as JSON
    - Return the parsed schema
    """
    pass

def create_avro_producer(schema):
    """
    TODO: Create and return an AvroProducer
    - Use KafkaConfig.create_avro_producer_config() for Kafka producer settings
    - Use KafkaConfig.create_schema_registry_config() for Schema Registry settings
    - Combine configs with schema.registry. prefix for the Schema Registry settings
    - Pass combined config and default_value_schema=schema to AvroProducer
    """
    pass

def generate_payment():
    """
    TODO: Generate a payment dictionary
    Same as Lab 01 but ensure types match schema:
    - payment_id: string
    - amount: float (will become double)
    - currency: string
    - customer_id: string  
    - timestamp: int (will become long)
    """
    pass

def send_payment(producer, payment):
    """
    TODO: Send payment to 'payment_requests' topic
    - Use producer.produce()
    - Add delivery callback to confirm success
    - Handle any errors
    """
    pass

def test_schema_validation(producer):
    """
    TODO: Test schema validation by trying to send invalid data
    - Try sending amount as string
    - Try sending without required field
    - Try sending with extra field
    - Catch and print exceptions
    """
    pass

def main():
    """
    TODO: Main function to:
    1. Load schema from '../schemas/payment.avsc'
    2. Create Avro producer
    3. Send 5 valid payments
    4. Test schema validation
    5. Properly close producer
    """
    print("Starting Avro producer...")
    
    # Your implementation here

if __name__ == "__main__":
    main()