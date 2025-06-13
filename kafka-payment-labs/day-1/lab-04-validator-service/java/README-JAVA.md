# Lab 04: Building Your First Consumer - Payment Validator Service (Java Spring Boot)

## Learning Objectives

By the end of this lab, you will:
- Build a Kafka consumer using Spring Boot and Spring Kafka
- Understand `@KafkaListener` annotation and message processing
- Implement comprehensive payment validation logic
- Handle JSON deserialization and error scenarios
- Track processing statistics and monitor performance
- Use service layer architecture for business logic

## Prerequisites

- Java 17 or higher
- Maven 3.8 or higher
- Completed Lab 03 (Producer)
- Understanding of Spring Boot and dependency injection

## Project Structure

```
java/
├── pom.xml
├── src/main/java/com/acme/kafka/
│   ├── config/
│   │   ├── KafkaConfig.java           # Kafka consumer configuration
│   │   └── KafkaProperties.java       # Configuration properties
│   ├── model/
│   │   └── Payment.java               # Payment domain model
│   ├── service/
│   │   ├── PaymentValidatorService.java # Business logic
│   │   └── ValidationResult.java      # Validation result container
│   ├── ConsumerStarter.java           # Starter version (with TODOs)
│   ├── ConsumerSolution.java          # Complete solution
│   └── PaymentValidatorApplication.java # Production-ready service
├── src/main/resources/
│   └── application.yml                # Configuration file
└── README-JAVA.md                     # This file
```

## Setup

### Step 1: Configure Environment Variables

Ensure your environment variables are set (same as Lab 03):

```bash
export BOOTSTRAP_SERVERS=pkc-xxxxx.us-west-2.aws.confluent.cloud:9092
export SASL_USERNAME=your-api-key
export SASL_PASSWORD=your-api-secret
```

### Step 2: Build the Project

```bash
cd java
mvn clean compile
```

### Step 3: Review Consumer Configuration

Open `src/main/resources/application.yml` and verify the consumer configuration:

```yaml
kafka:
  consumer:
    group-id: payment-validator
    auto-offset-reset: earliest
    enable-auto-commit: true
    max-poll-records: 500
    session-timeout-ms: 10000
```

## Exercises

### Exercise 1: Complete the Consumer Starter

Open `ConsumerStarter.java` and complete the TODOs:

1. **TODO 1-6**: Implement message processing in the `@KafkaListener` method
2. **TODO 7-10**: Implement payment validation logic

**Key concepts to implement:**
- Deserialize JSON to Payment objects using ObjectMapper
- Extract message metadata (topic, partition, offset)
- Implement validation rules (amount > 0, non-null fields)
- Handle processing errors gracefully
- Track statistics

### Exercise 2: Run the Starter Version

First, make sure you have messages in the topic (run Lab 03 producer if needed):

```bash
# Terminal 1: Run the producer to generate messages
cd ../lab-03-payment-gateway/java
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ProducerSolution

# Terminal 2: Run the consumer starter
cd ../lab-04-validator-service/java
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ConsumerStarter
```

Expected output:
- Messages being consumed from `payment_requests` topic
- Payment details being logged and validated
- Statistics showing processed messages

### Exercise 3: Compare with Solution

Run the complete solution:

```bash
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ConsumerSolution
```

Notice the improvements:
- More comprehensive validation rules
- Better error handling and logging
- Detailed statistics tracking
- Graceful shutdown with @PreDestroy

### Exercise 4: Run the Production-Ready Service

```bash
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.PaymentValidatorApplication
```

This demonstrates:
- Service layer architecture with separated concerns
- Advanced validation rules (fraud detection, business rules)
- Duplicate payment detection
- Comprehensive monitoring and statistics

## Key Concepts

### Spring Kafka Consumer Configuration

```java
@Configuration
@EnableConfigurationProperties(KafkaProperties.class)
public class KafkaConfig {
    
    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        // Configure connection and deserialization
        return new DefaultKafkaConsumerFactory<>(props);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> 
           kafkaListenerContainerFactory() {
        // Configure listener container
        return factory;
    }
}
```

### Kafka Listener Method

```java
@KafkaListener(topics = "payment_requests", groupId = "payment-validator")
public void processPayment(
        @Payload String message,
        @Header(KafkaHeaders.RECEIVED_KEY) String key,
        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.RECEIVED_OFFSET) long offset) {
    
    // Process the message
    Payment payment = objectMapper.readValue(message, Payment.class);
    validatePayment(payment);
}
```

### Service Layer Pattern

```java
@Service
public class PaymentValidatorService {
    
    @KafkaListener(topics = "${app.topics.payment-requests}")
    public void validatePayment(@Payload String message) {
        // 1. Deserialize message
        // 2. Apply validation rules
        // 3. Track statistics
        // 4. Handle errors
    }
}
```

## Configuration Options

### Consumer Settings

```yaml
kafka:
  consumer:
    group-id: payment-validator      # Consumer group ID
    auto-offset-reset: earliest      # Start from beginning
    enable-auto-commit: true         # Auto-commit offsets
    max-poll-records: 500           # Max records per poll
    session-timeout-ms: 10000       # Session timeout
    heartbeat-interval-ms: 3000     # Heartbeat frequency
    concurrency: 1                  # Number of consumer threads
```

### Validation Settings

```yaml
app:
  validator:
    enable-business-rules: true
    max-amount-threshold: 10000.0
    enable-fraud-detection: true
```

## Testing the Consumer

### Test with Different Message Types

1. **Valid Payments**: Standard payments that pass validation
2. **High-Value Payments**: Amounts > $1000 (should trigger warnings)
3. **VIP Customers**: Customer IDs starting with "VIP"
4. **Invalid Payments**: Missing fields or negative amounts
5. **Duplicate Payments**: Same payment ID sent twice

### Manual Testing

You can send test messages using the producer from Lab 03:

```bash
# Send various payment types
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.PaymentGatewayApplication
```

### Consumer Groups

Try running multiple consumer instances:

```bash
# Terminal 1
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ConsumerSolution

# Terminal 2 (different group ID in application.yml)
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ConsumerSolution
```

Observe how messages are distributed across consumers.

## Validation Rules Implemented

### Basic Validation
- Non-null payment ID, customer ID, amount
- Positive payment amounts
- Valid currency codes

### Business Rules
- High-value payment detection (>$1000)
- VIP customer identification
- Foreign currency handling
- Payment age validation

### Fraud Detection (Simulated)
- Suspicious customer checking
- Velocity checking for large amounts
- Blacklist validation
- Duplicate payment detection

## Error Handling Strategies

### Processing Errors
- Log error details with message content
- Track error statistics
- Continue processing other messages
- In production: send to Dead Letter Queue

### Validation Failures
- Log validation failure reasons
- Track invalid payment statistics
- Update payment status
- Alert monitoring systems

### JSON Deserialization Errors
- Handle malformed JSON gracefully
- Log problematic messages
- Skip invalid messages
- Alert on high error rates

## Monitoring and Observability

### Statistics Tracked
- Total messages processed
- Valid vs invalid payments
- High-value payment count
- VIP payment count
- Processing error rate
- Total amount processed

### Logging Levels
```yaml
logging:
  level:
    com.acme.kafka: INFO          # Application logs
    org.springframework.kafka: INFO   # Spring Kafka logs
    org.apache.kafka: WARN       # Kafka client logs
```

### Health Checks
The application includes basic health monitoring that can be extended for production use.

## Troubleshooting

### Common Issues

1. **No Messages Received**:
   - Verify producer is running and sending messages
   - Check topic name matches configuration
   - Verify consumer group ID is unique

2. **Deserialization Errors**:
   ```
   Error: com.fasterxml.jackson.databind.JsonMappingException
   ```
   - Check JSON format matches Payment model
   - Verify Jackson configuration

3. **Connection Issues**:
   ```
   Error: org.apache.kafka.common.errors.SaslAuthenticationException
   ```
   - Verify SASL credentials
   - Check bootstrap servers configuration

4. **Consumer Lag**:
   - Monitor in Confluent Cloud Console
   - Check processing time per message
   - Consider increasing concurrency

### Debug Logging

Enable debug logging:
```yaml
logging:
  level:
    com.acme.kafka: DEBUG
    org.springframework.kafka: DEBUG
```

## Best Practices Demonstrated

1. **Separation of Concerns**: Service layer handles business logic
2. **Error Handling**: Comprehensive error handling without stopping consumption
3. **Validation**: Multi-layered validation with clear result structure
4. **Monitoring**: Statistics tracking and graceful shutdown reporting
5. **Configuration**: Externalized configuration for flexibility
6. **Logging**: Structured logging with appropriate levels
7. **Testing**: Easy to test service methods independently

## Next Steps

In the next lab, we'll explore custom partitioning strategies to optimize message distribution and processing patterns.

## Additional Resources

- [Spring Kafka Documentation](https://docs.spring.io/spring-kafka/docs/current/reference/html/)
- [Kafka Consumer Configuration](https://kafka.apache.org/documentation/#consumerconfigs)
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)