#!/usr/bin/env python3
"""
Payment Producer with Schema Evolution Support

This producer can send payments using different schema versions to demonstrate
schema evolution compatibility and breaking changes.
"""

import os
import sys
import json
import time
import random
import argparse
from datetime import datetime
from confluent_kafka import Producer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer
from confluent_kafka.serialization import SerializationContext, MessageField
from typing import Dict

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class SchemaEvolutionProducer:
    """Producer that demonstrates schema evolution patterns"""
    
    def __init__(self, schema_version: str = "v1"):
        self.schema_version = schema_version
        
        # Kafka configuration using common KafkaConfig
        self.kafka_config = KafkaConfig.create_producer_config(
            acks='all'
        )
        
        # Schema Registry configuration using common KafkaConfig
        self.schema_registry_config = KafkaConfig.create_schema_registry_config()
        
        # Initialize Schema Registry client
        self.schema_registry_client = SchemaRegistryClient(self.schema_registry_config)
        
        # Load schema based on version
        self.schema_str = self._load_schema(schema_version)
        
        # Create Avro serializer
        self.avro_serializer = AvroSerializer(
            schema_registry_client=self.schema_registry_client,
            schema_str=self.schema_str
        )
        
        # Create producer
        self.producer = Producer(self.kafka_config)
        self.topic = 'payment_requests'
        
        print(f"🚀 Initialized producer with schema version: {schema_version}")
        print(f"📋 Topic: {self.topic}")
        print(f"🔗 Schema Registry: {self.schema_registry_config['url']}")
    
    def _load_schema(self, version: str) -> str:
        """Load Avro schema from file"""
        schema_file = f"../schemas/payment-{version}.avsc"
        
        try:
            with open(schema_file, 'r') as f:
                schema_dict = json.load(f)
            
            # Pretty print the schema being used
            print(f"\n📋 Loading schema from: {schema_file}")
            print(f"Schema name: {schema_dict.get('name', 'Unknown')}")
            print(f"Schema namespace: {schema_dict.get('namespace', 'Unknown')}")
            print(f"Fields: {len(schema_dict.get('fields', []))}")
            
            return json.dumps(schema_dict)
            
        except FileNotFoundError:
            print(f"❌ Schema file not found: {schema_file}")
            raise
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in schema file: {e}")
            raise
    
    def create_payment_v1(self, payment_id: str) -> Dict:
        """Create payment record compatible with v1 schema"""
        return {
            'payment_id': payment_id,
            'amount': round(random.uniform(10.0, 1000.0), 2),
            'currency': random.choice(['USD', 'EUR', 'GBP']),
            'merchant_id': f'MERCH-{random.randint(1, 50)}',
            'customer_id': f'CUST-{random.randint(1000, 9999)}',
            'timestamp': int(datetime.now().timestamp() * 1000),
            'status': random.choice(['PENDING', 'PROCESSED', 'FAILED'])
        }
    
    def create_payment_v2_safe(self, payment_id: str) -> Dict:
        """Create payment record with v2 safe evolution (backward compatible)"""
        payment = self.create_payment_v1(payment_id)
        
        # Add new optional fields introduced in v2
        payment.update({
            'fraud_score': random.randint(1, 100) if random.random() > 0.3 else None,
            'processing_fee': round(random.uniform(0.30, 5.00), 2) if random.random() > 0.2 else None,
            'metadata': {
                'ip_address': f'192.168.1.{random.randint(1, 254)}',
                'user_agent': 'PaymentApp/2.1.0',
                'session_id': f'sess_{random.randint(100000, 999999)}'
            } if random.random() > 0.4 else {}
        })
        
        return payment
    
    def create_payment_v2_breaking(self, payment_id: str) -> Dict:
        """Create payment record with v2 breaking changes (will cause issues!)"""
        # This creates data in the breaking v2 format
        return {
            'payment_id': payment_id,
            'total_amount_cents': random.randint(1000, 100000),  # Changed from 'amount'
            'currency_code': random.choice(['USD', 'EUR', 'GBP']),  # Renamed from 'currency'
            'merchant_id': f'MERCH-{random.randint(1, 50)}',
            'customer_id': f'CUST-{random.randint(1000, 9999)}',
            'created_at': datetime.now().isoformat(),  # Changed from 'timestamp' 
            'status': random.choice(['PENDING', 'APPROVED', 'DECLINED']),  # Changed enum values
            'fraud_risk_level': random.choice(['LOW', 'MEDIUM', 'HIGH'])  # New required field!
        }
    
    def create_payment(self, payment_id: str) -> Dict:
        """Create payment record based on configured schema version"""
        
        if self.schema_version == 'v1':
            return self.create_payment_v1(payment_id)
        elif self.schema_version == 'v2-safe':
            return self.create_payment_v2_safe(payment_id)
        elif self.schema_version == 'v2-breaking':
            return self.create_payment_v2_breaking(payment_id)
        else:
            raise ValueError(f"Unknown schema version: {self.schema_version}")
    
    def send_payments(self, count: int = 10, delay: float = 1.0):
        """Send a batch of payments using the configured schema version"""
        
        print(f"\n💳 Sending {count} payments with schema {self.schema_version}")
        print(f"⏱️  Delay between messages: {delay} seconds")
        print("-" * 60)
        
        successful_sends = 0
        failed_sends = 0
        
        for i in range(count):
            payment_id = f'PAY-{random.randint(100000, 999999)}'
            
            try:
                # Create payment data
                payment_data = self.create_payment(payment_id)
                
                print(f"📤 Sending payment {i+1}: {payment_id}")
                print(f"   Schema: {self.schema_version}")
                print(f"   Amount: ${payment_data.get('amount', payment_data.get('total_amount_cents', 0) / 100):.2f}")
                
                # Serialize and send
                serialized_value = self.avro_serializer(
                    payment_data,
                    SerializationContext(self.topic, MessageField.VALUE)
                )
                
                self.producer.produce(
                    topic=self.topic,
                    key=payment_id.encode('utf-8'),
                    value=serialized_value,
                    callback=lambda err, msg: self._delivery_callback(err, msg, payment_id)
                )
                
                successful_sends += 1
                
                # Poll for callbacks
                self.producer.poll(0)
                
                # Delay between sends
                time.sleep(delay)
                
            except Exception as e:
                print(f"❌ Failed to send payment {payment_id}: {e}")
                failed_sends += 1
                
                # If this is a schema compatibility error, it's important to highlight it
                if "compatibility" in str(e).lower() or "incompatible" in str(e).lower():
                    print(f"🚨 SCHEMA COMPATIBILITY ERROR DETECTED!")
                    print(f"   This indicates the schema version {self.schema_version}")
                    print(f"   is not compatible with the registered schema.")
                    print(f"   Check Schema Registry compatibility settings.")
        
        # Flush remaining messages
        print(f"\n⏳ Flushing remaining messages...")
        self.producer.flush()
        
        # Summary
        print(f"\n📊 Sending Summary:")
        print(f"  ✅ Successful: {successful_sends}")
        print(f"  ❌ Failed: {failed_sends}")
        print(f"  📋 Schema Version: {self.schema_version}")
        
        if failed_sends > 0:
            print(f"\n⚠️  Schema Evolution Issues Detected:")
            print(f"  • Check Schema Registry compatibility mode")
            print(f"  • Verify schema changes are backward compatible")
            print(f"  • Review consumer compatibility with new schema")
    
    def _delivery_callback(self, err, msg, payment_id):
        """Delivery report callback"""
        if err is not None:
            print(f"   ❌ Delivery failed for {payment_id}: {err}")
        else:
            print(f"   ✅ Delivered {payment_id} to {msg.topic()}[{msg.partition()}]:{msg.offset()}")

def main():
    """Run the schema evolution producer"""
    parser = argparse.ArgumentParser(description='Schema Evolution Payment Producer')
    parser.add_argument('--schema-version', choices=['v1', 'v2-safe', 'v2-breaking'],
                       default='v1', help='Schema version to use')
    parser.add_argument('--count', type=int, default=10,
                       help='Number of payments to send')
    parser.add_argument('--delay', type=float, default=1.0,
                       help='Delay between messages in seconds')
    
    args = parser.parse_args()
    
    print("📋 SCHEMA EVOLUTION PAYMENT PRODUCER")
    print("=" * 60)
    print("🎯 Purpose: Demonstrate schema evolution compatibility")
    print("🔍 Focus: Safe vs breaking schema changes")
    
    if args.schema_version == 'v2-breaking':
        print(f"\n⚠️  WARNING: Using BREAKING schema version!")
        print(f"🚨 This may cause compatibility issues!")
        print(f"💡 This is intentional for demonstration purposes")
    
    print("=" * 60)
    
    try:
        producer = SchemaEvolutionProducer(schema_version=args.schema_version)
        producer.send_payments(count=args.count, delay=args.delay)
        
        print(f"\n💡 Next Steps:")
        print(f"  1. Check Schema Registry for registered schemas")
        print(f"  2. Run consumers with different schema versions")
        print(f"  3. Observe compatibility behavior")
        print(f"  4. Try different schema versions to see evolution in action")
        
    except KeyboardInterrupt:
        print(f"\n⚡ Producer interrupted")
    except Exception as e:
        print(f"\n💥 Producer error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()