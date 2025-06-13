#!/usr/bin/env python3
"""
Test connection to Confluent Cloud Kafka cluster
"""

import os
import sys
from confluent_kafka.admin import AdminClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def create_config():
    """Create Kafka configuration from environment variables"""
    return {
        'bootstrap.servers': os.getenv('BOOTSTRAP_SERVERS'),
        'sasl.mechanism': os.getenv('SASL_MECHANISM', 'PLAIN'),
        'security.protocol': os.getenv('SECURITY_PROTOCOL', 'SASL_SSL'),
        'sasl.username': os.getenv('SASL_USERNAME'),
        'sasl.password': os.getenv('SASL_PASSWORD'),
    }


def test_connection():
    """Test connection to Kafka cluster"""
    config = create_config()
    
    # Validate configuration
    required_keys = ['bootstrap.servers', 'sasl.username', 'sasl.password']
    for key in required_keys:
        if not config.get(key):
            print(f"Error: Missing required configuration: {key}")
            print("Please ensure your .env file is properly configured")
            sys.exit(1)
    
    try:
        # Create AdminClient to test connection
        admin_client = AdminClient(config)
        
        # Get cluster metadata
        metadata = admin_client.list_topics(timeout=10)
        
        print("✅ Successfully connected to Kafka cluster!")
        print(f"🔧 Cluster ID: {metadata.cluster_id}")
        print(f"📊 Number of brokers: {len(metadata.brokers)}")
        print(f"📋 Number of topics: {len(metadata.topics)}")
        
        # List topics
        if metadata.topics:
            print("\n📚 Topics:")
            for topic in sorted(metadata.topics.keys()):
                if not topic.startswith('_'):  # Skip internal topics
                    topic_metadata = metadata.topics[topic]
                    print(f"  - {topic} ({len(topic_metadata.partitions)} partitions)")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to connect to Kafka cluster: {e}")
        print("\nPlease check:")
        print("1. Your .env file exists and contains valid credentials")
        print("2. Your Confluent Cloud cluster is running")
        print("3. Your network allows connection to Confluent Cloud")
        return False


if __name__ == "__main__":
    print("🚀 Testing connection to Confluent Cloud Kafka cluster...")
    print("-" * 50)
    
    if test_connection():
        print("\n✨ Your Kafka cluster is ready for the training!")
    else:
        sys.exit(1)