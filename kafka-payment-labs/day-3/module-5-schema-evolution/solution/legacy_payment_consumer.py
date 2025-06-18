#!/usr/bin/env python3
"""
Legacy Payment Consumer - Simulates Old Consumer Version

This consumer is designed to work with the v1 payment schema and demonstrates
what happens when schema evolution occurs - either graceful handling of
backward-compatible changes or failures with breaking changes.
"""

import os
import sys
import json
import time
from datetime import datetime
from confluent_kafka import Consumer, KafkaException
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import SerializationContext, MessageField
from typing import Dict, Optional

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class LegacyPaymentConsumer:
    """Legacy consumer that expects v1 payment schema"""
    
    def __init__(self, consumer_group: str = "legacy-payment-consumer"):
        # Kafka configuration using common KafkaConfig
        self.kafka_config = KafkaConfig.create_consumer_config(
            group_id=consumer_group,
            auto_offset_reset='latest',
            enable_auto_commit=True,
        )
        
        # Schema Registry configuration using common KafkaConfig
        self.schema_registry_config = KafkaConfig.create_schema_registry_config()
        
        # Initialize Schema Registry client
        self.schema_registry_client = SchemaRegistryClient(self.schema_registry_config)
        
        # Load the v1 schema that this legacy consumer expects
        self.expected_schema = self._load_v1_schema()
        
        # Create Avro deserializer with v1 schema
        self.avro_deserializer = AvroDeserializer(
            schema_registry_client=self.schema_registry_client,
            schema_str=self.expected_schema
        )
        
        # Create consumer
        self.consumer = Consumer(self.kafka_config)
        self.topic = 'payment_requests'
        
        # Statistics
        self.stats = {
            'messages_processed': 0,
            'deserialization_errors': 0,
            'processing_errors': 0,
            'unknown_fields_encountered': 0
        }
        
        print(f"🏛️  Legacy Payment Consumer initialized")
        print(f"📋 Expected Schema: v1 (backward compatibility test)")
        print(f"👥 Consumer Group: {consumer_group}")
        print(f"📥 Topic: {self.topic}")
        print(f"⚠️  Will fail if non-compatible schema changes are received")
    
    def _load_v1_schema(self) -> str:
        """Load the v1 schema that this legacy consumer expects"""
        schema_file = "../schemas/payment-v1.avsc"
        
        try:
            with open(schema_file, 'r') as f:
                schema_dict = json.load(f)
            
            print(f"📋 Loaded expected schema: {schema_dict['name']} v1")
            print(f"   Fields expected: {[f['name'] for f in schema_dict['fields']]}")
            
            return json.dumps(schema_dict)
            
        except FileNotFoundError:
            print(f"❌ V1 schema file not found: {schema_file}")
            raise
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in v1 schema: {e}")
            raise
    
    def process_payment_v1(self, payment_data: Dict) -> bool:
        """
        Process payment using v1 business logic.
        
        This simulates a legacy system that only knows about v1 fields
        and may break if required fields are missing or changed.
        """
        
        try:
            # Extract v1 fields with error handling
            payment_id = payment_data.get('payment_id')
            if not payment_id:
                raise ValueError("Missing required field: payment_id")
            
            amount = payment_data.get('amount')
            if amount is None:
                raise ValueError("Missing required field: amount")
            
            currency = payment_data.get('currency', 'USD')
            merchant_id = payment_data.get('merchant_id')
            customer_id = payment_data.get('customer_id')
            timestamp = payment_data.get('timestamp')
            status = payment_data.get('status', 'PENDING')
            
            # Legacy business logic - only processes known fields
            print(f"💳 Processing payment {payment_id}:")
            print(f"   Amount: {amount} {currency}")
            print(f"   Merchant: {merchant_id}")
            print(f"   Customer: {customer_id}")
            print(f"   Status: {status}")
            print(f"   Timestamp: {datetime.fromtimestamp(timestamp/1000) if timestamp else 'N/A'}")
            
            # Check for unknown fields (indicates schema evolution)
            v1_expected_fields = {
                'payment_id', 'amount', 'currency', 'merchant_id', 
                'customer_id', 'timestamp', 'status'
            }
            
            actual_fields = set(payment_data.keys())
            unknown_fields = actual_fields - v1_expected_fields
            
            if unknown_fields:
                self.stats['unknown_fields_encountered'] += 1
                print(f"   ℹ️  Unknown fields detected (likely new schema version): {unknown_fields}")
                print(f"   ✅ Legacy consumer gracefully ignoring new fields")
            
            # Simulate payment processing
            if amount > 0 and merchant_id and customer_id:
                print(f"   ✅ Payment {payment_id} processed successfully by legacy consumer")
                return True
            else:
                print(f"   ❌ Payment {payment_id} validation failed")
                return False
                
        except Exception as e:
            print(f"   ❌ Payment processing failed: {e}")
            return False
    
    def consume_payments(self, max_messages: int = 50, timeout_seconds: int = 60):
        """Consume payments and test schema compatibility"""
        
        print(f"\n🚀 Starting legacy payment consumption")
        print(f"📊 Will process up to {max_messages} messages")
        print(f"⏱️  Timeout: {timeout_seconds} seconds")
        print(f"🧪 Testing schema evolution compatibility...")
        print("-" * 60)
        
        # Subscribe to topic
        self.consumer.subscribe([self.topic])
        
        messages_consumed = 0
        start_time = time.time()
        
        try:
            while messages_consumed < max_messages and (time.time() - start_time) < timeout_seconds:
                
                # Poll for messages
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    print("⏱️  Waiting for messages...")
                    continue
                
                if msg.error():
                    print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                try:
                    # Attempt to deserialize with v1 schema expectation
                    payment_data = self.avro_deserializer(
                        msg.value(),
                        SerializationContext(self.topic, MessageField.VALUE)
                    )
                    
                    # Process the payment with legacy business logic
                    success = self.process_payment_v1(payment_data)
                    
                    if success:
                        self.stats['messages_processed'] += 1
                    else:
                        self.stats['processing_errors'] += 1
                    
                    messages_consumed += 1
                    
                except Exception as e:
                    self.stats['deserialization_errors'] += 1
                    print(f"❌ SCHEMA COMPATIBILITY ERROR: {e}")
                    print(f"   🚨 This indicates a breaking schema change!")
                    print(f"   💥 Legacy consumer cannot handle new schema format")
                    print(f"   🔧 Producer may be using incompatible schema version")
                    
                    # Log the error details for debugging
                    if "does not match" in str(e):
                        print(f"   📋 Schema mismatch detected")
                    elif "missing" in str(e).lower():
                        print(f"   📋 Missing required field")
                    elif "cannot convert" in str(e).lower():
                        print(f"   📋 Type conversion error")
                    
                    messages_consumed += 1
                
                # Progress update
                if messages_consumed % 5 == 0:
                    self._print_progress(messages_consumed)
        
        except KeyboardInterrupt:
            print(f"\n⚡ Consumer interrupted by user")
        
        finally:
            print(f"\n🏁 Closing legacy consumer...")
            self.consumer.close()
            self._print_final_results()
    
    def _print_progress(self, messages_consumed: int):
        """Print consumption progress"""
        print(f"\n📊 Progress Update (consumed {messages_consumed} messages):")
        print(f"   ✅ Successfully processed: {self.stats['messages_processed']}")
        print(f"   ❌ Deserialization errors: {self.stats['deserialization_errors']}")
        print(f"   ⚠️  Processing errors: {self.stats['processing_errors']}")
        print(f"   ℹ️  Unknown fields seen: {self.stats['unknown_fields_encountered']}")
        print("-" * 40)
    
    def _print_final_results(self):
        """Print final consumption results and compatibility analysis"""
        
        print(f"\n🏁 LEGACY CONSUMER COMPATIBILITY TEST COMPLETE")
        print(f"=" * 60)
        print(f"📊 Final Statistics:")
        print(f"   ✅ Successfully processed: {self.stats['messages_processed']}")
        print(f"   ❌ Deserialization errors: {self.stats['deserialization_errors']}")
        print(f"   ⚠️  Processing errors: {self.stats['processing_errors']}")
        print(f"   ℹ️  Unknown fields encountered: {self.stats['unknown_fields_encountered']}")
        
        # Compatibility analysis
        total_attempts = (self.stats['messages_processed'] + 
                         self.stats['deserialization_errors'] + 
                         self.stats['processing_errors'])
        
        if total_attempts > 0:
            success_rate = (self.stats['messages_processed'] / total_attempts) * 100
            print(f"   📊 Success rate: {success_rate:.1f}%")
        
        print(f"\n🔍 Schema Evolution Analysis:")
        
        if self.stats['deserialization_errors'] == 0 and self.stats['unknown_fields_encountered'] == 0:
            print(f"   ✅ PERFECT COMPATIBILITY: No schema changes detected")
            print(f"   📋 Producer using same schema version as consumer")
            
        elif self.stats['deserialization_errors'] == 0 and self.stats['unknown_fields_encountered'] > 0:
            print(f"   ✅ BACKWARD COMPATIBLE: Schema evolved safely")
            print(f"   📋 New optional fields added but legacy consumer works")
            print(f"   💡 This demonstrates proper schema evolution!")
            
        elif self.stats['deserialization_errors'] > 0:
            print(f"   ❌ BREAKING CHANGES DETECTED: Schema evolution failed")
            print(f"   🚨 Producer using incompatible schema version")
            print(f"   💥 This would cause production outage!")
            print(f"   🔧 Schema Registry should prevent this!")
            
        print(f"\n💡 Key Learnings:")
        print(f"   • Backward compatible changes: Add optional fields with defaults")
        print(f"   • Breaking changes: Remove fields, change types, remove defaults")
        print(f"   • Schema Registry prevents breaking changes when configured properly")
        print(f"   • Legacy consumers can gracefully handle compatible evolution")

def main():
    """Run the legacy payment consumer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Legacy Payment Consumer (v1 Schema)')
    parser.add_argument('--consumer-group', type=str, default='legacy-payment-consumer',
                       help='Consumer group ID')
    parser.add_argument('--max-messages', type=int, default=50,
                       help='Maximum messages to consume')
    parser.add_argument('--timeout', type=int, default=60,
                       help='Timeout in seconds')
    
    args = parser.parse_args()
    
    print("🏛️  LEGACY PAYMENT CONSUMER")
    print("=" * 60)
    print("🎯 Purpose: Test schema evolution compatibility")
    print("📋 Expected Schema: v1 payment format")
    print("🧪 Will detect: Backward compatible vs breaking changes")
    print("=" * 60)
    
    try:
        consumer = LegacyPaymentConsumer(consumer_group=args.consumer_group)
        consumer.consume_payments(
            max_messages=args.max_messages,
            timeout_seconds=args.timeout
        )
        
    except KeyboardInterrupt:
        print(f"\n⚡ Consumer interrupted")
    except Exception as e:
        print(f"\n💥 Consumer error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()