package com.acme.kafka;

import com.acme.kafka.model.Payment;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * SOLUTION VERSION - Complete Kafka Producer Implementation
 * 
 * This is the complete solution showing proper:
 * - Message sending with keys
 * - Callback handling
 * - Error handling
 * - Statistics tracking
 */
@SpringBootApplication
public class ProducerSolution implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ProducerSolution.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.topics.payment-requests}")
    private String paymentTopic;

    @Value("${app.producer.message-count:10}")
    private int messageCount;

    @Value("${app.producer.delay-between-messages:100}")
    private long delayBetweenMessages;

    private final AtomicInteger successCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);

    public ProducerSolution(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public static void main(String[] args) {
        SpringApplication.run(ProducerSolution.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("🚀 Starting Kafka Producer Solution");
        logger.info("=" + "=".repeat(50));

        try {
            // Send messages to Kafka
            for (int i = 0; i < messageCount; i++) {
                // Create a payment message
                Payment payment = createPaymentMessage(i);
                
                // Convert payment to JSON string
                String messageValue = objectMapper.writeValueAsString(payment);
                
                // Send to Kafka with callback
                CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                    paymentTopic, 
                    payment.getCustomerId(),  // Use customer ID as message key for partitioning
                    messageValue
                );
                
                // Add callback to handle delivery result
                future.whenComplete((result, exception) -> {
                    if (exception == null) {
                        // Log successful delivery
                        successCount.incrementAndGet();
                        logger.info("✅ Message delivered to {} [partition {}] at offset {}", 
                                  result.getRecordMetadata().topic(),
                                  result.getRecordMetadata().partition(),
                                  result.getRecordMetadata().offset());
                        logger.info("   Payment ID: {}, Amount: ${}", 
                                  payment.getPaymentId(), payment.getAmount());
                    } else {
                        // Log delivery failure
                        errorCount.incrementAndGet();
                        logger.error("❌ Message delivery failed for Payment {}: {}", 
                                   payment.getPaymentId(), exception.getMessage());
                    }
                });

                // Small delay between messages to see them being sent
                Thread.sleep(delayBetweenMessages);
            }

            logger.info("\n📤 Initiated sending {} messages", messageCount);

            // Wait for all messages to be delivered
            logger.info("\n⏳ Waiting for message delivery...");
            kafkaTemplate.flush(Duration.ofSeconds(10));
            
            // Display final statistics
            displayStatistics();

        } catch (Exception e) {
            logger.error("❌ Error in producer: {}", e.getMessage(), e);
            System.exit(1);
        }
    }

    /**
     * Create a sample payment message
     */
    private Payment createPaymentMessage(int paymentIndex) {
        String paymentId = String.format("PAY%04d", paymentIndex);
        String customerId = String.format("CUST%03d", paymentIndex % 10);
        Double amount = 100.00 + (paymentIndex * 10);
        
        return new Payment(paymentId, customerId, amount);
    }

    /**
     * Display final statistics
     */
    private void displayStatistics() {
        int total = successCount.get() + errorCount.get();
        double successRate = total > 0 ? (successCount.get() * 100.0 / total) : 0;

        logger.info("\n📊 Producer Statistics:");
        logger.info("   Messages Sent: {}", messageCount);
        logger.info("   Successful Deliveries: {}", successCount.get());
        logger.info("   Failed Deliveries: {}", errorCount.get());
        logger.info("   Success Rate: {:.1f}%", successRate);
        
        if (successCount.get() == messageCount) {
            logger.info("✅ All messages delivered successfully!");
        } else {
            logger.warn("⚠️ Some messages failed to deliver. Check logs for details.");
        }
    }
}