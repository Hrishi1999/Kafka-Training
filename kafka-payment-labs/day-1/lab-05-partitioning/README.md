# Lab 05: Keys and Partitioning - Ensuring Order

## Learning Objectives

By the end of this lab, you will:
- Understand how Kafka uses keys for partitioning
- Implement custom partitioning strategies
- Ensure ordered message processing
- Observe partition distribution
- Design for optimal parallelism

## Prerequisites

- Completed Labs 01-04
- Understanding of Kafka partitions
- Multiple partitions in payment_requests topic

## Background

Kafka guarantees message ordering only within a partition. By using message keys strategically, we can:
- Ensure related messages go to the same partition
- Maintain order for specific entities (e.g., customer transactions)
- Balance load across partitions
- Enable parallel processing while preserving order where needed

## How Partitioning Works

```
Key → Hash Function → Partition Number

Example:
"CUST0001" → hash → Partition 2
"CUST0002" → hash → Partition 5
"CUST0001" → hash → Partition 2 (same customer, same partition)
```

## Steps

### Step 1: Explore Current Partitioning

First, let's see how messages without keys are distributed:

```bash
cd kafka-payment-labs/day-1/lab-05-partitioning
python partition_analyzer.py
```

This shows:
- Random partition assignment (round-robin)
- No ordering guarantees
- Even distribution

### Step 2: Implement Key-Based Partitioning

Now let's use customer IDs as keys:

```bash
python keyed_producer.py
```

This producer:
- Uses customer_id as the message key
- Ensures all payments from a customer go to the same partition
- Maintains order per customer

### Step 3: Verify Partition Distribution

Check how messages are distributed:

```bash
python partition_distribution.py
```

You'll see:
- Each customer's messages in the same partition
- Distribution based on key hash
- Ordering preserved per customer

### Step 4: Custom Partitioning Strategy

Sometimes default partitioning isn't enough. Let's implement custom logic:

```bash
python custom_partitioner.py
```

This demonstrates:
- VIP customers to specific partitions
- High-value transactions to dedicated partitions
- Load balancing considerations

### Step 5: Parallel Processing with Order

Run multiple consumers to process different partitions:

```bash
# Terminal 1 - Consumer for partitions 0,1
python ordered_consumer.py --partitions 0,1

# Terminal 2 - Consumer for partitions 2,3
python ordered_consumer.py --partitions 2,3

# Terminal 3 - Consumer for partitions 4,5
python ordered_consumer.py --partitions 4,5

# Terminal 4 - Send keyed messages
python keyed_producer.py --continuous
```

Observe:
- Each consumer handles specific partitions
- Customer order maintained
- Parallel processing achieved

## Understanding Partition Assignment

### Default Partitioner
```python
# No key: Round-robin across partitions
producer.produce(topic='payments', value=message)

# With key: Hash-based partitioning
producer.produce(topic='payments', key=customer_id, value=message)
```

### Partition Selection
```
partition = hash(key) % num_partitions
```

### Custom Partitioner Logic
```python
def custom_partition(key, num_partitions):
    if is_vip_customer(key):
        return 0  # VIP partition
    elif is_high_value(key):
        return 1  # High-value partition
    else:
        return hash(key) % (num_partitions - 2) + 2
```

## Key Selection Strategies

### 1. Entity-Based Keys
- Customer ID: Order per customer
- Merchant ID: Order per merchant
- Session ID: Order per user session

### 2. Time-Based Keys
- Date: All events for a day together
- Hour: Smaller time windows
- Composite: customer_id + date

### 3. Business Logic Keys
- Priority level
- Geographic region
- Product category

## Hands-On Exercises

### Exercise 1: Region-Based Partitioning
Modify the keyed producer to:
- Extract region from customer data
- Use region as partition key
- Verify regional message grouping

### Exercise 2: Composite Keys
Implement composite keys:
- Combine customer_id and date
- Ensure daily ordering per customer
- Test with multiple days of data

### Exercise 3: Partition Rebalancing
Observe what happens when:
- Adding more consumers than partitions
- Removing consumers
- Partition reassignment

## Common Partitioning Pitfalls

### Hot Partitions
**Problem**: One key dominates traffic
```python
# Bad: All "guest" users to same partition
key = customer_id if customer_id else "guest"

# Good: Distribute guest users
key = customer_id if customer_id else f"guest_{random.randint(0, 100)}"
```

### Partition Skew
**Problem**: Uneven data distribution
```python
# Monitor partition sizes
for partition in range(num_partitions):
    size = get_partition_size(partition)
    print(f"Partition {partition}: {size} messages")
```

### Key Cardinality
**Problem**: Too few unique keys
```python
# Bad: Only 3 possible keys
key = payment_method  # "card", "cash", "transfer"

# Good: Higher cardinality
key = f"{payment_method}_{customer_id}"
```

## Production Best Practices

1. **Choose Keys Wisely**
   - High cardinality for even distribution
   - Business meaning for ordering
   - Avoid null keys when order matters

2. **Monitor Distribution**
   - Track messages per partition
   - Alert on skewed partitions
   - Rebalance if needed

3. **Plan for Growth**
   - Keys should scale with data
   - Consider future partition expansion
   - Design for repartitioning

4. **Document Key Strategy**
   - Why specific keys were chosen
   - Ordering guarantees provided
   - Partition assignment logic

## Key Takeaways

- Keys determine partition assignment
- Same key always goes to same partition
- Order guaranteed only within partition
- Choose keys based on ordering needs
- Monitor partition distribution
- Plan for scalability

## Performance Impact

### With Keys
- Ordered processing per key
- Potential hot partitions
- May need rebalancing

### Without Keys
- Round-robin distribution
- No ordering guarantees
- Better load distribution

## Next Steps

Congratulations on completing Day 1! You've learned:
- Kafka fundamentals
- Producer and consumer basics
- Partitioning strategies

Tomorrow (Day 2), we'll explore:
- Consumer groups for scaling
- Schema Registry and Avro
- Advanced error handling

## Additional Resources

- [Kafka Partitioning Strategies](https://www.confluent.io/blog/apache-kafka-partitioning-strategies/)
- [Ordering Guarantees](https://kafka.apache.org/documentation/#semantics)
- [Custom Partitioners](https://kafka.apache.org/documentation/#producerapi)