# Module 1: Schema Evolution - From JSON Chaos to Avro Order

## Time: 90 minutes

## Learning Objectives
- Experience firsthand why JSON schemas break in production
- Implement Avro for schema enforcement and evolution
- Migrate Day 1 code from JSON to Avro
- Understand backward/forward compatibility

## Prerequisites
- Completed Day 1 with working JSON producer/consumer
- Running Day 1 readiness check: `python day1-readiness-check.py`

---

## Lab 1.1: JSON Problems (25 min)
**Goal**: Break your Day 1 code to understand why schemas matter

### Step 1: Locate Your Day 1 Code
Find your Day 1 payment producer and consumer code. If you don't have it:
```bash
# Reference the Day 1 lab-03-payment-gateway structure
ls ../day-1/lab-03-payment-gateway/
```

### Step 2: Run Your Day 1 Code (Baseline)
```bash
# Start your Day 1 consumer
python day1_consumer.py

# In another terminal, run your Day 1 producer
python day1_producer.py
```

Verify it works! You should see payments flowing successfully.

### Step 3: Breaking Change #1 - Type Change
Modify your Day 1 producer to send `amount` as a string instead of float:

```python
# In your producer - BREAK IT INTENTIONALLY
payment = {
    "payment_id": str(uuid.uuid4()),
    "amount": "99.99",  # STRING instead of float!
    "currency": "USD",
    "customer_id": "CUST-1234", 
    "timestamp": int(time.time())
}
```

**Exercise**: Run the producer. What happens to your consumer?

### Step 4: Breaking Change #2 - Field Rename
```python
# BREAK IT MORE
payment = {
    "payment_id": str(uuid.uuid4()),
    "amount": 99.99,
    "currency_code": "USD",  # RENAMED from 'currency'!
    "customer_id": "CUST-1234",
    "timestamp": int(time.time())
}
```

### Step 5: Breaking Change #3 - Missing Field
```python
# BREAK IT COMPLETELY
payment = {
    "payment_id": str(uuid.uuid4()),
    "amount": 99.99,
    "currency": "USD",
    # "customer_id" MISSING!
    "timestamp": int(time.time())
}
```

### Step 6: Document the Chaos
Create `json_problems.md` documenting every failure mode you discovered:
- Runtime errors vs silent corruption
- Impact on downstream consumers
- How you'd detect these issues in production
- Cost of fixing after deployment

**Reality Check**: These are REAL production incidents that cost companies millions!

---

## Lab 1.2: Avro Migration (35 min)
**Goal**: Fix the chaos with proper schema management

### Step 1: Define Your Payment Schema
Create `schemas/payment.avsc`:

```json
{
  "namespace": "com.paymentdemo.events",
  "type": "record", 
  "name": "Payment",
  "doc": "Payment transaction event",
  "fields": [
    {
      "name": "payment_id",
      "type": "string",
      "doc": "Unique payment identifier"
    },
    {
      "name": "amount", 
      "type": "double",
      "doc": "Payment amount in decimal format"
    },
    {
      "name": "currency",
      "type": "string", 
      "doc": "ISO 4217 currency code"
    },
    {
      "name": "customer_id",
      "type": "string",
      "doc": "Customer identifier"
    },
    {
      "name": "timestamp",
      "type": "long",
      "doc": "Unix timestamp of payment creation"
    }
  ]
}
```

### Step 2: Create Avro Producer
Create `avro_producer.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer
import json
import uuid
import time

def load_schema():
    """Load payment schema"""
    with open('schemas/payment.avsc', 'r') as f:
        return avro.loads(json.dumps(json.load(f)))

def create_avro_producer():
    """Create AvroProducer with schema"""
    # TODO: Implement this
    # - Use get_kafka_config() for Confluent Cloud
    # - Add Schema Registry configuration  
    # - Set value schema
    pass

def generate_payment():
    """Generate valid payment matching schema"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": 99.99,  # Must be double
        "currency": "USD",  # Must be string
        "customer_id": "CUST-1234",  # Must be string  
        "timestamp": int(time.time())  # Must be long
    }

def main():
    schema = load_schema()
    producer = create_avro_producer(schema)
    
    # Send valid payment
    payment = generate_payment()
    producer.produce(topic='payments-avro', value=payment)
    
    # TODO: Try to send invalid payment
    # What happens when you send amount as string?
    
    producer.flush()

if __name__ == "__main__":
    main()
```

### Step 3: Implement the Producer
Fill in the `create_avro_producer()` function. Hints:
- Use `confluent_kafka.avro.AvroProducer`
- Schema Registry URL comes from your `.env`
- Set `default_value_schema` parameter

### Step 4: Test Schema Validation
Try to produce invalid data:
```python
# This should FAIL at produce time
bad_payment = {
    "payment_id": str(uuid.uuid4()),
    "amount": "not-a-number",  # Invalid type!
    "currency": "USD",
    "customer_id": "CUST-1234",
    "timestamp": int(time.time())
}
producer.produce(topic='payments-avro', value=bad_payment)
```

**Compare**: When does the error occur with Avro vs JSON?

### Step 5: Create Avro Consumer
Create `avro_consumer.py`:

```python
import sys
sys.path.append('..')
from config import get_kafka_config
from confluent_kafka.avro import AvroConsumer

def create_avro_consumer():
    """Create AvroConsumer"""
    # TODO: Implement this
    # - Use get_kafka_config()
    # - Add Schema Registry configuration
    # - Set consumer group and offset reset
    pass

def main():
    consumer = create_avro_consumer()
    consumer.subscribe(['payments-avro'])
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
                
            if msg.error():
                print(f"Error: {msg.error()}")
                continue
                
            # Payment is automatically deserialized!
            payment = msg.value()
            print(f"Received payment: {payment}")
            
    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()

if __name__ == "__main__":
    main()
```

### Step 6: End-to-End Test
1. Run your Avro consumer
2. Run your Avro producer  
3. Verify payments flow with automatic serialization/deserialization
4. Check the Schema Registry in Confluent Cloud UI

---

## Lab 1.3: Schema Evolution (30 min)
**Goal**: Add fields without breaking existing consumers

### Step 1: Current State
- Producer V1 sending to `payments-avro`
- Consumer V1 reading successfully
- Schema registered in Schema Registry

### Step 2: Create Schema V2
Create `schemas/payment_v2.avsc`:

```json
{
  "namespace": "com.paymentdemo.events",
  "type": "record",
  "name": "Payment", 
  "doc": "Payment transaction event - Version 2",
  "fields": [
    {
      "name": "payment_id",
      "type": "string",
      "doc": "Unique payment identifier"
    },
    {
      "name": "amount",
      "type": "double", 
      "doc": "Payment amount in decimal format"
    },
    {
      "name": "currency",
      "type": "string",
      "doc": "ISO 4217 currency code"
    },
    {
      "name": "customer_id", 
      "type": "string",
      "doc": "Customer identifier"
    },
    {
      "name": "timestamp",
      "type": "long",
      "doc": "Unix timestamp of payment creation" 
    },
    {
      "name": "status",
      "type": "string",
      "default": "PENDING",
      "doc": "Payment status"
    },
    {
      "name": "fee_amount",
      "type": ["null", "double"],
      "default": null,
      "doc": "Optional processing fee"
    }
  ]
}
```

### Step 3: Create Producer V2
Create `avro_producer_v2.py` using the V2 schema:

```python
def generate_payment_v2():
    """Generate V2 payment with new fields"""
    return {
        "payment_id": str(uuid.uuid4()),
        "amount": 99.99,
        "currency": "USD", 
        "customer_id": "CUST-1234",
        "timestamp": int(time.time()),
        "status": "APPROVED",  # New required field
        "fee_amount": 2.50     # New optional field
    }
```

### Step 4: Backward Compatibility Test
1. Keep your V1 consumer running
2. Start your V2 producer
3. **Critical Test**: Does the V1 consumer still work?

### Step 5: Forward Compatibility Test
1. Start V2 consumer (reads new fields)
2. Send messages from V1 producer (no new fields)
3. **Critical Test**: Does the V2 consumer handle missing fields?

### Step 6: Schema Registry Analysis
1. Open Confluent Cloud UI → Schema Registry
2. Find your payment schema
3. Observe multiple versions
4. Check compatibility settings

---

## Discussion Questions (10 min)

1. **When did errors occur?**
   - JSON: Runtime (consumer side)
   - Avro: Compile time (producer side)

2. **What happens to performance?**
   - Binary encoding vs JSON text
   - Schema cached vs sent per message

3. **How do you handle schema evolution?**
   - BACKWARD: New schema reads old data
   - FORWARD: Old schema reads new data  
   - FULL: Both directions work

4. **Real-world scenarios:**
   - How would you deploy a schema change?
   - What if you need to remove a field?
   - How do you handle breaking changes?

---

## Success Criteria
- [ ] Demonstrated JSON failure modes
- [ ] Successfully migrated to Avro
- [ ] Schema validation working at producer
- [ ] Backward compatibility proven
- [ ] Schema versions visible in registry
- [ ] Understanding of evolution strategies

## Next Steps
With reliable schemas in place, let's make our producers production-ready with idempotence and custom partitioning in Module 2!

---

## Common Issues

**"Schema not found"**
→ Check Schema Registry URL and credentials in `.env`

**"Serialization failed"**  
→ Verify data types match schema exactly

**"Consumer can't deserialize"**
→ Ensure consumer has Schema Registry access

**"Schema evolution failed"**
→ Check compatibility rules in Confluent Cloud UI