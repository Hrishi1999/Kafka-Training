# Lab 05: Manual Offset Management - Guaranteeing Message Processing

## Learning Objectives
- Understand the dangers of auto-commit
- Implement at-least-once processing guarantees
- Prove message loss scenarios
- Handle manual offset management correctly

## Prerequisites
- Understanding of consumer groups
- Basic knowledge of offsets
- Completed previous labs

## The Challenge

Your payment processor MUST NOT lose messages. You'll prove that auto-commit can lose data, then fix it with manual offset management.

## Your Task

### Step 1: Prove Auto-Commit Message Loss

In `auto_commit_consumer.py`:
1. Create consumer with:
   - `enable.auto.commit=True`
   - `auto.commit.interval.ms=5000` (5 seconds)
2. After receiving a message:
   - Print "Processing payment..."
   - Sleep for 2 seconds (simulating work)
   - Crash with `sys.exit(1)`
3. Run and observe: Message is lost!

Then modify:
1. Change sleep to 7 seconds (longer than auto-commit)
2. Run again: Message is NOT lost. Why?

### Step 2: Implement Manual Commit Solution

In `manual_commit_consumer.py`:
1. Set `enable.auto.commit=False`
2. Process message completely
3. Only then call `consumer.commit()`
4. Test the crash scenario again

### Step 3: Batch Processing with Manual Commits

In `batch_consumer.py`:
1. Collect 5 messages before processing
2. Process all as a batch
3. Commit only after batch succeeds
4. What happens if message 3 of 5 fails?

### Step 4: Error Handling Strategy

Design an error handling approach for:
1. Transient failures (network issues)
2. Permanent failures (invalid data)
3. Partial batch processing failures

### Experiments to Try

1. **Commit Timing:**
   - Commit before processing (at-most-once)
   - Commit after processing (at-least-once)
   - Which is safer for payments?

2. **Commit Strategies:**
   - Sync commit: `commit(asynchronous=False)`
   - Async commit: `commit(asynchronous=True)`
   - Measure performance difference

3. **Offset Storage:**
   - Commit to Kafka (default)
   - Store in database with transaction

### Questions to Consider

1. Why might you lose messages with auto-commit?
2. What's the trade-off with manual commits?
3. How do you handle duplicate processing?
4. When would you use async commits?

### Success Criteria
- [ ] Demonstrated message loss with auto-commit
- [ ] Implemented reliable manual commit consumer
- [ ] Understood at-least-once guarantees
- [ ] Designed error handling strategy
- [ ] Measured performance implications

## Hints
- Check consumer position with `consumer.position()`
- Use `consumer.committed()` to see committed offsets
- Think about crash timing relative to auto-commit
- Consider transaction boundaries

## Common Pitfalls
- Committing before processing (data loss)
- Not handling rebalance during processing
- Assuming exactly-once without transactions
- Not implementing proper error handling

## Real-World Scenario

You're processing payment refunds. Each refund MUST be processed exactly once. How do you:
1. Ensure no refund is missed?
2. Ensure no double refunds?
3. Handle consumer crashes gracefully?
4. Scale to multiple consumers?

## Next Steps

Congratulations! You've mastered:
- Schema management with Avro
- REST API integration
- Partitioning strategies
- Reliable message processing

You're ready to build production Kafka applications!