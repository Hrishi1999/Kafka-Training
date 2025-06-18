#!/usr/bin/env python3
"""
Transactional Consumer - Reading with Isolation Levels

This consumer demonstrates the difference between read_committed and read_uncommitted
isolation levels when consuming transactional data.

YOUR TASK: Complete the TODOs to implement proper transactional consumption.
"""

import os
import sys
import json
import time
from datetime import datetime
from confluent_kafka import Consumer, TopicPartition
from typing import Dict, List

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class TransactionalConsumer:
    """Consumer configured for transactional data consumption"""
    
    def __init__(self, group_id: str = "transaction-demo-consumer", 
                 isolation_level: str = "read_committed"):
        
        # Create base consumer config using common KafkaConfig
        base_config = KafkaConfig.create_consumer_config(
            group_id=group_id,
            auto_offset_reset='earliest'
        )
        
        # Add transactional consumption configuration
        self.config = {
            **base_config,  # Use the common config as base
            
            # TODO: Configure isolation level for transactional consumption
            'isolation.level': isolation_level,  # read_committed or read_uncommitted
            
            # TODO: Configure manual offset management for transactional processing
            'enable.auto.commit': False,  # Manual commit for transactional processing
            
            'client.id': f'transactional-consumer-{isolation_level}',
            'fetch.min.bytes': 1,
            'fetch.wait.max.ms': 500
        }
        
        self.consumer = Consumer(self.config)
        self.isolation_level = isolation_level
        
        # Topics to consume
        self.topics = ['payment_requests', 'audit.payment-events']
        
        # Statistics
        self.stats = {
            'payments_consumed': 0,
            'audits_consumed': 0,
            'total_messages': 0,
            'aborted_messages_seen': 0,
            'committed_messages_seen': 0
        }
    
    def consume_transactional_data(self, max_messages: int = 50, timeout_seconds: int = 30):
        """
        Consume transactional data with proper isolation level handling.
        
        TODO: Implement proper transactional consumption with manual offset management.
        """
        
        print(f"🔍 Starting transactional consumer")
        print(f"📋 Isolation Level: {self.isolation_level}")
        print(f"📥 Topics: {', '.join(self.topics)}")
        print(f"👥 Consumer Group: {self.config['group.id']}")
        print(f"🔧 Auto Commit: {self.config['enable.auto.commit']}")
        print("-" * 60)
        
        # TODO: Subscribe to topics
        self.consumer.subscribe(self.topics)
        
        messages_consumed = 0
        start_time = time.time()
        payment_audit_pairs = {}  # Track payment-audit pairs
        
        try:
            while messages_consumed < max_messages and (time.time() - start_time) < timeout_seconds:
                
                # TODO: Poll for messages with appropriate timeout
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    print("⏱️  No messages received, waiting...")
                    continue
                
                if msg.error():
                    print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                # TODO: Process the message and track statistics
                self._process_message(msg, payment_audit_pairs)
                messages_consumed += 1
                
                # TODO: Implement manual offset commit for transactional processing
                # Hint: Commit offsets after processing each message or batch
                try:
                    self.consumer.commit(asynchronous=False)
                except Exception as e:
                    print(f"⚠️  Offset commit failed: {e}")
                
                # Progress update
                if messages_consumed % 10 == 0:
                    self._print_progress(messages_consumed, payment_audit_pairs)
        
        except KeyboardInterrupt:
            print(f"\n⚡ Consumer interrupted by user")
        
        finally:
            # TODO: Close the consumer properly
            print(f"\n🏁 Closing consumer...")
            self.consumer.close()
            
            self._print_final_results(payment_audit_pairs)
    
    def _process_message(self, msg, payment_audit_pairs: Dict):
        """Process individual messages and track transaction consistency"""
        
        topic = msg.topic()
        key = msg.key().decode('utf-8') if msg.key() else None
        
        try:
            value = json.loads(msg.value().decode('utf-8'))
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in message from {topic}")
            return
        
        self.stats['total_messages'] += 1
        
        # Track message metadata
        headers = {}
        if msg.headers():
            headers = {k: v.decode('utf-8') if isinstance(v, bytes) else v 
                      for k, v in msg.headers()}
        
        # Check if this is from a transaction (Kafka adds transaction metadata)
        is_transactional = self._is_transactional_message(msg, value)
        
        if topic == 'payment_requests':
            self.stats['payments_consumed'] += 1
            payment_id = value.get('payment_id', key)
            
            if payment_id not in payment_audit_pairs:
                payment_audit_pairs[payment_id] = {'payment': None, 'audit': None}
            
            payment_audit_pairs[payment_id]['payment'] = {
                'data': value,
                'offset': msg.offset(),
                'partition': msg.partition(),
                'timestamp': msg.timestamp(),
                'transactional': is_transactional
            }
            
            print(f"💳 Payment: {payment_id} (${value.get('amount', 'N/A')}) "
                  f"[{topic}:{msg.partition()}:{msg.offset()}]")
            
        elif topic == 'audit.payment-events':
            self.stats['audits_consumed'] += 1
            payment_id = value.get('payment_id', key)
            
            if payment_id not in payment_audit_pairs:
                payment_audit_pairs[payment_id] = {'payment': None, 'audit': None}
            
            payment_audit_pairs[payment_id]['audit'] = {
                'data': value,
                'offset': msg.offset(),
                'partition': msg.partition(),
                'timestamp': msg.timestamp(),
                'transactional': is_transactional
            }
            
            print(f"📋 Audit: {payment_id} (score: {value.get('risk_score', 'N/A')}) "
                  f"[{topic}:{msg.partition()}:{msg.offset()}]")
        
        # Update transaction statistics
        if is_transactional:
            self.stats['committed_messages_seen'] += 1
        else:
            # With read_committed, we shouldn't see aborted messages
            if self.isolation_level == "read_uncommitted":
                self.stats['aborted_messages_seen'] += 1
    
    def _is_transactional_message(self, msg, value: Dict) -> bool:
        """
        Determine if a message was part of a committed transaction.
        
        Note: With read_committed isolation, all messages we see are committed.
        With read_uncommitted, we might see aborted transaction messages.
        """
        
        # Check message metadata for transaction indicators
        transaction_enabled = value.get('transaction_enabled', False)
        exactly_once = value.get('exactly_once', False)
        
        # In read_committed mode, all messages are from committed transactions
        if self.isolation_level == "read_committed":
            return True
        
        # For read_uncommitted, we need to check message attributes
        return transaction_enabled or exactly_once
    
    def _print_progress(self, messages_consumed: int, payment_audit_pairs: Dict):
        """Print consumption progress"""
        
        complete_pairs = sum(1 for pair in payment_audit_pairs.values() 
                           if pair['payment'] and pair['audit'])
        
        orphaned_payments = sum(1 for pair in payment_audit_pairs.values() 
                              if pair['payment'] and not pair['audit'])
        
        orphaned_audits = sum(1 for pair in payment_audit_pairs.values() 
                            if not pair['payment'] and pair['audit'])
        
        print(f"\n📊 Progress Update (consumed {messages_consumed} messages):")
        print(f"  💳 Payments: {self.stats['payments_consumed']}")
        print(f"  📋 Audits: {self.stats['audits_consumed']}")
        print(f"  ✅ Complete pairs: {complete_pairs}")
        print(f"  ⚠️  Orphaned payments: {orphaned_payments}")
        print(f"  ⚠️  Orphaned audits: {orphaned_audits}")
        print("-" * 40)
    
    def _print_final_results(self, payment_audit_pairs: Dict):
        """Print final consumption results and consistency analysis"""
        
        print(f"\n🏁 TRANSACTIONAL CONSUMPTION COMPLETE")
        print(f"=" * 60)
        print(f"📊 Consumption Statistics:")
        print(f"  📥 Total messages: {self.stats['total_messages']}")
        print(f"  💳 Payments consumed: {self.stats['payments_consumed']}")
        print(f"  📋 Audits consumed: {self.stats['audits_consumed']}")
        print(f"  🔒 Isolation level: {self.isolation_level}")
        
        if self.isolation_level == "read_committed":
            print(f"  ✅ Committed messages: {self.stats['committed_messages_seen']}")
            print(f"  ❌ Aborted messages: 0 (filtered by isolation level)")
        else:
            print(f"  ✅ Committed messages: {self.stats['committed_messages_seen']}")
            print(f"  ❌ Aborted messages: {self.stats['aborted_messages_seen']}")
        
        # Analyze consistency
        complete_pairs = []
        orphaned_payments = []
        orphaned_audits = []
        
        for payment_id, pair in payment_audit_pairs.items():
            if pair['payment'] and pair['audit']:
                complete_pairs.append(payment_id)
            elif pair['payment'] and not pair['audit']:
                orphaned_payments.append(payment_id)
            elif not pair['payment'] and pair['audit']:
                orphaned_audits.append(payment_id)
        
        print(f"\n🔍 Consistency Analysis:")
        print(f"  ✅ Complete payment-audit pairs: {len(complete_pairs)}")
        print(f"  ⚠️  Orphaned payments (no audit): {len(orphaned_payments)}")
        print(f"  ⚠️  Orphaned audits (no payment): {len(orphaned_audits)}")
        
        if len(orphaned_payments) == 0 and len(orphaned_audits) == 0:
            print(f"  🎯 PERFECT CONSISTENCY: All payments have matching audits!")
        else:
            print(f"  🚨 CONSISTENCY ISSUES DETECTED:")
            for payment_id in orphaned_payments:
                print(f"    • Payment {payment_id} has no audit record")
            for payment_id in orphaned_audits:
                print(f"    • Audit {payment_id} has no payment record")
        
        print(f"\n💡 Isolation Level Impact:")
        if self.isolation_level == "read_committed":
            print(f"  ✅ Only committed transaction data consumed")
            print(f"  ✅ No aborted/partial transaction data visible")
            print(f"  ✅ Consistent view of the data")
        else:
            print(f"  ⚠️  All data consumed (including aborted transactions)")
            print(f"  ⚠️  May see partial/inconsistent transaction data")
            print(f"  ⚠️  Application must handle inconsistencies")

def compare_isolation_levels():
    """
    TODO: Implement a comparison between read_committed and read_uncommitted isolation levels.
    
    This function should:
    1. Create consumers with both isolation levels
    2. Consume the same data with both
    3. Compare the results to show the difference
    """
    
    print(f"🔬 ISOLATION LEVEL COMPARISON")
    print(f"=" * 60)
    print(f"This will demonstrate the difference between isolation levels")
    
    # TODO: Implement comparison logic
    print(f"💡 TODO: Complete the isolation level comparison")
    print(f"  1. Create read_committed consumer")
    print(f"  2. Create read_uncommitted consumer") 
    print(f"  3. Consume same data with both")
    print(f"  4. Compare results")

def main():
    """Run the transactional consumer"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Transactional Consumer Demo')
    parser.add_argument('--isolation-level', choices=['read_committed', 'read_uncommitted'],
                       default='read_committed', help='Consumer isolation level')
    parser.add_argument('--compare-levels', action='store_true',
                       help='Compare both isolation levels')
    parser.add_argument('--max-messages', type=int, default=50,
                       help='Maximum messages to consume')
    parser.add_argument('--timeout', type=int, default=30,
                       help='Timeout in seconds')
    parser.add_argument('--group-id', type=str, default='transaction-demo-consumer',
                       help='Consumer group ID')
    
    args = parser.parse_args()
    
    print("🔍 TRANSACTIONAL CONSUMER")
    print("=" * 60)
    print("🎯 Purpose: Demonstrate transactional data consumption")
    print("🔒 Focus: Isolation levels and consistency guarantees")
    print("=" * 60)
    
    try:
        if args.compare_levels:
            compare_isolation_levels()
        else:
            consumer = TransactionalConsumer(
                group_id=args.group_id,
                isolation_level=args.isolation_level
            )
            
            print(f"\n💡 Before consuming, generate some transactional data:")
            print(f"  python3 transactional_payment_processor.py --inject-failures")
            print(f"  python3 broken_payment_processor.py --inject-failures")
            
            input(f"\nPress Enter when ready to consume...")
            
            consumer.consume_transactional_data(
                max_messages=args.max_messages,
                timeout_seconds=args.timeout
            )
    
    except KeyboardInterrupt:
        print(f"\n⚡ Consumer interrupted")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()