#!/usr/bin/env python3
"""
Broken Payment Processor - Demonstrates the Double-Charge Problem

This processor writes to two topics but is NOT transactional, leading to:
- Partial failures (payment recorded but no audit)
- Duplicate processing on retry
- Financial reconciliation nightmares

This is exactly what NOT to do in production!
"""

import os
import sys
import json
import time
import random
from datetime import datetime
from confluent_kafka import Producer
from typing import Dict

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class BrokenPaymentProcessor:
    """A payment processor that demonstrates consistency problems"""
    
    def __init__(self):
        config = KafkaConfig.create_producer_config()
        self.producer = Producer(config)
        self.payment_topic = 'payment_requests'
        self.audit_topic = 'audit.payment-events'
        
        # Failure injection for demonstration
        self.failure_rate = 0.0
        self.inject_failures = False
        
    def create_payment_record(self, payment_id: str, amount: float, merchant_id: str) -> Dict:
        """Create a processed payment record"""
        return {
            'payment_id': payment_id,
            'amount': amount,
            'merchant_id': merchant_id,
            'status': 'PROCESSED',
            'processed_at': datetime.now().isoformat(),
            'processor_instance': 'broken-processor-01',
            'transaction_id': None,  # No transaction tracking!
            'idempotency_key': payment_id  # Attempt at deduplication
        }
    
    def create_audit_record(self, payment_id: str, amount: float, merchant_id: str) -> Dict:
        """Create an audit trail record"""
        return {
            'event_type': 'PAYMENT_PROCESSED',
            'payment_id': payment_id,
            'amount': amount,
            'merchant_id': merchant_id,
            'timestamp': datetime.now().isoformat(),
            'source_system': 'payment-processor',
            'compliance_flags': ['PCI_LOGGED', 'AUDIT_REQUIRED'],
            'risk_score': random.randint(1, 100)
        }
    
    def process_payment(self, payment_id: str, amount: float, merchant_id: str) -> bool:
        """
        Process a payment - BROKEN IMPLEMENTATION!
        
        This method demonstrates the classic dual-write problem:
        1. Write to payments.processed topic
        2. Write to audit.payment-events topic
        3. If step 2 fails, we have inconsistent state!
        """
        
        payment_record = self.create_payment_record(payment_id, amount, merchant_id)
        audit_record = self.create_audit_record(payment_id, amount, merchant_id)
        
        try:
            print(f"💳 Processing payment: {payment_id} (${amount:.2f})")
            
            # Step 1: Write payment record
            print(f"  📝 Writing payment record to {self.payment_topic}")
            self.producer.produce(
                topic=self.payment_topic,
                key=payment_id.encode('utf-8'),
                value=json.dumps(payment_record).encode('utf-8'),
                callback=lambda err, msg: self._delivery_callback(err, msg, "PAYMENT")
            )
            
            # Flush to ensure delivery
            self.producer.flush()
            print(f"  ✅ Payment record written successfully")
            
            # SIMULATED FAILURE POINT - this is where systems often crash!
            if self.inject_failures and random.random() < self.failure_rate:
                raise Exception(f"💥 SIMULATED SYSTEM FAILURE during payment {payment_id}!")
            
            # Step 2: Write audit record
            print(f"  📋 Writing audit record to {self.audit_topic}")
            self.producer.produce(
                topic=self.audit_topic,
                key=payment_id.encode('utf-8'),
                value=json.dumps(audit_record).encode('utf-8'),
                callback=lambda err, msg: self._delivery_callback(err, msg, "AUDIT")
            )
            
            # Flush audit record
            self.producer.flush()
            print(f"  ✅ Audit record written successfully")
            print(f"  🎯 Payment {payment_id} processed completely")
            
            return True
            
        except Exception as e:
            print(f"  ❌ FAILURE during payment {payment_id}: {e}")
            print(f"  🚨 CRITICAL: Payment may be in inconsistent state!")
            print(f"  📊 Check both topics to see if partial write occurred")
            
            # In a real system, this would trigger:
            # - Error alerts
            # - Manual investigation
            # - Potential duplicate processing
            
            return False
    
    def process_batch(self, payments: list, inject_failures: bool = False):
        """Process a batch of payments with optional failure injection"""
        
        self.inject_failures = inject_failures
        if inject_failures:
            self.failure_rate = 0.3  # 30% failure rate for demonstration
            print(f"⚠️  FAILURE INJECTION ENABLED: {self.failure_rate*100}% failure rate")
            print(f"💥 This will simulate production failures!")
        
        print(f"\n🚀 Starting batch processing of {len(payments)} payments")
        print(f"📤 Payment topic: {self.payment_topic}")
        print(f"📋 Audit topic: {self.audit_topic}")
        print("-" * 60)
        
        successful_payments = 0
        failed_payments = 0
        
        for i, payment in enumerate(payments):
            payment_id = payment['payment_id']
            amount = payment['amount']
            merchant_id = payment['merchant_id']
            
            success = self.process_payment(payment_id, amount, merchant_id)
            
            if success:
                successful_payments += 1
            else:
                failed_payments += 1
                
            # Brief pause between payments
            time.sleep(0.5)
            
            if (i + 1) % 5 == 0:
                print(f"\n📊 Progress: {i + 1}/{len(payments)} payments processed")
                print(f"✅ Successful: {successful_payments}")
                print(f"❌ Failed: {failed_payments}")
                print("-" * 40)
        
        print(f"\n🏁 Batch processing complete!")
        print(f"📊 Final Results:")
        print(f"  ✅ Successful payments: {successful_payments}")
        print(f"  ❌ Failed payments: {failed_payments}")
        
        if failed_payments > 0:
            print(f"\n🚨 CRITICAL ISSUE DETECTED:")
            print(f"  • {failed_payments} payments may be in inconsistent state")
            print(f"  • Manual reconciliation required")
            print(f"  • Check both topics for orphaned records")
            print(f"  • Customer double-charges possible on retry!")
            
            print(f"\n🔍 Investigation Commands:")
            print(f"  confluent kafka topic consume {self.payment_topic} --from-beginning")
            print(f"  confluent kafka topic consume {self.audit_topic} --from-beginning")
    
    def _delivery_callback(self, err, msg, record_type):
        """Delivery report callback"""
        if err is not None:
            print(f"    ❌ {record_type} delivery failed: {err}")
        else:
            print(f"    ✓ {record_type} delivered to {msg.topic()}[{msg.partition()}]")

def generate_test_payments(count: int = 10) -> list:
    """Generate test payment data"""
    payments = []
    
    for i in range(count):
        payment = {
            'payment_id': f'PAY-{random.randint(100000, 999999)}',
            'amount': round(random.uniform(10.0, 500.0), 2),
            'merchant_id': f'MERCH-{random.randint(1, 20)}',
            'customer_id': f'CUST-{random.randint(1000, 9999)}'
        }
        payments.append(payment)
    
    return payments

def main():
    """Run the broken payment processor"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Broken Payment Processor (Demonstrates Consistency Problems)')
    parser.add_argument('--inject-failures', action='store_true',
                       help='Inject random failures to demonstrate consistency issues')
    parser.add_argument('--recovery-mode', action='store_true',
                       help='Simulate recovery processing (may cause duplicates)')
    parser.add_argument('--count', type=int, default=10,
                       help='Number of payments to process')
    
    args = parser.parse_args()
    
    print("💳 BROKEN PAYMENT PROCESSOR")
    print("=" * 60)
    print("⚠️  WARNING: This processor is intentionally broken!")
    print("🎯 Purpose: Demonstrate dual-write consistency problems")
    print("🚨 DO NOT use this pattern in production!")
    print("=" * 60)
    
    processor = BrokenPaymentProcessor()
    
    try:
        if args.recovery_mode:
            print("\n🔄 RECOVERY MODE SIMULATION")
            print("💀 Simulating system restart after failures...")
            print("⚠️  This may cause duplicate processing!")
            
            # Simulate processing "failed" payments again
            recovery_payments = generate_test_payments(5)
            processor.process_batch(recovery_payments, inject_failures=False)
            
        else:
            # Generate test payments
            payments = generate_test_payments(args.count)
            
            # Process with or without failure injection
            processor.process_batch(payments, inject_failures=args.inject_failures)
        
        if args.inject_failures:
            print(f"\n💡 What just happened?")
            print(f"  • Some payments were recorded but audit records failed")
            print(f"  • System state is now inconsistent")
            print(f"  • Customers may be double-charged on retry")
            print(f"  • Manual reconciliation is required")
            
            print(f"\n🔧 The Solution: KAFKA TRANSACTIONS")
            print(f"  • Atomic writes to multiple topics")
            print(f"  • All-or-nothing semantics")
            print(f"  • Exactly-once delivery guaranteed")
            print(f"  • Try: python3 transactional_payment_processor.py")
        
    except KeyboardInterrupt:
        print("\n⚡ Payment processing interrupted")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
    finally:
        processor.producer.flush()

if __name__ == "__main__":
    main()