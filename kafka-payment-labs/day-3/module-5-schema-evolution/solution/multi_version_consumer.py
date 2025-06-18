#!/usr/bin/env python3
"""
Multi-Version Payment Consumer - Handles Multiple Schema Versions (SOLUTION)

This consumer demonstrates how to build resilient consumers that can handle
schema evolution gracefully by adapting to different schema versions.
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
from typing import Dict, Optional, Set

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class MultiVersionPaymentConsumer:
    """Consumer that gracefully handles multiple schema versions"""
    
    def __init__(self, consumer_group: str = "multi-version-consumer"):
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
        
        # Create generic Avro deserializer (will work with any schema in the subject)
        self.avro_deserializer = AvroDeserializer(
            schema_registry_client=self.schema_registry_client
        )
        
        # Create consumer
        self.consumer = Consumer(self.kafka_config)
        self.topic = 'payment_requests'
        
        # Schema version tracking
        self.known_schema_versions = {}
        self.unknown_fields_seen = set()
        
        # Statistics
        self.stats = {
            'total_messages': 0,
            'v1_messages': 0,
            'v2_messages': 0,
            'unknown_version_messages': 0,
            'processing_errors': 0,
            'new_fields_encountered': set()
        }
        
        print(f"🔄 Multi-Version Payment Consumer initialized")
        print(f"📋 Supports: v1, v2-safe, and future schema versions")
        print(f"👥 Consumer Group: {consumer_group}")
        print(f"📥 Topic: {self.topic}")
        print(f"🎯 Goal: Gracefully handle schema evolution")
    
    def detect_schema_version(self, payment_data: Dict) -> str:
        """Detect which schema version was used for this message"""
        
        # Get the set of fields in this message
        fields = set(payment_data.keys())
        
        # v1 fields
        v1_fields = {'payment_id', 'amount', 'currency', 'merchant_id', 
                    'customer_id', 'timestamp', 'status'}
        
        # v2-safe adds these optional fields
        v2_safe_additional = {'fraud_score', 'processing_fee', 'metadata'}
        
        # v2-breaking changes field names
        v2_breaking_fields = {'payment_id', 'total_amount_cents', 'currency_code', 
                             'merchant_id', 'customer_id', 'created_at', 'status', 
                             'fraud_risk_level'}
        
        # Check for v2-breaking first (most distinctive)
        if 'total_amount_cents' in fields or 'currency_code' in fields or 'fraud_risk_level' in fields:
            return 'v2-breaking'
        
        # Check for v2-safe (has v1 fields plus additional ones)
        elif v1_fields.issubset(fields) and any(field in fields for field in v2_safe_additional):
            return 'v2-safe'
        
        # Check for v1 (exact match or subset)
        elif v1_fields.issubset(fields) and not any(field in fields for field in v2_safe_additional):
            return 'v1'
        
        else:
            # Log unknown fields for analysis
            unknown_fields = fields - v1_fields - v2_safe_additional
            if unknown_fields:
                self.unknown_fields_seen.update(unknown_fields)
                print(f"   ℹ️  Unknown fields detected: {unknown_fields}")
            return 'unknown'
    
    def process_payment_v1(self, payment_data: Dict) -> bool:
        """Process payment using v1 business logic"""
        try:
            payment_id = payment_data['payment_id']
            amount = payment_data['amount']
            currency = payment_data.get('currency', 'USD')
            merchant_id = payment_data['merchant_id']
            customer_id = payment_data['customer_id']
            
            print(f"📋 Processing v1 payment {payment_id}:")
            print(f"   Amount: {amount} {currency}")
            print(f"   Merchant: {merchant_id}")
            print(f"   Customer: {customer_id}")
            
            # Basic validation for v1
            if amount > 0 and merchant_id and customer_id:
                print(f"   ✅ v1 payment processed successfully")
                return True
            else:
                print(f"   ❌ v1 payment validation failed")
                return False
                
        except KeyError as e:
            print(f"   ❌ Missing required v1 field: {e}")
            return False
        except Exception as e:
            print(f"   ❌ v1 processing error: {e}")
            return False
    
    def process_payment_v2_safe(self, payment_data: Dict) -> bool:
        """Process payment using v2-safe business logic"""
        try:
            # Process v1 fields first (backward compatibility)
            payment_id = payment_data['payment_id']
            amount = payment_data['amount']
            currency = payment_data.get('currency', 'USD')
            merchant_id = payment_data['merchant_id']
            customer_id = payment_data['customer_id']
            
            print(f"📋 Processing v2-safe payment {payment_id}:")
            print(f"   Amount: {amount} {currency}")
            print(f"   Merchant: {merchant_id}")
            print(f"   Customer: {customer_id}")
            
            # Process v2-safe specific fields
            fraud_score = payment_data.get('fraud_score')
            processing_fee = payment_data.get('processing_fee')
            metadata = payment_data.get('metadata', {})
            
            # Enhanced business logic using v2 fields
            print(f"   Fraud Score: {fraud_score if fraud_score is not None else 'Not calculated'}")
            print(f"   Processing Fee: ${processing_fee if processing_fee is not None else 0.00:.2f}")
            print(f"   Metadata: {len(metadata) if metadata else 0} entries")
            
            # Enhanced validation logic
            is_high_risk = fraud_score is not None and fraud_score > 80
            has_high_fee = processing_fee is not None and processing_fee > 10.0
            
            if is_high_risk:
                print(f"   ⚠️  HIGH FRAUD RISK detected (score: {fraud_score})")
            
            if has_high_fee:
                print(f"   💰 High processing fee: ${processing_fee:.2f}")
            
            # Basic validation plus enhanced checks
            if amount > 0 and merchant_id and customer_id:
                if is_high_risk:
                    print(f"   🔍 v2-safe payment flagged for manual review (fraud risk)")
                else:
                    print(f"   ✅ v2-safe payment processed with enhanced features")
                return True
            else:
                print(f"   ❌ v2-safe payment validation failed")
                return False
            
        except Exception as e:
            print(f"   ❌ v2-safe processing error: {e}")
            return False
    
    def process_payment_v2_breaking(self, payment_data: Dict) -> bool:
        """Process payment using v2-breaking business logic"""
        try:
            payment_id = payment_data['payment_id']
            
            # Handle breaking schema field changes
            total_amount_cents = payment_data.get('total_amount_cents', 0)
            currency_code = payment_data.get('currency_code', 'USD')
            created_at = payment_data.get('created_at')
            fraud_risk_level = payment_data.get('fraud_risk_level', 'UNKNOWN')
            merchant_id = payment_data.get('merchant_id')
            customer_id = payment_data.get('customer_id')
            
            print(f"📋 Processing v2-breaking payment {payment_id}:")
            print(f"   Amount: ${total_amount_cents/100 if total_amount_cents else 0:.2f} {currency_code}")
            print(f"   Fraud Risk: {fraud_risk_level}")
            print(f"   Created: {created_at}")
            print(f"   Merchant: {merchant_id}")
            print(f"   Customer: {customer_id}")
            
            # Business logic for breaking changes
            is_high_risk = fraud_risk_level in ['HIGH', 'CRITICAL']
            amount_dollars = total_amount_cents / 100 if total_amount_cents else 0
            
            if is_high_risk:
                print(f"   🚨 HIGH FRAUD RISK: {fraud_risk_level}")
            
            # Validation with new schema format
            if amount_dollars > 0 and merchant_id and customer_id:
                if is_high_risk:
                    print(f"   🔍 v2-breaking payment requires additional verification")
                else:
                    print(f"   ✅ v2-breaking payment processed")
                return True
            else:
                print(f"   ❌ v2-breaking payment validation failed")
                return False
            
        except Exception as e:
            print(f"   ❌ v2-breaking processing error: {e}")
            return False
    
    def process_payment_unknown(self, payment_data: Dict) -> bool:
        """Process payment with unknown schema version - best effort"""
        try:
            payment_id = payment_data.get('payment_id', 'UNKNOWN')
            
            print(f"📋 Processing unknown schema payment {payment_id}:")
            print(f"   Available fields: {list(payment_data.keys())}")
            
            # Best-effort processing - try to extract common fields
            amount = None
            
            # Try different amount field names
            if 'amount' in payment_data:
                amount = payment_data['amount']
            elif 'total_amount_cents' in payment_data:
                amount = payment_data['total_amount_cents'] / 100
            
            merchant_id = payment_data.get('merchant_id')
            customer_id = payment_data.get('customer_id')
            
            print(f"   Extracted amount: ${amount if amount else 'Unknown'}")
            print(f"   Merchant: {merchant_id if merchant_id else 'Unknown'}")
            print(f"   Customer: {customer_id if customer_id else 'Unknown'}")
            
            # Basic validation with available data
            if amount and amount > 0 and merchant_id and customer_id:
                print(f"   ✅ Processed with basic validation (unknown schema)")
                return True
            else:
                print(f"   ⚠️  Processed with limited functionality (unknown schema)")
                return True  # Don't fail completely for unknown schemas
            
        except Exception as e:
            print(f"   ❌ Unknown schema processing error: {e}")
            return False
    
    def process_payment(self, payment_data: Dict) -> bool:
        """Route payment to appropriate processor based on detected version"""
        
        # Detect schema version
        version = self.detect_schema_version(payment_data)
        
        # Track new fields for analysis
        for field in payment_data.keys():
            self.stats['new_fields_encountered'].add(field)
        
        # Update statistics
        if version == 'v1':
            self.stats['v1_messages'] += 1
            return self.process_payment_v1(payment_data)
        elif version == 'v2-safe':
            self.stats['v2_messages'] += 1
            return self.process_payment_v2_safe(payment_data)
        elif version == 'v2-breaking':
            self.stats['v2_messages'] += 1
            return self.process_payment_v2_breaking(payment_data)
        else:
            self.stats['unknown_version_messages'] += 1
            return self.process_payment_unknown(payment_data)
    
    def consume_payments(self, max_messages: int = 50, timeout_seconds: int = 60):
        """Consume payments and demonstrate multi-version handling"""
        
        print(f"\n🚀 Starting multi-version payment consumption")
        print(f"📊 Will process up to {max_messages} messages")
        print(f"⏱️  Timeout: {timeout_seconds} seconds")
        print(f"🔄 Adapting to schema evolution dynamically...")
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
                    # Deserialize with generic deserializer
                    payment_data = self.avro_deserializer(
                        msg.value(),
                        SerializationContext(self.topic, MessageField.VALUE)
                    )
                    
                    # Process with version-aware logic
                    success = self.process_payment(payment_data)
                    
                    if not success:
                        self.stats['processing_errors'] += 1
                    
                    self.stats['total_messages'] += 1
                    messages_consumed += 1
                    
                except Exception as e:
                    self.stats['processing_errors'] += 1
                    print(f"❌ Message processing error: {e}")
                    messages_consumed += 1
                
                # Progress update
                if messages_consumed % 5 == 0:
                    self._print_progress(messages_consumed)
        
        except KeyboardInterrupt:
            print(f"\n⚡ Consumer interrupted by user")
        
        finally:
            print(f"\n🏁 Closing multi-version consumer...")
            self.consumer.close()
            self._print_final_results()
    
    def _print_progress(self, messages_consumed: int):
        """Print consumption progress"""
        print(f"\n📊 Progress Update (consumed {messages_consumed} messages):")
        print(f"   📋 v1 messages: {self.stats['v1_messages']}")
        print(f"   📋 v2 messages: {self.stats['v2_messages']}")
        print(f"   ❓ Unknown version: {self.stats['unknown_version_messages']}")
        print(f"   ❌ Processing errors: {self.stats['processing_errors']}")
        print("-" * 40)
    
    def _print_final_results(self):
        """Print final consumption results and schema evolution analysis"""
        
        print(f"\n🏁 MULTI-VERSION CONSUMER RESULTS")
        print(f"=" * 60)
        print(f"📊 Message Statistics:")
        print(f"   📋 Total messages: {self.stats['total_messages']}")
        print(f"   📋 v1 schema: {self.stats['v1_messages']}")
        print(f"   📋 v2 schema: {self.stats['v2_messages']}")
        print(f"   ❓ Unknown schema: {self.stats['unknown_version_messages']}")
        print(f"   ❌ Processing errors: {self.stats['processing_errors']}")
        
        if self.stats['total_messages'] > 0:
            success_rate = ((self.stats['total_messages'] - self.stats['processing_errors']) / 
                          self.stats['total_messages']) * 100
            print(f"   📊 Success rate: {success_rate:.1f}%")
        
        print(f"\n🔍 Schema Evolution Analysis:")
        
        if self.stats['v1_messages'] > 0 and self.stats['v2_messages'] > 0:
            print(f"   ✅ MULTI-VERSION SUCCESS: Handled multiple schema versions!")
            print(f"   🔄 Consumer adapted dynamically to schema evolution")
            print(f"   💪 This demonstrates production-ready schema handling")
        elif self.stats['v1_messages'] > 0:
            print(f"   📋 Only v1 messages processed")
        elif self.stats['v2_messages'] > 0:
            print(f"   📋 Only v2 messages processed")
        
        if self.unknown_fields_seen:
            print(f"   🆕 New fields discovered: {self.unknown_fields_seen}")
            print(f"   💡 These may be from future schema versions")
        
        print(f"\n🔍 All fields encountered: {sorted(self.stats['new_fields_encountered'])}")
        
        print(f"\n💡 Key Benefits of Multi-Version Consumers:")
        print(f"   • Graceful handling of schema evolution")
        print(f"   • Backward compatibility with old producers")
        print(f"   • Forward compatibility with new schema features")
        print(f"   • Reduced deployment coordination complexity")
        print(f"   • Better resilience in production environments")

def main():
    """Run the multi-version payment consumer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Multi-Version Payment Consumer')
    parser.add_argument('--consumer-group', type=str, default='multi-version-consumer',
                       help='Consumer group ID')
    parser.add_argument('--max-messages', type=int, default=50,
                       help='Maximum messages to consume')
    parser.add_argument('--timeout', type=int, default=60,
                       help='Timeout in seconds')
    
    args = parser.parse_args()
    
    print("🔄 MULTI-VERSION PAYMENT CONSUMER")
    print("=" * 60)
    print("🎯 Purpose: Handle multiple schema versions gracefully")
    print("📋 Supports: v1, v2-safe, v2-breaking, and future versions")
    print("🧪 Demonstrates: Production-ready schema evolution handling")
    print("=" * 60)
    
    try:
        consumer = MultiVersionPaymentConsumer(consumer_group=args.consumer_group)
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