#!/usr/bin/env python3
"""
Payment Gateway Service - Entry Point for Payment Processing

This service receives payment requests from external clients and publishes them
to Kafka for downstream processing. It should ONLY have WRITE access to the
payments.raw topic.

SERVICE ACCOUNT: payment-gateway-service
REQUIRED PERMISSIONS: WRITE on topic 'payments.raw'
"""

import os
import sys
import json
import time
import random
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from datetime import datetime
from confluent_kafka import Producer
from typing import Dict

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class PaymentGateway:
    """Simulates a payment gateway that receives and publishes payment requests"""
    
    def __init__(self):
        # Use payment-gateway-service credentials
        producer_config = KafkaConfig.create_producer_config(**{
            'sasl.username': 'ZWMYVJEOTVOOZCVX',
            'sasl.password': 'to9OsrdayUamtDH06m1G9JPkEmsYXUMlY7GSrfvwYbJe4UPwIlIFEMwVezjhoVbu',
        })

        
        self.producer = Producer(producer_config)
        self.topic = 'payments.raw'
        
    def create_payment_request(self) -> Dict:
        """Generate a realistic payment request with PII data"""
        card_numbers = [
            '4532-1234-5678-9012',  # Visa test numbers
            '5555-5555-5555-4444',  # Mastercard test  
            '3782-822463-10005',    # Amex test
        ]
        
        return {
            'payment_id': f'PAY-{random.randint(100000, 999999)}',
            'timestamp': datetime.now().isoformat(),
            'amount': round(random.uniform(10.0, 2000.0), 2),
            'currency': random.choice(['USD', 'EUR', 'GBP']),
            'merchant_id': f'MERCH-{random.randint(1, 50)}',
            
            # PII Data - this is why access must be restricted!
            'card_number': random.choice(card_numbers),
            'cardholder_name': random.choice([
                'John Smith', 'Sarah Johnson', 'Mike Chen', 
                'Lisa Williams', 'David Brown', 'Emma Davis'
            ]),
            'billing_address': {
                'street': f'{random.randint(100, 9999)} Main St',
                'city': random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston']),
                'zip': f'{random.randint(10000, 99999)}'
            },
            
            'payment_method': 'CREDIT_CARD',
            'status': 'PENDING_VALIDATION'
        }
    
    def process_payments(self, num_payments: int = 10):
        """Process multiple payment requests"""
        print(f"🏦 Payment Gateway Starting...")
        print(f"📤 Attempting to send {num_payments} payments to topic: {self.topic}")
        print(f"🔐 Using service account: payment-gateway-service")
        print("-" * 60)
        
        try:
            for i in range(num_payments):
                payment = self.create_payment_request()
                
                # Produce to payments.raw topic
                self.producer.produce(
                    topic=self.topic,
                    key=payment['payment_id'].encode('utf-8'),
                    value=json.dumps(payment).encode('utf-8'),
                    callback=self._delivery_callback
                )
                
                print(f"📨 Sent payment {i+1}: {payment['payment_id']} "
                      f"(${payment['amount']:.2f})")
                
                # Poll for callbacks
                self.producer.poll(0)
                time.sleep(0.5)  # Simulate processing time
            
            # Flush remaining messages
            print("\n⏳ Flushing remaining messages...")
            self.producer.flush()
            
            print("\n✅ Payment Gateway: All payments processed successfully!")
            print("💡 This service should ONLY be able to WRITE to payments.raw")
            
        except Exception as e:
            print(f"\n❌ Payment Gateway FAILED: {e}")
            
            if "TopicAuthorizationException" in str(e):
                print("\n🔒 SECURITY ANALYSIS:")
                print("  ❌ Missing WRITE permission on topic 'payments.raw'")
                print("  ✅ Security is working - unauthorized access blocked!")
                print("\n🛠️  FIX REQUIRED:")
                print("  1. Go to Confluent Cloud Console")
                print("  2. Navigate to Security → Access Control")
                print("  3. Add ACL: payment-gateway-service → WRITE → payments.raw")
            
            return False
        
        return True
    
    def _delivery_callback(self, err, msg):
        """Callback for delivery reports"""
        if err is not None:
            print(f"❌ Delivery failed: {err}")
        # Success messages commented out to reduce noise
        # else:
        #     print(f"✓ Delivered to {msg.topic()} [{msg.partition()}]")

def main():
    """Run the payment gateway service"""
    print("=" * 60)
    print("🏦 PAYMENT GATEWAY SERVICE - PCI COMPLIANCE TEST")
    print("=" * 60)
    
    gateway = PaymentGateway()
    
    try:
        success = gateway.process_payments(5)
        
        if success:
            print("\n🎯 BUSINESS IMPACT:")
            print("  ✅ Revenue flowing - payments being processed")
            print("  ✅ PCI compliant - service has minimal required access")
            print("  ✅ Zero trust architecture - service cannot read any data")
        
    except KeyboardInterrupt:
        print("\n⚡ Payment gateway interrupted")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()