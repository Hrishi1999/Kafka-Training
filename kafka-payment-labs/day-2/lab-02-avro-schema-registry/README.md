# Lab 02: Avro & Schema Registry - Enforcing Contracts

## Learning Objectives
- Define schemas using Avro
- Use Schema Registry for centralized schema management
- Implement schema-aware producers and consumers
- Experience schema evolution and compatibility

## Prerequisites
- Completed Lab 01
- Understanding of why we need schema management
- Schema Registry running at http://localhost:8081

## Your Task

### Step 1: Define the Payment Schema
Create `schemas/payment.avsc` with:
1. Required fields matching Lab 01:
   - payment_id (string)
   - amount (double)
   - currency (string)
   - customer_id (string)
   - timestamp (long)
2. Add a namespace and proper naming

### Step 2: Implement Avro Producer
Complete `producer.py` in `student-start/`:
1. Configure connection to Schema Registry
2. Load the Avro schema from file
3. Use AvroProducer to send messages
4. Topic name: `payments-avro`
5. Send the same test payments as Lab 01

### Step 3: Implement Avro Consumer
Complete `consumer.py` in `student-start/`:
1. Configure Schema Registry connection
2. Use AvroConsumer to receive messages
3. Messages are automatically deserialized to dicts
4. Print payment details

### Step 4: Test Schema Enforcement
Try these experiments:
1. **Invalid data type**: Try sending amount as string
2. **Missing field**: Try sending without customer_id
3. **Extra field**: Add a field not in schema
4. Observe how Avro prevents bad data at producer level!

### Step 5: Schema Evolution (Advanced)
1. Create `schemas/payment_v2.avsc` with:
   - All original fields
   - New field: `status` (string) with default "PENDING"
2. Update only the producer to use v2
3. Run the old consumer - does it still work?
4. This demonstrates backward compatibility!

### Questions to Consider
1. When do schema violations get caught - runtime or before?
2. What happens if Schema Registry is down?
3. How does this compare to your JSON experience?
4. Why is backward compatibility important?

### Success Criteria
- [ ] Producer validates data against schema
- [ ] Consumer automatically deserializes messages
- [ ] Schema violations are caught at produce time
- [ ] You successfully evolved the schema
- [ ] Old consumers work with new producer

## Hints
- Use `confluent_kafka.avro` instead of plain `confluent_kafka`
- Schema Registry URL goes in producer/consumer config
- Load `.avsc` files with `json.load()`
- For evolution, research Avro default values

## Common Issues
- If imports fail: `pip install confluent-kafka[avro]`
- Check Schema Registry is running: `curl http://localhost:8081/subjects`
- Schema IDs are managed automatically

## Next Step
Now that we have reliable data contracts, let's build a real-world REST API that produces to Kafka!