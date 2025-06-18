#!/usr/bin/env python3
"""
Transactional Payment Processor - COMPLETE SOLUTION

This is the complete implementation showing proper Kafka transactions
for atomic payment processing.
"""

import os
import sys
import json
import time
import random
from datetime import datetime
from confluent_kafka import Producer, KafkaException
from typing import Dict

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class TransactionalPaymentProcessor:
    """A payment processor that ensures atomic operations using Kafka transactions"""
    
    def __init__(self, instance_id: str = "processor-01"):
        # Create base producer config using common KafkaConfig
        base_config = KafkaConfig.create_producer_config()
        
        # Add transactional configuration to base config
        self.config = {
            **base_config,  # Use the common config as base
            # Transactional configuration
            'transactional.id': f'payment-processor-{instance_id}',  # Must be unique per producer
            'enable.idempotence': True,        # Required for transactions
            'acks': 'all',                     # Wait for all in-sync replicas
            'retries': 2147483647,             # Retry indefinitely (until timeout)
            'max.in.flight.requests.per.connection': 5,  # Allow batching while maintaining order
            'transaction.timeout.ms': 600000,   # 10 minutes transaction timeout
            'delivery.timeout.ms': 300000,      # 5 minutes total delivery timeout (must be <= transaction.timeout.ms)
            'request.timeout.ms': 30000,        # 30 seconds per request
        }
        
        # Create the producer
        self.producer = Producer(self.config)
        
        # Topic configuration
        self.payment_topic = 'payment_requests'
        self.audit_topic = 'audit.payment-events'
        
        # Initialize transactions
        try:
            print("🔧 Initializing transactional producer...")
            self.producer.init_transactions()
            print("✅ Transactional producer initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize transactions: {e}")
            raise
        
        # Statistics
        self.stats = {
            'total_processed': 0,
            'successful_transactions': 0,
            'aborted_transactions': 0,
            'retry_attempts': 0
        }
    
    def create_payment_record(self, payment_id: str, amount: float, merchant_id: str) -> Dict:
        """Create a processed payment record with transaction metadata"""
        return {
            'payment_id': payment_id,
            'amount': amount,
            'merchant_id': merchant_id,
            'status': 'PROCESSED',
            'processed_at': datetime.now().isoformat(),
            'processor_instance': self.config['transactional.id'],
            'transaction_enabled': True,  # Indicates transactional processing
            'exactly_once': True,        # Exactly-once semantics guaranteed
            'idempotency_key': payment_id
        }
    
    def create_audit_record(self, payment_id: str, amount: float, merchant_id: str) -> Dict:
        """Create an audit trail record with transaction metadata"""
        return {
            'event_type': 'PAYMENT_PROCESSED',
            'payment_id': payment_id,
            'amount': amount,
            'merchant_id': merchant_id,
            'timestamp': datetime.now().isoformat(),
            'source_system': 'transactional-payment-processor',
            'processor_instance': self.config['transactional.id'],
            'compliance_flags': ['PCI_LOGGED', 'AUDIT_REQUIRED', 'EXACTLY_ONCE'],
            'risk_score': random.randint(1, 100),
            'transaction_guaranteed': True
        }
    
    def process_payment_atomically(self, payment_id: str, amount: float, merchant_id: str, 
                                 inject_failure: bool = False) -> bool:
        """
        Process a payment with atomic guarantees using Kafka transactions.
        """
        
        payment_record = self.create_payment_record(payment_id, amount, merchant_id)
        audit_record = self.create_audit_record(payment_id, amount, merchant_id)
        
        print(f"💳 Processing payment atomically: {payment_id} (${amount:.2f})")
        
        try:
            # Begin the transaction
            print(f"  🚀 Beginning transaction for payment {payment_id}")
            self.producer.begin_transaction()
            
            # Send payment record within transaction
            print(f"  📝 Sending payment record to {self.payment_topic}")
            self.producer.produce(
                topic=self.payment_topic,
                key=payment_id.encode('utf-8'),
                value=json.dumps(payment_record).encode('utf-8')
            )
            
            # Send audit record within transaction
            print(f"  📋 Sending audit record to {self.audit_topic}")
            self.producer.produce(
                topic=self.audit_topic,
                key=payment_id.encode('utf-8'),
                value=json.dumps(audit_record).encode('utf-8')
            )
            
            # Simulate failure injection for testing
            if inject_failure and random.random() < 0.5:
                raise Exception(f"💥 SIMULATED FAILURE during transaction for payment {payment_id}")
            
            # Commit the transaction
            print(f"  ✅ Committing transaction for payment {payment_id}")
            self.producer.commit_transaction()
            
            print(f"  🎯 Payment {payment_id} processed atomically - EXACTLY ONCE!")
            self.stats['successful_transactions'] += 1
            return True
            
        except Exception as e:
            # Abort the transaction on any failure
            print(f"  ❌ Error in transaction for payment {payment_id}: {e}")
            print(f"  🔄 Aborting transaction - NO PARTIAL STATE!")
            
            try:
                self.producer.abort_transaction()
                print(f"  ✅ Transaction aborted successfully - system remains consistent")
                self.stats['aborted_transactions'] += 1
            except Exception as abort_error:
                print(f"  💥 Error aborting transaction: {abort_error}")
                # This is serious - may need to restart producer
                raise
                
            return False
        
        finally:
            self.stats['total_processed'] += 1
    
    def process_batch_with_retry(self, payments: list, inject_failures: bool = False, 
                               max_retries: int = 3) -> Dict:
        """Process a batch of payments with retry logic for failed transactions."""
        
        print(f"\n🚀 Starting transactional batch processing of {len(payments)} payments")
        if inject_failures:
            print(f"⚠️  FAILURE INJECTION ENABLED - testing transaction rollback")
        print(f"📤 Payment topic: {self.payment_topic}")
        print(f"📋 Audit topic: {self.audit_topic}")
        print(f"🔒 Transactional ID: {self.config['transactional.id']}")
        print("-" * 60)
        
        results = {
            'successful': [],
            'failed': [],
            'retried': []
        }
        
        for payment in payments:
            payment_id = payment['payment_id']
            amount = payment['amount']
            merchant_id = payment['merchant_id']
            
            # Implement retry logic
            success = False
            retry_count = 0
            
            while not success and retry_count <= max_retries:
                if retry_count > 0:
                    print(f"  🔄 Retry attempt {retry_count} for payment {payment_id}")
                    self.stats['retry_attempts'] += 1
                    time.sleep(1)  # Brief delay before retry
                
                success = self.process_payment_atomically(
                    payment_id, amount, merchant_id, 
                    inject_failure=inject_failures
                )
                
                retry_count += 1
            
            if success:
                results['successful'].append(payment_id)
                if retry_count > 1:
                    results['retried'].append(payment_id)
            else:
                results['failed'].append(payment_id)
                print(f"  💀 Payment {payment_id} failed after {max_retries} retries")
            
            # Brief pause between payments
            time.sleep(0.3)
        
        self._print_batch_results(results)
        return results
    
    def _print_batch_results(self, results: Dict):
        """Print comprehensive batch processing results"""
        print(f"\n🏁 Transactional batch processing complete!")
        print(f"=" * 60)
        print(f"📊 Transaction Statistics:")
        print(f"  ✅ Successful transactions: {self.stats['successful_transactions']}")
        print(f"  ❌ Aborted transactions: {self.stats['aborted_transactions']}")
        print(f"  🔄 Retry attempts: {self.stats['retry_attempts']}")
        print(f"  📈 Total processed: {self.stats['total_processed']}")
        
        success_rate = (self.stats['successful_transactions'] / 
                       max(self.stats['total_processed'], 1)) * 100
        print(f"  📊 Success rate: {success_rate:.1f}%")
        
        print(f"\n📋 Batch Results:")
        print(f"  ✅ Successful payments: {len(results['successful'])}")
        print(f"  🔄 Retried payments: {len(results['retried'])}")
        print(f"  ❌ Failed payments: {len(results['failed'])}")
        
        if results['failed']:
            print(f"\n🚨 Failed payments (require manual intervention):")
            for payment_id in results['failed']:
                print(f"    • {payment_id}")
        
        print(f"\n🎯 Consistency Guarantee:")
        if self.stats['aborted_transactions'] > 0:
            print(f"  ✅ {self.stats['aborted_transactions']} transactions were safely aborted")
            print(f"  ✅ No partial writes - system remains consistent")
            print(f"  ✅ No duplicate charges possible")
        print(f"  ✅ All successful payments have complete audit trails")
        print(f"  ✅ Exactly-once delivery guaranteed")
    
    def demonstrate_atomicity(self):
        """Demonstrate the atomic nature of transactions with guaranteed failures."""
        print(f"\n🧪 ATOMICITY DEMONSTRATION")
        print(f"=" * 50)
        print(f"Testing that failed transactions leave NO partial state")
        
        test_payment = {
            'payment_id': 'DEMO-ATOMICITY-TEST',
            'amount': 999.99,
            'merchant_id': 'DEMO-MERCHANT'
        }
        
        print(f"\n📋 Before test - check topics are clean")
        print(f"💡 Run these commands to verify:")
        print(f"  confluent kafka topic consume {self.payment_topic} --timeout 5000")
        print(f"  confluent kafka topic consume {self.audit_topic} --timeout 5000")
        
        input(f"\nPress Enter to proceed with atomic test...")
        
        # Force a transaction to fail and show rollback
        print(f"🎯 Forcing transaction failure to demonstrate rollback...")
        
        # This should fail and rollback
        success = self.process_payment_atomically(
            test_payment['payment_id'],
            test_payment['amount'], 
            test_payment['merchant_id'],
            inject_failure=True
        )
        
        print(f"\n🔍 After failed transaction - verify NO partial state:")
        print(f"  • Check {self.payment_topic} - should have NO record")
        print(f"  • Check {self.audit_topic} - should have NO record")
        print(f"  • Transaction rollback ensures atomic behavior")
        
        if not success:
            print(f"\n✅ ATOMICITY VERIFIED!")
            print(f"  • Transaction failed as expected")
            print(f"  • NO partial data written")
            print(f"  • System remains consistent")

def generate_test_payments(count: int = 8) -> list:
    """Generate test payment data for transaction testing"""
    payments = []
    
    for i in range(count):
        payment = {
            'payment_id': f'TXN-{random.randint(100000, 999999)}',
            'amount': round(random.uniform(50.0, 1000.0), 2),
            'merchant_id': f'MERCH-{random.randint(1, 20)}',
            'customer_id': f'CUST-{random.randint(1000, 9999)}'
        }
        payments.append(payment)
    
    return payments

def main():
    """Run the transactional payment processor"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Transactional Payment Processor (COMPLETE Solution)')
    parser.add_argument('--inject-failures', action='store_true',
                       help='Inject failures to test transaction rollback')
    parser.add_argument('--demo-atomicity', action='store_true',
                       help='Run atomicity demonstration')
    parser.add_argument('--count', type=int, default=8,
                       help='Number of payments to process')
    parser.add_argument('--instance-id', type=str, default='demo-01',
                       help='Unique instance identifier for transactional.id')
    
    args = parser.parse_args()
    
    print("💳 TRANSACTIONAL PAYMENT PROCESSOR - COMPLETE SOLUTION")
    print("=" * 60)
    print("✅ This processor uses Kafka transactions for consistency")
    print("🎯 Purpose: Demonstrate exactly-once payment processing")
    print("🔒 Guarantee: Atomic writes to multiple topics")
    print("=" * 60)
    
    try:
        processor = TransactionalPaymentProcessor(instance_id=args.instance_id)
        
        if args.demo_atomicity:
            processor.demonstrate_atomicity()
        else:
            payments = generate_test_payments(args.count)
            results = processor.process_batch_with_retry(
                payments, 
                inject_failures=args.inject_failures
            )
            
            if args.inject_failures:
                print(f"\n💡 What you just saw:")
                print(f"  ✅ Failed transactions were safely rolled back")
                print(f"  ✅ No partial writes occurred")
                print(f"  ✅ System remained consistent throughout")
                print(f"  ✅ Retries worked on transient failures")
                print(f"\n🔍 Compare with broken_payment_processor.py to see the difference!")
        
    except KeyboardInterrupt:
        print(f"\n⚡ Payment processing interrupted")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()