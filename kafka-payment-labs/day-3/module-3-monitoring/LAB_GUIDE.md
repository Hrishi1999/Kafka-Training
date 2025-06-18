# Lab Guide: Kafka Monitoring and Logging

## Overview
In this lab, you'll implement a comprehensive monitoring solution for Kafka-based payment processing, including metrics collection, structured logging, and observability dashboards.

## Learning Objectives
- Implement Prometheus metrics in Kafka applications
- Set up structured logging with correlation IDs
- Create monitoring dashboards with Grafana
- Understand key metrics for Kafka producers and consumers
- Practice troubleshooting with observability tools

## Lab Structure

```
module-3-monitoring/
├── student-start/          # Your implementation
│   ├── producer/           # FastAPI producer service
│   │   └── main.py        # TODO: Implement producer with metrics
│   ├── consumer/           # Kafka consumer service  
│   │   └── main.py        # TODO: Implement consumer with monitoring
│   └── requirements.txt    # Python dependencies
├── solution/               # Complete reference implementation
└── LAB_GUIDE.md           # This file
```

## Part 1: FastAPI Producer with Metrics (45 minutes)

### Task 1.1: Basic FastAPI Setup
Navigate to `student-start/producer/main.py` and implement:

1. **Import required dependencies**
   ```python
   from fastapi import FastAPI, Request, HTTPException
   from pydantic import BaseModel, Field, validator
   from confluent_kafka import Producer
   from prometheus_client import Counter, Histogram, generate_latest
   import structlog
   ```

2. **Configure structured logging**
   ```python
   structlog.configure(
       processors=[
           structlog.stdlib.filter_by_level,
           structlog.contextvars.merge_contextvars,
           structlog.processors.add_log_level,
           structlog.processors.TimeStamper(fmt="iso"),
           structlog.dev.ConsoleRenderer(colors=False)
       ],
       wrapper_class=structlog.stdlib.BoundLogger,
       logger_factory=structlog.stdlib.LoggerFactory(),
       cache_logger_on_first_use=True,
   )
   ```

3. **Create FastAPI app**
   ```python
   app = FastAPI(title="Payment Producer API", version="1.0.0")
   ```

### Task 1.2: Pydantic Models
Define data models with validation:

```python
class PaymentRequest(BaseModel):
    payment_id: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0, le=10000)
    merchant_id: str = Field(..., min_length=1) 
    customer_id: str = Field(..., min_length=1)
    currency: str = Field(default="USD")
    description: Optional[str] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        return round(v, 2)

class BatchPaymentRequest(BaseModel):
    payments: List[PaymentRequest] = Field(..., min_items=1, max_items=500)
    correlation_id: Optional[str] = None
```

### Task 1.3: Prometheus Metrics
Add metrics for monitoring:

```python
PAYMENTS_TOTAL = Counter(
    'payments_produced_total',
    'Total payments produced', 
    ['status', 'batch_size_range']
)

BATCH_SIZE_HISTOGRAM = Histogram(
    'payment_batch_size',
    'Payment batch sizes'
)

PRODUCE_DURATION = Histogram(
    'kafka_produce_duration_seconds',
    'Kafka produce duration'
)
```

### Task 1.4: Kafka Producer
Initialize producer using common config:

```python
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../..'))
from common.config import KafkaConfig

# In startup event or lifespan
base_config = KafkaConfig.create_producer_config()
producer_config = {
    **base_config,
    'linger.ms': 100,
    'batch.size': 16384,
    'compression.type': 'snappy'
}
producer = Producer(producer_config)
```

### Task 1.5: Correlation ID Middleware
Add middleware to track requests:

```python
@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    request.state.correlation_id = correlation_id
    
    response = await call_next(request)
    response.headers["x-correlation-id"] = correlation_id
    return response
```

### Task 1.6: Batch Processing Endpoint
Implement the main business logic:

```python
@app.post("/payments/batch")
async def process_batch_payments(batch_request: BatchPaymentRequest, request: Request):
    start_time = time.time()
    correlation_id = batch_request.correlation_id or request.state.correlation_id
    
    logger.info("Processing payment batch", 
               batch_size=len(batch_request.payments))
    
    results = []
    for payment in batch_request.payments:
        # Create enriched payment record
        payment_record = {
            "payment_id": payment.payment_id,
            "amount": payment.amount,
            # ... other fields
            "correlation_id": correlation_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Produce to Kafka
        producer.produce(
            topic='payment_requests',
            key=payment.payment_id.encode('utf-8'),
            value=json.dumps(payment_record).encode('utf-8'),
            headers={'correlation_id': correlation_id.encode('utf-8')}
        )
        
        # Record metrics
        PAYMENTS_TOTAL.labels(status="success", batch_size_range="medium").inc()
    
    # Flush and return response
    producer.flush(timeout=5)
    processing_time = time.time() - start_time
    
    return {"status": "success", "processing_time_ms": processing_time * 1000}
```

### Task 1.7: Health and Metrics Endpoints
Add monitoring endpoints:

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## Part 2: Kafka Consumer with Monitoring (45 minutes)

Navigate to `student-start/consumer/main.py` and implement:

### Task 2.1: Consumer Metrics
Define comprehensive consumer metrics:

```python
MESSAGES_CONSUMED_TOTAL = Counter(
    'messages_consumed_total',
    'Messages consumed',
    ['topic', 'status']
)

PROCESSING_DURATION = Histogram(
    'message_processing_duration_seconds',
    'Processing duration',
    ['topic', 'status']
)

CONSUMER_LAG = Gauge(
    'consumer_lag_messages',
    'Consumer lag',
    ['topic', 'partition']
)

REBALANCES_TOTAL = Counter(
    'consumer_rebalances_total',
    'Rebalances',
    ['type']
)
```

### Task 2.2: HTTP Metrics Server
Create HTTP server for metrics exposition:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

class MetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/metrics':
            self.send_response(200)
            self.send_header('Content-Type', CONTENT_TYPE_LATEST)
            self.end_headers()
            self.wfile.write(generate_latest())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            health = {"status": "healthy", "timestamp": datetime.now().isoformat()}
            self.wfile.write(json.dumps(health).encode())
```

### Task 2.3: Consumer Setup with Rebalancing
Initialize consumer with callbacks:

```python
def _setup_consumer(self):
    base_config = KafkaConfig.create_consumer_config(
        group_id=self.group_id,
        auto_offset_reset='earliest'
    )
    
    consumer_config = {
        **base_config,
        'enable.auto.commit': True,
        'session.timeout.ms': 30000,
        'heartbeat.interval.ms': 10000
    }
    
    self.consumer = Consumer(consumer_config)
    self.consumer.subscribe(
        ['payment_requests'],
        on_assign=self._on_partition_assign,
        on_revoke=self._on_partition_revoke
    )

def _on_partition_assign(self, consumer, partitions):
    REBALANCES_TOTAL.labels(type='assign').inc()
    logger.info("Partitions assigned", count=len(partitions))

def _on_partition_revoke(self, consumer, partitions):
    REBALANCES_TOTAL.labels(type='revoke').inc()
    logger.info("Partitions revoked", count=len(partitions))
```

### Task 2.4: Consumer Lag Calculation
Monitor how far behind the consumer is:

```python
def _update_consumer_lag(self, message):
    try:
        topic = message.topic()
        partition = message.partition()
        
        # Get high watermark
        watermarks = self.consumer.get_watermark_offsets(
            TopicPartition(topic, partition)
        )
        
        if watermarks:
            low_offset, high_offset = watermarks
            current_offset = message.offset()
            lag = max(0, high_offset - current_offset - 1)
            
            CONSUMER_LAG.labels(topic=topic, partition=str(partition)).set(lag)
    except Exception as e:
        logger.warning("Failed to update lag", error=str(e))
```

### Task 2.5: Message Processing
Implement the core processing logic:

```python
def process_message(self, message):
    start_time = time.time()
    topic = message.topic()
    
    try:
        # Extract correlation ID
        correlation_id = self._extract_correlation_id(message)
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        
        # Parse message
        payment_data = json.loads(message.value().decode('utf-8'))
        
        # Update lag metrics
        self._update_consumer_lag(message)
        
        # Process payment
        success = self.processor.process_payment(payment_data, correlation_id)
        
        # Record metrics
        processing_time = time.time() - start_time
        status = "success" if success else "failed"
        
        MESSAGES_CONSUMED_TOTAL.labels(topic=topic, status=status).inc()
        PROCESSING_DURATION.labels(topic=topic, status=status).observe(processing_time)
        
        logger.info("Message processed",
                   payment_id=payment_data.get('payment_id'),
                   success=success,
                   processing_time_ms=processing_time * 1000)
        
    except Exception as e:
        logger.error("Processing error", error=str(e))
```

### Task 2.6: Main Consumer Loop
Implement the polling loop:

```python
def run(self):
    self.running = True
    logger.info("Starting consumer loop")
    
    try:
        while self.running:
            message = self.consumer.poll(timeout=1.0)
            
            if message is None:
                continue
                
            if message.error():
                if message.error().code() != KafkaError._PARTITION_EOF:
                    logger.error("Kafka error", error=str(message.error()))
            else:
                self.process_message(message)
                
    except KeyboardInterrupt:
        logger.info("Consumer interrupted")
    finally:
        self.shutdown()
```

## Part 3: Testing and Validation (30 minutes)

### Task 3.1: Start Services Locally
Test your implementation:

```bash
# Terminal 1: Start producer
cd student-start/producer
pip install -r ../requirements.txt
python main.py

# Terminal 2: Start consumer  
cd student-start/consumer
python main.py

# Terminal 3: Send test requests
curl -X POST http://localhost:8000/payments/batch \
  -H "Content-Type: application/json" \
  -d '{
    "payments": [
      {
        "payment_id": "TEST-001",
        "amount": 99.99,
        "merchant_id": "MERCH-001", 
        "customer_id": "CUST-001"
      }
    ]
  }'
```

### Task 3.2: Verify Metrics
Check metrics endpoints:

```bash
# Producer metrics
curl http://localhost:8000/metrics | grep payments_produced

# Consumer metrics  
curl http://localhost:8001/metrics | grep messages_consumed

# Health checks
curl http://localhost:8000/health
curl http://localhost:8001/health
```

### Task 3.3: Monitor Logs
Verify structured logging:

- Check correlation IDs flow through both services
- Verify JSON log format
- Check error handling and logging

## Part 4: Docker and Grafana Setup (Optional - 30 minutes)

If time permits, explore the complete solution:

```bash
cd solution/

# Copy environment file
cp .env.example .env
# Edit with your Kafka credentials

# Start full monitoring stack
docker-compose up -d

# View Grafana dashboards
open http://localhost:3000
# Login: admin/admin123
```

## Validation Checklist

✅ **Producer Implementation**
- [ ] FastAPI app with batch endpoint
- [ ] Pydantic models with validation
- [ ] Kafka producer integration
- [ ] Prometheus metrics collection
- [ ] Correlation ID middleware
- [ ] Structured logging
- [ ] Health check endpoint

✅ **Consumer Implementation** 
- [ ] Consumer group setup with rebalancing
- [ ] Message processing with error handling
- [ ] Consumer lag monitoring
- [ ] Processing duration metrics
- [ ] Correlation ID extraction
- [ ] HTTP metrics server
- [ ] Graceful shutdown

✅ **Testing**
- [ ] Services start without errors
- [ ] Messages flow from producer to consumer
- [ ] Metrics are exposed and updating
- [ ] Logs show correlation IDs
- [ ] Health checks respond correctly

## Troubleshooting Tips

**Common Issues:**
1. **Import errors**: Ensure all dependencies are installed
2. **Kafka connection**: Check environment variables and network
3. **Metrics not updating**: Verify endpoints and metric definitions
4. **Correlation IDs missing**: Check header extraction logic
5. **Consumer not processing**: Verify topic subscription and polling

**Debugging:**
- Add print statements for debugging
- Check service logs for errors
- Use `curl` to test endpoints
- Verify Kafka topic exists and has messages

## Next Steps

After completing the lab:
1. Compare your implementation with the solution
2. Explore the Grafana dashboards in the solution
3. Experiment with the load generator
4. Try implementing additional custom metrics
5. Consider performance optimizations

Remember: The goal is to understand observability patterns in distributed systems, not perfect code. Focus on the concepts and ask questions!