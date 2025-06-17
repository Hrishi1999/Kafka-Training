#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
import json


def main():
    """Day 1 JSON consumer - working baseline"""
    config = KafkaConfig.create_consumer_config()
    config['group.id'] = 'day1-payment-consumer'
    config['auto.offset.reset'] = 'earliest'
    
    consumer = Consumer(config)
    consumer.subscribe(['payment_requests'])
    
    print("=== Day 1 JSON Consumer (Baseline) ===")
    print("Waiting for messages... (Ctrl+C to stop)")
    
    try:
        while True:
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
                
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print(f"End of partition reached: {msg.topic()} [{msg.partition()}]")
                else:
                    print(f"Error: {msg.error()}")
                continue
            
            try:
                # Manual JSON parsing
                payment = json.loads(msg.value().decode('utf-8'))
                print(f"✅ Received payment: {payment}")
                
                # Basic validation (that might fail!)
                if not isinstance(payment.get('amount'), (int, float)):
                    print(f"⚠️  Warning: amount is not numeric: {payment.get('amount')}")
                
                if 'customer_id' not in payment:
                    print(f"⚠️  Warning: missing customer_id in payment: {payment}")
                    
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON: {e}")
            except Exception as e:
                print(f"❌ Error processing payment: {e}")
                
    except KeyboardInterrupt:
        print("\nShutting down consumer...")
    finally:
        consumer.close()


if __name__ == "__main__":
    main()