package com.acme.kafka;

import com.acme.kafka.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * STARTER VERSION - Basic Kafka Consumer
 * 
 * Students need to complete the TODOs to implement:
 * 1. Message processing logic
 * 2. JSON deserialization
 * 3. Payment validation
 * 4. Error handling
 */
@SpringBootApplication
public class ConsumerStarter {

    private static final Logger logger = LoggerFactory.getLogger(ConsumerStarter.class);

    private final ObjectMapper objectMapper;
    private final AtomicInteger messageCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);

    public ConsumerStarter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static void main(String[] args) {
        SpringApplication.run(ConsumerStarter.class, args);
        logger.info("🚀 Starting Payment Validator Consumer Starter");
        logger.info("=" + "=".repeat(50));
        logger.info("Waiting for messages... (Press Ctrl+C to stop)");
    }

    /**
     * TODO: Complete the Kafka listener method
     * 
     * This method should:
     * 1. Receive messages from the payment_requests topic
     * 2. Deserialize JSON to Payment objects
     * 3. Validate the payment
     * 4. Handle errors properly
     * 5. Track statistics
     */
    @KafkaListener(topics = "${app.topics.payment-requests}", groupId = "payment-validator")
    public void processPayment(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.RECEIVED_OFFSET) long offset) {
        
        try {
            // TODO 1: Increment message counter
            int currentCount = messageCount.incrementAndGet();
            
            // TODO 2: Log message metadata
            logger.info("\n📨 Message #{}", currentCount);
            logger.info("   Topic: {}", topic);
            logger.info("   Partition: {}", partition);
            logger.info("   Offset: {}", offset);
            logger.info("   Key: {}", key);
            
            // TODO 3: Deserialize JSON message to Payment object
            // Hint: Use objectMapper.readValue(message, Payment.class)
            Payment payment = objectMapper.readValue(message, Payment.class);
            
            // TODO 4: Process the payment
            // Hint: Call processPaymentLogic(payment) method below
            boolean isValid = processPaymentLogic(payment);
            
            // TODO 5: Log processing result
            if (isValid) {
                logger.info("✅ Payment validation successful");
            } else {
                logger.warn("⚠️ Payment validation failed");
            }
            
            logger.info("-" + "-".repeat(40));
            
        } catch (Exception e) {
            // TODO 6: Handle errors
            errorCount.incrementAndGet();
            logger.error("❌ Error processing message: {}", e.getMessage());
            logger.error("   Message content: {}", message);
            
            // In a real system, you might:
            // - Send to dead letter queue
            // - Retry with exponential backoff
            // - Alert monitoring systems
        }
    }

    /**
     * TODO: Implement payment processing logic
     * 
     * This method should validate the payment and return true/false
     */
    private boolean processPaymentLogic(Payment payment) {
        try {
            // TODO 7: Log payment details
            logger.info("💳 Processing Payment:");
            logger.info("   ID: {}", payment.getPaymentId());
            logger.info("   Customer: {}", payment.getCustomerId());
            logger.info("   Amount: {} {}", payment.getCurrency(), payment.getAmount());
            
            // TODO 8: Add basic validation rules
            // Example validations:
            // - Amount should be positive
            // - Customer ID should not be null/empty
            // - Payment ID should not be null/empty
            
            if (payment.getAmount() == null || payment.getAmount() <= 0) {
                logger.warn("   Invalid amount: {}", payment.getAmount());
                return false;
            }
            
            if (payment.getCustomerId() == null || payment.getCustomerId().trim().isEmpty()) {
                logger.warn("   Invalid customer ID: {}", payment.getCustomerId());
                return false;
            }
            
            if (payment.getPaymentId() == null || payment.getPaymentId().trim().isEmpty()) {
                logger.warn("   Invalid payment ID: {}", payment.getPaymentId());
                return false;
            }
            
            // TODO 9: Add business rule validations
            // Example: Check if high-value payment
            if (payment.isHighValue()) {
                logger.info("   💰 High value payment detected");
                // Additional validation for high-value payments
            }
            
            // TODO 10: Check for VIP customers
            if (payment.isVipCustomer()) {
                logger.info("   🌟 VIP customer payment");
                // Special handling for VIP customers
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("❌ Error in payment validation: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Display statistics (called periodically or on shutdown)
     */
    public void displayStatistics() {
        int total = messageCount.get();
        int errors = errorCount.get();
        int successful = total - errors;
        double successRate = total > 0 ? (successful * 100.0 / total) : 0;

        logger.info("\n📊 Consumer Statistics:");
        logger.info("   Messages Processed: {}", total);
        logger.info("   Successful: {}", successful);
        logger.info("   Errors: {}", errors);
        logger.info("   Success Rate: {:.1f}%", successRate);
    }
}