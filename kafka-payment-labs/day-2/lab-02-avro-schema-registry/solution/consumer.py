#!/usr/bin/env python3
"""
Avro Consumer Solution - Lab 02
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import avro, KafkaError
from confluent_kafka.avro import AvroConsumer
from confluent_kafka.avro.serializer import SerializerError
from datetime import datetime

def create_avro_consumer():
    """Create and return an AvroConsumer"""
    # Use prefixed configuration approach for better compatibility
    consumer_config = KafkaConfig.create_avro_consumer_config(
        group_id='payment-processor-avro',
        enable_auto_commit=True
    )
    
    # Combine configurations with schema.registry. prefix
    # Use the same authentication format as producer
    import os
    config = {
        **consumer_config,
        'schema.registry.url': os.getenv('SCHEMA_REGISTRY_URL'),
        'schema.registry.basic.auth.credentials.source': 'USER_INFO',
        'schema.registry.basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}",
        'auto.commit.interval.ms': 5000
    }
    
    return AvroConsumer(config)

def process_payment(payment):
    """Process the payment message"""
    # Convert timestamp to readable format
    timestamp_str = datetime.fromtimestamp(payment['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\nPayment received:")
    print(f"  ID: {payment['payment_id']}")
    print(f"  Amount: {payment['amount']:.2f} {payment['currency']}")
    print(f"  Customer: {payment['customer_id']}")
    print(f"  Timestamp: {timestamp_str}")
    
    # Check if there are any additional fields (for schema evolution testing)
    expected_fields = {'payment_id', 'amount', 'currency', 'customer_id', 'timestamp'}
    extra_fields = set(payment.keys()) - expected_fields
    if extra_fields:
        print(f"  Additional fields: {extra_fields}")
        for field in extra_fields:
            print(f"    {field}: {payment[field]}")

def main():
    """Main function"""
    print("Starting Avro consumer...")
    print("Press Ctrl+C to stop")
    
    consumer = create_avro_consumer()
    consumer.subscribe(['payment_requests'])
    
    try:
        while True:
            try:
                msg = consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print(f"Reached end of partition {msg.partition()}")
                    else:
                        print(f"Error: {msg.error()}")
                    continue
                
                # Message is automatically deserialized
                payment = msg.value()
                process_payment(payment)
                
            except SerializerError as e:
                print(f"Message deserialization failed: {e}")
                # This would happen if schema evolution breaks compatibility
                
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        consumer.close()
        print("Consumer closed")

if __name__ == "__main__":
    main()