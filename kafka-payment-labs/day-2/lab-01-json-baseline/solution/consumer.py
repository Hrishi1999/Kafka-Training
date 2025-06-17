#!/usr/bin/env python3
"""
JSON Consumer Solution - Lab 01
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
import json

def create_consumer():
    """Create and return a Consumer instance"""
    config = KafkaConfig.create_consumer_config(
        group_id='payment-processor',
        auto_offset_reset='earliest',
        enable_auto_commit=True
    )
    
    consumer = Consumer(config)
    consumer.subscribe(['payment_requests'])
    return consumer

def process_payment(payment):
    """Process and display payment information"""
    try:
        # Try to extract all expected fields
        payment_id = payment.get('payment_id', 'UNKNOWN')
        amount = payment.get('amount', 0.0)
        currency = payment.get('currency', 'UNKNOWN')
        customer_id = payment.get('customer_id', 'UNKNOWN')
        timestamp = payment.get('timestamp', 0)
        
        # Check for data type issues
        if isinstance(amount, str):
            print(f"WARNING: Amount is string, not float: {amount}")
            amount = float(amount)
        
        # Check for missing fields
        missing_fields = []
        for field in ['payment_id', 'amount', 'currency', 'customer_id', 'timestamp']:
            if field not in payment:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"WARNING: Missing fields: {missing_fields}")
        
        # Check for unexpected fields
        expected_fields = {'payment_id', 'amount', 'currency', 'customer_id', 'timestamp'}
        unexpected_fields = set(payment.keys()) - expected_fields
        if unexpected_fields:
            print(f"WARNING: Unexpected fields: {unexpected_fields}")
        
        # Display payment
        print(f"\nPayment received:")
        print(f"  ID: {payment_id}")
        print(f"  Amount: {amount} {currency}")
        print(f"  Customer: {customer_id}")
        print(f"  Timestamp: {timestamp}")
        
        return True
        
    except Exception as e:
        print(f"ERROR processing payment: {e}")
        print(f"Raw payment data: {payment}")
        return False

def main():
    """Main function"""
    print("Starting JSON consumer...")
    print("Press Ctrl+C to stop")
    
    consumer = create_consumer()
    
    try:
        while True:
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
                
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Consumer error: {msg.error()}")
                    break
                    
            try:
                # Deserialize JSON message
                payment = json.loads(msg.value().decode('utf-8'))
                success = process_payment(payment)
                
                if not success:
                    print("Failed to process payment properly")
                    
            except json.JSONDecodeError as e:
                print(f"ERROR: Failed to decode JSON: {e}")
                print(f"Raw message: {msg.value()}")
            except Exception as e:
                print(f"ERROR: Unexpected error: {e}")
                
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        consumer.close()
        print("Consumer closed")

if __name__ == "__main__":
    main()