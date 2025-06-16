import { Slide } from "../types/slides";

export const slidesData: Slide[] = [
  // Module 1: Welcome & Infrastructure Setup (Slides 1-15)
  {
    id: 1,
    title: "Advanced Apache Kafka",
    module: 1,
    section: "Welcome",
    content: {
      type: "title",
      mainTitle:
        "Advanced Apache Kafka: Building Production Event Streaming Systems",
      subtitle: "Python, Confluent Cloud, and Real-World Patterns",
      instructor: {
        name: "Hrishi Patel",
        company: "Psyncopate",
        role: "Consulting Engineer"
      },
      backgroundAnimation: true,
    },
  },
  {
    id: 2,
    title: "Workshop Goals",
    module: 1,
    section: "Welcome",
    content: {
      type: "text",
      points: [
        "Build production-grade payment processing system",
        "Performance optimization: 1M+ messages/sec throughput",
        "Real-world troubleshooting: Consumer lag, partition skew, rebalancing",
      ],
      animation: "slide",
    },
  },
  {
    id: 3,
    title: "Prerequisites Check & Introductions",
    module: 1,
    section: "Welcome",
    content: {
      type: "text",
      points: [
        "Expected: Basic Kafka knowledge (topics, partitions, producers, consumers)",
        "Python 3+ proficiency with async/await patterns",
        "Quick round: Current Kafka experience & pain points you've faced",
      ],
      animation: "fade",
    },
  },
  {
    id: 4,
    title: "What We're Building",
    module: 1,
    section: "Welcome",
    interactive: true,
    content: {
      type: "interactive",
      component: "SystemArchitecture",
      props: {
        showAnimation: true,
        detailed: true,
      },
    },
  },
  {
    id: 5,
    title: "Infrastructure as Code Benefits",
    module: 1,
    section: "Infrastructure",
    content: {
      type: "text",
      points: [
        "Reproducible environments: Dev → Stage → Prod consistency",
        "Version control for infrastructure: GitOps workflow",
        "Automated provisioning: Zero-touch deployments",
        "Cost optimization: Auto-scaling, right-sizing resources",
      ],
      animation: "slide",
    },
  },
  {
    id: 6,
    title: "Confluent Cloud Overview",
    module: 1,
    section: "Infrastructure",
    interactive: true,
    content: {
      type: "interactive",
      component: "ConfluentCloudDemo",
      props: {
        features: [
          "Fully Managed Kafka",
          "Multi-Cloud Support",
          "Kafka Connect + Schema Registry",
          "Enterprise features: RBAC, audit logs, encryption",
        ],
      },
    },
  },
  {
    id: 7,
    title: "Terraform Basics",
    module: 1,
    section: "Infrastructure",
    content: {
      type: "code",
      code: `# terraform/main.tf
terraform {
  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = "~> 1.0"
    }
  }
}

resource "confluent_kafka_cluster" "payments" {
  display_name = "payment-processing-cluster"
  availability = "MULTI_ZONE"
  cloud        = "AWS"
  region       = "us-east-1"
  
  dedicated {
    cku = 2
  }
  
  lifecycle {
    prevent_destroy = true
  }
}`,
      language: "hcl",
      highlightLines: [10, 15, 20],
      explanation:
        "Production-ready Terraform configuration with multi-zone availability",
    },
  },
  {
    id: 8,
    title: "Service Accounts & API Keys",
    module: 1,
    section: "Infrastructure",
    content: {
      type: "config",
      configs: [
        {
          key: "bootstrap.servers",
          value: "pkc-xxxxx.us-east-1.aws.confluent.cloud:9092",
          description: "Kafka cluster endpoint",
          details:
            "This is the main entry point for all Kafka clients. Always use multiple bootstrap servers for high availability. Format: host1:port1,host2:port2",
          importance: "high",
        },
        {
          key: "security.protocol",
          value: "SASL_SSL",
          description: "Security protocol for client connections",
          details:
            "SASL_SSL provides both authentication (SASL) and encryption (SSL). Required for Confluent Cloud. Alternative: PLAINTEXT (dev only)",
          importance: "high",
        },
        {
          key: "sasl.mechanism",
          value: "PLAIN",
          description: "SASL authentication mechanism",
          details:
            "PLAIN mechanism sends credentials securely over SSL. Confluent Cloud supports PLAIN and OAUTHBEARER mechanisms.",
          importance: "medium",
        },
        {
          key: "sasl.username",
          value: "${API_KEY}",
          description: "API key for authentication",
          details:
            "Never hardcode credentials! Use environment variables or secret management systems like HashiCorp Vault.",
          importance: "high",
        },
      ],
    },
  },
  {
    id: 9,
    title: "Project Structure",
    module: 1,
    section: "Infrastructure",
    interactive: true,
    content: {
      type: "interactive",
      component: "ProjectStructure",
      props: {
        structure: {
          "kafka-training/": {
            "terraform/": {
              "main.tf": "Main Terraform configuration",
              "variables.tf": "Variable definitions",
              "outputs.tf": "Output values",
              "environments/": {
                "dev.tfvars": "Development variables",
                "prod.tfvars": "Production variables",
              },
            },
            "python/": {
              "producers/": {
                "payment_gateway.py": "REST API producer",
                "batch_producer.py": "High-throughput batch producer",
              },
              "consumers/": {
                "payment_validator.py": "Real-time validation",
                "fraud_detector.py": "ML-based fraud detection",
              },
              "common/": {
                "config.py": "Shared configuration",
                "serializers.py": "Custom serializers",
                "monitoring.py": "Metrics and logging",
              },
            },
            "config/": {
              "dev.properties": "Development Kafka config",
              "prod.properties": "Production Kafka config",
            },
            "docker/": {
              Dockerfile: "Container definition",
              "docker-compose.yml": "Local development setup",
            },
          },
        },
      },
    },
  },
  {
    id: 10,
    title: "Lab 01 Preview",
    module: 1,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "What we'll build: Kafka cluster with Terraform automation",
        "Expected outcomes: Working cluster with monitoring and first topic",
        "Common issues: API quota limits, network latency, credential errors",
        "Getting help: Confluent Cloud UI, terraform logs, #kafka-help Slack",
      ],
      animation: "fade",
    },
  },
  {
    id: 11,
    title: "Lab 01 - Infrastructure as Code",
    module: 1,
    section: "Lab",
    content: {
      type: "lab",
      labNumber: "01",
      title: "Infrastructure as Code Setup",
      tasks: [
        "Install Terraform and Confluent CLI",
        "Configure Confluent Cloud API credentials",
        "Provision multi-zone Kafka cluster with Terraform",
        "Create service accounts with least-privilege access",
        "Generate API keys and store in environment variables",
        "Create payment_requests topic with 6 partitions, RF=3",
      ],
      expectedOutcome: [
        "Kafka cluster running in Confluent Cloud",
        "Service accounts created with proper RBAC permissions",
        "API keys generated and stored securely in environment",
        "payment_requests topic created with optimal configuration",
        "Terraform state managed remotely for team collaboration",
      ],
      hints: [
        "Use terraform remote state (S3/Terraform Cloud) for team collaboration",
        "Store API keys in environment variables, never in code",
        "Enable audit logs for compliance and debugging",
        "Set up monitoring alerts for cluster health from day one",
      ],
    },
  },
  {
    id: 12,
    title: "Hands-on Tasks",
    module: 1,
    section: "Lab",
    content: {
      type: "code",
      code: `# Step 1: Initialize Terraform
terraform init

# Step 2: Plan infrastructure changes
terraform plan -var-file="environments/dev.tfvars"

# Step 3: Apply configuration
terraform apply -var-file="environments/dev.tfvars"

# Step 4: Verify cluster creation
confluent kafka cluster list

# Step 5: Export credentials for applications
export CONFLUENT_CLOUD_API_KEY="your-key"
export CONFLUENT_CLOUD_API_SECRET="your-secret"
export KAFKA_BOOTSTRAP_SERVERS="pkc-xxxxx.us-east-1.aws.confluent.cloud:9092"

# Step 6: Test connectivity
python test_connection.py`,
      language: "bash",
      highlightLines: [5, 11, 17],
      runnable: true,
    },
  },
  {
    id: 13,
    title: "Verify Infrastructure",
    module: 1,
    section: "Lab",
    interactive: true,
    content: {
      type: "interactive",
      component: "InfrastructureStatus",
      props: {
        services: [
          {
            name: "Kafka Cluster",
            status: "healthy",
            metrics: "3 brokers, 0 offline partitions",
          },
          {
            name: "Topic Creation",
            status: "success",
            metrics: "payment_requests: 6 partitions, RF=3",
          },
          {
            name: "Service Account",
            status: "active",
            metrics: "DeveloperWrite permissions",
          },
          {
            name: "API Keys",
            status: "valid",
            metrics: "Generated 2 minutes ago",
          },
        ],
      },
    },
  },
  {
    id: 14,
    title: "Common Issues & Solutions",
    module: 1,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Authentication errors: Check API key format and permissions in Confluent Cloud",
        "Quota limits: Monitor cluster usage, upgrade plan if needed",
        "Network configuration: Verify security groups and firewall rules",
        "Cost considerations: Use basic clusters for dev, dedicated for production",
      ],
      animation: "fade",
    },
  },
  {
    id: 15,
    title: "Lab 01 Checkpoint",
    module: 1,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Kafka cluster provisioned with Terraform automation",
        "Topic created with production-ready configuration",
        "Credentials secured and environment variables configured",
        "Ready for producer/consumer development in Module 2",
      ],
      animation: "slide",
    },
  },

  // Module 2: Exploring Kafka Concepts (Slides 16-30)
  {
    id: 16,
    title: "Kafka Architecture Deep Dive",
    module: 2,
    section: "Concepts",
    interactive: true,
    content: {
      type: "interactive",
      component: "KafkaArchitecture",
      props: {
        showBrokers: true,
        showTopics: true,
        showPartitions: true,
        animated: true,
        detailed: true,
      },
    },
  },
  {
    id: 17,
    title: "Topics Deep Dive",
    module: 2,
    section: "Concepts",
    interactive: true,
    content: {
      type: "interactive",
      component: "TopicVisualization",
      props: {
        topicName: "payment_requests",
        partitions: 6,
        replicationFactor: 3,
        showMessages: true,
        showRetention: true,
      },
    },
  },
  {
    id: 18,
    title: "Partitions Explained",
    module: 2,
    section: "Concepts",
    content: {
      type: "text",
      points: [
        "Unit of parallelism: Each partition can be consumed by one consumer in a group",
        "Ordered within partition: Messages maintain order within same partition only",
        "Distribution strategies: Round-robin, key-based hashing, custom partitioners",
        "Leader/Follower model: One leader per partition, followers replicate data",
      ],
      animation: "slide",
    },
  },
  {
    id: 19,
    title: "Consumer Groups Deep Dive",
    module: 2,
    section: "Concepts",
    interactive: true,
    content: {
      type: "interactive",
      component: "ConsumerGroupDemo",
      props: {
        groupId: "payment-validators",
        partitions: 6,
        consumers: 3,
        showRebalancing: true,
        showLag: true,
      },
    },
  },
  {
    id: 20,
    title: "Message Structure & Headers",
    module: 2,
    section: "Concepts",
    content: {
      type: "code",
      code: `# Kafka message structure with headers
{
  "key": "CUST_12345",
  "value": {
    "customerId": "CUST_12345",
    "amount": 299.99,
    "currency": "USD",
    "timestamp": "2024-01-15T10:30:00Z",
    "merchantId": "MERCH_789"
  },
  "headers": {
    "event-type": "payment-request",
    "correlation-id": "req-abc-123",
    "source-system": "mobile-app",
    "schema-version": "v2.1",
    "trace-id": "span-xyz-789"
  },
  "timestamp": 1642248600000,
  "offset": 12847,
  "partition": 3
}`,
      language: "json",
      highlightLines: [9, 10, 11, 12, 13],
      explanation:
        "Headers provide metadata without affecting partition assignment",
    },
  },
  {
    id: 21,
    title: "Confluent Cloud UI Tour",
    module: 2,
    section: "UI",
    interactive: true,
    content: {
      type: "interactive",
      component: "ConfluentUITour",
      props: {
        sections: [
          "Cluster overview with real-time metrics",
          "Topic management and configuration",
          "Consumer group monitoring and lag tracking",
          "Schema Registry for data governance",
          "Connect for integrations",
          "KSQL for stream processing",
        ],
      },
    },
  },
  {
    id: 22,
    title: "CLI Tools Mastery",
    module: 2,
    section: "CLI",
    content: {
      type: "code",
      code: `# Essential Kafka CLI commands

# Topic operations
kafka-topics --bootstrap-server localhost:9092 \\
  --create --topic payments --partitions 6 --replication-factor 3

kafka-topics --bootstrap-server localhost:9092 \\
  --describe --topic payments

# Consumer group operations
kafka-consumer-groups --bootstrap-server localhost:9092 \\
  --group payment-processors --describe

kafka-consumer-groups --bootstrap-server localhost:9092 \\
  --group payment-processors --reset-offsets --to-earliest --topic payments --execute

# Performance testing
kafka-producer-perf-test --topic payments \\
  --num-records 100000 --record-size 1024 \\
  --throughput 10000 --producer-props bootstrap.servers=localhost:9092

kafka-consumer-perf-test --topic payments \\
  --messages 100000 --bootstrap-server localhost:9092`,
      language: "bash",
      highlightLines: [4, 10, 13, 17],
      explanation: "Production-ready CLI commands for operations and testing",
    },
  },
  {
    id: 23,
    title: "Key Metrics Dashboard",
    module: 2,
    section: "Monitoring",
    interactive: true,
    content: {
      type: "interactive",
      component: "MetricsDashboard",
      props: {
        metrics: [
          {
            name: "Throughput (msgs/sec)",
            value: "15,847",
            trend: "up",
            critical: false,
          },
          {
            name: "Consumer Lag",
            value: "234",
            trend: "down",
            critical: false,
          },
          { name: "Disk Usage", value: "78%", trend: "up", critical: false },
          {
            name: "Replication Health",
            value: "100%",
            trend: "stable",
            critical: false,
          },
          {
            name: "Request Latency",
            value: "12ms",
            trend: "stable",
            critical: false,
          },
          {
            name: "Error Rate",
            value: "0.01%",
            trend: "down",
            critical: false,
          },
        ],
      },
    },
  },
  {
    id: 24,
    title: "Monitoring Best Practices",
    module: 2,
    section: "Monitoring",
    content: {
      type: "text",
      points: [
        "Alert thresholds: Consumer lag > 1000, disk usage > 85%, error rate > 0.1%",
        "Baseline establishment: Monitor for 2 weeks, set thresholds at 95th percentile",
        "Trend analysis: Use Grafana dashboards with 7-day and 30-day views",
        "Capacity planning: Scale at 70% capacity, not when hitting limits",
      ],
      animation: "slide",
    },
  },
  {
    id: 25,
    title: "Lab 02 Preview",
    module: 2,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Cluster exploration: Navigate UI, create topics via CLI",
        "Metric observation: Set up custom dashboards",
        "Configuration updates: Tune retention and cleanup policies",
        "Performance baseline: Establish throughput and latency benchmarks",
      ],
      animation: "fade",
    },
  },
  {
    id: 26,
    title: "Lab 02 - Explore Cluster",
    module: 2,
    section: "Lab",
    content: {
      type: "lab",
      labNumber: "02",
      title: "Hands-on Cluster Exploration",
      tasks: [
        "Navigate Confluent Cloud UI and explore cluster metrics",
        "Set up custom dashboards for monitoring key metrics",
        "View partition details and replica distribution",
        "Update topic configurations for retention and cleanup",
      ],
      expectedOutcome: [
        "✓ UI navigation mastered with bookmarked dashboards",
        "✓ Topics created/configured with different retention policies",
        "✓ Metrics understood with custom alerting rules",
        "✓ Performance baselines documented for capacity planning",
      ],
      hints: [
        "Use topic templates for consistent configuration across environments",
        "Set up Slack/PagerDuty integrations for critical alerts",
        "Document all configuration changes in Git for auditability",
      ],
    },
  },
  {
    id: 27,
    title: "Python Scripts Overview",
    module: 2,
    section: "Lab",
    content: {
      type: "code",
      code: `# Lab 02 Python scripts

# create_topic.py - Topic creation with validation
import confluent_kafka.admin as admin

def create_topic_with_validation(topic_name, partitions, replication_factor):
    """Create topic with best practices validation"""
    topic = admin.NewTopic(
        topic_name, 
        num_partitions=partitions,
        replication_factor=replication_factor,
        config={
            'retention.ms': '604800000',  # 7 days
            'cleanup.policy': 'delete',
            'min.insync.replicas': '2'
        }
    )
    
# explore_cluster.py - Cluster health checks
def cluster_health_check():
    metadata = producer.list_topics(timeout=10)
    return {
        'broker_count': len(metadata.brokers),
        'topic_count': len(metadata.topics),
        'offline_partitions': count_offline_partitions(metadata)
    }`,
      language: "python",
      highlightLines: [6, 20],
      explanation:
        "Production-ready scripts with error handling and validation",
    },
  },
  {
    id: 28,
    title: "Topic Configuration Tuning",
    module: 2,
    section: "Lab",
    content: {
      type: "config",
      configs: [
        {
          key: "retention.ms",
          value: "604800000",
          description: "Message retention time (7 days)",
          details:
            "Controls how long messages are retained. Consider storage costs vs. replay requirements. For payments: 7-30 days typical.",
          importance: "high",
        },
        {
          key: "cleanup.policy",
          value: "delete",
          description: "Log cleanup policy",
          details:
            "delete: Remove old messages. compact: Keep latest per key. For event streams use delete, for state use compact.",
          importance: "medium",
        },
        {
          key: "min.insync.replicas",
          value: "2",
          description: "Minimum in-sync replicas for writes",
          details:
            "With RF=3, min.insync.replicas=2 ensures durability even if one broker fails. Critical for financial data.",
          importance: "high",
        },
        {
          key: "segment.ms",
          value: "86400000",
          description: "Segment rollover time (24 hours)",
          details:
            "Controls when new log segments are created. Affects retention precision and compaction efficiency.",
          importance: "medium",
        },
      ],
    },
  },
  {
    id: 29,
    title: "Observing Real-time Metrics",
    module: 2,
    section: "Lab",
    interactive: true,
    content: {
      type: "interactive",
      component: "RealTimeMetrics",
      props: {
        metrics: [
          "Messages/sec: Real-time throughput",
          "Partition distribution: Leader/follower balance",
          "Broker health: CPU, memory, disk usage",
          "Client connections: Producer/consumer counts",
          "Network I/O: Bytes in/out per second",
        ],
        updateInterval: 1000,
      },
    },
  },
  {
    id: 30,
    title: "Lab 02 Checkpoint",
    module: 2,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Familiarity Confluent Cloud UI",
        "Topics created",
        "Ready for producer implementation in Module 3",
      ],
      animation: "slide",
    },
  },

  // Module 3: Building Producers (Slides 31-50)
  {
    id: 31,
    title: "Producer Architecture Deep Dive",
    module: 3,
    section: "Producers",
    interactive: true,
    content: {
      type: "interactive",
      component: "ProducerFlow",
      props: {
        showBatching: true,
        showCompression: true,
        showAcks: true,
        showRetries: true,
        detailed: true,
      },
    },
  },
  {
    id: 32,
    title: "Producer Configuration Masterclass",
    module: 3,
    section: "Producers",
    content: {
      type: "config",
      configs: [
        {
          key: "acks",
          value: "all",
          description: "Acknowledgment requirements",
          details:
            "acks=all (or -1): Leader waits for all in-sync replicas. Provides strongest durability guarantee. Use for critical data like payments.",
          importance: "high",
        },
        {
          key: "retries",
          value: "2147483647",
          description: "Maximum retry attempts",
          details:
            "Integer.MAX_VALUE allows infinite retries within delivery.timeout.ms. Prevents message loss due to transient failures.",
          importance: "high",
        },
        {
          key: "delivery.timeout.ms",
          value: "120000",
          description: "Total time for delivery (2 minutes)",
          details:
            "Maximum time to deliver a message including retries. Should be longer than linger.ms + request.timeout.ms.",
          importance: "high",
        },
        {
          key: "batch.size",
          value: "65536",
          description: "Batch size in bytes (64KB)",
          details:
            "Larger batches improve throughput but increase latency. Tune based on message size and throughput requirements.",
          importance: "medium",
        },
        {
          key: "linger.ms",
          value: "10",
          description: "Batching delay (10ms)",
          details:
            "Wait time for additional messages to fill batch. Balance between latency and throughput. 0 for lowest latency.",
          importance: "medium",
        },
        {
          key: "compression.type",
          value: "snappy",
          description: "Compression algorithm",
          details:
            "snappy: Fast compression, good for high throughput. gzip: Better compression ratio. lz4: Balance of speed and ratio.",
          importance: "medium",
        },
      ],
    },
  },
  {
    id: 33,
    title: "Delivery Guarantees Deep Dive",
    module: 3,
    section: "Producers",
    content: {
      type: "text",
      points: [
        "At-most-once: acks=0, retries=0 - Fast but may lose messages",
        "At-least-once: acks=all, retries>0 - No loss but possible duplicates",
        "Exactly-once: enable.idempotence=true + transactional.id - No loss, no duplicates",
        "Choose based on use case: Payments need exactly-once, logs may use at-least-once",
      ],
      animation: "slide",
    },
  },
  {
    id: 34,
    title: "Serialization Strategies",
    module: 3,
    section: "Producers",
    content: {
      type: "code",
      code: `# Advanced serialization with Schema Registry

from confluent_kafka import SerializingProducer
from confluent_kafka.serialization import StringSerializer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer

# Schema Registry configuration
schema_registry_conf = {'url': 'https://schema-registry.confluent.cloud'}
schema_registry_client = SchemaRegistryClient(schema_registry_conf)

# Payment schema (Avro)
payment_schema = """
{
  "type": "record",
  "name": "Payment",
  "fields": [
    {"name": "customerId", "type": "string"},
    {"name": "amount", "type": {"type": "bytes", "logicalType": "decimal", "precision": 10, "scale": 2}},
    {"name": "currency", "type": "string"},
    {"name": "timestamp", "type": {"type": "long", "logicalType": "timestamp-millis"}},
    {"name": "merchantId", "type": "string"}
  ]
}
"""

# Configure producer with Avro serializer
producer_conf = {
    'bootstrap.servers': 'pkc-xxxxx.confluent.cloud:9092',
    'key.serializer': StringSerializer('utf_8'),
    'value.serializer': AvroSerializer(schema_registry_client, payment_schema),
    'acks': 'all',
    'enable.idempotence': True
}`,
      language: "python",
      highlightLines: [24, 25, 26],
      explanation: "Schema Registry ensures data compatibility and evolution",
    },
  },
  {
    id: 35,
    title: "Producer Performance Tuning",
    module: 3,
    section: "Producers",
    interactive: true,
    content: {
      type: "interactive",
      component: "ProducerPerformance",
      props: {
        configurations: [
          {
            name: "High Throughput",
            batchSize: 65536,
            lingerMs: 100,
            compression: "snappy",
          },
          {
            name: "Low Latency",
            batchSize: 1024,
            lingerMs: 0,
            compression: "none",
          },
          {
            name: "Balanced",
            batchSize: 16384,
            lingerMs: 10,
            compression: "lz4",
          },
        ],
        showBenchmarks: true,
      },
    },
  },
  {
    id: 36,
    title: "Error Handling & Callbacks",
    module: 3,
    section: "Producers",
    content: {
      type: "code",
      code: `# Robust error handling with callbacks

import logging
from confluent_kafka import Producer, KafkaError

logger = logging.getLogger(__name__)

def delivery_callback(err, msg):
    """Enhanced delivery callback with error handling"""
    if err is not None:
        logger.error(f'Message delivery failed: {err}')
        
        # Handle specific error types
        if err.code() == KafkaError._MSG_TIMED_OUT:
            logger.warning('Message timed out, check cluster health')
            # Implement retry logic or dead letter queue
        elif err.code() == KafkaError.UNKNOWN_TOPIC_OR_PART:
            logger.error('Topic does not exist, check configuration')
        
        # Send to DLQ for manual review
        send_to_dlq(msg.value(), err)
    else:
        logger.info(f'Message delivered to {msg.topic()}[{msg.partition()}] at offset {msg.offset()}')
        
        # Update metrics
        metrics.increment('messages.delivered')
        metrics.timing('delivery.latency', msg.latency())

def send_to_dlq(message, error):
    """Send failed messages to Dead Letter Queue"""
    dlq_producer.produce(
        topic='payment-requests-dlq',
        value=message,
        headers={'error': str(error), 'timestamp': str(time.time())}
    )`,
      language: "python",
      highlightLines: [9, 24, 29],
      explanation: "Production-grade error handling with DLQ and metrics",
    },
  },
  {
    id: 37,
    title: "Idempotence & Exactly-Once",
    module: 3,
    section: "Producers",
    content: {
      type: "text",
      points: [
        "Producer ID: Kafka assigns unique ID for exactly-once semantics",
        "Sequence numbers: Detect and reject duplicate messages automatically",
        "Epoch handling: Prevents zombie producers from corrupting data",
        "Performance impact: ~20% throughput reduction for strong guarantees",
      ],
      animation: "slide",
    },
  },
  {
    id: 38,
    title: "Producer Metrics & Monitoring",
    module: 3,
    section: "Producers",
    interactive: true,
    content: {
      type: "interactive",
      component: "ProducerMetrics",
      props: {
        metrics: [
          {
            name: "record-send-rate",
            value: "1247.3/sec",
            description: "Records sent per second",
          },
          {
            name: "request-latency-avg",
            value: "23.4ms",
            description: "Average request latency",
          },
          {
            name: "buffer-available-bytes",
            value: "28MB",
            description: "Available buffer memory",
          },
          {
            name: "batch-size-avg",
            value: "15.2KB",
            description: "Average batch size",
          },
          {
            name: "record-error-rate",
            value: "0.01%",
            description: "Error rate",
          },
          {
            name: "compression-rate-avg",
            value: "0.73",
            description: "Compression efficiency",
          },
        ],
      },
    },
  },
  {
    id: 39,
    title: "Best Practices Checklist",
    module: 3,
    section: "Producers",
    content: {
      type: "text",
      points: [
        "Connection pooling: Reuse producer instances across threads",
        "Graceful shutdown: Call close() with timeout to flush pending messages",
        "Circuit breaker: Fail fast when Kafka is unavailable",
        "Testing strategies: Use embedded Kafka for integration tests",
      ],
      animation: "slide",
    },
  },
  {
    id: 40,
    title: "Payment Gateway Design",
    module: 3,
    section: "Implementation",
    content: {
      type: "code",
      code: `# Payment Gateway with FastAPI and Kafka

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, validator
from confluent_kafka import Producer
import uuid
import asyncio

app = FastAPI(title="Payment Gateway")

class PaymentRequest(BaseModel):
    customer_id: str
    amount: float
    currency: str = "USD"
    merchant_id: str
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class PaymentGateway:
    def __init__(self):
        self.producer = Producer({
            'bootstrap.servers': 'pkc-xxxxx.confluent.cloud:9092',
            'acks': 'all',
            'enable.idempotence': True,
            'max.in.flight.requests.per.connection': 5,
            'retries': 2147483647,
            'delivery.timeout.ms': 120000
        })
    
    async def process_payment(self, payment: PaymentRequest):
        """Process payment with idempotency key"""
        idempotency_key = str(uuid.uuid4())
        
        message = {
            'payment_id': idempotency_key,
            'customer_id': payment.customer_id,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'merchant_id': payment.merchant_id,
            'timestamp': int(time.time() * 1000)
        }
        
        try:
            # Produce to Kafka
            self.producer.produce(
                topic='payment-requests',
                key=payment.customer_id,
                value=json.dumps(message),
                callback=self.delivery_callback,
                headers={'idempotency-key': idempotency_key}
            )
            
            # Don't wait for delivery in sync path
            return {'payment_id': idempotency_key, 'status': 'processing'}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))`,
      language: "python",
      highlightLines: [42, 45, 46],
      explanation: "Async payment processing with idempotency guarantees",
    },
  },
  {
    id: 41,
    title: "Async vs Sync Producer Patterns",
    module: 3,
    section: "Implementation",
    content: {
      type: "text",
      points: [
        "Async (fire-and-forget): Highest throughput, use for non-critical events",
        "Sync (wait for ack): Lowest throughput, use for critical financial data",
        "Async with callback: Balanced approach, handle errors without blocking",
        "Hybrid: Sync for payments, async for analytics events in same application",
      ],
      animation: "slide",
    },
  },
  {
    id: 42,
    title: "Producer Interceptors",
    module: 3,
    section: "Implementation",
    content: {
      type: "code",
      code: `# Custom producer interceptor for monitoring

from confluent_kafka import ProducerInterceptor
import time
import logging

class MetricsInterceptor(ProducerInterceptor):
    def __init__(self):
        self.sent_count = 0
        self.error_count = 0
        
    def on_send(self, record):
        """Called before sending message"""
        # Add correlation ID if missing
        if 'correlation-id' not in record.headers():
            record.set_header('correlation-id', str(uuid.uuid4()))
        
        # Add timestamp
        record.set_header('produced-at', str(int(time.time() * 1000)))
        
        # Track metrics
        self.sent_count += 1
        metrics.increment('producer.messages.sent')
        
        return record
    
    def on_acknowledgement(self, record_metadata, exception):
        """Called after ack/error"""
        if exception:
            self.error_count += 1
            metrics.increment('producer.messages.error')
            logger.error(f"Message failed: {exception}")
        else:
            metrics.timing('producer.latency', 
                          time.time() * 1000 - record_metadata.timestamp)`,
      language: "python",
      highlightLines: [15, 19, 27],
      explanation:
        "Interceptors add observability without changing business logic",
    },
  },
  {
    id: 43,
    title: "Multi-Topic Producers",
    module: 3,
    section: "Implementation",
    content: {
      type: "text",
      points: [
        "Topic routing: Use factory pattern to route messages by type",
        "Different schemas: Payment vs. analytics events need different serializers",
        "Error isolation: Topic-specific error handling and DLQ strategies",
        "Performance: Single producer instance can handle multiple topics efficiently",
      ],
      animation: "slide",
    },
  },
  {
    id: 44,
    title: "Spring Boot Integration",
    module: 3,
    section: "Implementation",
    content: {
      type: "code",
      code: `// Spring Boot Kafka Producer Configuration

@Configuration
@EnableKafka
public class KafkaProducerConfig {
    
    @Value("\${kafka.bootstrap-servers}")
    private String bootstrapServers;
    
    @Bean
    public ProducerFactory<String, PaymentEvent> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        
        // Production-ready settings
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        configProps.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
        configProps.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        
        return new DefaultKafkaProducerFactory<>(configProps);
    }
    
    @Bean
    public KafkaTemplate<String, PaymentEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}

@Service
public class PaymentService {
    
    @Autowired
    private KafkaTemplate<String, PaymentEvent> kafkaTemplate;
    
    @Async
    public CompletableFuture<SendResult<String, PaymentEvent>> sendPayment(PaymentEvent payment) {
        return kafkaTemplate.send("payment-requests", payment.getCustomerId(), payment)
            .addCallback(
                result -> log.info("Payment sent: {}", result),
                failure -> log.error("Payment failed: {}", failure)
            );
    }
}`,
      language: "java",
      highlightLines: [17, 18, 19],
      explanation: "Spring Boot configuration with production-ready defaults",
    },
  },
  {
    id: 45,
    title: "Lab 03 Preview",
    module: 3,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Build a Kafka producer in Python and Java Spring Boot",
        "Understand producer configuration options",
        "Send messages to Kafka topics",
        "Handle delivery callbacks and errors",
        "Implement basic error handling and retries",
      ],
      animation: "fade",
    },
  },
  {
    id: 46,
    title: "Lab 03 - Payment Gateway",
    module: 3,
    section: "Lab",
    content: {
      type: "lab",
      labNumber: "03",
      title: "Production Payment Gateway",
      tasks: [
        "Build a Kafka producer in Python and Java Spring Boot",
        "Understand producer configuration options",
        "Send messages to Kafka topics",
        "Handle delivery callbacks and errors",
        "Implement basic error handling and retries",
      ],
      expectedOutcome: [
        "Build a Kafka producer in Python and Java Spring Boot",
        "Understand producer configuration options",
        "Send messages to Kafka topics",
        "Handle delivery callbacks and errors",
        "Implement basic error handling and retries",
      ],
      hints: [
        "Use connection pooling and async patterns for high throughput",
        "Implement circuit breaker to handle Kafka downtime gracefully",
        "Add health checks for Kubernetes deployment readiness",
      ],
    },
  },
  {
    id: 47,
    title: "Implementation Steps",
    module: 3,
    section: "Lab",
    content: {
      type: "code",
      code: `# Lab 03 Implementation Guide

# Step 1: Setup FastAPI application
pip install fastapi confluent-kafka uvicorn prometheus-client

# Step 2: Configure producer for exactly-once
producer_config = {
    'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS'),
    'acks': 'all',
    'enable.idempotence': True,
    'max.in.flight.requests.per.connection': 5,
    'retries': 2147483647,
    'delivery.timeout.ms': 120000
}

# Step 3: Implement payment endpoint
@app.post("/payments")
async def create_payment(payment: PaymentRequest):
    # Validate and process payment
    return await payment_service.process(payment)

# Step 4: Add health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "kafka": await check_kafka_health()}

# Step 5: Run load test
k6 run --vus 100 --duration 60s payment-load-test.js`,
      language: "python",
      highlightLines: [9, 10, 11],
      runnable: true,
      explanation: "Step-by-step implementation with production configurations",
    },
  },
  {
    id: 48,
    title: "Testing the Gateway",
    module: 3,
    section: "Lab",
    interactive: true,
    content: {
      type: "interactive",
      component: "PaymentGatewayTester",
      props: {
        endpoints: [
          {
            method: "POST",
            path: "/payments",
            description: "Submit payment request",
          },
          { method: "GET", path: "/health", description: "Health check" },
          {
            method: "GET",
            path: "/metrics",
            description: "Prometheus metrics",
          },
        ],
        loadTestResults: {
          rps: 12847,
          latencyP95: "45ms",
          errorRate: "0.01%",
        },
      },
    },
  },
  {
    id: 49,
    title: "Java Alternative Implementation",
    module: 3,
    section: "Lab",
    content: {
      type: "code",
      code: `// Alternative: Spring Boot implementation

@RestController
@RequestMapping("/api/v1")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/payments")
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody PaymentRequest request) {
        try {
            PaymentResponse response = paymentService.processPayment(request);
            return ResponseEntity.accepted().body(response);
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> healthCheck() {
        HealthResponse health = paymentService.checkHealth();
        return ResponseEntity.ok(health);
    }
}

@Service
public class PaymentService {
    
    @Autowired
    private KafkaTemplate<String, PaymentEvent> kafkaTemplate;
    
    @Retryable(value = {KafkaException.class}, maxAttempts = 3)
    public PaymentResponse processPayment(PaymentRequest request) {
        PaymentEvent event = PaymentEvent.from(request);
        
        SendResult<String, PaymentEvent> result = kafkaTemplate
            .send("payment-requests", request.getCustomerId(), event)
            .get(5, TimeUnit.SECONDS);
            
        return PaymentResponse.builder()
            .paymentId(event.getPaymentId())
            .status("PROCESSING")
            .build();
    }
}`,
      language: "java",
      highlightLines: [11, 31, 35],
      explanation: "Spring Boot alternative with similar functionality",
    },
  },
  {
    id: 50,
    title: "Lab 03 Checkpoint",
    module: 3,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Build a Kafka producer in Python and Java Spring Boot",
        "Understand producer configuration options",
        "Send messages to Kafka topics",
        "Handle delivery callbacks and errors",
        "Implement basic error handling and retries",
      ],
      animation: "slide",
    },
  },

  // Module 4: Building Consumers (Slides 51-70)
  {
    id: 51,
    title: "Consumer Architecture Deep Dive",
    module: 4,
    section: "Consumers",
    interactive: true,
    content: {
      type: "interactive",
      component: "ConsumerGroupDemo",
      props: {
        groupId: "payment-validators",
        partitions: 6,
        consumers: 3,
        showRebalancing: true,
        showLag: true,
        detailed: true,
      },
    },
  },
  {
    id: 52,
    title: "Consumer Configuration Masterclass",
    module: 4,
    section: "Consumers",
    content: {
      type: "config",
      configs: [
        {
          key: "group.id",
          value: "payment-validator-v1",
          description: "Consumer group identifier",
          details:
            "Consumers with same group.id share partitions. Use versioning for schema changes. Each group tracks offsets independently.",
          importance: "high",
        },
        {
          key: "auto.offset.reset",
          value: "earliest",
          description: "Offset reset behavior for new groups",
          details:
            "earliest: Start from beginning. latest: Start from end. none: Throw exception. Choose based on data processing requirements.",
          importance: "high",
        },
        {
          key: "enable.auto.commit",
          value: "false",
          description: "Automatic offset commit",
          details:
            "false: Manual commit for exactly-once processing. true: Automatic commit every auto.commit.interval.ms for at-least-once.",
          importance: "high",
        },
        {
          key: "max.poll.records",
          value: "100",
          description: "Maximum records per poll",
          details:
            "Batch size for processing. Larger batches improve throughput but increase memory usage. Tune based on message processing time.",
          importance: "medium",
        },
        {
          key: "session.timeout.ms",
          value: "45000",
          description: "Session timeout (45 seconds)",
          details:
            "Time before consumer is considered dead. Longer timeout reduces rebalances but increases recovery time.",
          importance: "medium",
        },
        {
          key: "heartbeat.interval.ms",
          value: "15000",
          description: "Heartbeat frequency (15 seconds)",
          details:
            "Should be 1/3 of session.timeout.ms. Frequent heartbeats improve failure detection but increase network overhead.",
          importance: "medium",
        },
      ],
    },
  },
  {
    id: 53,
    title: "Poll Loop Pattern Deep Dive",
    module: 4,
    section: "Consumers",
    content: {
      type: "code",
      code: `# Production-ready consumer poll loop

from confluent_kafka import Consumer, KafkaError, TopicPartition
import logging
import signal
import sys

class PaymentValidator:
    def __init__(self, config):
        self.consumer = Consumer(config)
        self.running = True
        self.processed_count = 0
        
        # Graceful shutdown handler
        signal.signal(signal.SIGINT, self.shutdown_handler)
        signal.signal(signal.SIGTERM, self.shutdown_handler)
    
    def shutdown_handler(self, signum, frame):
        """Handle graceful shutdown"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False
    
    def consume_payments(self):
        """Main consumption loop with error handling"""
        try:
            self.consumer.subscribe(['payment-requests'])
            
            while self.running:
                # Poll with timeout
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.info(f'Reached end of partition {msg.partition()}')
                        continue
                    else:
                        logger.error(f'Consumer error: {msg.error()}')
                        break
                
                try:
                    # Process message
                    await self.process_payment(msg)
                    
                    # Manual commit for exactly-once processing
                    self.consumer.commit(msg)
                    self.processed_count += 1
                    
                    # Log progress every 1000 messages
                    if self.processed_count % 1000 == 0:
                        logger.info(f'Processed {self.processed_count} payments')
                        
                except Exception as e:
                    logger.error(f'Failed to process message: {e}')
                    # Send to DLQ or implement retry logic
                    await self.handle_processing_error(msg, e)
                    
        finally:
            logger.info('Closing consumer...')
            self.consumer.close()`,
      language: "python",
      highlightLines: [15, 16, 43, 45],
      explanation:
        "Production poll loop with graceful shutdown and error handling",
    },
  },
  {
    id: 54,
    title: "Offset Management Strategies",
    module: 4,
    section: "Consumers",
    content: {
      type: "text",
      points: [
        "Auto commit risks: May commit offsets before processing completes",
        "Manual commit after processing: Ensures exactly-once delivery semantics",
        "Batch commits: Improve performance but increase duplicate risk",
        "Offset storage: Kafka (__consumer_offsets), external store (database, Redis)",
      ],
      animation: "slide",
    },
  },
  {
    id: 55,
    title: "Consumer Group Coordination",
    module: 4,
    section: "Consumers",
    interactive: true,
    content: {
      type: "interactive",
      component: "ConsumerGroupCoordination",
      props: {
        showRebalancing: true,
        showPartitionAssignment: true,
        groupProtocol: "range",
        consumers: [
          { id: "consumer-1", partitions: [0, 1] },
          { id: "consumer-2", partitions: [2, 3] },
          { id: "consumer-3", partitions: [4, 5] },
        ],
      },
    },
  },
  {
    id: 56,
    title: "Error Handling Strategies",
    module: 4,
    section: "Consumers",
    content: {
      type: "code",
      code: `# Advanced error handling patterns

class ErrorHandler:
    def __init__(self, dlq_producer):
        self.dlq_producer = dlq_producer
        self.retry_attempts = {}
        
    async def handle_processing_error(self, message, error):
        """Multi-tier error handling"""
        message_key = f"{message.topic()}-{message.partition()}-{message.offset()}"
        
        # Track retry attempts
        attempts = self.retry_attempts.get(message_key, 0) + 1
        self.retry_attempts[message_key] = attempts
        
        if attempts <= 3:
            # Immediate retry for transient errors
            if isinstance(error, (ConnectionError, TimeoutError)):
                logger.warning(f"Retrying message (attempt {attempts}): {error}")
                await asyncio.sleep(2 ** attempts)  # Exponential backoff
                return await self.process_payment(message)
        
        # Send to DLQ after max retries
        dlq_message = {
            'original_topic': message.topic(),
            'original_partition': message.partition(),
            'original_offset': message.offset(),
            'error_message': str(error),
            'retry_attempts': attempts,
            'timestamp': int(time.time() * 1000),
            'payload': message.value()
        }
        
        await self.send_to_dlq(dlq_message)
        
        # Remove from retry tracking
        del self.retry_attempts[message_key]
        
    async def send_to_dlq(self, dlq_message):
        """Send to Dead Letter Queue"""
        self.dlq_producer.produce(
            topic='payment-requests-dlq',
            value=json.dumps(dlq_message),
            headers={'error-category': 'processing-failed'}
        )`,
      language: "python",
      highlightLines: [14, 18, 33],
      explanation: "Multi-tier error handling with exponential backoff and DLQ",
    },
  },
  {
    id: 57,
    title: "Consumer Metrics & Lag Monitoring",
    module: 4,
    section: "Consumers",
    interactive: true,
    content: {
      type: "interactive",
      component: "ConsumerMetrics",
      props: {
        metrics: [
          {
            name: "consumer-lag",
            value: "1,247",
            description: "Messages behind latest offset",
            status: "warning",
          },
          {
            name: "records-consumed-rate",
            value: "847.3/sec",
            description: "Messages processed per second",
            status: "healthy",
          },
          {
            name: "commit-latency-avg",
            value: "12.4ms",
            description: "Average commit latency",
            status: "healthy",
          },
          {
            name: "poll-idle-ratio-avg",
            value: "0.15",
            description: "Fraction of time idle",
            status: "healthy",
          },
          {
            name: "assigned-partitions",
            value: "2",
            description: "Currently assigned partitions",
            status: "healthy",
          },
          {
            name: "rebalance-rate",
            value: "0.02/hour",
            description: "Rebalances per hour",
            status: "healthy",
          },
        ],
        lagThreshold: 1000,
      },
    },
  },
  {
    id: 58,
    title: "At-Least-Once Processing",
    module: 4,
    section: "Consumers",
    content: {
      type: "text",
      points: [
        "Default behavior: Consumer may receive duplicate messages during rebalancing",
        "Duplicate handling: Use idempotency keys to detect and skip duplicates",
        "State management: Store processing state externally for recovery",
        "Performance trade-offs: Deduplication adds latency but ensures correctness",
      ],
      animation: "slide",
    },
  },
  {
    id: 59,
    title: "Consumer Best Practices",
    module: 4,
    section: "Consumers",
    content: {
      type: "text",
      points: [
        "Batch processing: Process multiple messages together for better throughput",
        "Async processing: Use async/await for I/O bound operations",
        "Error isolation: Don't let one bad message stop entire partition",
        "Monitoring: Track lag, throughput, and error rates continuously",
      ],
      animation: "slide",
    },
  },
  {
    id: 60,
    title: "Payment Validation Logic",
    module: 4,
    section: "Implementation",
    content: {
      type: "code",
      code: `# Payment validation service with business rules

from decimal import Decimal
import asyncio
import aiohttp

class PaymentValidator:
    def __init__(self, fraud_service, currency_service):
        self.fraud_service = fraud_service
        self.currency_service = currency_service
        
    async def validate_payment(self, payment_data):
        """Comprehensive payment validation"""
        validations = await asyncio.gather(
            self.validate_amount(payment_data),
            self.validate_currency(payment_data),
            self.validate_customer(payment_data),
            self.validate_merchant(payment_data),
            self.check_fraud_rules(payment_data),
            return_exceptions=True
        )
        
        # Collect validation errors
        errors = [v for v in validations if isinstance(v, Exception)]
        if errors:
            raise ValidationError(f"Payment validation failed: {errors}")
            
        return {
            'payment_id': payment_data['payment_id'],
            'status': 'VALIDATED',
            'validation_timestamp': int(time.time() * 1000)
        }
    
    async def validate_amount(self, payment):
        """Amount validation rules"""
        amount = Decimal(payment['amount'])
        
        if amount <= 0:
            raise ValidationError("Amount must be positive")
        if amount > Decimal('10000.00'):
            raise ValidationError("Amount exceeds daily limit")
        if len(str(amount).split('.')[-1]) > 2:
            raise ValidationError("Amount has too many decimal places")
            
    async def check_fraud_rules(self, payment):
        """ML-based fraud detection"""
        fraud_score = await self.fraud_service.get_score(payment)
        
        if fraud_score > 0.8:
            raise FraudError(f"High fraud risk: {fraud_score}")
        elif fraud_score > 0.5:
            # Manual review queue
            await self.send_for_review(payment, fraud_score)`,
      language: "python",
      highlightLines: [14, 15, 16, 17, 18],
      explanation:
        "Async validation with multiple business rules and fraud detection",
    },
  },
  {
    id: 61,
    title: "Spring Integration",
    module: 4,
    section: "Implementation",
    content: {
      type: "code",
      code: `// Spring Kafka Consumer Configuration

@Configuration
@EnableKafka
public class KafkaConsumerConfig {
    
    @Bean
    public ConsumerFactory<String, PaymentEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "payment-validators");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        
        // Production settings
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        
        return new DefaultKafkaConsumerFactory<>(props);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, PaymentEvent> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        
        // Error handling
        factory.setErrorHandler(new SeekToCurrentErrorHandler(
            new FixedBackOff(1000L, 3L))); // 3 retries with 1s delay
            
        return factory;
    }
}

@Component
public class PaymentEventListener {
    
    @KafkaListener(topics = "payment-requests", groupId = "payment-validators")
    public void handlePayment(@Payload PaymentEvent payment, Acknowledgment ack) {
        try {
            paymentValidator.validate(payment);
            
            // Send validated payment to next topic
            kafkaTemplate.send("payment-validated", payment.getCustomerId(), payment);
            
            // Manual acknowledgment
            ack.acknowledge();
            
        } catch (ValidationException e) {
            log.error("Payment validation failed: {}", e.getMessage());
            // Send to DLQ
            kafkaTemplate.send("payment-validation-dlq", payment);
        }
    }
}`,
      language: "java",
      highlightLines: [15, 16, 17, 45],
      explanation:
        "Spring Kafka listener with manual acknowledgment and error handling",
    },
  },
  {
    id: 62,
    title: "Consumer Scaling Strategies",
    module: 4,
    section: "Implementation",
    content: {
      type: "text",
      points: [
        "Partition limits: Cannot have more consumers than partitions in a group",
        "Threading models: Single-threaded per partition, multi-threaded processing",
        "Resource allocation: CPU-bound vs I/O-bound workload considerations",
        "Horizontal scaling: Add consumer instances, increase partition count",
      ],
      animation: "slide",
    },
  },
  {
    id: 63,
    title: "Graceful Shutdown Patterns",
    module: 4,
    section: "Implementation",
    content: {
      type: "code",
      code: `# Graceful consumer shutdown with cleanup

import signal
import atexit
from contextlib import asynccontextmanager

class GracefulConsumer:
    def __init__(self, consumer_config):
        self.consumer = Consumer(consumer_config)
        self.running = True
        self.shutdown_timeout = 30  # seconds
        
        # Register shutdown handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        atexit.register(self._cleanup)
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.running = False
        
    @asynccontextmanager
    async def managed_consumption(self):
        """Context manager for safe consumption"""
        try:
            self.consumer.subscribe(['payment-requests'])
            yield self
        finally:
            await self._graceful_shutdown()
    
    async def _graceful_shutdown(self):
        """Perform graceful shutdown with timeout"""
        logger.info("Starting graceful shutdown...")
        
        try:
            # Stop consuming new messages
            self.consumer.unsubscribe()
            
            # Wait for current processing to complete
            await asyncio.wait_for(
                self._wait_for_processing_completion(),
                timeout=self.shutdown_timeout
            )
            
        except asyncio.TimeoutError:
            logger.warning("Shutdown timeout reached, forcing closure")
        finally:
            # Close consumer connection
            self.consumer.close()
            logger.info("Consumer shutdown complete")
    
    async def _wait_for_processing_completion(self):
        """Wait for in-flight messages to complete"""
        while self.processing_count > 0:
            await asyncio.sleep(0.1)`,
      language: "python",
      highlightLines: [13, 14, 15, 26, 34],
      explanation:
        "Graceful shutdown ensuring no message loss during deployment",
    },
  },
  {
    id: 64,
    title: "Testing Strategies",
    module: 4,
    section: "Implementation",
    content: {
      type: "text",
      points: [
        "Unit tests: Mock consumer and test business logic in isolation",
        "Integration tests: Use Testcontainers for real Kafka interactions",
        "Contract testing: Verify message schema compatibility",
        "Load testing: Validate consumer performance under high load",
      ],
      animation: "slide",
    },
  },
  {
    id: 65,
    title: "Lab 04 Preview",
    module: 4,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Build a Kafka consumer",
        "Understand the consumer poll loop ",
        "Manage consumer offsets and error handling",
        "Deploy multiple consumer instances and observe rebalancing",
      ],
      animation: "fade",
    },
  },
  {
    id: 66,
    title: "Lab 04 - Validator Service",
    module: 4,
    section: "Lab",
    content: {
      type: "lab",
      labNumber: "04",
      title: "Payment Validator Service",
      tasks: [
        "Build payment validator with comprehensive business rules",
        "Implement manual offset management for exactly-once processing",
        "Add async fraud detection service integration",
        "Create dead letter queue handling for invalid payments",
        "Deploy multiple consumer instances (3 consumers, 6 partitions)",
        "Monitor consumer lag and rebalancing behavior",
        "Implement graceful shutdown for zero-downtime deployments",
      ],
      expectedOutcome: [
        "✓ Payment validator processing 5K+ messages/sec with <100ms latency",
        "✓ Zero duplicate processing with manual offset management",
        "✓ Fraud detection catching 95%+ suspicious transactions",
        "✓ Graceful scaling and rebalancing without message loss",
      ],
      hints: [
        "Use async/await for I/O bound operations like fraud API calls",
        "Implement circuit breaker for external service dependencies",
        "Monitor partition assignment changes during rebalancing",
      ],
    },
  },
  {
    id: 67,
    title: "Validation Rules Implementation",
    module: 4,
    section: "Lab",
    content: {
      type: "code",
      code: `# Comprehensive validation rules implementation

class PaymentRulesEngine:
    def __init__(self):
        self.rules = [
            AmountValidationRule(),
            CurrencyValidationRule(),
            CustomerValidationRule(),
            MerchantValidationRule(),
            FraudDetectionRule(),
            ComplianceRule()
        ]
    
    async def validate_payment(self, payment):
        """Run all validation rules"""
        results = []
        
        for rule in self.rules:
            try:
                result = await rule.validate(payment)
                results.append(result)
            except ValidationError as e:
                return ValidationResult(
                    valid=False,
                    error=str(e),
                    rule=rule.__class__.__name__
                )
        
        return ValidationResult(valid=True, results=results)
`,
      language: "python",
      highlightLines: [15, 16, 33, 35],
      explanation: "Modular validation rules with async fraud detection",
    },
  },
  {
    id: 68,
    title: "Running Multiple Consumers",
    module: 4,
    section: "Lab",
    interactive: true,
    content: {
      type: "interactive",
      component: "MultiConsumerDemo",
      props: {
        partitions: 6,
        consumers: [
          { id: "validator-1", partitions: [0, 1], status: "active", lag: 45 },
          { id: "validator-2", partitions: [2, 3], status: "active", lag: 12 },
          { id: "validator-3", partitions: [4, 5], status: "active", lag: 8 },
        ],
        showRebalancing: true,
        throughput: "4,847 msgs/sec",
      },
    },
  },
  {
    id: 69,
    title: "Error Scenarios & Handling",
    module: 4,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Invalid JSON: Deserializer errors handled with DLQ pattern",
        "Missing required fields: Validation errors with structured logging",
        "Business rule violations: Custom exceptions with retry logic",
        "External service failures: Circuit breaker with fallback processing",
      ],
      animation: "fade",
    },
  },
  {
    id: 70,
    title: "Lab 04 Checkpoint",
    module: 4,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Build a Kafka consumer",
        "Understand the consumer poll loop ",
        "Manage consumer offsets and error handling",
        "Deploy multiple consumer instances and observe rebalancing",
      ],
      animation: "slide",
    },
  },

  // Module 5: Partitioning & Ordering (Slides 71-90)
  {
    id: 71,
    title: "Why Partitioning Matters",
    module: 5,
    section: "Partitioning",
    interactive: true,
    content: {
      type: "interactive",
      component: "PartitioningDemo",
      props: {
        showLoadDistribution: true,
        showOrdering: true,
        interactive: true,
        scenarios: [
          "Round-robin distribution",
          "Key-based hashing",
          "Custom VIP partitioner",
        ],
      },
    },
  },
  {
    id: 72,
    title: "Default Partitioning Behavior",
    module: 5,
    section: "Partitioning",
    content: {
      type: "text",
      points: [
        "Round-robin (no key): Messages distributed evenly across partitions",
        "Hash-based (with key): hash(key) % partition_count ensures same key goes to same partition",
        "Sticky partitioning: Batch efficiency by using same partition until batch is full",
        "Performance impact: Key-based ensures ordering, round-robin maximizes throughput",
      ],
      animation: "slide",
    },
  },
  {
    id: 73,
    title: "Message Keys Strategy",
    module: 5,
    section: "Partitioning",
    content: {
      type: "code",
      code: `# Strategic message key design for payments

# Option 1: Customer-based partitioning
def get_customer_key(payment):
    """Group all customer payments in same partition"""
    return payment['customer_id']  # Ensures order per customer

# Option 2: Merchant-based partitioning  
def get_merchant_key(payment):
    """Group merchant payments for batch processing"""
    return payment['merchant_id']  # Useful for settlement

# Option 3: Composite key for better distribution
def get_composite_key(payment):
    """Balance ordering and distribution"""
    return f"{payment['customer_id']}#{payment['currency']}"

# Option 4: Time-based partitioning for analytics
def get_time_key(payment):
    """Group by time window for batch processing"""
    timestamp = payment['timestamp']
    # Partition by hour for time-series analytics
    hour = datetime.fromtimestamp(timestamp).strftime('%Y%m%d%H')
    return hour

# Producer usage with different strategies
def produce_payment(payment, strategy='customer'):
    key_generators = {
        'customer': get_customer_key,
        'merchant': get_merchant_key,
        'composite': get_composite_key,
        'time': get_time_key
    }
    
    key = key_generators[strategy](payment)
    
    producer.produce(
        topic='payment-requests',
        key=key,
        value=json.dumps(payment),
        callback=delivery_callback
    )`,
      language: "python",
      highlightLines: [4, 9, 14, 19, 33],
      explanation:
        "Different key strategies for different use cases and ordering requirements",
    },
  },
  {
    id: 74,
    title: "Custom Partitioners Deep Dive",
    module: 5,
    section: "Partitioning",
    content: {
      type: "text",
      points: [
        "Use cases: VIP customers, geographic routing, load balancing",
        "Implementation: Override partition() method in producer configuration",
        "Registration: Set partitioner.class in producer properties",
        "Testing: Validate distribution with production data patterns",
      ],
      animation: "slide",
    },
  },
  {
    id: 75,
    title: "VIP Customer Partitioner",
    module: 5,
    section: "Partitioning",
    content: {
      type: "code",
      code: `# Advanced VIP partitioner with load balancing

from confluent_kafka import Producer
import hashlib

class VIPPartitioner:
    """Custom partitioner for VIP customer priority processing"""
    
    def __init__(self, vip_partition_ratio=0.2):
        self.vip_partition_ratio = vip_partition_ratio
        
    def partition(self, key, all_partitions, available_partitions):
        """
        VIP customers get dedicated partitions for faster processing
        Regular customers distributed across remaining partitions
        """
        if not key:
            # No key - use round robin
            return None
            
        key_str = key.decode('utf-8') if isinstance(key, bytes) else str(key)
        
        # Calculate VIP partition count (20% of total)
        total_partitions = len(all_partitions)
        vip_partition_count = max(1, int(total_partitions * self.vip_partition_ratio))
        vip_partitions = list(range(vip_partition_count))
        regular_partitions = list(range(vip_partition_count, total_partitions))
        
        # Check if customer is VIP
        if self.is_vip_customer(key_str):
            # Route VIP customers to dedicated partitions
            hash_value = self._hash_key(key_str)
            return vip_partitions[hash_value % len(vip_partitions)]
        else:
            # Route regular customers to remaining partitions
            hash_value = self._hash_key(key_str)
            return regular_partitions[hash_value % len(regular_partitions)]
    
    def is_vip_customer(self, customer_key):
        """Check if customer is VIP (implement your logic)"""
        return (
            customer_key.startswith('VIP_') or 
            customer_key.startswith('PREMIUM_') or
            customer_key in self.get_vip_customer_list()
        )
    
    def _hash_key(self, key):
        """Consistent hashing for key distribution"""
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
    
    def get_vip_customer_list(self):
        """Get VIP customers from cache/database"""
        # In production, load from Redis or database
        return {'CUST_ENTERPRISE_001', 'CUST_PLATINUM_002'}

# Configure producer with custom partitioner
producer_config = {
    'bootstrap.servers': 'localhost:9092',
    'partitioner': VIPPartitioner(vip_partition_ratio=0.3),  # 30% for VIP
    'acks': 'all',
    'enable.idempotence': True
}

producer = Producer(producer_config)`,
      language: "python",
      highlightLines: [15, 26, 28, 32, 46],
      explanation:
        "Production VIP partitioner with configurable partition allocation",
    },
  },
  {
    id: 76,
    title: "Ordering Guarantees Deep Dive",
    module: 5,
    section: "Partitioning",
    interactive: true,
    content: {
      type: "interactive",
      component: "OrderingDemo",
      props: {
        scenarios: [
          {
            name: "Per-partition ordering",
            description: "Messages within same partition maintain order",
          },
          {
            name: "Global ordering anti-pattern",
            description: "Single partition = bottleneck",
          },
          {
            name: "Customer ordering",
            description: "Per-customer payment sequence",
          },
        ],
        showMessageFlow: true,
      },
    },
  },
  {
    id: 77,
    title: "Hot Partition Problem",
    module: 5,
    section: "Partitioning",
    content: {
      type: "text",
      points: [
        "Causes: Skewed keys, celebrity customers, time-based patterns",
        "Detection: Monitor partition throughput, consumer lag by partition",
        "Mitigation: Better key distribution, custom partitioners, partition scaling",
        "Key distribution: Aim for uniform distribution across partitions",
      ],
      animation: "slide",
    },
  },
  {
    id: 78,
    title: "Partition Strategies by Use Case",
    module: 5,
    section: "Partitioning",
    content: {
      type: "config",
      configs: [
        {
          key: "By Customer ID",
          value: "customer_12345",
          description: "All payments from same customer ordered",
          details:
            "Use for: Account balance calculation, customer analytics, fraud detection. Pros: Perfect ordering per customer. Cons: Hot partitions for high-volume customers.",
          importance: "high",
        },
        {
          key: "By Geographic Region",
          value: "region_us_west",
          description: "Route by customer location for latency",
          details:
            "Use for: Multi-region processing, compliance, local processing. Pros: Reduced latency. Cons: Uneven global distribution.",
          importance: "medium",
        },
        {
          key: "By Payment Priority",
          value: "priority_high",
          description: "Separate high/low priority payments",
          details:
            "Use for: SLA-differentiated processing, VIP customers. Pros: Guaranteed processing time. Cons: Complex partition management.",
          importance: "medium",
        },
        {
          key: "By Time Window",
          value: "2024011509",
          description: "Partition by hour for batch processing",
          details:
            "Use for: ETL pipelines, time-series analytics. Pros: Easy batch processing. Cons: Load imbalance during peak hours.",
          importance: "low",
        },
      ],
    },
  },
  {
    id: 79,
    title: "Monitoring Partition Distribution",
    module: 5,
    section: "Partitioning",
    interactive: true,
    content: {
      type: "interactive",
      component: "PartitionMonitoring",
      props: {
        partitions: [
          {
            id: 0,
            messageCount: 15847,
            throughput: "2.1K/sec",
            lag: 34,
            status: "healthy",
          },
          {
            id: 1,
            messageCount: 18234,
            throughput: "2.4K/sec",
            lag: 45,
            status: "healthy",
          },
          {
            id: 2,
            messageCount: 45123,
            throughput: "7.8K/sec",
            lag: 234,
            status: "warning",
          },
          {
            id: 3,
            messageCount: 16892,
            throughput: "2.2K/sec",
            lag: 12,
            status: "healthy",
          },
          {
            id: 4,
            messageCount: 17456,
            throughput: "2.3K/sec",
            lag: 28,
            status: "healthy",
          },
          {
            id: 5,
            messageCount: 14678,
            throughput: "1.9K/sec",
            lag: 67,
            status: "healthy",
          },
        ],
        alertThreshold: 5000,
      },
    },
  },
  {
    id: 80,
    title: "Consumer Ordering Patterns",
    module: 5,
    section: "Partitioning",
    content: {
      type: "code",
      code: `# Ordered processing patterns in consumers

class OrderedPaymentProcessor:
    """Ensure strict ordering within partition"""
    
    def __init__(self, consumer_config):
        self.consumer = Consumer(consumer_config)
        self.processing_state = {}  # Track per-partition state
        
    async def process_ordered_payments(self):
        """Single-threaded processing per partition for ordering"""
        while True:
            msg = self.consumer.poll(timeout=1.0)
            
            if msg is None:
                continue
                
            partition = msg.partition()
            
            # Process sequentially within partition
            await self.process_payment_in_order(msg, partition)
            
            # Commit after successful processing
            self.consumer.commit(msg)
    
    async def process_payment_in_order(self, message, partition):
        """Process maintaining order within partition"""
        customer_id = message.key()
        payment_data = json.loads(message.value())
        
        # Get customer's current state
        customer_state = self.processing_state.get(customer_id, {
            'balance': 0,
            'last_transaction_id': None,
            'sequence': 0
        })
        
        # Validate sequence (prevent out-of-order processing)
        expected_sequence = customer_state['sequence'] + 1
        if payment_data['sequence'] != expected_sequence:
            raise OrderingError(
                f"Expected sequence {expected_sequence}, got {payment_data['sequence']}"
            )
        
        # Process payment maintaining balance consistency
        if payment_data['type'] == 'CREDIT':
            customer_state['balance'] += payment_data['amount']
        elif payment_data['type'] == 'DEBIT':
            if customer_state['balance'] < payment_data['amount']:
                raise InsufficientFundsError("Insufficient balance")
            customer_state['balance'] -= payment_data['amount']
        
        # Update state
        customer_state['sequence'] = payment_data['sequence']
        customer_state['last_transaction_id'] = payment_data['payment_id']
        self.processing_state[customer_id] = customer_state
        
        logger.info(f"Processed payment {payment_data['payment_id']} for {customer_id}, "
                   f"new balance: {customer_state['balance']}")`,
      language: "python",
      highlightLines: [16, 17, 18, 31, 32, 33],
      explanation:
        "Sequential processing pattern maintaining state consistency per partition",
    },
  },
  {
    id: 81,
    title: "Key Design Best Practices",
    module: 5,
    section: "Partitioning",
    content: {
      type: "text",
      points: [
        "Cardinality considerations: Too few keys = hot partitions, too many = poor batching",
        "Composite keys: Combine multiple fields for better distribution",
        "Evolution strategy: Plan for key format changes and migration",
        "Documentation: Document key semantics for team understanding",
      ],
      animation: "slide",
    },
  },
  {
    id: 82,
    title: "Testing Partitioning Strategies",
    module: 5,
    section: "Partitioning",
    content: {
      type: "code",
      code: `# Comprehensive partitioning tests

import unittest
from collections import defaultdict
import matplotlib.pyplot as plt

class PartitioningTest(unittest.TestCase):
    
    def setUp(self):
        self.partitioner = VIPPartitioner(vip_partition_ratio=0.2)
        self.partition_count = 6
        
    def test_key_distribution(self):
        """Test key distribution across partitions"""
        partition_counts = defaultdict(int)
        
        # Generate test data
        test_keys = []
        for i in range(10000):
            if i % 10 == 0:  # 10% VIP customers
                test_keys.append(f"VIP_CUSTOMER_{i}")
            else:
                test_keys.append(f"CUSTOMER_{i}")
        
        # Test partitioning
        for key in test_keys:
            partition = self.partitioner.partition(
                key, 
                list(range(self.partition_count)), 
                list(range(self.partition_count))
            )
            partition_counts[partition] += 1
        
        # Analyze distribution
        self.analyze_distribution(partition_counts)
        
    def analyze_distribution(self, partition_counts):
        """Analyze and visualize partition distribution"""
        total_messages = sum(partition_counts.values())
        
        print("Partition Distribution Analysis:")
        print("-" * 40)
        
        for partition in range(self.partition_count):
            count = partition_counts[partition]
            percentage = (count / total_messages) * 100
            partition_type = "VIP" if partition < 2 else "Regular"
            
            print(f"Partition {partition} ({partition_type}): {count:,} messages ({percentage:.1f}%)")
            
            # Assert reasonable distribution
            if partition_type == "VIP":
                self.assertGreater(count, 0, "VIP partitions should have messages")
            else:
                # Regular partitions should be reasonably balanced
                expected = total_messages * 0.8 / 4  # 80% across 4 partitions
                self.assertLess(abs(count - expected) / expected, 0.3, 
                               f"Partition {partition} severely imbalanced")
    
    def test_vip_customer_routing(self):
        """Test VIP customers go to dedicated partitions"""
        vip_keys = ["VIP_CUSTOMER_001", "PREMIUM_CUSTOMER_002"]
        regular_keys = ["CUSTOMER_001", "CUSTOMER_002"]
        
        for key in vip_keys:
            partition = self.partitioner.partition(key, list(range(6)), list(range(6)))
            self.assertLess(partition, 2, f"VIP customer {key} should go to VIP partition")
            
        for key in regular_keys:
            partition = self.partitioner.partition(key, list(range(6)), list(range(6)))
            self.assertGreaterEqual(partition, 2, f"Regular customer {key} should go to regular partition")
    
    def test_load_balance_simulation(self):
        """Simulate production load patterns"""
        # Simulate hourly load patterns
        hourly_data = self.generate_hourly_load()
        
        for hour, customer_payments in hourly_data.items():
            partition_load = defaultdict(int)
            
            for customer_id, payment_count in customer_payments.items():
                partition = self.partitioner.partition(
                    customer_id, list(range(6)), list(range(6))
                )
                partition_load[partition] += payment_count
            
            # Check for hot partitions (>50% of load)
            total_load = sum(partition_load.values())
            for partition, load in partition_load.items():
                load_percentage = (load / total_load) * 100
                self.assertLess(load_percentage, 50, 
                               f"Hot partition detected: {partition} has {load_percentage:.1f}% of load")`,
      language: "python",
      highlightLines: [12, 13, 26, 27, 43, 69],
      explanation:
        "Comprehensive testing framework for partition distribution and load balancing",
    },
  },
  {
    id: 83,
    title: "Production Examples",
    module: 5,
    section: "Partitioning",
    content: {
      type: "text",
      points: [
        "E-commerce: Partition by customer_id for order processing and inventory",
        "IoT sensors: Partition by device_id for time-series data collection",
        "Application logs: Partition by service_name for distributed log aggregation",
        "Financial payments: Partition by merchant_id for settlement processing",
      ],
      animation: "slide",
    },
  },
  {
    id: 84,
    title: "Anti-Patterns to Avoid",
    module: 5,
    section: "Partitioning",
    content: {
      type: "text",
      points: [
        "Random keys: Breaks ordering guarantees and consumer state management",
        "Timestamp-only keys: Creates hot partitions during peak hours",
        "Too few unique keys: Results in partition skew and underutilization",
        "Changing key strategy: Breaks ordering and complicates migrations",
      ],
      animation: "slide",
    },
  },
  {
    id: 85,
    title: "Lab 05 Preview",
    module: 5,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Understand how Kafka uses keys for partitioning",
        "Implement custom partitioning strategies",
        "Ensure ordered message processing",
        "Observe partition distribution",
      ],
      animation: "fade",
    },
  },
  {
    id: 86,
    title: "Lab 05 - Advanced Partitioning",
    module: 5,
    section: "Lab",
    content: {
      type: "lab",
      labNumber: "05",
      title: "Advanced Partitioning Strategies",
      tasks: [
        "Understand how Kafka uses keys for partitioning",
        "Implement custom partitioning strategies",
        "Ensure ordered message processing",
        "Observe partition distribution",
      ],
      expectedOutcome: [
        "✓ VIP customers getting <50ms processing latency vs 200ms regular",
        "✓ Partition distribution within 20% variance across regular partitions",
        "✓ Ordered processing maintaining account balance consistency",
        "✓ Monitoring dashboards showing partition-level metrics",
      ],
      hints: [
        "Use customer transaction history to simulate realistic load patterns",
        "Implement partition rebalancing alerts for operations team",
        "Document customer onboarding process for VIP classification",
      ],
    },
  },
  {
    id: 87,
    title: "Implementation Tasks",
    module: 5,
    section: "Lab",
    content: {
      type: "code",
      code: `# Lab 05 Implementation Tasks

# Task 1: Enhanced VIP Partitioner
class ProductionVIPPartitioner(VIPPartitioner):
    def __init__(self, vip_ratio=0.3, config_file="vip_config.json"):
        super().__init__(vip_ratio)
        self.config = self.load_config(config_file)
        self.vip_cache = self.init_vip_cache()
    
    def load_config(self, config_file):
        """Load VIP configuration from file"""
        with open(config_file) as f:
            return json.load(f)
    
    def init_vip_cache(self):
        """Initialize VIP customer cache from database"""
        # In production: Redis or database lookup
        return set(self.config.get('vip_customers', []))

# Task 2: Partition Distribution Analyzer
class PartitionAnalyzer:
    def __init__(self, consumer_config):
        self.admin_client = AdminClient(consumer_config)
        
    def analyze_partition_distribution(self, topic_name):
        """Analyze current partition distribution"""
        metadata = self.admin_client.list_topics(topic_name)
        topic_metadata = metadata.topics[topic_name]
        
        partition_metrics = {}
        for partition in topic_metadata.partitions:
            metrics = self.get_partition_metrics(topic_name, partition.id)
            partition_metrics[partition.id] = metrics
            
        return self.calculate_distribution_stats(partition_metrics)

# Task 3: Ordered Account Balance Processor
class AccountBalanceProcessor:
    def __init__(self):
        self.account_balances = {}  # In production: use database
        
    async def process_transaction(self, transaction):
        """Process transaction maintaining balance consistency"""
        account_id = transaction['account_id']
        
        current_balance = self.account_balances.get(account_id, 0)
        
        if transaction['type'] == 'DEBIT':
            if current_balance < transaction['amount']:
                raise InsufficientFundsError()
            new_balance = current_balance - transaction['amount']
        else:
            new_balance = current_balance + transaction['amount']
            
        self.account_balances[account_id] = new_balance
        
        # Persist to database
        await self.update_account_balance(account_id, new_balance)`,
      language: "python",
      highlightLines: [3, 4, 20, 21, 41, 42],
      runnable: true,
      explanation:
        "Production-ready implementation with configuration and monitoring",
    },
  },
  {
    id: 88,
    title: "Testing Distribution",
    module: 5,
    section: "Lab",
    interactive: true,
    content: {
      type: "interactive",
      component: "PartitionTestResults",
      props: {
        testScenarios: [
          {
            name: "VIP Customer Load Test",
            vipPartitions: [0, 1],
            regularPartitions: [2, 3, 4, 5],
            vipThroughput: "2.1K/sec",
            regularThroughput: "1.8K/sec",
            skewFactor: 15,
          },
          {
            name: "Peak Hour Simulation",
            totalMessages: 100000,
            timeWindow: "1 hour",
            hotPartitions: [],
            averageLatency: "34ms",
          },
        ],
      },
    },
  },
  {
    id: 89,
    title: "Ordering Verification",
    module: 5,
    section: "Lab",
    content: {
      type: "text",
      points: [
        "Per-customer sequence validation: Check transaction sequences are consecutive",
        "Balance consistency: Verify account balances match transaction history",
        "Concurrent processing: Test ordering with multiple consumer instances",
        "Recovery testing: Verify ordering maintained after consumer restart",
      ],
      animation: "fade",
    },
  },
  {
    id: 90,
    title: "Day 1 Complete - Production Ready!",
    module: 5,
    section: "Wrap-up",
    content: {
      type: "title",
      mainTitle: "Congratulations! 🎉",
      subtitle: "",
      backgroundAnimation: true,
    },
  },
];

// Helper function to get slides by module
export const getSlidesByModule = (moduleNumber: number): Slide[] => {
  return slidesData.filter((slide) => slide.module === moduleNumber);
};

// Helper function to get total slide count
export const getTotalSlides = (): number => {
  return slidesData.length;
};

// Helper to get slide by ID
export const getSlideById = (id: number): Slide | undefined => {
  return slidesData.find((slide) => slide.id === id);
};
