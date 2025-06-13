#!/usr/bin/env python3
"""
Custom Partitioner - Demonstrates custom partitioning strategies for Kafka
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from confluent_kafka import Producer
from confluent_kafka.admin import AdminClient
from common.config import KafkaConfig
import json
import time
import uuid
from datetime import datetime
import hashlib
import random


class CustomPartitionStrategy:
    """Base class for custom partitioning strategies"""
    
    def __init__(self, num_partitions):
        self.num_partitions = num_partitions
    
    def get_partition(self, key, value):
        """Return partition number for given key/value"""
        raise NotImplementedError


class VIPPartitionStrategy(CustomPartitionStrategy):
    """Route VIP customers to dedicated partitions"""
    
    def __init__(self, num_partitions, vip_partitions=2):
        super().__init__(num_partitions)
        self.vip_partitions = min(vip_partitions, num_partitions // 2)
        self.regular_partitions = num_partitions - self.vip_partitions
        
        # Define VIP customers (in production, this would come from a database)
        self.vip_customers = {
            'CUST0001', 'CUST0002', 'CUST0003',
            'VIP001', 'VIP002', 'VIP003'
        }
    
    def get_partition(self, key, value):
        """VIP customers go to dedicated partitions"""
        customer_id = value.get('customer_id', '')
        
        if customer_id in self.vip_customers:
            # VIP customers go to first N partitions
            partition = hash(customer_id) % self.vip_partitions
            return partition
        else:
            # Regular customers go to remaining partitions
            partition = (hash(customer_id) % self.regular_partitions) + self.vip_partitions
            return partition


class AmountBasedPartitionStrategy(CustomPartitionStrategy):
    """Route messages based on transaction amount"""
    
    def __init__(self, num_partitions):
        super().__init__(num_partitions)
        self.thresholds = {
            'high': 1000.0,    # High value transactions
            'medium': 100.0,   # Medium value transactions
            'low': 0.0         # Low value transactions
        }
    
    def get_partition(self, key, value):
        """Partition based on transaction amount"""
        amount = value.get('amount', 0)
        customer_id = value.get('customer_id', str(uuid.uuid4()))
        
        if amount >= self.thresholds['high']:
            # High value: partitions 0-1
            return hash(customer_id) % min(2, self.num_partitions)
        elif amount >= self.thresholds['medium']:
            # Medium value: partitions 2-4
            base = min(2, self.num_partitions - 1)
            range_size = min(3, self.num_partitions - base)
            return base + (hash(customer_id) % range_size)
        else:
            # Low value: remaining partitions
            base = min(5, self.num_partitions - 1)
            range_size = max(1, self.num_partitions - base)
            return base + (hash(customer_id) % range_size)


class RegionBasedPartitionStrategy(CustomPartitionStrategy):
    """Route messages based on geographic region"""
    
    def __init__(self, num_partitions):
        super().__init__(num_partitions)
        # Define regions and their partition assignments
        self.regions = {
            'US': 0,
            'EU': 1,
            'ASIA': 2,
            'OTHER': 3
        }
    
    def get_region(self, customer_id):
        """Determine region from customer ID (simplified logic)"""
        # In production, this would look up actual customer location
        hash_val = int(hashlib.md5(customer_id.encode()).hexdigest()[:8], 16)
        regions = list(self.regions.keys())
        return regions[hash_val % len(regions)]
    
    def get_partition(self, key, value):
        """Partition based on customer region"""
        customer_id = value.get('customer_id', 'Unknown')
        region = self.get_region(customer_id)
        
        # Base partition for region
        base_partition = self.regions.get(region, 0) % self.num_partitions
        
        # Within region, distribute based on customer hash
        region_range = max(1, self.num_partitions // len(self.regions))
        offset = hash(customer_id) % region_range
        
        return (base_partition + offset) % self.num_partitions


class TimeBasedPartitionStrategy(CustomPartitionStrategy):
    """Route messages based on time windows"""
    
    def __init__(self, num_partitions):
        super().__init__(num_partitions)
        self.window_minutes = 5  # 5-minute windows
    
    def get_partition(self, key, value):
        """Partition based on time window and customer"""
        customer_id = value.get('customer_id', 'Unknown')
        timestamp = value.get('timestamp', datetime.utcnow().isoformat())
        
        # Parse timestamp
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except:
            dt = datetime.utcnow()
        
        # Calculate time window
        window = (dt.hour * 60 + dt.minute) // self.window_minutes
        
        # Combine window and customer for partition assignment
        combined_key = f"{window}_{customer_id}"
        return hash(combined_key) % self.num_partitions


class CustomPartitioner:
    """Demonstrates various custom partitioning strategies"""
    
    def __init__(self):
        # Get producer config
        config = KafkaConfig.create_producer_config()
        
        # Remove any existing partitioner config
        config.pop('partitioner', None)
        
        self.producer = Producer(config)
        self.topic = 'payment_requests'
        
        # Get partition count
        admin_config = {
            'bootstrap.servers': os.getenv('CONFLUENT_BOOTSTRAP_SERVERS', 'localhost:9092')
        }
        admin = AdminClient(admin_config)
        metadata = admin.list_topics(topic=self.topic)
        self.num_partitions = len(metadata.topics[self.topic].partitions)
        
        # Initialize strategies
        self.strategies = {
            'vip': VIPPartitionStrategy(self.num_partitions),
            'amount': AmountBasedPartitionStrategy(self.num_partitions),
            'region': RegionBasedPartitionStrategy(self.num_partitions),
            'time': TimeBasedPartitionStrategy(self.num_partitions)
        }
        
        # Track partition usage
        self.partition_counts = {}
    
    def delivery_callback(self, err, msg):
        """Track delivery and partition assignment"""
        if err is not None:
            print(f"❌ Delivery failed: {err}")
        else:
            partition = msg.partition()
            self.partition_counts[partition] = self.partition_counts.get(partition, 0) + 1
    
    def create_payment(self, customer_id: str, amount: float) -> dict:
        """Create a payment message"""
        return {
            'payment_id': str(uuid.uuid4()),
            'customer_id': customer_id,
            'amount': amount,
            'currency': 'USD',
            'payment_method': random.choice(['credit_card', 'debit_card', 'bank_transfer']),
            'merchant_id': f"MERCH{random.randint(1, 20):03d}",
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': {
                'source': 'custom_partitioner',
                'version': '1.0'
            }
        }
    
    def send_with_strategy(self, strategy_name: str, payment: dict):
        """Send message using custom partitioning strategy"""
        strategy = self.strategies[strategy_name]
        
        # Calculate partition
        partition = strategy.get_partition(
            payment['customer_id'],
            payment
        )
        
        # Send to specific partition
        self.producer.produce(
            topic=self.topic,
            key=payment['customer_id'].encode('utf-8'),
            value=json.dumps(payment).encode('utf-8'),
            partition=partition,
            callback=self.delivery_callback
        )
        
        return partition
    
    def demonstrate_vip_partitioning(self):
        """Demonstrate VIP customer partitioning"""
        print("\n🌟 VIP Customer Partitioning")
        print("-" * 50)
        print("VIP customers go to dedicated partitions (0-1)")
        print("Regular customers distributed across remaining partitions\n")
        
        # Reset counts
        self.partition_counts = {}
        
        # VIP customers
        vip_customers = ['CUST0001', 'VIP001', 'CUST0002']
        for customer in vip_customers:
            amount = random.uniform(5000, 10000)
            payment = self.create_payment(customer, amount)
            partition = self.send_with_strategy('vip', payment)
            print(f"💎 VIP {customer}: ${amount:.2f} → Partition {partition}")
        
        # Regular customers
        regular_customers = [f'CUST{i:04d}' for i in range(10, 20)]
        for customer in regular_customers:
            amount = random.uniform(50, 500)
            payment = self.create_payment(customer, amount)
            partition = self.send_with_strategy('vip', payment)
            print(f"👤 Regular {customer}: ${amount:.2f} → Partition {partition}")
        
        self.producer.flush()
        self.show_distribution("VIP Strategy")
    
    def demonstrate_amount_partitioning(self):
        """Demonstrate amount-based partitioning"""
        print("\n💰 Amount-Based Partitioning")
        print("-" * 50)
        print("High value (>$1000) → Partitions 0-1")
        print("Medium value ($100-$1000) → Partitions 2-4")
        print("Low value (<$100) → Remaining partitions\n")
        
        # Reset counts
        self.partition_counts = {}
        
        # Generate payments with different amounts
        amounts = [
            ('High', 5000), ('High', 2500),
            ('Medium', 500), ('Medium', 750),
            ('Low', 50), ('Low', 25)
        ]
        
        for i, (category, amount) in enumerate(amounts):
            customer = f'CUST{i:04d}'
            payment = self.create_payment(customer, amount)
            partition = self.send_with_strategy('amount', payment)
            print(f"💳 {category} value - {customer}: ${amount:.2f} → Partition {partition}")
        
        self.producer.flush()
        self.show_distribution("Amount Strategy")
    
    def demonstrate_region_partitioning(self):
        """Demonstrate region-based partitioning"""
        print("\n🌍 Region-Based Partitioning")
        print("-" * 50)
        print("Messages partitioned by geographic region")
        print("Ensures regional data locality\n")
        
        # Reset counts
        self.partition_counts = {}
        
        # Generate customers (region determined by hash)
        for i in range(12):
            customer = f'CUST{i:04d}'
            amount = random.uniform(100, 1000)
            payment = self.create_payment(customer, amount)
            
            # Get region for display
            strategy = self.strategies['region']
            region = strategy.get_region(customer)
            
            partition = self.send_with_strategy('region', payment)
            print(f"🌐 {customer} ({region}): ${amount:.2f} → Partition {partition}")
        
        self.producer.flush()
        self.show_distribution("Region Strategy")
    
    def demonstrate_time_partitioning(self):
        """Demonstrate time-based partitioning"""
        print("\n⏰ Time-Based Partitioning")
        print("-" * 50)
        print("Messages partitioned by time windows (5-minute intervals)")
        print("Useful for time-series analysis\n")
        
        # Reset counts
        self.partition_counts = {}
        
        # Generate payments across different time windows
        base_time = datetime.utcnow()
        
        for i in range(10):
            customer = f'CUST{i:04d}'
            amount = random.uniform(100, 500)
            
            # Create payment with specific timestamp
            payment = self.create_payment(customer, amount)
            # Vary the timestamp
            time_offset = i * 3  # 3 minutes apart
            timestamp = (base_time.replace(second=0, microsecond=0) + 
                        timedelta(minutes=time_offset))
            payment['timestamp'] = timestamp.isoformat()
            
            partition = self.send_with_strategy('time', payment)
            print(f"🕐 {customer} @ {timestamp.strftime('%H:%M')}: "
                  f"${amount:.2f} → Partition {partition}")
        
        self.producer.flush()
        self.show_distribution("Time Strategy")
    
    def show_distribution(self, strategy_name):
        """Show partition distribution for a strategy"""
        print(f"\n📊 Distribution for {strategy_name}:")
        total = sum(self.partition_counts.values())
        
        for partition in range(self.num_partitions):
            count = self.partition_counts.get(partition, 0)
            percentage = (count / total * 100) if total > 0 else 0
            bar = '█' * int(percentage / 5)
            print(f"   P{partition}: {bar} {count} ({percentage:.1f}%)")
    
    def run_all_demonstrations(self):
        """Run all partitioning demonstrations"""
        print(f"\n🎯 Custom Partitioning Strategies Demo")
        print(f"Topic: {self.topic} ({self.num_partitions} partitions)")
        print("=" * 60)
        
        # Run each demonstration
        self.demonstrate_vip_partitioning()
        time.sleep(1)
        
        self.demonstrate_amount_partitioning()
        time.sleep(1)
        
        self.demonstrate_region_partitioning()
        time.sleep(1)
        
        self.demonstrate_time_partitioning()
        
        # Summary
        print("\n💡 Key Takeaways:")
        print("1. Custom partitioning gives you control over data distribution")
        print("2. Choose strategy based on your business requirements:")
        print("   - VIP: Priority processing for important customers")
        print("   - Amount: Different handling for transaction sizes")
        print("   - Region: Geographic data locality")
        print("   - Time: Time-series optimization")
        print("3. Monitor partition balance to avoid hot spots")
        print("4. Consider partition count when designing strategies")


# Fix missing import
from datetime import timedelta


def main():
    """Main function"""
    try:
        KafkaConfig.validate_config()
        
        partitioner = CustomPartitioner()
        partitioner.run_all_demonstrations()
        
        print("\n🎯 Next Steps:")
        print("1. Implement your own custom partitioning strategy")
        print("2. Test partition balance with real workloads")
        print("3. Monitor partition metrics in production")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()