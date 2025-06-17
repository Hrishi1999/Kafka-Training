#!/usr/bin/env python3
"""
JSON Producer Solution - Lab 01
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
    """Create and return a Producer instance"""
    config = KafkaConfig.create_producer_config()
    return Producer(config)

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
    """Send payment to 'payments-json' topic"""
    # Serialize payment to JSON
    value = json.dumps(payment).encode('utf-8')
    
    # Produce message
    producer.produce(
        topic='payment_requests',
        value=value,
        callback=lambda err, msg: delivery_report(err, msg, payment['payment_id'])
    )
    producer.poll(0)  # Trigger callbacks

def delivery_report(err, msg, payment_id):
    """Delivery callback"""
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        print(f"Sent payment {payment_id} to partition {msg.partition()} at offset {msg.offset()}")

def send_malformed_payments(producer):
    """Send intentionally malformed messages to demonstrate problems"""
    print("\nSending malformed messages...")
    
    # Malformed message 1: amount as string
    bad_payment1 = generate_payment()
    bad_payment1['amount'] = "100.50"  # String instead of float
    producer.produce('payments-json', value=json.dumps(bad_payment1).encode('utf-8'))
    print("Sent payment with string amount")
    
    # Malformed message 2: misspelled field
    bad_payment2 = generate_payment()
    bad_payment2['curency'] = bad_payment2.pop('currency')  # Misspelled
    producer.produce('payments-json', value=json.dumps(bad_payment2).encode('utf-8'))
    print("Sent payment with misspelled 'curency' field")
    
    # Malformed message 3: missing required field
    bad_payment3 = generate_payment()
    del bad_payment3['customer_id']
    producer.produce('payments-json', value=json.dumps(bad_payment3).encode('utf-8'))
    print("Sent payment missing customer_id")
    
    producer.flush()

def main():
    """Main function"""
    print("Starting JSON producer...")
    
    producer = create_producer()
    
    try:
        # Send 5 valid payments
        print("Sending valid payments...")
        for _ in range(5):
            payment = generate_payment()
            send_payment(producer, payment)
            time.sleep(0.5)
        
        # Uncomment to send malformed messages
        # send_malformed_payments(producer)
        
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        producer.flush()
        print("Producer flushed and closed")

if __name__ == "__main__":
    main()