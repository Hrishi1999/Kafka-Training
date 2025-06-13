# Common Java Components for Kafka Payment Labs

This directory contains shared Java components used across all Spring Boot Kafka labs.

## Components

### Configuration
- **KafkaConfig.java**: Spring Boot Kafka configuration with producer and consumer factories
- **KafkaProperties.java**: Configuration properties mapping to application.yml
- **application.yml**: Template configuration file

### Model
- **Payment.java**: Payment domain model with validation annotations

### Utilities
- **PaymentGenerator.java**: Utility for generating test payment data

## Setup

### Prerequisites
- Java 17 or higher
- Maven 3.8 or higher
- Spring Boot 3.2.x

### Dependencies
The common components depend on:
- Spring Boot Starter
- Spring Kafka
- Confluent Kafka Client
- Jackson JSON processing
- Jakarta Validation

### Using in Labs

1. **Copy the pom.xml** to your lab directory and customize as needed
2. **Copy application.yml** to your lab's `src/main/resources/` directory
3. **Configure environment variables**:
   ```bash
   export BOOTSTRAP_SERVERS=your-confluent-cloud-bootstrap-servers
   export SASL_USERNAME=your-api-key
   export SASL_PASSWORD=your-api-secret
   export SCHEMA_REGISTRY_URL=your-schema-registry-url
   export SCHEMA_REGISTRY_API_KEY=your-sr-api-key
   export SCHEMA_REGISTRY_API_SECRET=your-sr-api-secret
   ```

### Environment Setup

Create a `.env` file in your project root or set environment variables:

```bash
# Confluent Cloud Configuration
BOOTSTRAP_SERVERS=pkc-xxxxx.us-west-2.aws.confluent.cloud:9092
SASL_USERNAME=your-api-key
SASL_PASSWORD=your-api-secret

# Schema Registry (for Avro labs)
SCHEMA_REGISTRY_URL=https://psrc-xxxxx.us-west-2.aws.confluent.cloud
SCHEMA_REGISTRY_API_KEY=your-sr-key
SCHEMA_REGISTRY_API_SECRET=your-sr-secret

# Consumer Group
CONSUMER_GROUP_ID=payment-processor
```

## Building and Running

### Build
```bash
mvn clean compile
```

### Run Tests
```bash
mvn test
```

### Package
```bash
mvn clean package
```

### Run Application
```bash
mvn spring-boot:run
```

## Configuration Examples

### Producer Configuration
```yaml
kafka:
  producer:
    acks: all              # Wait for all replicas
    retries: 3             # Retry on failure
    linger-ms: 10          # Batch delay
    batch-size: 16384      # Batch size in bytes
    compression-type: snappy
    enable-idempotence: true
```

### Consumer Configuration
```yaml
kafka:
  consumer:
    group-id: payment-processor
    auto-offset-reset: earliest
    enable-auto-commit: true
    max-poll-records: 500
    concurrency: 1
```

## Best Practices

1. **Use Configuration Properties**: All Kafka settings are externalized in application.yml
2. **Environment-Specific Config**: Use environment variables for secrets
3. **Validation**: Payment model includes validation annotations
4. **Logging**: Structured logging with appropriate levels
5. **Error Handling**: Proper exception handling in all components

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify bootstrap servers URL
   - Check SASL credentials
   - Ensure security protocol is SASL_SSL

2. **Serialization Errors**:
   - Verify JSON structure matches Payment model
   - Check Jackson configuration

3. **Consumer Group Issues**:
   - Ensure unique group IDs for different applications
   - Check offset management configuration

### Debugging

Enable debug logging:
```yaml
logging:
  level:
    com.acme.kafka: DEBUG
    org.springframework.kafka: DEBUG
```

## Lab Integration

Each lab will:
1. Include this common JAR as a dependency OR copy these files
2. Extend the base configuration for specific needs
3. Use Payment model and PaymentGenerator for consistent data
4. Follow Spring Boot conventions and patterns established here