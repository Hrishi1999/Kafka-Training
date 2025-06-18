# Module 4: Advanced Resilience Patterns - Building Bulletproof Consumers

## Time: 75 minutes

## Learning Objectives
- Understand why simple try/catch fails in production
- Implement non-blocking retry patterns
- Build dead letter queue (DLQ) strategies
- Design resilient payment processing systems
- Handle poison pill messages gracefully

## Prerequisites
- Completed Module 3 (Manual Offset Management)
- Understanding of consumer offset semantics
- Working Day 1 payment processing context

---

## The Problem: When Good Consumers Go Bad

### Scenario: Payment Processing Failures

Your payment processor from Day 1 works great... until it doesn't. In production, you'll encounter:

- **Transient failures**: Network timeouts, temporary service outages
- **Poison pill messages**: Malformed data that always fails processing
- **Business logic failures**: Invalid customer IDs, insufficient funds
- **External service failures**: Bank API down, fraud service unavailable

**The Death Spiral**: One bad message stops your entire partition!

---

## Lab 4.1: The Blocking Retry Anti-Pattern (20 min)

### Step 1: Create a Fragile Consumer

Create `fragile_consumer.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka import Consumer
import json
import time
import random

def create_consumer():
    config = get_kafka_config()
    config.update({
        'group.id': 'fragile-payment-processor',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    })
    return Consumer(config)

def process_payment(payment):
    """Fragile payment processing with failures"""
    
    # Simulate random failures (30% chance)
    if random.random() < 0.3:
        failure_type = random.choice([
            'network_timeout',
            'invalid_customer', 
            'fraud_check_failed',
            'bank_api_down'
        ])
        raise Exception(f"Payment processing failed: {failure_type}")
    
    # Simulate processing time
    time.sleep(0.1)
    print(f"✅ Processed payment {payment['payment_id']}")
    return True

def fragile_consumer_loop():
    """THE WRONG WAY - Blocking retries"""
    consumer = create_consumer()
    consumer.subscribe(['payment_requests'])
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
                
            if msg.error():
                continue
                
            payment = json.loads(msg.value().decode('utf-8'))
            
            # ANTI-PATTERN: Blocking retry loop
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    process_payment(payment)
                    consumer.commit()  # Only commit on success
                    break
                except Exception as e:
                    print(f"❌ Attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        print(f"💀 Message failed permanently: {payment['payment_id']}")
                        # What do we do now? Skip? Stop?
                        consumer.commit()  # Commit to skip the poison pill
                    else:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()

if __name__ == "__main__":
    fragile_consumer_loop()
```

### Step 2: Observe the Problems

Run the fragile consumer and watch what happens:

```bash
# In one terminal - produce some test payments
python ../module-1-schema-evolution/avro_producer.py

# In another terminal - run the fragile consumer  
python fragile_consumer.py
```

**Problems to observe:**
1. **Partition blocking**: Failed messages block all subsequent messages
2. **Offset commitment delays**: Long retry loops delay offset commits
3. **Consumer group impact**: Other partitions can't rebalance properly
4. **Resource waste**: CPU spinning on retries

### Step 3: Document the Pain

Create `problems_observed.md` documenting:
- How long does it take to process 10 messages when 30% fail?
- What happens to consumer lag during retry loops?
- How does this affect other consumers in the group?

---

## Lab 4.2: Dead Letter Queue Pattern (25 min)

### Step 1: Implement Basic DLQ

Create `dlq_consumer.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka import Consumer, Producer
import json
import time
import random
from datetime import datetime

class DLQProducer:
    def __init__(self):
        self.producer = Producer(get_kafka_config())
        
    def send_to_dlq(self, original_message, error, topic_name):
        """Send failed message to Dead Letter Queue with metadata"""
        
        # Create DLQ message with error context
        dlq_message = {
            'original_topic': original_message.topic(),
            'original_partition': original_message.partition(),
            'original_offset': original_message.offset(),
            'original_key': original_message.key().decode('utf-8') if original_message.key() else None,
            'original_value': original_message.value().decode('utf-8'),
            'error_reason': str(error),
            'error_timestamp': int(datetime.now().timestamp()),
            'failed_processing_attempts': 1
        }
        
        # Send to DLQ topic
        dlq_topic = f"{topic_name}-dlq"
        self.producer.produce(
            topic=dlq_topic,
            key=original_message.key(),
            value=json.dumps(dlq_message).encode('utf-8'),
            headers={
                'error-reason': str(error),
                'error-timestamp': str(int(datetime.now().timestamp())),
                'original-topic': original_message.topic()
            }
        )
        self.producer.flush()
        print(f"📨 Sent to DLQ: {dlq_topic}")

def create_consumer():
    config = get_kafka_config()
    config.update({
        'group.id': 'dlq-payment-processor',
        'auto.offset.reset': 'earliest', 
        'enable.auto.commit': False
    })
    return Consumer(config)

def process_payment_with_dlq():
    """Non-blocking consumer with DLQ"""
    consumer = create_consumer()
    dlq_producer = DLQProducer()
    consumer.subscribe(['payment_requests'])
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
                
            if msg.error():
                continue
                
            try:
                # Parse and process payment
                payment = json.loads(msg.value().decode('utf-8'))
                
                # Simulate failures
                if random.random() < 0.2:  # 20% failure rate
                    raise Exception("Payment validation failed")
                    
                # Process successfully
                time.sleep(0.1)
                print(f"✅ Processed payment {payment['payment_id']}")
                
                # Commit immediately after success
                consumer.commit()
                
            except Exception as e:
                print(f"❌ Processing failed: {e}")
                
                # Send to DLQ instead of retrying
                dlq_producer.send_to_dlq(msg, e, 'payment_requests')
                
                # Commit the offset to skip the poison pill
                consumer.commit()
                print(f"⏭️  Skipped message, continuing with next")
                
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()

if __name__ == "__main__":
    process_payment_with_dlq()
```

### Step 2: Test DLQ Pattern

1. Run the DLQ consumer
2. Produce test messages
3. Observe that failed messages go to DLQ but processing continues

### Step 3: DLQ Analysis Consumer

Create `dlq_analyzer.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka import Consumer
import json

def analyze_dlq():
    """Analyze messages in the Dead Letter Queue"""
    config = get_kafka_config()
    config.update({
        'group.id': 'dlq-analyzer',
        'auto.offset.reset': 'earliest'
    })
    
    consumer = Consumer(config)
    consumer.subscribe(['payment_requests-dlq'])
    
    error_counts = {}
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                print("\n📊 DLQ Analysis:")
                for error, count in error_counts.items():
                    print(f"  {error}: {count} messages")
                if not error_counts:
                    print("  No messages in DLQ")
                break
                
            if msg.error():
                continue
                
            dlq_data = json.loads(msg.value().decode('utf-8'))
            error_reason = dlq_data['error_reason']
            
            error_counts[error_reason] = error_counts.get(error_reason, 0) + 1
            print(f"🔍 DLQ Message: {error_reason}")
            
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()

if __name__ == "__main__":
    analyze_dlq()
```

---

## Lab 4.3: Non-Blocking Retry Pattern (30 min)

### Step 1: Multi-Level Retry Topics

Create `retry_consumer.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka import Consumer, Producer
import json
import time
import random
from datetime import datetime

class RetryProducer:
    def __init__(self):
        self.producer = Producer(get_kafka_config())
        
    def send_to_retry(self, original_message, error, retry_level=1):
        """Send message to appropriate retry topic"""
        
        # Parse original message to get retry count
        try:
            if hasattr(original_message, 'headers') and original_message.headers():
                headers = dict(original_message.headers())
                retry_count = int(headers.get('retry-count', b'0').decode('utf-8'))
            else:
                retry_count = 0
        except:
            retry_count = 0
            
        retry_count += 1
        max_retries = 3
        
        if retry_count > max_retries:
            # Send to DLQ after max retries
            dlq_topic = f"{original_message.topic()}-dlq"
            dlq_message = {
                'original_value': original_message.value().decode('utf-8'),
                'error_reason': str(error),
                'failed_after_retries': retry_count - 1,
                'error_timestamp': int(datetime.now().timestamp())
            }
            
            self.producer.produce(
                topic=dlq_topic,
                key=original_message.key(),
                value=json.dumps(dlq_message).encode('utf-8'),
                headers={'final-failure': 'true'}
            )
            print(f"💀 Sent to DLQ after {retry_count-1} retries")
        else:
            # Send to retry topic
            retry_topic = f"{original_message.topic()}-retry-{retry_count}"
            
            self.producer.produce(
                topic=retry_topic,
                key=original_message.key(),
                value=original_message.value(),
                headers={
                    'retry-count': str(retry_count).encode('utf-8'),
                    'original-error': str(error).encode('utf-8'),
                    'retry-timestamp': str(int(datetime.now().timestamp())).encode('utf-8')
                }
            )
            print(f"🔄 Sent to retry level {retry_count}")
            
        self.producer.flush()

def process_with_retries():
    """Main consumer with retry logic"""
    consumer = Consumer({
        **get_kafka_config(),
        'group.id': 'retry-payment-processor',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    })
    
    retry_producer = RetryProducer()
    consumer.subscribe(['payment_requests'])
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
                
            if msg.error():
                continue
                
            try:
                payment = json.loads(msg.value().decode('utf-8'))
                
                # Simulate different failure types
                failure_chance = random.random()
                if failure_chance < 0.1:  # 10% permanent failure
                    raise Exception("Invalid customer ID - permanent failure")
                elif failure_chance < 0.2:  # 10% transient failure
                    raise Exception("Network timeout - transient failure")
                
                # Process successfully
                time.sleep(0.1)
                print(f"✅ Processed payment {payment['payment_id']}")
                consumer.commit()
                
            except Exception as e:
                print(f"❌ Processing failed: {e}")
                retry_producer.send_to_retry(msg, e)
                consumer.commit()  # Commit to move on
                
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()

if __name__ == "__main__":
    process_with_retries()
```

### Step 2: Retry Topic Processors

Create `retry_processor.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka import Consumer, Producer
import time
import threading

def create_retry_processor(retry_level, delay_seconds):
    """Create a processor for a specific retry level"""
    
    def process_retry_topic():
        config = get_kafka_config()
        config.update({
            'group.id': f'retry-processor-{retry_level}',
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        })
        
        consumer = Consumer(config)
        producer = Producer(get_kafka_config())
        
        retry_topic = f'payment_requests-retry-{retry_level}'
        consumer.subscribe([retry_topic])
        
        print(f"🔄 Started retry processor for level {retry_level} (delay: {delay_seconds}s)")
        
        try:
            while True:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                    
                if msg.error():
                    continue
                    
                # Wait for backoff period
                print(f"⏰ Waiting {delay_seconds}s before retry...")
                time.sleep(delay_seconds)
                
                # Send back to main topic for retry
                producer.produce(
                    topic='payment_requests',
                    key=msg.key(),
                    value=msg.value(),
                    headers=msg.headers()
                )
                producer.flush()
                
                consumer.commit()
                print(f"🔁 Retried message from level {retry_level}")
                
        except KeyboardInterrupt:
            pass
        finally:
            consumer.close()
    
    return process_retry_topic

def main():
    """Run all retry processors in parallel"""
    
    # Create retry processors with exponential backoff
    processors = [
        (1, 5),   # Level 1: 5 second delay
        (2, 15),  # Level 2: 15 second delay  
        (3, 60),  # Level 3: 60 second delay
    ]
    
    threads = []
    for level, delay in processors:
        processor_func = create_retry_processor(level, delay)
        thread = threading.Thread(target=processor_func)
        thread.daemon = True
        thread.start()
        threads.append(thread)
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down retry processors...")

if __name__ == "__main__":
    main()
```

### Step 3: End-to-End Resilience Test

1. Start the retry processors: `python retry_processor.py`
2. Start the main consumer: `python retry_consumer.py`
3. Produce test messages and observe the retry flow
4. Analyze DLQ for permanently failed messages

---

## Discussion & Best Practices (10 min)

### Trade-offs Analysis

| Pattern | Pros | Cons |
|---------|------|------|
| **Blocking Retry** | Simple to implement | Blocks partition, affects other consumers |
| **DLQ Only** | Fast failure recovery | No retry for transient failures |
| **Non-Blocking Retry** | Handles transient + permanent failures | Complex setup, topic proliferation |

### Production Considerations

1. **Monitoring**: Alert on DLQ message rates
2. **Message Ordering**: Retry patterns break strict ordering
3. **Topic Management**: Automated cleanup of retry topics
4. **Idempotency**: Ensure processing is idempotent
5. **Resource Usage**: Retry processors consume resources

### Framework Support

Most production systems use frameworks that abstract these patterns:
- **Spring Kafka**: `@RetryableTopic` annotation
- **Quarkus**: Reactive messaging with retry policies
- **Apache Camel**: Enterprise integration patterns

But understanding the underlying mechanics is crucial for debugging and optimization!

---

## Success Criteria
- [ ] Implemented DLQ pattern
- [ ] Built non-blocking retry system
- [ ] Handled both transient and permanent failures
- [ ] Maintained partition processing velocity
- [ ] Understood production trade-offs

## Next Steps
With bulletproof error handling, your payment system can handle real-world failures gracefully. You're now ready for production deployment!

---

## Common Issues

**"Retry topics not being consumed"**
→ Check topic names match exactly

**"Messages stuck in retry loop"**
→ Verify retry count headers are properly incremented

**"DLQ analysis shows no messages"**
→ Ensure DLQ topic exists and consumer group is correct

**"Performance degradation"**
→ Monitor retry processor resource usage