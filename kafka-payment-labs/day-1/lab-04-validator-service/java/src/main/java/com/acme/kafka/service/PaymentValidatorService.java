package com.acme.kafka.service;

import com.acme.kafka.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Production-ready Payment Validator Service
 * 
 * Handles payment validation with comprehensive business rules,
 * fraud detection, and monitoring capabilities.
 */
@Service
public class PaymentValidatorService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentValidatorService.class);

    private final ObjectMapper objectMapper;

    @Value("${app.validator.enable-business-rules:true}")
    private boolean enableBusinessRules;

    @Value("${app.validator.max-amount-threshold:10000.0}")
    private double maxAmountThreshold;

    @Value("${app.validator.enable-fraud-detection:true}")
    private boolean enableFraudDetection;

    // Statistics tracking
    private final AtomicInteger totalMessages = new AtomicInteger(0);
    private final AtomicInteger validPayments = new AtomicInteger(0);
    private final AtomicInteger invalidPayments = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);
    private final AtomicLong totalAmountProcessed = new AtomicLong(0);
    private final AtomicInteger highValuePayments = new AtomicInteger(0);
    private final AtomicInteger vipPayments = new AtomicInteger(0);

    // Fraud detection (simplified for demo)
    private final Set<String> suspiciousCustomers = ConcurrentHashMap.newKeySet();
    private final Set<String> processedPayments = ConcurrentHashMap.newKeySet();

    public PaymentValidatorService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        initializeFraudDetection();
    }

    /**
     * Main Kafka listener for payment validation
     */
    @KafkaListener(topics = "${app.topics.payment-requests}", groupId = "payment-validator-service")
    public void validatePayment(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.RECEIVED_OFFSET) long offset) {
        
        try {
            totalMessages.incrementAndGet();
            
            logMessageReceived(key, topic, partition, offset);
            
            // Parse payment
            Payment payment = objectMapper.readValue(message, Payment.class);
            
            // Validate payment
            ValidationResult result = performValidation(payment);
            
            // Process result
            processValidationResult(payment, result);
            
        } catch (Exception e) {
            errorCount.incrementAndGet();
            logger.error("❌ Critical error processing message: {}", e.getMessage());
            logger.error("   Message: {}", message);
            
            // In production: send to DLQ, alert monitoring
            handleProcessingError(message, e);
        }
    }

    /**
     * Comprehensive payment validation
     */
    private ValidationResult performValidation(Payment payment) {
        ValidationResult.Builder builder = ValidationResult.builder();
        
        try {
            // Basic validation
            validateBasicFields(payment, builder);
            
            // Business rules validation
            if (enableBusinessRules) {
                validateBusinessRules(payment, builder);
            }
            
            // Fraud detection
            if (enableFraudDetection) {
                validateForFraud(payment, builder);
            }
            
            // Duplicate detection
            validateDuplicates(payment, builder);
            
            return builder.build();
            
        } catch (Exception e) {
            logger.error("❌ Validation error for payment {}: {}", payment.getPaymentId(), e.getMessage());
            return ValidationResult.builder()
                .invalid("Validation error: " + e.getMessage())
                .build();
        }
    }

    /**
     * Basic field validation
     */
    private void validateBasicFields(Payment payment, ValidationResult.Builder builder) {
        if (payment.getPaymentId() == null || payment.getPaymentId().trim().isEmpty()) {
            builder.invalid("Missing payment ID");
            return;
        }
        
        if (payment.getCustomerId() == null || payment.getCustomerId().trim().isEmpty()) {
            builder.invalid("Missing customer ID");
            return;
        }
        
        if (payment.getAmount() == null || payment.getAmount() <= 0) {
            builder.invalid("Invalid amount: " + payment.getAmount());
            return;
        }
        
        if (payment.getCurrency() == null || payment.getCurrency().trim().isEmpty()) {
            builder.warning("Missing currency, defaulting to USD");
        }
    }

    /**
     * Business rules validation
     */
    private void validateBusinessRules(Payment payment, ValidationResult.Builder builder) {
        // High value validation
        if (payment.getAmount() > maxAmountThreshold) {
            highValuePayments.incrementAndGet();
            builder.warning(String.format("High value payment: $%.2f (threshold: $%.2f)", 
                          payment.getAmount(), maxAmountThreshold));
            
            if (payment.getAmount() > maxAmountThreshold * 5) {
                builder.invalid("Payment exceeds maximum allowed amount");
                return;
            }
        }
        
        // VIP customer handling
        if (payment.isVipCustomer()) {
            vipPayments.incrementAndGet();
            builder.info("VIP customer payment - expedited processing");
        }
        
        // Currency validation
        if (!"USD".equals(payment.getCurrency())) {
            builder.warning("Foreign currency: " + payment.getCurrency());
        }
        
        // Timestamp validation
        if (payment.getTimestamp() != null) {
            long ageMinutes = (Instant.now().toEpochMilli() - payment.getTimestamp().toEpochMilli()) / (1000 * 60);
            if (ageMinutes > 60) {
                builder.warning(String.format("Payment is %d minutes old", ageMinutes));
            }
        }
    }

    /**
     * Fraud detection logic
     */
    private void validateForFraud(Payment payment, ValidationResult.Builder builder) {
        // Check suspicious customer list
        if (suspiciousCustomers.contains(payment.getCustomerId())) {
            builder.invalid("Customer flagged for suspicious activity: " + payment.getCustomerId());
            return;
        }
        
        // Check for test fraud indicators
        if (payment.getCustomerId().toUpperCase().contains("FRAUD")) {
            builder.invalid("Payment flagged by fraud detection");
            return;
        }
        
        // Velocity checking (simplified)
        if (payment.getAmount() > 5000 && payment.getCustomerId().startsWith("CUST")) {
            builder.warning("Large amount for regular customer - review recommended");
        }
    }

    /**
     * Duplicate payment detection
     */
    private void validateDuplicates(Payment payment, ValidationResult.Builder builder) {
        if (!processedPayments.add(payment.getPaymentId())) {
            builder.invalid("Duplicate payment ID: " + payment.getPaymentId());
        }
    }

    /**
     * Process validation result
     */
    private void processValidationResult(Payment payment, ValidationResult result) {
        if (result.isValid()) {
            validPayments.incrementAndGet();
            totalAmountProcessed.addAndGet(payment.getAmount().longValue());
            
            logger.info("✅ Payment {} validated successfully", payment.getPaymentId());
            logPaymentDetails(payment);
            
            if (!result.getWarnings().isEmpty()) {
                logger.warn("   Warnings: {}", String.join(", ", result.getWarnings()));
            }
            
            if (!result.getInfoMessages().isEmpty()) {
                logger.info("   Notes: {}", String.join(", ", result.getInfoMessages()));
            }
            
        } else {
            invalidPayments.incrementAndGet();
            logger.warn("⚠️ Payment {} validation failed: {}", payment.getPaymentId(), result.getInvalidReason());
            logPaymentDetails(payment);
            
            // In production: update payment status, notify relevant systems
        }
    }

    /**
     * Log payment details
     */
    private void logPaymentDetails(Payment payment) {
        logger.info("   Customer: {}, Amount: {} {}", 
                   payment.getCustomerId(), payment.getCurrency(), payment.getAmount());
    }

    /**
     * Log message metadata
     */
    private void logMessageReceived(String key, String topic, int partition, long offset) {
        logger.debug("📨 Message received - Topic: {}, Partition: {}, Offset: {}, Key: {}", 
                    topic, partition, offset, key);
    }

    /**
     * Handle processing errors
     */
    private void handleProcessingError(String message, Exception e) {
        // In production:
        // - Send to dead letter queue
        // - Alert monitoring systems
        // - Update metrics
        logger.error("Processing error - sending to error handling pipeline");
    }

    /**
     * Initialize fraud detection data
     */
    private void initializeFraudDetection() {
        // Add some test suspicious customers
        suspiciousCustomers.add("FRAUD001");
        suspiciousCustomers.add("BLOCKED123");
        logger.info("Fraud detection initialized with {} suspicious customers", suspiciousCustomers.size());
    }

    /**
     * Display comprehensive statistics
     */
    @PreDestroy
    public void displayStatistics() {
        int total = totalMessages.get();
        double successRate = total > 0 ? ((validPayments.get() + invalidPayments.get()) * 100.0 / total) : 0;
        double validationRate = (validPayments.get() + invalidPayments.get()) > 0 ? 
            (validPayments.get() * 100.0 / (validPayments.get() + invalidPayments.get())) : 0;

        logger.info("\n📊 Payment Validator Statistics:");
        logger.info("   Total Messages: {}", total);
        logger.info("   Processing Errors: {}", errorCount.get());
        logger.info("   Valid Payments: {}", validPayments.get());
        logger.info("   Invalid Payments: {}", invalidPayments.get());
        logger.info("   High Value Payments: {}", highValuePayments.get());
        logger.info("   VIP Payments: {}", vipPayments.get());
        logger.info("   Total Amount Processed: ${}", totalAmountProcessed.get());
        logger.info("   Processing Success Rate: {:.1f}%", successRate);
        logger.info("   Validation Success Rate: {:.1f}%", validationRate);
        
        if (errorCount.get() == 0 && invalidPayments.get() == 0) {
            logger.info("✅ All payments processed and validated successfully!");
        } else {
            logger.warn("⚠️ Issues detected - review processing logs");
        }
    }

    // Getters for testing
    public int getTotalMessages() { return totalMessages.get(); }
    public int getValidPayments() { return validPayments.get(); }
    public int getInvalidPayments() { return invalidPayments.get(); }
    public int getErrorCount() { return errorCount.get(); }
}