# Lab 04: Building Your First Consumer - Validator Service

## Learning Objectives

By the end of this lab, you will:
- Build a Kafka consumer in Python and Java Spring Boot
- Understand the consumer poll loop and @KafkaListener annotations
- Handle message deserialization and JSON processing
- Manage consumer offsets and error handling
- Implement comprehensive payment validation logic

## Prerequisites

- Completed Labs 01-03
- Messages in the payment_requests topic
- Understanding of consumer groups concept
- Java 17+ and Maven (for Java version)

## Background

A Kafka consumer reads messages from topics. In our payment system, the validator service consumes payment requests and performs basic validation before passing them to downstream services.

Key Consumer Concepts:
- **Consumer Groups**: Consumers with the same group.id coordinate to consume topics
- **Offsets**: Position of the consumer in each partition
- **Poll Loop**: Continuously fetch batches of messages
- **Commit**: Acknowledge messages have been processed

## Implementation Options

This lab provides implementations in both Python and Java Spring Boot:

### Python Implementation
- Traditional confluent-kafka Python client
- Manual poll loop and offset management
- Direct message processing

### Java Spring Boot Implementation  
- Spring Kafka @KafkaListener annotations
- Automatic JSON deserialization
- Service layer architecture with comprehensive validation
- Built-in error handling and statistics

Choose the implementation that matches your preferred technology stack.

## Python Steps

### Step 1: Understanding Consumer Basics

Navigate to the lab directory:

```bash
cd kafka-payment-labs/day-1/lab-04-validator-service
```

Review the consumer lifecycle:
1. Create consumer with configuration
2. Subscribe to topics
3. Poll for messages in a loop
4. Process each message
5. Commit offsets (automatic or manual)
6. Close consumer gracefully

### Step 2: Complete the Basic Consumer

Open `consumer_starter.py` and complete the TODOs:

1. **TODO 1**: Create consumer configuration
2. **TODO 2**: Subscribe to the topic
3. **TODO 3**: Implement the poll loop
4. **TODO 4**: Process messages
5. **TODO 5**: Handle graceful shutdown

### Step 3: Run Your Consumer

Test your implementation:

```bash
python consumer_starter.py
```

You should see:
- Consumer connecting to Kafka
- Messages being consumed
- Payment details printed

Keep it running and in another terminal, run the producer from Lab 03 to see real-time consumption!

### Step 4: Implement the Payment Validator

Now let's build a more realistic validator:

```bash
python payment_validator.py
```

This enhanced version includes:
- Payment validation rules
- Structured logging
- Error handling
- Metrics tracking

### Step 5: Understanding Offset Management

Explore different offset behaviors:

```bash
# Start from beginning
python offset_demo.py --reset earliest

# Start from end (only new messages)
python offset_demo.py --reset latest

# Use committed offsets
python offset_demo.py --reset committed
```

### Step 6: Consumer Group Coordination

Let's see how multiple consumers work together:

```bash
# Terminal 1
python payment_validator.py --instance 1

# Terminal 2
python payment_validator.py --instance 2

# Terminal 3 - Send messages
cd ../lab-03-payment-gateway
python payment_gateway.py
```

Observe how partitions are distributed among consumers!

## Understanding Consumer Internals

### The Poll Loop
```python
while True:
    msg = consumer.poll(timeout=1.0)
    if msg is None:
        continue  # No message within timeout
    if msg.error():
        handle_error(msg.error())
    else:
        process_message(msg)
```

### Offset Management Strategies

1. **Automatic Commit** (default):
   - Offsets committed periodically
   - Simple but risk of reprocessing or data loss

2. **Manual Commit**:
   - Commit after processing
   - More control but more complex

3. **Exactly-Once Processing**:
   - Transactional processing
   - Highest guarantee but most complex

### Consumer Configuration

Important settings:
```python
{
    'group.id': 'payment-validator',           # Consumer group
    'auto.offset.reset': 'earliest',           # Where to start
    'enable.auto.commit': True,                # Automatic commits
    'auto.commit.interval.ms': 5000,          # Commit interval
    'session.timeout.ms': 10000,              # Group coordinator timeout
    'max.poll.interval.ms': 300000,           # Max time between polls
}
```

## Hands-On Exercises

### Exercise 1: Validation Rules
Enhance the validator to check:
- Amount is positive and within limits
- Customer ID format is valid
- Required fields are present
- Currency is supported

### Exercise 2: Dead Letter Queue
Implement a DLQ for invalid payments:
- Create a new topic for invalid payments
- Send failed validations to DLQ
- Include error reason in the message

### Exercise 3: Batch Processing
Modify consumer to process in batches:
- Accumulate messages before processing
- Process batch when size or time limit reached
- Implement batch validation logic

## Common Issues and Solutions

### Consumer Lag
```python
# Check consumer lag
from confluent_kafka import TopicPartition

# Get current position
partitions = consumer.assignment()
positions = consumer.position(partitions)

# Get high water mark
for p in partitions:
    low, high = consumer.get_watermark_offsets(p)
    lag = high - positions[partitions.index(p)].offset
    print(f"Partition {p.partition}: Lag = {lag}")
```

### Rebalancing Issues
- Consumer takes too long to process
- Solution: Reduce `max.poll.records` or increase `max.poll.interval.ms`

### Duplicate Processing
- Consumer crashes after processing but before commit
- Solution: Implement idempotency in processing logic

## Production Best Practices

1. **Handle Errors Gracefully**
   ```python
   if msg.error():
       if msg.error().code() == KafkaError._PARTITION_EOF:
           # End of partition - normal condition
           continue
       else:
           # Real error
           raise KafkaException(msg.error())
   ```

2. **Implement Health Checks**
   - Monitor consumer lag
   - Track processing errors
   - Expose metrics endpoint

3. **Use Structured Logging**
   - Include message metadata
   - Track processing time
   - Log errors with context

4. **Design for Idempotency**
   - Handle duplicate messages
   - Use unique IDs
   - Track processed messages

5. **Graceful Shutdown**
   - Close consumer properly
   - Commit final offsets
   - Clean up resources

## Key Takeaways

- Consumers work in groups to scale processing
- The poll loop is the heart of a consumer
- Offset management affects delivery semantics
- Error handling is crucial for reliability
- Monitoring helps detect issues early

## Validation Rules for Payment Processor

Your validator should check:
1. Amount > 0 and <= $10,000
2. Customer ID matches pattern CUST[0-9]{4}
3. Currency is in ['USD', 'EUR', 'GBP']
4. All required fields are present
5. Timestamp is not in the future

## Java Spring Boot Implementation

For a comprehensive Java Spring Boot implementation with enterprise-grade validation:

```bash
cd java/
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.PaymentValidatorApplication
```

**Key features:**
- @KafkaListener annotation-based processing
- Automatic JSON deserialization to Payment objects
- Service layer with comprehensive validation rules
- Fraud detection simulation
- Statistics tracking and monitoring
- Production-ready error handling

**See the detailed Java guide:** [`java/README-JAVA.md`](java/README-JAVA.md)

## Next Steps

In the next lab, we'll explore partitioning strategies and how to use message keys effectively to ensure ordered processing.

## Additional Resources

- [Confluent Consumer Documentation](https://docs.confluent.io/kafka-clients/python/current/overview.html#consumer)
- [Spring Kafka Documentation](https://docs.spring.io/spring-kafka/docs/current/reference/html/)
- [Consumer Configuration Reference](https://docs.confluent.io/platform/current/installation/configuration/consumer-configs.html)
- [Consumer Group Protocol](https://kafka.apache.org/documentation/#impl_consumer)