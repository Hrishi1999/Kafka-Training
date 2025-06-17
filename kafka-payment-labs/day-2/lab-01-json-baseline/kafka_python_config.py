#!/usr/bin/env python3
"""
Configuration utility for kafka-python library (used in Lab 01)
Note: kafka-python uses different parameter names than confluent-kafka
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_kafka_python_config():
    """Returns kafka-python configuration for Confluent Cloud"""
    required_vars = [
        'BOOTSTRAP_SERVERS',
        'SASL_USERNAME', 
        'SASL_PASSWORD'
    ]
    
    # Check required environment variables
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")
    
    return {
        'bootstrap_servers': os.environ['BOOTSTRAP_SERVERS'].split(','),
        'security_protocol': os.environ.get('SECURITY_PROTOCOL', 'SASL_SSL'),
        'sasl_mechanism': os.environ.get('SASL_MECHANISM', 'PLAIN'),
        'sasl_plain_username': os.environ['SASL_USERNAME'],
        'sasl_plain_password': os.environ['SASL_PASSWORD'],
    }

def validate_kafka_python_config():
    """Validate kafka-python configuration"""
    try:
        config = get_kafka_python_config()
        print("✓ kafka-python configuration valid")
        print(f"  Bootstrap servers: {config['bootstrap_servers']}")
        print(f"  SASL username: {config['sasl_plain_username'][:8]}...")
        return True
    except Exception as e:
        print(f"✗ kafka-python configuration error: {e}")
        return False

if __name__ == "__main__":
    print("Validating kafka-python configuration...")
    validate_kafka_python_config()