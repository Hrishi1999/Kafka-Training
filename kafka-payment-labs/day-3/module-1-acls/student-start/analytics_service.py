#!/usr/bin/env python3
"""
Analytics Service - Business Intelligence and Reporting

This service should ONLY access aggregated, non-PII data for reporting.
It must NOT have access to payments.raw (contains sensitive PII).

SERVICE ACCOUNT: analytics-service
REQUIRED PERMISSIONS: 
  - READ on topic 'reports.daily' (aggregated data only)
  - READ on consumer group 'analytics-cg'
  
SECURITY VIOLATION: If this service can access payments.raw, it's a PCI compliance breach!
"""

import os
import sys
import json
import time
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from datetime import datetime
from confluent_kafka import Consumer
from typing import Dict, List

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class AnalyticsService:
    """Business analytics and reporting service"""
    
    def __init__(self):
        consumer_config = KafkaConfig.create_consumer_config(
            group_id='analytics-cg',
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            **{
            'sasl.username': 'TLVC743KOUE6VEFG',
            'sasl.password': '6OQjuzHLINwzUDXX3U94kTo0VZRaTj3nORxTfpEJgwYOuYZ4I3UskW/kEFKOr7tc',
            }
        )
        
        self.consumer = Consumer(consumer_config)
        
        # This service should ONLY access aggregated reports
        self.allowed_topic = 'reports.daily'
        
    def analyze_reports(self, max_messages: int = 10):
        """Analyze aggregated reporting data (PCI compliant)"""
        print("📊 Analytics Service Starting...")
        print(f"📥 Reading from: {self.allowed_topic}")
        print(f"👥 Consumer group: analytics-cg")
        print(f"🔐 Using service account: analytics-service")
        print("🔒 PCI Compliance: This service should NOT access raw payment data")
        print("-" * 60)
        
        try:
            self.consumer.subscribe([self.allowed_topic])
            
            messages_processed = 0
            total_volume = 0
            total_amount = 0.0
            
            print("⏳ Waiting for daily reports...")
            print("💡 This service analyzes aggregated data without PII\n")
            
            while messages_processed < max_messages:
                msg = self.consumer.poll(timeout=5.0)
                
                if msg is None:
                    print("⏱️  No report data received in 5 seconds...")
                    # For demo purposes, create some sample analytics
                    break
                    
                if msg.error():
                    print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                try:
                    # Parse report data
                    report_data = json.loads(msg.value().decode('utf-8'))
                    
                    print(f"📈 Processing report: {report_data.get('report_id', 'unknown')}")
                    
                    # Aggregate metrics (no PII involved)
                    if 'transaction_count' in report_data:
                        total_volume += report_data['transaction_count']
                    if 'total_amount' in report_data:
                        total_amount += report_data['total_amount']
                    
                    messages_processed += 1
                    
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON in report")
                except Exception as e:
                    print(f"❌ Processing error: {e}")
            
            print(f"\n✅ Analytics: Processed {messages_processed} reports")
            print(f"📊 Total transaction volume: {total_volume}")
            print(f"💰 Total amount: ${total_amount:,.2f}")
            print("✅ PCI Compliant: No sensitive data accessed")
            
        except Exception as e:
            print(f"\n❌ Analytics Service FAILED: {e}")
            
            if "TopicAuthorizationException" in str(e):
                print("\n🔒 SECURITY ANALYSIS:")
                print("  ❌ Missing READ permission on topic 'reports.daily'")
                print("  ✅ Security is working - unauthorized access blocked!")
                
                print("\n🛠️  FIX REQUIRED:")
                print("  confluent kafka acl create --allow \\")
                print("    --service-account analytics-service \\")
                print("    --operation READ --topic reports.daily")
                print("  confluent kafka acl create --allow \\")
                print("    --service-account analytics-service \\")
                print("    --operation READ --consumer-group analytics-cg")
                
            elif "GroupAuthorizationException" in str(e):
                print("\n🔒 SECURITY ANALYSIS:")
                print("  ❌ Missing READ permission on consumer group 'analytics-cg'")
                
        finally:
            self.consumer.close()

def test_security_breach():
    """
    DANGEROUS: Test if analytics service can access sensitive PII data
    This should FAIL if ACLs are properly configured!
    """
    print("\n" + "="*60)
    print("🚨 SECURITY BREACH TEST - Attempting to access PII data")
    print("="*60)
    print("⚠️  Testing if analytics service can access payments.raw...")
    print("🔒 This SHOULD fail if ACLs are properly configured!")
    
    config = {
        'bootstrap.servers': os.environ['KAFKA_BOOTSTRAP_SERVERS'],
        'sasl.mechanism': 'PLAIN',
        'security.protocol': 'SASL_SSL',
        'sasl.username': os.environ.get('ANALYTICS_API_KEY',
                                      os.environ['KAFKA_SASL_USERNAME']),
        'sasl.password': os.environ.get('ANALYTICS_API_SECRET',
                                      os.environ['KAFKA_SASL_PASSWORD']),
        'group.id': 'analytics-breach-test-cg',
        'auto.offset.reset': 'latest',
        'client.id': 'analytics-breach-test'
    }
    
    consumer = Consumer(config)
    
    try:
        # Attempt to read sensitive PII data
        consumer.subscribe(['payments.raw'])
        
        print("⏳ Attempting to access payments.raw topic...")
        
        msg = consumer.poll(timeout=3.0)
        
        if msg is None:
            print("✅ GOOD: No messages received (topic might be empty)")
            print("🔒 But if ACLs are correct, we shouldn't reach this point!")
        elif msg.error():
            if "TopicAuthorizationException" in str(msg.error()):
                print("✅ EXCELLENT: Access denied by ACLs!")
                print("🔒 PCI Compliance maintained - analytics cannot access PII")
            else:
                print(f"❓ Other error: {msg.error()}")
        else:
            # This is BAD - we got sensitive data!
            payment_data = json.loads(msg.value().decode('utf-8'))
            print("🚨 SECURITY BREACH DETECTED!")
            print("❌ Analytics service accessed sensitive PII data:")
            print(f"   Card Number: {payment_data.get('card_number', 'N/A')}")
            print(f"   Cardholder: {payment_data.get('cardholder_name', 'N/A')}")
            print("\n💥 PCI COMPLIANCE VIOLATION!")
            print("🛠️  IMMEDIATE ACTION REQUIRED:")
            print("   1. Revoke wildcard permissions")
            print("   2. Grant only specific topic access")
            print("   3. Audit all ACLs")
            
    except Exception as e:
        if "TopicAuthorizationException" in str(e):
            print("✅ EXCELLENT: Access properly denied!")
            print("🔒 Analytics service cannot access sensitive payment data")
        else:
            print(f"❌ Unexpected error: {e}")
    finally:
        consumer.close()

def main():
    """Run the analytics service"""
    print("=" * 60)
    print("📊 ANALYTICS SERVICE - PCI COMPLIANCE TEST")
    print("=" * 60)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test-breach":
        test_security_breach()
        return
    
    analytics = AnalyticsService()
    
    try:
        analytics.analyze_reports()
        
        print("\n" + "="*60)
        print("🔒 SECURITY CHECK")
        print("="*60)
        print("Now let's test if this service can inappropriately access PII data...")
        print("Run: python3 analytics_service.py --test-breach")
        
    except KeyboardInterrupt:
        print("\n⚡ Analytics service interrupted")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()