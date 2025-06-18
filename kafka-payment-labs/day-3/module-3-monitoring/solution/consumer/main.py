#!/usr/bin/env python3
"""
Payment Consumer - Monitored Kafka Consumer

This service consumes payment messages from Kafka with comprehensive monitoring,
structured logging, and Prometheus metrics integration.

Features:
- Consumer group membership with rebalancing detection
- Comprehensive error handling with retry logic
- Structured JSON logging with correlation IDs
- Prometheus metrics exposition
- Consumer lag monitoring
- Processing time tracking
- Health checks via HTTP server
"""

import os
import sys
import json
import time
import signal
import threading
from datetime import datetime
from typing import Dict, Optional, List
from http.server import HTTPServer, BaseHTTPRequestHandler

import structlog
from confluent_kafka import Consumer, KafkaError, KafkaException, TopicPartition
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

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
    '/app/logs/consumer.log',
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

logger = structlog.get_logger("payment_consumer")

# Prometheus metrics
MESSAGES_CONSUMED_TOTAL = Counter(
    'messages_consumed_total',
    'Total number of messages consumed',
    ['topic', 'status']
)

PROCESSING_DURATION = Histogram(
    'message_processing_duration_seconds',
    'Time spent processing messages',
    ['topic', 'status'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

END_TO_END_LATENCY = Histogram(
    'end_to_end_latency_seconds',
    'Time from message creation to processing completion',
    ['topic']
)

CONSUMER_LAG = Gauge(
    'consumer_lag_messages',
    'Consumer lag in messages',
    ['topic', 'partition']
)

REBALANCES_TOTAL = Counter(
    'consumer_rebalances_total',
    'Total number of consumer rebalances',
    ['type']
)

ACTIVE_PARTITIONS = Gauge(
    'consumer_active_partitions',
    'Number of partitions assigned to this consumer'
)

ERRORS_TOTAL = Counter(
    'consumer_errors_total',
    'Total number of consumer errors',
    ['error_type']
)

class PaymentProcessor:
    """Business logic for processing payment messages"""
    
    def __init__(self):
        self.processed_count = 0
        self.failed_count = 0
    
    def process_payment(self, payment_data: Dict, correlation_id: str) -> bool:
        """
        Process a payment message
        Returns True if successful, False if failed
        """
        try:
            # Simulate payment processing logic
            payment_id = payment_data.get('payment_id')
            amount = payment_data.get('amount')
            merchant_id = payment_data.get('merchant_id')
            
            # Validate required fields
            if not all([payment_id, amount, merchant_id]):
                raise ValueError("Missing required payment fields")
            
            # Simulate processing time (0.1-0.5 seconds)
            import random
            processing_time = random.uniform(0.1, 0.5)
            time.sleep(processing_time)
            
            # Simulate occasional failures (5% failure rate)
            if random.random() < 0.05:
                raise Exception("Simulated processing failure")
            
            logger.info("Payment processed successfully",
                       payment_id=payment_id,
                       amount=amount,
                       merchant_id=merchant_id,
                       processing_time_ms=processing_time * 1000)
            
            self.processed_count += 1
            return True
            
        except Exception as e:
            logger.error("Payment processing failed",
                        payment_id=payment_data.get('payment_id'),
                        error=str(e))
            self.failed_count += 1
            return False

class MetricsHandler(BaseHTTPRequestHandler):
    """HTTP handler for metrics endpoint"""
    
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
            health_data = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(health_data).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress default HTTP logging
        pass

class MonitoredPaymentConsumer:
    """Kafka consumer with comprehensive monitoring"""
    
    def __init__(self, group_id: str = "payment-consumer-group"):
        self.group_id = group_id
        self.consumer: Optional[Consumer] = None
        self.processor = PaymentProcessor()
        self.running = False
        self.metrics_server: Optional[HTTPServer] = None
        self.assigned_partitions: List[TopicPartition] = []
        
        # Initialize consumer
        self._setup_consumer()
        
        # Start metrics server
        self._start_metrics_server()
    
    def _setup_consumer(self):
        """Initialize Kafka consumer with monitoring configuration"""
        try:
            # Create consumer configuration
            base_config = KafkaConfig.create_consumer_config(
                group_id=self.group_id,
                auto_offset_reset='earliest'
            )
            
            consumer_config = {
                **base_config,
                'enable.auto.commit': True,
                'auto.commit.interval.ms': 5000,
                'session.timeout.ms': 30000,
                'heartbeat.interval.ms': 10000,
                'max.poll.interval.ms': 300000,
                'client.id': f'payment-consumer-{os.getpid()}'
            }
            
            self.consumer = Consumer(consumer_config)
            
            # Set up rebalance callbacks
            self.consumer.subscribe(
                ['payment_requests'],
                on_assign=self._on_partition_assign,
                on_revoke=self._on_partition_revoke
            )
            
            logger.info("Consumer initialized successfully",
                       group_id=self.group_id,
                       config_keys=list(consumer_config.keys()))
            
        except Exception as e:
            logger.error("Failed to initialize consumer", error=str(e))
            raise
    
    def _start_metrics_server(self):
        """Start HTTP server for metrics and health checks"""
        try:
            self.metrics_server = HTTPServer(('0.0.0.0', 8001), MetricsHandler)
            metrics_thread = threading.Thread(
                target=self.metrics_server.serve_forever,
                daemon=True
            )
            metrics_thread.start()
            logger.info("Metrics server started on port 8001")
        except Exception as e:
            logger.error("Failed to start metrics server", error=str(e))
    
    def _on_partition_assign(self, consumer, partitions):
        """Callback when partitions are assigned"""
        self.assigned_partitions = partitions
        ACTIVE_PARTITIONS.set(len(partitions))
        REBALANCES_TOTAL.labels(type='assign').inc()
        
        partition_info = [f"{tp.topic}:{tp.partition}" for tp in partitions]
        logger.info("Partitions assigned",
                   partitions=partition_info,
                   count=len(partitions))
    
    def _on_partition_revoke(self, consumer, partitions):
        """Callback when partitions are revoked"""
        REBALANCES_TOTAL.labels(type='revoke').inc()
        
        partition_info = [f"{tp.topic}:{tp.partition}" for tp in partitions]
        logger.info("Partitions revoked",
                   partitions=partition_info,
                   count=len(partitions))
    
    def _update_consumer_lag(self, message):
        """Update consumer lag metrics"""
        try:
            # Get partition metadata
            topic = message.topic()
            partition = message.partition()
            
            # Get high watermark (latest offset)
            watermarks = self.consumer.get_watermark_offsets(
                TopicPartition(topic, partition)
            )
            
            if watermarks:
                low_offset, high_offset = watermarks
                current_offset = message.offset()
                lag = high_offset - current_offset - 1
                
                CONSUMER_LAG.labels(topic=topic, partition=str(partition)).set(max(0, lag))
                
        except Exception as e:
            logger.warning("Failed to update consumer lag", error=str(e))
    
    def _extract_correlation_id(self, message) -> str:
        """Extract correlation ID from message headers"""
        correlation_id = "unknown"
        
        if message.headers():
            for key, value in message.headers():
                if key == 'correlation_id' and isinstance(value, bytes):
                    correlation_id = value.decode('utf-8')
                    break
        
        return correlation_id
    
    def _calculate_end_to_end_latency(self, payment_data: Dict) -> Optional[float]:
        """Calculate end-to-end latency from message creation"""
        try:
            created_at_str = payment_data.get('created_at')
            if not created_at_str:
                return None
            
            created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            now = datetime.now()
            
            # Handle timezone-naive datetimes
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=now.tzinfo)
            
            latency = (now - created_at).total_seconds()
            return latency if latency >= 0 else None
            
        except Exception as e:
            logger.warning("Failed to calculate end-to-end latency", error=str(e))
            return None
    
    def process_message(self, message):
        """Process a single Kafka message"""
        start_time = time.time()
        topic = message.topic()
        
        try:
            # Extract correlation ID and set context
            correlation_id = self._extract_correlation_id(message)
            structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
            
            # Parse message
            if message.value() is None:
                logger.warning("Received message with null value", topic=topic)
                return
            
            payment_data = json.loads(message.value().decode('utf-8'))
            
            # Update lag metrics
            self._update_consumer_lag(message)
            
            # Calculate end-to-end latency
            e2e_latency = self._calculate_end_to_end_latency(payment_data)
            if e2e_latency is not None:
                END_TO_END_LATENCY.labels(topic=topic).observe(e2e_latency)
            
            # Process the payment
            success = self.processor.process_payment(payment_data, correlation_id)
            
            # Record metrics
            processing_time = time.time() - start_time
            status = "success" if success else "failed"
            
            MESSAGES_CONSUMED_TOTAL.labels(topic=topic, status=status).inc()
            PROCESSING_DURATION.labels(topic=topic, status=status).observe(processing_time)
            
            logger.info("Message processed",
                       topic=topic,
                       partition=message.partition(),
                       offset=message.offset(),
                       payment_id=payment_data.get('payment_id'),
                       success=success,
                       processing_time_ms=processing_time * 1000,
                       e2e_latency_ms=e2e_latency * 1000 if e2e_latency else None)
            
        except json.JSONDecodeError as e:
            ERRORS_TOTAL.labels(error_type='json_decode').inc()
            logger.error("Failed to decode message JSON",
                        topic=topic,
                        error=str(e),
                        raw_value=message.value()[:100] if message.value() else None)
            
        except Exception as e:
            ERRORS_TOTAL.labels(error_type='processing').inc()
            processing_time = time.time() - start_time
            PROCESSING_DURATION.labels(topic=topic, status="error").observe(processing_time)
            
            logger.error("Message processing error",
                        topic=topic,
                        partition=message.partition(),
                        offset=message.offset(),
                        error=str(e))
    
    def run(self):
        """Main consumer loop"""
        self.running = True
        logger.info("Starting consumer loop", group_id=self.group_id)
        
        try:
            while self.running:
                # Poll for messages
                message = self.consumer.poll(timeout=1.0)
                
                if message is None:
                    continue
                
                if message.error():
                    if message.error().code() == KafkaError._PARTITION_EOF:
                        logger.debug("Reached end of partition",
                                   topic=message.topic(),
                                   partition=message.partition())
                    else:
                        ERRORS_TOTAL.labels(error_type='kafka').inc()
                        logger.error("Kafka error", error=str(message.error()))
                else:
                    self.process_message(message)
                    
        except KeyboardInterrupt:
            logger.info("Consumer interrupted by user")
        except Exception as e:
            logger.error("Consumer loop error", error=str(e))
            raise
        finally:
            self.shutdown()
    
    def shutdown(self):
        """Graceful shutdown"""
        self.running = False
        
        if self.consumer:
            logger.info("Closing consumer")
            self.consumer.close()
        
        if self.metrics_server:
            logger.info("Shutting down metrics server")
            self.metrics_server.shutdown()
        
        logger.info("Consumer shutdown complete",
                   processed=self.processor.processed_count,
                   failed=self.processor.failed_count)

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Received shutdown signal", signal=signum)
    global consumer_instance
    if consumer_instance:
        consumer_instance.shutdown()

# Global consumer instance for signal handling
consumer_instance = None

def main():
    """Main entry point"""
    global consumer_instance
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("Starting Payment Consumer",
               version="1.0.0",
               pid=os.getpid())
    
    try:
        consumer_instance = MonitoredPaymentConsumer()
        consumer_instance.run()
    except Exception as e:
        logger.error("Consumer startup failed", error=str(e))
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())