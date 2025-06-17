# Lab 03: FastAPI Integration - Real-World REST API

## Learning Objectives
- Build a production-grade REST API that produces to Kafka
- Manage producer lifecycle properly
- Handle async vs sync trade-offs
- Implement proper error handling and responses

## Prerequisites
- Completed Lab 02 (Avro schemas)
- Basic understanding of REST APIs
- FastAPI knowledge helpful but not required

## Your Task

### Step 1: Create the FastAPI Application
In `student-start/main.py`:
1. Set up basic FastAPI app
2. Create a Pydantic model matching the Avro schema
3. Implement health check endpoint

### Step 2: Producer Lifecycle Management
**Critical**: Don't create a producer per request!
1. Use FastAPI lifespan events (or startup/shutdown)
2. Initialize AvroProducer once at startup
3. Store as app state
4. Flush and close on shutdown

### Step 3: Payment Submission Endpoint
Create `POST /payments`:
1. Accept Pydantic model in request body
2. Convert to dict for Avro producer
3. Send to Kafka using the shared producer
4. Return appropriate HTTP response

### Step 4: Delivery Guarantees
Experiment with these approaches:
1. **Fire-and-forget**: Return 202 immediately
2. **Synchronous**: Wait for delivery confirmation
3. **Callback-based**: Log success/failure asynchronously

### Step 5: Error Handling
Handle these scenarios:
1. Schema validation failures
2. Kafka connection issues
3. Producer buffer full
4. Invalid payment data

### Testing Your API
```bash
# Health check
curl http://localhost:8000/health

# Submit payment
curl -X POST http://localhost:8000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "currency": "USD",
    "customer_id": "CUST-1234"
  }'
```

### Questions to Consider
1. What happens if Kafka is down when API starts?
2. Should payment submission wait for Kafka confirmation?
3. How would you handle producer buffer full?
4. What's the trade-off between latency and reliability?

### Success Criteria
- [ ] API starts and initializes producer once
- [ ] Payments are validated by Pydantic
- [ ] Successful payments reach Kafka with Avro
- [ ] Errors return appropriate HTTP status codes
- [ ] Producer is properly closed on shutdown

## Hints
- Use `app.state` to store the producer
- Research `@asynccontextmanager` for lifespan
- Pydantic model fields should match Avro schema
- Consider using `BackgroundTasks` for async delivery

## Advanced Challenges
1. Add request ID tracking through Kafka
2. Implement rate limiting
3. Add metrics/monitoring
4. Batch multiple payments

## Next Step
We're producing all payments round-robin. Let's learn to control partitioning for better data locality!