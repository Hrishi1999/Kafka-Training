#!/usr/bin/env python3
"""
FastAPI + Kafka Integration - Lab 03
Your task: Build a REST API that produces payments to Kafka
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from contextlib import asynccontextmanager
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer
# Note: Use prefixed configuration instead of separate SchemaRegistryClient
from datetime import datetime
import json
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# TODO: Define Pydantic model for payment request
class PaymentRequest(BaseModel):
    """
    Define fields matching Avro schema:
    - amount: float
    - currency: str  
    - customer_id: str
    Note: payment_id and timestamp will be generated
    """
    pass

# TODO: Define response model
class PaymentResponse(BaseModel):
    """
    Define response fields:
    - payment_id: str
    - status: str
    - message: str
    """
    pass

# TODO: Implement lifespan manager for producer lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialize producer on startup, close on shutdown
    - Load Avro schema
    - Create AvroProducer using explicit SchemaRegistryClient
    - Store in app.state
    - Yield control
    - Flush and close on shutdown
    
    Example pattern:
    producer_config = KafkaConfig.create_avro_producer_config()
    config = {
        **producer_config,
        'schema.registry.url': os.getenv('SCHEMA_REGISTRY_URL'),
        'schema.registry.basic.auth.credentials.source': 'USER_INFO',
        'schema.registry.basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}",
        'on_delivery': delivery_callback
    }
    producer = AvroProducer(config, default_value_schema=schema)
    """
    # Startup
    logger.info("Starting up...")
    
    # Your implementation here
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    
    # Your implementation here

# Create FastAPI app with lifespan
app = FastAPI(
    title="Payment Gateway API",
    version="1.0.0",
    lifespan=lifespan
)

# TODO: Implement health check endpoint
@app.get("/health")
async def health_check():
    """
    Return health status
    - Check if producer is initialized
    - Return status and any relevant info
    """
    pass

# TODO: Implement payment submission endpoint
@app.post("/payments", response_model=PaymentResponse)
async def submit_payment(
    payment: PaymentRequest,
    background_tasks: BackgroundTasks
):
    """
    Submit payment to Kafka
    1. Generate payment_id and timestamp
    2. Create full payment dict
    3. Send to Kafka (decide: sync or async?)
    4. Return appropriate response
    
    Consider:
    - Should this wait for Kafka confirmation?
    - How to handle produce failures?
    - What HTTP status to return?
    """
    pass

# TODO: Implement delivery callback
def delivery_callback(err, msg):
    """
    Callback for async message delivery
    - Log success or failure
    - Could update payment status in DB
    - Could send notifications
    """
    pass

# TODO: Add error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """
    Handle unexpected errors gracefully
    """
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)