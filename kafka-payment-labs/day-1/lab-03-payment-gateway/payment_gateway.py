#!/usr/bin/env python3
"""
Enhanced Payment Gateway Producer
A more realistic implementation with proper error handling and monitoring
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Producer, KafkaError
from common.config import KafkaConfig
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Optional
import random


class PaymentGateway:
    """Payment Gateway that publishes payment requests to Kafka"""
    
    def __init__(self, config: Dict[str, str]):
        """Initialize the payment gateway with Kafka configuration"""
        self.producer = Producer(config)
        self.topic = 'payment_requests'
        self.stats = {
            'sent': 0,
            'delivered': 0,
            'failed': 0
        }
    
    def delivery_callback(self, err: Optional[KafkaError], msg):
        """Handle delivery reports from Kafka"""
        if err is not None:
            self.stats['failed'] += 1
            print(f"❌ Delivery failed for payment {msg.key().decode('utf-8')}: {err}")
        else:
            self.stats['delivered'] += 1
            # In production, you might log this instead of printing
            if self.stats['delivered'] % 10 == 0:  # Print every 10th message
                print(f"✅ {self.stats['delivered']} payments delivered successfully")
    
    def create_payment_request(
        self, 
        amount: float, 
        customer_id: str,
        merchant_id: str = "MERCH001",
        payment_method: str = "credit_card"
    ) -> Dict:
        """
        Create a properly structured payment request
        
        Args:
            amount: Payment amount
            customer_id: Customer identifier
            merchant_id: Merchant identifier
            payment_method: Payment method (credit_card, debit_card, etc.)
            
        Returns:
            Payment request dictionary
        """
        payment_id = str(uuid.uuid4())
        
        return {
            'payment_id': payment_id,
            'customer_id': customer_id,
            'merchant_id': merchant_id,
            'amount': amount,
            'currency': 'USD',
            'payment_method': payment_method,
            'status': 'pending',
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': {
                'source': 'payment_gateway',
                'version': '1.0',
                'region': 'us-east-1'
            }
        }
    
    def send_payment(self, payment_request: Dict) -> bool:
        """
        Send a payment request to Kafka
        
        Args:
            payment_request: Payment request dictionary
            
        Returns:
            True if queued successfully, False otherwise
        """
        try:
            # Use payment_id as the message key for ordering guarantees
            key = payment_request['customer_id']
            
            # Serialize to JSON
            value = json.dumps(payment_request)
            
            # Send to Kafka
            self.producer.produce(
                topic=self.topic,
                key=key.encode('utf-8'),
                value=value.encode('utf-8'),
                callback=self.delivery_callback
            )
            
            self.stats['sent'] += 1
            
            # Trigger any pending callbacks
            self.producer.poll(0)
            
            return True
            
        except BufferError:
            print("⚠️  Producer buffer full, waiting...")
            self.producer.poll(1)  # Wait up to 1 second
            return False
        except Exception as e:
            print(f"❌ Error sending payment: {e}")
            return False
    
    def simulate_payment_traffic(self, num_payments: int = 100, delay_ms: int = 100):
        """
        Simulate realistic payment traffic
        
        Args:
            num_payments: Number of payments to generate
            delay_ms: Delay between payments in milliseconds
        """
        print(f"🚀 Simulating {num_payments} payment requests...")
        print("=" * 50)
        
        # Customer pool for realistic distribution
        customers = [f"CUST{i:04d}" for i in range(20)]
        
        start_time = time.time()
        
        for i in range(num_payments):
            # Random customer from pool
            customer = random.choice(customers)
            
            # Random amount with realistic distribution
            amount = round(random.uniform(10.00, 500.00), 2)
            
            # Create and send payment
            payment = self.create_payment_request(
                amount=amount,
                customer_id=customer,
                payment_method=random.choice(['credit_card', 'debit_card', 'digital_wallet'])
            )
            
            success = self.send_payment(payment)
            
            if not success:
                # Retry once
                time.sleep(0.1)
                self.send_payment(payment)
            
            # Simulate realistic traffic pattern
            if delay_ms > 0:
                time.sleep(delay_ms / 1000.0)
        
        # Ensure all messages are delivered
        print("\n⏳ Flushing remaining messages...")
        self.producer.flush(timeout=30)
        
        elapsed = time.time() - start_time
        
        # Print statistics
        self.print_statistics(elapsed)
    
    def print_statistics(self, elapsed_time: float):
        """Print gateway statistics"""
        print("\n📊 Payment Gateway Statistics")
        print("=" * 50)
        print(f"Total Sent:      {self.stats['sent']}")
        print(f"Delivered:       {self.stats['delivered']}")
        print(f"Failed:          {self.stats['failed']}")
        print(f"Success Rate:    {(self.stats['delivered'] / self.stats['sent'] * 100):.1f}%")
        print(f"Throughput:      {(self.stats['sent'] / elapsed_time):.1f} payments/sec")
        print(f"Total Time:      {elapsed_time:.2f} seconds")
    
    def close(self):
        """Clean up resources"""
        self.producer.flush()


def main():
    """Main function"""
    try:
        # Validate configuration
        KafkaConfig.validate_config()
        
        # Create producer configuration with optimizations
        config = KafkaConfig.create_producer_config(
            **{
                'linger.ms': 10,  # Wait up to 10ms to batch messages
                'compression.type': 'snappy',  # Enable compression
                'batch.size': 32768,  # Increase batch size
                'acks': 'all',  # Wait for all in-sync replicas
            }
        )
        
        # Create payment gateway
        gateway = PaymentGateway(config)
        
        # Simulate payment traffic
        gateway.simulate_payment_traffic(
            num_payments=100,
            delay_ms=0  # 50ms between payments (~20 payments/sec)
        )
        
        # Clean up
        gateway.close()
        
        print("\n✅ Payment gateway simulation completed!")
        
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()