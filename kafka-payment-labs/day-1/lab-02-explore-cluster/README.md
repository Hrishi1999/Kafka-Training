# Lab 02: Explore Your Kafka Cluster

## Learning Objectives

By the end of this lab, you will:
- Navigate the Confluent Cloud UI
- Understand Kafka's core concepts: topics, partitions, and offsets
- Use command-line tools to interact with your cluster
- Monitor key metrics
- Create and configure topics

## Prerequisites

- Completed Lab 01 (Terraform setup)
- Python environment activated
- .env file configured with cluster credentials

## Background

Apache Kafka is a distributed event streaming platform. Key concepts:

- **Topics**: Named streams of records (similar to database tables)
- **Partitions**: Topics are split into partitions for parallelism
- **Offsets**: Each record in a partition has a unique offset (position)
- **Brokers**: Kafka servers that store and serve data
- **Replication**: Data is replicated across brokers for fault tolerance

## Steps

### Step 1: Explore the Confluent Cloud UI

1. Log in to [Confluent Cloud](https://confluent.cloud)
2. Navigate to your environment: "kafka-payment-training"
3. Click on your cluster

Explore these sections:
- **Overview**: Cluster health and basic metrics
- **Topics**: List of topics and their configurations
- **Consumers**: Active consumer groups
- **Cluster Settings**: Connection information

### Step 2: Examine Your First Topic

1. In the UI, go to Topics → "payment_requests"
2. Note the following:
   - Number of partitions: 6
   - Replication factor: 3
   - Retention: 7 days

3. Click on "Messages" tab
   - It's empty now - we'll produce messages in the next lab

### Step 3: Use the Kafka CLI Tools

Let's explore using Python scripts that mimic Kafka CLI functionality:

```bash
cd kafka-payment-labs/day-1/lab-02-explore-cluster
```

Run the cluster explorer script:

```bash
python explore_cluster.py
```

This script will show:
- Cluster metadata
- List of topics
- Topic configurations
- Partition details

### Step 4: Create a New Topic Programmatically

Instead of using the UI, let's create a topic using code:

```bash
python create_topic.py
```

This will create a new topic called "test-topic" with 3 partitions.

### Step 5: Understanding Partitions

Run the partition inspector:

```bash
python partition_info.py payment_requests
```

This shows:
- Partition IDs (0-5 for our 6 partitions)
- Leader broker for each partition
- Replica brokers
- In-sync replicas (ISRs)

### Step 6: Monitor Cluster Metrics

The Confluent Cloud UI provides metrics. Navigate to:

1. Cluster Overview → Metrics
2. Key metrics to understand:
   - **Throughput**: Messages/sec in and out
   - **Storage**: Total data stored
   - **Partitions**: Total partition count
   - **Consumer Lag**: How far behind consumers are

### Step 7: Topic Configuration Deep Dive

Let's modify topic configuration:

```bash
python update_topic_config.py
```

This demonstrates how to:
- Change retention period
- Modify compression settings
- Update other topic-level configs

## Understanding Kafka Architecture

### Topic Partitioning
```
Topic: payment_requests
├── Partition 0: [msg1, msg4, msg7, ...]
├── Partition 1: [msg2, msg5, msg8, ...]
├── Partition 2: [msg3, msg6, msg9, ...]
├── Partition 3: [msg10, msg13, ...]
├── Partition 4: [msg11, msg14, ...]
└── Partition 5: [msg12, msg15, ...]
```

### Replication
Each partition has:
- **Leader**: Handles all reads and writes
- **Followers**: Replicate data from leader
- **ISR (In-Sync Replicas)**: Followers caught up with leader

### Consumer Groups
- Multiple consumers can work together as a group
- Each partition assigned to only one consumer in the group
- Enables parallel processing

## Hands-On Exercise

1. **Create a Custom Topic**:
   - Name: `user-events-{your-name}`
   - Partitions: 4
   - Retention: 3 days
   - Use either UI or modify `create_topic.py`

2. **Explore Topic Details**:
   - Find the leader broker for partition 2
   - Check the replication factor
   - View the topic configuration

3. **Delete the Test Topic**:
   - Use the UI or create a script
   - Verify it's removed

## Key Takeaways

- Kafka organizes data into topics and partitions
- Partitions enable parallel processing
- Replication provides fault tolerance
- Confluent Cloud handles infrastructure complexity
- Both UI and programmatic access are important

## Troubleshooting

### "Topic Already Exists" Error
- Topics must have unique names
- Delete the existing topic or use a different name

### Connection Timeouts
- Verify your .env file has correct credentials
- Check network connectivity
- Ensure your cluster is running

### Permission Errors
- Your service account needs appropriate permissions
- Check the Terraform created the correct role bindings

## Next Steps

Now that you understand Kafka's architecture and can navigate your cluster, we'll start producing and consuming messages in the next labs.

## Additional Resources

- [Kafka Documentation: Topics](https://kafka.apache.org/documentation/#intro_topics)
- [Confluent Cloud Metrics](https://docs.confluent.io/cloud/current/monitoring/metrics.html)
- [Kafka Best Practices](https://docs.confluent.io/cloud/current/best-practices/index.html)