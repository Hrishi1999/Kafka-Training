#!/usr/bin/env python3
"""
Explore Kafka cluster metadata and configuration
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka.admin import AdminClient, ConfigResource, ConfigSource
from common.config import KafkaConfig
import json


def explore_cluster():
    """Explore Kafka cluster metadata"""
    # Create admin client
    config = KafkaConfig.create_producer_config()
    admin_client = AdminClient(config)
    
    print("🔍 Exploring Kafka Cluster")
    print("=" * 60)
    
    # Get cluster metadata
    metadata = admin_client.list_topics(timeout=10)
    
    # Cluster information
    print(f"\n📊 Cluster Information:")
    print(f"  Cluster ID: {metadata.cluster_id}")
    print(f"  Controller ID: {metadata.controller_id}")
    print(f"  Number of Brokers: {len(metadata.brokers)}")
    
    # Broker information
    print(f"\n🖥️  Brokers:")
    for broker in metadata.brokers.values():
        print(f"  - Broker {broker.id}: {broker.host}:{broker.port}")
    
    # Topic information
    print(f"\n📚 Topics ({len(metadata.topics)} total):")
    
    # Filter out internal topics
    user_topics = {k: v for k, v in metadata.topics.items() if not k.startswith('_')}
    
    for topic_name, topic_metadata in sorted(user_topics.items()):
        print(f"\n  📁 Topic: {topic_name}")
        print(f"     Partitions: {len(topic_metadata.partitions)}")
        print(f"     Error: {topic_metadata.error}")
        
        # Partition details
        print(f"     Partition Details:")
        for partition_id, partition_metadata in sorted(topic_metadata.partitions.items()):
            replicas = [str(r) for r in partition_metadata.replicas]
            isrs = [str(r) for r in partition_metadata.isrs]
            print(f"       - Partition {partition_id}:")
            print(f"         Leader: {partition_metadata.leader}")
            print(f"         Replicas: [{', '.join(replicas)}]")
            print(f"         ISRs: [{', '.join(isrs)}]")
            
            if partition_metadata.error:
                print(f"         Error: {partition_metadata.error}")
    
    # Get topic configurations
    if user_topics:
        print(f"\n⚙️  Topic Configurations:")
        topic_names = list(user_topics.keys())
        
        # Get configs for first topic as example
        first_topic = topic_names[0]
        resource = ConfigResource(ConfigResource.Type.TOPIC, first_topic)
        
        try:
            configs = admin_client.describe_configs([resource])
            for resource, config in configs.items():
                print(f"\n  Configuration for topic '{resource.name}':")
                
                # Show only non-default configs
                non_default_configs = {
                    k: v for k, v in config.items() 
                    if v.source != ConfigSource.DEFAULT_CONFIG
                }
                
                if non_default_configs:
                    for key, value in sorted(non_default_configs.items()):
                        print(f"    - {key}: {value.value} (source: {value.source.name})")
                else:
                    print("    All configurations are at default values")
                    
        except Exception as e:
            print(f"  Error getting configurations: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Cluster exploration complete!")


if __name__ == "__main__":
    try:
        KafkaConfig.validate_config()
        explore_cluster()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)