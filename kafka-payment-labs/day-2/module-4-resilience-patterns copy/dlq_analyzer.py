#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from common.config import KafkaConfig
from confluent_kafka import Consumer, KafkaError
import json
from datetime import datetime
from collections import defaultdict


def analyze_dlq():
    """Analyze messages in the Dead Letter Queue"""
    print("=== DLQ ANALYZER ===")
    print("Analyzing failed messages in Dead Letter Queue...")
    
    config = KafkaConfig.create_consumer_config()
    config.update({
        'group.id': 'dlq-analyzer',
        'auto.offset.reset': 'earliest'
    })
    
    consumer = Consumer(config)
    consumer.subscribe(['payment_requests-dlq'])
    
    error_counts = defaultdict(int)
    messages_analyzed = 0
    error_details = []
    
    try:
        print("📡 Polling for DLQ messages...")
        
        # Poll for a reasonable amount of time to collect messages
        timeout_seconds = 10
        end_time = datetime.now().timestamp() + timeout_seconds
        
        while datetime.now().timestamp() < end_time:
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
                
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Error reading DLQ: {msg.error()}")
                    continue
                
            try:
                dlq_data = json.loads(msg.value().decode('utf-8'))
                messages_analyzed += 1
                
                error_reason = dlq_data['error_reason']
                error_timestamp = dlq_data['error_timestamp']
                original_topic = dlq_data['original_topic']
                original_offset = dlq_data['original_offset']
                
                error_counts[error_reason] += 1
                
                error_details.append({
                    'error': error_reason,
                    'timestamp': datetime.fromtimestamp(error_timestamp).strftime('%Y-%m-%d %H:%M:%S'),
                    'topic': original_topic,
                    'offset': original_offset
                })
                
                print(f"🔍 DLQ Message #{messages_analyzed}: {error_reason}")
                
            except json.JSONDecodeError as e:
                print(f"⚠️  Invalid JSON in DLQ message: {e}")
            except Exception as e:
                print(f"⚠️  Error processing DLQ message: {e}")
                
        # Analysis complete
        print(f"\n📊 DLQ ANALYSIS COMPLETE")
        print(f"=" * 50)
        
        if messages_analyzed == 0:
            print("✅ No messages found in DLQ")
            print("This could mean:")
            print("  - No failures have occurred yet")
            print("  - DLQ topic doesn't exist yet")
            print("  - All messages were processed successfully")
        else:
            print(f"Total DLQ messages analyzed: {messages_analyzed}")
            print(f"\n🚨 ERROR BREAKDOWN:")
            
            # Sort errors by frequency
            sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
            
            for error, count in sorted_errors:
                percentage = (count / messages_analyzed) * 100
                print(f"  {error}: {count} messages ({percentage:.1f}%)")
            
            print(f"\n📋 DETAILED ERROR LOG:")
            for i, detail in enumerate(error_details[-10:], 1):  # Show last 10
                print(f"  {i}. {detail['timestamp']} - {detail['error']}")
                print(f"     Topic: {detail['topic']}, Offset: {detail['offset']}")
            
            if len(error_details) > 10:
                print(f"     ... and {len(error_details) - 10} more errors")
            
            print(f"\n💡 RECOMMENDATIONS:")
            
            # Provide specific recommendations based on error patterns
            for error, count in sorted_errors:
                if "timeout" in error.lower() or "network" in error.lower():
                    print(f"  - {error}: Consider implementing retry logic for transient failures")
                elif "invalid" in error.lower() or "customer" in error.lower():
                    print(f"  - {error}: Improve input validation or customer data quality")
                elif "funds" in error.lower():
                    print(f"  - {error}: Business logic - may require different handling")
                elif "service" in error.lower():
                    print(f"  - {error}: Check external service health and implement circuit breakers")
            
            print(f"\n🔄 NEXT STEPS:")
            print(f"  1. Investigate root causes of top error types")
            print(f"  2. Consider implementing retry logic for transient failures")
            print(f"  3. Fix data quality issues for permanent failures")
            print(f"  4. Monitor DLQ message rates in production")
            print(f"  5. Set up alerts for high DLQ volumes")
                
    except KeyboardInterrupt:
        print(f"\nAnalysis interrupted...")
    finally:
        consumer.close()


if __name__ == "__main__":
    analyze_dlq()