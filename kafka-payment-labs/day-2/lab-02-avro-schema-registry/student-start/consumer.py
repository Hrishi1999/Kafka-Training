#!/usr/bin/env python3
"""
Avro Consumer - Lab 02
Your task: Implement a consumer using Avro deserialization
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import avro, KafkaError
from confluent_kafka.avro import AvroConsumer
from confluent_kafka.avro.serializer import SerializerError

def create_avro_consumer():
    """
    TODO: Create and return an AvroConsumer
    - Use KafkaConfig.create_avro_consumer_config() for Kafka consumer settings
    - Use KafkaConfig.create_schema_registry_config() for Schema Registry settings
    - Combine configs with schema.registry. prefix for the Schema Registry settings
    - Pass combined config to AvroConsumer
    """
    pass

def process_payment(payment):
    """
    TODO: Process the payment message
    - Payment is already deserialized to a dict
    - Extract and display all fields
    - Format nicely for output
    """
    pass

def main():
    """
    TODO: Main function to:
    1. Create Avro consumer
    2. Subscribe to 'payment_requests' topic
    3. Poll for messages in a loop
    4. Process each payment
    5. Handle SerializerError exceptions
    6. Allow graceful shutdown with Ctrl+C
    """
    print("Starting Avro consumer...")
    print("Press Ctrl+C to stop")
    
    # Your implementation here

if __name__ == "__main__":
    main()