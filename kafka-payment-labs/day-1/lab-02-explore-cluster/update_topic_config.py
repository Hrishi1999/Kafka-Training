#!/usr/bin/env python3
"""
Update topic configuration
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka.admin import AdminClient, ConfigResource, ConfigSource
from common.config import KafkaConfig


def update_topic_config(topic_name: str = "test-topic"):
    """Update configuration for a topic"""
    # Create admin client
    config = KafkaConfig.create_producer_config()
    admin_client = AdminClient(config)
    
    print(f"⚙️  Updating configuration for topic: {topic_name}")
    print("=" * 60)
    
    # First, get current configuration
    resource = ConfigResource(ConfigResource.Type.TOPIC, topic_name)
    
    print("\n📋 Current Configuration:")
    try:
        current_configs = admin_client.describe_configs([resource])
        
        for resource, future in current_configs.items():
            config = future.result()  # Wait for the operation to complete
            # Show important configs
            important_configs = [
                'retention.ms', 'retention.bytes', 'segment.ms', 
                'compression.type', 'cleanup.policy', 'min.insync.replicas'
            ]
            
            for config_name in important_configs:
                if config_name in config:
                    value = config[config_name]
                    print(f"  {config_name}: {value.value}")
    
    except Exception as e:
        print(f"❌ Error getting current config: {e}")
        return
    
    # Define new configurations
    new_configs = {
        'retention.ms': '86400000',        # Change retention to 1 day (from 3 days)
        'compression.type': 'producer',        # Change compression from snappy to gzip
        'segment.ms': '1800000',           # Change segment rollover to 30 minutes
        'min.insync.replicas': '2'         # Require 2 replicas to be in sync
    }
    
    print("\n🔄 Applying New Configuration:")
    for key, value in new_configs.items():
        print(f"  {key}: {value}")
    
    # Apply the configuration updates
    resource = ConfigResource(
        ConfigResource.Type.TOPIC, 
        topic_name,
        set_config=new_configs
    )
    
    try:
        futures = admin_client.alter_configs([resource])
        
        for resource, future in futures.items():
            future.result()  # Wait for the operation to complete
            print(f"\n✅ Configuration updated successfully for topic '{resource.name}'!")
    
    except Exception as e:
        print(f"❌ Error updating configuration: {e}")
        return
    
    # Verify the changes
    print("\n📋 Verified New Configuration:")
    updated_configs = admin_client.describe_configs([ConfigResource(ConfigResource.Type.TOPIC, topic_name)])
    
    for resource, future in updated_configs.items():
        config = future.result()  # Wait for the operation to complete
        for config_name in new_configs.keys():
            if config_name in config:
                value = config[config_name]
                expected = new_configs[config_name]
                status = "✅" if value.value == expected else "❌"
                print(f"  {config_name}: {value.value} {status}")
    
    print("\n💡 Configuration Changes Explained:")
    print("  - retention.ms: How long messages are kept (1 day)")
    print("  - compression.type: Compression algorithm (gzip is slower but smaller)")
    print("  - segment.ms: How often log segments roll (30 minutes)")
    print("  - min.insync.replicas: Minimum replicas for acknowledgment (2)")


def main():
    """Main function"""
    topic_name = "test-topic"
    
    # Allow custom topic name from command line
    if len(sys.argv) > 1:
        topic_name = sys.argv[1]
    
    try:
        KafkaConfig.validate_config()
        update_topic_config(topic_name)
        
        print("\n🎯 Try This:")
        print("1. Run explore_cluster.py to see all topic configs")
        print("2. Check the Confluent Cloud UI to verify changes")
        print("3. Experiment with other configuration options")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()