# Module 3: Kafka Monitoring and Logging

This module demonstrates comprehensive monitoring and logging for Kafka-based payment processing systems using Prometheus, Grafana, and structured logging.

## Architecture Overview

The module includes the following components:

### Core Services
- **FastAPI Producer**: REST API for batch payment processing with Prometheus metrics
- **Kafka Consumer**: Payment processor with comprehensive monitoring and structured logging
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Metrics visualization and dashboards

### Key Features
- 📊 **Comprehensive Metrics**: Producer and consumer metrics with custom business metrics
- 🔍 **Structured Logging**: JSON logging with correlation IDs for request tracing
- 📈 **Real-time Dashboards**: Pre-configured Grafana dashboards for payment processing
- 🚨 **Alerting**: Prometheus alerts for error rates, latency, and system health
- 🐳 **Containerized**: Full Docker Compose setup for easy deployment
- 🔄 **Load Testing**: Built-in load generator for testing and demonstration

## Learning Objectives

By completing this module, you will understand:

1. **Metrics Collection**: How to instrument Kafka producers and consumers with Prometheus metrics
2. **Observability**: Best practices for logging and monitoring in distributed systems
3. **Alerting**: Setting up meaningful alerts for production systems
4. **Performance Monitoring**: Tracking key performance indicators (KPIs) for Kafka applications
5. **Correlation Tracing**: Following requests through distributed systems using correlation IDs

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Access to a Kafka cluster (Confluent Cloud or local)
- Basic understanding of Kafka concepts

### Setup Instructions

1. **Clone and Navigate**
   ```bash
   cd kafka-payment-labs/day-3/module-3-monitoring/solution
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Kafka cluster details
   nano .env
   ```

3. **Start the Stack**
   ```bash
   # Start core services
   docker-compose up -d
   
   # Optional: Start with load generator for testing
   docker-compose --profile load-test up -d
   ```

4. **Access the Services**
   - **Producer API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Consumer Metrics**: http://localhost:8001/metrics
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3000 (admin/admin123)

### Verification

1. **Check Service Health**
   ```bash
   # Producer health
   curl http://localhost:8000/health
   
   # Consumer health
   curl http://localhost:8001/health
   
   # Prometheus targets
   curl http://localhost:9090/api/v1/targets
   ```

2. **Send Test Payments**
   ```bash
   curl -X POST http://localhost:8000/payments/batch \
     -H "Content-Type: application/json" \
     -H "X-Correlation-ID: test-$(date +%s)" \
     -d '{
       "payments": [
         {
           "payment_id": "TEST-001",
           "amount": 99.99,
           "merchant_id": "MERCH-001",
           "customer_id": "CUST-001",
           "description": "Test payment"
         }
       ]
     }'
   ```

3. **View Metrics in Grafana**
   - Navigate to http://localhost:3000
   - Login with admin/admin123
   - Open "Payment Processing Overview" dashboard

## Monitoring Stack Details

### Producer Metrics
- **Request Rate**: HTTP requests per second by endpoint and status
- **Response Time**: Request processing latency percentiles
- **Batch Size**: Distribution of payment batch sizes
- **Kafka Producer**: Message production rate, delivery success/failure

### Consumer Metrics
- **Processing Rate**: Messages consumed per second by status
- **Processing Latency**: Message processing time percentiles
- **Consumer Lag**: Number of messages behind the latest offset
- **End-to-End Latency**: Time from message creation to processing completion
- **Rebalances**: Consumer group rebalancing events

### Business Metrics
- **Payment Volume**: Total payment amounts processed
- **Error Rates**: Failed payment processing rates
- **Throughput**: Payments processed per minute/hour

### Alerts
Pre-configured alerts for:
- High error rates (>5% for API, >10% for processing)
- High consumer lag (>1000 messages)
- Service downtime
- High processing latency (>2 seconds for 95th percentile)
- Frequent consumer rebalances

## API Endpoints

### Producer API (Port 8000)

#### Batch Processing
```http
POST /payments/batch
Content-Type: application/json
X-Correlation-ID: optional-correlation-id

{
  "payments": [
    {
      "payment_id": "string",
      "amount": 99.99,
      "merchant_id": "string",
      "customer_id": "string",
      "currency": "USD",
      "description": "optional"
    }
  ],
  "correlation_id": "optional"
}
```

#### Single Payment
```http
POST /payments/single
Content-Type: application/json

{
  "payment_id": "string",
  "amount": 99.99,
  "merchant_id": "string",
  "customer_id": "string",
  "currency": "USD",
  "description": "optional"
}
```

#### Monitoring Endpoints
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /stats` - Producer statistics

## Structured Logging

All services use structured JSON logging with the following fields:

```json
{
  "timestamp": "2023-12-07T10:30:00.123Z",
  "level": "INFO",
  "logger": "payment_producer",
  "correlation_id": "req-123e4567-e89b-12d3-a456-426614174000",
  "message": "Payment message produced",
  "payment_id": "PAY-001",
  "amount": 99.99,
  "duration_ms": 45.2
}
```

### Log Destinations
Logs are written to both:
- **Console/STDOUT**: For `docker-compose logs` viewing
- **Rotating Log Files**: Persistent storage in `./logs/` directory
  - `logs/producer.log` - Producer service logs
  - `logs/consumer.log` - Consumer service logs
  - **Rotation**: 10MB max size, 5 backup files retained

### Viewing Logs
```bash
# View real-time logs from all services
./view_logs.sh

# View specific service logs
./view_logs.sh producer
./view_logs.sh consumer

# Search logs
./view_logs.sh search "payment_id"

# Show recent errors
./view_logs.sh errors

# Show log file statistics
./view_logs.sh size

# View via Docker (console output)
docker-compose logs -f producer consumer
```

### Correlation ID Flow
1. API request includes `X-Correlation-ID` header (or generates one)
2. Correlation ID is added to Kafka message headers
3. Consumer extracts correlation ID and includes in all log entries
4. Full request trace can be followed through logs

## Troubleshooting

### Common Issues

1. **Services Won't Start**
   ```bash
   # Check logs
   docker-compose logs producer
   docker-compose logs consumer
   
   # Verify environment variables
   docker-compose config
   ```

2. **Kafka Connection Issues**
   - Verify `.env` file has correct Kafka cluster details
   - Check network connectivity to Kafka cluster
   - Validate SASL credentials

3. **No Metrics in Grafana**
   - Check Prometheus targets: http://localhost:9090/targets
   - Verify services are exposing metrics on correct ports
   - Check Grafana data source configuration

4. **Consumer Lag Issues**
   - Check consumer logs for processing errors
   - Monitor consumer group status in Kafka
   - Verify topic partition count and consumer scaling

### Performance Tuning

1. **Producer Optimization**
   ```python
   # In producer config
   'linger.ms': 100,           # Batch messages for throughput
   'batch.size': 16384,        # 16KB batches
   'compression.type': 'snappy', # Compress for efficiency
   'acks': 'all'               # Durability guarantee
   ```

2. **Consumer Optimization**
   ```python
   # In consumer config
   'fetch.min.bytes': 1024,     # Minimum fetch size
   'fetch.max.wait.ms': 500,    # Maximum wait time
   'max.partition.fetch.bytes': 1048576,  # 1MB per partition
   ```

## Advanced Features

### Custom Metrics
Add application-specific metrics:

```python
# Producer example
CUSTOM_METRIC = Counter('custom_payments_total', 'Custom payment counter', ['merchant_type'])
CUSTOM_METRIC.labels(merchant_type='premium').inc()

# Consumer example
PROCESSING_HISTOGRAM = Histogram('payment_amount_processed', 'Payment amounts', buckets=[10, 50, 100, 500, 1000])
PROCESSING_HISTOGRAM.observe(payment_amount)
```

### Log Aggregation
For production deployment, consider:
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Grafana Loki**: Lightweight log aggregation
- **Fluentd/Fluent Bit**: Log forwarding and processing

### Scaling Considerations
- Use consumer groups for horizontal scaling
- Monitor partition count vs. consumer instances
- Consider separate metrics collection for high-throughput scenarios
- Implement circuit breakers for external service calls

## Next Steps

After completing this module:
1. Explore custom dashboard creation in Grafana
2. Implement custom alerts based on business metrics
3. Practice troubleshooting using the monitoring stack
4. Experiment with different load patterns using the load generator
5. Consider implementing distributed tracing (Jaeger/Zipkin) for deeper observability