# Lab 04: Custom Partitioners - Controlling Data Locality

## Learning Objectives
- Understand Kafka partitioning strategies
- Implement custom partitioner logic
- Ensure message ordering for related data
- Recognize partitioning pitfalls

## Prerequisites
- Completed Lab 02 (Avro)
- Understanding of Kafka partitions
- Topic with multiple partitions

## Your Task

### Step 1: Create Multi-Partition Topic
```bash
# Create topic with 6 partitions
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic payments-partitioned \
  --partitions 6 \
  --replication-factor 1
```

### Step 2: Observe Default Partitioning
In `default_partitioner.py`:
1. Send payments WITHOUT key
2. Use the partition reporter consumer to see distribution
3. Notice: Round-robin distribution

Then:
1. Send payments WITH customer_id as key
2. Observe: Same customer always goes to same partition
3. This ensures ordering per customer!

### Step 3: Implement Custom Partitioner
Create `custom_partitioner.py`:
1. Define a partitioner function that:
   - VIP customers (CUST-1XXX) → Partition 0
   - Regular customers → Hash-based distribution
   - Handle edge cases (null key, etc.)
2. Configure producer to use your partitioner

### Step 4: Test Partition Distribution
1. Send mix of VIP and regular customers
2. Verify VIPs go to partition 0
3. Verify regular customers distribute evenly
4. What happens with high VIP traffic?

### Step 5: Analyze the Hot Partition Problem
1. Send 1000 VIP payments and 100 regular payments
2. Check partition lag/size
3. Discuss: Why is this problematic?
4. Brainstorm better strategies

### Exercises

1. **Time-based partitioner**: Route morning payments (before 12 PM) to partitions 0-2, afternoon to 3-5
2. **Geographic partitioner**: Based on currency (USD→0-1, EUR→2-3, GBP→4-5)
3. **Load-balanced partitioner**: Track message count per partition, route to least loaded

### Questions to Consider
1. When would you need a custom partitioner?
2. What are the risks of custom partitioning?
3. How does partitioning affect consumer scaling?
4. Why might ordering per key be important?

### Success Criteria
- [ ] Understand default partitioning behavior
- [ ] Successfully implement custom partitioner
- [ ] Observe partition distribution patterns
- [ ] Identify hot partition problem
- [ ] Design better partitioning strategy

## Hints
- Use `partitioner` parameter in producer config
- Partition function receives (key, all_partitions, available_partitions)
- Return partition number (0-indexed)
- Consider using modulo for distribution

## Common Pitfalls
- Hardcoding partition numbers (what if topic resizes?)
- Creating hot partitions unintentionally
- Not handling null keys
- Assuming partition count

## Next Step
We've controlled where data goes. Now let's ensure we don't lose any of it with manual offset management!