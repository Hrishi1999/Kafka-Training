#!/usr/bin/env python3
"""
Simple HTTP Endpoint for Kafka HTTP Sink Connector
Receives payment data and logs it
"""

from flask import Flask, request, jsonify
import json
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Store payments in memory (for demo purposes)
payments = []

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "kafka-http-endpoint",
        "timestamp": datetime.now().isoformat(),
        "payments_received": len(payments)
    })

@app.route('/payments', methods=['POST'])
def receive_payments():
    """Main endpoint to receive payment data from Kafka"""
    try:
        # Log raw request details for debugging
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Raw data: {request.data}")
        
        # Get JSON payload
        data = None
        
        if request.is_json:
            data = request.get_json()
            logger.info("Parsed with get_json()")
        else:
            # Try manual JSON parsing
            try:
                raw_data = request.data.decode('utf-8')
                logger.info(f"Raw string: {raw_data}")
                if raw_data:
                    data = json.loads(raw_data)
                    logger.info("Parsed with manual JSON parsing")
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                logger.error(f"JSON parsing failed: {e}")
                return jsonify({
                    "status": "error",
                    "message": f"Invalid JSON: {e}",
                    "timestamp": datetime.now().isoformat()
                }), 400
        
        if not data:
            logger.error("No data received")
            return jsonify({
                "status": "error",
                "message": "No data received",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        logger.info(f"Received payload: {data}")
        
        # Since we're using batch.max.size=1, we expect single payments
        # But handle both cases just in case
        processed_count = 0
        
        if isinstance(data, list):
            # Batch of payments
            for payment in data:
                payments.append(payment)
                logger.info(f"Payment received: {payment.get('payment_id', 'unknown')} - ${payment.get('amount', 0)}")
                processed_count += 1
        else:
            # Single payment (expected case)
            payments.append(data)
            logger.info(f"Payment received: {data.get('payment_id', 'unknown')} - ${data.get('amount', 0)}")
            processed_count = 1
        
        return jsonify({
            "status": "success",
            "message": f"Received {processed_count} payments",
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing payments: {e}")
        logger.error(f"Request headers: {dict(request.headers)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/payments/list', methods=['GET'])
def list_payments():
    """List all received payments"""
    return jsonify({
        "payments": payments[-10:],  # Last 10 payments
        "total_count": len(payments),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        "service": "Kafka HTTP Sink Endpoint",
        "status": "running",
        "endpoints": {
            "POST /payments": "Receive payment data",
            "GET /payments/list": "List payments",
            "GET /health": "Health check"
        },
        "payments_received": len(payments)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"Starting HTTP endpoint server on {host}:{port}")
    app.run(host=host, port=port, debug=False)