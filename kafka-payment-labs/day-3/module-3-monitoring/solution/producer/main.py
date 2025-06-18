#!/usr/bin/env python3
"""
Payment Producer API - Monitored FastAPI Service

This service provides REST endpoints for batch payment processing with comprehensive
monitoring, structured logging, and Prometheus metrics integration.

Features:
- Batch payment processing via REST API
- Prometheus metrics exposition
- Structured JSON logging with correlation IDs
- Kafka producer with optimized configuration
- Health checks and graceful shutdown
"""

import os
import sys
import json
import uuid
import time
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field, validator
from confluent_kafka import Producer, KafkaException
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from prometheus_fastapi_instrumentator import Instrumentator
import uvicorn

# Add common config path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../..'))
from common.config import KafkaConfig

# Configure structured logging
import logging
import logging.handlers

# Create logs directory if it doesn't exist
os.makedirs('/app/logs', exist_ok=True)

# Set up rotating file handler
file_handler = logging.handlers.RotatingFileHandler(
    '/app/logs/producer.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
file_handler.setLevel(logging.INFO)

# Set up console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()  # JSON for both file and console
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# Configure root logger to use both handlers
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

logger = structlog.get_logger("payment_producer")

# Prometheus metrics
PAYMENTS_TOTAL = Counter(
    'payments_produced_total', 
    'Total number of payment messages produced',
    ['status', 'batch_size_range']
)

BATCH_SIZE_HISTOGRAM = Histogram(
    'payment_batch_size',
    'Distribution of payment batch sizes',
    buckets=[1, 5, 10, 25, 50, 100, 250, 500]
)

PRODUCE_DURATION = Histogram(
    'kafka_produce_duration_seconds',
    'Time spent producing messages to Kafka',
    ['topic', 'status']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_kafka_connections',
    'Number of active Kafka connections'
)

API_PROCESSING_TIME = Histogram(
    'api_request_processing_seconds',
    'Time spent processing API requests',
    ['endpoint', 'status']
)

# Pydantic models
class PaymentRequest(BaseModel):
    payment_id: str = Field(..., min_length=1, description="Unique payment identifier")
    amount: float = Field(..., gt=0, description="Payment amount (must be positive)")
    merchant_id: str = Field(..., min_length=1, description="Merchant identifier")
    customer_id: str = Field(..., min_length=1, description="Customer identifier")
    currency: str = Field(default="USD", description="Currency code")
    description: Optional[str] = Field(None, description="Payment description")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v > 10000:  # Reasonable limit for demo
            raise ValueError('Amount exceeds maximum limit of $10,000')
        return round(v, 2)

class BatchPaymentRequest(BaseModel):
    payments: List[PaymentRequest] = Field(..., min_items=1, max_items=500)
    correlation_id: Optional[str] = Field(None, description="Request correlation ID")

class PaymentResponse(BaseModel):
    payment_id: str
    status: str
    message: str
    timestamp: str

class BatchResponse(BaseModel):
    batch_id: str
    correlation_id: str
    total_payments: int
    successful: int
    failed: int
    results: List[PaymentResponse]
    processing_time_ms: float

# Global producer instance
producer: Optional[Producer] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global producer
    
    logger.info("Starting Payment Producer API", version="1.0.0")
    
    try:
        # Initialize Kafka producer
        base_config = KafkaConfig.create_producer_config()
        producer_config = {
            **base_config,
            'linger.ms': 100,  # Batch messages for up to 100ms
            'batch.size': 16384,  # 16KB batch size
            'compression.type': 'snappy',  # Compress for efficiency
            'acks': 'all',  # Wait for all replicas
            'retries': 3,  # Retry failed sends
            'delivery.timeout.ms': 300000,  # 5 minutes
            'client.id': 'payment-producer-api'
        }
        
        producer = Producer(producer_config)
        ACTIVE_CONNECTIONS.set(1)
        
        logger.info("Kafka producer initialized successfully", 
                   config=producer_config.keys())
        
        yield
        
    except Exception as e:
        logger.error("Failed to initialize producer", error=str(e))
        raise
    finally:
        # Cleanup
        if producer:
            producer.flush(timeout=10)
            ACTIVE_CONNECTIONS.set(0)
            logger.info("Producer shut down gracefully")

# FastAPI app with lifespan
app = FastAPI(
    title="Payment Producer API",
    description="Monitored Kafka producer for payment processing",
    version="1.0.0",
    lifespan=lifespan
)

# Initialize Prometheus instrumentation
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app)

def get_batch_size_range(size: int) -> str:
    """Categorize batch sizes for metrics"""
    if size == 1:
        return "single"
    elif size <= 10:
        return "small"
    elif size <= 50:
        return "medium"
    elif size <= 100:
        return "large"
    else:
        return "xlarge"

@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    """Add correlation ID to all requests and responses"""
    correlation_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))
    
    # Add to context for structured logging
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    
    # Add to request state
    request.state.correlation_id = correlation_id
    
    response = await call_next(request)
    response.headers["x-correlation-id"] = correlation_id
    
    return response

def delivery_callback(err, msg):
    """Kafka delivery callback for monitoring"""
    if err is not None:
        logger.error("Message delivery failed", 
                    error=str(err), 
                    topic=msg.topic() if msg else "unknown")
        PAYMENTS_TOTAL.labels(status="failed", batch_size_range="unknown").inc()
    else:
        logger.debug("Message delivered", 
                    topic=msg.topic(), 
                    partition=msg.partition(), 
                    offset=msg.offset())

async def produce_payment_message(payment: PaymentRequest, correlation_id: str) -> PaymentResponse:
    """Produce a single payment message to Kafka"""
    start_time = time.time()
    
    try:
        # Create enriched payment record
        payment_record = {
            "payment_id": payment.payment_id,
            "amount": payment.amount,
            "merchant_id": payment.merchant_id,
            "customer_id": payment.customer_id,
            "currency": payment.currency,
            "description": payment.description,
            "status": "PENDING",
            "created_at": datetime.now().isoformat(),
            "correlation_id": correlation_id,
            "source": "payment-producer-api"
        }
        
        # Produce message to Kafka
        producer.produce(
            topic='payment_requests',
            key=payment.payment_id.encode('utf-8'),
            value=json.dumps(payment_record).encode('utf-8'),
            headers={
                'correlation_id': correlation_id.encode('utf-8'),
                'source': 'payment-producer-api'.encode('utf-8')
            },
            callback=delivery_callback
        )
        
        # Record metrics
        duration = time.time() - start_time
        PRODUCE_DURATION.labels(topic='payment_requests', status='success').observe(duration)
        
        logger.info("Payment message produced", 
                   payment_id=payment.payment_id,
                   amount=payment.amount,
                   duration_ms=duration * 1000)
        
        return PaymentResponse(
            payment_id=payment.payment_id,
            status="accepted",
            message="Payment queued for processing",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        duration = time.time() - start_time
        PRODUCE_DURATION.labels(topic='payment_requests', status='error').observe(duration)
        
        logger.error("Failed to produce payment message",
                    payment_id=payment.payment_id,
                    error=str(e))
        
        return PaymentResponse(
            payment_id=payment.payment_id,
            status="failed",
            message=f"Failed to queue payment: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.post("/payments/batch", response_model=BatchResponse)
async def process_batch_payments(
    batch_request: BatchPaymentRequest,
    background_tasks: BackgroundTasks,
    request: Request
) -> BatchResponse:
    """Process a batch of payments"""
    start_time = time.time()
    correlation_id = batch_request.correlation_id or request.state.correlation_id
    batch_id = str(uuid.uuid4())
    
    logger.info("Processing payment batch",
               batch_id=batch_id,
               batch_size=len(batch_request.payments),
               correlation_id=correlation_id)
    
    # Record batch size metrics
    batch_size = len(batch_request.payments)
    BATCH_SIZE_HISTOGRAM.observe(batch_size)
    batch_size_range = get_batch_size_range(batch_size)
    
    results = []
    successful = 0
    failed = 0
    
    # Process each payment in the batch
    for payment in batch_request.payments:
        try:
            result = await produce_payment_message(payment, correlation_id)
            results.append(result)
            
            if result.status == "accepted":
                successful += 1
                PAYMENTS_TOTAL.labels(status="success", batch_size_range=batch_size_range).inc()
            else:
                failed += 1
                PAYMENTS_TOTAL.labels(status="failed", batch_size_range=batch_size_range).inc()
                
        except Exception as e:
            failed += 1
            PAYMENTS_TOTAL.labels(status="failed", batch_size_range=batch_size_range).inc()
            
            results.append(PaymentResponse(
                payment_id=payment.payment_id,
                status="failed",
                message=f"Processing error: {str(e)}",
                timestamp=datetime.now().isoformat()
            ))
    
    # Flush producer to ensure delivery
    background_tasks.add_task(lambda: producer.flush(timeout=5))
    
    processing_time = (time.time() - start_time) * 1000
    
    logger.info("Batch processing completed",
               batch_id=batch_id,
               successful=successful,
               failed=failed,
               processing_time_ms=processing_time)
    
    return BatchResponse(
        batch_id=batch_id,
        correlation_id=correlation_id,
        total_payments=len(batch_request.payments),
        successful=successful,
        failed=failed,
        results=results,
        processing_time_ms=processing_time
    )

@app.post("/payments/single", response_model=PaymentResponse)
async def process_single_payment(
    payment: PaymentRequest,
    request: Request
) -> PaymentResponse:
    """Process a single payment"""
    correlation_id = request.state.correlation_id
    
    logger.info("Processing single payment",
               payment_id=payment.payment_id,
               correlation_id=correlation_id)
    
    result = await produce_payment_message(payment, correlation_id)
    producer.flush(timeout=5)  # Ensure immediate delivery for single payments
    
    return result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "producer_connected": producer is not None
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/stats")
async def get_stats():
    """Get producer statistics"""
    if not producer:
        raise HTTPException(status_code=503, detail="Producer not initialized")
    
    return {
        "kafka_stats": producer.list_topics(timeout=5).topics,
        "active_connections": 1 if producer else 0,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )