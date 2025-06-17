#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from common.config import KafkaConfig
from confluent_kafka import Producer
import json
import uuid
import time


def delivery_report(err, msg):
    """Delivery report callback"""
    if err is not None:
        print(f"Failed to produce message: {err}")
    else:
        print(f"Produced message to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")


def generate_payment():
    """Generate Day 1 style JSON payment"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": 99.99,
        "currency": "USD",
        "customer_id": "CUST-1234",
        "timestamp": int(time.time())
    }


def main():
    """Day 1 JSON producer - working baseline"""
    config = KafkaConfig.create_producer_config()
    config['on_delivery'] = delivery_report
    
    producer = Producer(config)
    
    print("=== Day 1 JSON Producer (Baseline) ===")
    print("Sending valid JSON payments...")
    
    for i in range(5):
        payment = generate_payment()
        producer.produce(
            topic='payment_requests',
            key=payment["customer_id"],
            value=json.dumps(payment)
        )
        print(f"Sent payment {i+1}: {payment}")
        time.sleep(1)
    
    producer.flush()
    print("All messages sent successfully!")


if __name__ == "__main__":
    main()