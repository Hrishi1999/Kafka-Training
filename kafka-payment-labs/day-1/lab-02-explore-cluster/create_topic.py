#!/usr/bin/env python3
"""
Create a Kafka topic programmatically
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka.admin import AdminClient, NewTopic
from common.config import KafkaConfig
import time


def create_topic(topic_name: str, num_partitions: int = 3, replication_factor: int = 3):
    """Create a new Kafka topic"""
    # Create admin client
    config = KafkaConfig.create_producer_config()
    admin_client = AdminClient(config)
    
    print(f"📝 Creating topic: {topic_name}")
    print(f"   Partitions: {num_partitions}")
    print(f"   Replication Factor: {replication_factor}")
    
    # Define the new topic
    new_topic = NewTopic(
        topic=topic_name,
        num_partitions=num_partitions,
        replication_factor=replication_factor,
        config={
            'retention.ms': '259200000',  # 3 days
            'segment.ms': '3600000',      # 1 hour
            'compression.type': 'snappy'
        }
    )
    
    # Create the topic
    futures = admin_client.create_topics([new_topic])
    
    # Wait for the operation to complete
    for topic, future in futures.items():
        try:
            future.result()  # The result itself is None
            print(f"✅ Topic '{topic}' created successfully!")
            
            # Wait a moment for topic to be fully created
            time.sleep(2)
            
            # Verify topic was created
            metadata = admin_client.list_topics(timeout=10)
            if topic in metadata.topics:
                topic_metadata = metadata.topics[topic]
                print(f"\n📊 Topic Details:")
                print(f"   Partitions: {len(topic_metadata.partitions)}")
                
                # Show partition assignments
                print(f"   Partition Assignments:")
                for partition_id, partition_metadata in sorted(topic_metadata.partitions.items()):
                    print(f"     - Partition {partition_id}: Leader={partition_metadata.leader}, "
                          f"Replicas={partition_metadata.replicas}")
            
        except Exception as e:
            print(f"❌ Failed to create topic '{topic}': {e}")
            
            # Check if topic already exists
            if "already exists" in str(e).lower():
                print("💡 Tip: Use a different topic name or delete the existing topic first")


def main():
    """Main function"""
    # Default topic name
    topic_name = "test-topic"
    
    # Allow custom topic name from command line
    if len(sys.argv) > 1:
        topic_name = sys.argv[1]
    
    try:
        KafkaConfig.validate_config()
        create_topic(topic_name)
        
        print("\n🎯 Next Steps:")
        print(f"1. View your topic in Confluent Cloud UI")
        print(f"2. Run 'python partition_info.py {topic_name}' to see partition details")
        print(f"3. Produce messages to the topic in the next lab")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()