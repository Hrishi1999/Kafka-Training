#!/usr/bin/env python3
"""
Schema Manager - Production-ready utility for managing Avro schemas
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import json
import requests
from common.config import KafkaConfig
import argparse
from typing import Dict, List, Optional


class SchemaManager:
    """Production-ready schema management utility"""
    
    def __init__(self):
        # Get Schema Registry configuration
        sr_config = KafkaConfig.create_schema_registry_config()
        self.base_url = sr_config['url']
        
        # Parse authentication
        auth_info = sr_config['basic.auth.user.info']
        if ':' in auth_info:
            username, password = auth_info.split(':', 1)
            self.auth = (username, password)
        else:
            self.auth = None
        
        self.headers = {
            'Content-Type': 'application/vnd.schemaregistry.v1+json',
            'Accept': 'application/vnd.schemaregistry.v1+json'
        }
    
    def load_schema_file(self, schema_path: str) -> dict:
        """Load Avro schema from file"""
        if not os.path.exists(schema_path):
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        with open(schema_path, 'r') as f:
            return json.load(f)
    
    def register_schema(self, subject: str, schema_path: str) -> int:
        """
        Register a schema from file
        
        Args:
            subject: Schema subject (e.g., 'payment_requests-value')
            schema_path: Path to .avsc file
            
        Returns:
            Schema ID
        """
        print(f"📤 Registering schema: {subject}")
        print(f"   File: {schema_path}")
        
        # Load schema
        schema = self.load_schema_file(schema_path)
        
        # Prepare payload
        payload = {
            'schema': json.dumps(schema)
        }
        
        # Make request
        url = f"{self.base_url}/subjects/{subject}/versions"
        response = requests.post(
            url,
            json=payload,
            headers=self.headers,
            auth=self.auth
        )
        
        if response.status_code == 200:
            result = response.json()
            schema_id = result['id']
            version = result.get('version', 'Unknown')
            print(f"✅ Schema registered successfully!")
            print(f"   Schema ID: {schema_id}")
            print(f"   Version: {version}")
            return schema_id
        
        elif response.status_code == 409:
            print(f"⚠️  Schema already exists")
            return self.get_latest_schema_id(subject)
        
        else:
            self._handle_error(response, "registration")
    
    def check_compatibility(self, subject: str, schema_path: str) -> bool:
        """
        Check if a schema is compatible with the latest version
        
        Args:
            subject: Schema subject
            schema_path: Path to .avsc file
            
        Returns:
            True if compatible, False otherwise
        """
        print(f"🔍 Checking compatibility: {subject}")
        print(f"   File: {schema_path}")
        
        # Load schema
        schema = self.load_schema_file(schema_path)
        
        # Prepare payload
        payload = {
            'schema': json.dumps(schema)
        }
        
        # Check compatibility with latest version
        url = f"{self.base_url}/compatibility/subjects/{subject}/versions/latest"
        response = requests.post(
            url,
            json=payload,
            headers=self.headers,
            auth=self.auth
        )
        
        if response.status_code == 200:
            result = response.json()
            is_compatible = result.get('is_compatible', False)
            
            if is_compatible:
                print(f"✅ Schema is compatible!")
            else:
                print(f"❌ Schema is NOT compatible!")
                print(f"   This would break existing consumers")
            
            return is_compatible
        else:
            self._handle_error(response, "compatibility check")
            return False
    
    def get_latest_schema(self, subject: str) -> Optional[Dict]:
        """Get the latest schema for a subject"""
        url = f"{self.base_url}/subjects/{subject}/versions/latest"
        
        response = requests.get(
            url,
            headers=self.headers,
            auth=self.auth
        )
        
        if response.status_code == 200:
            result = response.json()
            schema_id = result['id']
            version = result['version']
            schema = json.loads(result['schema'])
            
            print(f"📋 Latest schema for {subject}:")
            print(f"   Schema ID: {schema_id}")
            print(f"   Version: {version}")
            print(f"   Fields: {len(schema.get('fields', []))}")
            
            return {
                'id': schema_id,
                'version': version,
                'schema': schema
            }
        
        elif response.status_code == 404:
            print(f"⚠️  Subject '{subject}' not found")
            return None
        else:
            self._handle_error(response, "getting latest schema")
            return None
    
    def get_latest_schema_id(self, subject: str) -> int:
        """Get just the latest schema ID"""
        latest = self.get_latest_schema(subject)
        return latest['id'] if latest else None
    
    def list_subjects(self) -> List[str]:
        """List all subjects in the registry"""
        url = f"{self.base_url}/subjects"
        
        response = requests.get(
            url,
            headers=self.headers,
            auth=self.auth
        )
        
        if response.status_code == 200:
            subjects = response.json()
            print(f"📚 Schema Registry Subjects ({len(subjects)} total):")
            
            # Group by topic
            topics = {}
            for subject in subjects:
                if '-' in subject:
                    topic = subject.rsplit('-', 1)[0]
                    schema_type = subject.rsplit('-', 1)[1]
                else:
                    topic = subject
                    schema_type = 'unknown'
                
                if topic not in topics:
                    topics[topic] = []
                topics[topic].append(schema_type)
            
            for topic in sorted(topics.keys()):
                schemas = topics[topic]
                print(f"   📁 {topic}: {', '.join(schemas)}")
            
            return subjects
        else:
            self._handle_error(response, "listing subjects")
            return []
    
    def get_versions(self, subject: str) -> List[int]:
        """Get all versions for a subject"""
        url = f"{self.base_url}/subjects/{subject}/versions"
        
        response = requests.get(
            url,
            headers=self.headers,
            auth=self.auth
        )
        
        if response.status_code == 200:
            versions = response.json()
            print(f"📊 Versions for '{subject}': {versions}")
            return versions
        else:
            print(f"⚠️  Subject '{subject}' not found")
            return []
    
    def delete_subject(self, subject: str, permanent: bool = False) -> bool:
        """Delete a subject (soft delete by default)"""
        print(f"🗑️  Deleting subject: {subject}")
        
        if not permanent:
            print(f"   (Soft delete - can be recovered)")
        else:
            print(f"   ⚠️  PERMANENT delete - cannot be recovered!")
        
        url = f"{self.base_url}/subjects/{subject}"
        if permanent:
            url += "?permanent=true"
        
        response = requests.delete(
            url,
            headers=self.headers,
            auth=self.auth
        )
        
        if response.status_code == 200:
            versions = response.json()
            print(f"✅ Deleted {len(versions)} versions")
            return True
        else:
            self._handle_error(response, "deletion")
            return False
    
    def test_connection(self) -> bool:
        """Test connection to Schema Registry"""
        print(f"🔍 Testing Schema Registry connection...")
        print(f"   URL: {self.base_url}")
        
        try:
            url = f"{self.base_url}/subjects"
            response = requests.get(
                url,
                headers=self.headers,
                auth=self.auth,
                timeout=10
            )
            
            if response.status_code == 200:
                subjects = response.json()
                print(f"✅ Connection successful!")
                print(f"   Found {len(subjects)} subjects")
                return True
            else:
                print(f"❌ Connection failed: HTTP {response.status_code}")
                return False
        
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def _handle_error(self, response: requests.Response, operation: str):
        """Handle API errors consistently"""
        try:
            error_detail = response.json()
            error_msg = error_detail.get('message', 'Unknown error')
        except:
            error_msg = response.text
        
        raise Exception(f"{operation.title()} failed ({response.status_code}): {error_msg}")


def main():
    """Command-line interface for schema management"""
    parser = argparse.ArgumentParser(
        description='Schema Registry Management Utility',
        epilog="""Examples:
  python schema_manager.py register payment_requests-value payment-v1.avsc
  python schema_manager.py check-compatibility payment_requests-value payment-v2.avsc
  python schema_manager.py get-latest payment_requests-value
  python schema_manager.py list""",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Register command
    register_parser = subparsers.add_parser('register', help='Register a schema')
    register_parser.add_argument('subject', help='Schema subject (e.g., payment_requests-value)')
    register_parser.add_argument('schema_file', help='Path to .avsc file')
    
    # Check compatibility command
    compat_parser = subparsers.add_parser('check-compatibility', help='Check schema compatibility')
    compat_parser.add_argument('subject', help='Schema subject')
    compat_parser.add_argument('schema_file', help='Path to .avsc file')
    
    # Get latest command
    latest_parser = subparsers.add_parser('get-latest', help='Get latest schema')
    latest_parser.add_argument('subject', help='Schema subject')
    
    # List command
    subparsers.add_parser('list', help='List all subjects')
    
    # Versions command
    versions_parser = subparsers.add_parser('versions', help='List versions for subject')
    versions_parser.add_argument('subject', help='Schema subject')
    
    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete a subject')
    delete_parser.add_argument('subject', help='Schema subject')
    delete_parser.add_argument('--permanent', action='store_true', help='Permanent deletion')
    
    # Test command
    subparsers.add_parser('test', help='Test Schema Registry connection')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        manager = SchemaManager()
        
        if args.command == 'register':
            manager.register_schema(args.subject, args.schema_file)
        
        elif args.command == 'check-compatibility':
            is_compatible = manager.check_compatibility(args.subject, args.schema_file)
            sys.exit(0 if is_compatible else 1)
        
        elif args.command == 'get-latest':
            manager.get_latest_schema(args.subject)
        
        elif args.command == 'list':
            manager.list_subjects()
        
        elif args.command == 'versions':
            manager.get_versions(args.subject)
        
        elif args.command == 'delete':
            manager.delete_subject(args.subject, args.permanent)
        
        elif args.command == 'test':
            success = manager.test_connection()
            sys.exit(0 if success else 1)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()