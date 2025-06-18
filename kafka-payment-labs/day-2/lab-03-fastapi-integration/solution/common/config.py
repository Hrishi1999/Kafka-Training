"""
Configuration management for Kafka applications
"""

import os
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class KafkaConfig:
    """Kafka configuration helper"""
    
    @staticmethod
    def create_consumer_config(
        group_id: Optional[str] = None,
        auto_offset_reset: str = 'latest',
        enable_auto_commit: bool = True,
        **kwargs
    ) -> Dict[str, str]:
        """
        Create Kafka consumer configuration
        
        Args:
            group_id: Consumer group ID
            auto_offset_reset: Where to start reading when no offset exists
            enable_auto_commit: Whether to automatically commit offsets
            **kwargs: Additional configuration parameters
            
        Returns:
            Dictionary of configuration parameters
        """
        config = {
            'bootstrap.servers': os.getenv('BOOTSTRAP_SERVERS'),
            'security.protocol': os.getenv('SECURITY_PROTOCOL', 'SASL_SSL'),
            'sasl.mechanism': os.getenv('SASL_MECHANISM', 'PLAIN'),
            'sasl.username': os.getenv('SASL_USERNAME'),
            'sasl.password': os.getenv('SASL_PASSWORD'),
            'group.id': group_id or os.getenv('CONSUMER_GROUP_ID', 'payment-processor'),
            'auto.offset.reset': auto_offset_reset,
            'enable.auto.commit': enable_auto_commit,
        }
        
        # Add any additional configuration
        config.update(kwargs)
        
        # Remove None values
        return {k: v for k, v in config.items() if v is not None}
    
    @staticmethod
    def create_producer_config(**kwargs) -> Dict[str, str]:
        """
        Create Kafka producer configuration
        
        Args:
            **kwargs: Additional configuration parameters
            
        Returns:
            Dictionary of configuration parameters
        """
        config = {
            'bootstrap.servers': os.getenv('BOOTSTRAP_SERVERS'),
            'security.protocol': os.getenv('SECURITY_PROTOCOL', 'SASL_SSL'),
            'sasl.mechanism': os.getenv('SASL_MECHANISM', 'PLAIN'),
            'sasl.username': os.getenv('SASL_USERNAME'),
            'sasl.password': os.getenv('SASL_PASSWORD'),
        }
        
        # Add any additional configuration
        config.update(kwargs)
        
        # Remove None values
        return {k: v for k, v in config.items() if v is not None}
    
    @staticmethod
    def create_schema_registry_config() -> Dict[str, str]:
        """
        Create Schema Registry client configuration
        
        Returns:
            Dictionary of configuration parameters
        """
        return {
            'url': os.getenv('SCHEMA_REGISTRY_URL'),
            'basic.auth.user.info': f"{os.getenv('SCHEMA_REGISTRY_API_KEY')}:{os.getenv('SCHEMA_REGISTRY_API_SECRET')}"
        }
    
    @staticmethod
    def validate_config():
        """Validate that all required environment variables are set"""
        required_vars = [
            'BOOTSTRAP_SERVERS',
            'SASL_USERNAME',
            'SASL_PASSWORD',
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}. "
                "Please ensure your .env file is properly configured."
            )