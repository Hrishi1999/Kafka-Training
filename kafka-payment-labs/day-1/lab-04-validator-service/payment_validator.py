#!/usr/bin/env python3
"""
Enhanced Payment Validator Service
Validates payment requests with business rules
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
from typing import Dict, Tuple, Optional
import re
import argparse


class PaymentValidator:
    """Service that validates payment requests"""
    
    def __init__(self, instance_id: int = 1):
        self.instance_id = instance_id
        self.running = True
        self.stats = {
            'processed': 0,
            'valid': 0,
            'invalid': 0,
            'errors': 0,
            'start_time': time.time()
        }
        
        # Validation rules
        self.MIN_AMOUNT = 0.01
        self.MAX_AMOUNT = 10000.00
        self.SUPPORTED_CURRENCIES = {'USD', 'EUR', 'GBP'}
        self.CUSTOMER_ID_PATTERN = re.compile(r'^CUST\d{4}$')
    
    def signal_handler(self, sig, frame):
        """Handle shutdown signal"""
        print(f"\n⚠️  Instance {self.instance_id}: Shutting down...")
        self.running = False
    
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
            # Decode message
            message_value = msg.value().decode('utf-8')
            payment = json.loads(message_value)
            
            # Get message metadata
            payment_id = payment.get('payment_id', 'Unknown')
            
            # Validate payment
            is_valid, error_msg = self.validate_payment(payment)
            
            if is_valid:
                self.stats['valid'] += 1
                print(f"✅ [{self.instance_id}] Valid payment: {payment_id} "
                      f"(${payment['amount']:.2f} {payment['currency']})")
                
                # In a real system, we would:
                # 1. Send to validated_payments topic
                # 2. Update payment status in database
                # 3. Trigger downstream processing
                
            else:
                self.stats['invalid'] += 1
                print(f"❌ [{self.instance_id}] Invalid payment: {payment_id} - {error_msg}")
                
                # In a real system, we would:
                # 1. Send to dead letter queue
                # 2. Log for audit
                # 3. Alert if threshold exceeded
            
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
    
    def print_statistics(self):
        """Print processing statistics"""
        elapsed = time.time() - self.stats['start_time']
        
        print(f"\n📊 Validator Instance {self.instance_id} Statistics")
        print("=" * 50)
        print(f"Total Processed:  {self.stats['processed']}")
        print(f"Valid Payments:   {self.stats['valid']}")
        print(f"Invalid Payments: {self.stats['invalid']}")
        print(f"Errors:          {self.stats['errors']}")
        
        if self.stats['processed'] > 0:
            valid_rate = (self.stats['valid'] / self.stats['processed']) * 100
            print(f"Validation Rate:  {valid_rate:.1f}%")
            print(f"Throughput:       {(self.stats['processed'] / elapsed):.1f} msg/sec")
        
        print(f"Runtime:          {elapsed:.1f} seconds")
    
    def run(self):
        """Run the validator service"""
        # Set up signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
        
        consumer = None
        
        try:
            # Validate configuration
            KafkaConfig.validate_config()
            
            # Create consumer configuration
            config = KafkaConfig.create_consumer_config(
                group_id='payment-validator',
                auto_offset_reset='earliest',
                **{
                    'client.id': f'validator-{self.instance_id}',
                    'max.poll.interval.ms': 300000,  # 5 minutes
                    'session.timeout.ms': 10000,      # 10 seconds
                }
            )
            
            # Create consumer
            consumer = Consumer(config)
            
            # Subscribe to topic
            consumer.subscribe(['payment_requests'])
            
            print(f"🚀 Payment Validator Instance {self.instance_id} Started")
            print("=" * 50)
            print("Validating payments... (Press Ctrl+C to stop)")
            
            # Main processing loop
            while self.running:
                msg = consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # Normal condition
                        continue
                    else:
                        print(f"❌ Consumer error: {msg.error()}")
                        self.stats['errors'] += 1
                else:
                    self.process_message(msg)
                    
                    # Print progress every 50 messages
                    if self.stats['processed'] % 50 == 0 and self.stats['processed'] > 0:
                        print(f"📈 [{self.instance_id}] Processed {self.stats['processed']} messages...")
            
        except Exception as e:
            print(f"❌ Fatal error: {e}")
            sys.exit(1)
        finally:
            # Clean shutdown
            if consumer:
                consumer.close()
            
            # Print final statistics
            self.print_statistics()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Payment Validator Service')
    parser.add_argument('--instance', type=int, default=1,
                        help='Instance ID for multiple consumers')
    
    args = parser.parse_args()
    
    # Create and run validator
    validator = PaymentValidator(instance_id=args.instance)
    validator.run()


if __name__ == "__main__":
    main()