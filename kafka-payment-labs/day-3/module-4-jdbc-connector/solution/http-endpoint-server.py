#!/usr/bin/env python3
"""
Simple HTTP endpoint server for testing Kafka HTTP Sink Connector
Receives payment data from Kafka via HTTP POST requests
"""

from flask import Flask, request, jsonify
import json
import logging
from datetime import datetime
import os

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Store received payments for demonstration
received_payments = []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "total_payments_received": len(received_payments)
    })

@app.route('/payments', methods=['POST'])
def receive_payments():
    """
    Endpoint to receive payment data from Kafka HTTP Sink Connector
    Expects JSON payload with payment data
    """
    try:
        # Log the incoming request
        logger.info(f"Received HTTP request from {request.remote_addr}")
        logger.info(f"Content-Type: {request.content_type}")
        
        # Get the JSON payload
        if request.is_json:
            payments_data = request.get_json()
        else:
            # Handle plain text JSON
            payments_data = json.loads(request.data.decode('utf-8'))
        
        logger.info(f"Received payload: {json.dumps(payments_data, indent=2)}")
        
        # Handle both single payment and batch of payments
        if isinstance(payments_data, list):
            # Batch of payments
            for payment in payments_data:
                process_payment(payment)
            logger.info(f"Processed batch of {len(payments_data)} payments")
        else:
            # Single payment
            process_payment(payments_data)
            logger.info("Processed single payment")
        
        return jsonify({
            "status": "success",
            "message": "Payments received and processed",
            "timestamp": datetime.now().isoformat(),
            "count": len(payments_data) if isinstance(payments_data, list) else 1
        }), 200
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return jsonify({
            "status": "error",
            "message": "Invalid JSON format",
            "error": str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "error": str(e)
        }), 500

def process_payment(payment_data):
    """Process individual payment record"""
    try:
        # Add timestamp when received
        payment_data['received_at'] = datetime.now().isoformat()
        
        # Store the payment
        received_payments.append(payment_data)
        
        # Log payment details
        if isinstance(payment_data, dict):
            payment_id = payment_data.get('payment_id', 'unknown')
            amount = payment_data.get('amount', 'unknown')
            status = payment_data.get('status', 'unknown')
            logger.info(f"Payment processed: ID={payment_id}, Amount={amount}, Status={status}")
        
        # Here you could add business logic like:
        # - Validate payment data
        # - Send notifications
        # - Update external systems
        # - Trigger workflows
        
    except Exception as e:
        logger.error(f"Error processing payment: {e}")
        raise

@app.route('/payments/list', methods=['GET'])
def list_payments():
    """Get list of all received payments"""
    return jsonify({
        "total_count": len(received_payments),
        "payments": received_payments[-10:]  # Return last 10 payments
    })

@app.route('/payments/stats', methods=['GET'])
def payment_stats():
    """Get payment statistics"""
    if not received_payments:
        return jsonify({
            "total_count": 0,
            "message": "No payments received yet"
        })
    
    # Calculate basic stats
    total_count = len(received_payments)
    
    # Count by status
    status_counts = {}
    total_amount = 0
    
    for payment in received_payments:
        if isinstance(payment, dict):
            status = payment.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Sum amounts if available and numeric
            amount = payment.get('amount', 0)
            try:
                total_amount += float(amount)
            except (ValueError, TypeError):
                pass
    
    return jsonify({
        "total_count": total_count,
        "total_amount": round(total_amount, 2),
        "status_breakdown": status_counts,
        "latest_payment": received_payments[-1] if received_payments else None
    })

@app.route('/payments/clear', methods=['DELETE'])
def clear_payments():
    """Clear all received payments (for testing)"""
    global received_payments
    count = len(received_payments)
    received_payments = []
    logger.info(f"Cleared {count} payments")
    
    return jsonify({
        "status": "success",
        "message": f"Cleared {count} payments",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with basic info"""
    return jsonify({
        "service": "Kafka HTTP Sink Test Endpoint",
        "version": "1.0.0",
        "endpoints": {
            "POST /payments": "Receive payment data from Kafka",
            "GET /payments/list": "List received payments",
            "GET /payments/stats": "Payment statistics",
            "GET /health": "Health check",
            "DELETE /payments/clear": "Clear all payments"
        },
        "status": "running",
        "payments_received": len(received_payments)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting HTTP endpoint server on port {port}")
    logger.info("Endpoints available:")
    logger.info("  POST /payments - Receive payment data")
    logger.info("  GET /payments/list - List payments")
    logger.info("  GET /payments/stats - Payment stats")
    logger.info("  GET /health - Health check")
    
    app.run(host='0.0.0.0', port=port, debug=debug)