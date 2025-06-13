#!/usr/bin/env python3
"""
Get detailed partition information for a topic
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka.admin import AdminClient
from common.config import KafkaConfig


def get_partition_info(topic_name: str):
    """Get detailed partition information for a topic"""
    # Create admin client
    config = KafkaConfig.create_producer_config()
    admin_client = AdminClient(config)
    
    print(f"🔍 Partition Information for Topic: {topic_name}")
    print("=" * 70)
    
    # Get topic metadata
    metadata = admin_client.list_topics(topic=topic_name, timeout=10)
    
    if topic_name not in metadata.topics:
        print(f"❌ Topic '{topic_name}' not found!")
        print("\nAvailable topics:")
        for topic in sorted(metadata.topics.keys()):
            if not topic.startswith('_'):
                print(f"  - {topic}")
        return
    
    topic_metadata = metadata.topics[topic_name]
    
    # Topic summary
    print(f"\n📊 Topic Summary:")
    print(f"  Total Partitions: {len(topic_metadata.partitions)}")
    print(f"  Total Replicas: {sum(len(p.replicas) for p in topic_metadata.partitions.values())}")
    
    # Detailed partition information
    print(f"\n📑 Partition Details:")
    print(f"{'Partition':<12} {'Leader':<10} {'Replicas':<20} {'ISRs':<20} {'Status':<10}")
    print("-" * 70)
    
    for partition_id in sorted(topic_metadata.partitions.keys()):
        partition = topic_metadata.partitions[partition_id]
        
        replicas_str = ','.join(str(r) for r in partition.replicas)
        isrs_str = ','.join(str(r) for r in partition.isrs)
        
        # Check partition health
        status = "✅ Healthy" if len(partition.isrs) == len(partition.replicas) else "⚠️  Degraded"
        
        print(f"{partition_id:<12} {partition.leader:<10} [{replicas_str:<18}] [{isrs_str:<18}] {status}")
    
    # Broker distribution
    print(f"\n🖥️  Broker Distribution:")
    broker_load = {}
    leader_load = {}
    
    for partition in topic_metadata.partitions.values():
        # Count replicas per broker
        for replica in partition.replicas:
            broker_load[replica] = broker_load.get(replica, 0) + 1
        
        # Count leader assignments
        if partition.leader >= 0:
            leader_load[partition.leader] = leader_load.get(partition.leader, 0) + 1
    
    print(f"\n  Replica Distribution:")
    for broker_id in sorted(broker_load.keys()):
        print(f"    Broker {broker_id}: {broker_load[broker_id]} replicas")
    
    print(f"\n  Leader Distribution:")
    for broker_id in sorted(leader_load.keys()):
        print(f"    Broker {broker_id}: {leader_load[broker_id]} leader partitions")
    
    # Key insights
    print(f"\n💡 Key Insights:")
    
    # Check for balanced distribution
    if broker_load:
        min_replicas = min(broker_load.values())
        max_replicas = max(broker_load.values())
        if max_replicas - min_replicas <= 1:
            print("  ✅ Replicas are well balanced across brokers")
        else:
            print("  ⚠️  Replica distribution is imbalanced")
    
    # Check for under-replicated partitions
    under_replicated = sum(1 for p in topic_metadata.partitions.values() 
                          if len(p.isrs) < len(p.replicas))
    if under_replicated > 0:
        print(f"  ⚠️  {under_replicated} under-replicated partitions detected")
    else:
        print("  ✅ All partitions are fully replicated")
    
    # Calculate total storage (approximate)
    total_partitions = len(topic_metadata.partitions)
    total_replicas = sum(len(p.replicas) for p in topic_metadata.partitions.values())
    print(f"  📊 Storage impact: {total_replicas} partition replicas across cluster")


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python partition_info.py <topic-name>")
        print("Example: python partition_info.py payment_requests")
        sys.exit(1)
    
    topic_name = sys.argv[1]
    
    try:
        KafkaConfig.validate_config()
        get_partition_info(topic_name)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()