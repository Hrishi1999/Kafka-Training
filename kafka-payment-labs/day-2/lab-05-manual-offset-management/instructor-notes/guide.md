# Instructor Guide - Lab 05: Manual Offset Management

## Time Allocation: 45-50 minutes

### Learning Objectives
- Prove auto-commit can lose messages
- Implement reliable manual commits
- Understand delivery guarantees
- Design proper error handling

### The Hook (5 min)

Start with a dramatic demonstration:

"Who here would be comfortable losing customer payments? No one? Then let me show you how Kafka's default settings can lose your data..."

### Part 1: Proving Auto-Commit Failure (15 min)

**Live Demo - The Data Loss Scenario:**

1. **First run (2-second processing):**
   ```bash
   python auto_commit_consumer.py 2
   ```
   - Process payment
   - Crash before auto-commit
   - Run again - **same message reappears!**
   - "Good - at least we didn't lose it"

2. **Second run (7-second processing):**
   ```bash
   python auto_commit_consumer.py 7
   ```
   - Process payment
   - Auto-commit happens during sleep
   - Crash after commit
   - Run again - **message is gone!**
   - "We processed it but crashed before saving to DB!"

**Key Teaching Points:**
- Auto-commit is time-based, not success-based
- Default interval is 5 seconds
- Commits happen in background thread
- No correlation with processing success

**Diagram on Whiteboard:**
```
Timeline:
0s: Receive message
1s: Start processing
3s: Still processing...
5s: AUTO-COMMIT! (background)
6s: Still processing...
7s: CRASH!
Result: Message marked as processed but work not completed
```

### Part 2: Manual Commit Solution (15 min)

**Key Concept: "Commit = Contract"**

When you commit, you're saying: "I guarantee this message has been fully processed"

**Demo the Solution:**
```bash
python manual_commit_consumer.py
```

Show three scenarios:

1. **Success case**: Process → Commit → Safe
2. **Process failure**: Process fails → No commit → Retry on restart
3. **Commit failure**: Process succeeds → Commit fails → Reprocess (handle duplicates properly!)

**Code Review Focus:**
```python
# BAD: Commit before processing
message = consumer.poll()
consumer.commit()  # What if we crash here?
process(message)   # Message lost!

# GOOD: Commit after processing  
message = consumer.poll()
process(message)   # If we crash here...
consumer.commit()  # ...message will be redelivered
```

### Part 3: Batch Processing (10 min)

**Why Batch?**
- Performance (bulk operations)
- Atomicity (all or nothing)
- Efficiency (fewer commits)

**The Trade-off:**
- Larger batches = Better performance
- Larger batches = More reprocessing on failure

**Demo Batch Failure:**
```bash
python batch_consumer.py 5
```
Kill it mid-batch - entire batch reprocessed!

### Part 4: Idempotency Discussion (10 min)

**The Million Dollar Question:**
"If we guarantee at-least-once delivery, how do we prevent charging customers twice?"

**Lead Interactive Design Session:**

1. **Database Approach:**
   - Students suggest: "Check if payment exists"
   - Challenge: "What about race conditions?"
   - Solution: Unique constraint on payment_id

2. **Distributed Lock:**
   - "What if two instances process simultaneously?"
   - Redis/Zookeeper locks
   - Timeout considerations

3. **Error Handling Patterns:**
   - Retry strategies
   - Dead letter queues
   - Circuit breakers

**Real-World Example:**
"Payment processors handle duplicate detection through transaction IDs. Each payment has a unique ID that prevents double-charging even if messages are processed twice."

### Common Issues & Solutions

1. **"My consumer hangs"**
   - Check max.poll.interval.ms
   - Processing taking too long
   - Add heartbeats

2. **"Commits are slow"**
   - Sync vs async commits
   - Batch commits
   - Network latency

3. **"How do I test this?"**
   - Chaos engineering
   - Kill -9 your consumer
   - Network partition simulation

### Advanced Topics (if time)

1. **Exactly-Once Semantics:**
   - Requires Kafka transactions
   - Producer + Consumer in transaction
   - Performance implications

2. **Offset Storage:**
   - Default: Kafka __consumer_offsets
   - Custom: Database with business data
   - Transactional outbox pattern

3. **Rebalance Handling:**
   - Commit before rebalance
   - ConsumerRebalanceListener
   - Avoid message loss during rebalance

### Lab Exercises

1. **Break It Challenge:**
   "Find 3 ways to lose messages with auto-commit"

2. **Fix It Challenge:**
   "Implement manual commits with retry logic"

3. **Design Challenge:**
   "Design error handling for payment processing"

### Production War Stories

Share real incidents:
- "The time we processed 10,000 payments twice"
- "Why our bank insisted on exactly-once"
- "The auto-commit disaster of 2019"

### Key Takeaways

Write on board and leave visible:
1. **Auto-commit is convenient but dangerous**
2. **Manual commit after processing for safety**
3. **At-least-once requires duplicate handling**
4. **Test failure scenarios extensively**
5. **Monitor commit lag and failures**

### Assessment Questions

1. "When does auto-commit happen?" (Time-based, not success-based)
2. "What's the risk of committing before processing?" (Message loss)
3. "How do you prevent duplicate charges?" (Idempotency)
4. "What's better: sync or async commit?" (Depends on use case)

### Closing Demo

"Let's run both consumers side by side and kill them randomly. Which one never loses a payment?"

This visceral demonstration drives home the importance of manual commits.

### Homework

"Go check your production Kafka consumers. How many use auto-commit? Sleep well tonight..."