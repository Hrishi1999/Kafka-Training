package com.acme.kafka;

import com.acme.kafka.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * SOLUTION VERSION - Complete Kafka Consumer Implementation
 * 
 * This demonstrates proper:
 * - Message processing with error handling
 * - JSON deserialization
 * - Payment validation with business rules
 * - Statistics tracking
 * - Graceful shutdown
 */
@SpringBootApplication
public class ConsumerSolution {

    private static final Logger logger = LoggerFactory.getLogger(ConsumerSolution.class);

    private final ObjectMapper objectMapper;
    private final AtomicInteger messageCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);
    private final AtomicInteger validPayments = new AtomicInteger(0);
    private final AtomicInteger invalidPayments = new AtomicInteger(0);

    public ConsumerSolution(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static void main(String[] args) {
        SpringApplication.run(ConsumerSolution.class, args);
        logger.info("🚀 Starting Payment Validator Consumer Solution");
        logger.info("=" + "=".repeat(50));
        logger.info("Waiting for messages... (Press Ctrl+C to stop)");
    }

    /**
     * Main Kafka listener method for processing payment messages
     */
    @KafkaListener(topics = "${app.topics.payment-requests}", groupId = "payment-validator")
    public void processPayment(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.RECEIVED_OFFSET) long offset) {
        
        try {
            // Increment message counter
            int currentCount = messageCount.incrementAndGet();
            
            // Log message metadata
            logger.info("\n📨 Message #{}", currentCount);
            logger.info("   Topic: {}", topic);
            logger.info("   Partition: {}", partition);
            logger.info("   Offset: {}", offset);
            logger.info("   Key: {}", key);
            
            // Deserialize JSON message to Payment object
            Payment payment = objectMapper.readValue(message, Payment.class);
            
            // Process the payment
            ValidationResult result = validatePayment(payment);
            
            // Log processing result and update counters
            if (result.isValid) {
                validPayments.incrementAndGet();
                logger.info("✅ Payment validation successful");
                if (result.warnings != null && !result.warnings.isEmpty()) {
                    logger.warn("   Warnings: {}", result.warnings);
                }
            } else {
                invalidPayments.incrementAndGet();
                logger.warn("⚠️ Payment validation failed: {}", result.reason);
            }
            
            logger.info("-" + "-".repeat(40));
            
        } catch (Exception e) {
            // Handle errors
            errorCount.incrementAndGet();
            logger.error("❌ Error processing message: {}", e.getMessage());
            logger.error("   Message content: {}", message);
            
            // In a real system, you might:
            // - Send to dead letter queue
            // - Retry with exponential backoff
            // - Alert monitoring systems
            // - Update payment status in database
        }
    }

    /**
     * Comprehensive payment validation logic
     */
    private ValidationResult validatePayment(Payment payment) {
        try {
            // Log payment details
            logger.info("💳 Processing Payment:");
            logger.info("   ID: {}", payment.getPaymentId());
            logger.info("   Customer: {}", payment.getCustomerId());
            logger.info("   Amount: {} {}", payment.getCurrency(), payment.getAmount());
            
            StringBuilder warnings = new StringBuilder();
            
            // Basic field validation
            if (payment.getAmount() == null || payment.getAmount() <= 0) {
                return ValidationResult.invalid("Invalid amount: " + payment.getAmount());
            }
            
            if (payment.getCustomerId() == null || payment.getCustomerId().trim().isEmpty()) {
                return ValidationResult.invalid("Invalid customer ID: " + payment.getCustomerId());
            }
            
            if (payment.getPaymentId() == null || payment.getPaymentId().trim().isEmpty()) {
                return ValidationResult.invalid("Invalid payment ID: " + payment.getPaymentId());
            }
            
            // Business rule validations
            
            // Check for high-value payments
            if (payment.isHighValue()) {
                logger.info("   💰 High value payment detected (>${:.2f})", payment.getAmount());
                warnings.append("High value payment requires additional verification. ");
                
                // Additional validation for high-value payments
                if (payment.getAmount() > 10000) {
                    logger.warn("   🚨 Extremely high value payment (>${:.2f})", payment.getAmount());
                    warnings.append("Extremely high value - manual review required. ");
                }
            }
            
            // Check for VIP customers
            if (payment.isVipCustomer()) {
                logger.info("   🌟 VIP customer payment - priority processing");
                warnings.append("VIP customer - expedited processing. ");
            }
            
            // Currency validation
            if (!"USD".equals(payment.getCurrency())) {
                logger.info("   🌍 Foreign currency payment: {}", payment.getCurrency());
                warnings.append("Foreign currency payment - verify exchange rates. ");
            }
            
            // Fraud detection simulation
            if (payment.getCustomerId().contains("FRAUD")) {
                return ValidationResult.invalid("Suspected fraudulent customer: " + payment.getCustomerId());
            }
            
            // Time-based validation
            if (payment.getTimestamp() != null) {
                long ageMinutes = (System.currentTimeMillis() - payment.getTimestamp().toEpochMilli()) / (1000 * 60);
                if (ageMinutes > 60) {
                    warnings.append(String.format("Payment is %d minutes old - check for delays. ", ageMinutes));
                }
            }
            
            // Return successful validation with any warnings
            String warningMessage = warnings.length() > 0 ? warnings.toString().trim() : null;
            return ValidationResult.valid(warningMessage);
            
        } catch (Exception e) {
            logger.error("❌ Error in payment validation: {}", e.getMessage());
            return ValidationResult.invalid("Validation error: " + e.getMessage());
        }
    }

    /**
     * Display statistics on shutdown
     */
    @PreDestroy
    public void displayStatistics() {
        int total = messageCount.get();
        int errors = errorCount.get();
        int processed = validPayments.get() + invalidPayments.get();
        double successRate = total > 0 ? ((total - errors) * 100.0 / total) : 0;
        double validationRate = processed > 0 ? (validPayments.get() * 100.0 / processed) : 0;

        logger.info("\n📊 Consumer Statistics:");
        logger.info("   Messages Received: {}", total);
        logger.info("   Processing Errors: {}", errors);
        logger.info("   Successfully Processed: {}", processed);
        logger.info("   Valid Payments: {}", validPayments.get());
        logger.info("   Invalid Payments: {}", invalidPayments.get());
        logger.info("   Processing Success Rate: {:.1f}%", successRate);
        logger.info("   Payment Validation Rate: {:.1f}%", validationRate);
        
        if (errors == 0 && invalidPayments.get() == 0) {
            logger.info("✅ All payments processed and validated successfully!");
        } else {
            logger.warn("⚠️ Issues detected - review logs for details");
        }
    }

    /**
     * Validation result helper class
     */
    private static class ValidationResult {
        final boolean isValid;
        final String reason;
        final String warnings;

        private ValidationResult(boolean isValid, String reason, String warnings) {
            this.isValid = isValid;
            this.reason = reason;
            this.warnings = warnings;
        }

        static ValidationResult valid(String warnings) {
            return new ValidationResult(true, null, warnings);
        }

        static ValidationResult invalid(String reason) {
            return new ValidationResult(false, reason, null);
        }
    }
}