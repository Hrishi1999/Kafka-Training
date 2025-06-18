#!/usr/bin/env python3
"""
Consumer Group Monitor - Watch consumer group assignments in real-time
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka.admin import AdminClient
from common.config import KafkaConfig
import time
import argparse
from datetime import datetime


class ConsumerGroupMonitor:
    """Monitor consumer group assignments and state"""
    
    def __init__(self, group_id: str):
        self.group_id = group_id
        config = KafkaConfig.create_producer_config()  # Admin uses same config
        self.admin_client = AdminClient(config)
        self.previous_state = None
    
    def get_group_info(self):
        """Get consumer group information"""
        try:
            # Get group metadata - removed timeout parameter
            groups = self.admin_client.describe_consumer_groups([self.group_id])
            
            if self.group_id not in groups:
                return None
            
            group_future = groups[self.group_id]
            group_metadata = group_future.result(timeout=10)  # timeout goes on result()
            
            # Format the information
            info = {
                'group_id': group_metadata.group_id,
                'state': group_metadata.state,
                'protocol_type': getattr(group_metadata, 'protocol_type', 'Unknown'),
                'protocol': getattr(group_metadata, 'protocol', 'Unknown'),
                'members': []
            }
            
            for member in group_metadata.members:
                member_info = {
                    'member_id': member.member_id,
                    'client_id': getattr(member, 'client_id', 'Unknown'),
                    'client_host': getattr(member, 'client_host', 'Unknown'),
                    'partitions': []
                }
                
                # Note: member_assignment not available in this version
                # Partition assignment info would need to be obtained differently
                
                info['members'].append(member_info)
            
            return info
            
        except Exception as e:
            return {'error': str(e)}
    
    def display_group_info(self, info):
        """Display formatted group information"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        if 'error' in info:
            print(f"[{timestamp}] ❌ Error: {info['error']}")
            return
        
        print(f"[{timestamp}] 📊 Consumer Group: {info['group_id']}")
        print(f"             State: {info['state']}")
        if info['protocol_type'] != 'Unknown' and info['protocol'] != 'Unknown':
            print(f"             Protocol: {info['protocol_type']}/{info['protocol']}")
        print(f"             Members: {len(info['members'])}")
        
        if not info['members']:
            print("             👻 No active members")
        else:
            for i, member in enumerate(info['members'], 1):
                print(f"             \n             👤 Member {i}:")
                print(f"                ID: {member['member_id'][:16]}...")
                if member['client_id'] != 'Unknown':
                    print(f"                Client: {member['client_id']}")
                if member['client_host'] != 'Unknown':
                    print(f"                Host: {member['client_host']}")
                
                if member['partitions']:
                    partitions_by_topic = {}
                    for p in member['partitions']:
                        topic = p['topic']
                        if topic not in partitions_by_topic:
                            partitions_by_topic[topic] = []
                        partitions_by_topic[topic].append(p['partition'])
                    
                    print(f"                Partitions:")
                    for topic, partitions in partitions_by_topic.items():
                        partitions_str = ','.join(map(str, sorted(partitions)))
                        print(f"                  {topic}: [{partitions_str}]")
                else:
                    print(f"                Partitions: Not available in this API version")
        
        print("-" * 80)
    
    def detect_changes(self, current_info):
        """Detect and announce changes in group state"""
        if self.previous_state is None:
            print("🔍 Starting to monitor consumer group...")
            self.previous_state = current_info
            return
        
        if 'error' in current_info:
            return
        
        # Check for member count changes
        prev_member_count = len(self.previous_state.get('members', []))
        curr_member_count = len(current_info.get('members', []))
        
        if curr_member_count != prev_member_count:
            if curr_member_count > prev_member_count:
                print(f"🆕 NEW MEMBER JOINED! ({prev_member_count} → {curr_member_count})")
            else:
                print(f"👋 MEMBER LEFT! ({prev_member_count} → {curr_member_count})")
        
        # Check for state changes
        prev_state = self.previous_state.get('state', 'Unknown')
        curr_state = current_info.get('state', 'Unknown')
        
        if curr_state != prev_state:
            print(f"🔄 STATE CHANGE: {prev_state} → {curr_state}")
            if curr_state == 'PreparingRebalance':
                print("   ⚡ REBALANCE STARTING!")
            elif curr_state == 'CompletingRebalance':
                print("   ⚡ REBALANCE COMPLETING!")
            elif curr_state == 'Stable':
                print("   ✅ GROUP STABLE!")
        
        self.previous_state = current_info
    
    def watch(self, interval: float = 2.0):
        """Watch the consumer group continuously"""
        print(f"👁️  Watching consumer group '{self.group_id}'")
        print(f"🔄 Refresh interval: {interval} seconds")
        print("Press Ctrl+C to stop")
        print("=" * 80)
        
        try:
            while True:
                info = self.get_group_info()
                
                if info:
                    self.detect_changes(info)
                    self.display_group_info(info)
                else:
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    print(f"[{timestamp}] 🔍 Group '{self.group_id}' not found or no members")
                    print("-" * 80)
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n⚠️  Monitoring stopped by user")
        except Exception as e:
            print(f"\n❌ Error during monitoring: {e}")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Monitor Kafka consumer group')
    parser.add_argument('group_id', help='Consumer group ID to monitor')
    parser.add_argument('--interval', '-i', type=float, default=2.0,
                        help='Refresh interval in seconds (default: 2.0)')
    
    args = parser.parse_args()
    
    try:
        KafkaConfig.validate_config()
        
        monitor = ConsumerGroupMonitor(args.group_id)
        monitor.watch(args.interval)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()