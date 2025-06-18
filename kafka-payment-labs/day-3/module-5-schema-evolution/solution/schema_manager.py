#!/usr/bin/env python3
"""
Schema Manager - Manages Avro schemas in Confluent Schema Registry (SOLUTION)

This utility demonstrates:
- How to register schemas programmatically
- How to check schema compatibility
- How Schema Registry prevents breaking changes
- How to manage schema evolution safely
"""

import os
import sys
import json
import requests
from typing import Dict, List, Optional
from confluent_kafka.schema_registry import SchemaRegistryClient, Schema
from confluent_kafka.schema_registry.error import SchemaRegistryError

# Add parent directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from common.config import KafkaConfig

class SchemaManager:
    """Manages Avro schemas in Confluent Schema Registry"""
    
    def __init__(self):
        # Schema Registry configuration using common KafkaConfig
        self.schema_registry_config = KafkaConfig.create_schema_registry_config()
        
        # Initialize Schema Registry client
        self.schema_registry_client = SchemaRegistryClient(self.schema_registry_config)
        
        # Subject names
        self.payment_subject = 'payment-demo-fresh-value'
        
        print(f"🏗️  Schema Manager initialized")
        print(f"🔗 Schema Registry: {self.schema_registry_config['url']}")
        print(f"📋 Payment Subject: {self.payment_subject}")
    
    def load_schema_from_file(self, schema_file: str) -> str:
        """Load Avro schema from JSON file"""
        try:
            with open(schema_file, 'r') as f:
                schema_dict = json.load(f)
            
            print(f"📋 Loaded schema from: {schema_file}")
            print(f"   Name: {schema_dict.get('name', 'Unknown')}")
            print(f"   Fields: {len(schema_dict.get('fields', []))}")
            
            return json.dumps(schema_dict)
            
        except FileNotFoundError:
            print(f"❌ Schema file not found: {schema_file}")
            raise
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in schema file: {e}")
            raise
    
    def register_schema(self, schema_version: str, subject: str = None) -> int:
        """Register a schema version with Schema Registry"""
        if subject is None:
            subject = self.payment_subject
        
        print(f"\n🔄 Registering schema version: {schema_version}")
        print(f"📋 Subject: {subject}")
        
        # Load schema from file
        schema_file = f"../schemas/payment-{schema_version}.avsc"
        
        try:
            # Load schema string from file
            schema_str = self.load_schema_from_file(schema_file)
            
            # Register schema with Schema Registry
            schema_obj = Schema(schema_str, schema_type="AVRO")
            schema_id = self.schema_registry_client.register_schema(subject, schema_obj)
            
            print(f"✅ Schema registered successfully!")
            print(f"   Schema ID: {schema_id}")
            print(f"   Subject: {subject}")
            print(f"   Version: {schema_version}")
            
            return schema_id
            
        except SchemaRegistryError as e:
            # Handle different types of Schema Registry errors
            print(f"❌ Schema registration failed: {e}")
            
            # Check if it's a compatibility error
            if "compatibility" in str(e).lower():
                print(f"🚨 COMPATIBILITY ERROR!")
                print(f"   The schema {schema_version} is not compatible with existing schemas")
                print(f"   This is likely a breaking change that Schema Registry rejected")
                print(f"   💡 Try using a compatible schema or change compatibility mode")
            elif "already exists" in str(e).lower():
                print(f"ℹ️  Schema already exists (this is normal)")
                # Get the existing schema ID
                try:
                    latest = self.schema_registry_client.get_latest_version(subject)
                    return latest.schema_id
                except:
                    pass
            
            raise
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            raise
    
    def check_compatibility(self, schema_version: str, subject: str = None) -> bool:
        """Check if a schema version is compatible with the current subject"""
        if subject is None:
            subject = self.payment_subject
        
        print(f"\n🔍 Checking compatibility for schema: {schema_version}")
        print(f"📋 Subject: {subject}")
        
        try:
            # Load candidate schema
            schema_file = f"../schemas/payment-{schema_version}.avsc"
            candidate_schema = self.load_schema_from_file(schema_file)
            
            # Check compatibility with Schema Registry
            schema_obj = Schema(candidate_schema, schema_type="AVRO")
            
            # Test compatibility against the latest version
            try:
                # Verify subject exists
                self.schema_registry_client.get_latest_version(subject)
                is_compatible = self.schema_registry_client.test_compatibility(subject, schema_obj)
            except Exception as e:
                if "not found" in str(e).lower():
                    print(f"ℹ️  No existing schemas found - first schema is always compatible")
                    return True
                else:
                    raise
            
            if is_compatible:
                print(f"✅ Schema {schema_version} is COMPATIBLE")
                print(f"   Safe to register and use with existing consumers")
            else:
                print(f"❌ Schema {schema_version} is NOT COMPATIBLE")
                print(f"   Would break existing consumers - registration will fail")
            
            return is_compatible
            
        except SchemaRegistryError as e:
            if "not found" in str(e).lower():
                print(f"ℹ️  No existing schemas found - first schema is always compatible")
                return True
            else:
                print(f"❌ Compatibility check failed: {e}")
                return False
        except Exception as e:
            print(f"❌ Compatibility check failed: {e}")
            return False
    
    def list_schema_versions(self, subject: str = None) -> List[int]:
        """List all schema versions for a subject"""
        if subject is None:
            subject = self.payment_subject
        
        try:
            versions = self.schema_registry_client.get_versions(subject)
            
            print(f"\n📋 Schema versions for subject '{subject}':")
            for version in versions:
                schema = self.schema_registry_client.get_version(subject, version)
                print(f"   Version {version}: Schema ID {schema.schema_id}")
            
            return versions
            
        except SchemaRegistryError as e:
            if "not found" in str(e).lower():
                print(f"📋 No schemas found for subject '{subject}'")
                return []
            else:
                print(f"❌ Error listing schemas: {e}")
                raise
    
    def get_compatibility_mode(self, subject: str = None) -> str:
        """Get the current compatibility mode for a subject"""
        if subject is None:
            subject = self.payment_subject
        
        try:
            # Get compatibility configuration
            url = f"{self.schema_registry_config['url']}/config/{subject}"
            auth = tuple(self.schema_registry_config['basic.auth.user.info'].split(':'))
            
            response = requests.get(url, auth=auth)
            
            if response.status_code == 200:
                config = response.json()
                compatibility = config.get('compatibility', 'BACKWARD')
            elif response.status_code == 404:
                # Subject not found, get global default
                global_url = f"{self.schema_registry_config['url']}/config"
                global_response = requests.get(global_url, auth=auth)
                if global_response.status_code == 200:
                    global_config = global_response.json()
                    compatibility = global_config.get('compatibility', 'BACKWARD')
                else:
                    compatibility = 'BACKWARD'  # Default
            else:
                compatibility = 'UNKNOWN'
            
            print(f"🔧 Compatibility mode for '{subject}': {compatibility}")
            
            return compatibility
            
        except Exception as e:
            print(f"❌ Error getting compatibility mode: {e}")
            return 'UNKNOWN'
    
    def set_compatibility_mode(self, compatibility: str, subject: str = None) -> bool:
        """Set the compatibility mode for a subject"""
        if subject is None:
            subject = self.payment_subject
        
        valid_modes = ['BACKWARD', 'FORWARD', 'FULL', 'NONE']
        if compatibility not in valid_modes:
            print(f"❌ Invalid compatibility mode: {compatibility}")
            print(f"   Valid modes: {valid_modes}")
            return False
        
        try:
            url = f"{self.schema_registry_config['url']}/config/{subject}"
            auth = tuple(self.schema_registry_config['basic.auth.user.info'].split(':'))
            
            data = {'compatibility': compatibility}
            response = requests.put(url, json=data, auth=auth)
            
            if response.status_code == 200:
                print(f"✅ Set compatibility mode to '{compatibility}' for subject '{subject}'")
                return True
            else:
                print(f"❌ Failed to set compatibility mode: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error setting compatibility mode: {e}")
            return False

def main():
    """Demonstration of schema management operations"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Schema Registry Management Tool')
    parser.add_argument('--action', choices=['register', 'check', 'list', 'compatibility'], 
                       required=True, help='Action to perform')
    parser.add_argument('--schema-version', type=str, 
                       help='Schema version (v1, v2-safe, v2-breaking)')
    parser.add_argument('--compatibility-mode', type=str,
                       choices=['BACKWARD', 'FORWARD', 'FULL', 'NONE'],
                       help='Compatibility mode to set')
    
    args = parser.parse_args()
    
    print("🏗️  SCHEMA REGISTRY MANAGEMENT TOOL")
    print("=" * 60)
    print("🎯 Purpose: Manage Avro schemas and test compatibility")
    print("🔍 Focus: Schema evolution and compatibility checking")
    print("=" * 60)
    
    try:
        manager = SchemaManager()
        
        if args.action == 'register':
            if not args.schema_version:
                print("❌ --schema-version required for register action")
                return
            
            schema_id = manager.register_schema(args.schema_version)
            print(f"\n✅ Registration complete! Schema ID: {schema_id}")
            
        elif args.action == 'check':
            if not args.schema_version:
                print("❌ --schema-version required for check action")
                return
            
            is_compatible = manager.check_compatibility(args.schema_version)
            print(f"\n🔍 Compatibility result: {'✅ COMPATIBLE' if is_compatible else '❌ NOT COMPATIBLE'}")
            
        elif args.action == 'list':
            versions = manager.list_schema_versions()
            print(f"\n📊 Found {len(versions)} schema versions")
            
        elif args.action == 'compatibility':
            if args.compatibility_mode:
                success = manager.set_compatibility_mode(args.compatibility_mode)
                if success:
                    print(f"\n✅ Compatibility mode updated successfully")
                else:
                    print(f"\n❌ Failed to update compatibility mode")
            else:
                current_mode = manager.get_compatibility_mode()
                print(f"\n📋 Current compatibility mode: {current_mode}")
        
        print(f"\n💡 Next Steps:")
        print(f"  1. Try registering different schema versions")
        print(f"  2. Test compatibility before registration")
        print(f"  3. Experiment with different compatibility modes")
        print(f"  4. Observe how Schema Registry prevents breaking changes")
        
    except KeyboardInterrupt:
        print(f"\n⚡ Tool interrupted")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()