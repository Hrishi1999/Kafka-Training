#!/usr/bin/env python3
"""
JSON Chaos Demo - Intentionally break things to show why schemas matter
Run this to see all the ways JSON can fail in production
"""

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


def breaking_change_1_type_change():
    """Breaking Change #1: Type Change - amount as string"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": "99.99",  # STRING instead of float!
        "currency": "USD",
        "customer_id": "CUST-1234", 
        "timestamp": int(time.time())
    }


def breaking_change_2_field_rename():
    """Breaking Change #2: Field Rename - currency_code instead of currency"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": 99.99,
        "currency_code": "USD",  # RENAMED from 'currency'!
        "customer_id": "CUST-1234",
        "timestamp": int(time.time())
    }


def breaking_change_3_missing_field():
    """Breaking Change #3: Missing Field - no customer_id"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": 99.99,
        "currency": "USD",
        # "customer_id" MISSING!
        "timestamp": int(time.time())
    }


def breaking_change_4_extra_nesting():
    """Breaking Change #4: Extra Nesting - nested amount object"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": {
            "value": 99.99,
            "currency": "USD"
        },
        "currency": "USD",
        "customer_id": "CUST-1234",
        "timestamp": int(time.time())
    }


def breaking_change_5_null_pollution():
    """Breaking Change #5: Null Pollution - unexpected nulls"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": None,  # NULL amount!
        "currency": "USD",
        "customer_id": None,  # NULL customer!
        "timestamp": int(time.time())
    }


def main():
    """Demo all the ways JSON can break"""
    config = KafkaConfig.create_producer_config()
    config['on_delivery'] = delivery_report
    
    producer = Producer(config)
    
    print("=== JSON CHAOS DEMO ===")
    print("Breaking your Day 1 consumer in 5 different ways...")
    print("Watch your consumer terminal for errors!\n")
    
    chaos_functions = [
        ("Type Change (amount as string)", breaking_change_1_type_change),
        ("Field Rename (currency_code)", breaking_change_2_field_rename),
        ("Missing Field (no customer_id)", breaking_change_3_missing_field),
        ("Extra Nesting (amount object)", breaking_change_4_extra_nesting),
        ("Null Pollution (null values)", breaking_change_5_null_pollution),
    ]
    
    for i, (description, chaos_func) in enumerate(chaos_functions, 1):
        print(f"💣 Breaking Change #{i}: {description}")
        
        try:
            bad_payment = chaos_func()
            producer.produce(
                topic='payment_requests',
                key=bad_payment.get("customer_id", "unknown"),
                value=json.dumps(bad_payment)
            )
            print(f"   ✅ Producer succeeded (JSON accepts anything!)")
            print(f"   📦 Sent: {bad_payment}")
            
        except Exception as e:
            print(f"   ❌ Producer failed: {e}")
        
        print(f"   ⏱️  Check your consumer now...")
        time.sleep(3)
        print()
    
    producer.flush()
    
    print("=== CHAOS COMPLETE ===")
    print("Key observations:")
    print("1. JSON producer never fails - it accepts any structure")
    print("2. Consumer fails at RUNTIME when processing messages")
    print("3. Some failures are silent (wrong types work until math)")
    print("4. Production debugging nightmare - errors happen later")
    print("5. No way to prevent incompatible changes")
    print("\nThis is why we need schemas! 🛡️")


if __name__ == "__main__":
    main()