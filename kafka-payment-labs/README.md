# Kafka Payment Processing Labs - 3-Day Training

## Overview

Welcome to the Kafka Payment Processing Labs! Over the next three days, you'll build a production-grade payment processing system using Apache Kafka, Python, and Confluent Cloud. Each lab builds upon the previous ones, culminating in a complete, scalable payment processing pipeline.

## What You'll Build

By the end of this training, you'll have built a multi-stage payment processing system that includes:

- REST API payment gateway
- Real-time payment validation
- Schema evolution with Avro
- Fraud detection pipeline
- Database integration with Kafka Connect
- Dead letter queue for error handling
- Infrastructure as Code with Terraform
- Production monitoring and alerting

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  REST API   │────▶│   Kafka     │────▶│  Validator   │
│  Gateway    │     │  payment_   │     │   Service    │
└─────────────┘     │  requests   │     └──────────────┘
                    └─────────────┘              │
                                                 ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Database   │◀────│   Kafka     │◀────│   Payment    │
│ (Postgres)  │     │ processed_  │     │  Processor   │
└─────────────┘     │  payments   │     └──────────────┘
                    └─────────────┘
```

## Prerequisites

Before starting, ensure you have:

1. **Confluent Cloud Account**: Sign up at https://confluent.cloud
2. **Python 3.8+**: Check with `python3 --version`
3. **Terraform**: Install from https://terraform.io
4. **Git**: For cloning the repository
5. **Code Editor**: VS Code, PyCharm, or similar
6. **Basic Knowledge**: Python programming and REST APIs

## Lab Structure

### Day 1: Foundations (Labs 1-5)
- **Lab 01**: Terraform Setup - Provision your Confluent Cloud infrastructure
- **Lab 02**: Explore Cluster - Navigate and understand your Kafka cluster
- **Lab 03**: Payment Gateway - Build your first Kafka producer
- **Lab 04**: Validator Service - Create a basic consumer
- **Lab 05**: Partitioning - Implement key-based message routing

### Day 2: Building Robust Services (Labs 6-10)
- **Lab 06**: Consumer Groups - Scale your consumers horizontally
- **Lab 07**: Offset Management - Handle failures gracefully
- **Lab 08**: Avro Schema - Implement data contracts
- **Lab 09**: Schema Evolution - Manage backward compatibility
- **Lab 10**: REST Proxy - Integrate non-Kafka applications

### Day 3: Production Patterns (Labs 11-15)
- **Lab 11**: Idempotent Producer - Prevent duplicate messages
- **Lab 12**: Dead Letter Queue - Handle processing failures
- **Lab 13**: Connect Source - Ingest external data
- **Lab 14**: Connect Sink - Export to databases
- **Lab 15**: Monitoring & Teardown - Observe and clean up

## Getting Started

1. **Clone this repository**:
   ```bash
   git clone <repository-url>
   cd kafka-payment-labs
   ```

2. **Set up Python environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Confluent Cloud credentials**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start with Lab 01**:
   ```bash
   cd day-1/lab-01-terraform-setup
   # Follow the README.md instructions
   ```

## Project Structure

```
kafka-payment-labs/
├── common/                 # Shared utilities and configurations
│   ├── config.py          # Configuration management
│   ├── schemas/           # Avro schema definitions
│   └── utils.py           # Helper functions
├── terraform/             # Infrastructure as Code
│   ├── main.tf           # Main Terraform configuration
│   ├── variables.tf      # Variable definitions
│   └── outputs.tf        # Output values
├── day-1/                 # Day 1 labs (Foundations)
├── day-2/                 # Day 2 labs (Robust Services)
├── day-3/                 # Day 3 labs (Production Patterns)
```

## Lab Guidelines

### For Each Lab:

1. **Read the README**: Each lab has detailed instructions
2. **Review starter code**: Understand the provided templates
3. **Complete TODOs**: Fill in the missing implementation
4. **Test your solution**: Run the provided test scripts
5. **Check the solution**: Compare with reference implementation