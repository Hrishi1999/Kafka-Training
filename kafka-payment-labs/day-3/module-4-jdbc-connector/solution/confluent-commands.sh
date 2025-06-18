#!/bin/bash

# Confluent Cloud commands for Complete Pipeline setup
# Module 4 - JDBC Source and HTTP Sink Connectors

echo "Confluent Cloud Complete Pipeline Setup Commands"
echo "==============================================="

# Set your environment variables
KAFKA_API_KEY="YOUR_KAFKA_API_KEY"
KAFKA_API_SECRET="YOUR_KAFKA_API_SECRET"
CLUSTER_ID="YOUR_CLUSTER_ID"

echo "1. Store and use API key for Kafka cluster"
echo "confluent api-key store $KAFKA_API_KEY \"$KAFKA_API_SECRET\" --resource $CLUSTER_ID"
echo "confluent api-key use $KAFKA_API_KEY --resource $CLUSTER_ID"
echo

echo "2. Create the JDBC source connector"
echo "confluent connect cluster create postgres-source-connector.json"
echo

echo "3. Create the HTTP sink connector"
echo "confluent connect cluster create http-sink-connector.json"
echo

echo "4. Monitor both connectors"
echo "confluent connect cluster list"
echo "confluent connect cluster describe <SOURCE_CONNECTOR_ID>"
echo "confluent connect cluster describe <SINK_CONNECTOR_ID>"
echo

echo "5. Verify topic creation and data flow"
echo "confluent kafka topic list | grep payments"
echo "confluent kafka topic describe payments"
echo

echo "6. Monitor Kafka topic (optional)"
echo "confluent kafka topic consume payments --from-beginning --value-format avro --print-key"
echo

echo "7. Test complete pipeline"
echo "# Add data to PostgreSQL"
echo "docker exec payment-postgres psql -U payment_user -d payments -c \""
echo "INSERT INTO payments (payment_id, amount, merchant_id, customer_id, status)"
echo "VALUES ('pay_test_001', 199.99, 'merchant_test', 'customer_test', 'COMPLETED');\""
echo ""
echo "# Check HTTP endpoint received data"
echo "curl http://localhost:8080/payments/stats"
echo "curl http://localhost:8080/payments/list"
echo

echo "8. Load test data"
echo "docker exec payment-postgres psql -U payment_user -d payments -f /tmp/test-data.sql"
echo

echo "9. Monitor HTTP endpoint"
echo "# Check health"
echo "curl http://localhost:8080/health"
echo ""
echo "# View statistics"
echo "curl http://localhost:8080/payments/stats"
echo ""
echo "# List recent payments"
echo "curl http://localhost:8080/payments/list"
echo

echo "10. Cleanup (when done)"
echo "# Delete connectors"
echo "confluent connect cluster delete <SOURCE_CONNECTOR_ID>"
echo "confluent connect cluster delete <SINK_CONNECTOR_ID>"
echo ""
echo "# Stop local services"
echo "kill \$(cat .http_server.pid)  # Stop HTTP server"
echo "docker stop payment-postgres   # Stop PostgreSQL"
echo

echo "Note: Replace <SOURCE_CONNECTOR_ID> and <SINK_CONNECTOR_ID> with actual IDs"
echo "Note: Update YOUR_* placeholders with actual values"
echo "Note: Ensure ngrok tunnels are running before creating connectors"