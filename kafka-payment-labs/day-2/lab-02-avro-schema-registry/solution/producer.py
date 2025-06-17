#!/usr/bin/env python3
"""
Avro Producer Solution - Lab 02
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
    """Load and return Avro schema from file"""
    with open(schema_path, 'r') as f:
        return avro.loads(json.dumps(json.load(f)))

def delivery_report(err, msg):
    """Delivery callback for produced messages"""
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

def create_avro_producer(schema):
    """Create and return an AvroProducer"""
    # Use prefixed configuration approach for better compatibility
    producer_config = KafkaConfig.create_avro_producer_config()
    schema_registry_config = KafkaConfig.create_schema_registry_config()
    
    # Combine configurations with schema.registry. prefix
    # Try different authentication key names for Schema Registry
    import os
    config = {
        **producer_config,
        'schema.registry.url': os.getenv('SCHEMA_REGISTRY_URL'),
        'schema.registry.basic.auth.credentials.source': 'USER_INFO',
        'schema.registry.basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}",
        'on_delivery': delivery_report
    }
    
    return AvroProducer(config, default_value_schema=schema)

def generate_payment():
    """Generate a payment dictionary"""
    return {
        'payment_id': str(uuid.uuid4()),
        'amount': round(random.uniform(10.00, 1000.00), 2),
        'currency': random.choice(['USD', 'EUR', 'GBP']),
        'customer_id': f'CUST-{random.randint(1000, 9999)}',
        'timestamp': int(datetime.now().timestamp())
    }

def send_payment(producer, payment):
    """Send payment to 'payments-avro' topic"""
    try:
        producer.produce(topic='payment_requests', value=payment)
        producer.poll(0)  # Trigger delivery callbacks
    except Exception as e:
        print(f"Failed to produce message: {e}")

def test_schema_validation(producer):
    """Test schema validation by trying to send invalid data"""
    print("\nTesting schema validation...")
    
    # Test 1: Invalid data type (amount as string)
    print("\n1. Testing invalid data type (amount as string):")
    try:
        bad_payment = generate_payment()
        bad_payment['amount'] = "100.50"  # String instead of double
        producer.produce(topic='payment_requests', value=bad_payment)
        producer.flush()
    except Exception as e:
        print(f"✓ Correctly rejected: {e}")
    
    # Test 2: Missing required field
    print("\n2. Testing missing required field (customer_id):")
    try:
        bad_payment = generate_payment()
        del bad_payment['customer_id']
        producer.produce(topic='payment_requests', value=bad_payment)
        producer.flush()
    except Exception as e:
        print(f"✓ Correctly rejected: {e}")
    
    # Test 3: Extra field not in schema
    print("\n3. Testing extra field not in schema:")
    try:
        bad_payment = generate_payment()
        bad_payment['extra_field'] = "This shouldn't be here"
        producer.produce(topic='payment_requests', value=bad_payment)
        producer.flush()
        print("✓ Extra fields are ignored by Avro (forward compatible)")
    except Exception as e:
        print(f"Failed: {e}")

def main():
    """Main function"""
    print("Starting Avro producer...")
    
    # Load schema
    schema = load_avro_schema('../schemas/payment.avsc')
    
    # Create producer
    producer = create_avro_producer(schema)
    
    try:
        # Send 5 valid payments
        print("\nSending valid payments...")
        for i in range(5):
            payment = generate_payment()
            print(f"\nSending payment {i+1}: {payment['payment_id']}")
            send_payment(producer, payment)
            time.sleep(0.5)
        
        # Flush to ensure all messages are sent
        producer.flush()
        
        # Test schema validation
        test_schema_validation(producer)
        
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        producer.flush()
        print("\nProducer closed")

if __name__ == "__main__":
    main()