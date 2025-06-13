package com.acme.kafka.service;

import com.acme.kafka.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Payment Gateway Service
 * 
 * Business logic for processing payments and sending them to Kafka
 */
@Service
public class PaymentGatewayService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentGatewayService.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.topics.payment-requests}")
    private String paymentTopic;

    // Statistics tracking
    private final AtomicInteger totalPayments = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);
    private final AtomicLong totalAmount = new AtomicLong(0);

    public PaymentGatewayService(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Process a payment request
     */
    public CompletableFuture<Void> processPayment(String customerId, Double amount, String paymentMethod) {
        return processPayment(customerId, amount, paymentMethod, null);
    }

    /**
     * Process a payment request with merchant ID
     */
    public CompletableFuture<Void> processPayment(String customerId, Double amount, 
                                                String paymentMethod, String merchantId) {
        try {
            // Create payment
            Payment payment = createPayment(customerId, amount, paymentMethod, merchantId);
            
            // Validate payment
            validatePayment(payment);
            
            // Send to Kafka
            return sendPaymentToKafka(payment);
            
        } catch (Exception e) {
            logger.error("❌ Failed to process payment for customer {}: {}", customerId, e.getMessage());
            errorCount.incrementAndGet();
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Create a payment object
     */
    private Payment createPayment(String customerId, Double amount, String paymentMethod, String merchantId) {
        Payment payment = new Payment();
        payment.setPaymentId(generatePaymentId());
        payment.setCustomerId(customerId);
        payment.setAmount(amount);
        payment.setCurrency("USD");
        
        // Set optional fields
        if (paymentMethod != null) {
            // For this simple lab, we'll store payment method in a simple way
            // In a real system, this would be a proper enum or separate field
            logger.info("Payment method: {}", paymentMethod);
        }
        
        totalPayments.incrementAndGet();
        totalAmount.addAndGet(amount.longValue());
        
        return payment;
    }

    /**
     * Validate payment business rules
     */
    private void validatePayment(Payment payment) {
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        
        if (payment.getAmount() > 50000) {
            logger.warn("⚠️ High value payment detected: ${} for customer {}", 
                       payment.getAmount(), payment.getCustomerId());
        }
        
        if (payment.getCustomerId().startsWith("VIP")) {
            logger.info("🌟 VIP customer payment: {}", payment.getCustomerId());
        }
    }

    /**
     * Send payment to Kafka
     */
    private CompletableFuture<Void> sendPaymentToKafka(Payment payment) {
        try {
            // Convert to JSON
            String messageValue = objectMapper.writeValueAsString(payment);
            
            // Send to Kafka with customer ID as key for partitioning
            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                paymentTopic,
                payment.getCustomerId(),
                messageValue
            );
            
            // Handle the result
            return future.handle((result, exception) -> {
                if (exception == null) {
                    handleSuccessfulDelivery(payment, result);
                    successCount.incrementAndGet();
                } else {
                    handleFailedDelivery(payment, exception);
                    errorCount.incrementAndGet();
                }
                return null;
            });
            
        } catch (Exception e) {
            logger.error("❌ Failed to serialize payment {}: {}", payment.getPaymentId(), e.getMessage());
            errorCount.incrementAndGet();
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Handle successful message delivery
     */
    private void handleSuccessfulDelivery(Payment payment, SendResult<String, String> result) {
        logger.info("✅ Payment {} delivered to partition {} at offset {}", 
                   payment.getPaymentId(),
                   result.getRecordMetadata().partition(),
                   result.getRecordMetadata().offset());
        
        logger.info("   Customer: {}, Amount: ${:.2f}", 
                   payment.getCustomerId(), payment.getAmount());
    }

    /**
     * Handle failed message delivery
     */
    private void handleFailedDelivery(Payment payment, Throwable exception) {
        logger.error("❌ Failed to deliver payment {} for customer {}: {}", 
                    payment.getPaymentId(), payment.getCustomerId(), exception.getMessage());
        
        // In a real system, you might:
        // - Store in a dead letter queue
        // - Retry with exponential backoff
        // - Alert monitoring systems
        // - Update payment status to failed
    }

    /**
     * Generate unique payment ID
     */
    private String generatePaymentId() {
        return "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    /**
     * Flush all pending messages
     */
    public void flush() {
        logger.info("\n⏳ Flushing pending messages...");
        kafkaTemplate.flush(Duration.ofSeconds(30));
    }

    /**
     * Display payment processing statistics
     */
    public void displayStatistics() {
        double successRate = totalPayments.get() > 0 ? 
            (successCount.get() * 100.0 / totalPayments.get()) : 0;

        logger.info("\n📊 Payment Gateway Statistics:");
        logger.info("   Total Payments Processed: {}", totalPayments.get());
        logger.info("   Successful Deliveries: {}", successCount.get());
        logger.info("   Failed Deliveries: {}", errorCount.get());
        logger.info("   Success Rate: {:.1f}%", successRate);
        logger.info("   Total Amount Processed: ${}", totalAmount.get());
        
        if (errorCount.get() == 0) {
            logger.info("✅ All payments processed successfully!");
        } else {
            logger.warn("⚠️ {} payment(s) failed processing", errorCount.get());
        }
    }

    // Getters for testing
    public int getTotalPayments() { return totalPayments.get(); }
    public int getSuccessCount() { return successCount.get(); }
    public int getErrorCount() { return errorCount.get(); }
    public long getTotalAmount() { return totalAmount.get(); }
}