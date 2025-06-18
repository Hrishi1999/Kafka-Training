#!/bin/bash

# Docker commands for PostgreSQL setup
# JDBC Connector Lab - Module 10

echo "Setting up PostgreSQL for JDBC Connector Demo..."

# Create and start PostgreSQL container
echo "1. Creating PostgreSQL container..."
docker run --name payment-postgres \
  -e POSTGRES_DB=payments \
  -e POSTGRES_USER=payment_user \
  -e POSTGRES_PASSWORD=payment_pass \
  -p 5432:5432 \
  -d postgres:15

# Wait for PostgreSQL to be ready
echo "2. Waiting for PostgreSQL to be ready..."
sleep 10

# Check if container is healthy
docker exec payment-postgres pg_isready -U payment_user -d payments

# Initialize database with schema and sample data
echo "3. Initializing database schema..."
docker cp init-db.sql payment-postgres:/tmp/init-db.sql
docker exec payment-postgres psql -U payment_user -d payments -f /tmp/init-db.sql

# Verify setup
echo "4. Verifying database setup..."
echo "Table structure:"
docker exec payment-postgres psql -U payment_user -d payments -c "\d payments"

echo -e "\nSample data:"
docker exec payment-postgres psql -U payment_user -d payments -c "SELECT * FROM payments ORDER BY id;"

echo -e "\nPostgreSQL setup complete!"
echo "Database is running on localhost:5432"
echo "Database: payments"
echo "User: payment_user"
echo "Password: payment_pass"

echo -e "\nNext steps:"
echo "1. Start ngrok tunnel: ngrok tcp 5432"
echo "2. Note the ngrok tunnel URL (e.g., tcp://6.tcp.ngrok.io:14185)"
echo "3. Update postgres-source-connector.json with ngrok details"
echo "4. Create the connector in Confluent Cloud"