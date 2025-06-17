#!/usr/bin/env python3
"""
Confluent Cloud Configuration Utility
Provides secure configuration management for Kafka clients
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_kafka_config():
    """Returns Kafka client configuration for Confluent Cloud"""
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
        'bootstrap.servers': os.environ['BOOTSTRAP_SERVERS'],
        'sasl.mechanisms': os.environ.get('SASL_MECHANISM', 'PLAIN'),
        'security.protocol': os.environ.get('SECURITY_PROTOCOL', 'SASL_SSL'),
        'sasl.username': os.environ['SASL_USERNAME'],
        'sasl.password': os.environ['SASL_PASSWORD'],
    }

def get_schema_registry_config():
    """Returns Schema Registry client configuration"""
    required_vars = [
        'SCHEMA_REGISTRY_URL',
        'SCHEMA_REGISTRY_API_KEY',
        'SCHEMA_REGISTRY_API_SECRET'
    ]
    
    # Check required environment variables
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    if missing_vars:
        raise ValueError(f"Missing required Schema Registry variables: {missing_vars}")
    
    return {
        'url': os.environ['SCHEMA_REGISTRY_URL'],
        'basic.auth.user.info': f"{os.environ['SCHEMA_REGISTRY_API_KEY']}:{os.environ['SCHEMA_REGISTRY_API_SECRET']}"
    }

def get_avro_producer_config(value_schema):
    """Returns separated AvroProducer configuration"""
    kafka_config = get_kafka_config()
    sr_config = get_schema_registry_config()
    
    # Avro config contains Kafka settings + schema registry URL
    avro_config = kafka_config.copy()
    avro_config['schema.registry.url'] = sr_config['url']
    
    # Return both configs for new format
    return avro_config, sr_config

def get_avro_consumer_config(consumer_group='default-group'):
    """Returns separated AvroConsumer configuration"""
    kafka_config = get_kafka_config()
    sr_config = get_schema_registry_config()
    
    # Avro config contains Kafka settings + schema registry URL
    avro_config = kafka_config.copy()
    avro_config['schema.registry.url'] = sr_config['url']
    avro_config['group.id'] = consumer_group
    avro_config['auto.offset.reset'] = 'earliest'
    
    # Return both configs for new format
    return avro_config, sr_config

def validate_config():
    """Validate all configuration is properly set"""
    try:
        kafka_config = get_kafka_config()
        sr_config = get_schema_registry_config()
        
        print("✓ Kafka configuration valid")
        print(f"  Bootstrap servers: {kafka_config['bootstrap.servers']}")
        print(f"  API key: {kafka_config['sasl.username'][:8]}...")
        
        print("✓ Schema Registry configuration valid")
        print(f"  URL: {sr_config['url']}")
        print(f"  API key: {sr_config['basic.auth.user.info'].split(':')[0][:8]}...")
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration error: {e}")
        return False

if __name__ == "__main__":
    print("Validating Confluent Cloud configuration...")
    validate_config()