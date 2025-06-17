# Lab 01: JSON Baseline - Understanding the Problem

## Learning Objectives
- Implement a basic producer/consumer using JSON serialization
- Understand the limitations of unstructured data
- Experience schema-related failures firsthand
- Appreciate why we need schema management

## Your Task

### Step 1: Create a JSON Producer
Complete the `producer.py` file in `student-start/` to:
1. Connect to Confluent Cloud using config from `.env` file
2. Create payment messages as Python dictionaries with fields:
   - `payment_id`: unique identifier (string)
   - `amount`: payment amount (float)
   - `currency`: currency code (string)
   - `customer_id`: customer identifier (string)
   - `timestamp`: Unix timestamp (int)
3. Serialize to JSON and produce to topic `payments-json`
4. Send at least 5 different payment messages

### Step 2: Create a JSON Consumer
Complete the `consumer.py` file in `student-start/` to:
1. Connect to Confluent Cloud and subscribe to `payments-json`
2. Deserialize JSON messages
3. Print payment details in a readable format
4. Handle potential JSON parsing errors gracefully

### Step 3: Break Things (Intentionally!)
After your basic implementation works:
1. Modify the producer to send a malformed message:
   - Change `amount` to a string instead of float
   - Misspell a field name (e.g., `curency` instead of `currency`)
   - Add an unexpected field
   - Remove a required field
2. Run your consumer and observe what happens
3. Document the failures you encounter

### Questions to Consider
1. What happens when the producer changes the data structure?
2. How would you handle version changes in production?
3. What if multiple producers send different formats?
4. How do you ensure all consumers can handle the data?

### Success Criteria
- [ ] Producer successfully sends JSON messages
- [ ] Consumer successfully receives and parses messages
- [ ] You've experienced at least 2 different failure scenarios
- [ ] You understand why "schema-on-read" is problematic

## Hints
- Use `json.dumps()` for serialization and `json.loads()` for deserialization
- Use `producer.produce()` method to send messages
- Always handle exceptions when parsing JSON
- Use `get_kafka_config()` for Confluent Cloud connection
- Call `producer.poll(0)` after produce to trigger delivery callbacks
- Use `consumer.poll(1.0)` to receive messages with timeout

## Next Step
Once you've experienced the pain of unstructured data, proceed to Lab 02 where we'll solve these problems with Avro and Schema Registry!