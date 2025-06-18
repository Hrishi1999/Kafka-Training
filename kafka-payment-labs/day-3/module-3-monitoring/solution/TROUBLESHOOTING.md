# Troubleshooting Grafana Empty Dashboard

If your Grafana dashboard shows no data, follow these debugging steps:

## Step 1: Check Service Health

```bash
# Run the test script
./test_services.sh

# Or check manually:
curl http://localhost:8000/health    # Producer
curl http://localhost:8001/health    # Consumer  
curl http://localhost:9090/-/healthy # Prometheus
```

**Expected:** All services should return 200 OK responses.

## Step 2: Verify Metrics Endpoints

```bash
# Check if metrics are being exposed
curl http://localhost:8000/metrics | head -20  # Producer metrics
curl http://localhost:8001/metrics | head -20  # Consumer metrics
```

**Expected:** You should see Prometheus metrics format with counters, histograms, etc.

## Step 3: Check Prometheus Targets

1. Open Prometheus UI: http://localhost:9090
2. Go to Status → Targets
3. Verify both `payment-producer` and `payment-consumer` targets are UP

**If targets are DOWN:**
- Check docker-compose logs: `docker-compose logs prometheus`
- Verify network connectivity between containers
- Check Prometheus config: `cat monitoring/prometheus/prometheus.yml`

## Step 4: Generate Test Data

The dashboard will be empty until data flows through the system:

```bash
# Send test payment
curl -X POST http://localhost:8000/payments/batch \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: test-$(date +%s)" \
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

# Wait 30 seconds for processing
sleep 30

# Check if metrics updated
curl -s http://localhost:8000/metrics | grep payments_produced_total
curl -s http://localhost:8001/metrics | grep messages_consumed_total
```

## Step 5: Check Grafana Data Source

1. Open Grafana: http://localhost:3000 (admin/admin123)
2. Go to Configuration → Data Sources
3. Click on "Prometheus"
4. Click "Test" button

**Expected:** Should show "Data source is working"

## Step 6: Query Metrics Directly

In Grafana, try these queries in the Explore tab:

```promql
# Basic metrics that should always exist
up
prometheus_build_info

# After sending test data:
payments_produced_total
messages_consumed_total
http_requests_total
```

## Step 7: Check Container Logs

```bash
# Check for errors in service logs
docker-compose logs producer
docker-compose logs consumer
docker-compose logs prometheus
docker-compose logs grafana

# Follow logs in real-time
docker-compose logs -f producer consumer
```

## Common Issues and Solutions

### 1. "No data points" in Grafana

**Cause:** No metrics data has been generated yet.

**Solution:** Send test payments and wait for consumer processing.

### 2. Prometheus targets showing as DOWN

**Cause:** Network connectivity or wrong ports.

**Solution:** 
- Check docker-compose network configuration
- Verify service ports are correctly exposed
- Restart services: `docker-compose restart`

### 3. Consumer not processing messages

**Cause:** Kafka connection issues or topic doesn't exist.

**Solution:**
- Check environment variables in .env file
- Verify Kafka cluster is accessible
- Check if `payment_requests` topic exists in your Kafka cluster

### 4. Grafana shows "Query returned empty" 

**Cause:** Time range or query issues.

**Solution:**
- Check time range (try "Last 5 minutes")
- Use simpler queries first: `up`, `prometheus_build_info`
- Check if metric names match between code and dashboard

### 5. Services fail to start

**Cause:** Environment variables or dependency issues.

**Solution:**
- Check .env file has correct Kafka credentials
- Verify docker images built successfully: `docker-compose build`
- Check resource availability: `docker system df`

## Manual Verification Steps

### 1. Test Producer Manually

```bash
# Test single payment endpoint
curl -X POST http://localhost:8000/payments/single \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "MANUAL-TEST",
    "amount": 150.00,
    "merchant_id": "MERCH-MANUAL",
    "customer_id": "CUST-MANUAL"
  }'
```

### 2. Check Kafka Topic

If you have Kafka CLI tools:

```bash
# List topics (requires Kafka CLI)
confluent kafka topic list

# Consume from topic
confluent kafka topic consume payment_requests --from-beginning
```

### 3. Monitor Real-time Metrics

```bash
# Watch metrics update in real-time
watch -n 2 "curl -s http://localhost:8000/metrics | grep payments_produced_total"
```

## Success Indicators

When everything is working correctly, you should see:

1. ✅ All health checks return 200
2. ✅ Prometheus targets are UP  
3. ✅ Metrics endpoints return data
4. ✅ Test payments return success responses
5. ✅ Consumer logs show message processing
6. ✅ Grafana queries return data points
7. ✅ Dashboard panels show graphs with data

## Need More Help?

If you're still having issues:

1. Check the complete solution in `solution/` directory
2. Compare your implementation with working code
3. Try the simpler "System Overview" dashboard first
4. Enable debug logging in services
5. Use load generator: `docker-compose --profile load-test up -d`

Remember: The dashboard needs actual data flow to show meaningful metrics!