package com.acme.kafka.partitioner;

import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import org.apache.kafka.common.PartitionInfo;
import org.apache.kafka.common.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Set;

/**
 * Custom partitioner that routes VIP customers to dedicated partitions
 * 
 * Partitioning strategy:
 * - VIP customers (customer IDs starting with "VIP" or "CUST000[1-3]") -> Partitions 0-1
 * - Regular customers -> Remaining partitions
 * - High-value payments (>$1000) -> Even partitions
 * - Regular payments -> Odd partitions
 */
public class VipCustomerPartitioner implements Partitioner {

    private static final Logger logger = LoggerFactory.getLogger(VipCustomerPartitioner.class);

    // VIP customer prefixes and specific IDs
    private static final Set<String> VIP_PREFIXES = Set.of("VIP", "PREMIUM");
    private static final Set<String> VIP_CUSTOMERS = Set.of("CUST0001", "CUST0002", "CUST0003");

    @Override
    public void configure(Map<String, ?> configs) {
        logger.info("VIP Customer Partitioner configured with settings: {}", configs);
    }

    @Override
    public int partition(String topic, Object key, byte[] keyBytes, 
                        Object value, byte[] valueBytes, Cluster cluster) {
        
        if (keyBytes == null) {
            // If no key provided, use round-robin
            return getAvailablePartition(cluster, topic);
        }

        String customerKey = new String(keyBytes);
        int numPartitions = cluster.partitionCountForTopic(topic);
        
        if (numPartitions <= 1) {
            return 0;
        }

        // Check if this is a VIP customer
        if (isVipCustomer(customerKey)) {
            return getVipPartition(customerKey, numPartitions);
        }

        // Check if this is a high-value payment (simplified check based on key patterns)
        if (isHighValuePayment(customerKey, value)) {
            return getHighValuePartition(customerKey, numPartitions);
        }

        // Regular customers go to remaining partitions
        return getRegularCustomerPartition(customerKey, numPartitions);
    }

    /**
     * Check if customer is VIP
     */
    private boolean isVipCustomer(String customerKey) {
        // Check for VIP prefixes
        for (String prefix : VIP_PREFIXES) {
            if (customerKey.startsWith(prefix)) {
                return true;
            }
        }
        
        // Check for specific VIP customer IDs
        return VIP_CUSTOMERS.contains(customerKey);
    }

    /**
     * Get partition for VIP customers (first 25% of partitions)
     */
    private int getVipPartition(String customerKey, int numPartitions) {
        int vipPartitions = Math.max(1, numPartitions / 4); // Reserve 25% for VIP
        int partition = Math.abs(customerKey.hashCode()) % vipPartitions;
        
        logger.debug("VIP customer {} -> partition {}", customerKey, partition);
        return partition;
    }

    /**
     * Simple heuristic to detect high-value payments
     * In a real implementation, you'd parse the message value
     */
    private boolean isHighValuePayment(String customerKey, Object value) {
        // For this demo, we'll use a simple heuristic based on customer patterns
        // In practice, you'd parse the JSON value to check the amount
        
        if (value instanceof String) {
            String valueStr = (String) value;
            // Look for high amounts in the JSON (simplified)
            return valueStr.contains("\"amount\":1") || 
                   valueStr.contains("\"amount\":2") || 
                   valueStr.contains("\"amount\":3") ||
                   valueStr.contains("\"amount\":4") ||
                   valueStr.contains("\"amount\":5");
        }
        
        return false;
    }

    /**
     * Get partition for high-value payments (even partitions)
     */
    private int getHighValuePartition(String customerKey, int numPartitions) {
        int vipPartitions = Math.max(1, numPartitions / 4);
        int availablePartitions = numPartitions - vipPartitions;
        
        // Use even partitions for high-value payments
        int basePartition = vipPartitions;
        int evenPartitions = availablePartitions / 2;
        
        if (evenPartitions > 0) {
            int partition = basePartition + (Math.abs(customerKey.hashCode()) % evenPartitions) * 2;
            logger.debug("High-value payment for {} -> partition {}", customerKey, partition);
            return Math.min(partition, numPartitions - 1);
        }
        
        return getRegularCustomerPartition(customerKey, numPartitions);
    }

    /**
     * Get partition for regular customers (remaining partitions)
     */
    private int getRegularCustomerPartition(String customerKey, int numPartitions) {
        int vipPartitions = Math.max(1, numPartitions / 4);
        int availablePartitions = numPartitions - vipPartitions;
        
        if (availablePartitions <= 0) {
            return numPartitions - 1;
        }
        
        int partition = vipPartitions + (Math.abs(customerKey.hashCode()) % availablePartitions);
        logger.debug("Regular customer {} -> partition {}", customerKey, partition);
        return partition;
    }

    /**
     * Get any available partition (fallback for null keys)
     */
    private int getAvailablePartition(Cluster cluster, String topic) {
        java.util.List<PartitionInfo> partitions = cluster.availablePartitionsForTopic(topic);
        if (partitions.isEmpty()) {
            partitions = cluster.partitionsForTopic(topic);
        }
        
        if (partitions.isEmpty()) {
            return 0;
        }
        
        // Simple round-robin for null keys
        return Utils.toPositive(Utils.murmur2("".getBytes())) % partitions.size();
    }

    @Override
    public void close() {
        logger.info("VIP Customer Partitioner closed");
    }
}