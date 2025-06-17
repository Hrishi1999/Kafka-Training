#!/usr/bin/env python3
"""
Enhanced Payment Validator Service with Rebalance Monitoring
Shows rebalance events and partition assignments
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Consumer, KafkaError, KafkaException
from common.config import KafkaConfig
import json
import signal
import time
from datetime import datetime
from typing import Dict, Tuple, Optional, List
import re
import argparse


class PaymentValidator:
    """Service that validates payment requests with rebalance monitoring"""
    
    def __init__(self, instance_id: int = 1):
        self.instance_id = instance_id
        self.running = True
        self.stats = {
            'processed': 0,
            'valid': 0,
            'invalid': 0,
            'errors': 0,
            'rebalances': 0,
            'start_time': time.time()
        }
        
        # Partition tracking
        self.assigned_partitions = []
        self.last_rebalance_time = None
        
        # Validation rules
        self.MIN_AMOUNT = 0.01
        self.MAX_AMOUNT = 10000.00
        self.SUPPORTED_CURRENCIES = {'USD', 'EUR', 'GBP'}
        self.CUSTOMER_ID_PATTERN = re.compile(r'^CUST\d{4}$')
    
    def signal_handler(self, sig, frame):
        """Handle shutdown signal"""
        print(f"\n⚠️  Instance {self.instance_id}: Shutting down...")
        self.running = False
    
    def on_assign(self, consumer, partitions):
        """Called when partitions are assigned during rebalance"""
        self.stats['rebalances'] += 1
        self.last_rebalance_time = time.time()
        self.assigned_partitions = [tp.partition for tp in partitions]
        
        partition_list = ', '.join(map(str, self.assigned_partitions))
        print(f"\n🔄 REBALANCE [{self.instance_id}] - ASSIGNED partitions: [{partition_list}]")
        print(f"   └─ Rebalance #{self.stats['rebalances']} at {datetime.now().strftime('%H:%M:%S')}")
    
    def on_revoke(self, consumer, partitions):
        """Called when partitions are revoked during rebalance"""
        revoked_partitions = [tp.partition for tp in partitions]
        partition_list = ', '.join(map(str, revoked_partitions))
        print(f"\n🔄 REBALANCE [{self.instance_id}] - REVOKED partitions: [{partition_list}]")
        print(f"   └─ Preparing for rebalance...")
    
    def validate_payment(self, payment: Dict) -> Tuple[bool, Optional[str]]:
        """
        Validate a payment request against business rules
        
        Args:
            payment: Payment dictionary
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check required fields
        required_fields = ['payment_id', 'amount', 'currency', 'customer_id', 'timestamp']
        for field in required_fields:
            if field not in payment:
                return False, f"Missing required field: {field}"
        
        # Validate amount
        try:
            amount = float(payment['amount'])
            if amount < self.MIN_AMOUNT:
                return False, f"Amount too small: ${amount:.2f} (min: ${self.MIN_AMOUNT})"
            if amount > self.MAX_AMOUNT:
                return False, f"Amount too large: ${amount:.2f} (max: ${self.MAX_AMOUNT})"
        except (ValueError, TypeError):
            return False, f"Invalid amount: {payment.get('amount')}"
        
        # Validate currency
        currency = payment.get('currency', '').upper()
        if currency not in self.SUPPORTED_CURRENCIES:
            return False, f"Unsupported currency: {currency}"
        
        # Validate customer ID format
        customer_id = payment.get('customer_id', '')
        if not self.CUSTOMER_ID_PATTERN.match(customer_id):
            return False, f"Invalid customer ID format: {customer_id}"
        
        # Validate timestamp
        try:
            timestamp = datetime.fromisoformat(payment['timestamp'].replace('Z', '+00:00'))
            if timestamp > datetime.utcnow():
                return False, "Timestamp is in the future"
        except Exception:
            return False, f"Invalid timestamp: {payment.get('timestamp')}"
        
        # Check for suspicious patterns
        if amount > 5000 and payment.get('payment_method') == 'digital_wallet':
            return False, "High-value digital wallet transaction flagged for review"
        
        return True, None
    
    def process_message(self, msg) -> bool:
        """Process a single message"""
        try:
            # Show partition info occasionally
            partition = msg.partition()
            
            # Decode message
            message_value = msg.value().decode('utf-8')
            payment = json.loads(message_value)
            
            # Get message metadata
            payment_id = payment.get('payment_id', 'Unknown')
            cid = payment.get('customer_id', 'Unknown')

            # Validate payment
            is_valid, error_msg = self.validate_payment(payment)
            
            if is_valid:
                self.stats['valid'] += 1
                print(f"✅ [{self.instance_id}:P{partition}] Valid: {cid} "
                      f"(${payment['amount']:.2f} {payment['currency']})")
                
            else:
                self.stats['invalid'] += 1
                print(f"❌ [{self.instance_id}:P{partition}] Invalid: {payment_id} - {error_msg}")
            
            self.stats['processed'] += 1
            return True
            
        except json.JSONDecodeError:
            self.stats['errors'] += 1
            print(f"❌ [{self.instance_id}] Invalid JSON in message")
            return False
        except Exception as e:
            self.stats['errors'] += 1
            print(f"❌ [{self.instance_id}] Error processing message: {e}")
            return False
    
    def print_status(self):
        """Print current status including partition assignment"""
        partition_list = ', '.join(map(str, self.assigned_partitions)) if self.assigned_partitions else "None"
        elapsed = time.time() - self.stats['start_time']
        
        print(f"\n📊 [{self.instance_id}] Status - Partitions: [{partition_list}] | "
              f"Processed: {self.stats['processed']} | "
              f"Valid: {self.stats['valid']} | "
              f"Rebalances: {self.stats['rebalances']} | "
              f"Runtime: {elapsed:.0f}s")
    
    def print_statistics(self):
        """Print final processing statistics"""
        elapsed = time.time() - self.stats['start_time']
        
        print(f"\n📊 Final Statistics - Validator Instance {self.instance_id}")
        print("=" * 60)
        print(f"Total Processed:   {self.stats['processed']}")
        print(f"Valid Payments:    {self.stats['valid']}")
        print(f"Invalid Payments:  {self.stats['invalid']}")
        print(f"Errors:           {self.stats['errors']}")
        print(f"Rebalances:       {self.stats['rebalances']}")
        
        if self.stats['processed'] > 0:
            valid_rate = (self.stats['valid'] / self.stats['processed']) * 100
            print(f"Validation Rate:   {valid_rate:.1f}%")
            print(f"Throughput:        {(self.stats['processed'] / elapsed):.1f} msg/sec")
        
        print(f"Total Runtime:     {elapsed:.1f} seconds")
    
    def run(self):
        """Run the validator service"""
        # Set up signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
        
        consumer = None
        last_status_time = time.time()
        
        try:
            # Create consumer configuration with shorter session timeout to trigger rebalances
            config = KafkaConfig.create_consumer_config(
                group_id='payment-validator',
                auto_offset_reset='earliest',
                **{
                    'client.id': f'validator-{self.instance_id}',
                    'session.timeout.ms': 10000,      # 10 seconds - shorter for demo
                    'heartbeat.interval.ms': 3000,    # 3 seconds
                    'max.poll.interval.ms': 300000,   # 5 minutes
                    'enable.auto.commit': True,
                    'auto.commit.interval.ms': 5000,
                }
            )
            
            # Create consumer with rebalance callbacks
            consumer = Consumer(config)
            
            # Subscribe with rebalance callbacks
            consumer.subscribe(
                ['topic_6'], 
                on_assign=self.on_assign,
                on_revoke=self.on_revoke
            )
            
            print(f"🚀 Payment Validator Instance {self.instance_id} Started")
            print("=" * 60)
            print("💡 To see rebalances, start/stop other consumer instances!")
            print("   Example: python validator.py --instance 2")
            print("=" * 60)
            
            # Main processing loop
            while self.running:
                msg = consumer.poll(timeout=1.0)
                
                if msg is None:
                    # Print status every 10 seconds when idle
                    if time.time() - last_status_time > 10:
                        self.print_status()
                        last_status_time = time.time()
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"❌ Consumer error: {msg.error()}")
                        self.stats['errors'] += 1
                else:
                    self.process_message(msg)
                    
                    # Print status every 20 messages or 15 seconds
                    if (self.stats['processed'] % 20 == 0 or 
                        time.time() - last_status_time > 15):
                        self.print_status()
                        last_status_time = time.time()
            
        except Exception as e:
            print(f"❌ Fatal error: {e}")
            sys.exit(1)
        finally:
            # Clean shutdown
            if consumer:
                print(f"\n🛑 [{self.instance_id}] Closing consumer...")
                consumer.close()
            
            # Print final statistics
            self.print_statistics()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Payment Validator with Rebalance Monitoring')
    parser.add_argument('--instance', type=int, default=1,
                        help='Instance ID for multiple consumers (try 1, 2, 3...)')
    
    args = parser.parse_args()
    
    print(f"Starting validator instance {args.instance}")
    print("💡 TIP: Run multiple instances to see rebalancing:")
    print("   Terminal 1: python validator.py --instance 1")
    print("   Terminal 2: python validator.py --instance 2")
    print("   Terminal 3: python validator.py --instance 3")
    print()
    
    # Create and run validator
    validator = PaymentValidator(instance_id=args.instance)
    validator.run()


if __name__ == "__main__":
    main()