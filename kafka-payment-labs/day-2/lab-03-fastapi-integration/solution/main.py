#!/usr/bin/env python3
"""
FastAPI + Kafka Integration Solution - Lab 03
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from contextlib import asynccontextmanager
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer
# Note: Using prefixed configuration instead of separate SchemaRegistryClient
from datetime import datetime
import json
import uuid
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PaymentRequest(BaseModel):
    """Payment request model matching Avro schema"""
    amount: float = Field(..., gt=0, description="Payment amount")
    currency: str = Field(..., pattern="^(USD|EUR|GBP)$", description="Currency code")
    customer_id: str = Field(..., pattern="^CUST-\d{4}$", description="Customer ID")
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        # Ensure 2 decimal places for money
        return round(v, 2)

class PaymentResponse(BaseModel):
    """Payment submission response"""
    payment_id: str
    status: str
    message: str
    timestamp: Optional[datetime] = None

def load_avro_schema(schema_path: str):
    """Load Avro schema from file"""
    with open(schema_path, 'r') as f:
        return avro.loads(json.dumps(json.load(f)))

def create_producer(schema):
    """Create Avro producer with delivery callback"""
    # Use the same prefixed configuration approach that works in lab-02
    producer_config = KafkaConfig.create_avro_producer_config()
    
    # Combine configurations with schema.registry. prefix
    config = {
        **producer_config,
        'schema.registry.url': os.getenv('SCHEMA_REGISTRY_URL'),
        'schema.registry.basic.auth.credentials.source': 'USER_INFO',
        'schema.registry.basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}",
        'on_delivery': delivery_callback,
        'queue.buffering.max.messages': 100000,
        'queue.buffering.max.kbytes': 1048576,
        'batch.num.messages': 500,
        'linger.ms': 10
    }
    
    return AvroProducer(config, default_value_schema=schema)

def delivery_callback(err, msg):
    """Callback for message delivery status"""
    if err is not None:
        logger.error(f'Message delivery failed: {err}')
    else:
        logger.info(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage producer lifecycle"""
    # Startup
    logger.info("Starting up Payment Gateway API...")
    
    try:
        # Load schema
        schema = load_avro_schema('../schemas/payment.avsc')
        
        # Create producer
        producer = create_producer(schema)
        app.state.producer = producer
        
        # Test Kafka connectivity
        producer.list_topics(timeout=5)
        logger.info("Successfully connected to Kafka")
        
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if hasattr(app.state, 'producer'):
        outstanding = app.state.producer.flush(timeout=10)
        if outstanding > 0:
            logger.warning(f"{outstanding} messages were not delivered")
        logger.info("Producer closed")

# Create FastAPI app
app = FastAPI(
    title="Payment Gateway API",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if not hasattr(app.state, 'producer'):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Producer not initialized"
        )
    
    # Try to get topic metadata as health check
    try:
        metadata = app.state.producer.list_topics(timeout=2)
        return {
            "status": "healthy",
            "kafka_connected": True,
            "topics": len(metadata.topics)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Kafka health check failed: {str(e)}"
        )

@app.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_payment(
    payment: PaymentRequest,
    background_tasks: BackgroundTasks,
    sync_mode: bool = False  # Query param to demonstrate sync vs async
):
    """Submit payment to Kafka"""
    if not hasattr(app.state, 'producer'):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    
    # Generate payment ID and timestamp
    payment_id = str(uuid.uuid4())
    timestamp = int(datetime.now().timestamp())
    
    # Create full payment record
    payment_record = {
        'payment_id': payment_id,
        'amount': payment.amount,
        'currency': payment.currency,
        'customer_id': payment.customer_id,
        'timestamp': timestamp
    }
    
    try:
        if sync_mode:
            # Synchronous mode - wait for delivery
            app.state.producer.produce(
                topic='payment_requests',
                value=payment_record
            )
            # This blocks until delivery
            app.state.producer.flush(timeout=5)
            
            return PaymentResponse(
                payment_id=payment_id,
                status="confirmed",
                message="Payment successfully delivered to processing queue",
                timestamp=datetime.fromtimestamp(timestamp)
            )
        else:
            # Asynchronous mode - fire and forget
            app.state.producer.produce(
                topic='payment_requests',
                value=payment_record
            )
            # Trigger delivery callbacks without blocking
            app.state.producer.poll(0)
            
            # Optionally add background task for monitoring
            background_tasks.add_task(monitor_delivery, payment_id)
            
            return PaymentResponse(
                payment_id=payment_id,
                status="accepted",
                message="Payment accepted for processing",
                timestamp=datetime.fromtimestamp(timestamp)
            )
            
    except BufferError:
        # Producer queue is full
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment queue is full, please try again later"
        )
    except Exception as e:
        logger.error(f"Failed to submit payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process payment"
        )

async def monitor_delivery(payment_id: str):
    """Background task to monitor delivery (demonstration)"""
    await asyncio.sleep(0.1)  # Small delay
    # In production, you might update a database or send notifications
    logger.info(f"Background monitoring for payment {payment_id}")

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors"""
    logger.error(f"Unhandled exception: {exc}")
    return {
        "status": "error",
        "message": "An unexpected error occurred",
        "detail": str(exc) if app.debug else None
    }

# Additional endpoints for demonstration

@app.get("/payments/stats")
async def get_stats():
    """Get producer statistics"""
    if not hasattr(app.state, 'producer'):
        raise HTTPException(status_code=503, detail="Producer not initialized")
    
    # Get producer stats (poll for any pending callbacks)
    app.state.producer.poll(0)
    
    return {
        "producer_status": "active",
        "messages_sent": "Check logs for delivery confirmations"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)