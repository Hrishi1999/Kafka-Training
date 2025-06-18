#!/usr/bin/env python3
"""
Complete Resilience Patterns Demo
Shows the evolution from fragile consumers to bulletproof systems
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from common.config import KafkaConfig
from confluent_kafka import Producer
import json
import uuid
import time
import random
from datetime import datetime


def generate_test_payment(customer_id=None):
    """Generate test payment for demo"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": round(random.uniform(10.0, 500.0), 2),
        "currency": "USD",
        "customer_id": customer_id or f"CUST-{random.randint(1000, 9999)}",
        "timestamp": int(time.time())
    }


def send_test_payments(count=20):
    """Send test payments to trigger resilience patterns"""
    print("=== SENDING TEST PAYMENTS ===")
    print(f"Generating {count} test payments to trigger failures...")
    
    config = KafkaConfig.create_producer_config()
    producer = Producer(config)
    
    def delivery_report(err, msg):
        if err is not None:
            print(f"❌ Delivery failed: {err}")
        else:
            print(f"✅ Payment sent: {msg.key().decode('utf-8')}")
    
    config['on_delivery'] = delivery_report
    producer = Producer(config)
    
    for i in range(count):
        payment = generate_test_payment()
        
        producer.produce(
            topic='payment_requests',
            key=payment["customer_id"],
            value=json.dumps(payment)
        )
        
        time.sleep(0.5)  # Space out messages
    
    producer.flush()
    print(f"📦 Sent {count} test payments to payment_requests topic")


def demo_fragile_consumer():
    """Demo 1: Show fragile consumer problems"""
    print("=== DEMO 1: FRAGILE CONSUMER ===")
    print("This demonstrates the blocking retry anti-pattern")
    print()
    print("🚨 PROBLEMS WITH BLOCKING RETRIES:")
    print("  - Failed messages block entire partition")
    print("  - Retry delays affect overall throughput")
    print("  - Consumer lag grows during retry loops")
    print("  - Other consumers can't rebalance properly")
    print("  - Resource waste on blocking operations")
    print()
    print("✅ TO RUN: python fragile_consumer.py")
    print("   Watch how 30% failure rate destroys throughput!")
    print()


def demo_dlq_pattern():
    """Demo 2: Show DLQ pattern benefits"""
    print("=== DEMO 2: DEAD LETTER QUEUE PATTERN ===")
    print("This demonstrates fail-fast with DLQ for error tracking")
    print()
    print("✅ DLQ PATTERN BENEFITS:")
    print("  - Failed messages don't block processing")
    print("  - Consistent throughput regardless of failure rate")
    print("  - All failures captured for analysis")
    print("  - Fast recovery from poison pills")
    print("  - Separation of processing and error handling")
    print()
    print("✅ TO RUN:")
    print("   1. python dlq_consumer.py")
    print("   2. python dlq_analyzer.py (in another terminal)")
    print("   Watch how failures don't impact throughput!")
    print()


def demo_retry_system():
    """Demo 3: Show complete retry system"""
    print("=== DEMO 3: NON-BLOCKING RETRY SYSTEM ===")
    print("This demonstrates sophisticated retry with exponential backoff")
    print()
    print("🔄 RETRY SYSTEM FEATURES:")
    print("  - Multiple retry levels with increasing delays")
    print("  - Transient failures get multiple attempts")
    print("  - Permanent failures go to DLQ quickly")
    print("  - Non-blocking - no partition stalling")
    print("  - Configurable retry policies")
    print("  - Real-time monitoring")
    print()
    print("✅ TO RUN:")
    print("   1. python retry_processor.py (start retry infrastructure)")
    print("   2. python retry_consumer.py (in another terminal)")
    print("   Watch the multi-level retry flow!")
    print()


def run_comparison_test():
    """Run automated comparison of all three patterns"""
    print("=== AUTOMATED COMPARISON TEST ===")
    print("Comparing throughput and behavior of all three patterns")
    print()
    
    patterns = [
        ("Fragile Consumer (Blocking Retry)", "fragile_consumer.py"),
        ("DLQ Consumer (Fail Fast)", "dlq_consumer.py"), 
        ("Retry Consumer (Smart Retry)", "retry_consumer.py")
    ]
    
    print("📊 EXPECTED RESULTS:")
    print("Pattern                     | Throughput | Failure Handling")
    print("-" * 55)
    print("Fragile (Blocking)          | LOW        | Blocks partition")
    print("DLQ (Fail Fast)             | HIGH       | Fast failure")
    print("Retry (Smart)               | HIGH       | Intelligent retry")
    print()
    
    print("🧪 TO RUN COMPARISON:")
    for i, (name, script) in enumerate(patterns, 1):
        print(f"   {i}. {script} - {name}")
    print(f"   4. Send same test data to each")
    print(f"   5. Compare throughput and error handling")
    print()
    
    print("💡 METRICS TO COMPARE:")
    print("  - Messages per second")
    print("  - Time to process 100 messages")
    print("  - Behavior when 30% of messages fail") 
    print("  - Consumer lag during failures")
    print("  - Error visibility and tracking")


def main():
    """Run complete resilience patterns demo"""
    print("🛡️  KAFKA RESILIENCE PATTERNS DEMO")
    print("=" * 60)
    print("Evolution from fragile consumers to bulletproof systems")
    print()
    
    demo_fragile_consumer()
    demo_dlq_pattern()
    demo_retry_system()
    
    print("=" * 60)
    print("🎯 HANDS-ON EXERCISES:")
    print()
    print("1. EXPERIENCE THE PAIN:")
    print("   - Run fragile_consumer.py")
    print("   - Send test payments")
    print("   - Observe blocking behavior")
    print()
    print("2. IMPLEMENT FAST FAILURE:")
    print("   - Run dlq_consumer.py")
    print("   - Compare throughput")
    print("   - Analyze failures with dlq_analyzer.py")
    print()
    print("3. BUILD SMART RETRY:")
    print("   - Start retry_processor.py") 
    print("   - Run retry_consumer.py")
    print("   - Watch multi-level retry flow")
    print()
    print("4. PRODUCTION READINESS:")
    print("   - Monitor DLQ message rates")
    print("   - Set up alerting on retry failures")
    print("   - Implement circuit breakers")
    print("   - Add business-specific retry policies")
    print()
    
    # Offer to send test data
    response = input("Send test payments now? (y/n): ").lower().strip()
    if response == 'y':
        count = input("How many test payments? (default 20): ").strip()
        count = int(count) if count.isdigit() else 20
        send_test_payments(count)
    
    print()
    print("🎓 LEARNING OUTCOMES:")
    print("✅ Understand why simple try/catch fails in production")
    print("✅ Implement non-blocking retry patterns")
    print("✅ Build dead letter queue strategies")
    print("✅ Design resilient payment processing systems")
    print("✅ Handle poison pill messages gracefully")
    print()
    print("🚀 You're now ready to build bulletproof Kafka consumers!")


if __name__ == "__main__":
    main()