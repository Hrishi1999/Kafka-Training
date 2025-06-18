#!/usr/bin/env python3
"""
Poison Pill Generator - Create problematic messages to test resilience
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from common.config import KafkaConfig
from confluent_kafka import Producer
import json
import uuid
import time


def delivery_report(err, msg):
    """Delivery report callback"""
    if err is not None:
        print(f"❌ Delivery failed: {err}")
    else:
        print(f"☠️  Poison pill sent: {msg.key().decode('utf-8')}")


def generate_poison_pills():
    """Generate various types of poison pill messages"""
    
    poison_pills = [
        # 1. Invalid JSON structure
        {
            "type": "malformed_json",
            "description": "Invalid JSON that will break parsing",
            "key": "POISON-JSON",
            "value": '{"payment_id": "invalid", "amount": BROKEN_JSON}'
        },
        
        # 2. Missing required fields
        {
            "type": "missing_fields",
            "description": "Missing critical payment fields",
            "key": "POISON-MISSING",
            "value": json.dumps({
                "payment_id": str(uuid.uuid4()),
                # Missing amount, currency, customer_id
                "timestamp": int(time.time())
            })
        },
        
        # 3. Invalid data types
        {
            "type": "wrong_types",
            "description": "Wrong data types for payment fields",
            "key": "POISON-TYPES",
            "value": json.dumps({
                "payment_id": 12345,  # Should be string
                "amount": "not-a-number",  # Should be numeric
                "currency": 840,  # Should be string
                "customer_id": None,  # Should be string
                "timestamp": "not-a-timestamp"  # Should be numeric
            })
        },
        
        # 4. Extremely large payload
        {
            "type": "oversized_payload",
            "description": "Massive payload that could cause memory issues",
            "key": "POISON-SIZE",
            "value": json.dumps({
                "payment_id": str(uuid.uuid4()),
                "amount": 99.99,
                "currency": "USD",
                "customer_id": "CUST-LARGE",
                "timestamp": int(time.time()),
                "massive_field": "X" * 100000  # 100KB of data
            })
        },
        
        # 5. Invalid business logic
        {
            "type": "invalid_business",
            "description": "Valid JSON but invalid business logic",
            "key": "POISON-BUSINESS",
            "value": json.dumps({
                "payment_id": str(uuid.uuid4()),
                "amount": -999.99,  # Negative amount
                "currency": "INVALID",  # Invalid currency
                "customer_id": "CUST-NONEXISTENT",
                "timestamp": int(time.time())
            })
        },
        
        # 6. Unicode/encoding issues
        {
            "type": "encoding_issues",
            "description": "Unicode characters that might break parsing",
            "key": "POISON-UNICODE",
            "value": json.dumps({
                "payment_id": str(uuid.uuid4()),
                "amount": 99.99,
                "currency": "USD",
                "customer_id": "CUST-🚨💀🔥",  # Emoji in customer ID
                "timestamp": int(time.time()),
                "description": "Payment with üñíçødé çhäräçtérs"
            })
        },
        
        # 7. Circular reference (will break some JSON processors)
        {
            "type": "circular_reference",
            "description": "Self-referencing data structure",
            "key": "POISON-CIRCULAR",
            "value": '{"payment_id":"circular","self":{"ref":"self"}}'
        },
        
        # 8. Empty message
        {
            "type": "empty_message",
            "description": "Completely empty message",
            "key": "POISON-EMPTY",
            "value": ""
        },
        
        # 9. Non-JSON binary data
        {
            "type": "binary_data",
            "description": "Binary data instead of JSON",
            "key": "POISON-BINARY",
            "value": b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'  # PNG header
        }
    ]
    
    return poison_pills


def send_poison_pills():
    """Send poison pill messages to test consumer resilience"""
    print("☠️  POISON PILL GENERATOR")
    print("=" * 50)
    print("Generating problematic messages to test consumer resilience...")
    print("These messages will likely cause failures in fragile consumers!")
    print()
    
    config = KafkaConfig.create_producer_config()
    config['on_delivery'] = delivery_report
    producer = Producer(config)
    
    poison_pills = generate_poison_pills()
    
    print(f"🧪 Generated {len(poison_pills)} different types of poison pills:")
    for i, pill in enumerate(poison_pills, 1):
        print(f"   {i}. {pill['type']}: {pill['description']}")
    print()
    
    # Send regular good message first
    good_payment = {
        "payment_id": str(uuid.uuid4()),
        "amount": 99.99,
        "currency": "USD",
        "customer_id": "CUST-GOOD",
        "timestamp": int(time.time())
    }
    
    producer.produce(
        topic='payment_requests',
        key="GOOD-MESSAGE",
        value=json.dumps(good_payment)
    )
    print("✅ Sent 1 good message first")
    
    # Send poison pills
    for pill in poison_pills:
        try:
            value = pill['value']
            if isinstance(value, bytes):
                # Send binary data as-is
                producer.produce(
                    topic='payment_requests',
                    key=pill['key'],
                    value=value
                )
            else:
                # Send as string
                producer.produce(
                    topic='payment_requests',
                    key=pill['key'],
                    value=value.encode('utf-8') if isinstance(value, str) else value
                )
            
            print(f"☠️  Sent {pill['type']}: {pill['description']}")
            time.sleep(0.5)  # Space out the poison
            
        except Exception as e:
            print(f"❌ Failed to send {pill['type']}: {e}")
    
    # Send another good message after
    good_payment2 = {
        "payment_id": str(uuid.uuid4()),
        "amount": 50.00,
        "currency": "USD", 
        "customer_id": "CUST-GOOD-2",
        "timestamp": int(time.time())
    }
    
    producer.produce(
        topic='payment_requests',
        key="GOOD-MESSAGE-2",
        value=json.dumps(good_payment2)
    )
    print("✅ Sent 1 good message after poison pills")
    
    producer.flush()
    
    print()
    print("☠️  POISON PILLS DEPLOYED!")
    print("=" * 30)
    print("🎯 NOW TEST YOUR CONSUMERS:")
    print()
    print("1. FRAGILE CONSUMER TEST:")
    print("   python fragile_consumer.py")
    print("   → Should crash/block on poison pills")
    print()
    print("2. DLQ CONSUMER TEST:")
    print("   python dlq_consumer.py")
    print("   → Should handle poison pills gracefully")
    print()
    print("3. RETRY CONSUMER TEST:")
    print("   python retry_consumer.py")
    print("   → Should retry transients, DLQ permanent failures")
    print()
    print("4. ANALYZE FAILURES:")
    print("   python dlq_analyzer.py")
    print("   → See what types of failures occurred")
    print()
    print("💡 EXPECTED BEHAVIOR:")
    print("✅ Resilient consumers continue processing good messages")
    print("✅ Poison pills go to DLQ for analysis")
    print("✅ Overall system throughput maintained")
    print("❌ Fragile consumers get stuck or crash")


def main():
    """Main function"""
    print("⚠️  WARNING: This will send problematic messages!")
    print("Only run this if you want to test consumer resilience.")
    print()
    
    response = input("Send poison pills to test consumers? (y/n): ").lower().strip()
    if response == 'y':
        send_poison_pills()
    else:
        print("Poison pill generation cancelled.")
        print()
        print("💡 To generate poison pills manually, run:")
        print("   python poison_pill_generator.py")


if __name__ == "__main__":
    main()