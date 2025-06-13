# Lab 03: Building Your First Producer - Payment Gateway (Java Spring Boot)

## Learning Objectives

By the end of this lab, you will:
- Build a Kafka producer using Spring Boot and Spring Kafka
- Understand Spring Boot Kafka configuration
- Send messages to Kafka topics with proper callbacks
- Implement service layer architecture for payment processing
- Handle delivery callbacks and errors properly

## Prerequisites

- Java 17 or higher
- Maven 3.8 or higher
- Completed Labs 01 and 02
- Understanding of Kafka topics and partitions
- Basic Spring Boot knowledge

## Project Structure

```
java/
├── pom.xml
├── src/main/java/com/acme/kafka/
│   ├── config/
│   │   ├── KafkaConfig.java           # Kafka configuration
│   │   └── KafkaProperties.java       # Configuration properties
│   ├── model/
│   │   └── Payment.java               # Payment domain model
│   ├── service/
│   │   └── PaymentGatewayService.java # Business logic
│   ├── ProducerStarter.java           # Starter version (with TODOs)
│   ├── ProducerSolution.java          # Complete solution
│   └── PaymentGatewayApplication.java # Enhanced gateway
├── src/main/resources/
│   └── application.yml                # Configuration file
└── README-JAVA.md                     # This file
```

## Setup

### Step 1: Configure Environment Variables

Create a `.env` file in your project root or set environment variables:

```bash
# Confluent Cloud Configuration
export BOOTSTRAP_SERVERS=pkc-xxxxx.us-west-2.aws.confluent.cloud:9092
export SASL_USERNAME=your-api-key
export SASL_PASSWORD=your-api-secret
```

### Step 2: Build the Project

```bash
cd java
mvn clean compile
```

### Step 3: Review Configuration

Open `src/main/resources/application.yml` and verify the Kafka configuration:

```yaml
kafka:
  bootstrap-servers: ${BOOTSTRAP_SERVERS}
  security-protocol: SASL_SSL
  sasl-mechanism: PLAIN
  sasl-username: ${SASL_USERNAME}
  sasl-password: ${SASL_PASSWORD}
  
  producer:
    acks: all
    retries: 3
    linger-ms: 10
    compression-type: snappy
```

## Exercises

### Exercise 1: Complete the Producer Starter

Open `ProducerStarter.java` and complete the TODOs:

1. **TODO 1**: Implement message sending logic
2. **TODO 2**: Add proper callback handling
3. **TODO 3**: Implement flush to wait for delivery

**Key concepts to implement:**
- Convert Payment objects to JSON
- Use customer ID as message key for partitioning
- Handle delivery callbacks for success/failure
- Proper error handling and logging

### Exercise 2: Run the Starter Version

```bash
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ProducerStarter
```

Expected output:
- Messages being sent with delivery confirmations
- Payment details logged for each message
- Final statistics showing success rate

### Exercise 3: Compare with Solution

Run the complete solution:

```bash
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.ProducerSolution
```

Notice the differences:
- Better error handling
- Statistics tracking
- More detailed logging
- Proper timeout handling

### Exercise 4: Run the Enhanced Payment Gateway

```bash
mvn spring-boot:run -Dspring-boot.run.main-class=com.acme.kafka.PaymentGatewayApplication
```

This demonstrates:
- Service layer architecture
- Different payment types (standard, high-value, VIP)
- Business logic validation
- Professional logging and statistics

## Key Concepts

### Spring Boot Kafka Configuration

```java
@Configuration
@EnableConfigurationProperties(KafkaProperties.class)
public class KafkaConfig {
    
    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        // Configure connection and serialization
        return new DefaultKafkaProducerFactory<>(props);
    }
    
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

### Sending Messages with Callbacks

```java
CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
    topic, key, value
);

future.whenComplete((result, exception) -> {
    if (exception == null) {
        // Handle success
        logger.info("Message delivered to partition {} at offset {}", 
                   result.getRecordMetadata().partition(),
                   result.getRecordMetadata().offset());
    } else {
        // Handle failure
        logger.error("Message delivery failed: {}", exception.getMessage());
    }
});
```

### Service Layer Pattern

```java
@Service
public class PaymentGatewayService {
    
    public CompletableFuture<Void> processPayment(String customerId, Double amount) {
        // 1. Create payment object
        // 2. Validate business rules
        // 3. Send to Kafka
        // 4. Handle callbacks
    }
}
```

## Configuration Options

### Producer Settings

```yaml
kafka:
  producer:
    acks: all                    # Wait for all replicas
    retries: 3                   # Number of retries
    linger-ms: 10               # Batch delay
    batch-size: 16384           # Batch size in bytes
    compression-type: snappy    # Compression algorithm
    enable-idempotence: true    # Exactly-once semantics
```

### Application Settings

```yaml
app:
  topics:
    payment-requests: payment_requests
  producer:
    message-count: 10
    delay-between-messages: 100
```

## Verification

### Check Messages in Confluent Cloud

1. Go to your Confluent Cloud cluster
2. Navigate to Topics → payment_requests → Messages
3. You should see your payment messages with:
   - Customer IDs as keys
   - JSON payment data as values
   - Distributed across partitions

### Verify Message Format

Expected JSON structure:
```json
{
  "payment_id": "PAY0001",
  "customer_id": "CUST001",
  "amount": 150.0,
  "currency": "USD",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   ```
   Error: org.apache.kafka.common.errors.SaslAuthenticationException
   ```
   - Verify SASL_USERNAME and SASL_PASSWORD
   - Check bootstrap servers URL

2. **Serialization Errors**:
   ```
   Error: com.fasterxml.jackson.databind.JsonMappingException
   ```
   - Verify Payment model annotations
   - Check JSON structure

3. **Timeout Issues**:
   ```
   Error: org.apache.kafka.common.errors.TimeoutException
   ```
   - Increase flush timeout
   - Check network connectivity

### Debug Logging

Enable debug logging in `application.yml`:

```yaml
logging:
  level:
    com.acme.kafka: DEBUG
    org.springframework.kafka: DEBUG
```

## Best Practices Demonstrated

1. **Configuration Management**: Externalized configuration using Spring Boot properties
2. **Error Handling**: Proper exception handling and logging
3. **Callback Handling**: Asynchronous message delivery with callbacks
4. **Service Layer**: Separation of concerns with service classes
5. **Domain Modeling**: Clean Payment model with validation
6. **Statistics**: Tracking success/failure rates
7. **Resource Management**: Proper flushing and cleanup

## Next Steps

In the next lab, we'll build a consumer to process these payment messages, completing our first producer-consumer pipeline.

## Additional Resources

- [Spring Kafka Documentation](https://spring.io/projects/spring-kafka)
- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html)
- [Kafka Producer Best Practices](https://www.confluent.io/blog/kafka-producer-best-practices/)