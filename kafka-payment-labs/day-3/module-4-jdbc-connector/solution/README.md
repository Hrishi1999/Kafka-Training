# Module 4: Complete Data Pipeline with JDBC Source and HTTP Sink Connectors

## Overview
This lab demonstrates how to build a complete data pipeline using Confluent Cloud connectors:
1. **JDBC PostgreSQL Source Connector** - Streams data from local PostgreSQL to Kafka
2. **HTTP Sink Connector** - Streams data from Kafka to HTTP endpoints

We'll use ngrok to create secure tunnels for both database and HTTP endpoint connectivity.

## Architecture
```
Local PostgreSQL → ngrok tunnel → Confluent Cloud JDBC Connector → Kafka Topic (Avro) → HTTP Sink Connector → HTTP Endpoint
```

## Prerequisites
- Confluent Cloud account and cluster
- Docker installed locally
- ngrok account and CLI
- Confluent CLI configured
- Python 3.8+ (for HTTP endpoint server)
- pip (Python package manager)

## Step 1: Set Up Local PostgreSQL Database

### 1.1 Create PostgreSQL Container
```bash
# Create and start PostgreSQL container
docker run --name payment-postgres \
  -e POSTGRES_DB=payments \
  -e POSTGRES_USER=payment_user \
  -e POSTGRES_PASSWORD=payment_pass \
  -p 5432:5432 \
  -d postgres:15

# Wait for container to be ready
docker exec payment-postgres pg_isready -U payment_user -d payments
```

### 1.2 Initialize Database Schema
Create the database initialization script:

```sql
-- init-db.sql
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    merchant_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON payments(updated_at);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status) VALUES
('pay_001', 99.99, 'merchant_coffee', 'customer_001', 'COMPLETED'),
('pay_002', 249.50, 'merchant_electronics', 'customer_002', 'PENDING'),
('pay_003', 15.75, 'merchant_food', 'customer_003', 'COMPLETED'),
('pay_004', 89.00, 'merchant_clothing', 'customer_004', 'FAILED'),
('pay_005', 199.99, 'merchant_books', 'customer_005', 'COMPLETED');
```

Execute the initialization:
```bash
# Copy SQL file to container and execute
docker cp init-db.sql payment-postgres:/tmp/init-db.sql
docker exec payment-postgres psql -U payment_user -d payments -f /tmp/init-db.sql
```

### 1.3 Verify Database Setup
```bash
# Check table structure
docker exec payment-postgres psql -U payment_user -d payments -c "\d payments"

# View sample data
docker exec payment-postgres psql -U payment_user -d payments -c "SELECT * FROM payments;"
```

## Step 2: Set Up ngrok Tunnel

### 2.1 Install and Configure ngrok
```bash
# Install ngrok (if not already installed)
# Visit https://ngrok.com/download and follow instructions

# Authenticate with your ngrok account
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

### 2.2 Create ngrok Configuration (Optional)
Create `~/.ngrok2/ngrok.yml`:
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN

tunnels:
  postgres:
    addr: 5432
    proto: tcp
  web:
    addr: 3000
    proto: http
```

### 2.3 Start ngrok Tunnel
```bash
# Start TCP tunnel for PostgreSQL
ngrok tcp 5432

# Note the forwarding address (e.g., tcp://6.tcp.ngrok.io:14185)
# Keep this terminal open - ngrok must stay running
```

**Important**: Keep the ngrok terminal open throughout the lab. Note the tunnel URL (e.g., `6.tcp.ngrok.io:14185`) - you'll need this for the connector configuration.

## Step 3: Configure Confluent Cloud Connector

### 3.1 Prepare Connector Configuration
Create `postgres-source-connector.json`:

```json
{
  "name": "postgres-payments-source",
  "config": {
    "connector.class": "PostgresSource",
    "name": "postgres-payments-source",
    "kafka.auth.mode": "KAFKA_API_KEY",
    "kafka.api.key": "YOUR_KAFKA_API_KEY",
    "kafka.api.secret": "YOUR_KAFKA_API_SECRET",
    "connection.host": "6.tcp.ngrok.io",
    "connection.port": "14185",
    "connection.user": "payment_user",
    "connection.password": "payment_pass",
    "db.name": "payments",
    "table.whitelist": "payments",
    "incrementing.column.name": "id",
    "output.data.format": "AVRO",
    "tasks.max": "1"
  }
}
```

**Configuration Notes**:
- Replace `YOUR_KAFKA_API_KEY` and `YOUR_KAFKA_API_SECRET` with your actual credentials
- Update `connection.host` and `connection.port` with your ngrok tunnel details
- `incrementing.column.name`: Uses the `id` column for incremental data loading
- `output.data.format`: Produces Avro-formatted messages
- `table.whitelist`: Only monitors the `payments` table

### 3.2 Create the Connector
```bash
# Use Confluent CLI to create the connector
confluent connect cluster create --config-file postgres-source-connector.json

# Verify connector creation
confluent connect cluster list
```

**Important**: The connector automatically creates the Kafka topic based on the table name. Since we're monitoring the `payments` table, a topic called `payments` will be created automatically when the connector starts successfully.

### 3.3 Monitor Connector Status
```bash
# Check connector status
confluent connect cluster describe <CONNECTOR_ID>

# View connector logs (if needed)
confluent connect cluster describe <CONNECTOR_ID> --show-lag
```

## Step 4: Verify Data Flow

### 4.1 Set Up Kafka API Key for Consumption
```bash
# Store your Kafka API key and secret
confluent api-key store YOUR_KAFKA_API_KEY "YOUR_KAFKA_API_SECRET" --resource YOUR_CLUSTER_ID

# Use the API key
confluent api-key use YOUR_KAFKA_API_KEY --resource YOUR_CLUSTER_ID
```

### 4.2 Check Topic Creation
```bash
# List topics to verify 'payments' topic was created automatically
confluent kafka topic list | grep payments

# Describe the payments topic
confluent kafka topic describe payments
```

**Note**: The `payments` topic is automatically created by the JDBC connector when it starts processing data from the PostgreSQL `payments` table. You don't need to create this topic manually.

### 4.3 Consume Messages
```bash
# Consume messages from the payments topic
confluent kafka topic consume payments --from-beginning --value-format avro --print-key

# You should see the initial data from PostgreSQL
```

### 4.4 Test Real-time Data Streaming
```bash
# Add new data to PostgreSQL
docker exec payment-postgres psql -U payment_user -d payments -c "
INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status) 
VALUES ('pay_456', 299.99, 'merchant_laptop', 'customer_456', 'PENDING'),
       ('pay_789', 49.99, 'merchant_books', 'customer_789', 'COMPLETED');"

# Check for new messages in Kafka (should appear within seconds)
confluent kafka topic consume payments --from-beginning --value-format avro --print-key
```

## Step 5: Set Up HTTP Sink Connector

### 5.1 Deploy HTTP Endpoint Server

```bash
# Run locally
docker run -p 8080:8080 kafka-http-endpoint

# Test the endpoint
curl http://localhost:8080/health
```

**The server provides these endpoints:**
- `POST /payments` - Receives payment data from Kafka
- `GET /payments/list` - Lists received payments  
- `GET /health` - Health check
- `GET /` - Service information

### 5.2 Set Up HTTP Endpoint Access

#### If running locally (Options B or C):
Create an ngrok tunnel to expose your local server:

```bash
# Start HTTP tunnel for the endpoint server
ngrok http 8080

# Note the HTTPS forwarding URL (e.g., https://abc123.ngrok.io)
```

### 5.3 Configure HTTP Sink Connector
Create `http-sink-connector.json`:

```json
{
  "name": "http-payments-sink",
  "config": {
    "connector.class": "HttpSink",
    "name": "http-payments-sink",
    "kafka.auth.mode": "KAFKA_API_KEY",
   "kafka.api.key": "",
    "kafka.api.secret": "",
    "topics": "payments",
    "http.api.url": "https://test.com/payments",
    "request.method": "POST",
    "headers": "Content-Type:application/json",
    "batch.max.size": "10",
    "batch.prefix": "[",
    "batch.suffix": "]",
    "batch.separator": ",",
    "retry.backoff.ms": "3000",
    "max.retries": "3",
    "tasks.max": "1"
  }
}
```

**Configuration Notes**:
- Replace `YOUR_HTTP_ENDPOINT_URL` with:
  - **Cloud deployment**: Your cloud platform URL + `/payments`
  - **Local with ngrok**: Your ngrok HTTPS URL + `/payments`
- `batch.max.size`: Sends up to 10 records per HTTP request
- `batch.prefix/suffix/separator`: Formats multiple records as JSON array
- Built-in retry logic for failed HTTP requests

### 5.4 Create HTTP Sink Connector
```bash
# Create the HTTP sink connector
confluent connect cluster create --config-file http-sink-connector.json

# Verify both connectors are running
confluent connect cluster list
```

### 5.5 Test Complete Pipeline
```bash
# Add new payment to PostgreSQL
docker exec payment-postgres psql -U payment_user -d payments -c "
INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status) 
VALUES ('pay_pipeline_test', 299.99, 'merchant_test', 'customer_test', 'COMPLETED');"

# Check HTTP endpoint received the data
# For cloud deployment:
curl https://your-cloud-url/payments/list
curl https://your-cloud-url/health

# For local deployment:
curl http://localhost:8080/payments/list
curl http://localhost:8080/health
```

## Step 6: Monitor Complete Pipeline

### 6.1 Check Data Flow
1. **PostgreSQL → Kafka**: Check source connector status
2. **Kafka → HTTP**: Check sink connector status
3. **HTTP Endpoint**: Monitor received payments

```bash
# Monitor source connector
confluent connect cluster describe <SOURCE_CONNECTOR_ID>

# Monitor sink connector
confluent connect cluster describe <SINK_CONNECTOR_ID>

# Check HTTP endpoint (adjust URL based on deployment)
curl https://your-cloud-url/health  # For cloud deployment
curl http://localhost:8080/health   # For local deployment
```

### 6.2 Real-time Pipeline Testing
```bash
# Add multiple test payments
docker exec payment-postgres psql -U payment_user -d payments -f /tmp/test-data.sql

# Monitor HTTP endpoint for incoming data
# For cloud deployment:
curl https://your-cloud-url/payments/list

# For local deployment:
curl http://localhost:8080/payments/list
```

## Step 7: Monitoring and Troubleshooting

### 7.1 Monitor ngrok Traffic
```bash
# Check ngrok web interface at http://localhost:4040
# Shows all incoming connections and requests
```

### 7.2 Check PostgreSQL Connections
```bash
# View active connections to PostgreSQL
docker exec payment-postgres psql -U payment_user -d payments -c "
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE datname = 'payments';"
```

### 7.3 Connector Troubleshooting
```bash
# Check connector logs for errors
confluent connect cluster describe <CONNECTOR_ID>

# Common issues:
# 1. ngrok tunnel expired - restart ngrok
# 2. PostgreSQL connection issues - verify credentials
# 3. Network connectivity - check firewall settings
# 4. API key permissions - verify cluster access
```

### 7.4 HTTP Endpoint Monitoring
```bash
# Check HTTP server logs
# Server outputs detailed logs showing received payments

# Check ngrok HTTP tunnel traffic
# Visit http://localhost:4041 for HTTP tunnel inspection

# Test HTTP endpoint directly
curl -X POST http://localhost:8080/payments \
  -H "Content-Type: application/json" \
  -d '[{"payment_id":"test_001","amount":100.00,"status":"COMPLETED"}]'
```

## Step 8: Advanced Configuration Options

### 8.1 Custom Topic Configuration
To customize the topic name, add to connector config:
```json
{
  "topic.prefix": "postgres-",
  "transforms": "route",
  "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
  "transforms.route.regex": "([^.]+)\\.([^.]+)\\.([^.]+)",
  "transforms.route.replacement": "custom-$3"
}
```

### 8.2 Schema Evolution Handling
```json
{
  "key.converter": "org.apache.kafka.connect.storage.StringConverter",
  "value.converter": "io.confluent.connect.avro.AvroConverter",
  "value.converter.enhanced.avro.schema.support": "true",
  "value.converter.connect.meta.data": "false"
}
```

### 8.3 HTTP Sink Performance Tuning
```json
{
  "batch.max.size": "50",
  "batch.timeout.ms": "5000",
  "retry.backoff.ms": "1000",
  "max.retries": "5",
  "request.timeout.ms": "30000",
  "connection.timeout.ms": "10000"
}
```

### 8.4 JDBC Source Performance Tuning
```json
{
  "poll.interval.ms": "5000",
  "batch.max.rows": "500",
  "connection.timeout.ms": "30000",
  "tasks.max": "1"
}
```

## Security Best Practices

1. **Credentials Management**:
   - Never commit API keys or passwords to version control
   - Use environment variables or secure vaults
   - Rotate credentials regularly

2. **Network Security**:
   - ngrok provides HTTPS/TLS encryption
   - Use ngrok auth for additional security
   - Consider VPN alternatives for production

3. **Database Security**:
   - Use dedicated database user with minimal permissions
   - Enable PostgreSQL SSL if needed
   - Monitor database access logs

## Production Considerations

1. **High Availability**:
   - Use managed database services (RDS, CloudSQL)
   - Set up VPC peering instead of ngrok
   - Configure multiple connector tasks for parallelism

2. **Monitoring**:
   - Set up alerts for connector failures
   - Monitor lag and throughput metrics
   - Track database connection pool usage

3. **Data Management**:
   - Implement proper backup strategies
   - Plan for schema evolution
   - Consider data retention policies

## Cleanup

### Stop and Remove Resources
```bash
# Delete both connectors
confluent connect cluster delete <SOURCE_CONNECTOR_ID>
confluent connect cluster delete <SINK_CONNECTOR_ID>

# Stop HTTP endpoint server (Ctrl+C)

# Stop both ngrok tunnels (Ctrl+C in both terminals)

# Stop and remove PostgreSQL container
docker stop payment-postgres
docker rm payment-postgres

# Remove Docker image (optional)
docker rmi postgres:15
```

## Troubleshooting Common Issues

### Issue 1: Connector fails to start
**Symptoms**: Connector status shows FAILED
**Solutions**:
- Check ngrok tunnel is active
- Verify PostgreSQL credentials
- Ensure database is accessible from outside Docker

### Issue 2: No messages in Kafka topic
**Symptoms**: Topic exists but no messages
**Solutions**:
- Verify data exists in PostgreSQL table
- Check incrementing column has values
- Ensure connector has proper permissions

### Issue 3: ngrok authentication failed
**Symptoms**: "authentication failed" error
**Solutions**:
- Kill existing ngrok sessions: `pkill ngrok`
- Re-authenticate: `ngrok config add-authtoken YOUR_TOKEN`
- Start fresh tunnel

### Issue 4: Schema Registry errors
**Symptoms**: "Schema not found" errors
**Solutions**:
- Verify Schema Registry credentials
- Check Schema Registry URL
- Ensure AVRO format is properly configured

### Issue 5: HTTP Sink Connector failures
**Symptoms**: Sink connector shows FAILED status
**Solutions**:
- Check HTTP endpoint is accessible
- Verify ngrok HTTP tunnel is active
- Check HTTP server logs for errors
- Validate JSON format in connector config

### Issue 6: No data reaching HTTP endpoint
**Symptoms**: HTTP server not receiving data
**Solutions**:
- Verify sink connector is consuming from correct topic
- Check HTTP endpoint URL in connector config
- Ensure HTTP server is listening on correct port
- Test HTTP endpoint manually with curl

## Key Learning Points

1. **End-to-End Data Pipeline**: Complete data flow from database to HTTP endpoints
2. **JDBC Source Connectors**: Real-time database streaming with incremental loading
3. **HTTP Sink Connectors**: Flexible data egress to REST APIs and webhooks
4. **Schema Evolution**: Avro provides robust schema management across the pipeline
5. **Network Tunneling**: ngrok enables secure local-to-cloud connectivity
6. **Batching and Error Handling**: Built-in retry logic and batch processing
7. **Monitoring**: Essential for production pipeline health

## Next Steps

- Explore other source connectors (MongoDB, MySQL, Salesforce, etc.)
- Implement other sink connectors (S3, Elasticsearch, Snowflake, etc.)
- Set up connector monitoring and alerting with Prometheus/Grafana
- Practice schema evolution scenarios with backward/forward compatibility
- Implement data transformations with Single Message Transforms (SMTs)
- Investigate CDC (Change Data Capture) options like Debezium
- Build event-driven architectures with multiple HTTP endpoints
- Implement data validation and enrichment in the pipeline