# Lab 03: Building Your First Producer - Payment Gateway

## Learning Objectives

By the end of this lab, you will:
- Build a Kafka producer in Python and Java Spring Boot
- Understand producer configuration options
- Send messages to Kafka topics
- Handle delivery callbacks and errors
- Implement basic error handling and retries

## Prerequisites

- Completed Labs 01 and 02
- Understanding of Kafka topics and partitions
- Basic Python knowledge (for Python version)
- Java 17+ and Maven (for Java version)

## Background

A Kafka producer is an application that publishes messages to Kafka topics. In our payment processing system, the producer acts as a gateway that receives payment requests and sends them to Kafka for processing.

Key Producer Concepts:
- **Asynchronous sending**: Messages are batched and sent in the background
- **Acknowledgments**: Confirmation that the broker received the message
- **Callbacks**: Functions called when messages are delivered or fail
- **Serialization**: Converting data to bytes for transmission

## Implementation Options

This lab provides implementations in both Python and Java Spring Boot:

### Python Implementation
- Traditional confluent-kafka Python client
- Direct Kafka configuration
- Manual callback handling

### Java Spring Boot Implementation  
- Spring Kafka framework
- Configuration via application.yml
- Service layer architecture
- Comprehensive error handling

Choose the implementation that matches your preferred technology stack.

## Python Steps

### Step 1: Understanding the Starter Code

Navigate to the lab directory:

```bash
cd kafka-payment-labs/day-1/lab-03-payment-gateway
```

Open `producer_starter.py` and review the structure:
- Configuration setup
- Producer initialization
- Message sending logic
- Callback handling

### Step 2: Complete the Basic Producer

Your task is to complete the TODOs in `producer_starter.py`:

1. **TODO 1**: Create the producer configuration
2. **TODO 2**: Implement the delivery callback
3. **TODO 3**: Send messages to Kafka
4. **TODO 4**: Ensure all messages are sent

### Step 3: Run Your Producer

Test your implementation:

```bash
python producer_starter.py
```

You should see:
- Messages being sent
- Delivery confirmations
- Final statistics

### Step 4: Verify in Confluent Cloud

1. Go to your Confluent Cloud cluster
2. Navigate to Topics → payment_requests → Messages
3. You should see your payment messages!

### Step 5: Implement the Payment Gateway

Now, let's build a more realistic payment gateway:

```bash
python payment_gateway.py
```

This enhanced version includes:
- Structured payment data
- JSON serialization
- UUID generation for payment IDs
- Timestamp handling
- Better error handling

### Step 6: Producer Configuration Deep Dive

Let's explore important producer configurations:

```python
config = {
    # Connection settings (from previous labs)
    'bootstrap.servers': '...',
    
    # Performance tuning
    'linger.ms': 10,              # Wait up to 10ms to batch messages
    'batch.size': 16384,          # Batch size in bytes
    'compression.type': 'snappy', # Compression algorithm
    
    # Reliability settings
    'acks': 'all',                # Wait for all replicas
    'retries': 3,                 # Number of retries
    'max.in.flight.requests.per.connection': 5
}
```

Try modifying these in `producer_config_demo.py` to see the effects.

### Step 7: Load Testing

Test your producer under load:

```bash
python load_test_producer.py
```

This script:
- Sends many messages quickly
- Measures throughput
- Reports statistics

## Understanding Producer Internals

### Message Flow
1. Application calls `produce()`
2. Message added to internal buffer
3. Background thread batches messages
4. Batch sent to Kafka broker
5. Broker acknowledges receipt
6. Callback invoked with result

### Delivery Guarantees
- **At most once**: Fire and forget (acks=0)
- **At least once**: Wait for leader (acks=1)
- **Strongest**: Wait for all replicas (acks=all)

### Error Handling
Common errors and solutions:
- **BufferError**: Producer buffer full → Increase buffer or slow down
- **KafkaError**: Network/broker issues → Implement retry logic
- **SerializationError**: Invalid message format → Validate before sending

## Hands-On Exercises

### Exercise 1: Custom Serialization
Modify the payment gateway to send Avro-style messages:
- Define a payment schema
- Implement custom serializer
- Send structured data

### Exercise 2: Partitioning Strategy
Implement custom partitioning:
- Send high-value payments to specific partitions
- Use customer ID for partition assignment
- Verify partition distribution

### Exercise 3: Error Simulation
Add error handling for:
- Network failures (disconnect from internet)
- Invalid messages (null values)
- Topic doesn't exist

## Common Issues and Solutions

### "Local: Queue full" Error
```python
# Solution 1: Increase buffer
config['queue.buffering.max.messages'] = 100000

# Solution 2: Add backpressure
if len(producer) > 10000:
    producer.flush()
```

### Messages Not Appearing
- Check callbacks for errors
- Ensure `flush()` is called
- Verify topic name is correct

### Poor Performance
- Increase `linger.ms` for better batching
- Enable compression
- Tune batch size

## Production Best Practices

1. **Always use callbacks**: Track successes and failures
2. **Handle errors gracefully**: Log, retry, or send to DLQ
3. **Monitor metrics**: Track throughput and errors
4. **Use structured logging**: Include payment ID in logs
5. **Implement circuit breakers**: Fail fast when broker is down

## Key Takeaways

- Producers send messages asynchronously
- Callbacks provide delivery confirmation
- Configuration affects performance and reliability
- Error handling is crucial for production systems
- Monitoring helps identify issues early

## Java Spring Boot Implementation

For a complete Java Spring Boot implementation with modern enterprise patterns:

```bash
cd java/
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ProducerSolution
```

**Key features:**
- Spring Boot auto-configuration
- Service layer architecture
- Configuration via application.yml
- Comprehensive error handling
- Production-ready patterns

**See the detailed Java guide:** [`java/README-JAVA.md`](java/README-JAVA.md)

## Next Steps

In the next lab, we'll build a consumer to process these payment messages, completing our first producer-consumer pipeline.

## Additional Resources

- [Confluent Producer Documentation](https://docs.confluent.io/kafka-clients/python/current/overview.html#producer)
- [Spring Kafka Documentation](https://spring.io/projects/spring-kafka)
- [Producer Configuration Reference](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html)
- [Best Practices for Producers](https://www.confluent.io/blog/kafka-producer-best-practices/)