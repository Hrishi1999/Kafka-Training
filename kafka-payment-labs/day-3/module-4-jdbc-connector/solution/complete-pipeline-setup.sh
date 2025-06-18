#!/bin/bash

# Complete Pipeline Setup Script
# Module 4 - JDBC Source and HTTP Sink Connectors

set -e  # Exit on any error

echo "🚀 Setting up Complete Data Pipeline"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_CONTAINER="payment-postgres"
HTTP_SERVER_PORT=8080
DB_NAME="payments"
DB_USER="payment_user"
DB_PASS="payment_pass"

echo -e "${BLUE}Step 1: Setting up PostgreSQL Database${NC}"
echo "----------------------------------------"

# Check if container already exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
    echo -e "${YELLOW}PostgreSQL container already exists. Stopping and removing...${NC}"
    docker stop $POSTGRES_CONTAINER || true
    docker rm $POSTGRES_CONTAINER || true
fi

# Create and start PostgreSQL container
echo "Creating PostgreSQL container..."
docker run --name $POSTGRES_CONTAINER \
  -e POSTGRES_DB=$DB_NAME \
  -e POSTGRES_USER=$DB_USER \
  -e POSTGRES_PASSWORD=$DB_PASS \
  -p 5432:5432 \
  -d postgres:15

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Test connection
until docker exec $POSTGRES_CONTAINER pg_isready -U $DB_USER -d $DB_NAME; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Initialize database schema
echo "Initializing database schema..."
docker cp init-db.sql $POSTGRES_CONTAINER:/tmp/init-db.sql
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/init-db.sql

echo -e "${GREEN}✓ Database schema initialized${NC}"

echo -e "\n${BLUE}Step 2: Installing Python Dependencies${NC}"
echo "--------------------------------------"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is required but not installed${NC}"
    exit 1
fi

# Install dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

echo -e "${GREEN}✓ Python dependencies installed${NC}"

echo -e "\n${BLUE}Step 3: Starting HTTP Endpoint Server${NC}"
echo "------------------------------------"

# Check if port is already in use
if lsof -Pi :$HTTP_SERVER_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}Port $HTTP_SERVER_PORT is already in use. Killing existing process...${NC}"
    kill $(lsof -t -i:$HTTP_SERVER_PORT) || true
    sleep 2
fi

# Start HTTP server in background
echo "Starting HTTP endpoint server on port $HTTP_SERVER_PORT..."
python3 http-endpoint-server.py &
HTTP_SERVER_PID=$!

# Wait for server to start
sleep 3

# Test HTTP server
if curl -s http://localhost:$HTTP_SERVER_PORT/health > /dev/null; then
    echo -e "${GREEN}✓ HTTP endpoint server is running (PID: $HTTP_SERVER_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start HTTP endpoint server${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 4: ngrok Tunnel Setup Instructions${NC}"
echo "---------------------------------------"

echo -e "${YELLOW}Manual steps required:${NC}"
echo ""
echo "1. Start PostgreSQL tunnel (Terminal 1):"
echo "   ngrok tcp 5432"
echo ""
echo "2. Start HTTP tunnel (Terminal 2):"
echo "   ngrok http $HTTP_SERVER_PORT"
echo ""
echo "3. Note the tunnel URLs:"
echo "   - PostgreSQL: tcp://X.tcp.ngrok.io:XXXXX"
echo "   - HTTP: https://XXXXXXXX.ngrok.io"
echo ""

echo -e "\n${BLUE}Step 5: Connector Configuration${NC}"
echo "--------------------------------"

echo "4. Update connector configurations:"
echo "   a) Edit postgres-source-connector.json:"
echo "      - Update connection.host and connection.port with PostgreSQL ngrok details"
echo "      - Update kafka.api.key and kafka.api.secret"
echo ""
echo "   b) Edit http-sink-connector.json:"
echo "      - Update http.api.url with HTTP ngrok URL + '/payments'"
echo "      - Update kafka.api.key and kafka.api.secret"
echo ""

echo "5. Create connectors:"
echo "   confluent connect cluster create postgres-source-connector.json"
echo "   confluent connect cluster create http-sink-connector.json"
echo ""

echo -e "\n${BLUE}Step 6: Testing the Pipeline${NC}"
echo "----------------------------"

echo "6. Test the complete pipeline:"
echo "   # Add test data to PostgreSQL"
echo "   docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/test-data.sql"
echo ""
echo "   # Check HTTP endpoint received data"
echo "   curl http://localhost:$HTTP_SERVER_PORT/payments/stats"
echo "   curl http://localhost:$HTTP_SERVER_PORT/payments/list"
echo ""

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo "=================="

echo -e "\nServices running:"
echo "• PostgreSQL: localhost:5432 (container: $POSTGRES_CONTAINER)"
echo "• HTTP Server: http://localhost:$HTTP_SERVER_PORT (PID: $HTTP_SERVER_PID)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up ngrok tunnels as described above"
echo "2. Update connector configurations"
echo "3. Create connectors in Confluent Cloud"
echo "4. Test the pipeline"
echo ""

echo -e "\n${BLUE}Useful URLs:${NC}"
echo "• HTTP Health Check: http://localhost:$HTTP_SERVER_PORT/health"
echo "• HTTP Stats: http://localhost:$HTTP_SERVER_PORT/payments/stats"
echo "• PostgreSQL Test: docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -c 'SELECT COUNT(*) FROM payments;'"
echo ""

echo -e "${YELLOW}To stop services:${NC}"
echo "• HTTP Server: kill $HTTP_SERVER_PID"
echo "• PostgreSQL: docker stop $POSTGRES_CONTAINER"
echo "• ngrok tunnels: Ctrl+C in respective terminals"

# Save PID for cleanup
echo $HTTP_SERVER_PID > .http_server.pid
echo "HTTP server PID saved to .http_server.pid"