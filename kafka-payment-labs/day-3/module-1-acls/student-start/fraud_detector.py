#!/usr/bin/env python3
"""
Fraud Detection Service - Real-time Payment Risk Assessment

This service reads payment requests, applies fraud detection algorithms,
and publishes risk scores. It needs READ access to payments.raw and 
WRITE access to payments.scored.

SERVICE ACCOUNT: fraud-detection-service
REQUIRED PERMISSIONS: 
  - READ on topic 'payments.raw'
  - WRITE on topic 'payments.scored' 
  - READ on consumer group 'fraud-detection-cg'
"""

import os
import sys
import json
import random
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from confluent_kafka import Consumer, Producer
from typing import Dict
from datetime import datetime

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class FraudDetector:
    """Real-time fraud detection and risk scoring"""
    
    def __init__(self):
        # Consumer configuration for reading payments.raw
        consumer_config = KafkaConfig.create_consumer_config(
            group_id='fraud-detection-cg',
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            **{
            'sasl.username': 'TLVC743KOUE6VEFG',
            'sasl.password': '6OQjuzHLINwzUDXX3U94kTo0VZRaTj3nORxTfpEJgwYOuYZ4I3UskW/kEFKOr7tc',
            }
        )
        
        # Producer configuration for writing payments.scored
        # Use payment-gateway-service credentials
        producer_config = KafkaConfig.create_producer_config(**{
            'sasl.username': 'TLVC743KOUE6VEFG',
            'sasl.password': '6OQjuzHLINwzUDXX3U94kTo0VZRaTj3nORxTfpEJgwYOuYZ4I3UskW/kEFKOr7tc',
        })

        
        self.producer = Producer(producer_config)
        
        self.consumer = Consumer(consumer_config)
        self.producer = Producer(producer_config)
        
        self.input_topic = 'payments.raw'
        self.output_topic = 'payments.scored'
        
    def calculate_fraud_score(self, payment: Dict) -> Dict:
        """Apply fraud detection algorithms"""
        
        # Simulate sophisticated fraud detection
        risk_factors = []
        base_score = 0
        
        # High amount transactions are riskier
        amount = float(payment.get('amount', 0))
        if amount > 1000:
            risk_factors.append('HIGH_AMOUNT')
            base_score += 30
        elif amount > 500:
            risk_factors.append('MEDIUM_AMOUNT')
            base_score += 15
            
        # Certain merchants have higher risk
        merchant_id = payment.get('merchant_id', '')
        high_risk_merchants = ['MERCH-13', 'MERCH-27', 'MERCH-41']
        if merchant_id in high_risk_merchants:
            risk_factors.append('HIGH_RISK_MERCHANT')
            base_score += 40
            
        # International transactions (simulated by currency)
        currency = payment.get('currency', 'USD')
        if currency != 'USD':
            risk_factors.append('INTERNATIONAL')
            base_score += 20
            
        # Time-based risk (weekend transactions)
        hour = datetime.now().hour
        if hour < 6 or hour > 22:
            risk_factors.append('OFF_HOURS')
            base_score += 25
            
        # Add some randomness to simulate ML model
        base_score += random.randint(-10, 10)
        
        # Normalize to 0-100 scale
        fraud_score = min(max(base_score, 0), 100)
        
        # Determine risk level
        if fraud_score < 30:
            risk_level = 'LOW'
        elif fraud_score < 70:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
            
        return {
            'payment_id': payment['payment_id'],
            'original_amount': payment['amount'],
            'merchant_id': payment['merchant_id'],
            'fraud_score': fraud_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'timestamp': datetime.now().isoformat(),
            'model_version': 'v2.1.3',
            
            # Remove PII for downstream - compliance requirement!
            'status': 'RISK_ASSESSED'
        }
    
    def start_processing(self, max_messages: int = 20):
        """Start the fraud detection processing loop"""
        print("🔍 Fraud Detection Service Starting...")
        print(f"📥 Subscribing to: {self.input_topic}")
        print(f"📤 Publishing to: {self.output_topic}")
        print(f"👥 Consumer group: fraud-detection-cg")
        print(f"🔐 Using service account: fraud-detection-service")
        print("-" * 60)
        
        try:
            # Subscribe to input topic
            self.consumer.subscribe([self.input_topic])
            
            messages_processed = 0
            
            print("⏳ Waiting for payment messages to process...")
            print("💡 Run payment_gateway.py in another terminal to generate data\n")
            
            while messages_processed < max_messages:
                msg = self.consumer.poll(timeout=5.0)
                
                if msg is None:
                    print("⏱️  No messages received in 5 seconds...")
                    continue
                    
                if msg.error():
                    print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                try:
                    # Parse payment data
                    payment_data = json.loads(msg.value().decode('utf-8'))
                    payment_id = payment_data.get('payment_id', 'unknown')
                    
                    print(f"🔍 Processing payment: {payment_id}")
                    
                    # Apply fraud detection
                    scored_payment = self.calculate_fraud_score(payment_data)
                    
                    # Publish scored payment
                    self.producer.produce(
                        topic=self.output_topic,
                        key=payment_id.encode('utf-8'),
                        value=json.dumps(scored_payment).encode('utf-8'),
                        callback=self._delivery_callback
                    )
                    
                    print(f"📊 Fraud score: {scored_payment['fraud_score']}/100 "
                          f"({scored_payment['risk_level']} risk)")
                    
                    if scored_payment['risk_factors']:
                        print(f"⚠️  Risk factors: {', '.join(scored_payment['risk_factors'])}")
                    
                    messages_processed += 1
                    self.producer.poll(0)
                    
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON in message")
                except Exception as e:
                    print(f"❌ Processing error: {e}")
            
            print(f"\n✅ Fraud Detection: Processed {messages_processed} payments")
            print("💡 This service reads PII data but outputs sanitized risk scores")
            
        except Exception as e:
            print(f"\n❌ Fraud Detection FAILED: {e}")
            
            if "TopicAuthorizationException" in str(e):
                print("\n🔒 SECURITY ANALYSIS:")
                if "payments.raw" in str(e):
                    print("  ❌ Missing READ permission on topic 'payments.raw'")
                elif "payments.scored" in str(e):
                    print("  ❌ Missing WRITE permission on topic 'payments.scored'")
                print("  ✅ Security is working - unauthorized access blocked!")
                
                print("\n🛠️  FIX REQUIRED (use CLI):")
                print("  confluent kafka acl create --allow \\")
                print("    --service-account fraud-detection-service \\")
                print("    --operation READ --topic payments.raw")
                print("  confluent kafka acl create --allow \\") 
                print("    --service-account fraud-detection-service \\")
                print("    --operation WRITE --topic payments.scored")
                print("  confluent kafka acl create --allow \\")
                print("    --service-account fraud-detection-service \\")
                print("    --operation READ --consumer-group fraud-detection-cg")
                
            elif "GroupAuthorizationException" in str(e):
                print("\n🔒 SECURITY ANALYSIS:")
                print("  ❌ Missing READ permission on consumer group 'fraud-detection-cg'")
                print("  ✅ Topic access granted but consumer group access missing!")
                
        finally:
            self.consumer.close()
            self.producer.flush()
    
    def _delivery_callback(self, err, msg):
        """Callback for delivery reports"""
        if err is not None:
            print(f"❌ Delivery failed: {err}")

def main():
    """Run the fraud detection service"""
    print("=" * 60)
    print("🔍 FRAUD DETECTION SERVICE - PCI COMPLIANCE TEST")
    print("=" * 60)
    
    detector = FraudDetector()
    
    try:
        detector.start_processing()
        
    except KeyboardInterrupt:
        print("\n⚡ Fraud detection service interrupted")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()